import React, { useState, useEffect, useRef } from 'react';
import { BookOpen, Brain, Mic, Plus, Trash2, CheckCircle, Circle, ChevronDown, ChevronUp, Share2, PenLine, X, Camera, Image as ImageIcon, ListPlus, MinusCircle, AlertCircle, ArrowRight, ShieldAlert, Feather, Music, StopCircle, Play, Pause, Download, UploadCloud, FileJson, Sparkles, Database, Loader2 } from 'lucide-react';
import html2canvas from 'html2canvas';

// --- V11 配置 ---
const COLOR_THEMES = [
  { id: 'slate', name: '墨岩灰', color: 'text-slate-700', bg: 'bg-slate-50', border: 'border-slate-200', ring: 'ring-slate-100', decor: 'text-slate-200' },
  { id: 'orange', name: '日落橘', color: 'text-orange-700', bg: 'bg-orange-50', border: 'border-orange-200', ring: 'ring-orange-100', decor: 'text-orange-200' },
  { id: 'cyan', name: '青羽蓝', color: 'text-cyan-700', bg: 'bg-cyan-50', border: 'border-cyan-200', ring: 'ring-cyan-100', decor: 'text-cyan-200' },
  { id: 'violet', name: '星云紫', color: 'text-violet-700', bg: 'bg-violet-50', border: 'border-violet-200', ring: 'ring-violet-100', decor: 'text-violet-200' },
  { id: 'pink', name: '樱花粉', color: 'text-pink-700', bg: 'bg-pink-50', border: 'border-pink-200', ring: 'ring-pink-100', decor: 'text-pink-200' },
];

const DEFAULT_CATEGORIES = [
  { id: 'reading', label: '沉下心读书', type: 'reading', iconName: 'BookOpen', color: 'text-blue-700', bg: 'bg-blue-50', border: 'border-blue-200', ring: 'ring-blue-100', decor: 'text-blue-200' },
  { id: 'reflection', label: '直面弱点', type: 'reflection', iconName: 'ShieldAlert', color: 'text-rose-700', bg: 'bg-rose-50', border: 'border-rose-200', ring: 'ring-rose-100', decor: 'text-rose-200' },
  { id: 'logic', label: '逻辑表达', type: 'logic', iconName: 'Brain', color: 'text-emerald-700', bg: 'bg-emerald-50', border: 'border-emerald-200', ring: 'ring-emerald-100', decor: 'text-emerald-200' },
  { id: 'music', label: '音乐灵感', type: 'music', iconName: 'Music', color: 'text-amber-700', bg: 'bg-amber-50', border: 'border-amber-200', ring: 'ring-amber-100', decor: 'text-amber-200' }
];

const ICON_MAP = { BookOpen, ShieldAlert, Brain, Music, Sparkles };

const renderWithHighlights = (text) => {
  if (!text) return <span className="text-slate-400 italic text-sm">点击此处开始记录...</span>;
  const parts = text.split(/(\*\*.*?\*\*)/g);
  return parts.map((part, index) => {
    if (part.startsWith('**') && part.endsWith('**')) return <mark key={index} className="bg-yellow-100/80 text-slate-900 rounded-sm px-1 mx-0.5 font-medium shadow-sm">{part.slice(2, -2)}</mark>;
    return part;
  });
};

const CornerDecor = ({ className }) => (
  <svg className={`absolute w-16 h-16 pointer-events-none opacity-50 ${className}`} viewBox="0 0 100 100" fill="currentColor">
    <path d="M0,0 C30,0 50,20 50,50 C50,80 80,100 100,100 L0,100 Z" fill="none" stroke="currentColor" strokeWidth="2"/>
    <circle cx="15" cy="15" r="3" /><circle cx="35" cy="8" r="2" /><circle cx="8" cy="35" r="2" />
  </svg>
);

