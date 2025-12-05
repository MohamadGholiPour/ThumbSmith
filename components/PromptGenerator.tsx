import React, { useState, useEffect, useRef } from 'react';
import { generateThumbnailPrompt, generateThumbnailImage, editThumbnailImage, getPinterestSuggestions, analyzeCharacterReference } from '../services/geminiService';
import { AspectRatio, GeneratedPrompt, ThumbnailElements, GeneratorPreset, ImageResolution, Language, TextPosition, TextColor } from '../types';
import { Loader2, Sparkles, Wand2, TrendingUp, Edit, Save, Settings2, ChevronDown, ChevronUp, XCircle, MonitorPlay, Layers, Focus, Sun, Palette, Maximize, Copy, Check, Gamepad2, Video, Monitor, Film, Search, Type, Aperture, Camera, Bookmark, Zap, MoreVertical, Smile, SunDim, Link as LinkIcon, PenTool, Upload, User, ArrowRight, GraduationCap } from 'lucide-react';
import Tooltip from './Tooltip';
import { translations } from '../utils/translations';

interface Props {
  onImageGenerated: (url: string, prompt: string) => void;
  initialPrompt?: string;
  language: Language;
}

const FONTS = [
  { id: 'Modern Sans', label: 'Modern Sans', family: 'Inter, sans-serif' },
  { id: 'Impact', label: 'Impact', family: 'Impact, sans-serif' },
  { id: 'Lalezar', label: 'Lalezar', family: 'Lalezar, cursive' },
  { id: 'Titr', label: 'Titr Bold', family: 'Vazirmatn, sans-serif', weight: '900' },
  { id: 'Changa', label: 'Changa', family: 'Changa, sans-serif', weight: '800' },
  { id: 'Rubik', label: 'Rubik', family: 'Rubik, sans-serif' },
  { id: 'Amiri', label: 'Amiri', family: 'Amiri, serif' },
  { id: 'Handwritten', label: 'Handwritten', family: 'cursive' },
];

const COLORS: { id: TextColor, hex: string }[] = [
  { id: 'White', hex: '#FFFFFF' },
  { id: 'Yellow', hex: '#FACC15' },
  { id: 'Red', hex: '#EF4444' },
  { id: 'Green', hex: '#22C55E' },
  { id: 'Blue', hex: '#3B82F6' },
  { id: 'Neon Pink', hex: '#EC4899' },
  { id: 'Gold', hex: '#D97706' },
  { id: 'Black', hex: '#000000' },
];

const POSITIONS: TextPosition[] = [
  'Top Left', 'Top Center', 'Top Right',
  'Middle Left', 'Center', 'Middle Right',
  'Bottom Left', 'Bottom Center', 'Bottom Right'
];

