import axios from 'axios';
import { logger } from '../config/logger.js';

// ── In-memory cache for Overpass results ─────────────────────────────────────
const cache = new Map();          // key → { data, expiry }
const CACHE_TTL_MS = 15 * 60 * 1000; // 15 minutes

function cacheKey(lat, lon, radiusKm, tag) {
  // Round coords to ~1 km so nearby requests share a cache entry
  return `${tag}:${lat.toFixed(2)}:${lon.toFixed(2)}:${radiusKm}`;
}

function getCached(key) {
  const entry = cache.get(key);
  if (entry && Date.now() < entry.expiry) return entry.data;
  cache.delete(key);
  return null;
}

function setCache(key, data) {
  cache.set(key, { data, expiry: Date.now() + CACHE_TTL_MS });
  // Evict oldest entries when the cache grows too large
  if (cache.size > 200) {
    const oldest = cache.keys().next().value;
    cache.delete(oldest);
  }
}

// ── Retry with exponential back-off for 429 / 5xx ────────────────────────────
async function overpassRequest(query, retries = 3) {
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const response = await axios.post(
        'https://overpass-api.de/api/interpreter',
        query,
        { headers: { 'Content-Type': 'text/plain' }, timeout: 20000 }
      );
      return response;
    } catch (err) {
      const status = err.response?.status;
      const retryable = status === 429 || status === 503 || status === 504;
      if (retryable && attempt < retries) {
        const wait = Math.min(2000 * 2 ** attempt, 16000); // 2 s → 4 s → 8 s
        logger.warn('Overpass rate-limited / unavailable, retrying', { status, attempt: attempt + 1, waitMs: wait });
        await delay(wait);
      } else {
        throw err;
      }
    }
  }
}

export async function findNearbyResources(latitude, longitude, radiusKm = 10) {
  try {
    const radiusMeters = radiusKm * 1000;

    // Check cache first
    const ck = cacheKey(latitude, longitude, radiusKm, 'main');
    const cached = getCached(ck);
    if (cached) {
      logger.info('Returning cached nearby resources', { count: cached.length });
      return cached;
    }

    logger.info('Searching nearby resources', { latitude, longitude, radiusKm, radiusMeters });

    // Main query: all facility types
    const query = `
      [out:json][timeout:30];
      (
        node["amenity"="hospital"](around:${radiusMeters},${latitude},${longitude});
        node["amenity"="clinic"](around:${radiusMeters},${latitude},${longitude});
        node["amenity"="doctors"](around:${radiusMeters},${latitude},${longitude});
        node["healthcare"="hospital"](around:${radiusMeters},${latitude},${longitude});
        node["healthcare"="centre"](around:${radiusMeters},${latitude},${longitude});
        node["healthcare"="clinic"](around:${radiusMeters},${latitude},${longitude});
        node["healthcare"="psychotherapist"](around:${radiusMeters},${latitude},${longitude});
        node["healthcare"="counselling"](around:${radiusMeters},${latitude},${longitude});
        node["healthcare"="psychiatry"](around:${radiusMeters},${latitude},${longitude});
        node["amenity"="social_facility"]["social_facility"="mental_health"](around:${radiusMeters},${latitude},${longitude});
        way["amenity"="hospital"](around:${radiusMeters},${latitude},${longitude});
        way["amenity"="clinic"](around:${radiusMeters},${latitude},${longitude});
        way["amenity"="doctors"](around:${radiusMeters},${latitude},${longitude});
        way["healthcare"="hospital"](around:${radiusMeters},${latitude},${longitude});
        way["healthcare"="centre"](around:${radiusMeters},${latitude},${longitude});
        way["healthcare"="clinic"](around:${radiusMeters},${latitude},${longitude});
        relation["amenity"="hospital"](around:${radiusMeters},${latitude},${longitude});
        relation["healthcare"="hospital"](around:${radiusMeters},${latitude},${longitude});
      );
      out center;
    `;

    const response = await overpassRequest(query);

    const results = response.data.elements || [];
    logger.info('Overpass API raw results', { totalElements: results.length });

    let resources = parseAndCategorize(results, latitude, longitude);

    // If no psychiatric hospital found, do a wider search specifically for psychiatric facilities
    const hasPsych = resources.some(r => r.category === 'psychiatric');
    if (!hasPsych) {
      logger.info('No psychiatric/wellness facilities in initial results, expanding search radius');
      const expandedPsych = await findPsychiatricFacilities(latitude, longitude, radiusKm);
      if (expandedPsych.length > 0) {
        resources = [...expandedPsych, ...resources];
      }
    }

    // Merge curated hospitals that are within range but missing from Overpass results
    resources = mergeKnownHospitals(resources, latitude, longitude, radiusKm);

    // Final sort & limit — cap at 100km
    resources = resources
      .sort((a, b) => {
        const priorityOrder = { psychiatric: 0, wellness: 1, hospital: 2, clinic: 3 };
        const pA = priorityOrder[a.category] ?? 3;
        const pB = priorityOrder[b.category] ?? 3;
        if (pA !== pB) return pA - pB;
        return parseFloat(a.distance) - parseFloat(b.distance);
      })
      .filter(r => r.distance === null || parseFloat(r.distance) <= 100)
      .slice(0, 30);

    logger.info('Nearby resources found', {
      count: resources.length,
      withPhone: resources.filter(r => r.phone).length,
      psychiatric: resources.filter(r => r.category === 'psychiatric').length,
      wellness: resources.filter(r => r.category === 'wellness').length,
      hospital: resources.filter(r => r.category === 'hospital').length,
      clinic: resources.filter(r => r.category === 'clinic').length
    });

    // Cache final result
    setCache(ck, resources);

    return resources;
  } catch (error) {
    logger.error('Overpass API error', { error: error.message });
    // On failure, return curated fallback so the user still gets something
    return getKnownPsychiatricNearby(latitude, longitude);
  }
}

