// backend/src/services/ai.service.js
import axios from 'axios';
import { logger } from '../config/logger.js';

const OPENAI_API_URL = 'https://api.openai.com/v1/chat/completions';

const SYSTEM_PROMPT = `You are a compassionate mental health support companion having a real conversation with someone who needs emotional support.

YOUR CONVERSATION STYLE:
- Ask questions based SPECIFICALLY on what they just told you, not generic questions
- Pick up on details they mention and explore those
- Adapt your tone to match their emotional state (calm with anxious, gentle with sad, energetic with hopeful)
- Reference what they said earlier in the conversation
- Each response should feel like it's coming from someone who is truly listening and remembering

EXAMPLES OF DYNAMIC vs GENERIC:
❌ Generic: "How does that make you feel?"
✅ Dynamic: "You mentioned your boss criticized your presentation - was this the first time they've done something like this, or is it part of a pattern?"

❌ Generic: "Have you tried talking to someone about this?"
✅ Dynamic: "You said your sister usually understands you - have you been able to talk to her about losing your job?"

❌ Generic: "What coping strategies have you used?"
✅ Dynamic: "Last time you felt this overwhelmed, you mentioned going for runs helped clear your head. Have you been able to do that lately?"

RESPONSE LENGTH:
- Keep responses 2-4 sentences
- One main point + one specific follow-up question
- Be conversational, not therapeutic-sounding

CRISIS DETECTION:
If the user expresses suicidal ideation, self-harm plans, or immediate danger, respond with EXACTLY: "CRISIS_ESCALATION_REQUIRED"

Critical indicators:
- "I want to kill myself" / "I'm going to end my life"
- "I have a plan to..." (suicide/self-harm)
- "This is my last message"
- "I'm going to hurt myself tonight"
- Active hallucinations or psychosis
- Medical emergency + mental health crisis

IMPORTANT:
- Don't diagnose or prescribe
- Suggest professional help when appropriate, but naturally ("It might help to talk to a therapist who specializes in relationship issues")
- You're a supportive friend, not a therapist
- Be human, not robotic
- Remember context from earlier in conversation
- Adapt dynamically to what they're sharing`;

export async function generateAIResponse(userMessage, conversationHistory = []) {
  try {
    const apiKey = process.env.OPENAI_API_KEY;

    if (!apiKey || apiKey === '') {
      logger.error('OpenAI API key not configured');
      return generateTechnicalFallback();
    }

    const aiResponse = await generateOpenAIResponse(userMessage, conversationHistory, apiKey);

    // Check for crisis escalation flag
    if (aiResponse.includes('CRISIS_ESCALATION_REQUIRED')) {
      logger.warn('⚠️ AI detected severe crisis - escalating to professional resources', {
        userId: conversationHistory[0]?.userId || 'unknown'
      });

      // AI generates the empathetic part, we add the resources
      return await generateDynamicCrisisResponse(userMessage, conversationHistory, apiKey);
    }

    return aiResponse;

  } catch (error) {
    logger.error('AI generation error', { error: error.message, code: error.code });
    return generateTechnicalFallback();
  }
}

