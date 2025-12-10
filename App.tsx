import React, { useState } from 'react';
import { Package, Aperture, History, LayoutGrid, Languages } from 'lucide-react';
import { SuiteGenerator } from './components/SuiteGenerator';
import { ImageRestoration } from './components/ImageRestoration';
import { TaskGroup } from './types';

type Tab = 'SUITE' | 'RESTORE';
export type Lang = 'en' | 'zh';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<Tab>('SUITE');
  const [tasks, setTasks] = useState<TaskGroup[]>([]);
  const [lang, setLang] = useState<Lang>('zh');

  const handleTaskCreate = (task: TaskGroup) => {
    setTasks(prev => [...prev, task]);
  };

  const t = {
    en: {
      brandPrefix: "LITHIUM",
      brandSuffix: "HEAT SOURCE",
      subtitle: "ECOMMERCE AIGC OPS",
      navSuite: "Suite Generation",
      navRestore: "Clarity Repair",
      operational: "System Operational",
      powered: "Powered by Gemini Nano Banana Pro",
      suiteTitle: "Material Suite Generation",
      suiteDesc: "Create consistent, high-converting assets for Amazon & Independent Stations.",
      restoreTitle: "Intelligent Restoration",
      restoreDesc: "Upscale and fix product shots with pixel-perfect fidelity.",
    },
    zh: {
      brandPrefix: "锂热源",
      brandSuffix: " LITHIUM HEAT SOURCE",
      subtitle: "跨境电商 AIGC 运营",
      navSuite: "套图生成",
      navRestore: "清晰度修复",
      operational: "系统运行正常",
      powered: "技术支持：Gemini Nano Banana Pro",
      suiteTitle: "电商素材套图生成",
      suiteDesc: "为亚马逊及独立站打造一致性高转化率的营销素材。",
      restoreTitle: "智能超清修复",
      restoreDesc: "像素级高保真重绘，完美还原产品质感与光影。",
    }
  };

  const text = t[lang];

  return (
    <div className="min-h-screen bg-brand-dark flex flex-col md:flex-row text-white font-sans selection:bg-brand-primary selection:text-white">
      
      {/* Sidebar / Navigation */}
      <aside className="w-full md:w-64 bg-slate-900 border-r border-slate-800 flex flex-col shadow-2xl z-20">
        <div className="p-6 border-b border-slate-800">
          <h1 className="text-2xl font-black tracking-tighter text-white">
            <span className="text-brand-accent">{text.brandPrefix}</span>
            <span className="text-brand-primary block text-lg md:text-xl leading-tight mt-1">{text.brandSuffix}</span>
          </h1>
          <p className="text-xs text-slate-500 mt-2 tracking-widest uppercase">{text.subtitle}</p>
        </div>

        <nav className="flex-1 p-4 space-y-2">
          <button 
            onClick={() => setActiveTab('SUITE')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 ${activeTab === 'SUITE' ? 'bg-brand-primary text-white shadow-lg shadow-orange-900/50' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}
          >
            <LayoutGrid size={20} />
            <span className="font-semibold">{text.navSuite}</span>
          </button>
          
          <button 
            onClick={() => setActiveTab('RESTORE')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 ${activeTab === 'RESTORE' ? 'bg-brand-accent text-slate-900 shadow-lg shadow-blue-900/50' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}
          >
            <Aperture size={20} />
            <span className="font-semibold">{text.navRestore}</span>
          </button>
        </nav>

        <div className="p-4 border-t border-slate-800 space-y-4">
            <button 
              onClick={() => setLang(l => l === 'en' ? 'zh' : 'en')}
              className="flex items-center gap-2 text-xs text-slate-400 hover:text-white transition-colors w-full px-2 py-1 rounded hover:bg-slate-800"
            >
              <Languages size={14} />
              {lang === 'en' ? 'Switch to 中文' : '切换为 English'}
            </button>

            <div>
              <div className="flex items-center gap-2 text-xs text-slate-500">
                  <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                  {text.operational}
              </div>
              <div className="mt-2 text-[10px] text-slate-600">
                  {text.powered}
              </div>
            </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto h-screen scroll-smooth">
        <header className="sticky top-0 z-10 bg-brand-dark/80 backdrop-blur-md border-b border-slate-800 p-4 flex justify-between items-center md:hidden">
            <span className="font-bold text-brand-primary">LHS MOBILE</span>
            <button 
              onClick={() => setLang(l => l === 'en' ? 'zh' : 'en')}
              className="text-slate-400"
            >
              <Languages size={20} />
            </button>
        </header>

        <div className="p-4 md:p-8">
            <div className="max-w-6xl mx-auto">
                {activeTab === 'SUITE' ? (
                    <div className="animate-fade-in">
                        <div className="mb-6">
                            <h2 className="text-3xl font-bold text-white mb-2">{text.suiteTitle}</h2>
                            <p className="text-slate-400">{text.suiteDesc}</p>
                        </div>
                        <SuiteGenerator onTaskCreate={handleTaskCreate} tasks={tasks} lang={lang} />
                    </div>
                ) : (
                    <div className="animate-fade-in">
                        <div className="mb-6">
                            <h2 className="text-3xl font-bold text-white mb-2">{text.restoreTitle}</h2>
                            <p className="text-slate-400">{text.restoreDesc}</p>
                        </div>
                        <ImageRestoration onTaskCreate={handleTaskCreate} tasks={tasks} lang={lang} />
                    </div>
                )}
            </div>
        </div>
      </main>

    </div>
  );
};

export default App;