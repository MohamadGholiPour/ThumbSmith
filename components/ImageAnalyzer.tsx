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
    <div className="max-w-5xl mx-auto space-y-8">
      
      {!preview ? (
        <div className="glass-panel rounded-3xl p-12 text-center border-dashed border-2 border-white/10 hover:border-indigo-500/50 transition-all group cursor-pointer" onClick={() => fileInputRef.current?.click()}>
           <div className="w-24 h-24 bg-gradient-to-tr from-indigo-500/20 to-purple-500/20 rounded-full flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform">
              <Upload className="w-10 h-10 text-indigo-400" />
           </div>
           <h2 className="text-3xl font-bold text-white mb-3">{t.uploadTitle}</h2>
           <p className="text-slate-400 max-w-md mx-auto">{t.uploadDesc}</p>
           <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleFileChange} />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
           {/* Left: Control Panel */}
           <div className="md:col-span-5 space-y-6">
              <div className="relative rounded-2xl overflow-hidden shadow-2xl border border-white/10 group">
                 <img src={preview} alt="Preview" className="w-full object-cover" />
                 <button onClick={() => {setFile(null); setPreview(null); setResultPrompt('')}} className="absolute top-4 right-4 bg-black/60 text-white p-2 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity backdrop-blur hover:bg-red-500">
                    <ScanEye className="w-4 h-4" />
                 </button>
              </div>

              <div className="glass-panel p-5 rounded-2xl space-y-4">
                 <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">{t.analysisMode}</label>
                 <div className="space-y-2">
                    {focusOptions.map(opt => (
                       <button
                         key={opt.id}
                         onClick={() => setFocusMode(opt.id)}
                         className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${focusMode === opt.id ? 'bg-indigo-600 text-white shadow-lg' : 'bg-white/5 text-slate-400 hover:bg-white/10'}`}
                       >
                          {opt.icon} {opt.label}
                          {focusMode === opt.id && <Check className="w-4 h-4 ml-auto" />}
                       </button>
                    ))}
                 </div>
                 <button
                   onClick={handleAnalyze}
                   disabled={isAnalyzing}
                   className="w-full bg-white text-black hover:bg-slate-200 font-bold py-4 rounded-xl flex items-center justify-center gap-2 mt-4"
                 >
                    {isAnalyzing ? <Loader2 className="w-5 h-5 animate-spin"/> : <ScanEye className="w-5 h-5"/>}
                    {isAnalyzing ? t.analyzing : t.reverseEngineer}
                 </button>
              </div>
           </div>

           {/* Right: Output */}
           <div className="md:col-span-7">
              {resultPrompt ? (
                 <div className="glass-card rounded-3xl h-full flex flex-col animate-[fade-in_0.5s]">
                    <div className="p-6 border-b border-white/5 flex items-center justify-between">
                       <h3 className="text-sm font-bold text-white flex items-center gap-2"><FileText className="w-4 h-4 text-indigo-400"/> {t.extractedPrompt}</h3>
                       <button onClick={handleCopy} className="text-slate-400 hover:text-white p-2">{copied ? <Check className="w-4 h-4"/> : <Copy className="w-4 h-4"/>}</button>
                    </div>
                    <div className="p-8 flex-1">
                       <p className="text-slate-300 leading-relaxed font-light whitespace-pre-wrap">{resultPrompt}</p>
                    </div>
                    <div className="p-6 border-t border-white/5">
                       <button onClick={() => onPromptExtracted(resultPrompt)} className="w-full bg-indigo-600 hover:bg-indigo-500 text-white py-4 rounded-xl font-bold flex items-center justify-center gap-2 transition-all">
                          {t.useInGenerator} <ArrowRight className="w-4 h-4 rtl:rotate-180"/>
                       </button>
                    </div>
                 </div>
              ) : (
                 <div className="h-full glass-panel rounded-3xl flex flex-col items-center justify-center text-slate-600 p-8 border-dashed border-2 border-white/5">
                    <ScanEye className="w-16 h-16 opacity-20 mb-4" />
                    <p className="text-sm font-medium">Analysis results will appear here</p>
                 </div>
              )}
           </div>
        </div>
      )}
    </div>
  );
};

export default ImageAnalyzer;