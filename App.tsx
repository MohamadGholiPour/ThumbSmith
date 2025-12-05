import React, { useState, useEffect } from 'react';
import { Tab, Language } from './types';
import PromptGenerator from './components/PromptGenerator';
import ImageAnalyzer from './components/ImageAnalyzer';
import ThumbnailRemaker from './components/ThumbnailRemaker';
import { Layout, Zap, Layers, Globe, Wand2, RefreshCw, Sparkles } from 'lucide-react';
import { translations } from './utils/translations';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<Tab>(Tab.GENERATOR);
  const [seededPrompt, setSeededPrompt] = useState<string | undefined>(undefined);
  const [language, setLanguage] = useState<Language>('en');

  const t = translations[language];

  // Set direction based on language
  useEffect(() => {
    document.body.dir = language === 'fa' ? 'rtl' : 'ltr';
    document.documentElement.lang = language;
  }, [language]);

  const handleUseExtractedPrompt = (prompt: string) => {
    setSeededPrompt(prompt);
    setActiveTab(Tab.GENERATOR);
  };

  const handleImageGenerated = (url: string, prompt: string) => {
    console.log("Generated:", url);
  };

  const NavTab = ({ id, icon, label }: { id: Tab, icon: React.ReactNode, label: string }) => (
    <button
      onClick={() => setActiveTab(id)}
      className={`relative px-6 py-3 rounded-full flex items-center gap-2 transition-all duration-300 font-medium text-sm ${
        activeTab === id 
          ? 'bg-white text-black shadow-lg shadow-white/10 scale-105' 
          : 'text-slate-400 hover:text-white hover:bg-white/5'
      }`}
    >
      {icon}
      <span>{label}</span>
      {activeTab === id && (
        <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 bg-white rounded-full"></span>
      )}
    </button>
  );

  return (
    <div className="min-h-screen text-slate-200 font-sans selection:bg-indigo-500/30 overflow-x-hidden relative flex flex-col">
      
      {/* Dynamic Background */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-[-20%] left-[20%] w-[500px] h-[500px] bg-indigo-600/20 rounded-full blur-[128px] animate-pulse-slow"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[600px] h-[600px] bg-purple-900/10 rounded-full blur-[128px]"></div>
      </div>

      {/* Header */}
      <header className="relative z-50 pt-8 px-6">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-3 group cursor-pointer">
            <div className="relative w-10 h-10 flex items-center justify-center">
               <div className="absolute inset-0 bg-indigo-500 blur-lg opacity-40 group-hover:opacity-60 transition-opacity"></div>
               <div className="relative w-full h-full bg-gradient-to-br from-indigo-500 to-violet-600 rounded-xl flex items-center justify-center border border-white/10 shadow-xl">
                 <Zap className="w-5 h-5 text-white fill-white" />
               </div>
            </div>
            <div className="flex flex-col">
              <h1 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
                {t.appTitle} <span className="px-1.5 py-0.5 rounded text-[9px] bg-white/10 border border-white/5 text-slate-400 font-mono">v2.0</span>
              </h1>
            </div>
          </div>
          
          {/* Navigation Island */}
          <div className="glass-panel rounded-full p-1.5 flex gap-1 shadow-2xl">
            <NavTab id={Tab.GENERATOR} icon={<Layers className="w-4 h-4"/>} label={t.navGenerator} />
            <NavTab id={Tab.ANALYZER} icon={<Wand2 className="w-4 h-4"/>} label={t.navAnalyzer} />
            <NavTab id={Tab.REMAKER} icon={<RefreshCw className="w-4 h-4"/>} label={t.navRemaker} />
          </div>

          <button 
             onClick={() => setLanguage(language === 'en' ? 'fa' : 'en')}
             className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/5 border border-white/5 hover:bg-white/10 transition-all text-xs font-medium text-slate-400 hover:text-white"
           >
             <Globe className="w-3.5 h-3.5" />
             {language === 'en' ? 'FA' : 'EN'}
           </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 py-8 relative z-10">
        <div className="w-full">
          {activeTab === Tab.GENERATOR && (
            <div className="animate-[fade-in_0.5s_ease-out]">
              <PromptGenerator 
                onImageGenerated={handleImageGenerated} 
                initialPrompt={seededPrompt} 
                language={language}
              />
            </div>
          )}

          {activeTab === Tab.ANALYZER && (
            <div className="animate-[fade-in_0.5s_ease-out]">
              <ImageAnalyzer 
                onPromptExtracted={handleUseExtractedPrompt} 
                language={language}
              />
            </div>
          )}

          {activeTab === Tab.REMAKER && (
            <div className="animate-[fade-in_0.5s_ease-out]">
               <ThumbnailRemaker language={language} />
            </div>
          )}
        </div>
      </main>

      {/* Minimal Footer */}
      <footer className="relative z-10 border-t border-white/5 mt-auto bg-black/20 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-6 py-6 flex justify-between items-center text-xs text-slate-600">
           <p>{t.footer}</p>
           <div className="flex gap-4">
              <span className="flex items-center gap-1.5"><Sparkles className="w-3 h-3 text-indigo-500"/> Gemini 3 Pro</span>
           </div>
        </div>
      </footer>
    </div>
  );
};

export default App;