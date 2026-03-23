import React from 'react';
import { motion } from 'motion/react';
import { Button } from './Button';
import { MessageCircle, BarChart2, Sparkles, Heart, Shield, Brain } from 'lucide-react';
import { ImageWithFallback } from './figma/ImageWithFallback';

interface PublicLandingPageProps {
  onLogin: () => void;
  onSignUp: () => void;
}

export function PublicLandingPage({ onLogin, onSignUp }: PublicLandingPageProps) {
  const features = [
    {
      icon: <MessageCircle size={24} />,
      title: 'AI-Powered Chat',
      description: 'Have meaningful conversations with an AI companion that understands and supports you.',
      iconClassName: 'bg-teal-50 text-teal-600',
    },
    {
      icon: <Shield size={24} />,
      title: 'Safe & Private',
      description: 'Your conversations are encrypted and private. We prioritize confidentiality and safety.',
      iconClassName: 'bg-green-50 text-green-600',
    },
    {
      icon: <Brain size={24} />,
      title: 'Personalized Support',
      description: 'Get information on support resources and nearby centers that match your needs.',
      iconClassName: 'bg-purple-50 text-purple-600',
    },
  ];

  return (
    <div className="min-h-screen bg-white text-stone-900">
      {/* Public Navbar */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md border-b border-stone-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-2">
              <Heart className="text-teal-600" size={28} />
              <span className="text-xl font-bold text-stone-900">MediCare</span>
            </div>
            <div className="flex items-center gap-3">
              <Button variant="ghost" onClick={onLogin}>
                Log In
              </Button>
              <Button onClick={onSignUp}>
                Register
              </Button>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-20 pb-8 md:pt-24 md:pb-12 overflow-hidden">
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-teal-50 via-stone-50 to-white opacity-70"></div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 gap-8 items-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, ease: "easeOut" }}
              className="max-w-2xl"
            >
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-50 text-teal-700 text-sm font-medium mb-4">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-teal-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-teal-500"></span>
                </span>
                AI-Powered Support 24/7
              </div>

              <h1 className="text-4xl md:text-6xl font-bold tracking-tight text-stone-900 mb-4 leading-tight">
                Medi Care
              </h1>

              <p className="text-lg md:text-xl text-stone-600 mb-5 leading-relaxed max-w-lg">
                Experience support guided by advanced AI.
              </p>

         

              <div className="mt-4 flex items-center gap-4 text-sm text-stone-500">
                <div className="flex -space-x-2">
                  {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="w-8 h-8 rounded-full border-2 border-white bg-gradient-to-br from-teal-200 to-blue-200 flex items-center justify-center">
                      <span className="text-[10px] font-bold text-teal-700">U{i}</span>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="relative"
            >
              <div className="relative aspect-[4/3] md:aspect-[4/3] max-w-sm mx-auto rounded-3xl overflow-hidden shadow-2xl shadow-teal-100/50">
                <ImageWithFallback
                  src="https://images.unsplash.com/photo-1710250379777-eda5bbefd6b6?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjYWxtJTIwcGVhY2VmdWwlMjBhYnN0cmFjdCUyMG5hdHVyZSUyMHNvZnQlMjBtaW5pbWFsJTIwd2hpdGUlMjBibHVlfGVufDF8fHx8MTc3MDM2NTQyOHww&ixlib=rb-4.1.0&q=80&w=1080"
                  alt="Calm abstract nature"
                  className="object-cover w-full h-full hover:scale-105 transition-transform duration-700"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-stone-900/10 to-transparent pointer-events-none"></div>
              </div>

              {/* Floating Card */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5, duration: 0.6 }}
                className="absolute -bottom-6 -left-6 md:bottom-8 md:-left-8 bg-white p-4 rounded-2xl shadow-xl shadow-stone-200/50 max-w-[200px]"
              >
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center text-green-600">
                    <Sparkles size={14} />
                  </div>
                  <span className="text-sm font-semibold text-stone-800">Daily Check-in</span>
                </div>
                <p className="text-xs text-stone-500">"I'm feeling much more balanced today thanks to the breathing exercise."</p>
              </motion.div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-8 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-6"
          >
            <h2 className="text-3xl md:text-4xl font-bold text-stone-900 mb-4">
              Everything you need for mental wellness
            </h2>
            <p className="text-lg text-stone-600 max-w-2xl mx-auto">
              A comprehensive platform designed to support your emotional well-being every step of the way.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-6">
            {features.map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                className="bg-stone-50 rounded-2xl p-6 hover:shadow-lg transition-shadow"
              >
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 ${feature.iconClassName}`}>
                  {feature.icon}
                </div>
                <h3 className="text-xl font-semibold text-stone-900 mb-2">{feature.title}</h3>
                <p className="text-stone-600">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-stone-50 text-stone-500 py-8 border-t border-stone-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-8 mb-6">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <Heart className="text-teal-600" size={24} />
                <span className="text-lg font-bold text-stone-900">MediCare</span>
              </div>
              <p className="text-sm">
                Your trusted companion for mental wellness and emotional support.
              </p>
            </div>
           
            <div>

            </div>

          </div>
          <div className="border-t border-stone-200 pt-6 text-sm text-center">
            <p>© {new Date().getFullYear()} MediCare. All rights reserved.</p>
            <p className="mt-2 text-xs">
              If you're experiencing a mental health emergency, please call your local emergency services or crisis hotline immediately.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
