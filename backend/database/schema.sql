-- =====================================================
-- MEDI-CARE DATABASE SCHEMA
-- Mental Wellness Support System
-- =====================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =====================================================
-- USERS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS public.users (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT UNIQUE NOT NULL,
    full_name TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    last_login_at TIMESTAMPTZ,
    is_active BOOLEAN DEFAULT TRUE
);

-- =====================================================
-- CONVERSATIONS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS public.conversations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL DEFAULT 'New Conversation',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    last_message_at TIMESTAMPTZ DEFAULT NOW(),
    is_archived BOOLEAN DEFAULT FALSE
);

-- =====================================================
-- MESSAGES TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS public.messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    conversation_id UUID NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
    role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
    content TEXT NOT NULL,
    risk_level TEXT CHECK (risk_level IN ('normal', 'moderate', 'high', 'critical')),
    risk_score DECIMAL(3, 2),
    was_escalated BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- MOOD ENTRIES TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS public.mood_entries (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    conversation_id UUID REFERENCES public.conversations(id) ON DELETE SET NULL,
    mood TEXT NOT NULL CHECK (mood IN ('excellent', 'good', 'neutral', 'low', 'poor')),
    intensity INTEGER NOT NULL CHECK (intensity >= 1 AND intensity <= 10),
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- INSIGHTS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS public.insights (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    type TEXT NOT NULL CHECK (type IN ('mood_pattern', 'conversation_summary', 'recommendation', 'progress')),
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    data JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- CRISIS LOGS TABLE (CRITICAL FOR SAFETY)
-- =====================================================
CREATE TABLE IF NOT EXISTS public.crisis_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    conversation_id UUID REFERENCES public.conversations(id) ON DELETE SET NULL,
    message_id UUID REFERENCES public.messages(id) ON DELETE SET NULL,
    risk_level TEXT NOT NULL CHECK (risk_level IN ('high', 'critical')),
    risk_score DECIMAL(3, 2) NOT NULL,
    detected_keywords TEXT[],
    user_message TEXT NOT NULL,
    response_sent TEXT,
    email_sent BOOLEAN DEFAULT FALSE,
    email_sent_at TIMESTAMPTZ,
    support_contacted BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    resolved_at TIMESTAMPTZ,
    notes TEXT
);

-- =====================================================
-- USER SETTINGS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS public.user_settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID UNIQUE NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    theme TEXT NOT NULL DEFAULT 'system' CHECK (theme IN ('light', 'dark', 'system')),
    notifications_enabled BOOLEAN DEFAULT TRUE,
    email_notifications BOOLEAN DEFAULT FALSE,
    voice_enabled BOOLEAN DEFAULT TRUE,
    crisis_contacts TEXT[],
    privacy_mode BOOLEAN DEFAULT FALSE,
    data_retention_days INTEGER DEFAULT 90,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- SUPPORT RESOURCES TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS public.support_resources (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('helpline', 'professional', 'hospital', 'crisis_center')),
    description TEXT,
    phone TEXT,
    email TEXT,
    website TEXT,
    address TEXT,
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),
    country_code TEXT DEFAULT 'US',
    is_24_7 BOOLEAN DEFAULT FALSE,
    is_free BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- DAILY QUOTES TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS public.daily_quotes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    quote TEXT NOT NULL,
    author TEXT,
    category TEXT CHECK (category IN ('motivation', 'comfort', 'strength', 'hope', 'resilience')),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- VOICE SESSIONS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS public.voice_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    conversation_id UUID REFERENCES public.conversations(id) ON DELETE SET NULL,
    duration_seconds INTEGER,
    transcript TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- INDEXES FOR PERFORMANCE
-- =====================================================
CREATE INDEX IF NOT EXISTS idx_conversations_user_id ON public.conversations(user_id);
CREATE INDEX IF NOT EXISTS idx_conversations_last_message ON public.conversations(last_message_at DESC);
CREATE INDEX IF NOT EXISTS idx_messages_conversation_id ON public.messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON public.messages(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_messages_risk_level ON public.messages(risk_level) WHERE risk_level IN ('high', 'critical');
CREATE INDEX IF NOT EXISTS idx_mood_entries_user_id ON public.mood_entries(user_id);
CREATE INDEX IF NOT EXISTS idx_mood_entries_created_at ON public.mood_entries(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_crisis_logs_user_id ON public.crisis_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_crisis_logs_created_at ON public.crisis_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_crisis_logs_resolved ON public.crisis_logs(resolved_at) WHERE resolved_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_insights_user_id ON public.insights(user_id);
CREATE INDEX IF NOT EXISTS idx_support_resources_type ON public.support_resources(type);
CREATE INDEX IF NOT EXISTS idx_support_resources_location ON public.support_resources(latitude, longitude);

-- =====================================================
-- TRIGGERS FOR AUTO-UPDATING TIMESTAMPS
-- =====================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_users_updated_at
    BEFORE UPDATE ON public.users
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_conversations_updated_at
    BEFORE UPDATE ON public.conversations
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_settings_updated_at
    BEFORE UPDATE ON public.user_settings
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_support_resources_updated_at
    BEFORE UPDATE ON public.support_resources
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- FUNCTION TO HANDLE NEW USER SIGNUP
-- =====================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.users (id, email, full_name)
    VALUES (
        NEW.id,
        NEW.email,
        NEW.raw_user_meta_data->>'full_name'
    );
    
    INSERT INTO public.user_settings (user_id)
    VALUES (NEW.id);
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_user();

-- =====================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- =====================================================

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mood_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.insights ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.crisis_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.voice_sessions ENABLE ROW LEVEL SECURITY;

-- Users policies
CREATE POLICY "Users can view own profile" ON public.users FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON public.users FOR UPDATE USING (auth.uid() = id);

-- Conversations policies
CREATE POLICY "Users can view own conversations" ON public.conversations FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create own conversations" ON public.conversations FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own conversations" ON public.conversations FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own conversations" ON public.conversations FOR DELETE USING (auth.uid() = user_id);

-- Messages policies
CREATE POLICY "Users can view messages in own conversations" ON public.messages
    FOR SELECT USING (EXISTS (SELECT 1 FROM public.conversations WHERE conversations.id = messages.conversation_id AND conversations.user_id = auth.uid()));

CREATE POLICY "Users can create messages in own conversations" ON public.messages
    FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM public.conversations WHERE conversations.id = messages.conversation_id AND conversations.user_id = auth.uid()));

