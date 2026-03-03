import React from 'react';
import { motion } from 'motion/react';
import { Button } from './Button';
import { MessageCircle, Heart, Sparkles } from 'lucide-react';
import { ImageWithFallback } from './figma/ImageWithFallback';

interface HeroProps {
  onStartChat: () => void;
  onSupportClick: () => void;
}

export function Hero({ onStartChat, onSupportClick }: HeroProps) {
  return (
    <section className="relative pt-16 pb-8 md:pt-24 md:pb-16 overflow-hidden">
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-teal-50 via-stone-50 to-white opacity-70"></div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid md:grid-cols-2 gap-8 items-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="max-w-2xl"
          >
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-50 text-teal-700 text-sm font-medium mb-6">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-teal-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-teal-500"></span>
              </span>
              AI-Powered Support 24/7
            </div>

            <h1 className="text-4xl md:text-6xl font-bold tracking-tight text-stone-900 mb-6 leading-tight">
              Welcome <br />
      
            </h1>

            <p className="text-lg md:text-xl text-stone-600 mb-8 leading-relaxed max-w-lg">
              Experience safe, judgment-free emotional support guided by advanced AI. 
            </p>

            <div className="flex flex-col sm:flex-row gap-4">
              <Button size="lg" className="gap-2 group" onClick={onStartChat}>
                <MessageCircle size={20} className="group-hover:-translate-y-0.5 transition-transform" />
                Start Chat
              </Button>
              <Button variant="secondary" size="lg" className="gap-2" onClick={onSupportClick}>
                <Heart size={20} />
                Support
              </Button>
            </div>

          
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="relative"
          >
            <div className="relative aspect-[5/3] md:aspect-[5/3] rounded-3xl overflow-hidden shadow-2xl shadow-teal-100/50">
              <ImageWithFallback
                src="https://images.unsplash.com/photo-1710250379777-eda5bbefd6b6?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjYWxtJTIwcGVhY2VmdWwlMjBhYnN0cmFjdCUyMG5hdHVyZSUyMHNvZnQlMjBtaW5pbWFsJTIwd2hpdGUlMjBibHVlfGVufDF8fHx8MTc3MDM2NTQyOHww&ixlib=rb-4.1.0&q=80&w=1080"
                alt="Calm abstract nature"
                className="object-cover w-full h-full hover:scale-105 transition-transform duration-700"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-stone-900/10 to-transparent pointer-events-none"></div>
            </div>

            {/* Floating Card 1 */}
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
  );
}
