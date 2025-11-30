import React, { useState, useRef } from 'react';
import { improveThumbnailConcept, generateThumbnailImage } from '../services/geminiService';
import { Loader2, Upload, Wand2, Sparkles, AlertCircle, PlayCircle, ArrowRight, RefreshCw, Save, Sliders, Zap } from 'lucide-react';
import { translations } from '../utils/translations';
import { AspectRatio, Language } from '../types';

interface Props {
  language: Language;
}

const ThumbnailRemaker: React.FC<Props> = ({ language }) => {
  const t = translations[language];
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<{ critique: string; improvedPrompt: string } | null>(null);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [creativityLevel, setCreativityLevel] = useState('Subtle Polish');
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      setFile(selectedFile);
      setPreview(URL.createObjectURL(selectedFile));
      setAnalysisResult(null);
      setGeneratedImage(null);
    }
  };

  const handleAnalyze = async () => {
    if (!file) return;
    setIsAnalyzing(true);
    try {
      const result = await improveThumbnailConcept(file, creativityLevel);
      setAnalysisResult(result);
    } catch (error) {
      alert("Analysis failed.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleGenerateRemake = async () => {
    if (!analysisResult) return;
    setIsGenerating(true);
    try {
      const url = await generateThumbnailImage(analysisResult.improvedPrompt, AspectRatio.LANDSCAPE_16_9, '2K');
      setGeneratedImage(url);
    } catch (error) {
      alert("Generation failed.");
    } finally {
      setIsGenerating(false);
    }
  };

  const creativityOptions = [
    { id: 'Subtle Polish', label: t.subtlePolish, desc: "Fix lighting & quality" },
    { id: 'Extreme Makeover', label: t.extremeMakeover, desc: "Reimagine concept" },
  ];

  return (
    <div className="max-w-6xl mx-auto pb-20 space-y-8">
      
      {/* 1. UPLOAD SECTION */}
      <div className="bg-[#0f172a]/60 border border-slate-800/60 rounded-3xl p-8 backdrop-blur-2xl shadow-2xl">
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
                {t.remakeDesc}
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
          <div className="flex flex-col lg:flex-row gap-8 items-start">
             {/* Left Column: Input */}
             <div className="w-full lg:w-1/3 space-y-4">
                 <div className="relative aspect-video bg-black rounded-xl overflow-hidden border border-slate-700 shadow-xl group">
                    <img src={preview} alt="Original" className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity" />
                    <div className="absolute top-3 left-3 bg-black/60 backdrop-blur px-2 py-1 rounded text-[10px] font-bold text-white uppercase tracking-wider">{t.original}</div>
                    <button 
                      onClick={() => { setFile(null); setPreview(null); setAnalysisResult(null); setGeneratedImage(null); }}
                      className="absolute top-3 right-3 bg-red-500/80 hover:bg-red-500 text-white p-1 rounded-full transition-colors"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                    </button>
                 </div>

                 {!analysisResult && (
                   <div className="bg-slate-900/50 p-5 rounded-xl border border-white/5 space-y-4">
                      <div className="flex items-center gap-2 text-sm font-bold text-slate-300">
                         <Sliders className="w-4 h-4" /> {t.creativityLevel}
                      </div>
                      <div className="grid grid-cols-1 gap-2">
                        {creativityOptions.map(opt => (
                           <button
                             key={opt.id}
                             onClick={() => setCreativityLevel(opt.id)}
                             className={`text-left px-4 py-3 rounded-lg border transition-all ${creativityLevel === opt.id ? 'bg-indigo-600 border-indigo-500 text-white' : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-600'}`}
                           >
                              <div className="text-sm font-bold">{opt.label}</div>
                              <div className="text-[10px] opacity-70">{opt.desc}</div>
                           </button>
                        ))}
                      </div>
                      <button
                        onClick={handleAnalyze}
                        disabled={isAnalyzing}
                        className="w-full bg-indigo-600 hover:bg-indigo-500 text-white px-8 py-3 rounded-xl font-bold flex items-center justify-center gap-2 shadow-lg transition-all"
                      >
                        {isAnalyzing ? <Loader2 className="w-5 h-5 animate-spin" /> : <Sparkles className="w-5 h-5" />}
                        <span>{isAnalyzing ? t.analyzing : "Critique & Improve"}</span>
                      </button>
                   </div>
                 )}
             </div>

             {/* Right Column: Result */}
             <div className="flex-1 w-full">
                {!analysisResult ? (
                  <div className="h-full min-h-[300px] border-2 border-dashed border-slate-800 rounded-2xl flex flex-col items-center justify-center text-slate-600 space-y-4">
                     <Wand2 className="w-16 h-16 opacity-10" />
                     <p>{t.uploadDesc}</p>
                  </div>
                ) : (
                  <div className="space-y-6 animate-in fade-in slide-in-from-right-4">
                     {/* Critique Box */}
                     <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-6 backdrop-blur-sm">
                        <h4 className="flex items-center gap-2 text-red-400 font-bold text-sm uppercase tracking-wider mb-2">
                           <AlertCircle className="w-4 h-4" /> {t.critique}
                        </h4>
                        <p className="text-red-100/90 text-sm leading-relaxed">{analysisResult.critique}</p>
                     </div>

                     {/* Improved Prompt Box */}
                     <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-6 relative backdrop-blur-sm">
                        <h4 className="flex items-center gap-2 text-emerald-400 font-bold text-sm uppercase tracking-wider mb-2">
                           <Zap className="w-4 h-4" /> {t.improvedPrompt}
                        </h4>
                        <p className="text-emerald-100/90 text-sm leading-relaxed font-mono">{analysisResult.improvedPrompt}</p>
                     </div>

                     {!generatedImage ? (
                        <button
                           onClick={handleGenerateRemake}
                           disabled={isGenerating}
                           className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold py-5 rounded-2xl shadow-xl transition-all flex items-center justify-center gap-3 relative overflow-hidden group border-t border-emerald-400/30"
                        >
                           {isGenerating ? <Loader2 className="w-6 h-6 animate-spin" /> : <PlayCircle className="w-6 h-6 fill-current text-white/20" />}
                           <span className="text-lg">{isGenerating ? t.generatingImage : t.visualizeRemake}</span>
                        </button>
                     ) : (
                        <div className="mt-8 animate-in zoom-in-95 duration-500">
                           <h3 className="text-center text-lg font-bold text-white mb-4 flex items-center justify-center gap-3">
                              <span className="text-emerald-400 uppercase tracking-widest">{t.remake}</span>
                           </h3>
                           <div className="relative aspect-video rounded-2xl overflow-hidden border border-emerald-500/50 shadow-[0_0_50px_rgba(16,185,129,0.2)] group">
                              <img src={generatedImage} className="w-full h-full object-cover" alt="After" />
                              <a href={generatedImage} download="remake.png" className="absolute top-4 right-4 bg-black/60 hover:bg-black/90 text-white p-2.5 rounded-xl opacity-0 group-hover:opacity-100 transition-all backdrop-blur">
                                 <Save className="w-5 h-5" />
                              </a>
                           </div>
                        </div>
                     )}
                  </div>
                )}
             </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ThumbnailRemaker;