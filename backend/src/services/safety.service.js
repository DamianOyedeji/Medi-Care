// backend/src/services/safety.service.js
import { logger } from '../config/logger.js';

const CRISIS_KEYWORDS = {
  critical: [
    'suicide', 'kill myself', 'end my life', 'want to die', 'better off dead',
    'no reason to live', 'goodbye world', 'going to kill', 'plan to die',
    'final message', 'take my life', 'not worth living', 'end it all',
    'overdose on', 'jump off', 'hang myself', 'shoot myself'
  ],
  high: [
    'self harm', 'cut myself', 'hurt myself', 'hate myself', 'worthless',
    'hopeless', "can't go on", 'give up', 'cutting', 'burning myself',
    'want to disappear', 'everyone would be better', 'burden to everyone'
  ],
  moderate: [
    'depressed', 'depression', 'anxiety', 'panic attack', 'scared', 'alone',
    'nobody cares', 'feel empty', 'numb', 'lost', 'meaningless',
    'no hope', 'cant sleep', 'crying every', 'breakdown'
  ]
};

export async function analyzeCrisisRisk(text) {
  logger.info('Analyzing crisis risk with keywords');

  const lowerText = text.toLowerCase();
  const detectedKeywords = [];
  let riskLevel = 'normal';
  let maxScore = 0;

  // Check critical keywords
  for (const keyword of CRISIS_KEYWORDS.critical) {
    if (lowerText.includes(keyword)) {
      detectedKeywords.push(keyword);
      riskLevel = 'critical';
      maxScore = Math.max(maxScore, 0.95);
    }
  }

  // Check high-risk keywords
  if (riskLevel !== 'critical') {
    for (const keyword of CRISIS_KEYWORDS.high) {
      if (lowerText.includes(keyword)) {
        detectedKeywords.push(keyword);
        riskLevel = 'high';
        maxScore = Math.max(maxScore, 0.75);
      }
    }
  }

  // Check moderate keywords
  if (riskLevel === 'normal') {
    for (const keyword of CRISIS_KEYWORDS.moderate) {
      if (lowerText.includes(keyword)) {
        detectedKeywords.push(keyword);
        riskLevel = 'moderate';
        maxScore = Math.max(maxScore, 0.50);
      }
    }
  }

  logger.info('Crisis risk analysis complete', {
    riskLevel,
    score: maxScore || 0.1,
    keywordCount: detectedKeywords.length
  });

  return {
    riskLevel,
    score: maxScore || 0.1,
    keywords: detectedKeywords,
    method: 'keyword-analysis'
  };
}

// Returns a structured crisis response message and actions for a given risk level
export function getCrisisResponse(riskLevel) {
  const responses = {
    critical: {
      message: "I'm very concerned about your safety right now. Please reach out to the Suicide Research and Prevention Initiative (SURPIN) by calling 09080217555 immediately — they are available to help. If you're in immediate danger, please call 112 (Nigeria Emergency). You are not alone, and help is available right now.",
      actions: ['call_surpin', 'call_112', 'contact_emergency_contact', 'go_to_er']
    },
    high: {
      message: "I hear that you're going through something really painful right now. Your safety matters deeply. Please consider reaching out to the Mental Health Foundation for Africa (MHFA) at 09036032505 — they have trained counselors ready to talk. You deserve support through this.",
      actions: ['call_mhfa', 'call_surpin', 'contact_trusted_person']
    }
  };

  return responses[riskLevel] || {
    message: "I'm here for you. If you ever feel unsafe, please reach out to the Mental Health Foundation for Africa (MHFA) at 09036032505 or call Nigeria Emergency at 112.",
    actions: ['call_mhfa']
  };
}

// Nigerian crisis resources
export function getSupportResources() {
  return {
    immediate: [
      { name: 'Nigeria Emergency Services', phone: '112', description: 'National emergency number', available: '24/7' },
      { name: 'SURPIN (Suicide Research & Prevention Initiative)', phone: '09080217555', description: 'Suicide prevention and crisis support', available: '24/7', website: 'https://surpinng.com' },
      { name: 'MHFA (Mental Health Foundation for Africa)', phone: '09036032505', description: 'Mental health crisis support', available: '24/7', website: 'https://mentalhealthnigeria.org' }
    ],
    support: [
      { name: 'Mentally Aware Nigeria Initiative (MANI)', phone: '09030000741', description: 'Mental health advocacy and support', available: 'Mon-Fri 9am-5pm', website: 'https://www.mentallyaware.org.ng' },
      { name: 'Nigeria Police Emergency', phone: '199', description: 'Police emergency line', available: '24/7' }
    ]
  };
}

export default { analyzeCrisisRisk, getCrisisResponse, getSupportResources };