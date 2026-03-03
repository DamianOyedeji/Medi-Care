import React from 'react';
import { Sparkles, Heart } from 'lucide-react';

export function Footer() {
  return (
    <footer className="bg-stone-50 border-t border-stone-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-16">
        <div className="grid md:grid-cols-4 gap-8 mb-12">
          <div className="col-span-1 md:col-span-2">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 bg-teal-100 rounded-full flex items-center justify-center text-teal-600">
                <Sparkles size={18} />
              </div>
              <span className="font-bold text-xl tracking-tight text-stone-800">Medi-Care</span>
            </div>
            <p className="text-stone-500 max-w-sm mb-6">
              Making mental wellness accessible, safe, and intuitive for everyone. Your companion for a balanced life.
            </p>
          </div>
          
          <div>
            <h4 className="font-semibold text-stone-900 mb-4">Product</h4>
            <ul className="space-y-3 text-sm text-stone-600">
              <li><a href="#" className="hover:text-teal-600 transition-colors">Chat</a></li>
              <li><a href="#" className="hover:text-teal-600 transition-colors">Insights</a></li>
              <li><a href="#" className="hover:text-teal-600 transition-colors">Journaling</a></li>
              <li><a href="#" className="hover:text-teal-600 transition-colors">Crisis Support</a></li>
            </ul>
          </div>
          
          <div>
            <h4 className="font-semibold text-stone-900 mb-4">Company</h4>
            <ul className="space-y-3 text-sm text-stone-600">
              <li><a href="#" className="hover:text-teal-600 transition-colors">About Us</a></li>
              <li><a href="#" className="hover:text-teal-600 transition-colors">Privacy Policy</a></li>
              <li><a href="#" className="hover:text-teal-600 transition-colors">Terms of Service</a></li>
              <li><a href="#" className="hover:text-teal-600 transition-colors">Contact</a></li>
            </ul>
          </div>
        </div>
        
        <div className="pt-8 border-t border-stone-200 flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-stone-500">
          <p>&copy; {new Date().getFullYear()} Medi-Care AI. All rights reserved.</p>
          <div className="flex items-center gap-1">
             <span>Designed with</span>
             <Heart size={14} className="fill-red-400 text-red-400" />
             <span>for wellness.</span>
          </div>
        </div>

        <div className="mt-8 p-4 bg-stone-100 rounded-lg text-xs text-stone-400 text-center">
          <p>Disclaimer: Medi-Care is an AI-powered support tool and not a replacement for professional therapy or medical advice. In case of emergency, please contact your local emergency services.</p>
        </div>
      </div>
    </footer>
  );
}