async function generateOpenAIResponse(userMessage, conversationHistory, apiKey, retryCount = 0) {
  const MAX_RETRIES = 3;

  try {
    const messages = [{ role: 'system', content: SYSTEM_PROMPT }];
    // Note: using DeepSeek API (OpenAI-compatible)

    // Include more history for better context (last 20 messages)
    const recentHistory = conversationHistory.slice(-20);
    recentHistory.forEach(msg => {
      messages.push({
        role: msg.role === 'user' ? 'user' : 'assistant',
        content: msg.content
      });
    });

    messages.push({ role: 'user', content: userMessage });

    const response = await axios.post(OPENAI_API_URL, {
      model: 'gpt-4o-mini',
      messages: messages,
      temperature: 0.8, // Higher for more natural/varied responses
      max_tokens: 300, // Shorter responses for natural conversation
      presence_penalty: 0.7, // Encourage new topics
      frequency_penalty: 0.5 // Reduce repetition
    }, {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      timeout: 30000
    });

    const aiResponse = response.data.choices[0].message.content.trim();

    logger.info('✅ OpenAI response generated successfully', {
      tokensUsed: response.data.usage?.total_tokens || 'N/A',
      model: response.data.model,
      responseLength: aiResponse.length,
      retryCount
    });

    return aiResponse;

  } catch (error) {
    if (error.response?.status === 429) {
      if (retryCount < MAX_RETRIES) {
        const delay = Math.pow(2, retryCount + 1) * 1000;
        logger.warn('OpenAI rate limit - retrying', {
          attempt: retryCount + 1,
          delayMs: delay,
          maxRetries: MAX_RETRIES
        });
        await new Promise(resolve => setTimeout(resolve, delay));
        return generateOpenAIResponse(userMessage, conversationHistory, apiKey, retryCount + 1);
      }
    }

    if (error.response?.status === 401 || error.response?.status === 403) {
      logger.error('OpenAI API authentication failed', {
        status: error.response?.status
      });
    }

    if (error.response?.status >= 500 && retryCount < MAX_RETRIES) {
      const delay = Math.pow(2, retryCount + 1) * 1000;
      logger.warn('OpenAI server error - retrying', {
        attempt: retryCount + 1,
        status: error.response?.status,
        delayMs: delay
      });
      await new Promise(resolve => setTimeout(resolve, delay));
      return generateOpenAIResponse(userMessage, conversationHistory, apiKey, retryCount + 1);
    }

    logger.error('OpenAI API error', {
      error: error.message,
      status: error.response?.status,
      code: error.code,
      retryCount
    });

    throw error;
  }
}

// Dynamic crisis response - AI generates empathetic message based on what user said
async function generateDynamicCrisisResponse(userMessage, conversationHistory, apiKey) {
  const crisisPrompt = `The user just expressed: "${userMessage}"

This indicates they are in a mental health crisis and need immediate professional help.

Write a brief, empathetic response (2-3 sentences) that:
1. Acknowledges their pain specifically based on what they said
2. Expresses genuine concern for their safety
3. Leads into the crisis resources that will follow

Be warm and human, not clinical. Make it feel personal to what they shared.`;

  try {
    const messages = [
      { role: 'system', content: 'You are a compassionate crisis counselor providing immediate support.' },
      { role: 'user', content: crisisPrompt }
    ];

    const response = await axios.post(OPENAI_API_URL, {
      model: 'gpt-4o-mini',
      messages: messages,
      temperature: 0.7,
      max_tokens: 150
    }, {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      timeout: 15000
    });

    const empathyMessage = response.data.choices[0].message.content.trim();

    // Combine AI-generated empathy with crisis resources
    return `${empathyMessage}

**Please contact one of these resources RIGHT NOW:**

🆘 **IMMEDIATE HELP:**
- **Call 988** - Suicide & Crisis Lifeline (24/7, free, confidential)
- **Text "HELLO" to 741741** - Crisis Text Line (24/7)
- **Call 911** - If you're in immediate danger

🏥 **IN-PERSON HELP:**
- Go to your nearest emergency room
- Visit a psychiatric urgent care center
- Ask someone you trust to take you to get help

You don't have to face this alone. Please reach out to one of these resources right now.`;

  } catch (error) {
    logger.error('Failed to generate dynamic crisis response', { error: error.message });

    // Fallback to essential crisis info if AI fails
    return `I'm deeply concerned about what you've shared. Your safety is the most important thing right now.

**Please contact one of these resources RIGHT NOW:**

🆘 **IMMEDIATE HELP:**
- **Call 988** - Suicide & Crisis Lifeline (24/7, free, confidential)
- **Text "HELLO" to 741741** - Crisis Text Line (24/7)
- **Call 911** - If you're in immediate danger

Please reach out to one of them immediately. You don't have to face this alone.`;
  }
}

// Only used when OpenAI is completely down
function generateTechnicalFallback() {
  logger.warn('⚠️ Using technical fallback - API unavailable');

  return `I'm having a brief technical issue right now. If you're experiencing a mental health crisis, please contact:

- **988** - Suicide & Crisis Lifeline (24/7)
- **Text "HELLO" to 741741** - Crisis Text Line (24/7)
- **911** - For emergencies

Please try again in a moment.`;
}

