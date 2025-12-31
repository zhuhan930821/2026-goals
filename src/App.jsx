import React, { useState, useEffect } from 'react';
import { BookOpen, Brain, Mic, Plus, Trash2, CheckCircle, Circle, ChevronDown, ChevronUp, Share2, PenLine, X, Camera, Download } from 'lucide-react';
import html2canvas from 'html2canvas';

// 定义三大核心分类
const CATEGORIES = [
  { id: 'reading', label: '沉下心读书 (Input)', icon: BookOpen, color: 'text-blue-600', bg: 'bg-blue-100' },
  { id: 'reflection', label: '直面弱点 (Fix)', icon: Brain, color: 'text-purple-600', bg: 'bg-purple-100' },
  { id: 'logic', label: '逻辑与表达 (Output)', icon: Mic, color: 'text-emerald-600', bg: 'bg-emerald-100' }
];

// 辅助函数：处理文本中的高亮
const renderWithHighlights = (text) => {
  if (!text) return <span className="text-slate-300 italic">点击编辑按钮，开始摘录书中触动你的文字...</span>;
  const parts = text.split(/(\*\*.*?\*\*)/g);
  return parts.map((part, index) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return <mark key={index} className="bg-yellow-200/80 text-slate-900 rounded-sm px-1 mx-0.5 shadow-sm decoration-clone box-decoration-clone font-medium">{part.slice(2, -2)}</mark>;
    }
    return part;
  });
};

