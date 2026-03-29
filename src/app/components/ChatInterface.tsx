import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Send, ArrowLeft, ShieldAlert, PhoneCall, Mic, MicOff, Sparkles, Paperclip, Pencil, X, Check, Heart, MapPin, Loader2, Navigation, Volume2, VolumeX, FileText } from 'lucide-react';
import { useNotifications } from '../../contexts/NotificationContext';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../../lib/utils';
import { api, getAccessToken } from '../../lib/api';
import { API_BASE } from '../../lib/api';
import { useAuth } from '../../contexts/AuthContext';


// Web Speech API type declarations
interface SpeechRecognitionEvent extends Event {
  results: SpeechRecognitionResultList;
  resultIndex: number;
}
interface SpeechRecognitionErrorEvent extends Event {
  error: string;
}
interface SpeechRecognitionInstance extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start(): void;
  stop(): void;
  abort(): void;
  onresult: ((event: SpeechRecognitionEvent) => void) | null;
  onerror: ((event: SpeechRecognitionErrorEvent) => void) | null;
  onend: (() => void) | null;
}
declare global {
  interface Window {
    SpeechRecognition: new () => SpeechRecognitionInstance;
    webkitSpeechRecognition: new () => SpeechRecognitionInstance;
  }
}

interface EmotionAnalysis {
  primary: string;
  confidence: number;
  all?: Array<{ label: string; score: number }>;
  provider: string;
  model: string;
}

interface Providers {
  chat: string;
  emotion: string | null;
}

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  emotionAnalysis?: EmotionAnalysis | null;
  providers?: Providers | null;
}

interface AttachedFile {
  name: string;
  type: string;
  size: number;
  dataUrl: string;
}

interface NearbyFacility {
  name: string;
  type: string;
  phone?: string;
  address?: string;
  distance?: string;
}

interface ChatInterfaceProps {
  conversationId: string | null;
  onBack: () => void;
  onViewSupport?: () => void;
  onViewNotifications?: () => void;
}