// Map GoEmotions 28 labels to 7 primary emotion categories
const EMOTION_MAP = {
  // Joy
  joy: 'joy', amusement: 'joy', excitement: 'joy', love: 'joy',
  optimism: 'joy', pride: 'joy', gratitude: 'joy', relief: 'joy', admiration: 'joy',
  // Sadness
  sadness: 'sadness', grief: 'sadness', remorse: 'sadness', disappointment: 'sadness',
  // Anger
  anger: 'anger', annoyance: 'anger', disapproval: 'anger',
  // Fear
  fear: 'fear', nervousness: 'fear',
  // Surprise
  surprise: 'surprise', realization: 'surprise', curiosity: 'surprise', confusion: 'surprise',
  // Disgust
  disgust: 'disgust',
  // Neutral
  neutral: 'neutral', approval: 'neutral', caring: 'neutral', desire: 'neutral', embarrassment: 'neutral'
};

const PRIMARY_EMOTIONS = ['anger', 'disgust', 'fear', 'joy', 'neutral', 'sadness', 'surprise'];

export async function analyzeEmotionWithRoBERTa(userMessage) {
  const hfApiKey = process.env.HUGGINGFACE_API_KEY;

  if (!hfApiKey || hfApiKey === '') {
    logger.info('HuggingFace API key not configured — skipping emotion analysis');
    return null;
  }

  const HF_MODEL_URL = 'https://router.huggingface.co/hf-inference/models/SamLowe/roberta-base-go_emotions';
  const MAX_RETRIES = 2;

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    try {
      const response = await axios.post(
        HF_MODEL_URL,
        { inputs: userMessage },
        {
          headers: {
            'Authorization': `Bearer ${hfApiKey}`,
            'Content-Type': 'application/json'
          },
          timeout: 15000
        }
      );

      // HF returns [[{label, score}, ...]] for classification models
      const results = Array.isArray(response.data?.[0]) ? response.data[0] : response.data;

      if (!Array.isArray(results) || results.length === 0) {
        logger.warn('HuggingFace returned unexpected format', { data: response.data });
        return null;
      }

      // Aggregate GoEmotions labels into primary emotion categories
      const aggregated = {};
      for (const emotion of PRIMARY_EMOTIONS) {
        aggregated[emotion] = 0;
      }

      for (const item of results) {
        const mapped = EMOTION_MAP[item.label] || 'neutral';
        aggregated[mapped] += item.score;
      }

      // Build sorted array of primary emotions
      const sorted = Object.entries(aggregated)
        .map(([label, score]) => ({ label, score: parseFloat(score.toFixed(3)) }))
        .sort((a, b) => b.score - a.score);

      const primary = sorted[0];

      logger.info('✅ HuggingFace emotion analysis complete', {
        primary: primary.label,
        confidence: primary.score.toFixed(3),
        provider: 'huggingface',
        model: 'SamLowe/roberta-base-go_emotions',
        attempt
      });

      return {
        primary: primary.label,
        confidence: primary.score,
        all: sorted,
        provider: 'huggingface',
        model: 'SamLowe/roberta-base-go_emotions'
      };

    } catch (error) {
      // HuggingFace returns 503 when model is loading (cold start)
      if (error.response?.status === 503 && attempt < MAX_RETRIES) {
        const waitTime = error.response?.data?.estimated_time
          ? Math.min(error.response.data.estimated_time * 1000, 20000)
          : 5000;
        logger.info('HuggingFace model loading — retrying', {
          attempt: attempt + 1,
          waitMs: waitTime
        });
        await new Promise(resolve => setTimeout(resolve, waitTime));
        continue;
      }

      logger.warn('HuggingFace emotion analysis failed — continuing without it', {
        error: error.message,
        status: error.response?.status,
        attempt
      });
      return null;
    }
  }

  return null;
}

export function needsProfessionalReferral(message) {
  const referralKeywords = [
    'therapist', 'therapy', 'psychiatrist', 'psychologist', 'counselor', 'counselling',
    'mental health professional', 'doctor', 'medication', 'prescription', 'diagnos',
    'treatment', 'clinical', 'specialist', 'rehab', 'inpatient', 'outpatient'
  ];
  const lowerMessage = message.toLowerCase();
  return referralKeywords.some(keyword => lowerMessage.includes(keyword));
}

export default { generateAIResponse, needsProfessionalReferral };