export default function GoalTrackerV4() {
  const [goals, setGoals] = useState([]);
  const [input, setInput] = useState('');
  const [selectedCategory, setSelectedCategory] = useState(CATEGORIES[0].id);
  const [expandedId, setExpandedId] = useState(null);
  const [isCapturing, setIsCapturing] = useState(false); // 截图状态loading

  useEffect(() => {
    const saved = localStorage.getItem('2026-goals-v4'); // 升级存储key
    if (saved) setGoals(JSON.parse(saved));
  }, []);

  useEffect(() => {
    localStorage.setItem('2026-goals-v4', JSON.stringify(goals));
  }, [goals]);

  const addGoal = () => {
    if (!input.trim()) return;
    const newGoal = {
      id: Date.now(),
      text: input,
      category: selectedCategory,
      completed: false,
      createdAt: new Date().toLocaleDateString(),
      excerpt: '', thoughts: '', isEditingExcerpt: false
    };
    setGoals([newGoal, ...goals]);
    setInput('');
  };

  const toggleGoal = (id) => setGoals(goals.map(g => g.id === id ? { ...g, completed: !g.completed } : g));
  const deleteGoal = (id) => setGoals(goals.filter(g => g.id !== id));
  const updateDetails = (id, field, value) => setGoals(goals.map(g => g.id === id ? { ...g, [field]: value } : g));
  const toggleEditMode = (id) => setGoals(goals.map(g => g.id === id ? { ...g, isEditingExcerpt: !g.isEditingExcerpt } : g));

  // --- 核心新功能：生成截图 ---
  const handleScreenshot = async (goal) => {
    const element = document.getElementById(`goal-card-${goal.id}`);
    if (!element) return;

    setIsCapturing(true);

    try {
      // 使用 html2canvas 捕捉
      const canvas = await html2canvas(element, {
        scale: 2, // 2倍清晰度
        useCORS: true,
        backgroundColor: '#ffffff',
        // 关键：忽略掉带有 'no-screenshot' 类名的元素（即底部的按钮栏）
        ignoreElements: (node) => node.classList.contains('no-screenshot'), 
      });

      // 转换为图片链接并下载
      const image = canvas.toDataURL("image/png");
      const link = document.createElement('a');
      link.href = image;
      link.download = `2026-insight-${goal.id}.png`;
      link.click();
    } catch (err) {
      console.error("Screenshot failed:", err);
      alert("生成图片失败，请重试");
    } finally {
      setIsCapturing(false);
    }
  };

  const copyText = (goal) => {
      const cleanExcerpt = goal.excerpt.replace(/\*\*/g, '');
      const categoryLabel = CATEGORIES.find(c => c.id === goal.category).label.split(' ')[0];
      const textToShare = `【${categoryLabel}】${goal.text}\n\n📖 书摘：\n${cleanExcerpt || "暂无"}\n\n💡 想法：\n${goal.thoughts || "暂无"}\n\n#2026SelfMastery`;
      navigator.clipboard.writeText(textToShare).then(() => alert('文本已复制！'));
  }

  const progress = goals.length === 0 ? 0 : Math.round((goals.filter(g => g.completed).length / goals.length) * 100);

  return (
    <div className="min-h-screen bg-[#f0f2f5] p-4 md:p-8 font-sans text-slate-800 antialiased">
      <div className="max-w-3xl mx-auto bg-white rounded-2xl shadow-xl overflow-hidden border border-slate-200/60">
        
        {/* Header */}
        <div className="p-8 border-b border-slate-100 bg-slate-900 text-white relative overflow-hidden">
          <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
          <div className="relative z-10 flex justify-between items-start">
            <div>
              <h1 className="text-3xl font-bold tracking-tight mb-2">2026 Deep Work</h1>
              <p className="text-slate-400 text-sm font-medium">读书 · 自省 · 逻辑</p>
            </div>
            <span className="text-4xl font-light text-emerald-400">{progress}%</span>
          </div>
          <div className="relative z-10 h-1.5 bg-slate-800/50 rounded-full mt-6 overflow-hidden backdrop-blur-sm">
             <div className="h-full bg-gradient-to-r from-blue-500 via-purple-500 to-emerald-400 transition-all duration-500" style={{ width: `${progress}%` }} />
          </div>
        </div>

        {/* Input Area */}
        <div className="p-6 bg-slate-50/80 border-b border-slate-200/80 backdrop-blur-sm">
          <div className="flex flex-col gap-4">
            <input
              type="text" value={input} onChange={(e) => setInput(e.target.value)} onKeyPress={(e) => e.key === 'Enter' && addGoal()}
              placeholder="输入一本书名，或者一个待思考的话题..."
              className="w-full p-4 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-slate-900 shadow-sm transition-all bg-white"
            />
            <div className="flex flex-wrap gap-2">
              {CATEGORIES.map(cat => (
                <button key={cat.id} onClick={() => setSelectedCategory(cat.id)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-bold transition-all ${selectedCategory === cat.id ? 'bg-slate-900 text-white shadow-md scale-105' : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'}`}>
                  <cat.icon size={14} strokeWidth={2.5} />{cat.label.split(' ')[0]}
                </button>
              ))}
            </div>
            <button onClick={addGoal} className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2 shadow-md transition-all active:scale-[0.99]"><Plus size={18} strokeWidth={2.5} /> 开启新旅程</button>
          </div>
        </div>

        {/* List Area */}
        <div className="p-2 md:p-6 bg-gray-100/50 min-h-[500px]">
          {goals.length === 0 ? (
            <div className="text-center py-20 text-slate-400"><BookOpen size={56} className="mx-auto mb-6 opacity-20" /><p className="text-lg font-medium text-slate-500">开始记录，把书读厚，把人做薄。</p></div>
          ) : (
            <ul className="space-y-6">
              {goals.map(goal => {
                const category = CATEGORIES.find(c => c.id === goal.category);
                const isExpanded = expandedId === goal.id;
                
                return (
                  <li 
                    key={goal.id} 
                    id={`goal-card-${goal.id}`} // 关键：给这个卡片一个 ID 方便截图
                    className={`bg-white rounded-xl transition-all duration-300 shadow-sm overflow-hidden ${isExpanded ? 'shadow-xl ring-1 ring-slate-200 scale-[1.01]' : 'border border-slate-200/80 hover:border-slate-300 hover:shadow-md'}`}
                  >
                    
                    {/* Main Row */}
                    <div className="flex items-center p-5 cursor-pointer select-none" onClick={() => setExpandedId(isExpanded ? null : goal.id)}>
                      <button onClick={(e) => { e.stopPropagation(); toggleGoal(goal.id); }} className={`mr-5 transition-colors ${goal.completed ? 'text-slate-300' : 'text-slate-300 hover:text-emerald-500'}`}>
                        {goal.completed ? <CheckCircle size={26} weight="fill" /> : <Circle size={26} />}
                      </button>
                      
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <span className={`font-bold text-lg ${goal.completed ? 'line-through text-slate-400' : 'text-slate-800'}`}>{goal.text}</span>
                          {/* 这里的 chevron 也会在截图时保留，作为卡片的装饰 */}
                          {isExpanded ? <ChevronUp size={20} className="text-slate-400" /> : <ChevronDown size={20} className="text-slate-400" />}
                        </div>
                        <div className="flex items-center gap-3 mt-2">
                          <span className={`inline-flex items-center gap-1 text-xs font-bold px-2.5 py-0.5 rounded-md ${category.bg} ${category.color}`}>
                            {category.label.split(' ')[0]}
                          </span>
                          <span className="text-xs font-medium text-slate-400">{goal.createdAt}</span>
                        </div>
                      </div>
                    </div>

                    {/* Expanded Content */}
                    {isExpanded && (
                      <div className="px-5 pb-6 pt-1 animate-in slide-in-from-top-2 duration-200">
                        <div className="border-t border-slate-100 my-4"></div>
                        
                        <div className="flex flex-col gap-6">
                          {/* Book Page Section */}
                          <div className="relative group">
                             <div className="flex items-center justify-between mb-2">
                                <label className="flex items-center gap-2 text-xs font-bold text-slate-500 uppercase tracking-wider"><BookOpen size={14} className="text-blue-500"/> 书摘 / 核心事实</label>
                                {/* 编辑按钮 - 添加 no-screenshot 类，截图时不显示它 */}
                                <button onClick={() => toggleEditMode(goal.id)} className="no-screenshot text-xs flex items-center gap-1 px-3 py-1 rounded-full bg-slate-100 text-slate-600 hover:bg-slate-200 transition-colors">
                                    {goal.isEditingExcerpt ? <><X size={12}/> 取消编辑</> : <><PenLine size={12}/> 编辑书摘</>}
                                </button>
                            </div>
                            <div className={`relative min-h-[160px] rounded-r-lg rounded-bl-lg shadow-sm border-l-4 border-blue-900/20 overflow-hidden transition-all ${goal.isEditingExcerpt ? 'bg-white ring-2 ring-blue-100' : 'bg-[#fffdf7]'}`} 
                                 style={{backgroundImage: goal.isEditingExcerpt ? 'none' : 'url("https://www.transparenttextures.com/patterns/cream-paper.png")'}}>
                                {goal.isEditingExcerpt ? (
                                <textarea value={goal.excerpt} onChange={(e) => updateDetails(goal.id, 'excerpt', e.target.value)} autoFocus
                                    className="w-full h-full min-h-[160px] p-6 text-base font-serif bg-transparent focus:outline-none resize-none leading-relaxed text-slate-800 placeholder:text-slate-300 placeholder:font-sans placeholder:italic" />
                                ) : (
                                <div className="p-6 h-full w-full text-base font-serif leading-relaxed text-slate-800 whitespace-pre-wrap selection:bg-yellow-200/50">{renderWithHighlights(goal.excerpt)}</div>
                                )}
                                {!goal.isEditingExcerpt && <div className="absolute left-0 top-0 bottom-0 w-2 bg-gradient-to-r from-black/5 to-transparent pointer-events-none"></div>}
                            </div>
                          </div>

                          {/* Notebook Section */}
                          <div className="relative">
                             <label className="flex items-center gap-2 text-xs font-bold text-slate-500 uppercase tracking-wider mb-3"><Brain size={14} className="text-purple-500" /> 我的思考 / 逻辑推演</label>
                            <div className="relative bg-white border border-slate-200 rounded-lg shadow-sm overflow-hidden focus-within:ring-2 focus-within:ring-purple-100 transition-all">
                                <div className="absolute left-6 top-0 bottom-0 w-[2px] bg-red-400/30 pointer-events-none z-10"></div>
                                <textarea value={goal.thoughts} onChange={(e) => updateDetails(goal.id, 'thoughts', e.target.value)}
                                className="w-full h-32 p-4 pl-10 text-sm bg-[linear-gradient(transparent_95%,_#f1f5f9_95%)] bg-[length:100%_1.5rem] focus:outline-none resize-none leading-[1.5rem] text-slate-700 placeholder:text-slate-400/80" style={{lineHeight: '1.5rem'}} />
                            </div>
                          </div>
                        </div>

                        {/* 底部 Footer 装饰 (仅截图可见，平时也可以显示作为装饰) */}
                        <div className="mt-8 pt-4 border-t border-slate-100 flex justify-between items-center text-xs text-slate-300 font-mono">
                            <span>#2026SelfMastery</span>
                            <span>Thinking Protocol</span>
                        </div>

                        {/* Action Bar - 添加 no-screenshot 类，截图时隐藏整个工具栏 */}
                        <div className="no-screenshot flex items-center justify-between mt-4 pt-4 border-t border-slate-100/50">
                          <button onClick={(e) => { e.stopPropagation(); deleteGoal(goal.id); }} className="text-slate-400 hover:text-red-500 text-sm font-medium flex items-center gap-1.5 px-3 py-2 rounded-lg hover:bg-red-50/50 transition-colors"><Trash2 size={16} /> 删除</button>
                          <div className="flex gap-3">
                            <button onClick={() => copyText(goal)} className="px-4 py-2 text-sm font-bold text-slate-600 hover:bg-slate-100 rounded-lg transition-colors flex items-center gap-2"><Share2 size={16} /> 复制文本</button>
                            <button onClick={() => handleScreenshot(goal)} disabled={isCapturing}
                              className="px-5 py-2 text-sm font-bold bg-slate-900 text-white rounded-lg hover:bg-slate-800 active:scale-95 transition-all flex items-center gap-2 shadow-md disabled:opacity-50">
                              {isCapturing ? '生成中...' : <><Camera size={16} /> 保存卡片</>}
                            </button>
                          </div>
                        </div>

                      </div>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}