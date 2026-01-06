import React, { useState, useEffect, useRef } from 'react';
import { 
  Dumbbell, Brain, Music, Bot, 
  BookOpen, AlertTriangle, Lightbulb, Mic, 
  ChevronRight, ArrowLeft, Save, Plus, Settings,
  Search, Trash2, X, Play, Square, Activity, Trophy, Sparkles, Zap, Download, Upload, CheckCircle
} from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

// ==========================================
// 🎨 美学配置
// ==========================================
const THEMES = {
  body: { bg: "from-emerald-100/80 via-teal-50/50 to-cyan-100/80", card: "bg-white/60", accent: "text-emerald-700", btn: "bg-emerald-600 hover:bg-emerald-700", slogan: "Sculpt the vessel." },
  mind: { bg: "from-blue-100/80 via-indigo-50/50 to-violet-100/80", card: "bg-white/60", accent: "text-blue-700", btn: "bg-blue-600 hover:bg-blue-700", slogan: "Debug the internal monologue." },
  music: { bg: "from-amber-100/80 via-orange-50/50 to-yellow-100/80", card: "bg-white/60", accent: "text-amber-700", btn: "bg-amber-600 hover:bg-amber-700", slogan: "Find the rhythm in chaos." },
  ai: { bg: "from-fuchsia-100/80 via-purple-50/50 to-pink-100/80", card: "bg-white/60", accent: "text-fuchsia-700", btn: "bg-fuchsia-600 hover:bg-fuchsia-700", slogan: "Extend your cognition." }
};

const useStorage = (key, initial) => {
  const [data, setData] = useState(() => {
    try { return JSON.parse(localStorage.getItem(key)) || initial; } catch { return initial; }
  });
  useEffect(() => localStorage.setItem(key, JSON.stringify(data)), [key, data]);
  return [data, setData];
};

const useGamification = () => {
  const [xp, setXP] = useStorage('lifeos_xp', 0);
  const level = Math.floor(xp / 100) + 1;
  const progress = xp % 100;
  const addXP = (amount) => setXP(prev => prev + amount);
  return { xp, level, progress, addXP };
};

const calculateHeatmap = (logs) => {
  const days = [];
  for (let i = 29; i >= 0; i--) {
    const d = new Date(); d.setDate(d.getDate() - i);
    const dateStr = d.toLocaleDateString();
    const count = logs.filter(l => l.date === dateStr).length;
    days.push({ date: dateStr, count });
  }
  return days;
};

