import React, { useState, useRef } from 'react';
import { analyzeImageForPrompt } from '../services/geminiService';
import { Loader2, Upload, ArrowRight, Copy, Check, ScanEye, Palette, Layout, FileText, Image as ImageIcon } from 'lucide-react';
import Tooltip from './Tooltip';
import { translations } from '../utils/translations';
import { Language } from '../types';

interface Props {
  onPromptExtracted: (prompt: string) => void;
  language: Language;
}

const ImageAnalyzer: React.FC<Props> = ({ onPromptExtracted, language }) => {
  const t = translations[language];
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [resultPrompt, setResultPrompt] = useState('');
  const [copied, setCopied] = useState(false);
  const [focusMode, setFocusMode] = useState('Full Prompt');
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      setFile(selectedFile);
      setPreview(URL.createObjectURL(selectedFile));
      setResultPrompt(''); 
    }
  };

  const handleAnalyze = async () => {
    if (!file) return;
    setIsAnalyzing(true);
    try {
      const text = await analyzeImageForPrompt(file, focusMode);
      setResultPrompt(text);
    } catch (error) {
      alert("Analysis failed. Please try again.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(resultPrompt);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const focusOptions = [
    { id: 'Full Prompt', label: t.fullPrompt, icon: <FileText className="w-4 h-4"/> },
    { id: 'Composition', label: t.compositionOnly, icon: <Layout className="w-4 h-4"/> },
    { id: 'Color Palette', label: t.colorOnly, icon: <Palette className="w-4 h-4"/> },
  ];

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="bg-[#0f172a]/60 border border-slate-800/60 rounded-3xl p-8 backdrop-blur-2xl shadow-2xl overflow-hidden relative">
        <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-[80px] pointer-events-none"></div>

        {!preview ? (
            <div 
              className="border-2 border-dashed border-slate-700/50 rounded-2xl p-16 hover:border-indigo-500 hover:bg-slate-800/30 transition-all cursor-pointer group flex flex-col items-center justify-center text-center"
              onClick={() => fileInputRef.current?.click()}
            >
              <div className="w-20 h-20 bg-slate-800 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform shadow-xl shadow-black/20 group-hover:shadow-indigo-500/20">
                <Upload className="w-8 h-8 text-slate-400 group-hover:text-indigo-400" />
              </div>
              <h3 className="text-2xl font-bold text-white mb-2">{t.uploadTitle}</h3>
              <p className="text-slate-400 text-sm max-w-sm leading-relaxed">
                {t.uploadDesc}
              </p>
              <input 
                type="file" 
                ref={fileInputRef} 
                className="hidden" 
                accept="image/*" 
                onChange={handleFileChange}
              />
            </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
            <div className="space-y-4">
               <div className="relative group rounded-2xl overflow-hidden shadow-2xl ring-1 ring-white/10">
                 <img src={preview} alt="Upload Preview" className="w-full object-cover" />
                 <button 
                   onClick={() => { setFile(null); setPreview(null); setResultPrompt(''); }}
                   className="absolute top-2 right-2 bg-black/60 hover:bg-red-500 text-white p-2 rounded-full backdrop-blur transition-all"
                 >
                   <ScanEye className="w-4 h-4" />
                 </button>
               </div>
               
               <div className="bg-slate-900/50 p-4 rounded-xl border border-white/5 space-y-3">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">{t.analysisMode}</label>
                  <div className="grid grid-cols-1 gap-2">
                    {focusOptions.map(opt => (
                       <button
                         key={opt.id}
                         onClick={() => setFocusMode(opt.id)}
                         className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-bold transition-all ${focusMode === opt.id ? 'bg-indigo-600 text-white shadow-lg' : 'bg-slate-950 text-slate-400 hover:bg-slate-800'}`}
                       >
                          {opt.icon} {opt.label}
                          {focusMode === opt.id && <Check className="w-4 h-4 ml-auto" />}
                       </button>
                    ))}
                  </div>
               </div>

               <button
                   onClick={handleAnalyze}
                   disabled={isAnalyzing}
                   className="w-full bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white p-4 rounded-xl font-bold flex items-center justify-center gap-2 shadow-lg shadow-indigo-500/20 transition-all disabled:opacity-50"
                 >
                   {isAnalyzing ? <Loader2 className="w-5 h-5 animate-spin" /> : <ScanEye className="w-5 h-5" />}
                   <span>{isAnalyzing ? t.analyzing : t.reverseEngineer}</span>
               </button>
            </div>
            
            <div className="h-full flex flex-col">
              {resultPrompt ? (
                 <div className="bg-slate-950/80 border border-indigo-500/30 rounded-2xl p-6 relative flex-1 animate-in fade-in slide-in-from-right-4 shadow-inner">
                   <div className="flex items-center justify-between mb-4">
                     <h4 className="text-xs font-bold text-indigo-400 uppercase tracking-wider flex items-center gap-2">
                        <FileText className="w-4 h-4"/> {t.extractedPrompt}
                     </h4>
                     <div className="flex gap-2">
                        <button onClick={handleCopy} className="p-2 hover:bg-white/10 rounded-lg text-slate-400 hover:text-white transition-colors">
                           {copied ? <Check className="w-4 h-4 text-green-400"/> : <Copy className="w-4 h-4"/>}
                        </button>
                     </div>
                   </div>
                   <div className="overflow-y-auto max-h-[400px] pr-2 custom-scrollbar">
                      <p className="text-slate-300 text-sm leading-loose font-light" dir="ltr">{resultPrompt}</p>
                   </div>
                   <div className="pt-6 mt-4 border-t border-white/5">
                      <button 
                       onClick={() => onPromptExtracted(resultPrompt)}
                       className="w-full flex items-center justify-center gap-2 text-sm font-bold bg-indigo-500/20 hover:bg-indigo-500 text-indigo-300 hover:text-white px-4 py-3 rounded-xl transition-all border border-indigo-500/30"
                     >
                       {t.useInGenerator} <ArrowRight className="w-4 h-4 rtl:rotate-180" />
                     </button>
                   </div>
                 </div>
              ) : (
                 <div className="flex-1 border border-dashed border-slate-800 rounded-2xl flex flex-col items-center justify-center text-slate-600 p-8 min-h-[300px]">
                    <ImageIcon className="w-12 h-12 opacity-20 mb-4" />
                    <p className="text-sm">{t.uploadDesc}</p>
                 </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ImageAnalyzer;