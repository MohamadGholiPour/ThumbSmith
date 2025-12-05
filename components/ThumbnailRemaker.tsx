import React, { useState, useRef } from 'react';
import { improveThumbnailConcept, generateThumbnailImage } from '../services/geminiService';
import { Loader2, Upload, Wand2, Sparkles, AlertCircle, PlayCircle, RefreshCw, Save, Sliders, Zap } from 'lucide-react';
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
      
      {!preview ? (
         <div className="glass-panel rounded-3xl p-16 text-center border-dashed border-2 border-white/10 hover:border-indigo-500/50 transition-all group cursor-pointer" onClick={() => fileInputRef.current?.click()}>
            <div className="w-20 h-20 bg-white/5 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:rotate-6 transition-transform">
               <Upload className="w-8 h-8 text-slate-300 group-hover:text-indigo-400 transition-colors" />
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">{t.uploadTitle}</h2>
            <p className="text-slate-400">{t.remakeDesc}</p>
            <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleFileChange} />
         </div>
      ) : (
         <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            
            {/* Left: Original & Controls */}
            <div className="lg:col-span-5 space-y-6">
                <div className="relative rounded-2xl overflow-hidden shadow-2xl border border-white/10 group">
                   <img src={preview} alt="Original" className="w-full object-cover opacity-80 group-hover:opacity-100 transition-opacity" />
                   <div className="absolute top-4 left-4 bg-black/60 px-3 py-1 rounded-full text-[10px] font-bold text-white backdrop-blur uppercase tracking-wider">{t.original}</div>
                   <button 
                     onClick={() => { setFile(null); setPreview(null); setAnalysisResult(null); setGeneratedImage(null); }}
                     className="absolute top-4 right-4 bg-white/10 hover:bg-red-500 text-white p-1.5 rounded-full transition-colors backdrop-blur"
                   >
                     <RefreshCw className="w-4 h-4" />
                   </button>
                </div>

                {!analysisResult && (
                   <div className="glass-panel p-6 rounded-3xl space-y-6">
                      <div className="flex items-center gap-2 text-xs font-bold text-slate-400 uppercase tracking-widest border-b border-white/5 pb-2">
                         <Sliders className="w-4 h-4" /> {t.creativityLevel}
                      </div>
                      <div className="space-y-3">
                        {creativityOptions.map(opt => (
                           <button
                             key={opt.id}
                             onClick={() => setCreativityLevel(opt.id)}
                             className={`w-full text-left px-5 py-4 rounded-xl border transition-all ${creativityLevel === opt.id ? 'bg-indigo-600 border-indigo-500 text-white shadow-lg' : 'bg-white/5 border-transparent text-slate-400 hover:bg-white/10'}`}
                           >
                              <div className="text-sm font-bold">{opt.label}</div>
                              <div className="text-xs opacity-70 mt-0.5">{opt.desc}</div>
                           </button>
                        ))}
                      </div>
                      <button
                        onClick={handleAnalyze}
                        disabled={isAnalyzing}
                        className="w-full bg-white text-black hover:bg-slate-200 py-4 rounded-xl font-bold flex items-center justify-center gap-2 shadow-lg transition-all"
                      >
                        {isAnalyzing ? <Loader2 className="w-5 h-5 animate-spin" /> : <Sparkles className="w-5 h-5 text-indigo-600" />}
                        <span>{isAnalyzing ? t.analyzing : "Critique & Improve"}</span>
                      </button>
                   </div>
                )}
            </div>

            {/* Right: Analysis & Result */}
            <div className="lg:col-span-7">
               {!analysisResult ? (
                  <div className="h-full glass-panel rounded-3xl border-dashed border-2 border-white/5 flex flex-col items-center justify-center text-slate-600 p-12 min-h-[400px]">
                     <Wand2 className="w-12 h-12 opacity-20 mb-4" />
                     <p className="text-sm">Analysis results will appear here</p>
                  </div>
               ) : (
                  <div className="space-y-6 animate-[slide-in-from-right_0.5s_ease-out]">
                     {/* Critique */}
                     <div className="glass-card p-6 rounded-2xl border-l-4 border-l-red-500">
                        <h4 className="flex items-center gap-2 text-red-400 font-bold text-xs uppercase tracking-wider mb-2">
                           <AlertCircle className="w-4 h-4" /> {t.critique}
                        </h4>
                        <p className="text-slate-300 text-sm leading-relaxed">{analysisResult.critique}</p>
                     </div>

                     {/* Concept */}
                     <div className="glass-card p-6 rounded-2xl border-l-4 border-l-emerald-500">
                        <h4 className="flex items-center gap-2 text-emerald-400 font-bold text-xs uppercase tracking-wider mb-2">
                           <Zap className="w-4 h-4" /> {t.improvedPrompt}
                        </h4>
                        <p className="text-slate-300 text-sm leading-relaxed font-mono bg-black/30 p-4 rounded-lg">{analysisResult.improvedPrompt}</p>
                     </div>

                     {!generatedImage ? (
                        <button
                           onClick={handleGenerateRemake}
                           disabled={isGenerating}
                           className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-6 rounded-2xl shadow-xl transition-all flex items-center justify-center gap-3"
                        >
                           {isGenerating ? <Loader2 className="w-6 h-6 animate-spin" /> : <PlayCircle className="w-6 h-6" />}
                           <span className="text-lg">{isGenerating ? t.generatingImage : t.visualizeRemake}</span>
                        </button>
                     ) : (
                        <div className="relative rounded-2xl overflow-hidden shadow-2xl border border-emerald-500/30 group animate-[zoom-in_0.5s]">
                           <div className="absolute top-4 left-4 bg-emerald-600 text-white px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider shadow-lg z-10">{t.remake}</div>
                           <img src={generatedImage} className="w-full h-full object-cover" alt="Remake" />
                           <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end justify-end p-6">
                              <a href={generatedImage} download="remake.png" className="bg-white text-black p-3 rounded-xl hover:scale-110 transition-transform">
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
  );
};

export default ThumbnailRemaker;