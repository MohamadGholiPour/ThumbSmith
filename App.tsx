import React, { useState, useEffect } from 'react';
import { Tab, Language } from './types';
import PromptGenerator from './components/PromptGenerator';
import ImageAnalyzer from './components/ImageAnalyzer';
import ThumbnailRemaker from './components/ThumbnailRemaker';
import { Layout, Image as ImageIcon, Zap, Layers, Globe, Wand2, RefreshCw, Palette } from 'lucide-react';
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

  const NavTab = ({ id, icon, label, desc }: { id: Tab, icon: React.ReactNode, label: string, desc: string }) => (
    <button
      onClick={() => setActiveTab(id)}
      className={`relative flex-1 group overflow-hidden rounded-2xl p-4 transition-all duration-300 border ${
        activeTab === id 
          ? 'bg-indigo-600/20 border-indigo-500 shadow-[0_0_30px_rgba(99,102,241,0.2)]' 
          : 'bg-slate-900/40 border-slate-800/50 hover:bg-slate-800/60 hover:border-slate-700'
      }`}
    >
      <div className={`flex flex-col items-center justify-center gap-2 relative z-10 ${activeTab === id ? 'scale-105' : 'scale-100'} transition-transform`}>
        <div className={`p-3 rounded-xl transition-colors ${activeTab === id ? 'bg-indigo-500 text-white' : 'bg-slate-800 text-slate-400 group-hover:text-slate-200'}`}>
           {icon}
        </div>
        <div className="text-center">
          <h3 className={`font-bold text-sm md:text-base ${activeTab === id ? 'text-white' : 'text-slate-300'}`}>{label}</h3>
          <p className="text-[10px] md:text-xs text-slate-500 mt-1 line-clamp-1 opacity-80">{desc}</p>
        </div>
      </div>
      {activeTab === id && (
        <div className="absolute inset-0 bg-gradient-to-t from-indigo-500/10 to-transparent pointer-events-none"></div>
      )}
    </button>
  );

  return (
    <div className={`min-h-screen bg-[#020617] text-slate-200 font-sans selection:bg-indigo-500/30 overflow-x-hidden`}>
      {/* Decorative Background Elements - Aurora Effect */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute top-[-10%] left-[-10%] w-[60%] h-[60%] bg-indigo-900/20 rounded-full blur-[100px] animate-aurora-1 mix-blend-screen"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[60%] h-[60%] bg-purple-900/20 rounded-full blur-[100px] animate-aurora-2 mix-blend-screen"></div>
        <div className="absolute top-[40%] left-[30%] w-[40%] h-[40%] bg-emerald-900/05 rounded-full blur-[120px] animate-pulse"></div>
      </div>

      {/* Header */}
      <header className="relative z-50 pt-6 pb-2 px-4">
        <div className="max-w-5xl mx-auto flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/20">
               <Zap className="w-6 h-6 text-white fill-white" />
            </div>
            <div className="flex flex-col">
              <h1 className="text-2xl font-black bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-400 tracking-tight leading-none">
                {t.appTitle}
              </h1>
              <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-0.5">AI Thumbnail Suite</span>
            </div>
          </div>
          
          <button 
             onClick={() => setLanguage(language === 'en' ? 'fa' : 'en')}
             className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-900/80 border border-slate-700 hover:border-indigo-500 hover:text-white transition-all text-xs font-bold text-slate-400 shadow-lg"
           >
             <Globe className="w-4 h-4" />
             {language === 'en' ? 'فارسی' : 'English'}
           </button>
        </div>

        {/* MAIN NAVIGATION - BIG & BETTER PLACED */}
        <div className="max-w-3xl mx-auto flex flex-row gap-3 md:gap-6 mb-8">
          <NavTab id={Tab.GENERATOR} icon={<Layers className="w-5 h-5 md:w-6 md:h-6"/>} label={t.navGenerator} desc="Create from scratch" />
          <NavTab id={Tab.ANALYZER} icon={<Wand2 className="w-5 h-5 md:w-6 md:h-6"/>} label={t.navAnalyzer} desc="Reverse engineer" />
          <NavTab id={Tab.REMAKER} icon={<RefreshCw className="w-5 h-5 md:w-6 md:h-6"/>} label={t.navRemaker} desc="Fix & Upgrade" />
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 pb-12 relative z-10 min-h-[60vh]">
        
        {activeTab === Tab.GENERATOR && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <PromptGenerator 
              onImageGenerated={handleImageGenerated} 
              initialPrompt={seededPrompt} 
              language={language}
            />
          </div>
        )}

        {activeTab === Tab.ANALYZER && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <ImageAnalyzer 
              onPromptExtracted={handleUseExtractedPrompt} 
              language={language}
            />
          </div>
        )}

        {activeTab === Tab.REMAKER && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
             <ThumbnailRemaker language={language} />
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800/30 py-8 text-center text-slate-600 text-xs relative z-10">
        <p>{t.footer}</p>
      </footer>
    </div>
  );
};

export default App;