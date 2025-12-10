import React, { useState, useRef } from 'react';
import { Upload, Image as ImageIcon, Wand2, Loader2, Sparkles } from 'lucide-react';
import { AspectRatio, ImageResolution, TaskGroup, GeneratedImage } from '../types';
import { generateImages, understandRequirements } from '../services/geminiService';
import { ResultGallery } from './ResultGallery';
import { Lang } from '../App';

interface SuiteGeneratorProps {
  onTaskCreate: (task: TaskGroup) => void;
  tasks: TaskGroup[];
  lang: Lang;
}

export const SuiteGenerator: React.FC<SuiteGeneratorProps> = ({ onTaskCreate, tasks, lang }) => {
  const [prompt, setPrompt] = useState('');
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [ratio, setRatio] = useState<AspectRatio>(AspectRatio.SQUARE);
  const [quality, setQuality] = useState<ImageResolution>(ImageResolution.RES_1K);
  const [count, setCount] = useState(1);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const t = {
    en: {
      title: "Suite Generation",
      prodRef: "Product Reference (Optional)",
      uploadClick: "Click to upload product image",
      uploadRemove: "Remove",
      reqDesc: "Requirement Description",
      reqPlace: "Describe the scene, lighting, and style (e.g., 'A modern kitchen setting, morning sunlight, cozy atmosphere for a coffee maker')...",
      optimize: "Optimize with AI",
      aspect: "Aspect Ratio",
      res: "Resolution",
      qty: "Quantity",
      btnGen: "Generate Assets",
      btnGenerating: "Generating Materials...",
      recent: "Recent Generations",
      noHistory: "No generated history yet. Start creating!",
      alertPrompt: "Please provide a prompt or an image.",
      alertFail: "Generation failed. Please ensure you have a valid API Key selected.",
      optFail: "Analysis failed. Please try again."
    },
    zh: {
      title: "套图生成",
      prodRef: "产品参考图 (可选)",
      uploadClick: "点击上传产品图",
      uploadRemove: "移除",
      reqDesc: "需求描述",
      reqPlace: "描述场景、光线和风格 (例如: '现代厨房环境，清晨阳光，咖啡机的温馨氛围')...",
      optimize: "AI 优化指令",
      aspect: "图片比例",
      res: "分辨率",
      qty: "生成数量",
      btnGen: "生成素材",
      btnGenerating: "素材生成中...",
      recent: "最近生成记录",
      noHistory: "暂无生成记录，开始创作吧！",
      alertPrompt: "请提供提示词或参考图。",
      alertFail: "生成失败，请检查是否已选择 API Key。",
      optFail: "分析失败，请重试。"
    }
  };
  const text = t[lang];

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setUploadProgress(10);
      const reader = new FileReader();
      
      reader.onprogress = (ev) => {
         if (ev.lengthComputable) {
             const percent = Math.round((ev.loaded / ev.total) * 100);
             setUploadProgress(percent);
         }
      };

      reader.onload = (ev) => {
        setUploadedImage(ev.target?.result as string);
        setUploadProgress(100);
      };
      
      reader.readAsDataURL(file);
    }
  };

  const handleAnalyze = async () => {
    if (!prompt && !uploadedImage) return;
    setIsAnalyzing(true);
    try {
      const suggestion = await understandRequirements(prompt, uploadedImage || undefined);
      setPrompt(suggestion);
    } catch (e) {
      console.error(e);
      alert(text.optFail);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleGenerate = async () => {
    if (!prompt && !uploadedImage) {
        alert(text.alertPrompt);
        return;
    }
    
    setIsGenerating(true);
    const taskId = Date.now().toString();
    
    // Create optimistic task
    const newTask: TaskGroup = {
      id: taskId,
      type: 'SUITE',
      status: 'processing',
      timestamp: Date.now(),
      images: [],
      originalInput: uploadedImage || undefined,
      inputPrompt: prompt
    };
    
    try {
      const imagesBase64 = await generateImages({
        prompt,
        image: uploadedImage || undefined,
        aspectRatio: ratio,
        resolution: quality,
        count: count,
        mode: 'SUITE'
      });

      const generatedImages: GeneratedImage[] = imagesBase64.map((url, idx) => ({
        id: `${taskId}_${idx}`,
        url,
        prompt,
        timestamp: Date.now(),
        resolution: quality,
        aspectRatio: ratio
      }));

      newTask.status = 'completed';
      newTask.images = generatedImages;
      onTaskCreate(newTask);

    } catch (error) {
      console.error(error);
      alert(text.alertFail);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-20">
      
      {/* Input Section */}
      <div className="bg-slate-800 p-6 rounded-xl border border-slate-700 shadow-xl">
        <h2 className="text-xl font-bold mb-4 text-brand-primary flex items-center gap-2">
            <Sparkles /> {text.title}
        </h2>
        
        {/* Upload Area */}
        <div className="mb-6">
            <label className="block text-sm font-medium text-slate-400 mb-2">{text.prodRef}</label>
            <div 
                className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${uploadedImage ? 'border-brand-accent bg-slate-900' : 'border-slate-600 hover:border-slate-500'}`}
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => {
                    e.preventDefault();
                    if(e.dataTransfer.files?.[0]) {
                        // reuse logic manually for drop
                         // simplified for this example to just use click
                    }
                }}
            >
                {!uploadedImage ? (
                    <div className="cursor-pointer" onClick={() => fileInputRef.current?.click()}>
                        <Upload className="mx-auto h-12 w-12 text-slate-500 mb-2" />
                        <p className="text-sm text-slate-400">{text.uploadClick}</p>
                        <input type="file" accept="image/*" className="hidden" ref={fileInputRef} onChange={handleFileChange} />
                    </div>
                ) : (
                    <div className="relative inline-block group">
                        <img src={uploadedImage} alt="Upload" className="h-40 object-contain rounded-md" />
                        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                            <button onClick={() => {setUploadedImage(null); setUploadProgress(0);}} className="bg-red-500 text-white p-2 rounded-full"><span className="sr-only">{text.uploadRemove}</span>✕</button>
                        </div>
                        {uploadProgress < 100 && (
                             <div className="absolute bottom-0 left-0 w-full h-1 bg-gray-700">
                                <div className="h-full bg-brand-primary transition-all" style={{width: `${uploadProgress}%`}}></div>
                             </div>
                        )}
                    </div>
                )}
            </div>
        </div>

        {/* Text Prompt */}
        <div className="mb-4 relative">
             <label className="block text-sm font-medium text-slate-400 mb-2">{text.reqDesc}</label>
             <textarea 
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder={text.reqPlace}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-white focus:ring-2 focus:ring-brand-primary focus:border-transparent min-h-[120px]"
             />
             <button 
                onClick={handleAnalyze}
                disabled={isAnalyzing || (!prompt && !uploadedImage)}
                className="absolute bottom-3 right-3 text-xs bg-slate-700 hover:bg-slate-600 text-brand-accent px-3 py-1 rounded-md flex items-center gap-1 disabled:opacity-50"
             >
                {isAnalyzing ? <Loader2 className="animate-spin h-3 w-3"/> : <Wand2 className="h-3 w-3" />}
                {text.optimize}
             </button>
        </div>

        {/* Controls */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            <div>
                <label className="block text-sm font-medium text-slate-400 mb-2">{text.aspect}</label>
                <select value={ratio} onChange={(e) => setRatio(e.target.value as AspectRatio)} className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-sm">
                    {Object.values(AspectRatio).map(r => (
                        <option key={r} value={r}>{r}</option>
                    ))}
                </select>
            </div>
            <div>
                <label className="block text-sm font-medium text-slate-400 mb-2">{text.res}</label>
                <select value={quality} onChange={(e) => setQuality(e.target.value as ImageResolution)} className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-sm">
                    {Object.values(ImageResolution).map(r => (
                        <option key={r} value={r}>{r}</option>
                    ))}
                </select>
            </div>
            <div>
                <label className="block text-sm font-medium text-slate-400 mb-2">{text.qty}</label>
                <div className="flex items-center gap-4">
                    <input 
                        type="range" min="1" max="5" 
                        value={count} 
                        onChange={(e) => setCount(parseInt(e.target.value))} 
                        className="flex-1 accent-brand-primary"
                    />
                    <span className="text-white font-bold w-6">{count}</span>
                </div>
            </div>
        </div>

        <button 
            onClick={handleGenerate}
            disabled={isGenerating || (!prompt && !uploadedImage)}
            className="w-full bg-gradient-to-r from-brand-primary to-orange-600 hover:from-orange-500 hover:to-orange-700 text-white font-bold py-4 rounded-lg shadow-lg transform transition active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed flex justify-center items-center gap-2"
        >
            {isGenerating ? (
                <><Loader2 className="animate-spin" /> {text.btnGenerating}</>
            ) : (
                <><ImageIcon /> {text.btnGen}</>
            )}
        </button>
      </div>

      {/* History / Results */}
      <div>
        <h3 className="text-lg font-semibold text-slate-400 mb-4 px-2">{text.recent}</h3>
        <div className="space-y-6">
            {tasks.filter(t => t.type === 'SUITE').length === 0 && (
                <div className="text-center py-10 text-slate-600">
                    <p>{text.noHistory}</p>
                </div>
            )}
            {/* Show newest first */}
            {[...tasks].filter(t => t.type === 'SUITE').reverse().map(task => (
                <ResultGallery key={task.id} task={task} lang={lang} />
            ))}
        </div>
      </div>
    </div>
  );
};