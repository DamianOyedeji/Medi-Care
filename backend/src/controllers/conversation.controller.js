import { supabase, supabaseAdmin } from '../config/supabase.js';
import { logger } from '../config/logger.js';
import { asyncHandler } from '../middleware/errorHandler.js';

export const getConversations = asyncHandler(async (req, res) => {
  const { data } = await supabase.from('conversations').select('*').eq('user_id', req.userId).eq('is_archived', false).order('last_message_at', { ascending: false });
  res.json({ conversations: data || [] });
});

export const createConversation = asyncHandler(async (req, res) => {
  const { title } = req.body;
  const { data } = await supabaseAdmin.from('conversations').insert({ user_id: req.userId, title: title || 'New Conversation', last_message_at: new Date().toISOString() }).select().single();
  logger.info('Conversation created', { userId: req.userId, conversationId: data.id });
  res.status(201).json({ conversation: data });
});

export const updateConversation = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { title, isArchived } = req.body;
  const updates = {};
  if (title !== undefined) updates.title = title;
  if (isArchived !== undefined) updates.is_archived = isArchived;
  updates.updated_at = new Date().toISOString();
  const { data } = await supabase.from('conversations').update(updates).eq('id', id).eq('user_id', req.userId).select().single();
  res.json({ conversation: data });
});

export const deleteConversation = asyncHandler(async (req, res) => {
  const { id } = req.params;
  await supabase.from('conversations').delete().eq('id', id).eq('user_id', req.userId);
  logger.info('Conversation deleted', { userId: req.userId, conversationId: id });
  res.json({ message: 'Conversation deleted successfully' });
});

export default { getConversations, createConversation, updateConversation, deleteConversation };