export default function GoalTrackerV11() {
  const [categories, setCategories] = useState(DEFAULT_CATEGORIES);
  const [goals, setGoals] = useState([]);
  const [input, setInput] = useState('');
  const [selectedCategory, setSelectedCategory] = useState(DEFAULT_CATEGORIES[0].id);
  const [activeTab, setActiveTab] = useState('all');
  const [expandedId, setExpandedId] = useState(null);
  const [isCapturing, setIsCapturing] = useState(false);
  const [syncingId, setSyncingId] = useState(null); // V11 New: Track Sync State
  
  const [isAddingCategory, setIsAddingCategory] = useState(false);
  const [newCatName, setNewCatName] = useState('');
  const [newCatTheme, setNewCatTheme] = useState(COLOR_THEMES[0]);

  const [recordingId, setRecordingId] = useState(null); 
  const [playingId, setPlayingId] = useState(null);     
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const audioRef = useRef(new Audio());
  
  const fileInputRef = useRef(null);
  const importInputRef = useRef(null);

  useEffect(() => {
    const savedGoals = localStorage.getItem('2026-goals-v11'); 
    if (savedGoals) { setGoals(JSON.parse(savedGoals)); } 
    else { const old = localStorage.getItem('2026-goals-v10'); if (old) setGoals(JSON.parse(old)); }
    
    const savedCats = localStorage.getItem('2026-categories-v11');
    if (savedCats) { setCategories(JSON.parse(savedCats)); }
    else { const oldCat = localStorage.getItem('2026-categories-v10'); if (oldCat) setCategories(JSON.parse(oldCat));}

    audioRef.current.onended = () => setPlayingId(null);
  }, []);

  useEffect(() => { localStorage.setItem('2026-goals-v11', JSON.stringify(goals)); }, [goals]);
  useEffect(() => { localStorage.setItem('2026-categories-v11', JSON.stringify(categories)); }, [categories]);

  // --- Handlers ---
  const handleAddCategory = () => {
    if (!newCatName.trim()) return;
    const newId = `custom-${Date.now()}`;
    setCategories([...categories, { id: newId, label: newCatName, type: 'generic', iconName: 'Sparkles', ...newCatTheme }]);
    setSelectedCategory(newId); setActiveTab(newId); setIsAddingCategory(false); setNewCatName('');
  };

  const addGoal = () => {
    if (!input.trim()) return;
    const newGoal = {
      id: Date.now(), text: input, category: selectedCategory, completed: false, createdAt: new Date().toLocaleDateString(),
      excerpt: '', thoughts: '', logicBullets: [''], logicImage: null, reflectionTrigger: '', reflectionBug: '', reflectionFix: '', musicImage: null, musicAudio: null, isEditing: false
    };
    setGoals([newGoal, ...goals]); setInput('');
  };

  const deleteGoal = (id) => setGoals(goals.filter(g => g.id !== id));
  const toggleGoal = (id) => setGoals(goals.map(g => g.id === id ? { ...g, completed: !g.completed } : g));
  const updateDetails = (id, field, value) => setGoals(goals.map(g => g.id === id ? { ...g, [field]: value } : g));
  const toggleEditMode = (id) => setGoals(goals.map(g => g.id === id ? { ...g, isEditing: !g.isEditing } : g));
  
  const updateBullet = (goalId, index, value) => setGoals(goals.map(g => g.id === goalId ? { ...g, logicBullets: g.logicBullets.map((b, i) => i === index ? value : b) } : g));
  const addBullet = (goalId) => setGoals(goals.map(g => g.id === goalId ? { ...g, logicBullets: [...g.logicBullets, ''] } : g));
  const removeBullet = (goalId, index) => setGoals(goals.map(g => g.id === goalId && g.logicBullets.length > 1 ? { ...g, logicBullets: g.logicBullets.filter((_, i) => i !== index) } : g));

  const handleImageUpload = (e, goalId, field = 'logicImage') => {
      const file = e.target.files[0]; if (!file || file.size > 2*1024*1024) return alert("图片需小于 2MB");
      const reader = new FileReader(); reader.onloadend = () => updateDetails(goalId, field, reader.result); reader.readAsDataURL(file);
  };

  // Audio Logic
  const startRecording = async (id) => {
    try { const stream = await navigator.mediaDevices.getUserMedia({ audio: true }); mediaRecorderRef.current = new MediaRecorder(stream); audioChunksRef.current = [];
      mediaRecorderRef.current.ondataavailable = e => { if (e.data.size > 0) audioChunksRef.current.push(e.data); };
      mediaRecorderRef.current.onstop = () => { const reader = new FileReader(); reader.onloadend = () => updateDetails(id, 'musicAudio', reader.result); reader.readAsDataURL(new Blob(audioChunksRef.current, {type:'audio/mp3'})); stream.getTracks().forEach(t=>t.stop()); };
      mediaRecorderRef.current.start(); setRecordingId(id);
    } catch { alert("无法访问麦克风"); }
  };
  const stopRecording = () => { if (mediaRecorderRef.current) { mediaRecorderRef.current.stop(); setRecordingId(null); }};
  const togglePlay = (src, id) => { if (playingId === id) { audioRef.current.pause(); setPlayingId(null); } else { audioRef.current.src = src; audioRef.current.play(); setPlayingId(id); }};

  // V11 Feature: Sync to Notion
  const handleSyncToNotion = async (goal) => {
    setSyncingId(goal.id);
    // 构造发给 AI 的原始文本
    const cat = categories.find(c => c.id === goal.category) || DEFAULT_CATEGORIES[0];
    const rawContent = `
      Type: ${cat.label}
      Title: ${goal.text}
      Detail: ${goal.excerpt || ''} ${goal.thoughts || ''}
      Bullets: ${goal.logicBullets ? goal.logicBullets.join('; ') : ''}
      Reflection: ${goal.reflectionBug ? `Context:${goal.reflectionTrigger}, Bug:${goal.reflectionBug}, Fix:${goal.reflectionFix}` : ''}
    `;

    try {
      const res = await fetch('/api/agent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ input: rawContent })
      });
      const data = await res.json();
      if (data.success) {
        alert("🧠 AI 已将此条目整理并归档至 Notion！");
      } else {
        alert("归档失败: " + data.error);
      }
    } catch (e) {
      alert("网络请求失败");
    } finally {
      setSyncingId(null);
    }
  };

  // Export/Import
  const handleExport = () => { const blob = new Blob([JSON.stringify({goals, categories}, null, 2)], {type:"application/json"}); const link = document.createElement('a'); link.href = URL.createObjectURL(blob); link.download = `2026-backup-${new Date().toISOString().split('T')[0]}.json`; link.click(); };
  const handleImport = (e) => { const f = e.target.files[0]; if(!f || !confirm("确定覆盖吗？")) return; const r = new FileReader(); r.onload=ev=>{ try{ const d=JSON.parse(ev.target.result); if(d.goals)setGoals(d.goals); if(d.categories)setCategories(d.categories); alert("恢复成功"); }catch{ alert("格式错误"); }}; r.readAsText(f); };

  const handleScreenshot = async (goal, cat) => {
    if (goal.isEditing) toggleEditMode(goal.id);
    setTimeout(async () => {
        const el = document.getElementById(`goal-card-${goal.id}`); if(!el) return; setIsCapturing(true);
        try { const canvas = await html2canvas(el, { scale: 3, useCORS: true, backgroundColor: null, ignoreElements: n => n.classList.contains('no-screenshot') });
        const link = document.createElement('a'); link.href = canvas.toDataURL("image/png"); link.download = `2026-${cat.label}-${goal.id}.png`; link.click(); } catch { alert("截图失败"); } finally { setIsCapturing(false); }
    }, 200);
  };
  const copyText = (goal, cat) => { navigator.clipboard.writeText(`【${cat.label}】${goal.text}\n#2026SelfMastery`).then(()=>alert("已复制")); };

  // Renderers
  const EditBtn = ({ goal }) => (<div className="flex justify-end no-screenshot"><button onClick={() => toggleEditMode(goal.id)} className="text-xs flex items-center gap-1 px-3 py-1 rounded-full bg-white/50 border border-slate-200 text-slate-600 hover:bg-white shadow-sm">{goal.isEditing ? <><X size={12}/> 完成</> : <><PenLine size={12}/> 编辑</>}</button></div>);
  
  const renderGenericContent = (goal, cat) => (<div className="flex flex-col gap-6 relative z-10"><EditBtn goal={goal} /><div className="relative group"><label className={`flex items-center gap-2 text-xs font-bold ${cat.color} uppercase tracking-wider mb-2`}><BookOpen size={14}/> {cat.type==='reading'?'书摘':'内容'}</label><div className={`relative min-h-[120px] rounded-lg border ${cat.border} overflow-hidden transition-all ${goal.isEditing ? `bg-white ring-2 ${cat.ring}`:'bg-[#fffdf9]'}`} style={{backgroundImage: goal.isEditing?'none':'url("https://www.transparenttextures.com/patterns/cream-paper.png")'}}>{goal.isEditing ? <textarea value={goal.excerpt} onChange={e=>updateDetails(goal.id,'excerpt',e.target.value)} className="w-full h-full min-h-[120px] p-6 text-base font-serif bg-transparent focus:outline-none resize-none" placeholder="输入..." /> : <div className="p-6 h-full w-full text-base font-serif leading-relaxed text-slate-800 whitespace-pre-wrap">{renderWithHighlights(goal.excerpt)}</div>}</div></div>{cat.type==='generic' && <div><label className={`flex items-center gap-2 text-xs font-bold ${cat.color} uppercase tracking-wider mb-3`}><ImageIcon size={14}/> 配图</label><div className={`relative rounded-xl overflow-hidden border-2 shadow-sm bg-white ${goal.isEditing?`border-dashed ${cat.border} cursor-pointer hover:bg-${cat.bg}`:'border-white'}`} onClick={()=>goal.isEditing&&fileInputRef.current?.click()}>{goal.logicImage?<img src={goal.logicImage} className="w-full h-auto object-cover rounded-lg"/>:goal.isEditing&&<div className="min-h-[60px] flex justify-center items-center text-sm text-slate-400">上传图片</div>}{goal.isEditing&&<input type="file" ref={fileInputRef} onChange={e=>handleImageUpload(e,goal.id)} className="hidden"/>}</div></div>}<div className="relative"><label className={`flex items-center gap-2 text-xs font-bold ${cat.color} uppercase tracking-wider mb-2`}><Brain size={14}/> 思考</label>{goal.isEditing?<textarea value={goal.thoughts} onChange={e=>updateDetails(goal.id,'thoughts',e.target.value)} className={`w-full h-32 p-4 text-sm bg-white/80 border ${cat.border} rounded-lg focus:outline-none focus:ring-2 ${cat.ring} resize-none`}/>:<div className={`p-5 bg-${cat.bg.split('-')[1]}-50/60 border ${cat.border} rounded-lg text-sm text-slate-700 leading-relaxed whitespace-pre-wrap min-h-[60px] shadow-sm`}>{goal.thoughts||"暂无"}</div>}</div></div>);
  const renderReflectionContent = (goal, cat) => (<div className="flex flex-col gap-5 relative z-10"><EditBtn goal={goal}/><div className={`grid gap-4 bg-white/60 p-6 rounded-xl border ${cat.border} shadow-sm`}><div><label className="flex items-center gap-2 text-xs font-bold text-slate-500 uppercase tracking-wider mb-2"><AlertCircle size={14}/> 情境</label>{goal.isEditing?<input value={goal.reflectionTrigger} onChange={e=>updateDetails(goal.id,'reflectionTrigger',e.target.value)} className={`w-full p-2 text-sm border ${cat.border} rounded bg-white/80`}/>:<div className="text-slate-800 font-medium pl-1">{goal.reflectionTrigger||"..."}</div>}</div><div className={`border-t ${cat.border} my-1 opacity-50`}></div><div><label className={`flex items-center gap-2 text-xs font-bold ${cat.color} uppercase tracking-wider mb-2`}><Brain size={14}/> 弱点</label>{goal.isEditing?<textarea value={goal.reflectionBug} onChange={e=>updateDetails(goal.id,'reflectionBug',e.target.value)} className={`w-full p-2 text-sm border ${cat.border} rounded h-20 resize-none bg-white/80`}/>:<div className={`text-${cat.color.split('-')[1]}-800 bg-${cat.bg.split('-')[1]}-100/50 p-3 rounded-lg text-sm leading-relaxed font-medium`}>{goal.reflectionBug||"..."}</div>}</div><div><label className={`flex items-center gap-2 text-xs font-bold text-emerald-600 uppercase tracking-wider mb-2`}><CheckCircle size={14}/> 修正</label>{goal.isEditing?<textarea value={goal.reflectionFix} onChange={e=>updateDetails(goal.id,'reflectionFix',e.target.value)} className={`w-full p-2 text-sm border ${cat.border} rounded h-20 resize-none bg-white/80`}/>:<div className="flex items-start gap-2 text-slate-700 text-sm pl-1"><ArrowRight size={16} className="text-emerald-500 mt-0.5 shrink-0"/><div className="leading-relaxed font-medium">{goal.reflectionFix||"..."}</div></div>}</div></div></div>);
  const renderLogicContent = (goal, cat) => (<div className="flex flex-col gap-6 relative z-10"><EditBtn goal={goal}/><div className="grid md:grid-cols-2 gap-6"><div><label className={`flex items-center gap-2 text-xs font-bold ${cat.color} uppercase tracking-wider mb-3`}><ImageIcon size={14}/> 证据</label><div className={`relative rounded-xl overflow-hidden border-2 shadow-sm bg-white ${goal.isEditing?`border-dashed ${cat.border} cursor-pointer hover:bg-${cat.bg}`:'border-white'}`} onClick={()=>goal.isEditing&&fileInputRef.current?.click()}>{goal.logicImage?<img src={goal.logicImage} className="w-full h-auto object-cover rounded-lg"/>:goal.isEditing&&<div className="min-h-[100px] flex justify-center items-center text-sm text-slate-400">上传</div>}{goal.isEditing&&<input type="file" ref={fileInputRef} onChange={e=>handleImageUpload(e,goal.id)} className="hidden"/>}</div></div><div><label className={`flex items-center gap-2 text-xs font-bold ${cat.color} uppercase tracking-wider mb-3`}><ListPlus size={14}/> 骨架</label><div className={`space-y-2 bg-white/60 p-4 rounded-xl border ${cat.border} shadow-sm`}>{goal.logicBullets.map((b,i)=>(<div key={i} className="flex items-start gap-2"><Circle size={6} className={`${cat.color} shrink-0 mt-2 fill-current opacity-60`}/>{goal.isEditing?<div className="flex-1 flex gap-2"><input value={b} onChange={e=>updateBullet(goal.id,i,e.target.value)} className={`flex-1 text-sm bg-transparent border-b ${cat.border} py-1`} onKeyDown={e=>e.key==='Enter'&&addBullet(goal.id)}/><button onClick={()=>removeBullet(goal.id,i)} className="text-slate-300 hover:text-red-400"><MinusCircle size={14}/></button></div>:<span className="text-sm text-slate-700 py-0.5 font-medium">{b}</span>}</div>))}{goal.isEditing&&<button onClick={()=>addBullet(goal.id)} className={`text-xs ${cat.color} font-medium mt-2`}>+ 论点</button>}</div></div></div><div className="relative"><label className={`flex items-center gap-2 text-xs font-bold ${cat.color} uppercase tracking-wider mb-2`}><Mic size={14}/> 脚本</label>{goal.isEditing?<textarea value={goal.thoughts} onChange={e=>updateDetails(goal.id,'thoughts',e.target.value)} className={`w-full h-24 p-4 text-sm bg-white/80 border ${cat.border} rounded-lg resize-none`}/>:<div className={`p-5 bg-${cat.bg.split('-')[1]}-50/60 border ${cat.border} rounded-lg text-sm text-slate-700 leading-relaxed whitespace-pre-wrap shadow-sm`}>{goal.thoughts||"暂无"}</div>}</div></div>);
  const renderMusicContent = (goal, cat) => (<div className="flex flex-col gap-6 relative z-10"><EditBtn goal={goal}/><div><label className={`flex items-center gap-2 text-xs font-bold ${cat.color} uppercase tracking-wider mb-3`}><ImageIcon size={14}/> 灵感</label><div className={`relative rounded-xl overflow-hidden border-2 shadow-sm bg-white ${goal.isEditing?`border-dashed ${cat.border} cursor-pointer hover:bg-${cat.bg}`:'border-white'}`} onClick={()=>goal.isEditing&&fileInputRef.current?.click()}>{goal.musicImage?<img src={goal.musicImage} className="w-full h-auto object-cover rounded-lg"/>:goal.isEditing&&<div className="min-h-[60px] flex justify-center items-center text-sm text-slate-400">上传</div>}{goal.isEditing&&<input type="file" ref={fileInputRef} onChange={e=>handleImageUpload(e,goal.id,'musicImage')} className="hidden"/>}</div></div><div><label className={`flex items-center gap-2 text-xs font-bold ${cat.color} uppercase tracking-wider mb-3`}><Mic size={14}/> 录音</label><div className={`flex items-center gap-4 p-4 rounded-xl border ${cat.border} bg-white/60`}>{goal.isEditing&&(recordingId===goal.id?<button onClick={stopRecording} className="flex items-center gap-2 px-3 py-1 bg-red-500 text-white rounded-full text-xs font-bold animate-pulse">停止</button>:<button onClick={()=>startRecording(goal.id)} className="flex items-center gap-2 px-3 py-1 bg-amber-500 text-white rounded-full text-xs font-bold">录音</button>)}{goal.musicAudio?(<div className="flex-1 flex items-center gap-3"><button onClick={()=>togglePlay(goal.musicAudio,goal.id)} className={`p-2 rounded-full ${playingId===goal.id?'bg-amber-500 text-white':'bg-white text-amber-500 border border-amber-200'}`}>{playingId===goal.id?<Pause size={14} fill="currentColor"/>:<Play size={14} fill="currentColor"/>}</button><div className="h-6 w-full bg-amber-100/50 rounded flex justify-center overflow-hidden gap-0.5">{[...Array(15)].map((_,i)=>(<div key={i} className="w-1 bg-amber-300 rounded-full animate-pulse" style={{height:`${Math.random()*100}%`}}></div>))}</div></div>):<div className="text-sm text-slate-400 italic">暂无录音</div>}</div></div><div className="relative"><label className={`flex items-center gap-2 text-xs font-bold ${cat.color} uppercase tracking-wider mb-2`}><PenLine size={14}/> 备注</label>{goal.isEditing?<textarea value={goal.thoughts} onChange={e=>updateDetails(goal.id,'thoughts',e.target.value)} className={`w-full h-24 p-4 text-sm bg-white/80 border ${cat.border} rounded-lg resize-none`}/>:<div className={`p-5 bg-${cat.bg.split('-')[1]}-50/60 border ${cat.border} rounded-lg text-sm text-slate-700 leading-relaxed whitespace-pre-wrap shadow-sm`}>{goal.thoughts||"暂无"}</div>}</div></div>);

  const renderContent = (goal) => {
      const cat = categories.find(c => c.id === goal.category) || DEFAULT_CATEGORIES[0];
      if (cat.type === 'reflection') return renderReflectionContent(goal, cat);
      if (cat.type === 'logic') return renderLogicContent(goal, cat);
      if (cat.type === 'music') return renderMusicContent(goal, cat);
      return renderGenericContent(goal, cat);
  };

  const filteredGoals = activeTab === 'all' ? goals : goals.filter(g => g.category === activeTab);
  const progress = goals.length === 0 ? 0 : Math.round((goals.filter(g => g.completed).length / goals.length) * 100);

  return (
    <div className="min-h-screen bg-[#f5f7fa] p-4 md:p-8 font-sans text-slate-800 antialiased relative pb-32">
      <div className="fixed inset-0 bg-[url('https://www.transparenttextures.com/patterns/cream-paper.png')] opacity-50 pointer-events-none"></div>
      <div className="fixed bottom-0 left-0 right-0 bg-white/90 backdrop-blur-md border-t border-slate-200 p-4 z-50 flex justify-between items-center px-6 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
           <div className="flex items-center gap-2 text-xs text-slate-400 font-medium uppercase tracking-wider"><FileJson size={14} /> OS V11 Agent</div>
           <div className="flex gap-4"><button onClick={handleExport} className="flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold transition-colors"><Download size={14}/> 备份</button><button onClick={() => importInputRef.current?.click()} className="flex items-center gap-2 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-bold transition-colors"><UploadCloud size={14}/> 恢复</button><input type="file" accept=".json" ref={importInputRef} onChange={handleImport} className="hidden" /></div>
      </div>

      <div className="max-w-4xl mx-auto relative z-10">
        <div className="mb-8 text-center relative"><Feather className="mx-auto text-slate-300 mb-2 opacity-50" size={32} /><h1 className="text-3xl font-serif font-bold tracking-tight text-slate-800">2026 Self-Mastery Protocol</h1><div className="mt-6 max-w-xs mx-auto h-1 bg-slate-200 rounded-full overflow-hidden"><div className="h-full bg-gradient-to-r from-blue-400 via-rose-400 to-amber-500 transition-all duration-500" style={{ width: `${progress}%` }} /></div></div>
        <div className="flex items-center gap-2 mb-6 overflow-x-auto pb-2 scrollbar-hide"><button onClick={() => setActiveTab('all')} className={`px-4 py-2 rounded-full text-sm font-bold whitespace-nowrap transition-all ${activeTab === 'all' ? 'bg-slate-800 text-white shadow-md' : 'bg-white text-slate-500 hover:bg-slate-100'}`}>全部 ({goals.length})</button>{categories.map(cat => {const Icon = ICON_MAP[cat.iconName] || Sparkles; return (<button key={cat.id} onClick={() => setActiveTab(cat.id)} className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-bold whitespace-nowrap transition-all border ${activeTab === cat.id ? `bg-white ${cat.color} ${cat.border} ring-2 ${cat.ring} shadow-md` : 'bg-white/60 border-transparent text-slate-500 hover:bg-white'}`}><Icon size={14}/> {cat.label} ({goals.filter(g=>g.category === cat.id).length})</button>)})}</div>

        <div className="bg-white/80 backdrop-blur-md rounded-2xl shadow-lg border border-slate-200/60 p-6 mb-8">
          <div className="flex flex-col gap-4">
            <div className="relative"><input type="text" value={input} onChange={(e) => setInput(e.target.value)} onKeyPress={(e) => e.key === 'Enter' && addGoal()} placeholder="What's on your mind?" className="w-full p-4 pl-12 rounded-xl border border-slate-200 bg-white/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-slate-900/10 shadow-sm transition-all font-medium italic"/><Feather className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} /></div>
            <div className="flex flex-wrap gap-2 items-center">{categories.map(cat => { const Icon = ICON_MAP[cat.iconName] || Sparkles; return (<button key={cat.id} onClick={() => setSelectedCategory(cat.id)} className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold transition-all border ${selectedCategory === cat.id ? `bg-white ${cat.color} ${cat.border} shadow-md scale-105 ring-1 ${cat.ring}` : `bg-white/50 text-slate-500 border-slate-200 hover:bg-white`}`}><Icon size={12} strokeWidth={2.5} />{cat.label}</button>)})}{isAddingCategory ? (<div className="flex items-center gap-2 bg-white border border-slate-200 p-1 rounded-full animate-in fade-in zoom-in duration-200"><input type="text" value={newCatName} onChange={(e) => setNewCatName(e.target.value)} placeholder="名称..." className="text-xs p-1 pl-2 outline-none w-24 bg-transparent" autoFocus onKeyPress={(e)=>e.key==='Enter' && handleAddCategory()} /><div className="flex gap-1">{COLOR_THEMES.map(theme => (<button key={theme.id} onClick={() => setNewCatTheme(theme)} className={`w-4 h-4 rounded-full ${theme.bg.replace('50','400')} ${newCatTheme.id === theme.id ? 'ring-2 ring-slate-400 scale-110' : ''}`} />))}</div><button onClick={handleAddCategory} className="bg-slate-800 text-white rounded-full p-1 hover:bg-black"><CheckCircle size={14}/></button><button onClick={() => setIsAddingCategory(false)} className="text-slate-400 hover:text-red-500 p-1"><X size={14}/></button></div>) : (<button onClick={() => setIsAddingCategory(true)} className="flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-bold bg-slate-100 text-slate-500 hover:bg-slate-200 transition-colors"><Plus size={12} /> 新建</button>)}</div>
            <button onClick={addGoal} className="w-full bg-slate-800 hover:bg-slate-700 text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2 shadow-md transition-all active:scale-[0.98]"><Plus size={18} strokeWidth={2.5} /> 记录 Entry</button>
          </div>
        </div>

        <div className="min-h-[500px] space-y-6">
          {filteredGoals.length === 0 ? <div className="text-center py-20 text-slate-400 italic font-serif"><p className="text-xl">"Focus on the signal."</p></div> : (
            <ul className="space-y-6">
              {filteredGoals.map(goal => {
                const cat = categories.find(c => c.id === goal.category) || DEFAULT_CATEGORIES[0];
                const isExpanded = expandedId === goal.id;
                return (
                  <li key={goal.id} id={`goal-card-${goal.id}`} className={`relative transition-all duration-500 group rounded-2xl ${isExpanded ? `shadow-xl scale-[1.01] bg-[#fdfcf8] ${cat.ring.replace('ring-','ring-offset-4 ring-')}` : 'shadow hover:shadow-md bg-white/80 hover:bg-white border border-white'}`}>
                    <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cream-paper.png')] opacity-30 rounded-2xl pointer-events-none"></div>
                    {isExpanded && <div className={`absolute inset-2 border-[3px] ${cat.border} rounded-xl pointer-events-none opacity-30`}></div>}
                    {isExpanded && <CornerDecor className={`top-0 left-0 ${cat.decor}`} />}
                    {isExpanded && <CornerDecor className={`bottom-0 right-0 rotate-180 ${cat.decor}`} />}
                    <div className="relative z-10 p-1">
                        <div className={`flex items-center p-5 cursor-pointer select-none rounded-xl transition-colors ${isExpanded ? 'bg-transparent' : ''}`} onClick={() => setExpandedId(isExpanded ? null : goal.id)}>
                            <button onClick={(e) => { e.stopPropagation(); toggleGoal(goal.id); }} className={`mr-5 transition-colors ${goal.completed ? 'text-slate-300' : `${cat.color} opacity-60 hover:opacity-100`}`}>{goal.completed ? <CheckCircle size={28} weight="fill" /> : <Circle size={28} />}</button>
                            <div className="flex-1"><div className="flex items-center justify-between"><span className={`font-bold text-xl font-serif ${goal.completed ? 'line-through text-slate-400' : 'text-slate-800'}`}>{goal.text}</span>{isExpanded ? <ChevronUp size={20} className="text-slate-400" /> : <ChevronDown size={20} className="text-slate-400" />}</div><div className="flex items-center gap-3 mt-2"><span className={`inline-flex items-center gap-1 text-xs font-bold px-3 py-1 rounded-full border ${cat.bg} ${cat.color} ${cat.border}`}>{cat.label}</span><span className="text-xs font-medium text-slate-400 font-serif italic">{goal.createdAt}</span></div></div>
                        </div>
                        {isExpanded && (
                        <div className="px-6 pb-8 pt-2 animate-in slide-in-from-top-2 duration-300">
                            <div className={`border-t-2 ${cat.border} border-dashed my-6 opacity-30`}></div>
                            <div className="bg-white/60 backdrop-blur-sm rounded-xl p-6 shadow-sm border border-white/50 relative overflow-hidden">
                                <div className={`absolute top-0 inset-x-0 h-1 bg-${cat.bg.split('-')[1]}-200 opacity-50`}></div>
                                {renderContent(goal)}
                            </div>
                            <div className="mt-8 pt-4 flex justify-between items-center text-xs text-slate-400 font-serif italic relative z-10"><div className="flex items-center gap-2"><Feather size={12} className={cat.color}/> <span>2026 Self-Mastery</span></div><span className="uppercase tracking-widest opacity-60">{cat.label} LOG</span></div>
                            <div className="no-screenshot flex items-center justify-between mt-6 pt-4 border-t border-slate-200/50 relative z-10">
                            <button onClick={(e) => { e.stopPropagation(); deleteGoal(goal.id); }} className="text-slate-400 hover:text-red-500 text-sm font-medium flex items-center gap-1.5 px-3 py-2 rounded-lg hover:bg-red-50/50 transition-colors"><Trash2 size={16} /> 删除</button>
                            <div className="flex gap-3">
                                <button onClick={() => copyText(goal, cat)} className="px-4 py-2 text-sm font-bold text-slate-600 hover:bg-white border border-slate-200 rounded-lg transition-all flex items-center gap-2 shadow-sm hover:shadow-md"><Share2 size={16} /> 复制</button>
                                {/* V11 Feature: Sync Button */}
                                <button onClick={() => handleSyncToNotion(goal)} disabled={syncingId !== null} className={`px-4 py-2 text-sm font-bold text-slate-600 hover:bg-white border border-slate-200 rounded-lg transition-all flex items-center gap-2 shadow-sm hover:shadow-md ${syncingId === goal.id ? 'opacity-50' : ''}`}>
                                    {syncingId === goal.id ? <Loader2 size={16} className="animate-spin" /> : <Database size={16} />} {syncingId === goal.id ? 'Thinking...' : 'Notion'}
                                </button>
                                <button onClick={() => handleScreenshot(goal, cat)} disabled={isCapturing} className={`px-5 py-2 text-sm font-bold text-white rounded-lg transition-all flex items-center gap-2 shadow-md hover:shadow-lg active:scale-95 disabled:opacity-50 bg-gradient-to-r ${cat.color === 'text-blue-700' ? 'from-blue-600 to-indigo-600' : cat.color === 'text-rose-700' ? 'from-rose-500 to-pink-600' : cat.color === 'text-amber-700' ? 'from-amber-500 to-orange-600' : cat.color === 'text-emerald-700' ? 'from-emerald-500 to-teal-600' : 'from-slate-600 to-gray-700'}`}>{isCapturing ? '生成中...' : <><Camera size={16} /> 保存手账</>}</button>
                            </div>
                            </div>
                        </div>
                        )}
                    </div>
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