/**
 * Wider search specifically for psychiatric/mental health facilities.
 * Tries 100km, then 200km if nothing found. Falls back to curated list.
 */
async function findPsychiatricFacilities(latitude, longitude, initialRadiusKm) {
  const expandRadii = [100, 200]; // km to try

  for (const radiusKm of expandRadii) {
    if (radiusKm <= initialRadiusKm) continue;
    const radiusMeters = radiusKm * 1000;

    // Wait 2s between Overpass requests to avoid rate limiting
    await delay(2000);

    logger.info('Expanding psychiatric search', { radiusKm });

    const query = `
      [out:json][timeout:30];
      (
        node["healthcare"="psychiatry"](around:${radiusMeters},${latitude},${longitude});
        node["healthcare"="psychotherapist"](around:${radiusMeters},${latitude},${longitude});
        node["healthcare"="counselling"](around:${radiusMeters},${latitude},${longitude});
        node["amenity"="social_facility"]["social_facility"="mental_health"](around:${radiusMeters},${latitude},${longitude});
        way["healthcare"="psychiatry"](around:${radiusMeters},${latitude},${longitude});
        node["amenity"="hospital"]["name"~"[Pp]sychiatr|[Mm]ental|[Nn]europsych"](around:${radiusMeters},${latitude},${longitude});
        way["amenity"="hospital"]["name"~"[Pp]sychiatr|[Mm]ental|[Nn]europsych"](around:${radiusMeters},${latitude},${longitude});
        relation["amenity"="hospital"]["name"~"[Pp]sychiatr|[Mm]ental|[Nn]europsych"](around:${radiusMeters},${latitude},${longitude});
      );
      out center;
    `;

    try {
      const response = await overpassRequest(query, 2);

      const results = response.data.elements || [];
      const facilities = parseAndCategorize(results, latitude, longitude)
        .filter(r => r.category === 'psychiatric' || r.category === 'wellness');

      logger.info('Expanded psychiatric search results', { radiusKm, found: facilities.length });

      if (facilities.length > 0) {
        return facilities.slice(0, 5);
      }
    } catch (error) {
      logger.error('Expanded search error', { radiusKm, error: error.message });
      // If rate-limited, skip further expansion and go to fallback
      if (error.response?.status === 429) break;
    }
  }

  // Last resort: return nearest known Nigerian psychiatric facilities
  logger.info('Using curated Nigerian psychiatric facilities as fallback');
  return getKnownPsychiatricNearby(latitude, longitude);
}

