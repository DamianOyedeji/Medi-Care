import React from 'react';
import { motion } from 'motion/react';
import { Shield, Trash2, LifeBuoy, AlertCircle, ChevronRight, ArrowLeft, Lock, Moon, Sun } from 'lucide-react';
import * as Switch from '@radix-ui/react-switch';
import { useTheme } from '../../contexts/ThemeContext';

interface SettingsProps {
    onBack: () => void;
    onViewSupport?: () => void;
}

export function Settings({ onBack, onViewSupport }: SettingsProps) {
    const [saveHistory, setSaveHistory] = React.useState(true);
    const { isDark, toggleDark } = useTheme();

    return (
        <div className="min-h-screen bg-stone-50 dark:bg-stone-900 py-8 px-4 sm:px-6 transition-colors">
            <div className="max-w-xl mx-auto space-y-8">
                {/* Header */}
                <header className="mb-8">
                    <button
                        onClick={onBack}
                        className="flex items-center gap-1.5 text-stone-500 hover:text-stone-700 dark:text-stone-400 dark:hover:text-stone-200 text-sm font-medium mb-4 transition-colors py-1"
                        title="Back"
                    >
                        <ArrowLeft size={18} />
                        Back
                    </button>
                    <div className="text-center">
                        <h1 className="text-3xl font-bold text-stone-800 dark:text-stone-100 mb-2 font-serif tracking-tight">Settings & Privacy</h1>
                        <p className="text-stone-500 dark:text-stone-400 font-medium">Manage your data and preferences.</p>
                    </div>
                </header>

                {/* Appearance */}
                <motion.section
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.05 }}
                    className="space-y-4"
                >
                    <h2 className="text-xs font-bold text-stone-400 uppercase tracking-wider px-2">Appearance</h2>
                    <div className="bg-white dark:bg-stone-800 rounded-3xl p-2 shadow-sm border border-stone-100 dark:border-stone-700 overflow-hidden">
                        <div className="flex items-center justify-between p-4">
                            <div className="flex items-center gap-3">
                                <div className="bg-violet-50 dark:bg-violet-900/40 text-violet-600 dark:text-violet-400 p-2.5 rounded-full">
                                    {isDark ? <Moon size={18} /> : <Sun size={18} />}
                                </div>
                                <div>
                                    <p className="font-semibold text-stone-700 dark:text-stone-200 text-sm">Dark Mode</p>
                                    <p className="text-xs text-stone-400 dark:text-stone-500">Switch between light and dark theme</p>
                                </div>
                            </div>
                            <Switch.Root
                                className="w-[44px] h-[26px] bg-stone-200 dark:bg-stone-600 rounded-full relative data-[state=checked]:bg-violet-500 outline-none cursor-pointer transition-colors"
                                id="dark-mode-toggle"
                                checked={isDark}
                                onCheckedChange={toggleDark}
                            >
                                <Switch.Thumb className="block w-[22px] h-[22px] bg-white rounded-full shadow-sm transition-transform duration-100 translate-x-0.5 will-change-transform data-[state=checked]:translate-x-[20px]" />
                            </Switch.Root>
                        </div>
                    </div>
                </motion.section>

                {/* Data & Privacy */}
                <motion.section
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="space-y-4"
                >
                    <h2 className="text-xs font-bold text-stone-400 uppercase tracking-wider px-2">Data & Privacy</h2>
                    <div className="bg-white dark:bg-stone-800 rounded-3xl p-2 shadow-sm border border-stone-100 dark:border-stone-700 overflow-hidden">
                        <div className="flex items-center justify-between p-4 border-b border-stone-50 dark:border-stone-700">
                            <div className="flex items-center gap-3">
                                <div className="bg-teal-50 dark:bg-teal-900/40 text-teal-600 dark:text-teal-400 p-2.5 rounded-full">
                                    <Lock size={18} />
                                </div>
                                <div>
                                    <p className="font-semibold text-stone-700 dark:text-stone-200 text-sm">Save conversation history</p>
                                    <p className="text-xs text-stone-400 dark:text-stone-500">Allow the app to remember past chats</p>
                                </div>
                            </div>
                            <Switch.Root
                                className="w-[44px] h-[26px] bg-stone-200 dark:bg-stone-600 rounded-full relative data-[state=checked]:bg-teal-500 outline-none cursor-pointer transition-colors"
                                id="save-history-mode"
                                checked={saveHistory}
                                onCheckedChange={setSaveHistory}
                            >
                                <Switch.Thumb className="block w-[22px] h-[22px] bg-white rounded-full shadow-sm transition-transform duration-100 translate-x-0.5 will-change-transform data-[state=checked]:translate-x-[20px]" />
                            </Switch.Root>
                        </div>
                        <div className="p-1">
                            <button className="w-full flex items-center justify-between group text-left p-3 hover:bg-rose-50/50 rounded-2xl transition-colors">
                                <div className="flex items-center gap-3">
                                    <div className="bg-stone-50 text-stone-400 p-2.5 rounded-full group-hover:bg-rose-100 group-hover:text-rose-500 transition-colors">
                                        <Trash2 size={18} />
                                    </div>
                                    <div>
                                        <p className="font-semibold text-stone-700 text-sm group-hover:text-rose-600 transition-colors">Delete all conversations</p>
                                        <p className="text-xs text-stone-400">Permanently remove all local data</p>
                                    </div>
                                </div>
                            </button>
                        </div>
                    </div>
                </motion.section>

                {/* Safety */}
                <motion.section
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="space-y-4"
                >
                    <h2 className="text-xs font-bold text-stone-400 uppercase tracking-wider px-2">Safety</h2>
                    <div className="bg-white dark:bg-stone-800 rounded-3xl p-2 shadow-sm border border-stone-100 dark:border-stone-700 overflow-hidden">
                        <button
                            onClick={onViewSupport}
                            className="w-full flex items-center justify-between p-4 border-b border-stone-50 dark:border-stone-700 hover:bg-stone-50 dark:hover:bg-stone-700 transition-colors rounded-t-2xl"
                        >
                            <div className="flex items-center gap-3">
                                <div className="bg-blue-50 text-blue-600 p-2.5 rounded-full">
                                    <LifeBuoy size={18} />
                                </div>
                                <span className="font-semibold text-stone-700 dark:text-stone-200 text-sm">View Support Resources</span>
                            </div>
                            <ChevronRight size={18} className="text-stone-300" />
                        </button>
                        <button
                            onClick={onViewSupport}
                            className="w-full flex items-center justify-between p-4 hover:bg-stone-50 dark:hover:bg-stone-700 transition-colors rounded-b-2xl"
                        >
                            <div className="flex items-center gap-3">
                                <div className="bg-orange-50 text-orange-600 p-2.5 rounded-full">
                                    <AlertCircle size={18} />
                                </div>
                                <span className="font-semibold text-stone-700 dark:text-stone-200 text-sm">Crisis Help Information</span>
                            </div>
                            <ChevronRight size={18} className="text-stone-300" />
                        </button>
                    </div>
                </motion.section>

                {/* About */}
                <motion.section
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="text-center pt-8 pb-4"
                >
                    <div className="bg-stone-100/50 dark:bg-stone-800/50 rounded-2xl p-6 mx-auto max-w-sm">
                        <div className="flex justify-center mb-3 text-teal-600/50">
                            <Shield size={24} />
                        </div>
                        <p className="text-xs text-stone-500 leading-relaxed">
                            <strong className="block text-stone-700 dark:text-stone-300 mb-1">Medi-Care v1.0</strong>
                            This app provides emotional support and wellness tools, not medical diagnosis or treatment. In an emergency, please contact professional services immediately.
                        </p>
                    </div>
                </motion.section>
            </div>
        </div>
    );
}