const STYLE_CATEGORIES = {
  'Viral': {
    icon: <TrendingUp className="w-4 h-4" />,
    styles: [
      { id: 'High Contrast, Expressive', label: 'High Contrast', desc: 'MrBeast Style', image: 'https://images.unsplash.com/photo-1542204165-65bf26472b9b?w=400&q=80' },
      { id: 'Reaction / Commentary', label: 'Reaction', desc: 'Big Face, Arrows', image: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&q=80' },
    ]
  },
  'Lifestyle': {
    icon: <Video className="w-4 h-4" />,
    styles: [
      { id: 'Vlog / Daily Life', label: 'Vlog', desc: 'Authentic', image: 'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=400&q=80' },
      { id: 'Travel Aesthetic', label: 'Travel', desc: 'Scenic', image: 'https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?w=400&q=80' },
      { id: 'Cozy / Aesthetic', label: 'Cozy', desc: 'Warm Tones', image: 'https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?w=400&q=80' },
    ]
  },
  'Gaming': {
    icon: <Gamepad2 className="w-4 h-4" />,
    styles: [
      { id: 'Gaming: Minecraft / Roblox Style', label: 'Minecraft', desc: 'Blocky 3D', image: 'https://images.unsplash.com/photo-1599553075223-9372d6347101?w=400&q=80' },
      { id: 'Gaming: Competitive Shooter', label: 'Shooter', desc: 'Action', image: 'https://images.unsplash.com/photo-1593508512255-86ab42a8e620?w=400&q=80' },
    ]
  },
  'Cinematic': {
    icon: <Film className="w-4 h-4" />,
    styles: [
      { id: 'Cinematic Movie Poster', label: 'Movie Poster', desc: 'Dramatic', image: 'https://images.unsplash.com/photo-1542204165-65bf26472b9b?w=400&q=80' },
      { id: '3D Render / Pixar Style', label: '3D Animation', desc: 'Polished', image: 'https://images.unsplash.com/photo-1626544827763-d516dce335ca?w=400&q=80' },
      { id: 'Neon Cyberpunk', label: 'Cyberpunk', desc: 'Futuristic', image: 'https://images.unsplash.com/photo-1515630278258-407f66498911?w=400&q=80' },
    ]
  },
  'Inspiration': {
    icon: <LinkIcon className="w-4 h-4" />,
    styles: [
      { id: 'From Reference URL', label: 'Reference URL', desc: 'Analyze link', image: 'https://images.unsplash.com/photo-1432821596592-e2c18b78144f?w=400&q=80' },
      { id: 'Pinterest Aesthetic', label: 'Pinterest', desc: 'Curated', image: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=400&q=80' },
    ]
  }
};

const PromptGenerator: React.FC<Props> = ({ onImageGenerated, initialPrompt, language }) => {
  const t = translations[language];
  const [topic, setTopic] = useState(initialPrompt || '');
  
  // Style State
  const [activeCategory, setActiveCategory] = useState<keyof typeof STYLE_CATEGORIES>('Viral');
  const [style, setStyle] = useState('High Contrast, Expressive');
  const [gameName, setGameName] = useState('');
  const [referenceUrl, setReferenceUrl] = useState('');
  const [pinterestSuggestions, setPinterestSuggestions] = useState<string[]>([]);
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false);

  const [useTrends, setUseTrends] = useState(true);
  const [isGeneratingPrompt, setIsGeneratingPrompt] = useState(false);
  const [generatedData, setGeneratedData] = useState<GeneratedPrompt | null>(null);
  
  // Image Gen State
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);
  const [selectedRatio, setSelectedRatio] = useState<AspectRatio>(AspectRatio.LANDSCAPE_16_9);
  const [resolutionIndex, setResolutionIndex] = useState(1);
  const resolutions: ImageResolution[] = ['1K', '2K', '4K'];
  const [currentImage, setCurrentImage] = useState<string | null>(null);

  // Advanced Settings State
  const [showSettings, setShowSettings] = useState(false);
  const [negativePrompt, setNegativePrompt] = useState('');

  // Character
  const [isAnalyzingChar, setIsAnalyzingChar] = useState(false);
  const charInputRef = useRef<HTMLInputElement>(null);

  // Composition Elements State
  const [elements, setElements] = useState<ThumbnailElements>({
    addText: false,
    aiOptimizeText: true,
    textMode: 'AI Generated',
    customText: '',
    textLanguage: 'English',
    fontStyle: 'Modern Sans',
    textEffect: 'None',
    textPosition: 'Center',
    textColor: 'White',
    backgroundMode: 'Standard',
    aiOptimizeBackground: true,
    shotType: 'Medium Shot',
    aiOptimizeFraming: true,
    highSaturation: false,
    expression: 'Surprised',
    lighting: 'Studio',
    aiOptimizeLighting: true,
    characterDescription: '',
    characterPosition: 'Center',
    faceVisibility: 'Show Face',
    customInstructions: '',
    aiAutoSettings: false 
  });

  // Preset State
  const [presets, setPresets] = useState<GeneratorPreset[]>([]);
  const [presetNameInput, setPresetNameInput] = useState('');
  const [showSavePreset, setShowSavePreset] = useState(false);

  // Edit State
  const [editInstruction, setEditInstruction] = useState('');
  const [isProcessingEdit, setIsProcessingEdit] = useState(false);

  // Preview Context State
  const [showContextPreview, setShowContextPreview] = useState(false);
  const [previewTitle, setPreviewTitle] = useState('');
  const [previewChannel, setPreviewChannel] = useState('My Channel');

  // Interactive Prompt State
  const [hoveredSegment, setHoveredSegment] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const isGamingStyle = style.toLowerCase().includes('gaming') || activeCategory === 'Gaming';
  const isReferenceStyle = activeCategory === 'Inspiration';
  const isPinterest = style.includes('Pinterest');

  useEffect(() => {
    const saved = localStorage.getItem('thumbsmith_presets');
    if (saved) {
      setPresets(JSON.parse(saved));
    }
  }, []);

  useEffect(() => {
    if (generatedData?.title) {
      setPreviewTitle(generatedData.title);
    }
  }, [generatedData]);

  const handleCharUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
        setIsAnalyzingChar(true);
        const file = e.target.files[0];
        const reader = new FileReader();
        reader.onload = (ev) => {
            setElements(prev => ({ ...prev, characterImage: ev.target?.result as string }));
        };
        reader.readAsDataURL(file);

        try {
            const desc = await analyzeCharacterReference(file);
            setElements(prev => ({ ...prev, characterDescription: desc }));
        } finally {
            setIsAnalyzingChar(false);
        }
    }
  };

  const handlePinterestSuggest = async () => {
    if(!topic) return;
    setIsLoadingSuggestions(true);
    const suggs = await getPinterestSuggestions(topic);
    setPinterestSuggestions(suggs);
    setIsLoadingSuggestions(false);
  };

  const handleSavePreset = () => {
    if (!presetNameInput) return;
    const newPreset: GeneratorPreset = {
      id: Date.now().toString(),
      name: presetNameInput,
      topic,
      activeCategory,
      style,
      gameName,
      referenceUrl,
      aspectRatio: selectedRatio,
      resolution: resolutions[resolutionIndex],
      negativePrompt,
      elements
    };
    const updatedPresets = [...presets, newPreset];
    setPresets(updatedPresets);
    localStorage.setItem('thumbsmith_presets', JSON.stringify(updatedPresets));
    setShowSavePreset(false);
    setPresetNameInput('');
  };

  const handleLoadPreset = (preset: GeneratorPreset) => {
    setTopic(preset.topic);
    setActiveCategory(preset.activeCategory as keyof typeof STYLE_CATEGORIES);
    setStyle(preset.style);
    setGameName(preset.gameName);
    setReferenceUrl(preset.referenceUrl || '');
    setSelectedRatio(preset.aspectRatio);
    const rIdx = resolutions.indexOf(preset.resolution);
    if(rIdx !== -1) setResolutionIndex(rIdx);
    setNegativePrompt(preset.negativePrompt);
    setElements({...elements, ...preset.elements});
  };

  const handleDeletePreset = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = presets.filter(p => p.id !== id);
    setPresets(updated);
    localStorage.setItem('thumbsmith_presets', JSON.stringify(updated));
  };

  const handleGeneratePrompt = async () => {
    if (!topic) return;
    setIsGeneratingPrompt(true);
    setGeneratedData(null);
    setCurrentImage(null);
    setShowContextPreview(false);
    try {
      const promptTopic = (isGamingStyle && gameName) ? `${topic} (Game: ${gameName})` : topic;
      const data = await generateThumbnailPrompt(promptTopic, style, referenceUrl, useTrends, elements);
      setGeneratedData(data);
    } catch (e) {
      console.error(e);
      alert("Failed to generate prompt. Please check console.");
    } finally {
      setIsGeneratingPrompt(false);
    }
  };

  const handleCopyPrompt = () => {
    if (!generatedData) return;
    navigator.clipboard.writeText(generatedData.promptText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleVisualize = async () => {
    if (!generatedData) return;
    setIsGeneratingImage(true);
    try {
      const currentResolution = resolutions[resolutionIndex];
      const finalPrompt = negativePrompt.trim() 
        ? `${generatedData.promptText}\n\n(Exclude elements: ${negativePrompt})` 
        : generatedData.promptText;

      const imageUrl = await generateThumbnailImage(finalPrompt, selectedRatio, currentResolution);
      setCurrentImage(imageUrl);
      onImageGenerated(imageUrl, finalPrompt);
    } catch (e) {
      alert("Failed to generate image.");
    } finally {
      setIsGeneratingImage(false);
    }
  };

  const handleEditImage = async () => {
    if (!currentImage || !editInstruction) return;
    setIsProcessingEdit(true);
    try {
      const newImageUrl = await editThumbnailImage(currentImage, editInstruction);
      setCurrentImage(newImageUrl);
      setEditInstruction('');
      onImageGenerated(newImageUrl, generatedData?.promptText || "Edited Image");
    } catch (e) {
      alert("Failed to edit image.");
    } finally {
      setIsProcessingEdit(false);
    }
  };

  const renderPromptSegment = (label: string, text: string | undefined, icon: React.ReactNode, colorClass: string, bgClass: string) => {
    if (!text) return null;
    return (
      <Tooltip text={label} className="inline">
        <span className={`cursor-help inline-flex items-center gap-1.5 px-2 py-0.5 rounded mx-1 border border-white/10 transition-all ${bgClass} ${colorClass}`}>
          {icon}
          {text}
        </span>
      </Tooltip>
    );
  };
  
  const SectionHeader = ({ icon, title, isOptimized, onToggle }: { icon: React.ReactNode, title: string, isOptimized: boolean, onToggle: (val: boolean) => void }) => (
    <div className="flex items-center justify-between mb-4">
      <div className="flex items-center gap-2">
         {icon}
         <span className="text-sm font-bold text-slate-200">{title}</span>
      </div>
      <div className="flex items-center gap-2">
         <span className={`text-[10px] font-medium uppercase tracking-wider ${isOptimized ? 'text-indigo-400' : 'text-slate-500'}`}>{isOptimized ? 'AI Optimized' : 'Manual'}</span>
         <button 
           onClick={() => onToggle(!isOptimized)}
           className={`relative w-9 h-5 rounded-full transition-colors ${isOptimized ? 'bg-indigo-600' : 'bg-slate-700'}`}
         >
           <span className={`absolute top-1 left-1 bg-white w-3 h-3 rounded-full transition-transform ${isOptimized ? 'translate-x-4' : ''}`}></span>
         </button>
      </div>
    </div>
  );

  return (
    <div className="max-w-6xl mx-auto space-y-12 pb-24">
      
      {/* 1. INPUT DASHBOARD */}
      <div className="space-y-6">
          
          {/* Main Input Area */}
          <div className="glass-panel p-1 rounded-3xl relative group">
             <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/20 to-purple-500/20 rounded-3xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"></div>
             <div className="bg-[#0b0f19] rounded-[22px] p-6 md:p-10 relative z-10">
                <div className="flex justify-between items-center mb-6">
                    <label className="text-indigo-400 text-xs font-bold uppercase tracking-[0.2em] flex items-center gap-2">
                       <Sparkles className="w-3 h-3" /> {t.topicLabel}
                    </label>
                    <div className="flex gap-2">
                        {presets.map(preset => (
                          <button key={preset.id} onClick={() => handleLoadPreset(preset)} className="text-[10px] bg-white/5 border border-white/5 hover:bg-white/10 text-slate-400 px-3 py-1 rounded-full transition-all">
                             {preset.name}
                          </button>
                        ))}
                    </div>
                </div>

                <textarea
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  placeholder={t.topicPlaceholder}
                  className="w-full bg-transparent border-none text-3xl md:text-5xl font-bold text-white placeholder-slate-700 outline-none resize-none h-auto min-h-[120px] leading-tight selection:bg-indigo-500/40"
                  style={{ fieldSizing: 'content' } as any}
                />

                <div className="flex items-center justify-between pt-6 border-t border-white/5 mt-4">
                   <div className="flex gap-4">
                      <button 
                        onClick={() => setUseTrends(!useTrends)}
                        className={`flex items-center gap-2 text-xs font-medium px-3 py-1.5 rounded-lg transition-colors ${useTrends ? 'text-emerald-400 bg-emerald-500/10' : 'text-slate-500 hover:text-slate-300'}`}
                      >
                         {useTrends ? <TrendingUp className="w-3.5 h-3.5"/> : <Search className="w-3.5 h-3.5"/>}
                         {t.useTrends}
                      </button>
                      
                      <div className="flex items-center gap-2">
                        <span className="text-slate-600 text-xs">|</span>
                        <div className="flex items-center gap-2">
                          <label className="text-xs text-slate-500">{t.aspectRatio}</label>
                          <select 
                            value={selectedRatio} 
                            onChange={(e) => setSelectedRatio(e.target.value as AspectRatio)} 
                            className="bg-transparent text-xs text-slate-300 outline-none cursor-pointer hover:text-white"
                          >
                             {Object.values(AspectRatio).map(r => <option key={r} value={r} className="bg-slate-900">{r}</option>)}
                          </select>
                        </div>
                      </div>
                   </div>

                   <div className="flex items-center gap-2">
                       {showSavePreset ? (
                         <div className="flex items-center gap-2 animate-[fade-in_0.2s]">
                           <input 
                             value={presetNameInput}
                             onChange={(e) => setPresetNameInput(e.target.value)}
                             placeholder="Preset Name"
                             className="bg-white/5 border border-white/10 rounded-md px-2 py-1 text-xs text-white outline-none w-32"
                             autoFocus
                           />
                           <button onClick={handleSavePreset} className="text-green-400 hover:bg-green-500/20 p-1 rounded"><Check className="w-3.5 h-3.5"/></button>
                           <button onClick={() => setShowSavePreset(false)} className="text-slate-500 hover:text-white p-1"><XCircle className="w-3.5 h-3.5"/></button>
                         </div>
                       ) : (
                         <button onClick={() => setShowSavePreset(true)} className="text-slate-500 hover:text-white text-xs flex items-center gap-1"><Save className="w-3.5 h-3.5"/> {t.saveCurrent}</button>
                       )}
                   </div>
                </div>
             </div>
          </div>
          
          {/* Controls Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
             
             {/* Left: Style Selector */}
             <div className="lg:col-span-8 glass-panel p-6 rounded-3xl">
                <div className="flex items-center gap-4 mb-6 overflow-x-auto pb-2 scrollbar-hide">
                   {(Object.keys(STYLE_CATEGORIES) as Array<keyof typeof STYLE_CATEGORIES>).map((cat) => (
                      <button
                        key={cat}
                        onClick={() => setActiveCategory(cat)}
                        className={`flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap transition-all ${activeCategory === cat ? 'bg-white text-black' : 'bg-white/5 text-slate-400 hover:bg-white/10'}`}
                      >
                         {STYLE_CATEGORIES[cat].icon}
                         {cat}
                      </button>
                   ))}
                </div>
                
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                   {STYLE_CATEGORIES[activeCategory].styles.map((s) => (
                      <button
                        key={s.id}
                        onClick={() => setStyle(s.id)}
                        className={`group relative h-24 rounded-xl overflow-hidden text-left transition-all ${style === s.id ? 'ring-2 ring-indigo-500 shadow-lg scale-[1.02]' : 'opacity-60 hover:opacity-100 hover:scale-[1.02]'}`}
                      >
                         <img src={s.image} className="absolute inset-0 w-full h-full object-cover transition-transform group-hover:scale-110" alt={s.label}/>
                         <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent p-3 flex flex-col justify-end">
                            <span className="text-xs font-bold text-white">{s.label}</span>
                            <span className="text-[10px] text-slate-300">{s.desc}</span>
                         </div>
                         {style === s.id && <div className="absolute top-2 right-2 w-4 h-4 bg-indigo-500 rounded-full flex items-center justify-center"><Check className="w-2.5 h-2.5 text-white"/></div>}
                      </button>
                   ))}
                </div>

                {isPinterest && (
                  <div className="mt-4 pt-4 border-t border-white/5">
                    <button onClick={handlePinterestSuggest} disabled={isLoadingSuggestions} className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-2">
                       {isLoadingSuggestions ? <Loader2 className="w-3 h-3 animate-spin"/> : <Search className="w-3 h-3"/>}
                       {t.suggestPinterest}
                    </button>
                    {pinterestSuggestions.length > 0 && (
                      <div className="flex flex-wrap gap-2 mt-2">
                        {pinterestSuggestions.map((s, i) => <span key={i} className="text-[10px] bg-white/5 px-2 py-1 rounded text-slate-300 border border-white/5">{s}</span>)}
                      </div>
                    )}
                  </div>
                )}
             </div>

             {/* Right: Specific Inputs */}
             <div className="lg:col-span-4 space-y-4">
                {isGamingStyle && (
                  <div className="glass-panel p-4 rounded-2xl flex flex-col gap-2">
                     <label className="text-[10px] font-bold text-slate-500 uppercase flex items-center gap-1"><Gamepad2 className="w-3 h-3"/> {t.gameName}</label>
                     <input type="text" value={gameName} onChange={(e) => setGameName(e.target.value)} className="bg-black/30 border border-white/10 rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-indigo-500/50" placeholder="e.g. Minecraft"/>
                  </div>
                )}
                <div className="glass-panel p-4 rounded-2xl flex flex-col gap-2">
                   <label className="text-[10px] font-bold text-slate-500 uppercase flex items-center gap-1"><XCircle className="w-3 h-3"/> {t.negativePrompt}</label>
                   <input type="text" value={negativePrompt} onChange={(e) => setNegativePrompt(e.target.value)} className="bg-black/30 border border-white/10 rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-red-500/50" placeholder="e.g. blurry, low res"/>
                </div>
                <button 
                  onClick={() => setShowSettings(!showSettings)} 
                  className={`w-full p-4 rounded-2xl flex items-center justify-between text-sm font-bold transition-all ${showSettings ? 'bg-white/10 text-white' : 'glass-panel text-slate-300 hover:bg-white/5'}`}
                >
                   <span className="flex items-center gap-2"><Settings2 className="w-4 h-4"/> {t.compositionElements}</span>
                   {showSettings ? <ChevronUp className="w-4 h-4"/> : <ChevronDown className="w-4 h-4"/>}
                </button>
             </div>
          </div>

          {/* Collapsible Settings Panel */}
          {showSettings && (
             <div className="glass-panel rounded-3xl p-6 md:p-8 animate-[slide-in-from-top-4_0.3s_ease-out]">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                   
                   {/* 1. Character */}
                   <div className="space-y-4">
                      <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest border-b border-white/5 pb-2">{t.characterRef}</h3>
                      <div className="flex gap-2">
                          {['Show Face', 'Faceless'].map(mode => (
                             <button key={mode} onClick={() => setElements({...elements, faceVisibility: mode as any})} className={`flex-1 py-2 text-[10px] font-bold rounded-lg border transition-all ${elements.faceVisibility === mode ? 'bg-white/10 border-white/20 text-white' : 'border-transparent text-slate-500 hover:bg-white/5'}`}>{mode === 'Show Face' ? t.showFace : t.faceless}</button>
                          ))}
                      </div>
                      {elements.faceVisibility === 'Show Face' && (
                         <div className="relative h-32 rounded-xl border border-dashed border-white/10 bg-black/20 hover:bg-black/40 transition-colors flex items-center justify-center cursor-pointer group" onClick={() => charInputRef.current?.click()}>
                            {elements.characterImage ? (
                               <img src={elements.characterImage} className="w-full h-full object-cover rounded-xl opacity-60 group-hover:opacity-100 transition-opacity" />
                            ) : (
                               <div className="text-center text-slate-500 group-hover:text-indigo-400">
                                  <Upload className="w-6 h-6 mx-auto mb-2"/>
                                  <span className="text-[10px] uppercase font-bold">{t.uploadFace}</span>
                               </div>
                            )}
                            <input type="file" ref={charInputRef} className="hidden" accept="image/*" onChange={handleCharUpload}/>
                            {isAnalyzingChar && <div className="absolute inset-0 bg-black/80 flex items-center justify-center"><Loader2 className="w-5 h-5 animate-spin text-white"/></div>}
                         </div>
                      )}
                   </div>

                   {/* 2. Text */}
                   <div className="space-y-4">
                      <div className="flex justify-between items-center border-b border-white/5 pb-2">
                        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest">{t.textOverlay}</h3>
                        <label className="flex items-center gap-2 cursor-pointer">
                           <span className={`text-[10px] font-bold ${elements.addText ? 'text-white' : 'text-slate-600'}`}>ENABLE</span>
                           <input type="checkbox" checked={elements.addText} onChange={(e) => setElements({...elements, addText: e.target.checked})} className="hidden" />
                           <div className={`w-8 h-4 rounded-full relative transition-colors ${elements.addText ? 'bg-indigo-500' : 'bg-slate-700'}`}>
                             <div className={`absolute top-0.5 left-0.5 w-3 h-3 bg-white rounded-full transition-transform ${elements.addText ? 'translate-x-4' : ''}`}></div>
                           </div>
                        </label>
                      </div>

                      {elements.addText && (
                        <div className="space-y-4 animate-[fade-in_0.2s]">
                           <div className="flex items-center justify-between text-[10px] font-bold text-slate-400 bg-white/5 p-2 rounded-lg">
                              <span>MODE</span>
                              <button onClick={() => setElements({...elements, aiOptimizeText: !elements.aiOptimizeText})} className={elements.aiOptimizeText ? 'text-indigo-400' : 'text-slate-500'}>{elements.aiOptimizeText ? 'AI OPTIMIZED' : 'MANUAL'}</button>
                           </div>
                           
                           {!elements.aiOptimizeText && (
                              <div className="space-y-3">
                                 <input type="text" value={elements.customText} onChange={(e) => setElements({...elements, customText: e.target.value})} placeholder="Custom Text..." className="w-full bg-black/30 border border-white/10 rounded-lg px-3 py-2 text-sm text-white outline-none"/>
                                 <div className="flex gap-2">
                                    <select value={elements.textLanguage} onChange={(e) => setElements({...elements, textLanguage: e.target.value as any})} className="bg-black/30 text-xs text-white rounded p-1 border border-white/10 outline-none flex-1">
                                      <option value="English">English</option>
                                      <option value="Persian">Persian</option>
                                    </select>
                                    <div className="flex gap-1">
                                       {COLORS.slice(0, 5).map(c => <button key={c.id} onClick={() => setElements({...elements, textColor: c.id})} className="w-5 h-5 rounded-full border border-white/20" style={{background: c.hex}} />)}
                                    </div>
                                 </div>
                              </div>
                           )}
                        </div>
                      )}
                   </div>

                   {/* 3. Visuals */}
                   <div className="space-y-4">
                      <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest border-b border-white/5 pb-2">{t.background}</h3>
                      <div className="flex flex-wrap gap-2">
                         {['Standard', 'Blurred', 'Solid White', 'Detailed Environment'].map(bg => (
                            <button 
                              key={bg} 
                              onClick={() => setElements({...elements, backgroundMode: bg as any, aiOptimizeBackground: false})}
                              className={`px-3 py-1.5 rounded-lg text-[10px] font-bold border transition-all ${elements.backgroundMode === bg && !elements.aiOptimizeBackground ? 'bg-white/10 border-white/20 text-white' : 'border-transparent text-slate-500 bg-black/20 hover:bg-white/5'}`}
                            >
                               {bg}
                            </button>
                         ))}
                         <button onClick={() => setElements({...elements, aiOptimizeBackground: true})} className={`px-3 py-1.5 rounded-lg text-[10px] font-bold border ${elements.aiOptimizeBackground ? 'bg-indigo-500/20 border-indigo-500/50 text-indigo-300' : 'border-transparent text-slate-600'}`}>AUTO</button>
                      </div>
                   </div>
                </div>
             </div>
          )}

          {/* GENERATE ACTION */}
          <button
            onClick={handleGeneratePrompt}
            disabled={isGeneratingPrompt || !topic}
            className="w-full group relative overflow-hidden rounded-2xl py-6 transition-transform active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-600 bg-[length:200%_100%] animate-[shimmer_3s_linear_infinite]"></div>
            <div className="relative flex items-center justify-center gap-3">
               {isGeneratingPrompt ? (
                  <>
                    <Loader2 className="w-6 h-6 animate-spin text-white" />
                    <span className="text-lg font-bold text-white tracking-widest uppercase">{t.thinking}</span>
                  </>
               ) : (
                  <>
                    <Sparkles className="w-6 h-6 text-white group-hover:rotate-12 transition-transform" />
                    <span className="text-lg font-bold text-white tracking-widest uppercase">{t.generateBtn}</span>
                  </>
               )}
            </div>
          </button>
      </div>

      {/* 2. RESULTS AREA */}
      {generatedData && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 animate-[slide-in-from-bottom-8_0.6s_ease-out]">
           
           {/* Left: Prompt Card */}
           <div className="glass-card rounded-3xl overflow-hidden flex flex-col h-full min-h-[500px]">
              <div className="p-6 border-b border-white/5 bg-white/5 flex items-center justify-between">
                 <div>
                    <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest mb-1 block">STRATEGY</span>
                    <h2 className="text-xl font-bold text-white leading-tight">{generatedData.title}</h2>
                 </div>
                 <button onClick={handleCopyPrompt} className="p-2 hover:bg-white/10 rounded-lg text-slate-400 hover:text-white transition-colors">
                    {copied ? <Check className="w-5 h-5 text-emerald-400"/> : <Copy className="w-5 h-5"/>}
                 </button>
              </div>
              <div className="p-8 flex-1 overflow-y-auto">
                 <div className="prose prose-invert prose-sm max-w-none">
                    <p className="text-lg leading-relaxed font-light text-slate-200">
                      {generatedData.segments ? (
                        <>
                          <span className="opacity-50">Create a YouTube thumbnail featuring </span>
                          <span className="text-pink-300 font-medium">{generatedData.segments.subject} </span>
                          <span className="opacity-50">doing </span>
                          <span className="text-orange-300 font-medium">{generatedData.segments.action} </span>
                          <span className="opacity-50">in a </span>
                          <span className="text-sky-300 font-medium">{generatedData.segments.environment}</span>. 
                          <span className="opacity-50"> Lighting: </span>
                          <span className="text-yellow-300 font-medium">{generatedData.segments.lighting}</span>.
                        </>
                      ) : (
                        generatedData.promptText
                      )}
                    </p>
                 </div>
              </div>
              <div className="p-6 border-t border-white/5 bg-black/20">
                 <button 
                   onClick={handleVisualize}
                   disabled={isGeneratingImage}
                   className="w-full bg-slate-800 hover:bg-slate-700 text-white py-4 rounded-xl font-bold flex items-center justify-center gap-2 transition-all border border-white/5"
                 >
                    {isGeneratingImage ? <Loader2 className="w-5 h-5 animate-spin"/> : <Palette className="w-5 h-5"/>}
                    {isGeneratingImage ? t.generatingImage : t.visualize}
                 </button>
              </div>
           </div>

           {/* Right: Visualization */}
           <div className="glass-card rounded-3xl overflow-hidden h-full min-h-[500px] flex flex-col relative group">
              {currentImage ? (
                <>
                   <div className="flex-1 bg-black/50 relative flex items-center justify-center overflow-hidden">
                       <img src={currentImage} className="max-w-full max-h-full object-contain shadow-2xl" alt="Generated" />
                       
                       {showContextPreview && (
                         <div className="absolute inset-0 bg-black flex items-center justify-center p-4 z-10" dir="ltr">
                            <div className="w-[360px] cursor-pointer">
                               <div className="relative aspect-video rounded-xl overflow-hidden mb-3">
                                  <img src={currentImage} className="w-full h-full object-cover"/>
                                  <div className="absolute bottom-1 right-1 bg-black/80 text-white text-[10px] px-1 rounded">10:05</div>
                               </div>
                               <div className="flex gap-3">
                                  <div className="w-9 h-9 rounded-full bg-slate-700 flex-shrink-0"></div>
                                  <div>
                                     <h4 className="text-white text-sm font-semibold leading-tight line-clamp-2">{previewTitle}</h4>
                                     <p className="text-slate-400 text-xs mt-1">{previewChannel} • 256K views • 5 hours ago</p>
                                  </div>
                               </div>
                            </div>
                         </div>
                       )}
                   </div>
                   
                   <div className="p-4 bg-[#0b0f19] border-t border-white/5 flex gap-2">
                      <div className="flex-1 relative">
                         <input 
                           type="text" 
                           value={editInstruction} 
                           onChange={(e) => setEditInstruction(e.target.value)} 
                           placeholder={t.editImage}
                           className="w-full bg-slate-900 border border-slate-800 rounded-lg pl-9 pr-3 py-2.5 text-xs text-white outline-none focus:border-indigo-500"
                           onKeyDown={(e) => e.key === 'Enter' && handleEditImage()}
                         />
                         <Wand2 className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-3 rtl:right-3 rtl:left-auto"/>
                      </div>
                      <button onClick={handleEditImage} disabled={isProcessingEdit} className="bg-indigo-600 hover:bg-indigo-500 text-white p-2.5 rounded-lg">
                         {isProcessingEdit ? <Loader2 className="w-4 h-4 animate-spin"/> : <ArrowRight className="w-4 h-4"/>}
                      </button>
                      <button onClick={() => setShowContextPreview(!showContextPreview)} className={`p-2.5 rounded-lg border ${showContextPreview ? 'bg-white text-black border-white' : 'border-white/10 text-slate-400 hover:text-white'}`}>
                         <MonitorPlay className="w-4 h-4"/>
                      </button>
                      <a href={currentImage} download="thumbnail.png" className="p-2.5 rounded-lg border border-white/10 text-slate-400 hover:text-white hover:bg-white/5">
                         <Save className="w-4 h-4"/>
                      </a>
                   </div>
                </>
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center text-slate-600">
                   <div className="w-20 h-20 rounded-full bg-white/5 flex items-center justify-center mb-4">
                      <ImageIcon className="w-8 h-8 opacity-50" />
                   </div>
                   <p className="text-sm font-medium">Visualization will appear here</p>
                </div>
              )}
           </div>
        </div>
      )}
    </div>
  );
};

const ImageIcon = ({className}: {className?: string}) => (
  <svg className={className} width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="18" x="3" y="3" rx="2" ry="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/></svg>
);

export default PromptGenerator;