const KNOWN_NIGERIAN_PSYCHIATRIC = [
  { name: 'Federal Neuropsychiatric Hospital, Aro, Abeokuta', latitude: 7.1475, longitude: 3.3486, phone: '+234-39-241893', address: 'Aro, Abeokuta, Ogun State' },
  { name: 'Federal Neuropsychiatric Hospital, Yaba', latitude: 6.5095, longitude: 3.3711, phone: '+234-1-7738343', address: 'Yaba, Lagos' },
  { name: 'Federal Neuropsychiatric Hospital, Kaduna', latitude: 10.5222, longitude: 7.4383, phone: '+234-62-242170', address: 'Barnawa, Kaduna' },
  { name: 'Federal Neuropsychiatric Hospital, Enugu', latitude: 6.4584, longitude: 7.5464, phone: '+234-42-256831', address: 'New Haven, Enugu' },
  { name: 'Federal Neuropsychiatric Hospital, Calabar', latitude: 4.9757, longitude: 8.3417, phone: '+234-87-232830', address: 'Calabar, Cross River State' },
  { name: 'Federal Neuropsychiatric Hospital, Benin', latitude: 6.3350, longitude: 5.6037, phone: '+234-52-252530', address: 'Uselu, Benin City, Edo State' },
  { name: 'Federal Neuropsychiatric Hospital, Maiduguri', latitude: 11.8311, longitude: 13.1510, phone: null, address: 'Maiduguri, Borno State' },
  { name: 'Federal Neuropsychiatric Hospital, Sokoto', latitude: 13.0059, longitude: 5.2476, phone: null, address: 'Sokoto, Sokoto State' },
];

// Curated list of major Nigerian teaching & specialist hospitals
// These are always merged into results when the user is within range
const KNOWN_NIGERIAN_HOSPITALS = [
  { name: 'Babcock University Teaching Hospital (BUTH)', latitude: 6.8970, longitude: 3.7140, phone: '+234-8035-067-509', address: 'Babcock University, Ilishan-Remo, Ogun State', category: 'hospital', website: null },
  { name: 'Lagos University Teaching Hospital (LUTH)', latitude: 6.5177, longitude: 3.3541, phone: '+234-1-7600190', address: 'Idi-Araba, Lagos', category: 'hospital', website: null },
  { name: 'University College Hospital (UCH), Ibadan', latitude: 7.4019, longitude: 3.9057, phone: '+234-2-2411763', address: 'Queen Elizabeth Rd, Ibadan, Oyo State', category: 'hospital', website: null },
  { name: 'National Hospital Abuja', latitude: 9.0134, longitude: 7.4918, phone: '+234-9-5239242', address: 'Plot 132, Central District, Abuja', category: 'hospital', website: null },
  { name: 'Obafemi Awolowo University Teaching Hospital (OAUTH), Ile-Ife', latitude: 7.4928, longitude: 4.5467, phone: '+234-36-230141', address: 'Ile-Ife, Osun State', category: 'hospital', website: null },
  { name: 'University of Benin Teaching Hospital (UBTH)', latitude: 6.3413, longitude: 5.6199, phone: '+234-52-600614', address: 'Benin City, Edo State', category: 'hospital', website: null },
  { name: 'Ahmadu Bello University Teaching Hospital, Zaria', latitude: 11.0801, longitude: 7.7069, phone: '+234-69-332681', address: 'Zaria, Kaduna State', category: 'hospital', website: null },
  { name: 'University of Ilorin Teaching Hospital (UITH)', latitude: 8.4799, longitude: 4.5418, phone: '+234-31-221325', address: 'Ilorin, Kwara State', category: 'hospital', website: null },
  { name: 'Jos University Teaching Hospital (JUTH)', latitude: 9.8965, longitude: 8.8583, phone: null, address: 'Jos, Plateau State', category: 'hospital', website: null },
  { name: 'University of Nigeria Teaching Hospital (UNTH), Enugu', latitude: 6.4350, longitude: 7.4950, phone: '+234-42-256031', address: 'Ituku-Ozalla, Enugu State', category: 'hospital', website: null },
];

function getKnownPsychiatricNearby(latitude, longitude) {
  return KNOWN_NIGERIAN_PSYCHIATRIC
    .map(f => ({
      ...f,
      category: 'psychiatric',
      type: 'hospital',
      website: null,
      distance: calculateDistance(latitude, longitude, f.latitude, f.longitude)
    }))
    .sort((a, b) => parseFloat(a.distance) - parseFloat(b.distance))
    .slice(0, 3); // Return the 3 closest known facilities
}

/**
 * Merge curated known hospitals into Overpass results.
 * Only adds hospitals that are within the effective radius (or 50km, whichever is larger)
 * and not already present in the results (matched by name similarity).
 */