// ==========================================
// 💾 数据管理
// ==========================================
const DataManager = () => {
  const [isOpen, setIsOpen] = useState(false);
  const handleExport = () => {
    const backup = { timestamp: new Date().toISOString(), data: { ...localStorage } };
    const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = `LifeOS_Backup_${new Date().toLocaleDateString().replace(/\//g, '-')}.json`; a.click();
    alert("✅ 备份已下载");
  };
  const handleImport = (event) => {
    const file = event.target.files[0]; if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const backup = JSON.parse(e.target.result);
        if (backup.data && window.confirm("⚠️ 覆盖现有数据？")) {
          Object.keys(backup.data).forEach(key => localStorage.setItem(key, backup.data[key]));
          window.location.reload();
        }
      } catch (err) { alert("❌ 格式错误"); }
    };
    reader.readAsText(file);
  };
  return (
    <>
      <button onClick={() => setIsOpen(!isOpen)} className="text-gray-400 hover:text-gray-600 transition-colors p-2 rounded-full hover:bg-gray-100"><Settings size={20} /></button>
      {isOpen && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setIsOpen(false)}>
          <div className="glass-card p-8 max-w-md w-full animate-fade-in" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-6"><h3 className="text-xl font-bold text-gray-800 flex items-center gap-2"><Settings size={20}/> System Core</h3><button onClick={() => setIsOpen(false)}><X size={20}/></button></div>
            <div className="space-y-4">
              <button onClick={handleExport} className="w-full bg-black text-white py-3 rounded-xl text-sm font-bold flex items-center justify-center gap-2 hover:scale-[1.02] transition-transform"><Download size={16}/> Export Backup</button>
              <label className="w-full bg-white border border-gray-200 text-gray-600 py-3 rounded-xl text-sm font-bold flex items-center justify-center gap-2 cursor-pointer hover:bg-gray-50"><Upload size={16}/> Restore Data<input type="file" accept=".json" onChange={handleImport} className="hidden" /></label>
              <div className="pt-4 border-t border-gray-200 text-center"><button onClick={() => { if(window.confirm("RESET ALL DATA?")) { localStorage.clear(); window.location.reload(); } }} className="text-xs text-red-400 hover:text-red-600 flex items-center justify-center gap-1 mx-auto"><Trash2 size={12}/> Factory Reset</button></div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

// ==========================================
// 🧩 模块 1: Body OS
// ==========================================
const BodyModule = ({ goBack, addXP }) => {
  const theme = THEMES.body;
  const [history, setHistory] = useStorage('lifeos_body_history', []);
  const [weight, setWeight] = useState(60.0);
  
  const [baseLibrary, setBaseLibrary] = useStorage('lifeos_body_lib_v3', {
    carbs: ['🌽 玉米', '🍠 紫薯', '🍞 全麦', '🥣 燕麦', '🍌 香蕉'],
    protein: ['🥚 鸡蛋', '🥛 豆浆', '🍗 鸡胸', '🥩 牛肉', '🦐 虾仁'],
    veggie: ['🥗 绿叶菜', '🥦 西兰花', '🥒 黄瓜', '🍅 番茄'],
    fruit: ['🍎 苹果', '🫐 蓝莓', '🥝 猕猴桃'],
    workout: ['🏃 慢跑', '🧘 普拉提', '🍑 超模机', '🏋️ 举铁']
  });
  const [moveLibrary, setMoveLibrary] = useStorage('lifeos_move_lib_v3', {
    pilates: ['百次拍击', '卷腹', '单腿画圈', '十字交叉', '天鹅式'],
    machine: ['后抬腿', '蚌式开合', '侧向行走', '深蹲行走', '驴踢']
  });

  const [build, setBuild] = useState({ breakfast: [], lunch: [], dinner: [], workout: [] });
  const [selectedMoves, setSelectedMoves] = useState([]);
  const [isEditing, setIsEditing] = useState(false);
  const [newItem, setNewItem] = useState("");
  const [newCat, setNewCat] = useState("carbs");

  const toggleItem = (slot, item) => {
    if (isEditing) {
      if (window.confirm(`Delete "${item}"?`)) {
        for (const k in baseLibrary) if (baseLibrary[k].includes(item)) setBaseLibrary({...baseLibrary, [k]: baseLibrary[k].filter(i=>i!==item)});
        for (const k in moveLibrary) if (moveLibrary[k].includes(item)) setMoveLibrary({...moveLibrary, [k]: moveLibrary[k].filter(i=>i!==item)});
      }
      return;
    }
    setBuild(prev => ({ ...prev, [slot]: prev[slot].includes(item) ? prev[slot].filter(i=>i!==item) : [...prev[slot], item] }));
  };
  const toggleMove = (move) => { if (isEditing) return; setSelectedMoves(prev => prev.includes(move) ? prev.filter(i => i !== move) : [...prev, move]); };
  const addItem = () => { if(!newItem) return; if(['pilates','machine'].includes(newCat)) setMoveLibrary({...moveLibrary, [newCat]: [...moveLibrary[newCat], newItem]}); else setBaseLibrary({...baseLibrary, [newCat]: [...baseLibrary[newCat], newItem]}); setNewItem(""); };
  const handleSave = () => { setHistory([...history, { id: Date.now(), date: new Date().toLocaleDateString(), weight, build, detailedMoves: selectedMoves, type: 'body' }]); addXP(20); alert("Body Logged! (+20 XP)"); };
  
  const getSummary = () => { 
    const all = [...build.breakfast, ...build.lunch, ...build.dinner]; 
    return { 
      carbs: all.filter(i => baseLibrary.carbs?.includes(i)), 
      protein: all.filter(i => baseLibrary.protein?.includes(i)), 
      veggie: all.filter(i => baseLibrary.veggie?.includes(i)), 
      fruit: all.filter(i => baseLibrary.fruit?.includes(i)) 
    }; 
  };
  const summary = getSummary();
  const showPilates = build.workout.includes('🧘 普拉提');
  const showMachine = build.workout.includes('🍑 超模机');

  const renderSelector = (slot, types) => (
    <div className="mb-6"><h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3 flex items-center gap-2"><span className="w-1 h-4 bg-emerald-400 rounded-full"></span> {slot}</h4><div className="flex flex-wrap gap-2">{types.map(t => baseLibrary[t]?.map(item => (<button key={item} onClick={()=>toggleItem(slot.toLowerCase(), item)} className={`relative px-4 py-2 rounded-xl text-sm transition-all duration-300 shadow-sm border ${isEditing ? 'bg-red-50 border-red-200 text-red-500 hover:bg-red-100' : ''} ${!isEditing && build[slot.toLowerCase()].includes(item) ? 'bg-emerald-600 text-white border-emerald-500 shadow-emerald-200 shadow-lg transform -translate-y-1' : !isEditing && 'bg-white/80 hover:bg-white text-gray-600 border-white/50 hover:border-emerald-200'}`}>{item}{isEditing && <X size={10} className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full"/>}</button>)))}</div></div>
  );

  return (
    <div className={`min-h-screen bg-gradient-to-br ${theme.bg} p-6 relative overflow-hidden font-sans`}>
      <BackgroundBlobs color="bg-emerald-300" />
      <Header title="Body OS" icon={Dumbbell} theme={theme} goBack={goBack} />
      <div className="max-w-6xl mx-auto grid lg:grid-cols-3 gap-8 relative z-10">
        <div className="lg:col-span-2 space-y-6">
          <div className="glass-card p-4 flex justify-between items-center"><div className="flex items-center gap-4"><span className="font-medium text-gray-700 flex items-center gap-2"><Activity size={18} className="text-emerald-500"/> Morning Weight</span><div className="flex items-center gap-1"><input type="number" value={weight} onChange={e=>setWeight(e.target.value)} className="text-2xl font-bold w-20 text-right bg-transparent border-b border-gray-300 focus:outline-none focus:border-emerald-500 text-emerald-700"/> <span className="text-sm text-gray-400">kg</span></div></div><button onClick={()=>setIsEditing(!isEditing)} className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-all flex items-center gap-1 ${isEditing ? 'bg-red-100 text-red-600 border-red-200' : 'bg-white text-gray-500 border-gray-200'}`}><Settings size={14}/> {isEditing ? 'Done' : 'Edit'}</button></div>
          {isEditing && (<div className="glass-card p-4 bg-white/80 animate-fade-in border-l-4 border-emerald-400"><div className="flex gap-2"><select value={newCat} onChange={e=>setNewCat(e.target.value)} className="bg-white border-none rounded-lg text-sm p-2 font-bold text-gray-600 focus:ring-2 focus:ring-emerald-200"><option value="carbs">🟡 Carbs</option><option value="protein">🔴 Protein</option><option value="veggie">🟢 Veggie</option><option value="fruit">🍎 Fruit</option><option value="workout">🔵 Workout</option><option disabled>---</option><option value="pilates">🧘 Pilates Move</option><option value="machine">🍑 Machine Move</option></select><input value={newItem} onChange={e=>setNewItem(e.target.value)} placeholder="Name" className="flex-1 bg-white border-none rounded-lg text-sm p-2 focus:ring-2 focus:ring-emerald-200"/><button onClick={addItem} className="bg-emerald-600 text-white px-4 rounded-lg font-bold text-sm">Add</button></div></div>)}
          <div className="glass-card p-8 relative">
            {renderSelector('Breakfast', ['carbs','protein','fruit'])}
            <hr className="border-gray-200/50 my-4"/>
            {renderSelector('Lunch', ['carbs','protein','veggie','fruit'])}
            <hr className="border-gray-200/50 my-4"/>
            {renderSelector('Dinner', ['protein','veggie','fruit'])}
            <hr className="border-gray-200/50 my-4"/>
            {renderSelector('Workout', ['workout'])}
            {(showPilates || showMachine) && (<div className="mt-6 bg-emerald-50/50 p-6 rounded-2xl border border-emerald-100/50 animate-fade-in"><div className="flex items-center gap-2 mb-4"><span className="p-1 bg-emerald-500 text-white rounded-full"><CheckCircle size={14}/></span><h4 className="font-bold text-emerald-800 text-sm tracking-wide uppercase">Routine Refinement</h4></div><div className="flex flex-wrap gap-2">{[...(showPilates?moveLibrary.pilates:[]), ...(showMachine?moveLibrary.machine:[])].map(m => (<button key={m} onClick={()=>toggleMove(m)} className={`relative px-3 py-1 rounded-full text-xs border transition-all ${isEditing?'bg-red-50 border-red-200 text-red-500':''} ${!isEditing && selectedMoves.includes(m)?'bg-emerald-600 text-white border-emerald-600':'bg-white text-emerald-700 border-emerald-200'}`}>{m}{isEditing && <X size={8} className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full"/>}</button>))}</div></div>)}
            <button onClick={handleSave} className={`w-full mt-6 ${theme.btn} text-white py-4 rounded-2xl font-bold shadow-xl shadow-emerald-200 hover:shadow-2xl hover:-translate-y-1 transition-all flex justify-center items-center gap-2 tracking-wide`}><Sparkles size={18}/> Confirm & Log Day</button>
          </div>
        </div>
        <div className="space-y-6">
           <div className="glass-card p-6 h-64 flex flex-col"><h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">Weight Trend</h4><div className="flex-1"><ResponsiveContainer width="100%" height="100%"><LineChart data={history}><YAxis hide domain={['dataMin-1','dataMax+1']}/><Tooltip contentStyle={{borderRadius:'12px', border:'none', boxShadow:'0 10px 30px -10px rgba(0,0,0,0.1)'}}/><Line type="monotone" dataKey="weight" stroke="#10b981" strokeWidth={3} dot={{r:4, fill:'#10b981', strokeWidth:0}} activeDot={{r:6}}/></LineChart></ResponsiveContainer></div></div>
           <div className="glass-card p-6 bg-gray-900/95 text-white backdrop-blur-md border-none"><h3 className="font-bold text-emerald-400 mb-6 text-sm tracking-widest flex items-center gap-2"><Zap size={14}/> NUTRITION AGGREGATE</h3><div className="space-y-4 text-sm font-light text-gray-300">
             <div className="border-b border-gray-800 pb-2"><div className="flex justify-between mb-1"><span className="text-yellow-400 font-bold text-xs uppercase">Carbs</span> <span className="text-white font-mono">{summary.carbs.length} items</span></div><div className="text-xs text-gray-500 leading-relaxed">{summary.carbs.join(', ') || 'None'}</div></div>
             <div className="border-b border-gray-800 pb-2"><div className="flex justify-between mb-1"><span className="text-red-400 font-bold text-xs uppercase">Protein</span> <span className="text-white font-mono">{summary.protein.length} items</span></div><div className="text-xs text-gray-500 leading-relaxed">{summary.protein.join(', ') || 'None'}</div></div>
             <div className="border-b border-gray-800 pb-2"><div className="flex justify-between mb-1"><span className="text-emerald-400 font-bold text-xs uppercase">Veggie</span> <span className="text-white font-mono">{summary.veggie.length} items</span></div><div className="text-xs text-gray-500 leading-relaxed">{summary.veggie.join(', ') || 'None'}</div></div>
             {/* 🍎 FRUIT ADDED HERE */}
             <div className="border-b border-gray-800 pb-2"><div className="flex justify-between mb-1"><span className="text-pink-400 font-bold text-xs uppercase">Fruit</span> <span className="text-white font-mono">{summary.fruit.length} items</span></div><div className="text-xs text-gray-500 leading-relaxed">{summary.fruit.join(', ') || 'None'}</div></div>
             <div className="pt-2"><span className="text-blue-400 font-bold text-xs uppercase block mb-1">Workout & Routine</span><div className="text-white text-lg font-medium">{build.workout.join(' + ') || 'Rest Day'}</div>{selectedMoves.length > 0 && <div className="text-xs text-blue-200 mt-1 italic opacity-80">{selectedMoves.join(' • ')}</div>}</div>
           </div></div>
        </div>
      </div>
    </div>
  );
};

// ==========================================
// 🧠 模块 2: Mind Protocol
// ==========================================
const MindModule = ({ goBack, addXP }) => {
  const theme = THEMES.mind;
  const [activeTab, setActiveTab] = useState('reading');
  const [entries, setEntries] = useStorage('lifeos_mind', []);
  const [inputs, setInputs] = useState({ title: "", excerpt: "", thoughts: "", trigger: "", correction: "", premise: "", conclusion: "", audioUrl: null, note: "" });
  const [recording, setRecording] = useState(false);
  const mediaRecorder = useRef(null);
  const handleDelete = (id) => { if(window.confirm("Delete?")) setEntries(entries.filter(e => e.id !== id)); };
  const startRec = async () => { try { const stream = await navigator.mediaDevices.getUserMedia({ audio: true }); mediaRecorder.current = new MediaRecorder(stream); const chunks = []; mediaRecorder.current.ondataavailable = e => chunks.push(e.data); mediaRecorder.current.onstop = () => { const blob = new Blob(chunks,{type:'audio/ogg;codecs=opus'}); setInputs(p=>({...p, audioUrl: URL.createObjectURL(blob)})); }; mediaRecorder.current.start(); setRecording(true); } catch(e) { alert("Mic Error"); } };
  const stopRec = () => { mediaRecorder.current?.stop(); setRecording(false); };
  const handleSave = () => { setEntries([{ id: Date.now(), category: activeTab, date: new Date().toLocaleString(), ...inputs, type: 'mind' }, ...entries]); setInputs({ title:"", excerpt:"", thoughts:"", trigger:"", correction:"", premise:"", conclusion:"", audioUrl:null, note:"" }); addXP(30); };
  const TABS = { reading: { label: 'Reading', icon: BookOpen }, weakness: { label: 'Weakness', icon: AlertTriangle }, logic: { label: 'Logic', icon: Lightbulb }, music: { label: 'Flow', icon: Mic } };

  return (
    <div className={`min-h-screen bg-gradient-to-br ${theme.bg} p-6 relative overflow-hidden font-sans`}>
      <BackgroundBlobs color="bg-indigo-300" />
      <Header title="Mind Protocol" icon={Brain} theme={theme} goBack={goBack} />
      <div className="max-w-3xl mx-auto relative z-10">
        <div className="flex justify-center mb-8"><div className="glass-card p-1.5 flex gap-1 rounded-2xl">{Object.entries(TABS).map(([key, conf]) => (<button key={key} onClick={() => setActiveTab(key)} className={`flex items-center gap-2 px-6 py-3 rounded-xl transition-all duration-300 text-sm font-medium ${activeTab === key ? 'bg-white shadow-lg text-blue-600' : 'text-gray-500 hover:text-gray-700 hover:bg-white/50'}`}><conf.icon size={16} /> {conf.label}</button>))}</div></div>
        <div className="glass-card p-8 mb-10 transition-all duration-500">
           {activeTab === 'reading' && (<div className="space-y-4 animate-fade-in"><input placeholder="📖 Book Title" value={inputs.title} onChange={e=>setInputs({...inputs, title:e.target.value})} className="w-full bg-white/50 border-none p-4 rounded-xl text-lg font-medium focus:ring-2 focus:ring-blue-200"/><textarea placeholder="❝ Excerpt..." value={inputs.excerpt} onChange={e=>setInputs({...inputs, excerpt:e.target.value})} className="w-full bg-white/50 border-none p-4 rounded-xl focus:ring-2 focus:ring-blue-200 min-h-[100px]" /><textarea placeholder="💡 Thoughts..." value={inputs.thoughts} onChange={e=>setInputs({...inputs, thoughts:e.target.value})} className="w-full bg-blue-50/50 border-none p-4 rounded-xl focus:ring-2 focus:ring-blue-200 min-h-[80px] text-blue-900" /></div>)}
           {activeTab === 'weakness' && (<div className="grid md:grid-cols-2 gap-6 animate-fade-in"><div className="bg-red-50/50 p-4 rounded-2xl border border-red-100"><span className="text-xs font-bold text-red-400 uppercase tracking-wider mb-2 block">Trigger (Ego)</span><textarea value={inputs.trigger} onChange={e=>setInputs({...inputs, trigger:e.target.value})} className="w-full bg-transparent border-none p-0 focus:ring-0 text-gray-700" rows={4}/></div><div className="bg-emerald-50/50 p-4 rounded-2xl border border-emerald-100"><span className="text-xs font-bold text-emerald-400 uppercase tracking-wider mb-2 block">Correction (Truth)</span><textarea value={inputs.correction} onChange={e=>setInputs({...inputs, correction:e.target.value})} className="w-full bg-transparent border-none p-0 focus:ring-0 text-gray-700" rows={4}/></div></div>)}
           {activeTab === 'logic' && (<div className="space-y-4 animate-fade-in font-mono text-sm"><div className="bg-white/50 p-4 rounded-xl border-l-4 border-purple-400"><span className="text-xs text-purple-400 font-bold block mb-1">// PREMISE</span><input value={inputs.premise} onChange={e=>setInputs({...inputs, premise:e.target.value})} className="w-full bg-transparent border-none focus:ring-0 p-0"/></div><div className="bg-white/50 p-4 rounded-xl border-l-4 border-purple-700"><span className="text-xs text-purple-700 font-bold block mb-1">// CONCLUSION</span><input value={inputs.conclusion} onChange={e=>setInputs({...inputs, conclusion:e.target.value})} className="w-full bg-transparent border-none focus:ring-0 p-0"/></div></div>)}
           {activeTab === 'music' && (<div className="text-center py-8 animate-fade-in">{!inputs.audioUrl ? (<button onClick={recording?stopRec:startRec} className={`w-24 h-24 rounded-full flex items-center justify-center mx-auto transition-all duration-500 shadow-2xl ${recording?'bg-red-500 shadow-red-300 scale-110':'bg-gradient-to-tr from-yellow-400 to-orange-500 shadow-orange-200 hover:scale-105'}`}>{recording ? <div className="w-8 h-8 bg-white rounded-md animate-pulse"/> : <Mic size={40} className="text-white"/>}</button>) : (<div className="flex items-center justify-center gap-4 bg-white/60 p-4 rounded-2xl w-fit mx-auto border border-white/60 shadow-sm"><button onClick={()=>new Audio(inputs.audioUrl).play()} className="p-3 bg-yellow-500 rounded-full text-white hover:bg-yellow-600 transition-colors"><Play size={20} fill="currentColor"/></button><button onClick={()=>setInputs(p=>({...p, audioUrl:null}))} className="p-2 text-gray-400 hover:text-red-500 transition-colors"><Trash2 size={18}/></button></div>)}<p className="mt-6 text-sm text-gray-500 font-medium">{recording ? "Recording..." : inputs.audioUrl ? "Captured" : "Tap to Record"}</p></div>)}
           <div className="flex justify-end mt-6"><button onClick={handleSave} className={`${theme.btn} text-white px-8 py-3 rounded-xl font-bold shadow-lg hover:shadow-xl transition-all flex items-center gap-2`}><Plus size={18}/> Log Entry</button></div>
        </div>
        <div className="space-y-6 pb-20">{entries.filter(e => e.category === activeTab).map(entry => (<div key={entry.id} className="glass-card p-6 group transition-all duration-300 hover:shadow-lg hover:bg-white/80 relative"><div className="flex justify-between items-start mb-3"><span className="text-xs font-bold text-gray-400 uppercase tracking-widest">{entry.date}</span><button onClick={()=>handleDelete(entry.id)} className="opacity-0 group-hover:opacity-100 p-2 text-gray-300 hover:text-red-500 transition-all rounded-full hover:bg-red-50"><Trash2 size={16}/></button></div>{activeTab==='reading' && (<><h3 className="text-lg font-bold text-gray-800 mb-2 font-serif">“{entry.title}”</h3><div className="pl-4 border-l-2 border-blue-200 text-gray-600 italic mb-4 text-sm">{entry.excerpt}</div><div className="text-sm text-blue-800 bg-blue-50/80 p-3 rounded-lg">{entry.thoughts}</div></>)}{activeTab==='weakness' && (<div className="flex gap-4"><div className="flex-1 bg-red-50/50 p-3 rounded-xl border border-red-100"><div className="text-[10px] font-bold text-red-400 mb-1">TRIGGER</div><div className="text-sm text-red-800">{entry.trigger}</div></div><div className="flex-1 bg-emerald-50/50 p-3 rounded-xl border border-emerald-100"><div className="text-[10px] font-bold text-emerald-400 mb-1">TRUTH</div><div className="text-sm text-emerald-800">{entry.correction}</div></div></div>)}{activeTab==='logic' && (<div className="font-mono text-xs bg-gray-50 p-4 rounded-xl text-gray-600 space-y-2"><div><span className="text-purple-500 font-bold">PREMISE:</span> {entry.premise}</div><div><span className="text-purple-700 font-bold">CONCLUSION:</span> {entry.conclusion}</div></div>)}{activeTab==='music' && (<div className="flex items-center gap-4"><div className="w-12 h-12 rounded-full bg-yellow-100 flex items-center justify-center text-yellow-600"><Music size={20}/></div><div><div className="text-sm font-bold text-gray-700">Audio Note</div><button onClick={()=>new Audio(entry.audioUrl).play()} className="text-xs text-yellow-600 font-bold hover:underline flex items-center gap-1 mt-1"><Play size={10}/> Play Recording</button></div></div>)}</div>))}</div>
      </div>
    </div>
  );
};

// ==========================================
// 🎹 模块 3: Music Band
// ==========================================
const MusicModule = ({ goBack, addXP }) => {
  const theme = THEMES.music;
  const [mode, setMode] = useState('practice');
  const [logs, setLogs] = useStorage('lifeos_music_logs', []);
  const [projects, setProjects] = useStorage('lifeos_music_projects', []);
  const [instrument, setInstrument] = useState("Drums");
  const [duration, setDuration] = useState(30);
  const [practiceNote, setPracticeNote] = useState("");
  const [newProj, setNewProj] = useState("");

  const addLog = () => { setLogs([{ id: Date.now(), date: new Date().toLocaleDateString(), instrument, duration, note: practiceNote }, ...logs]); setPracticeNote(""); addXP(15); alert("Logged! (+15 XP)"); };
  const addProj = () => { if(!newProj) return; setProjects([...projects, { id: Date.now(), name: newProj, status: 'Idea', progress: 10 }]); setNewProj(""); addXP(10); };
  const updateProj = (id, s, p) => { setProjects(projects.map(pr => pr.id === id ? { ...pr, status: s, progress: p } : pr)); if(s==='Done') addXP(50); };

  return (
    <div className={`min-h-screen bg-gradient-to-br ${theme.bg} p-6 relative overflow-hidden font-sans`}>
      <BackgroundBlobs color="bg-amber-300" />
      <Header title="Music Band" icon={Music} theme={theme} goBack={goBack} />
      <div className="max-w-4xl mx-auto relative z-10">
        <div className="flex justify-center mb-8"><div className="glass-card p-1.5 flex gap-1 rounded-2xl"><button onClick={()=>setMode('practice')} className={`px-6 py-3 rounded-xl text-sm font-bold transition-all ${mode==='practice'?'bg-white shadow text-amber-600':'text-gray-500 hover:text-gray-700'}`}>Practice Log</button><button onClick={()=>setMode('project')} className={`px-6 py-3 rounded-xl text-sm font-bold transition-all ${mode==='project'?'bg-white shadow text-amber-600':'text-gray-500 hover:text-gray-700'}`}>Project Tracker</button></div></div>
        
        {mode === 'practice' ? (
          <div className="space-y-6">
            <div className="glass-card p-8 flex flex-wrap gap-4 items-end">
               <div><label className="text-xs font-bold text-gray-400 uppercase">Instrument</label><select value={instrument} onChange={e=>setInstrument(e.target.value)} className="block w-40 p-3 bg-white/50 rounded-xl mt-1 font-bold text-gray-700 border-none"><option>🥁 Drums</option><option>🎹 Piano</option><option>🎼 Theory</option></select></div>
               <div><label className="text-xs font-bold text-gray-400 uppercase">Minutes</label><input type="number" value={duration} onChange={e=>setDuration(e.target.value)} className="block w-24 p-3 bg-white/50 rounded-xl mt-1 font-bold text-gray-700 border-none"/></div>
               <div className="flex-1"><label className="text-xs font-bold text-gray-400 uppercase">Focus</label><input value={practiceNote} onChange={e=>setPracticeNote(e.target.value)} placeholder="e.g. Paradiddle speed" className="block w-full p-3 bg-white/50 rounded-xl mt-1 text-gray-700 border-none"/></div>
               <button onClick={addLog} className={`${theme.btn} text-white p-3 rounded-xl shadow-lg`}><Plus size={24}/></button>
            </div>
            <div className="space-y-3">{logs.map(log => (<div key={log.id} className="glass-card p-5 flex justify-between items-center"><div className="flex items-center gap-4"><span className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center text-xl">{log.instrument.includes('Drums')?'🥁':log.instrument.includes('Piano')?'🎹':'🎼'}</span><div><div className="font-bold text-gray-800">{log.note||'Routine Practice'}</div><div className="text-xs text-gray-500">{log.date}</div></div></div><div className="font-mono font-bold text-amber-600 text-lg">{log.duration}m</div></div>))}</div>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="glass-card p-6 flex gap-3"><input value={newProj} onChange={e=>setNewProj(e.target.value)} placeholder="New Project / Song Name..." className="flex-1 bg-white/50 border-none p-3 rounded-xl"/><button onClick={addProj} className={`${theme.btn} text-white px-6 rounded-xl font-bold`}>Create</button></div>
            <div className="grid gap-4">{projects.map(p => (<div key={p.id} className="glass-card p-6"><div className="flex justify-between mb-4"><h3 className="font-bold text-xl text-gray-800">{p.name}</h3><span className="text-xs bg-white px-3 py-1 rounded-full font-bold text-amber-600 shadow-sm">{p.status}</span></div><div className="flex gap-2 bg-gray-50/50 p-1.5 rounded-xl mb-4">{['Idea','Composing','Recording','Done'].map((s,i) => (<button key={s} onClick={()=>updateProj(p.id, s, (i+1)*25)} className={`flex-1 text-xs py-2 rounded-lg font-bold transition-all ${p.status===s?'bg-white shadow text-amber-600':'text-gray-400 hover:bg-white/50'}`}>{s}</button>))}</div><div className="h-2 bg-gray-100 rounded-full overflow-hidden"><div className="h-full bg-amber-500 transition-all duration-700" style={{width:`${p.progress}%`}}></div></div></div>))}</div>
          </div>
        )}
      </div>
    </div>
  );
};

// ==========================================
// 🤖 模块 4: AI Lab
// ==========================================
const AILabModule = ({ goBack }) => {
  const theme = THEMES.ai;
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const handleSearch = () => { if (!query) return; setLoading(true); setTimeout(() => { setResults([{ title: `${query} Deep Dive`, url: 'https://wiki.com/core', summary: 'AI has aggregated key insights...' }, { title: `Advanced techniques for ${query}`, url: 'https://learn.com', summary: 'Top experts recommend...' }]); setLoading(false); }, 1500); };
  
  return (
    <div className={`min-h-screen bg-gradient-to-br ${theme.bg} p-6 relative overflow-hidden font-sans`}>
      <BackgroundBlobs color="bg-fuchsia-300" />
      <Header title="AI Researcher" icon={Bot} theme={theme} goBack={goBack} />
      <div className="max-w-3xl mx-auto relative z-10">
        <div className="glass-card p-10 text-center mb-8"><h2 className="text-2xl font-black text-gray-800 mb-2">Knowledge Hunter</h2><p className="text-gray-500 mb-6">Deploy autonomous agents to scour the web.</p><div className="flex gap-2 max-w-lg mx-auto relative"><input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Enter research topic..." className="flex-1 p-4 rounded-2xl bg-white/50 border-none focus:ring-2 focus:ring-fuchsia-300 text-lg shadow-inner"/><button onClick={handleSearch} disabled={loading} className={`${theme.btn} text-white px-8 rounded-2xl font-bold shadow-lg`}>{loading?'...':'Deploy'}</button></div></div>
        <div className="space-y-4">{results.map((r,i) => (<div key={i} className="glass-card p-6 hover:scale-[1.01] transition-transform"><h3 className="font-bold text-lg text-gray-800 mb-1">{r.title}</h3><a href="#" className="text-xs text-fuchsia-500 font-bold uppercase tracking-wider mb-3 block">Source Analyzed</a><p className="text-sm text-gray-600 leading-relaxed bg-white/40 p-4 rounded-xl">{r.summary}</p></div>))}</div>
      </div>
    </div>
  );
};

// ==========================================
// 🏠 Dashboard
// ==========================================
const Dashboard = ({ setView, xp, level, progress }) => {
  const [logs] = useStorage('lifeos_body_history', []); const [mindLogs] = useStorage('lifeos_mind', []);
  const heatmap = calculateHeatmap([...logs, ...mindLogs]);
  const yearProgress = ((new Date() - new Date('2026-01-01')) / (new Date('2026-12-31') - new Date('2026-01-01'))) * 100;

  return (
    <div className="min-h-screen bg-slate-50 relative overflow-hidden font-sans">
      <div className="absolute top-0 left-0 w-full h-96 bg-gradient-to-b from-gray-200 to-transparent opacity-50 z-0"></div>
      <div className="absolute top-[-100px] right-[-100px] w-96 h-96 bg-blue-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob"></div>
      <div className="absolute top-[-100px] left-[-100px] w-96 h-96 bg-purple-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-2000"></div>
      <div className="max-w-5xl mx-auto p-6 relative z-10">
        <header className="flex justify-between items-end mb-12 mt-4">
          <div><h1 className="text-5xl font-black text-gray-900 tracking-tighter mb-2">2026 <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600">Life OS</span></h1><p className="text-gray-500 font-medium">Architecture of Self-Reconstruction</p></div>
          <div className="flex items-center gap-4">
             <DataManager />
             <div className="glass-card px-5 py-3 flex items-center gap-4 rounded-full"><div className="text-right"><div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Level {level}</div><div className="text-sm font-black text-gray-800">{xp} XP</div></div><div className="w-10 h-10 rounded-full bg-gradient-to-tr from-yellow-400 to-orange-500 flex items-center justify-center shadow-lg shadow-orange-200 text-white font-bold"><Trophy size={18}/></div></div>
          </div>
        </header>
        <div className="glass-card p-6 mb-8 overflow-hidden"><div className="flex justify-between items-center mb-4"><h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2"><Zap size={14} className="text-yellow-500"/> Consistency Flow</h3><span className="text-xs font-medium text-gray-500">{Math.max(0, yearProgress).toFixed(1)}% Year Gone</span></div><div className="flex gap-1.5 min-w-max pb-2">{heatmap.map((d, i) => (<div key={i} title={`${d.date}: ${d.count}`} className={`w-8 h-12 rounded-lg transition-all duration-500 hover:scale-110 ${d.count===0?'bg-gray-100': d.count<2?'bg-blue-200': d.count<4?'bg-blue-400':'bg-blue-600 shadow-lg shadow-blue-200'}`}></div>))}</div></div>
        <div className="grid md:grid-cols-2 gap-6 pb-12"><ModuleCard title="Body OS" desc="Sculpt the vessel." icon={Dumbbell} theme={THEMES.body} onClick={() => setView('body')} /><ModuleCard title="Mind Protocol" desc="Debug internal monologue." icon={Brain} theme={THEMES.mind} onClick={() => setView('mind')} /><ModuleCard title="Music Band" desc="Find rhythm in chaos." icon={Music} theme={THEMES.music} onClick={() => setView('music')} /><ModuleCard title="AI Lab" desc="Extend your cognition." icon={Bot} theme={THEMES.ai} onClick={() => setView('ai')} /></div>
      </div>
    </div>
  );
};

const BackgroundBlobs = ({ color }) => (<div className="absolute inset-0 overflow-hidden pointer-events-none z-0"><div className={`absolute -top-[20%] -right-[10%] w-[600px] h-[600px] rounded-full mix-blend-multiply filter blur-[80px] opacity-40 animate-blob ${color}`}></div><div className={`absolute top-[20%] -left-[10%] w-[500px] h-[500px] rounded-full mix-blend-multiply filter blur-[80px] opacity-40 animate-blob animation-delay-2000 bg-gray-200`}></div></div>);
const Header = ({ title, icon: Icon, theme, goBack }) => (<div className="relative z-10 flex items-center justify-between mb-10 max-w-5xl mx-auto"><button onClick={goBack} className="w-10 h-10 rounded-full bg-white/50 hover:bg-white flex items-center justify-center text-gray-500 transition-all backdrop-blur-sm"><ArrowLeft size={20} /></button><div className="flex flex-col items-end"><h1 className={`text-3xl font-black ${theme.accent} tracking-tight`}>{title}</h1><p className="text-xs font-bold text-gray-400 uppercase tracking-widest">{theme.slogan}</p></div></div>);
const ModuleCard = ({ title, desc, icon: Icon, theme, onClick }) => (<div onClick={onClick} className="glass-card p-8 cursor-pointer group hover:scale-[1.02] transition-all duration-300 border-l-4" style={{borderLeftColor: theme.bg.split('-')[1]}}><div className="flex justify-between items-start mb-6"><div className={`p-4 rounded-2xl bg-gradient-to-br ${theme.bg} text-gray-700 group-hover:rotate-6 transition-transform shadow-sm`}>
<Icon size={28} /></div><div className="w-8 h-8 rounded-full border border-gray-200 flex items-center justify-center text-gray-300 group-hover:bg-gray-900 group-hover:text-white group-hover:border-gray-900 transition-all"><ChevronRight size={16}/></div></div><h3 className="text-2xl font-bold text-gray-800 mb-2">{title}</h3><p className="text-gray-500 font-medium">{desc}</p></div>);

function App() {
  const [view, setView] = useState('dashboard');
  const { xp, level, progress, addXP } = useGamification();
  return (
    <>
      <style>{`
        .glass-card { background: rgba(255, 255, 255, 0.65); backdrop-filter: blur(20px); -webkit-backdrop-filter: blur(20px); border: 1px solid rgba(255, 255, 255, 0.5); border-radius: 24px; box-shadow: 0 8px 32px 0 rgba(31, 38, 135, 0.07); }
        .animate-fade-in { animation: fadeIn 0.6s ease-out; }
        .animate-blob { animation: blob 7s infinite; }
        .animation-delay-2000 { animation-delay: 2s; }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes blob { 0% { transform: translate(0px, 0px) scale(1); } 33% { transform: translate(30px, -50px) scale(1.1); } 66% { transform: translate(-20px, 20px) scale(0.9); } 100% { transform: translate(0px, 0px) scale(1); } }
      `}</style>
      {view === 'dashboard' && <Dashboard setView={setView} xp={xp} level={level} progress={progress} />}
      {view === 'body' && <BodyModule goBack={()=>setView('dashboard')} addXP={addXP} />}
      {view === 'mind' && <MindModule goBack={()=>setView('dashboard')} addXP={addXP} />}
      {view === 'music' && <MusicModule goBack={()=>setView('dashboard')} addXP={addXP} />}
      {view === 'ai' && <AILabModule goBack={()=>setView('dashboard')} />}
    </>
  );
}
export default App;