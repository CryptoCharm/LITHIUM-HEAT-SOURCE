import React, { useState } from 'react';
import { Download, X, Layers, FileArchive, FileText, Maximize2 } from 'lucide-react';
import JSZip from 'jszip';
import jsPDF from 'jspdf';
import { GeneratedImage, TaskGroup } from '../types';
import { Lang } from '../App';

interface ResultGalleryProps {
  task: TaskGroup;
  lang: Lang;
}

export const ResultGallery: React.FC<ResultGalleryProps> = ({ task, lang }) => {
  const [expanded, setExpanded] = useState(false);
  const [selectedImage, setSelectedImage] = useState<GeneratedImage | null>(null);
  const [isDownloading, setIsDownloading] = useState(false);

  const t = {
    en: {
      generated: "generated",
      download: "Download",
      resultSuite: "Result Suite",
      images: "images",
      collapse: "Collapse Stack",
      expand: "Expand All",
      viewAll: "Click to view all",
      archive: "Download All (ZIP)",
      archiving: "Archiving...",
      pdf: "Download PDF",
      generating: "Generating...",
      fullRes: "Download Original",
      failZip: "Failed to create ZIP archive.",
      failPdf: "Failed to create PDF."
    },
    zh: {
      generated: "生成图片",
      download: "下载",
      resultSuite: "生成套图",
      images: "张",
      collapse: "收起堆叠",
      expand: "展开全部",
      viewAll: "点击查看全部",
      archive: "打包下载 (ZIP)",
      archiving: "压缩中...",
      pdf: "下载 PDF",
      generating: "生成中...",
      fullRes: "下载原图",
      failZip: "创建 ZIP 失败。",
      failPdf: "创建 PDF 失败。"
    }
  };

  const text = t[lang];

  if (task.images.length === 0) return null;

  // Single Image Mode
  if (task.images.length === 1) {
    const img = task.images[0];
    return (
      <div className="mt-4 bg-slate-800 p-4 rounded-lg border border-slate-700">
        <h3 className="text-gray-300 text-sm mb-2 font-mono">{text.generated}_{img.id.slice(0,6)}.png</h3>
        <div className="relative group w-full max-w-md mx-auto aspect-square bg-slate-900 rounded-lg overflow-hidden cursor-pointer" onClick={() => setSelectedImage(img)}>
          <img src={img.url} alt="Generated" className="w-full h-full object-contain" />
          <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
             <Maximize2 className="text-white w-8 h-8" />
          </div>
        </div>
        <div className="mt-3 flex justify-end">
          <a href={img.url} download={`lithium_${img.id}.png`} className="flex items-center gap-2 bg-brand-primary hover:bg-orange-600 text-white px-4 py-2 rounded text-sm transition">
            <Download size={16} /> {text.download}
          </a>
        </div>
        {selectedImage && <FullscreenModal image={selectedImage} onClose={() => setSelectedImage(null)} lang={lang} text={text} />}
      </div>
    );
  }

  // Multi Image Stack Mode
  return (
    <div className="mt-4 bg-slate-800 p-4 rounded-lg border border-slate-700">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-gray-300 font-medium flex items-center gap-2">
            <Layers size={18} className="text-brand-accent"/> 
            {text.resultSuite} ({task.images.length} {text.images})
        </h3>
        <button 
          onClick={() => setExpanded(!expanded)} 
          className="text-brand-accent hover:text-blue-300 text-sm underline"
        >
          {expanded ? text.collapse : text.expand}
        </button>
      </div>

      {/* Stack/Grid View */}
      <div className={`grid gap-4 transition-all duration-300 ${expanded ? 'grid-cols-2 md:grid-cols-3' : 'grid-cols-1 md:grid-cols-1'}`}>
        {!expanded ? (
          <div 
            className="relative w-full max-w-sm mx-auto aspect-square cursor-pointer group"
            onClick={() => setExpanded(true)}
          >
            {/* Stack Effect */}
            <div className="absolute top-0 left-2 w-full h-full bg-slate-600 rounded-lg transform translate-x-4 translate-y-2 opacity-60"></div>
            <div className="absolute top-0 left-1 w-full h-full bg-slate-700 rounded-lg transform translate-x-2 translate-y-1 opacity-80"></div>
            <div className="relative w-full h-full bg-slate-900 rounded-lg border-2 border-slate-600 overflow-hidden z-10 hover:border-brand-primary transition-colors">
                 <img src={task.images[0].url} className="w-full h-full object-cover" alt="Cover" />
                 <div className="absolute bottom-0 w-full bg-black/70 p-2 text-center text-xs text-white">
                    {text.viewAll} {task.images.length}
                 </div>
            </div>
          </div>
        ) : (
          task.images.map((img, idx) => (
            <div key={img.id} className="relative group bg-slate-900 rounded-lg overflow-hidden border border-slate-700">
                <img 
                    src={img.url} 
                    className="w-full aspect-square object-cover cursor-pointer" 
                    onClick={() => setSelectedImage(img)}
                    alt={`Gen ${idx}`}
                />
                <div className="p-2 flex justify-between items-center bg-slate-900/90">
                    <span className="text-xs text-gray-400">#{idx + 1}</span>
                    <a href={img.url} download={`lithium_${img.id}.png`} className="text-brand-primary hover:text-white">
                        <Download size={16} />
                    </a>
                </div>
            </div>
          ))
        )}
      </div>

      {/* Batch Actions */}
      <div className="mt-6 pt-4 border-t border-slate-700 flex flex-wrap gap-3 justify-center">
        <button 
            onClick={() => handleDownloadZip(task.images, setIsDownloading, text.failZip)}
            disabled={isDownloading}
            className="flex items-center gap-2 bg-slate-700 hover:bg-slate-600 px-4 py-2 rounded text-sm transition disabled:opacity-50"
        >
            <FileArchive size={16} /> {isDownloading ? text.archiving : text.archive}
        </button>
        <button 
            onClick={() => handleDownloadPDF(task.images, setIsDownloading, text.failPdf)}
            disabled={isDownloading}
            className="flex items-center gap-2 bg-slate-700 hover:bg-slate-600 px-4 py-2 rounded text-sm transition disabled:opacity-50"
        >
            <FileText size={16} /> {isDownloading ? text.generating : text.pdf}
        </button>
      </div>

      {selectedImage && <FullscreenModal image={selectedImage} onClose={() => setSelectedImage(null)} lang={lang} text={text} />}
    </div>
  );
};