function mergeKnownHospitals(resources, latitude, longitude, searchRadiusKm) {
  const effectiveRadius = Math.max(searchRadiusKm, 50); // At least 50km
  const existingNames = new Set(resources.map(r => r.name.toLowerCase()));

  const toAdd = KNOWN_NIGERIAN_HOSPITALS
    .map(h => ({
      name: h.name,
      category: h.category,
      type: 'hospital',
      address: h.address,
      phone: h.phone,
      website: h.website,
      latitude: h.latitude,
      longitude: h.longitude,
      distance: calculateDistance(latitude, longitude, h.latitude, h.longitude)
    }))
    .filter(h => {
      // Only include if within effective radius
      if (parseFloat(h.distance) > effectiveRadius) return false;
      // Skip if a similar name already exists in the results
      const nameLower = h.name.toLowerCase();
      for (const existing of existingNames) {
        if (existing.includes('babcock') && nameLower.includes('babcock')) return false;
        if (existing.includes(nameLower) || nameLower.includes(existing)) return false;
        // Check for substantial overlap
        const words = nameLower.split(/\s+/).filter(w => w.length > 3);
        const matchCount = words.filter(w => existing.includes(w)).length;
        if (matchCount >= 2) return false;
      }
      return true;
    });

  if (toAdd.length > 0) {
    logger.info('Merging curated hospitals into results', { count: toAdd.length, names: toAdd.map(h => h.name) });
  }

  return [...resources, ...toAdd];
}

function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Parse Overpass elements into categorized resource objects.
 * Handles node elements (lat/lon) and way/relation elements (center.lat/center.lon).
 */
function parseAndCategorize(elements, latitude, longitude) {
  return elements
    .filter(el => el.tags && (el.lat || el.center))
    .map(el => {
      const elLat = el.lat || el.center?.lat;
      const elLon = el.lon || el.center?.lon;
      return {
        name: el.tags.name || 'Unknown Facility',
        category: categorize(el.tags),
        type: el.tags.amenity === 'hospital' ? 'hospital' : 'professional',
        address: formatAddress(el.tags),
        phone: el.tags.phone || el.tags['contact:phone'] || null,
        website: el.tags.website || null,
        latitude: elLat,
        longitude: elLon,
        distance: calculateDistance(latitude, longitude, elLat, elLon)
      };
    });
}

/**
 * Categorize a facility based on its OSM tags.
 *  - psychiatric: psychiatry, mental health, neuropsychiatric
 *  - wellness: counselling, psychotherapist, social_facility
 *  - hospital: general hospitals
 *  - clinic: clinics, doctors, health centres
 */
function categorize(tags) {
  const name = (tags.name || '').toLowerCase();
  const healthcare = (tags.healthcare || '').toLowerCase();
  const amenity = (tags.amenity || '').toLowerCase();
  const specialty = (tags['healthcare:speciality'] || tags.speciality || '').toLowerCase();
  const socialFacility = (tags.social_facility || '').toLowerCase();

  // Psychiatric / neuropsychiatric
  if (
    healthcare === 'psychiatry' ||
    specialty.includes('psychiatr') ||
    name.includes('psychiatr') ||
    name.includes('neuropsych') ||
    name.includes('mental health') ||
    name.includes('mental-health') ||
    socialFacility === 'mental_health'
  ) {
    return 'psychiatric';
  }

  // Wellness / counselling / therapy
  if (
    healthcare === 'psychotherapist' ||
    healthcare === 'counselling' ||
    name.includes('counsel') ||
    name.includes('therap') ||
    name.includes('wellness') ||
    name.includes('rehab')
  ) {
    return 'wellness';
  }

  // Hospital
  if (amenity === 'hospital' || healthcare === 'hospital') {
    return 'hospital';
  }

  // Clinic / doctors / health centre
  return 'clinic';
}

export async function geocodeAddress(address) {
  try {
    const response = await axios.get('https://nominatim.openstreetmap.org/search', {
      params: { q: address, format: 'json', limit: 1 },
      headers: { 'User-Agent': 'Medi-Care/1.0' }
    });

    if (response.data && response.data.length > 0) {
      const result = response.data[0];
      return { latitude: parseFloat(result.lat), longitude: parseFloat(result.lon), displayName: result.display_name };
    }
    return null;
  } catch (error) {
    logger.error('Geocoding error', { error: error.message });
    return null;
  }
}

function formatAddress(tags) {
  const parts = [];
  if (tags['addr:housenumber']) parts.push(tags['addr:housenumber']);
  if (tags['addr:street']) parts.push(tags['addr:street']);
  if (tags['addr:city']) parts.push(tags['addr:city']);
  if (tags['addr:postcode']) parts.push(tags['addr:postcode']);
  return parts.join(', ') || 'Address not available';
}

function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return (R * c).toFixed(2);
}

export default { findNearbyResources, geocodeAddress };