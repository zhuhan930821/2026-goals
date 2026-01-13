import React, { useState, useEffect, useRef } from 'react';
import { 
  Dumbbell, Brain, Music, Bot, CheckSquare,
  BookOpen, AlertTriangle, Lightbulb, Mic, 
  ChevronRight, ArrowLeft, Save, Plus, Settings,
  Search, Trash2, X, Play, Activity, Trophy, Sparkles, Zap, 
  Download, Upload, CheckCircle, Flame, Calendar, List, RotateCcw,
  Home, Coffee, Feather, Code, PenTool, Sunrise, Smile
} from 'lucide-react';
import { LineChart, Line, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

// ==========================================
// 🎨 美学配置
// ==========================================
const THEMES = {
  body: { bg: "from-emerald-100/80 via-teal-50/50 to-cyan-100/80", btn: "bg-emerald-600 hover:bg-emerald-700", accent: "text-emerald-700", light: "bg-emerald-50 text-emerald-800" },
  mind: { bg: "from-blue-100/80 via-indigo-50/50 to-violet-100/80", btn: "bg-blue-600 hover:bg-blue-700", accent: "text-blue-700", light: "bg-blue-50 text-blue-800" },
  music: { bg: "from-amber-100/80 via-orange-50/50 to-yellow-100/80", btn: "bg-amber-600 hover:bg-amber-700", accent: "text-amber-700", light: "bg-amber-50 text-amber-800" },
  ai: { bg: "from-fuchsia-100/80 via-purple-50/50 to-pink-100/80", btn: "bg-fuchsia-600 hover:bg-fuchsia-700", accent: "text-fuchsia-700", light: "bg-fuchsia-50 text-fuchsia-800" },
  // ✅ 新增 Habits 主题
  habits: { bg: "from-rose-100/80 via-red-50/50 to-orange-100/80", btn: "bg-rose-600 hover:bg-rose-700", accent: "text-rose-700", light: "bg-rose-50 text-rose-800" }
};

// ==========================================
// 🛠️ 核心钩子
// ==========================================
const useStorage = (key, initial) => {
  const [data, setData] = useState(() => {
    try { 
      const item = localStorage.getItem(key); 
      return item ? JSON.parse(item) : initial; 
    } catch { 
      return initial; 
    }
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

// ==========================================
// 💾 数据管理
// ==========================================
const DataManager = () => {
  const [isOpen, setIsOpen] = useState(false);
  const handleExport = () => {
    const blob = new Blob([JSON.stringify(localStorage)], { type: 'application/json' });
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = `LifeOS_Backup_${new Date().toLocaleDateString()}.json`; a.click();
  };
  const handleImport = (e) => {
    const file = e.target.files[0]; if(!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      if(window.confirm("⚠️ Overwrite all data?")) {
        const data = JSON.parse(ev.target.result);
        Object.keys(data).forEach(k => localStorage.setItem(k, data[k]));
        window.location.reload();
      }
    };
    reader.readAsText(file);
  };
  const handleReset = () => {
    if(window.confirm("☢️ FACTORY RESET: Delete EVERYTHING?")) {
      localStorage.clear();
      window.location.reload();
    }
  };

  return (
    <>
      <button onClick={()=>setIsOpen(true)} className="p-2 hover:bg-black/5 rounded-full"><Settings size={20} className="text-gray-500"/></button>
      {isOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={()=>setIsOpen(false)}>
          <div className="glass-card p-6 w-full max-w-sm" onClick={e=>e.stopPropagation()}>
            <div className="flex justify-between mb-4"><h3 className="font-bold text-gray-800">System Core</h3><button onClick={()=>setIsOpen(false)}><X size={20}/></button></div>
            <div className="space-y-3">
              <button onClick={handleExport} className="w-full bg-black text-white py-2 rounded-lg flex justify-center gap-2 font-bold text-sm"><Download size={16}/> Backup JSON</button>
              <label className="w-full border border-gray-300 py-2 rounded-lg flex justify-center gap-2 font-bold text-sm cursor-pointer hover:bg-gray-50"><Upload size={16}/> Restore JSON<input type="file" className="hidden" onChange={handleImport}/></label>
              <div className="border-t border-gray-200 my-2"></div>
              <button onClick={handleReset} className="w-full text-red-500 bg-red-50 py-2 rounded-lg flex justify-center gap-2 font-bold text-sm hover:bg-red-100"><RotateCcw size={16}/> Factory Reset</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

// ==========================================
// ✅ Atomic Habits Module (已补全)
// ==========================================
const HabitsModule = ({ goBack, addXP }) => {
  const theme = THEMES.habits;
  const todayStr = new Date().toLocaleDateString();

  // 习惯列表定义
  const HABIT_LIST = [
    { id: 'h1', label: '扫地', icon: Home, cat: 'home' },
    { id: 'h2', label: '拖地', icon: Sparkles, cat: 'home' },
    { id: 'h3', label: '整理', icon: List, cat: 'home' },
    { id: 'h4', label: '洗衣服', icon: Zap, cat: 'chore' },
    { id: 'h5', label: '做饭', icon: Coffee, cat: 'chore' },
    { id: 'h6', label: '冥想', icon: Sunrise, cat: 'mind' },
    { id: 'h7', label: '记录灵感', icon: Feather, cat: 'mind' },
    { id: 'h8', label: '开发新App', icon: Code, cat: 'work' },
    { id: 'h9', label: '总结人生感想', icon: PenTool, cat: 'mind' },
  ];

  // 状态管理
  const [history, setHistory] = useStorage('lifeos_habits_history', []);
  const [todayChecked, setTodayChecked] = useState(() => {
    try {
      const saved = localStorage.getItem('lifeos_habits_today');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.date === todayStr) return parsed.checked;
      }
      return [];
    } catch { return []; }
  });

  useEffect(() => {
    localStorage.setItem('lifeos_habits_today', JSON.stringify({ date: todayStr, checked: todayChecked }));
  }, [todayChecked, todayStr]);

  const toggleHabit = (id) => {
    if (todayChecked.includes(id)) {
      setTodayChecked(todayChecked.filter(h => h !== id));
    } else {
      setTodayChecked([...todayChecked, id]);
      addXP(5);
    }
  };

  const progress = Math.round((todayChecked.length / HABIT_LIST.length) * 100);

  const calculateStreak = () => {
    const uniqueDates = new Set(history.map(h => h.date));
    return uniqueDates.size + (todayChecked.length > 0 && !history.find(h=>h.date===todayStr) ? 1 : 0);
  };

  const handleEndDay = () => {
    if (todayChecked.length === 0) return alert("今天还没打卡呢！");
    const existingIndex = history.findIndex(h => h.date === todayStr);
    let newHistory = [...history];
    if (existingIndex >= 0) {
      newHistory[existingIndex] = { date: todayStr, completed: todayChecked, count: todayChecked.length };
    } else {
      newHistory = [{ date: todayStr, completed: todayChecked, count: todayChecked.length }, ...history];
    }
    setHistory(newHistory);
    addXP(20); 
    alert("✨ 今日习惯已归档！");
  };

  return (
    <div className={`min-h-screen bg-gradient-to-br ${theme.bg} p-4 pb-20 font-sans`}>
      <Header title="Atomic Habits" icon={CheckSquare} theme={theme} goBack={goBack} />
      <div className="max-w-xl mx-auto">
        <div className="glass-card p-6 mb-6 flex items-center justify-between">
          <div><div className="text-xs font-bold text-rose-800/50 uppercase tracking-widest mb-1">Daily Progress</div><div className="text-3xl font-black text-rose-700">{progress}%</div></div>
          <div className="text-right"><div className="text-xs font-bold text-rose-800/50 uppercase tracking-widest mb-1">Total Days</div><div className="flex items-center gap-1 justify-end text-xl font-bold text-rose-600"><Flame size={18} fill="currentColor" /> {calculateStreak()}</div></div>
        </div>
        <div className="h-2 w-full bg-white/50 rounded-full mb-8 overflow-hidden"><div className="h-full bg-rose-500 transition-all duration-500 ease-out" style={{ width: `${progress}%` }}></div></div>
        <div className="grid gap-3">
          {HABIT_LIST.map(habit => {
            const isDone = todayChecked.includes(habit.id);
            return (
              <button key={habit.id} onClick={() => toggleHabit(habit.id)} className={`group flex items-center justify-between p-4 rounded-2xl border transition-all duration-200 active:scale-95 ${isDone ? 'bg-rose-500 border-rose-600 shadow-rose-200 shadow-lg' : 'bg-white/60 border-white/50 hover:bg-white'}`}>
                <div className="flex items-center gap-4"><div className={`p-2 rounded-xl ${isDone ? 'bg-white/20 text-white' : 'bg-rose-100 text-rose-600'}`}><habit.icon size={20} /></div><span className={`font-bold text-lg ${isDone ? 'text-white' : 'text-gray-700'}`}>{habit.label}</span></div>
                <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${isDone ? 'border-white bg-white text-rose-500' : 'border-gray-300'}`}>{isDone && <CheckCircle size={16} fill="currentColor" />}</div>
              </button>
            )
          })}
        </div>
        <button onClick={handleEndDay} className="w-full mt-8 bg-gray-900 text-white py-4 rounded-2xl font-bold shadow-xl flex justify-center gap-2 hover:bg-black transition-colors"><Save size={20}/> End & Archive Day (+20 XP)</button>
      </div>
    </div>
  );
};

// ==========================================
// 🧩 Body OS
// ==========================================
const BodyModule = ({ goBack, addXP }) => {
  const theme = THEMES.body;
  const [activeTab, setActiveTab] = useState('build');
  const [history, setHistory] = useStorage('lifeos_body_history', []);
  const [weight, setWeight] = useStorage('lifeos_weight_draft', 60.0);
  
  const [library, setLibrary] = useStorage('lifeos_food_lib_v6', {
    carbs: [{n:'🌽 玉米', c:100, cat:'Carb'}, {n:'🍠 紫薯', c:130, cat:'Carb'}, {n:'🍞 全麦包', c:250, cat:'Carb'}, {n:'🥣 燕麦', c:370, cat:'Carb'}],
    protein: [{n:'🥚 鸡蛋', c:70, cat:'Protein'}, {n:'🍗 鸡胸', c:165, cat:'Protein'}, {n:'🥩 牛肉', c:250, cat:'Protein'}, {n:'🦐 虾仁', c:90, cat:'Protein'}],
    veggie: [{n:'🥦 西兰花', c:35, cat:'Veggie'}, {n:'🥒 黄瓜', c:16, cat:'Veggie'}, {n:'🍅 番茄', c:18, cat:'Veggie'}, {n:'🥬 生菜', c:15, cat:'Veggie'}],
    fruit: [{n:'🍎 苹果', c:50, cat:'Fruit'}, {n:'🫐 蓝莓', c:57, cat:'Fruit'}, {n:'🍌 香蕉', c:90, cat:'Fruit'}],
    workout: ['🏃 慢跑', '🧘 普拉提', '🍑 超模机', '🏋️ 举铁'] 
  });
  
  const [moveLibrary, setMoveLibrary] = useStorage('lifeos_move_lib_v4', {
    pilates: ['百次拍击', '卷腹', '单腿画圈', '十字交叉', '天鹅式'],
    machine: ['后抬腿', '蚌式开合', '侧向行走', '深蹲行走', '驴踢']
  });

  const [meals, setMeals] = useStorage('lifeos_meals_draft_v3', { breakfast: [], lunch: [], dinner: [] });
  const [workouts, setWorkouts] = useStorage('lifeos_workouts_draft', []);
  const [selectedMoves, setSelectedMoves] = useStorage('lifeos_moves_draft', []);
  const [burnTarget, setBurnTarget] = useStorage('lifeos_burn_target', 2000);

  const [isEditing, setIsEditing] = useState(false);
  const [newType, setNewType] = useState('carbs');
  const [newName, setNewName] = useState('');
  const [newCal, setNewCal] = useState('');

  const handleAddItem = () => {
    if(!newName) return;
    if(['pilates','machine'].includes(newType)) {
      setMoveLibrary(prev => ({...prev, [newType]: [...prev[newType], newName]}));
    } else if(['carbs','protein','veggie','fruit'].includes(newType)) {
      const catMap = {carbs:'Carb', protein:'Protein', veggie:'Veggie', fruit:'Fruit'};
      setLibrary(prev => ({...prev, [newType]: [...prev[newType], {n:newName, c:Number(newCal)||0, cat:catMap[newType]}]}));
    } else if(newType === 'workout') {
      setLibrary(prev => ({...prev, workout: [...prev.workout, newName]}));
    }
    setNewName(''); setNewCal(''); alert("Added!");
  };

  const handleLibClick = (type, item) => {
    if(isEditing) {
      if(window.confirm(`Delete "${item.n || item}"?`)) {
        if(['pilates','machine'].includes(type)) setMoveLibrary(prev => ({...prev, [type]: prev[type].filter(i => i !== item)}));
        else if(type === 'workout') setLibrary(prev => ({...prev, workout: prev.workout.filter(i => i !== item)}));
        else setLibrary(prev => ({...prev, [type]: prev[type].filter(i => i.n !== item.n)}));
      }
    }
  };

  const addFood = (slot, item) => setMeals(prev => ({ ...prev, [slot]: [...prev[slot], { id: Date.now(), name: item.n, cal: item.c, cat: item.cat, qty: 1 }] }));
  const updateFood = (slot, id, field, value) => setMeals(prev => ({ ...prev, [slot]: prev[slot].map(f => f.id === id ? { ...f, [field]: Number(value) } : f) }));
  const removeFood = (slot, id) => setMeals(prev => ({ ...prev, [slot]: prev[slot].filter(f => f.id !== id) }));
  
  const toggleWorkout = (w) => setWorkouts(prev => prev.includes(w) ? prev.filter(i=>i!==w) : [...prev, w]);
  const toggleMove = (m) => setSelectedMoves(prev => prev.includes(m) ? prev.filter(i=>i!==m) : [...prev, m]);

  const calculateTotal = (slot) => meals[slot].reduce((sum, item) => sum + (item.cal * item.qty), 0);
  const totalIntake = calculateTotal('breakfast') + calculateTotal('lunch') + calculateTotal('dinner');
  const deficit = burnTarget - totalIntake;
  const getAggregated = () => {
    const all = [...meals.breakfast, ...meals.lunch, ...meals.dinner];
    return {
      Carb: all.filter(i => i.cat === 'Carb'),
      Protein: all.filter(i => i.cat === 'Protein'),
      Veggie: all.filter(i => i.cat === 'Veggie'),
      Fruit: all.filter(i => i.cat === 'Fruit'),
    };
  };
  const summary = getAggregated();
  
  const showPilates = workouts.includes('🧘 普拉提');
  const showMachine = workouts.includes('🍑 超模机');

  const autoSetBurn = () => {
    if(!weight) return;
    const estimated = Math.round(weight * 30); 
    if(window.confirm(`Based on ${weight}kg, your estimated TDEE is ~${estimated} kcal.\nUpdate Target Burn?`)) {
      setBurnTarget(estimated);
    }
  };

  const handleSave = () => {
    const record = { id: Date.now(), date: new Date().toLocaleDateString(), weight, meals, workouts, detailedMoves: selectedMoves, totalIntake, deficit };
    setHistory([...history, record]);
    addXP(20); 
    setMeals({ breakfast: [], lunch: [], dinner: [] }); 
    setWorkouts([]);       
    setSelectedMoves([]);  
    alert("✅ Daily Log Saved!");
  };

  return (
    <div className={`min-h-screen bg-gradient-to-br ${theme.bg} p-4 pb-20 font-sans`}>
      <Header title="Body OS" icon={Dumbbell} theme={theme} goBack={goBack} />
      
      <div className="max-w-6xl mx-auto mb-6 flex justify-center">
        <div className="glass-card p-1 flex gap-1 rounded-xl">
          <button onClick={()=>setActiveTab('build')} className={`px-6 py-2 rounded-lg text-sm font-bold transition-all ${activeTab==='build'?'bg-emerald-600 text-white shadow':'text-gray-500 hover:bg-white/50'}`}>🏗️ Daily Build</button>
          <button onClick={()=>setActiveTab('history')} className={`px-6 py-2 rounded-lg text-sm font-bold transition-all ${activeTab==='history'?'bg-emerald-600 text-white shadow':'text-gray-500 hover:bg-white/50'}`}>📜 History Log</button>
        </div>
      </div>

      {activeTab === 'build' ? (
        <div className="max-w-6xl mx-auto grid lg:grid-cols-3 gap-6 animate-fade-in">
          <div className="lg:col-span-2 space-y-6">
            <div className="glass-card p-4 flex justify-between items-center">
               <div className="flex items-center gap-2 text-emerald-800 font-bold"><Activity size={18}/> Morning Weight <input type="number" value={weight} onChange={e=>setWeight(e.target.value)} className="w-16 text-right bg-transparent border-b border-emerald-300 font-bold text-xl outline-none"/> kg</div>
               <button onClick={()=>setIsEditing(!isEditing)} className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-all flex items-center gap-1 ${isEditing ? 'bg-red-100 text-red-600 border-red-200' : 'bg-white text-gray-500 border-gray-200'}`}>
                 <Settings size={14}/> {isEditing ? 'Done Editing' : 'Edit Library'}
               </button>
            </div>

            {isEditing && (
              <div className="glass-card p-4 bg-emerald-50/80 border border-emerald-200 animate-fade-in">
                <h4 className="text-xs font-bold text-emerald-700 uppercase mb-2">➕ Add to Library</h4>
                <div className="flex gap-2 flex-wrap">
                  <select value={newType} onChange={e=>setNewType(e.target.value)} className="p-2 rounded-lg text-sm border-none shadow-sm font-bold text-gray-600">
                    <optgroup label="Food"><option value="carbs">🟡 Carbs</option><option value="protein">🔴 Protein</option><option value="veggie">🟢 Veggie</option><option value="fruit">🍎 Fruit</option></optgroup>
                    <optgroup label="Exercise"><option value="workout">🔵 Workout</option><option value="pilates">🧘 Pilates Move</option><option value="machine">🍑 Machine Move</option></optgroup>
                  </select>
                  <input placeholder="Name" value={newName} onChange={e=>setNewName(e.target.value)} className="flex-1 p-2 rounded-lg text-sm border-none shadow-sm"/>
                  {['carbs','protein','veggie','fruit'].includes(newType) && (
                    <input placeholder="Cal" type="number" value={newCal} onChange={e=>setNewCal(e.target.value)} className="w-16 p-2 rounded-lg text-sm border-none shadow-sm"/>
                  )}
                  <button onClick={handleAddItem} className="bg-emerald-600 text-white px-4 rounded-lg font-bold text-sm shadow-md">Add</button>
                </div>
                <p className="text-[10px] text-red-400 mt-2">* Click items below to DELETE them from library while in this mode.</p>
              </div>
            )}

            <div className="glass-card p-6">
              {['breakfast', 'lunch', 'dinner'].map(slot => (
                <div key={slot} className="mb-6 bg-white/40 p-4 rounded-2xl border border-white/50">
                  <div className="flex justify-between items-center mb-3">
                    <h4 className="font-bold text-emerald-800 uppercase text-xs tracking-wider">{slot}</h4>
                    <span className="text-xs font-mono text-emerald-600">{calculateTotal(slot)} kcal</span>
                  </div>
                  <div className="space-y-2 mb-3">
                    {meals[slot].map(item => (
                      <div key={item.id} className="flex items-center gap-2 text-sm bg-white/60 p-2 rounded-lg">
                        <span className={`w-2 h-2 rounded-full ${item.cat==='Carb'?'bg-yellow-400':item.cat==='Protein'?'bg-red-400':item.cat==='Veggie'?'bg-green-400':'bg-pink-400'}`}></span>
                        <span className="flex-1 font-bold text-gray-700">{item.name}</span>
                        <div className="flex items-center gap-1"><span className="text-[10px] text-gray-400">Qty</span><input type="number" value={item.qty} onChange={e=>updateFood(slot, item.id, 'qty', e.target.value)} className="w-8 text-center bg-transparent font-bold outline-none"/></div>
                        <div className="flex items-center gap-1"><span className="text-[10px] text-gray-400">Cal</span><input type="number" value={item.cal} onChange={e=>updateFood(slot, item.id, 'cal', e.target.value)} className="w-10 text-center bg-transparent font-mono outline-none"/></div>
                        <button onClick={()=>removeFood(slot, item.id)} className="text-red-400 hover:text-red-600"><Trash2 size={14}/></button>
                      </div>
                    ))}
                  </div>
                  <div className="flex flex-wrap gap-2 pt-2 border-t border-emerald-100">
                    <span className="text-[10px] font-bold text-gray-400 uppercase w-full">Quick Add:</span>
                    {['carbs', 'protein', 'veggie', 'fruit'].map(catKey => library[catKey].map(f => (
                      <button key={f.n} onClick={() => isEditing ? handleLibClick(catKey, f) : addFood(slot, f)} 
                        className={`relative px-2 py-1 rounded text-xs border transition-colors 
                        ${isEditing ? 'bg-red-50 border-red-200 text-red-500 cursor-alias' : 'bg-white/60 hover:brightness-95 cursor-pointer'} 
                        ${!isEditing && f.cat==='Carb'?'border-yellow-200 text-yellow-700':!isEditing && f.cat==='Protein'?'border-red-200 text-red-700':!isEditing && f.cat==='Veggie'?'border-green-200 text-green-700':!isEditing && 'border-pink-200 text-pink-700'}`}>
                        {f.n} {isEditing && <X size={8} className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full"/>}
                      </button>
                    )))}
                  </div>
                </div>
              ))}
              
              <div className="bg-emerald-50/50 p-4 rounded-xl border border-emerald-100 mb-4">
                <h4 className="font-bold text-emerald-800 text-xs uppercase mb-2">🔥 Workout Types</h4>
                <div className="flex flex-wrap gap-2 mb-4">
                  {library.workout.map(w => (
                    <button key={w} onClick={() => isEditing ? handleLibClick('workout', w) : toggleWorkout(w)} 
                      className={`relative px-3 py-1.5 rounded-lg text-xs font-bold border transition-all 
                      ${isEditing ? 'bg-red-50 border-red-200 text-red-500' : workouts.includes(w)?'bg-emerald-600 text-white border-emerald-600':'bg-white text-gray-500 border-gray-200'}`}>
                      {w} {isEditing && <X size={10} className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full"/>}
                    </button>
                  ))}
                </div>

                {(showPilates || showMachine || isEditing) && (
                  <div className="bg-white/50 p-3 rounded-lg border border-white/60 animate-fade-in">
                     <h5 className="text-[10px] font-bold text-emerald-600 uppercase mb-2 flex items-center gap-1"><CheckCircle size={10}/> Detailed Routine {isEditing && "(Edit Mode)"}</h5>
                     {(showPilates || isEditing) && (
                       <div className="mb-2">
                         <span className="text-[10px] text-gray-400 block mb-1">Pilates:</span>
                         <div className="flex flex-wrap gap-1">
                           {moveLibrary.pilates.map(m => (
                             <button key={m} onClick={() => isEditing ? handleLibClick('pilates', m) : toggleMove(m)} 
                               className={`relative px-2 py-1 rounded text-[10px] border ${isEditing?'bg-red-50 border-red-200 text-red-500':selectedMoves.includes(m)?'bg-emerald-500 text-white':'bg-white text-gray-600'}`}>
                               {m} {isEditing && <X size={8} className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full"/>}
                             </button>
                           ))}
                         </div>
                       </div>
                     )}
                     {(showMachine || isEditing) && (
                       <div>
                         <span className="text-[10px] text-gray-400 block mb-1">Machine:</span>
                         <div className="flex flex-wrap gap-1">
                           {moveLibrary.machine.map(m => (
                             <button key={m} onClick={() => isEditing ? handleLibClick('machine', m) : toggleMove(m)} 
                               className={`relative px-2 py-1 rounded text-[10px] border ${isEditing?'bg-red-50 border-red-200 text-red-500':selectedMoves.includes(m)?'bg-emerald-500 text-white':'bg-white text-gray-600'}`}>
                               {m} {isEditing && <X size={8} className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full"/>}
                             </button>
                           ))}
                         </div>
                       </div>
                     )}
                  </div>
                )}
              </div>

              <button onClick={handleSave} className="w-full bg-emerald-600 text-white py-3 rounded-xl font-bold shadow-lg hover:bg-emerald-700 transition-colors flex justify-center gap-2">
                <Save size={18}/> Save Daily Log (+20 XP)
              </button>
            </div>
          </div>

          <div className="space-y-6">
            <div className="glass-card p-5 text-center relative group">
              <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3">Deficit Monitor</h3>
              <div className="flex justify-center items-end gap-1 mb-4">
                <span className={`text-5xl font-black tracking-tighter ${deficit > 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                  {deficit > 0 ? '-' : '+'}{Math.abs(deficit)}
                </span>
                <span className="text-gray-400 text-xs mb-2 font-bold">kcal</span>
              </div>
              <div className="grid grid-cols-3 gap-1 border-t border-gray-200/60 pt-4 items-center">
                <div className="flex flex-col items-center">
                  <div className="font-black text-gray-800 text-xl tracking-tight">{totalIntake}</div>
                  <div className="text-[10px] text-gray-400 font-bold uppercase mt-1">Intake</div>
                </div>
                <div className="text-gray-200 font-light text-2xl flex justify-center pb-2">/</div>
                <div className="flex flex-col items-center relative">
                  <div className="flex items-center justify-center gap-1 w-full">
                    <input 
                      type="number" 
                      value={burnTarget} 
                      onChange={e=>setBurnTarget(e.target.value)} 
                      className="w-20 font-black text-gray-800 text-xl text-center bg-transparent border-b border-gray-300 focus:border-emerald-500 outline-none p-0"
                    />
                    <button onClick={autoSetBurn} className="absolute -right-1 top-1 text-emerald-400 hover:text-emerald-600 transition-colors" title="Auto-calc">
                      <Sparkles size={10}/>
                    </button>
                  </div>
                  <div className="text-[10px] text-gray-400 font-bold uppercase mt-1">Goal</div>
                </div>
              </div>
            </div>

            <div className="glass-card p-6 bg-gray-900/95 text-white backdrop-blur-md border-none">
               <h3 className="font-bold text-emerald-400 mb-4 text-xs tracking-widest flex items-center gap-2"><Zap size={14}/> NUTRITION AGGREGATE</h3>
               <div className="space-y-3 text-sm font-light text-gray-300">
                 {Object.entries(summary).map(([cat, items]) => (
                   <div key={cat} className="border-b border-gray-800 pb-2">
                     <div className="flex justify-between mb-1">
                       <span className={`font-bold text-xs uppercase ${cat==='Carb'?'text-yellow-400':cat==='Protein'?'text-red-400':cat==='Veggie'?'text-green-400':'text-pink-400'}`}>{cat}</span>
                       <span className="text-white font-mono">{items.length} items</span>
                     </div>
                     <div className="text-xs text-gray-500 leading-relaxed">{items.map(i=>i.name).join(', ') || 'None'}</div>
                   </div>
                 ))}
                 <div className="pt-2"><span className="text-blue-400 font-bold text-xs uppercase block mb-1">Workout</span><div className="text-white text-lg font-medium">{workouts.join(' + ') || 'Rest Day'}</div>{selectedMoves.length > 0 && <div className="text-xs text-blue-200 mt-1 italic">{selectedMoves.join(' • ')}</div>}</div>
               </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="max-w-4xl mx-auto space-y-4 animate-fade-in">
          {history.slice().reverse().map(log => (
            <div key={log.id} className="glass-card p-6 flex justify-between items-start">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <span className="font-bold text-gray-800">{log.date}</span>
                  <span className="text-xs bg-emerald-100 text-emerald-700 px-2 py-1 rounded font-bold">{log.weight} kg</span>
                </div>
                <div className="text-sm text-gray-600"><span className="font-bold">Workouts:</span> {log.workouts.join(', ') || 'Rest'}</div>
                {log.detailedMoves && log.detailedMoves.length > 0 && <div className="text-xs text-gray-400 italic mt-1">{log.detailedMoves.join(', ')}</div>}
                <div className="text-xs text-gray-400 mt-2 font-mono">Intake: {log.totalIntake} kcal • Deficit: {log.deficit}</div>
              </div>
              <button onClick={()=>{if(window.confirm('Delete?')) setHistory(history.filter(h=>h.id!==log.id))}} className="text-gray-300 hover:text-red-500"><Trash2 size={16}/></button>
            </div>
          ))}
          {history.length===0 && <div className="text-center text-gray-400 py-10">No history yet.</div>}
        </div>
      )}
    </div>
  );
};

// ==========================================
// 🧠 Mind Protocol
// ==========================================
const MindModule = ({ goBack, addXP }) => {
  const theme = THEMES.mind;
  const [activeTab, setActiveTab] = useState('reading');
  const [entries, setEntries] = useStorage('lifeos_mind_v2', [
    { id: 1, type: 'mind', category: 'reading', date: 'Example', title: 'Welcome to Mind Protocol', excerpt: 'Start by logging your thoughts above.', thoughts: 'This system helps you track cognitive patterns.' }
  ]);
  const [inputs, setInputs] = useStorage('lifeos_mind_draft', { title: "", excerpt: "", thoughts: "", trigger: "", correction: "", premise: "", conclusion: "", audioUrl: null, note: "" });
  const [recording, setRecording] = useState(false);
  const mediaRecorder = useRef(null);
  const audioChunks = useRef([]);

  const handleSave = () => {
    setEntries([{ id: Date.now(), category: activeTab, date: new Date().toLocaleDateString(), ...inputs, type: 'mind' }, ...entries]);
    setInputs({ title:"", excerpt:"", thoughts:"", trigger:"", correction:"", premise:"", conclusion:"", audioUrl:null, note:"" });
    addXP(30); alert("Mind Logged!");
  };
  const handleDelete = (id) => { if(window.confirm("Delete?")) setEntries(entries.filter(e => e.id !== id)); };
  
  // Audio Logic (Fixed to use Base64)
  const startRec = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      let mimeType = MediaRecorder.isTypeSupported('audio/mp4') ? 'audio/mp4' : 'audio/webm';
      const recorder = new MediaRecorder(stream, { mimeType });
      mediaRecorder.current = recorder;
      audioChunks.current = [];
      recorder.ondataavailable = e => { if(e.data.size > 0) audioChunks.current.push(e.data); };
      
      // ✅ 使用 FileReader 将 Blob 转为 Base64 字符串以持久保存
      recorder.onstop = () => {
        const blob = new Blob(audioChunks.current, { type: mimeType });
        const reader = new FileReader();
        reader.readAsDataURL(blob); 
        reader.onloadend = () => {
           setInputs(p => ({ ...p, audioUrl: reader.result })); 
        };
      };
      
      recorder.start(); setRecording(true);
    } catch(e) { alert("Mic Error: Check permissions"); }
  };
  const stopRec = () => { mediaRecorder.current?.stop(); setRecording(false); };
  
  const TABS = { reading: { label: 'Reading', icon: BookOpen }, weakness: { label: 'Weakness', icon: AlertTriangle }, logic: { label: 'Logic', icon: Lightbulb }, music: { label: 'Flow', icon: Mic } };

  return (
    <div className={`min-h-screen bg-gradient-to-br ${theme.bg} p-4 font-sans pb-20`}>
      <Header title="Mind Protocol" icon={Brain} theme={theme} goBack={goBack} />
      <div className="max-w-3xl mx-auto relative z-10">
        <div className="glass-card p-1.5 mb-8 overflow-x-auto no-scrollbar">
          <div className="flex gap-2 min-w-max">
            {Object.entries(TABS).map(([key, conf]) => (
              <button key={key} onClick={() => setActiveTab(key)} className={`flex items-center gap-2 px-6 py-3 rounded-xl transition-all text-sm font-medium whitespace-nowrap ${activeTab === key ? 'bg-white shadow-lg text-blue-600' : 'text-gray-500 hover:bg-white/50'}`}>
                <conf.icon size={16} /> {conf.label}
              </button>
            ))}
          </div>
        </div>
        
        <div className="glass-card p-6 mb-10 transition-all ring-4 ring-white/20">
           {activeTab === 'reading' && (
             <div className="space-y-4 animate-fade-in">
               <input placeholder="📖 Book Title" value={inputs.title} onChange={e=>setInputs({...inputs, title:e.target.value})} className="w-full bg-white/70 border border-blue-100 p-4 rounded-xl focus:bg-white focus:shadow-md transition-all"/>
               <textarea placeholder="❝ Excerpt (原文摘录)..." value={inputs.excerpt} onChange={e=>setInputs({...inputs, excerpt:e.target.value})} className="w-full bg-white/70 border border-blue-100 p-4 rounded-xl min-h-[80px] focus:bg-white focus:shadow-md transition-all" />
               <textarea placeholder="💡 Thoughts (我的思考)..." value={inputs.thoughts} onChange={e=>setInputs({...inputs, thoughts:e.target.value})} className="w-full bg-blue-50/80 border border-blue-200 p-4 rounded-xl min-h-[80px] focus:bg-white focus:shadow-md transition-all" />
             </div>
           )}
           {activeTab === 'weakness' && (
             <div className="grid gap-4 animate-fade-in">
               <div className="bg-red-50/80 p-4 rounded-xl border border-red-200"><textarea value={inputs.trigger} onChange={e=>setInputs({...inputs, trigger:e.target.value})} className="w-full bg-transparent border-none p-0 placeholder:text-red-300 focus:outline-none" placeholder="Trigger (Ego/Emotion)..."/></div>
               <div className="bg-emerald-50/80 p-4 rounded-xl border border-emerald-200"><textarea value={inputs.correction} onChange={e=>setInputs({...inputs, correction:e.target.value})} className="w-full bg-transparent border-none p-0 placeholder:text-emerald-300 focus:outline-none" placeholder="Correction (Objective Truth)..."/></div>
             </div>
           )}
           {activeTab === 'logic' && (
             <div className="space-y-4 animate-fade-in">
               <div className="bg-white/70 p-4 rounded-xl border-l-4 border-purple-400 shadow-sm"><input value={inputs.premise} onChange={e=>setInputs({...inputs, premise:e.target.value})} className="w-full bg-transparent border-none p-0 focus:outline-none" placeholder="Premise (前提)..."/></div>
               <div className="bg-white/70 p-4 rounded-xl border-l-4 border-purple-700 shadow-sm"><input value={inputs.conclusion} onChange={e=>setInputs({...inputs, conclusion:e.target.value})} className="w-full bg-transparent border-none p-0 focus:outline-none" placeholder="Conclusion (结论)..."/></div>
             </div>
           )}
           {activeTab === 'music' && (
             <div className="text-center py-6 animate-fade-in">
               {!inputs.audioUrl ? (
                 <button onClick={recording?stopRec:startRec} className={`w-20 h-20 rounded-full flex items-center justify-center mx-auto transition-all ${recording?'bg-red-500 animate-pulse shadow-red-300/50 shadow-xl':'bg-blue-600 shadow-lg hover:scale-105'}`}>
                   <Mic size={32} className="text-white"/>
                 </button>
               ) : (
                 <div className="flex items-center justify-center gap-4 bg-white/60 p-4 rounded-2xl w-fit mx-auto border border-blue-100">
                   <button onClick={()=>new Audio(inputs.audioUrl).play()} className="p-3 bg-yellow-500 rounded-full text-white shadow-md hover:bg-yellow-600"><Play size={20} fill="currentColor"/></button>
                   <button onClick={()=>setInputs(p=>({...p, audioUrl:null}))} className="p-2 text-red-400 hover:bg-red-50 rounded-lg"><Trash2 size={18}/></button>
                 </div>
               )}
               <p className="mt-4 text-xs font-bold text-blue-900/50 uppercase tracking-widest">{recording?"Recording...":inputs.audioUrl?"Audio Captured":"Tap Mic to Log Flow"}</p>
             </div>
           )}
           <div className="flex justify-end mt-6">
             <button onClick={handleSave} className="bg-blue-600 text-white px-8 py-3 rounded-xl font-bold shadow-lg hover:bg-blue-700 transition-colors flex items-center gap-2 transform active:scale-95">
               <Plus size={18}/> Log Entry
             </button>
           </div>
        </div>

        {/* Entries List */}
        <div className="space-y-4">
          {entries.length === 0 && <div className="text-center text-blue-900/30 font-bold py-10">Your mind is clear. Add an entry above.</div>}
          {entries.slice().reverse().map(entry => (
            <div key={entry.id} className="glass-card p-5 relative group border-l-4 hover:translate-x-1 transition-all" style={{borderLeftColor: entry.category==='weakness'?'#f87171':entry.category==='logic'?'#a855f7':'#3b82f6'}}>
              <button onClick={()=>handleDelete(entry.id)} className="absolute top-4 right-4 text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"><Trash2 size={16}/></button>
              <div className="flex justify-between items-start mb-2">
                 <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 bg-white/50 px-2 py-1 rounded">{entry.category}</span>
                 <span className="text-xs text-gray-400">{entry.date}</span>
              </div>
              
              {entry.title && <div className="font-bold text-gray-800 text-lg mb-1">{entry.title}</div>}
              {entry.excerpt && <div className="text-sm text-gray-500 italic mb-3 border-l-2 border-gray-300 pl-3">"{entry.excerpt}"</div>}
              {entry.thoughts && <div className="text-sm text-blue-900 bg-blue-50/80 p-3 rounded-lg border border-blue-100">{entry.thoughts}</div>}
              
              {entry.trigger && (
                <div className="grid grid-cols-2 gap-2 text-sm mt-2">
                  <div className="bg-red-50/80 p-3 rounded-lg text-red-800 border border-red-100"><span className="block text-[10px] font-bold uppercase text-red-300 mb-1">Trigger</span>{entry.trigger}</div>
                  <div className="bg-emerald-50/80 p-3 rounded-lg text-emerald-800 border border-emerald-100"><span className="block text-[10px] font-bold uppercase text-emerald-300 mb-1">Correction</span>{entry.correction}</div>
                </div>
              )}
              {entry.premise && (
                 <div className="bg-purple-50/50 p-3 rounded-lg mt-2 text-sm space-y-2 border border-purple-100">
                    <div><span className="text-purple-400 font-bold text-xs uppercase mr-2">Premise:</span>{entry.premise}</div>
                    <div><span className="text-purple-600 font-bold text-xs uppercase mr-2">Therefore:</span>{entry.conclusion}</div>
                 </div>
              )}
              {entry.audioUrl && (
                <div className="flex items-center gap-3 mt-3 bg-yellow-50/50 p-2 rounded-xl border border-yellow-100 w-fit">
                  <div className="bg-yellow-400 p-2 rounded-full text-white shadow-sm"><Music size={14}/></div>
                  <button onClick={()=>new Audio(entry.audioUrl).play()} className="text-xs font-bold text-yellow-800 hover:underline pr-2">Play Audio Note</button>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// ==========================================
// 🎹 Music & 🤖 AI
// ==========================================
const MusicModule = ({ goBack, addXP }) => {
  const theme = THEMES.music;
  const [logs, setLogs] = useStorage('lifeos_music_logs', []);
  const [inst, setInst] = useState('Drums'); 
  const [dur, setDur] = useState(30); 
  const [note, setNote] = useState('');
  
  const addLog = () => { setLogs([{ id:Date.now(), date:new Date().toLocaleDateString(), inst, dur, note }, ...logs]); setNote(''); addXP(15); };
  
  return (
    <div className={`min-h-screen bg-gradient-to-br ${theme.bg} p-6 font-sans`}>
      <Header title="Music Band" icon={Music} theme={theme} goBack={goBack} />
      <div className="max-w-4xl mx-auto glass-card p-8">
        <div className="flex flex-wrap gap-4 items-end mb-8">
          <div>
            <label className="text-xs font-bold uppercase text-gray-500 mb-1 block">Inst/Type</label>
            <select value={inst} onChange={e=>setInst(e.target.value)} className="block p-3 rounded-xl bg-white/50 w-36 border-none focus:ring-2 ring-amber-400 outline-none font-bold text-gray-700">
              <option>🥁 Drums</option>
              <option>🎹 Piano</option>
              <option>🎼 Theory</option>
              <option>🎤 Vocals</option>
            </select>
          </div>
          <div><label className="text-xs font-bold uppercase text-gray-500 mb-1 block">Mins</label><input type="number" value={dur} onChange={e=>setDur(e.target.value)} className="block p-3 rounded-xl bg-white/50 w-24 border-none focus:ring-2 ring-amber-400 outline-none font-mono"/></div>
          <div className="flex-1"><label className="text-xs font-bold uppercase text-gray-500 mb-1 block">Focus Note</label><input value={note} onChange={e=>setNote(e.target.value)} placeholder="e.g., Jazz scales, Rhythmic patterns..." className="block w-full p-3 rounded-xl bg-white/50 border-none focus:ring-2 ring-amber-400 outline-none"/></div>
          <button onClick={addLog} className="bg-amber-600 text-white p-3 rounded-xl shadow-lg hover:bg-amber-700 transition-transform active:scale-95"><Plus size={24}/></button>
        </div>
        <div className="space-y-2">
          {logs.map(l=>(
            <div key={l.id} className="bg-white/40 p-4 rounded-xl flex justify-between items-center border border-white/50">
              <div className="flex items-center gap-3">
                 <span className="text-lg">{l.inst.includes('Drums')?'🥁':l.inst.includes('Piano')?'🎹':l.inst.includes('Theory')?'🎼':'🎤'}</span>
                 <div>
                   <div className="font-bold text-gray-800 text-sm">{l.inst}</div>
                   <div className="text-xs text-gray-600">{l.note}</div>
                 </div>
              </div>
              <span className="font-mono text-amber-700 font-bold bg-amber-100 px-2 py-1 rounded text-xs">{l.dur}m</span>
            </div>
          ))}
          {logs.length === 0 && <div className="text-center text-amber-900/30 py-8 text-sm">No practice logged yet.</div>}
        </div>
      </div>
    </div>
  );
};

const AILabModule = ({ goBack }) => {
  const theme = THEMES.ai;
  const [q, setQ] = useState(''); const [res, setRes] = useState([]); const [load, setLoad] = useState(false);
  const handleSearch = () => { setLoad(true); setTimeout(()=>{ setRes([{title: q+' Summary', summary:'AI Generated content...'}]); setLoad(false); }, 1000); };
  return (
    <div className={`min-h-screen bg-gradient-to-br ${theme.bg} p-6 font-sans`}>
      <Header title="AI Lab" icon={Bot} theme={theme} goBack={goBack} />
      <div className="max-w-3xl mx-auto glass-card p-8 text-center">
        <h2 className="text-2xl font-bold text-gray-800 mb-6">Knowledge Hunter</h2>
        <div className="flex gap-2 mb-8"><input value={q} onChange={e=>setQ(e.target.value)} className="flex-1 p-4 rounded-xl bg-white/50 border-none" placeholder="Research topic..."/><button onClick={handleSearch} disabled={load} className="bg-fuchsia-600 text-white px-6 rounded-xl font-bold">{load?'...':'Go'}</button></div>
        <div className="space-y-4 text-left">{res.map((r,i)=><div key={i} className="bg-white/60 p-4 rounded-xl"><h3 className="font-bold">{r.title}</h3><p className="text-sm text-gray-600">{r.summary}</p></div>)}</div>
      </div>
    </div>
  );
};

// ==========================================
// 🏠 Dashboard
// ==========================================
const Dashboard = ({ setView, xp, level, progress }) => {
  const [logs] = useStorage('lifeos_body_history', []);
  const heatmap = Array.from({length:30}, (_,i) => {
    const d = new Date(); d.setDate(d.getDate()-i); const s = d.toLocaleDateString();
    return { date:s, count: logs.filter(l=>l.date===s).length };
  }).reverse();

  return (
    <div className="min-h-screen bg-slate-50 p-6 relative overflow-hidden font-sans">
      <div className="absolute top-[-100px] left-[-100px] w-96 h-96 bg-blue-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob"></div>
      <div className="max-w-5xl mx-auto relative z-10 mt-10">
        <header className="flex justify-between items-end mb-12">
          <div><h1 className="text-5xl font-black text-gray-900 tracking-tighter mb-2">2026 <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600">Life OS</span></h1><p className="text-gray-500 font-medium">Precision & Growth</p></div>
          <div className="flex items-center gap-4"><DataManager /><div className="glass-card px-5 py-3 flex items-center gap-4 rounded-full"><div className="text-right"><div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Lvl {level}</div><div className="text-sm font-black text-gray-800">{xp} XP</div></div><div className="w-10 h-10 rounded-full bg-gradient-to-tr from-yellow-400 to-orange-500 flex items-center justify-center shadow-lg text-white font-bold"><Trophy size={18}/></div></div></div>
        </header>
        
        <div className="glass-card p-6 mb-8"><div className="flex justify-between items-center mb-4"><h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2"><Zap size={14} className="text-yellow-500"/> Activity Flow</h3></div><div className="flex gap-1.5 overflow-x-auto pb-2">{heatmap.map((d, i) => (<div key={i} title={d.date} className={`w-8 h-12 rounded-lg flex-shrink-0 transition-all ${d.count===0?'bg-gray-100': d.count<2?'bg-blue-200':'bg-blue-600'}`}></div>))}</div></div>
        
        {/* 🆕 Dashboard Grid with Habits */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          <ModuleCard title="Atomic Habits" desc="Daily Checklist." icon={CheckSquare} theme={THEMES.habits} onClick={() => setView('habits')} />
          <ModuleCard title="Body OS" desc="Macros & Deficit." icon={Dumbbell} theme={THEMES.body} onClick={() => setView('body')} />
          <ModuleCard title="Mind Protocol" desc="Thoughts & Audio." icon={Brain} theme={THEMES.mind} onClick={() => setView('mind')} />
          <ModuleCard title="Music Band" desc="Practice & Projects." icon={Music} theme={THEMES.music} onClick={() => setView('music')} />
          <ModuleCard title="AI Lab" desc="Research." icon={Bot} theme={THEMES.ai} onClick={() => setView('ai')} />
        </div>
      </div>
    </div>
  );
};

const Header = ({ title, icon: Icon, theme, goBack }) => (<div className="relative z-10 flex items-center justify-between mb-10 max-w-5xl mx-auto"><button onClick={goBack} className="w-10 h-10 rounded-full bg-white/50 hover:bg-white flex items-center justify-center text-gray-500 transition-all backdrop-blur-sm"><ArrowLeft size={20} /></button><h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2"><Icon className={theme.accent}/> {title}</h1></div>);
const ModuleCard = ({ title, desc, icon: Icon, theme, onClick }) => (<div onClick={onClick} className="glass-card p-8 cursor-pointer group hover:scale-[1.02] transition-all border-l-4" style={{borderLeftColor: theme.bg.split('-')[1]}}><div className="flex justify-between mb-6"><div className={`p-4 rounded-2xl bg-gradient-to-br ${theme.bg} text-gray-700`}><Icon size={28} /></div></div><h3 className="text-2xl font-bold text-gray-800">{title}</h3><p className="text-gray-500">{desc}</p></div>);

function App() {
  const [view, setView] = useState('dashboard');
  const { xp, level, progress, addXP } = useGamification();
  return (
    <>
      <style>{`.glass-card { background: rgba(255, 255, 255, 0.65); backdrop-filter: blur(20px); border: 1px solid rgba(255, 255, 255, 0.5); border-radius: 24px; box-shadow: 0 8px 32px 0 rgba(31, 38, 135, 0.07); } .no-scrollbar::-webkit-scrollbar { display: none; } .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; } .animate-fade-in { animation: fadeIn 0.6s ease-out; } @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }`}</style>
      {view === 'dashboard' && <Dashboard setView={setView} xp={xp} level={level} progress={progress} />}
      {/* 🆕 路由新增 */}
      {view === 'habits' && <HabitsModule goBack={()=>setView('dashboard')} addXP={addXP} />}
      {view === 'body' && <BodyModule goBack={()=>setView('dashboard')} addXP={addXP} />}
      {view === 'mind' && <MindModule goBack={()=>setView('dashboard')} addXP={addXP} />}
      {view === 'music' && <MusicModule goBack={()=>setView('dashboard')} addXP={addXP} />}
      {view === 'ai' && <AILabModule goBack={()=>setView('dashboard')} />}
    </>
  );
}
export default App;