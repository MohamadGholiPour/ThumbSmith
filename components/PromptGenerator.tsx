
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
  { id: 'Changa', label: 'Changa (Heavy)', family: 'Changa, sans-serif', weight: '800' },
  { id: 'El Messiri', label: 'El Messiri', family: 'El Messiri, sans-serif', weight: '700' },
  { id: 'Rubik', label: 'Rubik', family: 'Rubik, sans-serif' },
  { id: 'Amiri', label: 'Amiri', family: 'Amiri, serif' },
  { id: 'Noto Naskh', label: 'Noto Naskh', family: 'Noto Naskh Arabic, serif' },
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
      { id: 'High Contrast, Expressive', label: 'High Contrast', desc: 'General Viral', image: 'https://images.unsplash.com/photo-1542204165-65bf26472b9b?w=400&q=80' },
      { id: 'MrBeast Style', label: 'MrBeast Style', desc: 'Hyper-Realism, Shock', image: 'https://images.unsplash.com/photo-1628155930542-3c7a64e2c833?w=400&q=80' },
      { id: 'Reaction / Commentary', label: 'Reaction', desc: 'Big Head, Arrows', image: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&q=80' },
    ]
  },
  'Lifestyle': {
    icon: <Video className="w-4 h-4" />,
    styles: [
      { id: 'Vlog / Daily Life', label: 'Vlog / Daily', desc: 'Handheld, Authentic', image: 'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=400&q=80' },
      { id: 'Travel Aesthetic', label: 'Travel', desc: 'Scenic, Wide Angle', image: 'https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?w=400&q=80' },
      { id: 'Fitness / Gym', label: 'Fitness', desc: 'Energetic, Bright', image: 'https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=400&q=80' },
      { id: 'Cozy / Aesthetic', label: 'Cozy', desc: 'Warm, Soft Focus', image: 'https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?w=400&q=80' },
    ]
  },
  'Education': {
    icon: <GraduationCap className="w-4 h-4" />,
    styles: [
      { id: 'Educational / Infographic', label: 'Infographic', desc: 'Clean vector art', image: 'https://images.unsplash.com/photo-1544531586-fde5298cdd40?w=400&q=80' },
      { id: 'History / Documentary', label: 'Documentary', desc: 'Cinematic, Collage', image: 'https://images.unsplash.com/photo-1461360370896-922624d12aa1?w=400&q=80' },
      { id: 'Tutorial / How-To', label: 'Tutorial', desc: 'Step-by-step, Arrow', image: 'https://images.unsplash.com/photo-1517842645767-c639042777db?w=400&q=80' },
    ]
  },
  'Gaming': {
    icon: <Gamepad2 className="w-4 h-4" />,
    styles: [
      { id: 'Gaming: Minecraft / Roblox Style', label: 'Minecraft / Voxel', desc: 'Blocky 3D world', image: 'https://images.unsplash.com/photo-1599553075223-9372d6347101?w=400&q=80' },
      { id: 'Gaming: Competitive Shooter', label: 'FPS / Shooter', desc: 'Intense action HUD', image: 'https://images.unsplash.com/photo-1593508512255-86ab42a8e620?w=400&q=80' },
      { id: 'Gaming: Horror', label: 'Horror Game', desc: 'Dark & grainy', image: 'https://images.unsplash.com/photo-1481437156560-3205f6a55735?w=400&q=80' },
      { id: 'Retro Gaming', label: 'Retro Pixel', desc: '8-bit nostalgia', image: 'https://images.unsplash.com/photo-1551103782-8ab07afd45c1?w=400&q=80' },
    ]
  },
  'Tech': {
    icon: <Monitor className="w-4 h-4" />,
    styles: [
      { id: 'Tech Review', label: 'Tech Review', desc: 'Clean studio shots', image: 'https://images.unsplash.com/photo-1526406915894-7bcd65f60845?w=400&q=80' },
      { id: 'Minimalist Design', label: 'Minimalist', desc: 'Negative space', image: 'https://images.unsplash.com/photo-1504384308090-c54be3855833?w=400&q=80' },
    ]
  },
  'Cinematic': {
    icon: <Film className="w-4 h-4" />,
    styles: [
      { id: 'Cinematic Movie Poster', label: 'Movie Poster', desc: 'Dramatic lighting', image: 'https://images.unsplash.com/photo-1542204165-65bf26472b9b?w=400&q=80' },
      { id: 'Dark, Horror, Gritty', label: 'Dark / Mystery', desc: 'Moody shadows', image: 'https://images.unsplash.com/photo-1505672675380-4132902b585d?w=400&q=80' },
      { id: '3D Render / Pixar Style', label: '3D Animation', desc: 'Cute & polished', image: 'https://images.unsplash.com/photo-1626544827763-d516dce335ca?w=400&q=80' },
      { id: 'Neon Cyberpunk', label: 'Cyberpunk', desc: 'Futuristic glow', image: 'https://images.unsplash.com/photo-1515630278258-407f66498911?w=400&q=80' },
    ]
  },
  'Inspiration': {
    icon: <LinkIcon className="w-4 h-4" />,
    styles: [
      { id: 'From Reference URL', label: 'Reference URL', desc: 'Analyze link', image: 'https://images.unsplash.com/photo-1432821596592-e2c18b78144f?w=400&q=80' },
      { id: 'Pinterest Aesthetic', label: 'Pinterest', desc: 'Curated vibes', image: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=400&q=80' },
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
    faceVisibility: 'Show Face', // Default

    customInstructions: '',
    aiAutoSettings: false // Master
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

  // --- Handlers ---

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
      alert("Failed to generate image. Please check API quotas or console.");
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
    const isHovered = hoveredSegment === label;
    
    return (
      <Tooltip text={label} className="inline">
        <span
          onMouseEnter={() => setHoveredSegment(label)}
          onMouseLeave={() => setHoveredSegment(null)}
          className={`cursor-help inline-flex items-center gap-1.5 px-2 py-0.5 rounded mx-1 border transition-all duration-200 ${
            isHovered 
              ? `${bgClass} ${colorClass} border-current transform scale-105 shadow-sm` 
              : 'bg-slate-800/50 border-slate-700 text-slate-300 hover:bg-slate-800'
          }`}
        >
          {icon}
          {text}
        </span>
      </Tooltip>
    );
  };

  // --- COMPONENT HELPERS ---
  
  const SectionHeader = ({ icon, title, isOptimized, onToggle }: { icon: React.ReactNode, title: string, isOptimized: boolean, onToggle: (val: boolean) => void }) => (
    <div className="flex items-center justify-between mb-4 bg-slate-900/50 p-3 rounded-lg border border-slate-800">
      <div className="flex items-center gap-2">
         {icon}
         <span className="text-sm font-bold text-slate-300 uppercase tracking-wide">{title}</span>
      </div>
      <div className="flex items-center gap-2">
         <span className={`text-[10px] font-bold ${isOptimized ? 'text-indigo-400' : 'text-slate-500'}`}>{isOptimized ? 'AI Optimized' : 'Manual Control'}</span>
         <label className="relative inline-flex items-center cursor-pointer">
            <input type="checkbox" checked={isOptimized} onChange={(e) => onToggle(e.target.checked)} className="sr-only peer" />
            <div className="w-8 h-4 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-3 after:w-3 after:transition-all peer-checked:bg-indigo-600"></div>
          </label>
      </div>
    </div>
  );

  const VisualGridSelector = ({ 
    options, 
    selected, 
    onSelect, 
    descriptions 
  }: { 
    options: string[], 
    selected: string, 
    onSelect: (val: string) => void, 
    descriptions?: Record<string, string> 
  }) => (
    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
      {options.map((opt) => (
        <button
          key={opt}
          onClick={() => onSelect(opt)}
          className={`relative p-3 rounded-xl border text-left transition-all overflow-hidden group ${
            selected === opt 
              ? 'bg-indigo-600/20 border-indigo-500 ring-1 ring-indigo-500/50' 
              : 'bg-slate-900/40 border-slate-700/50 hover:bg-slate-800 hover:border-slate-600'
          }`}
        >
          <div className="relative z-10">
            <span className={`block text-xs font-bold ${selected === opt ? 'text-white' : 'text-slate-300'}`}>
              {opt}
            </span>
            {descriptions && descriptions[opt] && (
              <span className="block text-[10px] text-slate-500 mt-1 leading-tight opacity-70">
                {descriptions[opt]}
              </span>
            )}
          </div>
          {selected === opt && (
            <div className="absolute inset-0 bg-indigo-500/10 z-0" />
          )}
        </button>
      ))}
    </div>
  );

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-24">
      
      {/* 1. MAIN GENERATOR CARD */}
      <div className="bg-[#0f172a]/40 border border-slate-800/60 rounded-3xl p-6 md:p-8 backdrop-blur-2xl shadow-2xl relative overflow-hidden group">
        
        {/* Glow */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/5 rounded-full blur-[128px] pointer-events-none"></div>

        <div className="space-y-7 relative z-10">
          
           {/* PRESETS HEADER */}
           <div className="flex items-center justify-between border-b border-white/5 pb-4">
              <div className="flex items-center gap-2 overflow-hidden flex-1">
                  <div className="bg-indigo-500/20 p-1.5 rounded-lg">
                    <Bookmark className="w-4 h-4 text-indigo-400" />
                  </div>
                  <div className="flex gap-2 overflow-x-auto scrollbar-hide px-2 items-center">
                    {presets.map(preset => (
                      <div key={preset.id} className="group/preset relative flex-shrink-0">
                        <button 
                          onClick={() => handleLoadPreset(preset)}
                          className="text-[11px] bg-slate-900/80 hover:bg-indigo-900/30 border border-slate-800 hover:border-indigo-500/30 text-slate-400 hover:text-white px-3 py-1.5 rounded-full transition-all pr-7"
                        >
                          {preset.name}
                        </button>
                        <button 
                          onClick={(e) => handleDeletePreset(preset.id, e)}
                          className="absolute right-1 top-1/2 -translate-y-1/2 p-0.5 text-slate-600 hover:text-red-400 opacity-0 group-hover/preset:opacity-100 transition-opacity"
                        >
                          <XCircle className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
              </div>
              <div className="flex-shrink-0 pl-4 border-l border-white/5 ml-2">
                {showSavePreset ? (
                  <div className="flex items-center gap-1 animate-in fade-in slide-in-from-right-2">
                    <input 
                      type="text" 
                      value={presetNameInput}
                      onChange={(e) => setPresetNameInput(e.target.value)}
                      placeholder="Name"
                      className="bg-slate-950 text-xs text-white px-2 py-1.5 rounded-md outline-none border border-slate-700 w-24"
                    />
                    <button onClick={handleSavePreset} className="bg-green-500/20 text-green-400 p-1.5 rounded-md"><Check className="w-3 h-3"/></button>
                  </div>
                ) : (
                  <button onClick={() => setShowSavePreset(true)} className="flex items-center gap-1.5 text-xs font-medium text-slate-400 hover:text-white bg-white/5 px-3 py-1.5 rounded-lg">
                    <Save className="w-3.5 h-3.5" />
                    {t.saveCurrent}
                  </button>
                )}
              </div>
          </div>

          {/* TOPIC INPUT */}
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <label className="text-sm font-bold text-slate-200 flex items-center gap-2">
                <PenTool className="w-4 h-4 text-indigo-400" /> {t.topicLabel}
              </label>
              <button 
                onClick={() => setUseTrends(!useTrends)}
                className={`text-[10px] uppercase font-bold tracking-wider px-3 py-1.5 rounded-full border transition-all flex items-center gap-1.5 ${useTrends ? 'bg-emerald-500/10 border-emerald-500/50 text-emerald-400' : 'bg-slate-900 border-slate-700 text-slate-500'}`}
              >
                {useTrends ? <TrendingUp className="w-3 h-3" /> : <Search className="w-3 h-3" />}
                {t.useTrends}
              </button>
            </div>
            
            <textarea
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder={t.topicPlaceholder}
              className="w-full bg-[#0b1120] border border-slate-700/50 rounded-2xl p-5 text-white placeholder-slate-600 focus:ring-2 focus:ring-indigo-500/30 outline-none h-32 resize-none transition-all text-lg font-medium shadow-inner"
            />
          </div>

          {/* VISUAL STYLE SELECTOR */}
          <div className="space-y-4">
             <div className="flex items-center justify-between">
                <label className="text-sm font-bold text-slate-200 flex items-center gap-2">
                    <Palette className="w-4 h-4 text-pink-400" /> {t.visualVibe}
                </label>
                <div className="flex space-x-1 bg-slate-900/50 p-1 rounded-lg border border-white/5 overflow-x-auto scrollbar-hide">
                  {(Object.keys(STYLE_CATEGORIES) as Array<keyof typeof STYLE_CATEGORIES>).map((cat) => (
                    <button
                      key={cat}
                      onClick={() => setActiveCategory(cat)}
                      className={`p-2 rounded-md transition-all relative group/cat flex-shrink-0 ${activeCategory === cat ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300 hover:bg-white/5'}`}
                    >
                      {React.cloneElement(STYLE_CATEGORIES[cat].icon as React.ReactElement<any>, { className: "w-4 h-4" })}
                      <Tooltip text={cat} className="hidden group-hover/cat:flex absolute bottom-full left-1/2 -translate-x-1/2 mb-2"><span/></Tooltip>
                    </button>
                  ))}
                </div>
             </div>

             <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
               {STYLE_CATEGORIES[activeCategory].styles.map((s) => (
                 <button
                   key={s.id}
                   onClick={() => setStyle(s.id)}
                   className={`relative rounded-xl overflow-hidden transition-all duration-300 text-left group/card h-28 md:h-36 ${
                     style === s.id 
                       ? 'ring-2 ring-indigo-500 ring-offset-2 ring-offset-[#0f172a] shadow-lg' 
                       : 'opacity-70 hover:opacity-100 hover:scale-[1.02]'
                   }`}
                 >
                   <img src={s.image} alt={s.label} className="absolute inset-0 w-full h-full object-cover" />
                   <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent p-3 flex flex-col justify-end">
                      <div className="flex items-center justify-between mb-0.5">
                         <span className={`text-xs font-bold leading-tight ${style === s.id ? 'text-white' : 'text-slate-200'}`}>{s.label}</span>
                         {style === s.id && <div className="bg-indigo-600 rounded-full p-0.5"><Check className="w-2.5 h-2.5 text-white"/></div>}
                      </div>
                   </div>
                 </button>
               ))}
             </div>

             {isPinterest && (
               <div className="bg-slate-900/50 p-4 rounded-xl border border-slate-800 animate-in fade-in">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">AI Suggestions</span>
                    <button onClick={handlePinterestSuggest} disabled={isLoadingSuggestions || !topic} className="text-[10px] bg-red-600 text-white px-3 py-1.5 rounded-lg font-bold flex gap-2 items-center hover:bg-red-500">
                       {isLoadingSuggestions ? <Loader2 className="w-3 h-3 animate-spin"/> : <Sparkles className="w-3 h-3"/>}
                       {isLoadingSuggestions ? t.suggesting : t.suggestPinterest}
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                     {pinterestSuggestions.length > 0 ? pinterestSuggestions.map((sug, idx) => (
                       <button key={idx} onClick={() => setElements({...elements, customInstructions: `${elements.customInstructions} ${sug}`.trim()})} className="bg-slate-950 border border-slate-800 hover:border-indigo-500 hover:text-indigo-400 text-slate-400 text-[10px] px-3 py-1.5 rounded-full transition-colors">
                         {sug}
                       </button>
                     )) : <span className="text-[10px] text-slate-600 italic">{t.noSuggestions}</span>}
                  </div>
               </div>
             )}
          </div>

          {/* ADVANCED SETTINGS BAR */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
             <div className="md:col-span-4 bg-slate-950/50 p-1 rounded-xl border border-slate-800 flex items-center gap-1">
                 <div className="flex-1">
                    <div className="flex bg-slate-900/50 rounded-lg p-1">
                      {resolutions.map((res, idx) => (
                        <button key={res} onClick={() => setResolutionIndex(idx)} className={`flex-1 text-[10px] py-2 rounded-md font-bold transition-all ${resolutionIndex === idx ? 'bg-white/10 text-white shadow-sm' : 'text-slate-500 hover:text-slate-300'}`}>{res}</button>
                      ))}
                    </div>
                 </div>
                 <div className="h-8 w-px bg-slate-800"></div>
                 <div className="relative w-32 px-1">
                    <select value={selectedRatio} onChange={(e) => setSelectedRatio(e.target.value as AspectRatio)} className="w-full bg-transparent text-xs font-bold text-white py-2 pl-2 pr-6 outline-none appearance-none cursor-pointer">
                      {Object.values(AspectRatio).map((ratio) => <option key={ratio} value={ratio} className="bg-slate-900 text-slate-300">{ratio}</option>)}
                    </select>
                    <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3 h-3 text-slate-500 pointer-events-none" />
                 </div>
             </div>
             <div className="md:col-span-8 grid grid-cols-1 md:grid-cols-2 gap-4">
                {isGamingStyle && (
                  <div className="relative group/field animate-in fade-in zoom-in-95">
                    <Gamepad2 className="absolute left-3 top-2.5 w-4 h-4 text-emerald-500 z-10" />
                    <input type="text" value={gameName} onChange={(e) => setGameName(e.target.value)} placeholder="Game Name" className="w-full bg-slate-950/50 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-sm text-white focus:border-emerald-500/50 outline-none transition-all" />
                  </div>
                )}
                {isReferenceStyle && (
                  <div className="relative group/field animate-in fade-in zoom-in-95">
                    <LinkIcon className="absolute left-3 top-2.5 w-4 h-4 text-sky-500 z-10" />
                    <input type="text" value={referenceUrl} onChange={(e) => setReferenceUrl(e.target.value)} placeholder="https://..." className="w-full bg-slate-950/50 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-sm text-white focus:border-sky-500/50 outline-none transition-all" />
                  </div>
                )}
                <div className={`relative group/field ${isGamingStyle || isReferenceStyle ? 'md:col-span-1' : 'md:col-span-2'}`}>
                   <span className="absolute left-3 top-2.5 text-slate-600 text-xs font-bold">NOT</span>
                   <input type="text" value={negativePrompt} onChange={(e) => setNegativePrompt(e.target.value)} placeholder="blurry, text..." className="w-full bg-slate-950/50 border border-slate-800 rounded-xl pl-12 pr-3 py-2 text-sm text-white focus:border-red-500/30 outline-none transition-all" />
                </div>
             </div>
          </div>

          {/* --- COMPOSITION & ELEMENTS ACCORDION --- */}
          <div className="bg-slate-950/30 rounded-2xl border border-white/5 overflow-hidden">
             <button onClick={() => setShowSettings(!showSettings)} className="w-full flex items-center justify-between p-4 hover:bg-white/5 transition-colors">
                <div className="flex items-center gap-2">
                   <div className="bg-emerald-500/10 p-1.5 rounded-lg"><Settings2 className="w-4 h-4 text-emerald-400" /></div>
                   <span className="text-sm font-bold text-slate-200">{t.compositionElements}</span>
                </div>
                {showSettings ? <ChevronUp className="w-4 h-4 text-slate-500" /> : <ChevronDown className="w-4 h-4 text-slate-500" />}
             </button>
             
             {showSettings && (
               <div className="p-4 pt-0 space-y-8 animate-in slide-in-from-top-2">
                  <div className="h-px bg-white/5 w-full mb-4"></div>

                  {/* 1. CHARACTER & FACE UPLOAD (NEW) */}
                  <div className="bg-slate-900/40 rounded-xl p-4 border border-white/5">
                      <div className="flex items-center justify-between mb-4">
                         <span className="text-sm font-bold text-slate-300 flex items-center gap-2"><User className="w-4 h-4"/> {t.characterRef}</span>
                         <div className="flex bg-slate-950 p-1 rounded-lg">
                            {['Show Face', 'Faceless'].map(mode => (
                               <button key={mode} onClick={() => setElements({...elements, faceVisibility: mode as any})} className={`px-3 py-1.5 rounded text-[10px] font-bold transition-all ${elements.faceVisibility === mode ? 'bg-indigo-600 text-white' : 'text-slate-500 hover:text-slate-300'}`}>
                                 {mode === 'Show Face' ? t.showFace : t.faceless}
                               </button>
                            ))}
                         </div>
                      </div>
                      
                      {elements.faceVisibility === 'Show Face' && (
                        <div className="flex gap-4 items-start animate-in fade-in">
                           <div className="relative w-24 h-24 bg-slate-800 rounded-lg flex-shrink-0 flex items-center justify-center border border-slate-700 overflow-hidden group/upload cursor-pointer" onClick={() => charInputRef.current?.click()}>
                              {elements.characterImage ? (
                                  <img src={elements.characterImage} alt="Char" className="w-full h-full object-cover" />
                              ) : (
                                  <Upload className="w-8 h-8 text-slate-500" />
                              )}
                              <input type="file" ref={charInputRef} className="hidden" accept="image/*" onChange={handleCharUpload} />
                              {isAnalyzingChar && <div className="absolute inset-0 bg-black/60 flex items-center justify-center"><Loader2 className="w-5 h-5 animate-spin text-white"/></div>}
                           </div>
                           <div className="flex-1 space-y-2">
                               <p className="text-[10px] text-slate-500">{t.uploadDesc}</p>
                               <div className="flex items-center gap-2">
                                  <span className="text-[10px] font-bold text-slate-400">{t.charPos}:</span>
                                  {['Left', 'Center', 'Right'].map(pos => (
                                      <button key={pos} onClick={() => setElements({...elements, characterPosition: pos as any})} className={`px-2 py-1 text-[10px] rounded border ${elements.characterPosition === pos ? 'bg-indigo-600 border-indigo-500 text-white' : 'bg-slate-900 border-slate-800 text-slate-500'}`}>{pos}</button>
                                  ))}
                               </div>
                               {elements.characterDescription && <p className="text-[9px] text-indigo-300 bg-indigo-500/10 p-1.5 rounded line-clamp-2">{elements.characterDescription}</p>}
                           </div>
                        </div>
                      )}
                  </div>

                  {/* 2. TEXT STUDIO */}
                  <div className="space-y-4">
                     <div className="flex items-center justify-between">
                       <SectionHeader 
                          icon={<Type className="w-4 h-4 text-white"/>} title={t.textOverlay} 
                          isOptimized={elements.aiOptimizeText} 
                          onToggle={(val) => setElements({...elements, aiOptimizeText: val})} 
                        />
                       <label className="relative inline-flex items-center cursor-pointer ml-4">
                          <input type="checkbox" checked={elements.addText} onChange={(e) => setElements({...elements, addText: e.target.checked})} className="sr-only peer" />
                          <div className={`w-9 h-5 rounded-full peer peer-checked:bg-emerald-500 bg-slate-700 peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all`}></div>
                       </label>
                     </div>

                     {!elements.aiOptimizeText && elements.addText && (
                       <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 bg-slate-900/30 p-4 rounded-2xl border border-slate-800">
                          {/* Content */}
                          <div className="space-y-4">
                             <div className="flex gap-2 bg-slate-950 p-1 rounded-lg">
                                {['AI Generated', 'Custom'].map(m => (
                                   <button key={m} onClick={() => setElements({...elements, textMode: m as any})} className={`flex-1 text-[10px] py-1.5 rounded font-bold ${elements.textMode === m ? 'bg-slate-800 text-white' : 'text-slate-500'}`}>{m}</button>
                                ))}
                             </div>
                             <div className="flex gap-2">
                                <select value={elements.textLanguage} onChange={(e) => setElements({...elements, textLanguage: e.target.value as any})} className="bg-slate-950 border border-slate-800 text-[10px] text-white px-2 py-2 rounded-lg outline-none w-24">
                                   <option value="English">English</option>
                                   <option value="Persian">Persian</option>
                                </select>
                                <input disabled={elements.textMode === 'AI Generated'} type="text" value={elements.customText} onChange={(e) => setElements({...elements, customText: e.target.value})} placeholder={elements.textMode === 'AI Generated' ? "AI will write text..." : "Your text here..."} className="flex-1 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white px-3 py-2 outline-none disabled:opacity-50" dir={elements.textLanguage === 'Persian' ? 'rtl' : 'ltr'}/>
                             </div>
                             <div className="space-y-1">
                                <label className="text-[10px] font-bold text-slate-500 uppercase">{t.textColor}</label>
                                <div className="flex gap-1.5 flex-wrap">
                                  {COLORS.map(c => (
                                    <button key={c.id} onClick={() => setElements({...elements, textColor: c.id})} className={`w-5 h-5 rounded-full border-2 ${elements.textColor === c.id ? 'border-white scale-110 shadow-lg' : 'border-transparent'}`} style={{ backgroundColor: c.hex }} title={c.id} />
                                  ))}
                                </div>
                             </div>
                             <div className="space-y-1">
                                <label className="text-[10px] font-bold text-slate-500 uppercase">{t.textPos}</label>
                                <div className="grid grid-cols-3 gap-1 w-20 h-20 bg-slate-950 p-1 rounded border border-slate-800">
                                   {POSITIONS.map(pos => (
                                      <button 
                                        key={pos}
                                        onClick={() => setElements({...elements, textPosition: pos})}
                                        className={`rounded-sm transition-colors border border-slate-800 ${elements.textPosition === pos ? 'bg-indigo-500 border-indigo-400' : 'bg-slate-900 hover:bg-slate-800'}`}
                                        title={pos}
                                      />
                                   ))}
                                </div>
                             </div>
                          </div>

                          {/* Font Grid */}
                          <div className="space-y-3">
                             <label className="text-[10px] font-bold text-slate-500 uppercase">{t.font}</label>
                             <div className="grid grid-cols-2 gap-2 h-32 overflow-y-auto pr-1 custom-scrollbar">
                                {FONTS.map(f => (
                                  <button key={f.id} onClick={() => setElements({...elements, fontStyle: f.id})} className={`p-2 rounded border text-center transition-all ${elements.fontStyle === f.id ? 'border-indigo-500 bg-indigo-500/10 text-white' : 'border-slate-800 bg-slate-950 text-slate-400'}`}>
                                     <span style={{ fontFamily: f.family, fontWeight: f.weight || 'normal' }} className="text-sm block">Abc</span>
                                     <span style={{ fontFamily: f.family, fontWeight: f.weight || 'normal' }} className="text-xs block">گچپ</span>
                                     <span className="text-[9px] opacity-40 mt-1 block font-sans">{f.label}</span>
                                  </button>
                                ))}
                             </div>
                          </div>

                          {/* Effect Grid */}
                          <div className="space-y-2">
                             <label className="text-[10px] font-bold text-slate-500 uppercase">{t.effect}</label>
                             <div className="grid grid-cols-2 gap-2">
                                {[
                                    { id: 'None', label: 'None', class: '' },
                                    { id: 'Glow', label: 'Glow', class: 'text-effect-glow' },
                                    { id: 'Outline', label: 'Outline', class: 'text-effect-outline' },
                                    { id: '3D Extrude', label: '3D', class: 'text-effect-3d' },
                                    { id: 'Drop Shadow', label: 'Shadow', class: 'text-effect-shadow' }
                                ].map(eff => (
                                    <button 
                                      key={eff.id} 
                                      onClick={() => setElements({...elements, textEffect: eff.id})}
                                      className={`p-2 rounded border text-[10px] font-bold transition-all ${elements.textEffect === eff.id ? 'border-indigo-500 bg-indigo-500/10 text-white' : 'border-slate-800 bg-slate-950 text-slate-400'}`}
                                    >
                                       <span className={eff.class}>{eff.label}</span>
                                    </button>
                                ))}
                             </div>
                          </div>
                       </div>
                     )}
                  </div>

                  {/* 3. VISUAL SELECTORS (Background, Framing, Lighting) */}
                  <div className="space-y-6">
                     
                     {/* Background */}
                     <div>
                       <SectionHeader 
                          icon={<Aperture className="w-4 h-4 text-white"/>} title={t.background} 
                          isOptimized={elements.aiOptimizeBackground} 
                          onToggle={(val) => setElements({...elements, aiOptimizeBackground: val})} 
                       />
                       {!elements.aiOptimizeBackground && (
                         <VisualGridSelector
                           options={['Standard', 'Blurred', 'Solid White', 'Green Screen', 'Detailed Environment']}
                           selected={elements.backgroundMode}
                           onSelect={(val) => setElements({...elements, backgroundMode: val as any})}
                         />
                       )}
                     </div>

                     {/* Framing */}
                     <div>
                       <SectionHeader 
                          icon={<Camera className="w-4 h-4 text-white"/>} title={t.framing} 
                          isOptimized={elements.aiOptimizeFraming} 
                          onToggle={(val) => setElements({...elements, aiOptimizeFraming: val})} 
                       />
                       {!elements.aiOptimizeFraming && (
                         <VisualGridSelector
                           options={['Medium Shot', 'Extreme Close-Up', 'Wide Shot', 'Low Angle', 'Selfie Style', 'Overhead']}
                           selected={elements.shotType}
                           onSelect={(val) => setElements({...elements, shotType: val as any})}
                           descriptions={t.framingDesc}
                         />
                       )}
                     </div>

                     {/* Lighting & Expression */}
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                           <SectionHeader 
                              icon={<SunDim className="w-4 h-4 text-white"/>} title={t.lighting} 
                              isOptimized={elements.aiOptimizeLighting} 
                              onToggle={(val) => setElements({...elements, aiOptimizeLighting: val})} 
                           />
                           {!elements.aiOptimizeLighting && (
                              <VisualGridSelector
                                options={['Studio', 'Neon', 'Natural', 'Dramatic', 'Golden Hour']}
                                selected={elements.lighting}
                                onSelect={(val) => setElements({...elements, lighting: val as any})}
                              />
                           )}
                        </div>
                        <div>
                           <div className="flex items-center justify-between mb-4 bg-slate-900/50 p-3 rounded-lg border border-slate-800">
                              <div className="flex items-center gap-2">
                                <Smile className="w-4 h-4 text-white"/>
                                <span className="text-sm font-bold text-slate-300 uppercase tracking-wide">{t.expression}</span>
                              </div>
                           </div>
                           <VisualGridSelector
                              options={['Surprised', 'Happy', 'Serious', 'Neutral', 'Scared', 'Angry']}
                              selected={elements.expression}
                              onSelect={(val) => setElements({...elements, expression: val as any})}
                           />
                        </div>
                     </div>

                  </div>
               </div>
             )}
          </div>

          {/* GENERATE BUTTON (Liquid Animation) */}
          <button
            onClick={handleGeneratePrompt}
            disabled={isGeneratingPrompt || !topic}
            className="w-full relative group overflow-hidden rounded-2xl p-[1px] shadow-2xl shadow-indigo-500/30 transform active:scale-95 transition-transform"
          >
            {/* Liquid Fill BG */}
            <div className={`absolute inset-0 bg-gradient-to-r from-indigo-600 to-purple-600 ${isGeneratingPrompt ? 'liquid-fill-anim' : 'translate-y-full group-hover:translate-y-0'} transition-transform duration-500 ease-in-out`}></div>
            
            {/* Default BG */}
            <div className="absolute inset-0 bg-slate-900 group-hover:bg-opacity-0 transition-colors duration-300"></div>

            <div className="relative h-16 flex items-center justify-center gap-3 z-10">
               {isGeneratingPrompt ? (
                  <>
                    <Loader2 className="w-6 h-6 animate-spin text-white" />
                    <span className="text-xl font-bold text-white tracking-wide uppercase">{t.thinking}</span>
                  </>
               ) : (
                  <>
                    <Sparkles className="w-6 h-6 text-indigo-400 group-hover:text-white transition-colors" />
                    <span className="text-xl font-bold text-white tracking-wide uppercase group-hover:scale-105 transition-transform">{t.generateBtn}</span>
                  </>
               )}
            </div>
          </button>

        </div>
      </div>

      {/* 2. RESULTS SECTION */}
      {generatedData && (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-8 duration-700">
          
          {/* Prompt Result Card */}
          <div className="bg-[#0f172a]/60 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl backdrop-blur-xl">
             <div className="bg-slate-900/50 px-6 py-4 border-b border-white/5 flex flex-col md:flex-row justify-between md:items-center gap-4">
                <div>
                   <h3 className="text-indigo-400 font-bold text-[10px] tracking-[0.2em] uppercase mb-1 flex items-center gap-1.5"><Zap className="w-3 h-3"/> {t.promptStrategy}</h3>
                   <h2 className="text-xl font-bold text-white leading-tight">{generatedData.title}</h2>
                </div>
                <button 
                  onClick={handleCopyPrompt}
                  className="flex items-center gap-2 bg-white/5 hover:bg-white/10 border border-white/5 text-slate-300 hover:text-white px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-green-400" /> : <Copy className="w-3.5 h-3.5" />}
                  {copied ? t.copied : t.copy}
                </button>
             </div>

             <div className="p-6 md:p-8 space-y-6">
                {/* Visual Segments */}
                <div className="bg-slate-950/80 rounded-2xl p-6 border border-slate-800 leading-loose text-slate-300 font-medium text-lg relative shadow-inner">
                   {generatedData.segments ? (
                      <div dir="ltr" className="text-left font-light">
                        <span className="text-slate-500">Create a YouTube thumbnail featuring</span>
                        {renderPromptSegment("Subject", generatedData.segments.subject, <Focus className="w-3 h-3"/>, "text-pink-300", "bg-pink-500/20")}
                        <span className="text-slate-500">doing</span>
                        {renderPromptSegment("Action", generatedData.segments.action, <MonitorPlay className="w-3 h-3"/>, "text-orange-300", "bg-orange-500/20")}
                        <span className="text-slate-500">in a</span>
                        {renderPromptSegment("Environment", generatedData.segments.environment, <Layers className="w-3 h-3"/>, "text-sky-300", "bg-sky-500/20")}
                        <span className="text-slate-500">setting. Use</span>
                        {renderPromptSegment("Lighting", generatedData.segments.lighting, <Sun className="w-3 h-3"/>, "text-yellow-300", "bg-yellow-500/20")}
                        <span className="text-slate-500">lighting. Composition:</span>
                        {renderPromptSegment("Composition", generatedData.segments.composition, <Maximize className="w-3 h-3"/>, "text-purple-300", "bg-purple-500/20")}
                        <span className="text-slate-500">. Style: {generatedData.visualStyle}.</span>
                      </div>
                    ) : (
                      <div dir="ltr" className="text-left">{generatedData.promptText}</div>
                    )}
                </div>

                {/* VISUALIZE ACTION */}
                <div className="flex gap-4">
                   <button
                    onClick={handleVisualize}
                    disabled={isGeneratingImage}
                    className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-3.5 rounded-xl shadow-lg shadow-emerald-900/20 transition-all flex items-center justify-center gap-2 group border-t border-emerald-400/20"
                  >
                    {isGeneratingImage ? <Loader2 className="w-5 h-5 animate-spin" /> : <Palette className="w-5 h-5 group-hover:-rotate-12 transition-transform" />}
                    {isGeneratingImage ? t.generatingImage : t.visualize}
                  </button>
                </div>
             </div>
          </div>

          {/* GENERATED IMAGE CARD */}
          {currentImage && (
            <div className="bg-[#0f172a] border border-slate-800 rounded-3xl overflow-hidden shadow-2xl relative group animate-in zoom-in-95 duration-500">
               <div className="relative aspect-video bg-black/50 flex items-center justify-center overflow-hidden pattern-grid-lg">
                 <img 
                   src={currentImage} 
                   alt="Generated" 
                   className={`max-w-full max-h-full object-contain shadow-2xl transition-all duration-300 ${showContextPreview ? 'opacity-0 absolute' : 'opacity-100'}`} 
                 />
                 
                 {/* FEED PREVIEW MODE */}
                 {showContextPreview && (
                   <div className="w-full h-full flex flex-col items-center justify-center bg-[#0f0f0f] p-4 relative font-sans" dir="ltr">
                     <div className="max-w-[380px] w-full cursor-pointer group/card select-none transform hover:scale-[1.01] transition-transform">
                       <div className="relative aspect-video rounded-xl overflow-hidden mb-3 shadow-2xl ring-1 ring-white/10">
                         <img src={currentImage} className="w-full h-full object-cover" alt="Thumbnail" />
                         <div className="absolute bottom-1.5 right-1.5 bg-black/80 text-white text-[10px] font-bold px-1.5 py-0.5 rounded">12:45</div>
                         <div className="absolute inset-0 bg-black/0 group-hover/card:bg-black/10 transition-colors"></div>
                       </div>
                       <div className="flex gap-3 items-start px-1">
                         <div className="w-9 h-9 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex-shrink-0 flex items-center justify-center text-white font-bold text-sm shadow-sm">
                            {previewChannel.charAt(0).toUpperCase()}
                         </div>
                         <div className="flex flex-col flex-1 min-w-0">
                           <input 
                             value={previewTitle}
                             onChange={(e) => setPreviewTitle(e.target.value)}
                             className="bg-transparent text-white font-semibold text-[15px] leading-snug mb-1 outline-none border-none p-0 w-full placeholder-slate-600 truncate focus:text-indigo-400 transition-colors"
                           />
                           <div className="text-[#aaa] text-[12px] flex flex-col leading-snug">
                              <span className="truncate hover:text-white transition-colors">{previewChannel} • 1.2M views • 2 hours ago</span>
                           </div>
                         </div>
                         <MoreVertical className="w-5 h-5 text-white opacity-0 group-hover/card:opacity-100 transition-opacity" />
                       </div>
                     </div>
                   </div>
                 )}
               </div>

               {/* TOOLBAR */}
               <div className="bg-[#0b1120] px-6 py-4 border-t border-slate-800 flex flex-col md:flex-row gap-4 justify-between items-center">
                   <div className="flex-1 w-full relative group/edit">
                      <input
                        type="text"
                        value={editInstruction}
                        onChange={(e) => setEditInstruction(e.target.value)}
                        placeholder={t.editImage}
                        className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white focus:ring-2 focus:ring-indigo-500/50 outline-none transition-all placeholder-slate-600"
                        onKeyDown={(e) => e.key === 'Enter' && handleEditImage()}
                      />
                      <Wand2 className="w-4 h-4 text-slate-500 absolute left-3 top-3 rtl:right-3 rtl:left-auto group-focus-within/edit:text-indigo-400 transition-colors" />
                   </div>
                   <div className="flex gap-2">
                      <button onClick={handleEditImage} disabled={isProcessingEdit} className="bg-slate-800 hover:bg-indigo-600 hover:text-white text-slate-300 px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex gap-2 items-center">
                         {isProcessingEdit ? <Loader2 className="w-4 h-4 animate-spin"/> : <Edit className="w-4 h-4"/>} {t.applyEdit}
                      </button>
                      <button onClick={() => setShowContextPreview(!showContextPreview)} className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex gap-2 items-center ${showContextPreview ? 'bg-white text-black' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'}`}>
                         <MonitorPlay className="w-4 h-4"/> {t.previewMode}
                      </button>
                      <a href={currentImage} download="thumbnail.png" className="bg-slate-800 hover:bg-slate-700 text-white p-2.5 rounded-xl"><Save className="w-4 h-4"/></a>
                   </div>
               </div>
            </div>
          )}

        </div>
      )}
    </div>
  );
};

export default PromptGenerator;
