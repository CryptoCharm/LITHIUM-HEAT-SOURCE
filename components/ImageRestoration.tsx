import React, { useState, useRef } from 'react';
import { Upload, Zap, Loader2, ArrowRightLeft } from 'lucide-react';
import { ImageResolution, TaskGroup, GeneratedImage, AspectRatio } from '../types';
import { generateImages } from '../services/geminiService';
import { ResultGallery } from './ResultGallery';
import { Lang } from '../App';

interface ImageRestorationProps {
  onTaskCreate: (task: TaskGroup) => void;
  tasks: TaskGroup[];
  lang: Lang;
}

export const ImageRestoration: React.FC<ImageRestorationProps> = ({ onTaskCreate, tasks, lang }) => {
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [customPrompt, setCustomPrompt] = useState('');
  const [targetRes, setTargetRes] = useState<ImageResolution>(ImageResolution.RES_4K);
  const [isProcessing, setIsProcessing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const t = {
    en: {
      title: "High-Fidelity Restoration",
      origImg: "Original Image",
      upload: "Upload Photo",
      target: "Target Output",
      res1k: "1K - Standard",
      res2k: "2K - High Def",
      res4k: "4K - Ultra HD (Commercial)",
      magic: "Magic Edit (Optional)",
      magicHelp: "Leave empty for pure enhancement. Type to modify (e.g., 'Make background white', 'Change hair to blonde') while keeping details.",
      magicPlace: "e.g. Enhance lighting, make the background a luxury living room...",
      btnMagic: "Execute Magic Edit",
      btnRestore: "Upscale & Restore",
      modelInfo: "Using Nano Banana Pro Model for",
      precision: "Photorealistic Precision",
      history: "Restoration History",
      noHistory: "No restorations performed yet.",
      fail: "Restoration process failed."
    },
    zh: {
      title: "高保真清晰度修复",
      origImg: "原始图片",
      upload: "上传照片",
      target: "目标分辨率",
      res1k: "1K - 标准",
      res2k: "2K - 高清",
      res4k: "4K - 超清 (商业级)",
      magic: "魔法编辑 (可选)",
      magicHelp: "留空仅进行画质增强。输入指令可修改内容 (如 '背景换成白色', '头发变金色') 但保持细节不变。",
      magicPlace: "例如：增强光线，将背景改为豪华客厅...",
      btnMagic: "执行魔法编辑",
      btnRestore: "超清修复",
      modelInfo: "使用 Nano Banana Pro 模型进行",
      precision: "光影质感重绘",
      history: "修复记录",
      noHistory: "暂无修复记录。",
      fail: "修复失败。"
    }
  };
  const text = t[lang];

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (ev) => {
        setUploadedImage(ev.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRestore = async () => {
    if (!uploadedImage) return;

    setIsProcessing(true);
    const taskId = Date.now().toString();
    
    // Quick aspect ratio check
    let detectedRatio = AspectRatio.SQUARE;
    const img = new Image();
    img.src = uploadedImage;
    await img.decode();
    const r = img.width / img.height;
    if (r > 1.7) detectedRatio = AspectRatio.LANDSCAPE_16_9;
    else if (r > 1.3) detectedRatio = AspectRatio.LANDSCAPE_4_3;
    else if (r > 0.9) detectedRatio = AspectRatio.SQUARE; // 1:1 range
    else if (r > 0.7) detectedRatio = AspectRatio.PORTRAIT_3_4;
    else detectedRatio = AspectRatio.PORTRAIT_9_16;

    try {
      const results = await generateImages({
        prompt: customPrompt, // Empty = pure restoration, text = restoration + edit
        image: uploadedImage,
        aspectRatio: detectedRatio,
        resolution: targetRes,
        count: 1,
        mode: 'RESTORE'
      });

      const generatedImages: GeneratedImage[] = results.map((url, idx) => ({
        id: `${taskId}_${idx}`,
        url,
        prompt: customPrompt || "High Fidelity Restoration",
        timestamp: Date.now(),
        resolution: targetRes,
        aspectRatio: detectedRatio
      }));

      onTaskCreate({
        id: taskId,
        type: 'RESTORE',
        status: 'completed',
        timestamp: Date.now(),
        images: generatedImages,
        originalInput: uploadedImage,
      });

    } catch (error) {
        console.error("Restoration failed", error);
        alert(text.fail);
    } finally {
        setIsProcessing(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-20">
       <div className="bg-slate-800 p-6 rounded-xl border border-slate-700 shadow-xl relative overflow-hidden">
          {/* Decorative background accent */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-brand-accent/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>

          <h2 className="text-xl font-bold mb-6 text-brand-accent flex items-center gap-2">
            <Zap className="fill-current" /> {text.title}
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Input Side */}
            <div className="space-y-4">
                <label className="block text-sm font-medium text-slate-400">{text.origImg}</label>
                <div 
                    onClick={() => fileInputRef.current?.click()}
                    className={`h-64 border-2 border-dashed rounded-lg flex flex-col items-center justify-center cursor-pointer transition-colors ${uploadedImage ? 'border-brand-accent bg-black/40' : 'border-slate-600 hover:border-slate-500 bg-slate-900'}`}
                >
                    {uploadedImage ? (
                         <img src={uploadedImage} alt="Original" className="h-full w-full object-contain p-2" />
                    ) : (
                        <div className="text-center p-4">
                            <Upload className="w-10 h-10 mx-auto text-slate-500 mb-2" />
                            <p className="text-slate-400 text-sm">{text.upload}</p>
                            <input type="file" accept="image/*" className="hidden" ref={fileInputRef} onChange={handleFileChange} />
                        </div>
                    )}
                </div>

                <div className="space-y-2">
                    <label className="block text-sm font-medium text-slate-400">{text.target}</label>
                    <select 
                        value={targetRes} 
                        onChange={(e) => setTargetRes(e.target.value as ImageResolution)}
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-sm"
                    >
                        <option value={ImageResolution.RES_1K}>{text.res1k}</option>
                        <option value={ImageResolution.RES_2K}>{text.res2k}</option>
                        <option value={ImageResolution.RES_4K}>{text.res4k}</option>
                    </select>
                </div>
            </div>

            {/* Config Side */}
            <div className="space-y-4 flex flex-col justify-between">
                <div>
                    <label className="block text-sm font-medium text-slate-400 mb-2">
                        {text.magic}
                        <span className="block text-xs text-slate-500 font-normal mt-1">
                            {text.magicHelp}
                        </span>
                    </label>
                    <textarea 
                        value={customPrompt}
                        onChange={(e) => setCustomPrompt(e.target.value)}
                        placeholder={text.magicPlace}
                        className="w-full h-32 bg-slate-900 border border-slate-700 rounded-lg p-3 text-white focus:ring-2 focus:ring-brand-accent focus:border-transparent resize-none"
                    />
                </div>

                <div className="pt-4">
                    <button 
                        onClick={handleRestore}
                        disabled={isProcessing || !uploadedImage}
                        className="w-full bg-brand-accent hover:bg-sky-500 text-slate-900 font-bold py-4 rounded-lg shadow-lg flex items-center justify-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                         {isProcessing ? <Loader2 className="animate-spin" /> : <ArrowRightLeft />}
                         {customPrompt ? text.btnMagic : text.btnRestore}
                    </button>
                    <p className="text-center text-xs text-slate-500 mt-2">
                        {text.modelInfo} 
                        <span className="text-brand-accent"> {text.precision}</span>
                    </p>
                </div>
            </div>
          </div>
       </div>

       {/* Results */}
       <div>
        <h3 className="text-lg font-semibold text-slate-400 mb-4 px-2">{text.history}</h3>
         <div className="space-y-6">
            {tasks.filter(t => t.type === 'RESTORE').length === 0 && (
                <div className="text-center py-10 text-slate-600">
                    <p>{text.noHistory}</p>
                </div>
            )}
            {[...tasks].filter(t => t.type === 'RESTORE').reverse().map(task => (
                <ResultGallery key={task.id} task={task} lang={lang} />
            ))}
        </div>
       </div>
    </div>
  );
};