export function ChatInterface({ conversationId, onBack, onViewSupport, onViewNotifications }: ChatInterfaceProps) {
  const { addNotification } = useNotifications();
  const [inputValue, setInputValue] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [activeConversationId, setActiveConversationId] = useState<string | null>(conversationId);
  const [isTyping, setIsTyping] = useState(false);
  const [showSafetyBanner, setShowSafetyBanner] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const editInputRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const [attachedFile, setAttachedFile] = useState<AttachedFile | null>(null);
  const [editValue, setEditValue] = useState('');
  const [showQuickDial, setShowQuickDial] = useState(false);
  const [nearbyFacilities, setNearbyFacilities] = useState<NearbyFacility[]>([]);
  const [loadingFacilities, setLoadingFacilities] = useState(false);
  const [facilitiesError, setFacilitiesError] = useState<string | null>(null);
  const [facilitiesFetched, setFacilitiesFetched] = useState(false);

  const { user, isAuthenticated } = useAuth();

  // --- STT state ---
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef<SpeechRecognitionInstance | null>(null);
  const sttSupported = typeof window !== 'undefined' && ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window);

  // --- TTS state ---
  const [ttsEnabled, setTtsEnabled] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('mh_tts_enabled') === 'true';
    }
    return false;
  });
  const [isSpeakingTTS, setIsSpeakingTTS] = useState(false);
  const ttsSupported = typeof window !== 'undefined' && 'speechSynthesis' in window;

  const scrollToBottom = () => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  useEffect(() => {
    if (!isAuthenticated) {
      setLoading(false);
      setError('Please log in to continue');
      return;
    }
  }, [isAuthenticated]);

  // Daily check-in notification — fires once per day on first chat open
  useEffect(() => {
    if (!isAuthenticated) return;
    const lastCheckin = localStorage.getItem('mh_last_checkin');
    const today = new Date().toDateString();
    if (lastCheckin !== today) {
      localStorage.setItem('mh_last_checkin', today);
      const hour = new Date().getHours();
      const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';
      setTimeout(() => {
        addNotification({
          type: 'info',
          title: `${greeting} 💚`,
          body: 'How are you feeling today? This is your safe space to talk.',
        });
      }, 2000);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 200)}px`;
    }
  }, [inputValue]);

  useEffect(() => {
    if (editInputRef.current) {
      editInputRef.current.style.height = 'auto';
      editInputRef.current.style.height = `${editInputRef.current.scrollHeight}px`;
    }
  }, [editValue, editingMessageId]);

  useEffect(() => {
    setActiveConversationId(conversationId);
    if (conversationId) {
      setLoading(true);
      setError(null);
      api
        .get<{ messages: Array<{ id: string; role: string; content: string; created_at: string }> }>(`/api/chat/history/${conversationId}`)
        .then((data) => {
          const res = data as { messages: Array<{ id: string; role: string; content: string; created_at: string }> };
          const msgs = (res.messages || []).map((m) => ({
            id: m.id,
            role: m.role as 'user' | 'assistant',
            content: m.content,
            timestamp: new Date(m.created_at),
          }));
          setMessages(msgs);
        })
        .catch((err) => {
          setError(err instanceof Error ? err.message : 'Failed to load conversation');
          setMessages([]);
        })
        .finally(() => setLoading(false));
    } else {
      setMessages([]);
      setLoading(false);
      setError(null);
    }
  }, [conversationId, isAuthenticated]);

  // --- STT: Speech-to-Text via Web Speech API ---
  const toggleListening = useCallback(() => {
    if (!sttSupported) return;

    if (isListening && recognitionRef.current) {
      recognitionRef.current.stop();
      return;
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-US';

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      let finalTranscript = '';
      let interimTranscript = '';
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          finalTranscript += transcript;
        } else {
          interimTranscript += transcript;
        }
      }
      if (finalTranscript) {
        setInputValue(prev => prev + finalTranscript);
      }
    };

    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      console.error('Speech recognition error:', event.error);
      setIsListening(false);
      recognitionRef.current = null;
    };

    recognition.onend = () => {
      setIsListening(false);
      recognitionRef.current = null;
    };

    recognitionRef.current = recognition;
    recognition.start();
    setIsListening(true);
  }, [isListening, sttSupported]);

  // Cleanup STT on unmount
  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.abort();
      }
    };
  }, []);

  // --- TTS: Text-to-Speech via SpeechSynthesis API ---
  const toggleTTS = useCallback(() => {
    setTtsEnabled(prev => {
      const next = !prev;
      localStorage.setItem('mh_tts_enabled', String(next));
      if (!next && window.speechSynthesis) {
        window.speechSynthesis.cancel();
        setIsSpeakingTTS(false);
      }
      return next;
    });
  }, []);

  const speakText = useCallback((text: string) => {
    if (!ttsSupported || !ttsEnabled) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 1;
    utterance.pitch = 1;
    utterance.onstart = () => setIsSpeakingTTS(true);
    utterance.onend = () => setIsSpeakingTTS(false);
    utterance.onerror = () => setIsSpeakingTTS(false);
    window.speechSynthesis.speak(utterance);
  }, [ttsSupported, ttsEnabled]);

  const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > MAX_FILE_SIZE) {
      setError('File is too large. Maximum size is 5 MB.');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      setAttachedFile({
        name: file.name,
        type: file.type,
        size: file.size,
        dataUrl: reader.result as string,
      });
    };
    reader.readAsDataURL(file);
    // Reset the input so re-selecting the same file triggers onChange
    e.target.value = '';
  };

  const removeAttachment = () => {
    setAttachedFile(null);
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const isImageType = (mimeType: string) => mimeType.startsWith('image/');

  // Parse message content to extract attachment markers and render them
  const renderMessageContent = (content: string) => {
    const fileRegex = /\[FILE:(.+?):(.+?):(.+?)\]/g;
    const parts: React.ReactNode[] = [];
    let lastIndex = 0;
    let match;

    while ((match = fileRegex.exec(content)) !== null) {
      // Text before this match
      if (match.index > lastIndex) {
        const text = content.slice(lastIndex, match.index).trim();
        if (text) parts.push(<span key={`t-${lastIndex}`}>{text}</span>);
      }

      const [, fileName, mimeType, dataUrl] = match;

      if (isImageType(mimeType)) {
        parts.push(
          <img
            key={`f-${match.index}`}
            src={dataUrl}
            alt={fileName}
            className="mt-2 max-w-full max-h-64 rounded-xl border border-stone-200 dark:border-stone-700 shadow-sm cursor-pointer hover:shadow-md transition-shadow"
            onClick={() => window.open(dataUrl, '_blank')}
          />
        );
      } else {
        parts.push(
          <a
            key={`f-${match.index}`}
            href={dataUrl}
            download={fileName}
            onClick={(ev) => ev.stopPropagation()}
            className="mt-2 flex items-center gap-3 p-3 bg-stone-50 dark:bg-stone-800 hover:bg-stone-100 dark:hover:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-xl transition-colors max-w-xs"
          >
            <div className="w-9 h-9 rounded-lg bg-violet-100 dark:bg-violet-900/30 text-violet-600 dark:text-violet-400 flex items-center justify-center shrink-0">
              <FileText size={18} />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-medium text-stone-700 dark:text-stone-200 truncate">{fileName}</p>
              <p className="text-[11px] text-stone-400 dark:text-stone-500">Tap to download</p>
            </div>
          </a>
        );
      }

      lastIndex = match.index + match[0].length;
    }

    // Remaining text after last match
    if (lastIndex < content.length) {
      const remaining = content.slice(lastIndex).trim();
      if (remaining) parts.push(<span key={`t-${lastIndex}`}>{remaining}</span>);
    }

    return parts.length > 0 ? parts : content;
  };

  const handleSendMessage = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!inputValue.trim() && !attachedFile) return;

    let text = inputValue;
    const currentAttachment = attachedFile;
    setInputValue('');
    setAttachedFile(null);
    setIsTyping(true);

    // Embed attachment marker in message
    if (currentAttachment) {
      const marker = `[FILE:${currentAttachment.name}:${currentAttachment.type}:${currentAttachment.dataUrl}]`;
      text = text.trim() ? `${text.trim()}\n${marker}` : marker;
    }

    // Stop STT if active when sending
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
    // Cancel any in-progress TTS
    if (window.speechSynthesis) {
      window.speechSynthesis.cancel();
      setIsSpeakingTTS(false);
    }

    const userMsgId = Date.now().toString();
    const aiMsgId = (Date.now() + 1).toString();

    try {
      let convId = activeConversationId;
      if (!convId) {
        const created = await api.post<{ conversation: { id: string } }>('/api/conversations', { title: text.slice(0, 50) });
        convId = (created as { conversation: { id: string } }).conversation.id;
        setActiveConversationId(convId);
      }

      const newUserMessage: Message = {
        id: userMsgId,
        role: 'user',
        content: text,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, newUserMessage]);

      // Add empty assistant message for streaming
      setMessages((prev) => [...prev, { id: aiMsgId, role: 'assistant' as const, content: '', timestamp: new Date() }]);

      const authToken = getAccessToken();
      const response = await fetch(`${API_BASE}/api/chat/stream`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
        },
        body: JSON.stringify({ conversationId: convId, message: text }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error((errorData as { message?: string })?.message || `Request failed: ${response.status}`);
      }

      const reader = response.body!.getReader();
      const decoder = new TextDecoder();
      let aiContent = '';
      let streamBuffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        streamBuffer += decoder.decode(value, { stream: true });
        const eventLines = streamBuffer.split('\n');
        streamBuffer = eventLines.pop() || '';

        for (const line of eventLines) {
          if (!line.startsWith('data: ')) continue;
          let eventData: Record<string, unknown>;
          try { eventData = JSON.parse(line.slice(6)); } catch { continue; }

          if (eventData.error) {
            throw new Error(eventData.error as string);
          }
          if (eventData.token) {
            aiContent += eventData.token as string;
            setMessages((prev) => prev.map((m) =>
              m.id === aiMsgId ? { ...m, content: aiContent } : m
            ));
          }
          if (eventData.done) {
            setMessages((prev) => prev.map((m) =>
              m.id === aiMsgId
                ? { ...m, emotionAnalysis: eventData.emotionAnalysis as EmotionAnalysis | null, providers: eventData.providers as Providers | null }
                : m
            ));

            if (eventData.escalated && ((eventData.supportResources) || aiContent.toLowerCase().includes('crisis'))) {
              setShowSafetyBanner(true);
              addNotification({
                type: 'crisis',
                title: 'We noticed you might be struggling',
                body: 'You are not alone. Immediate support resources are available — tap the ❤️ icon to find help.',
              });
            }
          }
        }
      }

      // Speak the complete response if TTS is enabled
      if (ttsEnabled && aiContent) {
        speakText(aiContent);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send message');
      // Remove the user message and any partial assistant message
      setMessages((prev) => prev.filter((m) => m.id !== userMsgId && m.id !== aiMsgId));
    } finally {
      setIsTyping(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const startEditing = (message: Message) => {
    setEditingMessageId(message.id);
    setEditValue(message.content);
  };

  const cancelEditing = () => {
    setEditingMessageId(null);
    setEditValue('');
  };

  const saveEdit = (id: string) => {
    if (!editValue.trim()) return;
    setMessages((prev) => prev.map((msg) => (msg.id === id ? { ...msg, content: editValue } : msg)));
    setEditingMessageId(null);
    setEditValue('');
  };

  const fetchNearbyFacilities = () => {
    if (facilitiesFetched && nearbyFacilities.length > 0) return;
    setLoadingFacilities(true);
    setFacilitiesError(null);
    if (!navigator.geolocation) {
      setFacilitiesError('Geolocation not supported by your browser.');
      setLoadingFacilities(false);
      return;
    }
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const { latitude, longitude } = position.coords;
          // Use AbortController to timeout if API is slow (8s)
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 8000);
          const url = `${API_BASE}/api/support/nearby?latitude=${latitude}&longitude=${longitude}`;
          const token = getAccessToken();
          const res = await fetch(url, {
            signal: controller.signal,
            headers: token ? { Authorization: `Bearer ${token}` } : {},
          });
          clearTimeout(timeoutId);
          const data = await res.json();
          const resources = (data as { resources: NearbyFacility[] }).resources || [];
          setNearbyFacilities(resources);
          setFacilitiesFetched(true);
        } catch (err) {
          if ((err as Error).name === 'AbortError') {
            setFacilitiesError('Search timed out. Try again.');
          } else {
            setFacilitiesError('Could not find nearby facilities. Try again later.');
          }
        } finally {
          setLoadingFacilities(false);
        }
      },
      () => {
        setFacilitiesError('Location access denied. Please enable location to find nearby support.');
        setLoadingFacilities(false);
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 60000 }
    );
  };

  const toggleQuickDial = () => {
    const next = !showQuickDial;
    setShowQuickDial(next);
    if (next) fetchNearbyFacilities();
  };



  return (
    <div className="flex flex-col h-full bg-stone-50 dark:bg-stone-950 md:bg-white md:dark:bg-stone-900 relative">
      <header className="absolute top-0 left-0 right-0 z-10 bg-white/90 dark:bg-stone-900/90 backdrop-blur-sm border-b border-stone-50 dark:border-stone-800 py-3 px-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button onClick={onBack} className="flex items-center gap-1.5 text-stone-500 dark:text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 text-sm font-medium transition-colors py-1 px-1" title="Back">
            <ArrowLeft size={18} />
            <span className="hidden sm:inline">Back</span>
          </button>
          <div>
            <h1 className="text-sm font-semibold text-stone-800 dark:text-stone-100 tracking-tight flex items-center gap-2">
              Medi-Care <span className="w-1.5 h-1.5 rounded-full bg-teal-500"></span>
            </h1>
            <p className="text-xs text-stone-400 dark:text-stone-500">A quiet space to talk.</p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          {/* TTS Toggle */}
          {ttsSupported && (
            <button
              onClick={toggleTTS}
              className={cn(
                'p-2 rounded-full transition-colors',
                ttsEnabled
                  ? 'text-teal-600 dark:text-teal-400 bg-teal-50 dark:bg-teal-900/30'
                  : 'text-stone-400 dark:text-stone-500 hover:text-teal-600 dark:hover:text-teal-400 hover:bg-teal-50 dark:hover:bg-teal-900/30'
              )}
              title={ttsEnabled ? 'Disable voice responses' : 'Enable voice responses'}
            >
              {ttsEnabled ? <Volume2 size={20} className={isSpeakingTTS ? 'animate-pulse' : ''} /> : <VolumeX size={20} />}
            </button>
          )}
          <button
            onClick={onViewSupport}
            className="p-2 text-stone-400 dark:text-stone-500 hover:text-teal-600 dark:hover:text-teal-400 hover:bg-teal-50 dark:hover:bg-teal-900/30 rounded-full transition-colors"
            title="Support Resources"
          >
            <Heart size={20} />
          </button>
          <button
            onClick={toggleQuickDial}
            className={cn(
              'p-2 rounded-full transition-colors',
              showQuickDial
                ? 'text-teal-600 dark:text-teal-400 bg-teal-50 dark:bg-teal-900/30'
                : 'text-stone-400 dark:text-stone-500 hover:text-teal-600 dark:hover:text-teal-400 hover:bg-teal-50 dark:hover:bg-teal-900/30'
            )}
            title="Call Nearby Centers"
          >
            <PhoneCall size={20} />
          </button>
        </div>
      </header>

      {/* Quick-Dial Panel */}
      <AnimatePresence>
        {showQuickDial && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: 'easeInOut' }}
            className="absolute top-[60px] left-0 right-0 z-30 overflow-hidden"
          >
            <div className="bg-white/95 dark:bg-stone-900/95 backdrop-blur-md border-b border-stone-200 dark:border-stone-700 shadow-lg">
              <div className="px-4 py-3 flex items-center justify-between border-b border-stone-100 dark:border-stone-800">
                <div className="flex items-center gap-2">
                  <Navigation size={14} className="text-teal-600 dark:text-teal-400" />
                  <span className="text-xs font-bold text-stone-500 dark:text-stone-400 uppercase tracking-wider">Call Nearby Centers</span>
                </div>
                <button onClick={() => setShowQuickDial(false)} className="p-1 text-stone-400 dark:text-stone-500 hover:text-stone-600 dark:hover:text-stone-300 rounded-full hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors">
                  <X size={16} />
                </button>
              </div>

              <div className="max-h-[320px] overflow-y-auto">
                {loadingFacilities && (
                  <div className="flex items-center justify-center py-8 gap-2">
                    <Loader2 size={18} className="text-teal-600 dark:text-teal-400 animate-spin" />
                    <span className="text-sm text-stone-500 dark:text-stone-400">Finding nearby centers...</span>
                  </div>
                )}

                {facilitiesError && (
                  <div className="px-4 py-6 text-center">
                    <p className="text-sm text-rose-500 dark:text-rose-400 mb-2">{facilitiesError}</p>
                    <button onClick={fetchNearbyFacilities} className="text-xs text-teal-600 dark:text-teal-400 font-medium hover:underline">Try again</button>
                  </div>
                )}

                {!loadingFacilities && !facilitiesError && nearbyFacilities.length === 0 && facilitiesFetched && (
                  <div className="px-4 py-6 text-center">
                    <p className="text-sm text-stone-500 dark:text-stone-400">No facilities with phone numbers found nearby.</p>
                    {onViewSupport && (
                      <button onClick={onViewSupport} className="text-xs text-teal-600 dark:text-teal-400 font-medium hover:underline mt-2">View all support resources</button>
                    )}
                  </div>
                )}

                {nearbyFacilities.map((f, i) => (
                  <div key={i} className="px-4 py-3 border-b border-stone-50 dark:border-stone-800 last:border-0 hover:bg-stone-50/50 dark:hover:bg-stone-800/50 transition-colors flex items-center justify-between gap-3">
                    <div className="flex items-start gap-3 min-w-0">
                      <div className={cn(
                        'w-8 h-8 rounded-full flex items-center justify-center shrink-0 text-xs',
                        f.type === 'hospital' ? 'bg-rose-50 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400' : 'bg-teal-50 dark:bg-teal-900/30 text-teal-600 dark:text-teal-400'
                      )}>
                        {f.type === 'hospital' ? '🏥' : '🧠'}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-stone-800 dark:text-stone-100 truncate">{f.name}</p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className={cn(
                            'text-[10px] font-semibold px-1.5 py-0.5 rounded-full uppercase',
                            f.type === 'hospital' ? 'bg-rose-50 dark:bg-rose-900/30 text-rose-500 dark:text-rose-400' : 'bg-teal-50 dark:bg-teal-900/30 text-teal-600 dark:text-teal-400'
                          )}>
                            {f.type === 'hospital' ? 'Hospital' : 'Professional'}
                          </span>
                          {f.distance && <span className="text-[10px] text-stone-400 dark:text-stone-500">{f.distance} km</span>}
                        </div>
                      </div>
                    </div>
                    {f.phone ? (
                      <a
                        href={`tel:${f.phone}`}
                        className="flex items-center gap-1.5 text-xs font-semibold text-white bg-teal-600 hover:bg-teal-700 px-3 py-2 rounded-xl shadow-sm hover:shadow transition-all shrink-0"
                      >
                        <PhoneCall size={12} />
                        <span>Call</span>
                      </a>
                    ) : (
                      <span className="text-[10px] text-stone-400 dark:text-stone-500 shrink-0">No phone</span>
                    )}
                  </div>
                ))}
              </div>

              {nearbyFacilities.length > 0 && onViewSupport && (
                <div className="px-4 py-2.5 border-t border-stone-100 dark:border-stone-800 bg-stone-50/50 dark:bg-stone-800/50">
                  <button onClick={onViewSupport} className="text-xs text-teal-600 dark:text-teal-400 font-medium hover:underline w-full text-center">
                    View on map & more resources →
                  </button>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showSafetyBanner && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="absolute top-[60px] left-0 right-0 z-20 bg-amber-50/95 backdrop-blur-md border-b border-amber-100 px-4 py-3 flex items-start gap-3 justify-center"
          >
            <ShieldAlert className="text-amber-600 flex-shrink-0 mt-0.5" size={16} />
            <div className="text-xs sm:text-sm text-amber-800 text-center">
              <span className="font-semibold block sm:inline mr-1">Support is available.</span>
              <span className="opacity-90">If you are in crisis, please seek immediate help. </span>
              {onViewSupport && (
                <button onClick={onViewSupport} className="underline font-semibold text-amber-900 hover:text-amber-700 transition-colors">
                  View support resources →
                </button>
              )}
            </div>
            <button onClick={() => setShowSafetyBanner(false)} className="absolute right-4 top-1/2 -translate-y-1/2 text-amber-400 hover:text-amber-700">
              <span className="sr-only">Dismiss</span>
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M18 6 6 18" />
                <path d="m6 6 18 18" />
              </svg>
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex-1 overflow-y-auto pt-20 pb-40 px-4 sm:px-0">
        <div className="max-w-3xl mx-auto space-y-8 sm:space-y-10">
          {loading ? (
            <div className="text-center py-12 text-stone-400 dark:text-stone-500">Loading...</div>
          ) : error && messages.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-rose-500 dark:text-rose-400 mb-4">{error}</p>
              <p className="text-stone-500 dark:text-stone-400 text-sm">Please log in and try again.</p>
            </div>
          ) : messages.length === 0 ? (
            <div className="text-center py-12 text-stone-500 dark:text-stone-400">
              <p className="font-medium">Start a conversation</p>
              <p className="text-sm mt-1">Share what's on your mind. I'm here to listen.</p>
            </div>
          ) : (
            messages.map((message) => (
              <motion.div
                key={message.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4 }}
                className={cn('group flex w-full', message.role === 'user' ? 'justify-end' : 'justify-start')}
              >
                <div className={cn('flex gap-4 max-w-[90%] sm:max-w-[85%] relative', message.role === 'user' ? 'flex-row-reverse' : 'flex-row')}>
                  <div className={cn('w-8 h-8 rounded-full flex items-center justify-center shrink-0 mt-1', message.role === 'assistant' ? 'bg-teal-50 dark:bg-teal-900/30 text-teal-600 dark:text-teal-400' : 'bg-stone-100 dark:bg-stone-700 text-stone-500 dark:text-stone-400')}>
                    {message.role === 'assistant' ? <Sparkles size={14} /> : <div className="w-2 h-2 rounded-full bg-stone-400" />}
                  </div>
                  <div className={cn('flex-1 min-w-0', message.role === 'user' ? 'text-right' : 'text-left')}>
                    {editingMessageId === message.id ? (
                      <div className="bg-stone-50 dark:bg-stone-800 p-3 rounded-2xl border border-teal-200 dark:border-teal-700 ring-1 ring-teal-100 dark:ring-teal-800 shadow-sm w-full">
                        <textarea
                          ref={editInputRef}
                          value={editValue}
                          onChange={(e) => setEditValue(e.target.value)}
                          className="w-full bg-transparent border-none focus:ring-0 p-0 text-[15px] sm:text-base leading-relaxed text-stone-800 dark:text-stone-100 resize-none font-medium"
                          rows={1}
                        />
                        <div className="flex justify-end gap-2 mt-2">
                          <button onClick={cancelEditing} className="p-1.5 text-stone-400 dark:text-stone-500 hover:text-stone-600 dark:hover:text-stone-300 hover:bg-stone-200/50 dark:hover:bg-stone-600/50 rounded-full transition-colors">
                            <X size={14} />
                          </button>
                          <button onClick={() => saveEdit(message.id)} className="p-1.5 bg-teal-500 text-white rounded-full hover:bg-teal-600 transition-colors shadow-sm">
                            <Check size={14} />
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="relative group/message">
                        <div className={cn('text-[15px] sm:text-base leading-relaxed whitespace-pre-wrap', message.role === 'user' ? 'text-stone-700 dark:text-stone-200 font-medium' : 'text-stone-600 dark:text-stone-300 font-normal')}>
                          {message.content.includes('[FILE:') ? renderMessageContent(message.content) : message.content}
                        </div>

                        {message.role === 'user' && (
                          <button onClick={() => startEditing(message)} className="absolute top-0 -left-8 p-1.5 text-stone-300 dark:text-stone-600 hover:text-stone-500 dark:hover:text-stone-400 opacity-0 group-hover/message:opacity-100 transition-opacity" title="Edit">
                            <Pencil size={12} />
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            ))
          )}

          {isTyping && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex gap-4 max-w-3xl mx-auto w-full px-4 sm:px-0">
              <div className="w-8 h-8 rounded-full bg-teal-50 dark:bg-teal-900/30 text-teal-600 dark:text-teal-400 flex items-center justify-center shrink-0 mt-1">
                <Sparkles size={14} />
              </div>
              <div className="flex items-center gap-1.5 mt-2.5">
                <span className="w-1.5 h-1.5 bg-stone-300 dark:bg-stone-600 rounded-full animate-bounce [animation-delay:-0.3s]"></span>
                <span className="w-1.5 h-1.5 bg-stone-300 dark:bg-stone-600 rounded-full animate-bounce [animation-delay:-0.15s]"></span>
                <span className="w-1.5 h-1.5 bg-stone-300 dark:bg-stone-600 rounded-full animate-bounce"></span>
              </div>
            </motion.div>
          )}
          <div ref={messagesEndRef} className="h-4" />
        </div>
      </div>

      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-white via-white to-transparent dark:from-stone-950 dark:via-stone-950 dark:to-transparent pt-10 pb-6 px-4">
        <div className="max-w-3xl mx-auto relative">
          {/* Hidden file input */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*,.pdf,.doc,.docx,.txt,.csv,.xls,.xlsx"
            onChange={handleFileSelect}
            className="hidden"
          />
          <div className="relative bg-stone-50 hover:bg-stone-100 dark:bg-stone-800 dark:hover:bg-stone-700 transition-colors rounded-3xl border border-stone-200/60 dark:border-stone-600 shadow-sm focus-within:shadow-md focus-within:border-stone-300 dark:focus-within:border-stone-500 focus-within:ring-1 focus-within:ring-stone-200 dark:focus-within:ring-stone-600">
            {/* Attachment preview strip */}
            <AnimatePresence>
              {attachedFile && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="overflow-hidden"
                >
                  <div className="flex items-center gap-3 px-4 pt-3 pb-1">
                    {isImageType(attachedFile.type) ? (
                      <img
                        src={attachedFile.dataUrl}
                        alt={attachedFile.name}
                        className="w-14 h-14 rounded-xl object-cover border border-stone-200 dark:border-stone-600 shadow-sm"
                      />
                    ) : (
                      <div className="w-14 h-14 rounded-xl bg-violet-50 dark:bg-violet-900/30 border border-violet-200 dark:border-violet-700 flex items-center justify-center">
                        <FileText size={22} className="text-violet-500" />
                      </div>
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-stone-700 dark:text-stone-200 truncate">{attachedFile.name}</p>
                      <p className="text-[11px] text-stone-400 dark:text-stone-500">{formatFileSize(attachedFile.size)}</p>
                    </div>
                    <button
                      onClick={removeAttachment}
                      className="p-1.5 text-stone-400 dark:text-stone-500 hover:text-stone-600 dark:hover:text-stone-300 hover:bg-stone-200/50 dark:hover:bg-stone-600/50 rounded-full transition-colors shrink-0"
                      title="Remove attachment"
                    >
                      <X size={16} />
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className={cn(
                'absolute left-2 bottom-2 p-2 rounded-full hover:bg-stone-200/50 dark:hover:bg-stone-600/50 transition-colors z-10',
                attachedFile ? 'text-teal-600 dark:text-teal-400' : 'text-stone-400 dark:text-stone-500 hover:text-stone-600 dark:hover:text-stone-300'
              )}
              title="Attach files"
            >
              <Paperclip size={20} />
            </button>
            <textarea
              ref={textareaRef}
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Type whatever is on your mind..."
              rows={1}
              className="w-full pl-12 pr-14 py-4 bg-transparent border-none focus:ring-0 resize-none max-h-[200px] text-stone-800 dark:text-stone-100 placeholder:text-stone-400 dark:placeholder:text-stone-500 text-base"
              style={{ minHeight: '56px' }}
            />
            <div className="absolute right-2 bottom-2 flex items-center gap-1">
              {sttSupported && (
                <button
                  type="button"
                  onClick={toggleListening}
                  className={cn(
                    'p-2 rounded-full transition-colors',
                    isListening
                      ? 'text-teal-600 dark:text-teal-400 bg-teal-50 dark:bg-teal-900/30 animate-pulse'
                      : 'text-stone-400 dark:text-stone-500 hover:text-stone-600 dark:hover:text-stone-300 hover:bg-stone-200/50 dark:hover:bg-stone-600/50'
                  )}
                  title={isListening ? 'Stop listening' : 'Use voice'}
                >
                  {isListening ? <MicOff size={20} /> : <Mic size={20} />}
                </button>
              )}

              {(inputValue.trim() || attachedFile) && (
                <button onClick={() => handleSendMessage()} className="p-2 bg-stone-800 dark:bg-teal-600 text-white rounded-full hover:bg-stone-700 dark:hover:bg-teal-500 transition-all shadow-sm" title="Send">
                  <Send size={16} />
                </button>
              )}
            </div>
          </div>
          <p className="text-center text-[10px] text-stone-300 dark:text-stone-600 mt-3">Medi-Care AI can make mistakes. Consider checking important information.</p>
        </div>
      </div>

    </div>
  );
}
