import React from 'react';
import { Shield, BrainCircuit, HeartHandshake } from 'lucide-react';
import { motion } from 'motion/react';

const features = [
  {
    title: "Safe Conversations",
    description: "Your privacy is our priority. Every chat is encrypted and anonymous, creating a secure space for you to open up.",
    icon: Shield,
    color: "bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400",
  },
  {
    title: "Emotional Insights",
    description: "Track your mood patterns and gain deeper understanding of your emotional well-being through AI-generated analysis.",
    icon: BrainCircuit,
    color: "bg-purple-50 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400",
  },
  {
    title: "Crisis Support",
    description: "Immediate resources and guidance when you need it most. We're here to help bridge the gap to professional help.",
    icon: HeartHandshake,
    color: "bg-rose-50 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400",
  },
];

export function Features() {
  return (
    <section className="py-24 bg-white dark:bg-stone-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <h2 className="text-3xl font-bold tracking-tight text-stone-900 dark:text-stone-100 sm:text-4xl mb-4">
            Designed for your peace of mind
          </h2>
          <p className="text-lg text-stone-600 dark:text-stone-300">
            Medi-Care combines advanced technology with human-centric design to support your journey.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1, duration: 0.5 }}
              className="p-8 rounded-3xl bg-stone-50 dark:bg-stone-800 hover:bg-white dark:hover:bg-stone-700 hover:shadow-xl hover:shadow-stone-200/40 dark:hover:shadow-stone-950/40 transition-all duration-300 border border-transparent hover:border-stone-100 dark:hover:border-stone-600 group"
            >
              <div className={`w-14 h-14 rounded-2xl ${feature.color} flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300`}>
                <feature.icon size={28} />
              </div>
              <h3 className="text-xl font-bold text-stone-900 dark:text-stone-100 mb-3">{feature.title}</h3>
              <p className="text-stone-600 dark:text-stone-300 leading-relaxed">
                {feature.description}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