-- Mood entries policies
CREATE POLICY "Users can view own mood entries" ON public.mood_entries FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create own mood entries" ON public.mood_entries FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own mood entries" ON public.mood_entries FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own mood entries" ON public.mood_entries FOR DELETE USING (auth.uid() = user_id);

-- Insights policies
CREATE POLICY "Users can view own insights" ON public.insights FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own insights" ON public.insights FOR DELETE USING (auth.uid() = user_id);

-- Crisis logs policies
CREATE POLICY "Users can view own crisis logs" ON public.crisis_logs FOR SELECT USING (auth.uid() = user_id);

-- Settings policies
CREATE POLICY "Users can view own settings" ON public.user_settings FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update own settings" ON public.user_settings FOR UPDATE USING (auth.uid() = user_id);

-- Voice sessions policies
CREATE POLICY "Users can view own voice sessions" ON public.voice_sessions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create own voice sessions" ON public.voice_sessions FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Support resources are public
ALTER TABLE public.support_resources ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view support resources" ON public.support_resources FOR SELECT USING (true);

-- Daily quotes are public
ALTER TABLE public.daily_quotes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view daily quotes" ON public.daily_quotes FOR SELECT USING (is_active = true);

-- =====================================================
-- GRANT PERMISSIONS
-- =====================================================
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;

-- =====================================================
-- INSERT DEFAULT SUPPORT RESOURCES
-- =====================================================
INSERT INTO public.support_resources (name, type, description, phone, website, country_code, is_24_7, is_free) VALUES
('988 Suicide & Crisis Lifeline', 'helpline', 'Free 24/7 crisis support', '988', 'https://988lifeline.org', 'US', true, true),
('Crisis Text Line', 'helpline', 'Text HOME to 741741', '741741', 'https://www.crisistextline.org', 'US', true, true),
('NAMI Helpline', 'helpline', 'Mental health support and resources', '1-800-950-6264', 'https://www.nami.org', 'US', false, true),
('SAMHSA National Helpline', 'helpline', 'Substance abuse and mental health', '1-800-662-4357', 'https://www.samhsa.gov', 'US', true, true),
('The Trevor Project', 'helpline', 'LGBTQ+ youth crisis support', '1-866-488-7386', 'https://www.thetrevorproject.org', 'US', true, true),
('Veterans Crisis Line', 'helpline', 'Support for veterans and families', '988 (Press 1)', 'https://www.veteranscrisisline.net', 'US', true, true)
ON CONFLICT DO NOTHING;

-- =====================================================
-- INSERT DEFAULT DAILY QUOTES
-- =====================================================
INSERT INTO public.daily_quotes (quote, author, category) VALUES
('You are stronger than you think.', 'Unknown', 'strength'),
('One day at a time.', 'Unknown', 'resilience'),
('It''s okay to not be okay.', 'Unknown', 'comfort'),
('You are not alone in this journey.', 'Unknown', 'hope'),
('Small steps forward are still progress.', 'Unknown', 'motivation'),
('Your mental health matters.', 'Unknown', 'comfort'),
('Healing is not linear.', 'Unknown', 'resilience'),
('Be kind to yourself.', 'Unknown', 'comfort'),
('Tomorrow is a new day.', 'Unknown', 'hope'),
('You deserve support and care.', 'Unknown', 'strength')
ON CONFLICT DO NOTHING;

-- =====================================================
-- SUCCESS MESSAGE
-- =====================================================
DO $$ 
BEGIN 
    RAISE NOTICE '✅ Medi-Care database schema created successfully!';
    RAISE NOTICE '📊 Tables created: users, conversations, messages, mood_entries, insights, crisis_logs, user_settings, support_resources, daily_quotes, voice_sessions';
    RAISE NOTICE '🔒 Row Level Security enabled on all tables';
    RAISE NOTICE '🎯 Indexes created for optimal performance';
    RAISE NOTICE '✨ Default support resources and quotes inserted';
END $$;