// Modal Component
const FullscreenModal: React.FC<{ image: GeneratedImage; onClose: () => void; lang: Lang; text: any }> = ({ image, onClose, text }) => {
    return (
        <div className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4 backdrop-blur-sm">
            <button onClick={onClose} className="absolute top-4 right-4 text-white hover:text-red-500">
                <X size={32} />
            </button>
            <div className="max-w-5xl max-h-screen overflow-auto">
                <img src={image.url} alt="Full resolution" className="w-full h-auto max-h-[90vh] object-contain rounded-md shadow-2xl" />
                <div className="mt-4 text-center">
                    <span className="bg-slate-800 text-gray-300 px-3 py-1 rounded-full text-xs">
                        {image.resolution} • {image.aspectRatio}
                    </span>
                    <a href={image.url} download={`lithium_full_${image.id}.png`} className="ml-4 inline-flex items-center gap-2 text-brand-primary hover:underline cursor-pointer">
                        <Download size={16} /> {text.fullRes}
                    </a>
                </div>
            </div>
        </div>
    );
};

// Logic for Batch Downloads
const handleDownloadZip = async (images: GeneratedImage[], setLoading: (b: boolean) => void, errorMsg: string) => {
    setLoading(true);
    try {
        const zip = new JSZip();
        const folder = zip.folder("lithium_heat_source_assets");
        
        images.forEach((img, idx) => {
            const data = img.url.split(',')[1];
            folder?.file(`image_${idx + 1}_${img.id.slice(0,5)}.png`, data, { base64: true });
        });

        const content = await zip.generateAsync({ type: "blob" });
        const url = URL.createObjectURL(content);
        const a = document.createElement("a");
        a.href = url;
        a.download = "lithium_assets_pack.zip";
        a.click();
        URL.revokeObjectURL(url);
    } catch (e) {
        console.error("Zip failed", e);
        alert(errorMsg);
    } finally {
        setLoading(false);
    }
};

const handleDownloadPDF = async (images: GeneratedImage[], setLoading: (b: boolean) => void, errorMsg: string) => {
    setLoading(true);
    try {
        const doc = new jsPDF();
        
        images.forEach((img, idx) => {
            if (idx > 0) doc.addPage();
            
            const pageWidth = doc.internal.pageSize.getWidth();
            const pageHeight = doc.internal.pageSize.getHeight();
            
            // Simple logic to fit image on page
            doc.addImage(img.url, 'PNG', 10, 10, pageWidth - 20, 0); // 0 height auto-scales
            doc.text(`Asset #${idx + 1} - ${img.resolution}`, 10, pageHeight - 10);
        });

        doc.save("lithium_assets_catalog.pdf");
    } catch (e) {
        console.error("PDF failed", e);
        alert(errorMsg);
    } finally {
        setLoading(false);
    }
};