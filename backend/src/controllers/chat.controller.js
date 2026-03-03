import { supabase, supabaseAdmin } from '../config/supabase.js';
import { logger } from '../config/logger.js';
import { asyncHandler } from '../middleware/errorHandler.js';
import { analyzeCrisisRisk, getCrisisResponse, getSupportResources } from '../services/safety.service.js';
import { generateAIResponse, needsProfessionalReferral, analyzeEmotionWithRoBERTa } from '../services/ai.service.js';
import { sendCrisisAlert } from '../services/email.service.js';

export const sendMessage = asyncHandler(async (req, res) => {
  const { conversationId, message } = req.body;
  const userId = req.userId;

  if (!message || message.trim().length === 0) {
    return res.status(400).json({ error: 'Validation Error', message: 'Message cannot be empty' });
  }

  if (!conversationId) {
    return res.status(400).json({ error: 'Validation Error', message: 'Conversation ID is required' });
  }

  const { data: conversation, error: convError } = await supabase.from('conversations').select('*').eq('id', conversationId).eq('user_id', userId).single();
  if (convError || !conversation) {
    return res.status(404).json({ error: 'Not Found', message: 'Conversation not found' });
  }

  // STEP 1: SAFETY CHECK - RoBERTa Crisis Detection
  logger.info('Running crisis risk analysis', { userId, conversationId });
  const riskAnalysis = await analyzeCrisisRisk(message);
  const { riskLevel, score, keywords, method } = riskAnalysis;

  logger.info('Crisis risk analysis complete', { userId, conversationId, riskLevel, score, method, keywordCount: keywords.length });

  // STEP 1B: EMOTION ANALYSIS - RoBERTa Emotion Classification
  logger.info('Running RoBERTa emotion analysis', { userId, conversationId });
  const emotionAnalysis = await analyzeEmotionWithRoBERTa(message);
  if (emotionAnalysis) {
    logger.info('Emotion analysis complete', { userId, conversationId, primaryEmotion: emotionAnalysis.primary, confidence: emotionAnalysis.confidence });
  }

  const { data: userMessage, error: userMsgError } = await supabaseAdmin.from('messages').insert({
    conversation_id: conversationId, role: 'user', content: message, risk_level: riskLevel, risk_score: score, was_escalated: riskLevel === 'high' || riskLevel === 'critical'
  }).select().single();

  if (userMsgError) throw userMsgError;

  let aiResponse = '';
  let wasEscalated = false;

  // STEP 2: HANDLE BASED ON RISK LEVEL
  if (riskLevel === 'critical' || riskLevel === 'high') {
    wasEscalated = true;
    logger.warn('HIGH RISK DETECTED - Escalating', { userId, conversationId, riskLevel, score });

    const crisisInfo = getCrisisResponse(riskLevel);
    aiResponse = crisisInfo.message;

    const { data: crisisLog, error: crisisError } = await supabaseAdmin.from('crisis_logs').insert({
      user_id: userId, conversation_id: conversationId, message_id: userMessage.id, risk_level: riskLevel,
      risk_score: score, detected_keywords: keywords, user_message: message, response_sent: aiResponse
    }).select().single();

    if (crisisError) logger.error('Failed to log crisis event', { error: crisisError.message });

    try {
      const { data: userData } = await supabase.from('users').select('email, full_name').eq('id', userId).single();

      const emailResult = await sendCrisisAlert({
        userId, userName: userData?.full_name, userEmail: userData?.email, riskLevel, riskScore: score,
        message, detectedKeywords: keywords, timestamp: new Date().toISOString(), conversationId
      });

      if (emailResult.success && crisisLog) {
        await supabaseAdmin.from('crisis_logs').update({ email_sent: true, email_sent_at: new Date().toISOString() }).eq('id', crisisLog.id);
      }
    } catch (emailError) {
      logger.error('Crisis email failed', { error: emailError.message });
    }

    const supportResources = getSupportResources();

    await supabaseAdmin.from('messages').insert({ conversation_id: conversationId, role: 'assistant', content: aiResponse });
    await supabaseAdmin.from('conversations').update({ last_message_at: new Date().toISOString() }).eq('id', conversationId);

    return res.json({
      message: aiResponse,
      riskLevel,
      escalated: true,
      supportResources,
      crisisActions: crisisInfo.actions,
      emotionAnalysis: emotionAnalysis || null,
      providers: {
        chat: 'openai',
        emotion: emotionAnalysis ? 'huggingface' : null
      }
    });

  } else {
    const { data: history } = await supabase.from('messages').select('role, content').eq('conversation_id', conversationId).order('created_at', { ascending: true }).limit(10);

    aiResponse = await generateAIResponse(message, history || []);

    if (needsProfessionalReferral(message)) {
      aiResponse += "\n\nI notice you're asking about professional services. While I'm here to support you, a licensed mental health professional can provide more specialized help. Would you like me to help you find resources in your area?";
    }

    await supabaseAdmin.from('messages').insert({ conversation_id: conversationId, role: 'assistant', content: aiResponse });
    await supabaseAdmin.from('conversations').update({ last_message_at: new Date().toISOString() }).eq('id', conversationId);

    logger.info('AI response generated', { userId, conversationId, messageLength: aiResponse.length });
    return res.json({
      message: aiResponse,
      riskLevel,
      escalated: false,
      emotionAnalysis: emotionAnalysis || null,
      providers: {
        chat: 'openai',
        emotion: emotionAnalysis ? 'huggingface' : null
      }
    });
  }
});

export const getConversationHistory = asyncHandler(async (req, res) => {
  const { conversationId } = req.params;
  const { data: conversation } = await supabase.from('conversations').select('*').eq('id', conversationId).eq('user_id', req.userId).single();
  if (!conversation) return res.status(404).json({ error: 'Not Found', message: 'Conversation not found' });

  const { data: messages } = await supabase.from('messages').select('*').eq('conversation_id', conversationId).order('created_at', { ascending: true });
  res.json({ conversation, messages: messages || [] });
});

export const getConversationSummary = asyncHandler(async (req, res) => {
  const { conversationId } = req.params;
  const { data: conversation } = await supabase.from('conversations').select('*').eq('id', conversationId).eq('user_id', req.userId).single();
  if (!conversation) return res.status(404).json({ error: 'Not Found', message: 'Conversation not found' });

  const { data: messages } = await supabase.from('messages').select('role, risk_level').eq('conversation_id', conversationId);
  const stats = {
    totalMessages: messages?.length || 0,
    userMessages: messages?.filter(m => m.role === 'user').length || 0,
    assistantMessages: messages?.filter(m => m.role === 'assistant').length || 0,
    riskDetections: {
      critical: messages?.filter(m => m.risk_level === 'critical').length || 0,
      high: messages?.filter(m => m.risk_level === 'high').length || 0,
      moderate: messages?.filter(m => m.risk_level === 'moderate').length || 0
    }
  };
  res.json({ conversation, stats });
});

export default { sendMessage, getConversationHistory, getConversationSummary };