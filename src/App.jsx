import React, { useState, useEffect, useRef } from 'react';
import { BookOpen, Brain, Mic, Plus, Trash2, CheckCircle, Circle, ChevronDown, ChevronUp, Share2, PenLine, X, Camera, Image as ImageIcon, ListPlus, MinusCircle, AlertCircle, ArrowRight, ShieldAlert, Feather, Music, StopCircle, Play, Pause } from 'lucide-react';
import html2canvas from 'html2canvas';

// --- 配置区域 ---
const CATEGORIES = [
  { id: 'reading', label: '沉下心读书 (Input)', icon: BookOpen, color: 'text-blue-700', bg: 'bg-blue-50', border: 'border-blue-200', ring: 'ring-blue-100', decor: 'text-blue-200' },
  { id: 'reflection', label: '直面弱点 (Fix)', icon: ShieldAlert, color: 'text-rose-700', bg: 'bg-rose-50', border: 'border-rose-200', ring: 'ring-rose-100', decor: 'text-rose-200' },
  { id: 'logic', label: '逻辑表达 (Output)', icon: Brain, color: 'text-emerald-700', bg: 'bg-emerald-50', border: 'border-emerald-200', ring: 'ring-emerald-100', decor: 'text-emerald-200' },
  { id: 'music', label: '音乐灵感 (Muse)', icon: Music, color: 'text-amber-700', bg: 'bg-amber-50', border: 'border-amber-200', ring: 'ring-amber-100', decor: 'text-amber-200' }
];

// 辅助：高亮渲染
const renderWithHighlights = (text) => {
  if (!text) return <span className="text-slate-400 italic text-sm">点击此处开始记录...</span>;
  const parts = text.split(/(\*\*.*?\*\*)/g);
  return parts.map((part, index) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return <mark key={index} className="bg-yellow-100/80 text-slate-900 rounded-sm px-1 mx-0.5 font-medium shadow-sm" style={{boxDecorationBreak: 'clone'}}>{part.slice(2, -2)}</mark>;
    }
    return part;
  });
};

// 装饰角标
const CornerDecor = ({ className }) => (
  <svg className={`absolute w-16 h-16 pointer-events-none opacity-50 ${className}`} viewBox="0 0 100 100" fill="currentColor">
    <path d="M0,0 C30,0 50,20 50,50 C50,80 80,100 100,100 L0,100 Z" fill="none" stroke="currentColor" strokeWidth="2"/>
    <path d="M10,10 C35,10 55,30 55,55 C55,80 75,100 100,100" fill="none" stroke="currentColor" strokeWidth="1" opacity="0.6"/>
    <circle cx="15" cy="15" r="3" />
    <circle cx="35" cy="8" r="2" />
    <circle cx="8" cy="35" r="2" />
  </svg>
);

export default function GoalTrackerV8() {
  const [goals, setGoals] = useState([]);
  const [input, setInput] = useState('');
  const [selectedCategory, setSelectedCategory] = useState(CATEGORIES[0].id);
  const [expandedId, setExpandedId] = useState(null);
  const [isCapturing, setIsCapturing] = useState(false);
  
  // 录音相关状态
  const [recordingId, setRecordingId] = useState(null); // 当前正在录音的目标ID
  const [playingId, setPlayingId] = useState(null);     // 当前正在播放的目标ID
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const audioRef = useRef(new Audio());
  const fileInputRef = useRef(null);

  // 初始化
  useEffect(() => {
    const saved = localStorage.getItem('2026-goals-v8'); 
    if (saved) {
        setGoals(JSON.parse(saved));
    } else {
        const old = localStorage.getItem('2026-goals-v7');
        if (old) setGoals(JSON.parse(old));
    }
    
    // 播放结束监听
    audioRef.current.onended = () => setPlayingId(null);
  }, []);

  useEffect(() => {
    localStorage.setItem('2026-goals-v8', JSON.stringify(goals));
  }, [goals]);

  const addGoal = () => {
    if (!input.trim()) return;
    const newGoal = {
      id: Date.now(),
      text: input,
      category: selectedCategory,
      completed: false,
      createdAt: new Date().toLocaleDateString(),
      excerpt: '', thoughts: '',
      logicBullets: [''], logicImage: null,
      reflectionTrigger: '', reflectionBug: '', reflectionFix: '',
      musicImage: null, musicAudio: null, // V8 新增字段
      isEditing: false
    };
    setGoals([newGoal, ...goals]);
    setInput('');
  };

  const toggleGoal = (id) => setGoals(goals.map(g => g.id === id ? { ...g, completed: !g.completed } : g));
  const deleteGoal = (id) => setGoals(goals.filter(g => g.id !== id));
  const updateDetails = (id, field, value) => setGoals(goals.map(g => g.id === id ? { ...g, [field]: value } : g));
  const toggleEditMode = (id) => setGoals(goals.map(g => g.id === id ? { ...g, isEditing: !g.isEditing } : g));

  // Logic Operations
  const updateBullet = (goalId, index, value) => setGoals(goals.map(g => g.id === goalId ? { ...g, logicBullets: g.logicBullets.map((b, i) => i === index ? value : b) } : g));
  const addBullet = (goalId) => setGoals(goals.map(g => g.id === goalId ? { ...g, logicBullets: [...g.logicBullets, ''] } : g));
  const removeBullet = (goalId, index) => setGoals(goals.map(g => g.id === goalId && g.logicBullets.length > 1 ? { ...g, logicBullets: g.logicBullets.filter((_, i) => i !== index) } : g));

  // Image Upload
  const handleImageUpload = (e, goalId, field = 'logicImage') => {
      const file = e.target.files[0];
      if (!file || file.size > 1024 * 1024 * 2) { alert("请上传小于 2MB 的图片"); return; }
      const reader = new FileReader();
      reader.onloadend = () => updateDetails(goalId, field, reader.result);
      reader.readAsDataURL(file);
  };

  // --- Audio Recording Logic ---
  const startRecording = async (goalId) => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorderRef.current = new MediaRecorder(stream);
      audioChunksRef.current = [];

      mediaRecorderRef.current.ondataavailable = (event) => {
        if (event.data.size > 0) audioChunksRef.current.push(event.data);
      };

      mediaRecorderRef.current.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/mp3' }); // 或 audio/webm
        const reader = new FileReader();
        reader.onloadend = () => {
            // 存为 Base64
            updateDetails(goalId, 'musicAudio', reader.result);
        };
        reader.readAsDataURL(audioBlob);
        // 停止所有轨道
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorderRef.current.start();
      setRecordingId(goalId);
    } catch (err) {
      console.error("Error accessing microphone:", err);
      alert("无法访问麦克风，请检查浏览器权限。");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && recordingId) {
      mediaRecorderRef.current.stop();
      setRecordingId(null);
    }
  };

  const togglePlay = (audioSrc, goalId) => {
      if (playingId === goalId) {
          audioRef.current.pause();
          setPlayingId(null);
      } else {
          audioRef.current.src = audioSrc;
          audioRef.current.play();
          setPlayingId(goalId);
      }
  };

  // Screenshot Logic
  const handleScreenshot = async (goal) => {
    if (goal.isEditing) toggleEditMode(goal.id);
    setTimeout(async () => {
        const element = document.getElementById(`goal-card-${goal.id}`);
        if (!element) return;
        setIsCapturing(true);
        try {
          const canvas = await html2canvas(element, { scale: 3, useCORS: true, backgroundColor: null, ignoreElements: (node) => node.classList.contains('no-screenshot') });
          const link = document.createElement('a');
          link.href = canvas.toDataURL("image/png");
          link.download = `2026-entry-${goal.category}-${goal.id}.png`;
          link.click();
        } catch (err) { console.error(err); alert("截图失败"); } finally { setIsCapturing(false); }
    }, 200);
  };

  const copyText = (goal) => {
      const cat = CATEGORIES.find(c => c.id === goal.category);
      let content = `【${cat.label.split(' ')[0]}】${goal.text}\n\n`;
      if (goal.category === 'reflection') content += `🔴 情境：${goal.reflectionTrigger}\n🔍 弱点：${goal.reflectionBug}\n✨ 修正：${goal.reflectionFix}`;
      else if (goal.category === 'logic') content += `📋 论点：\n${goal.logicBullets.map(b=>'• '+b).join('\n')}\n📝 脚本：${goal.thoughts}`;
      else if (goal.category === 'music') content += `🎵 灵感笔记：${goal.thoughts}`;
      else content += `📖 书摘：${goal.excerpt.replace(/\*\*/g, '')}\n💡 想法：${goal.thoughts}`;
      content += `\n\n#2026SelfMastery`;
      navigator.clipboard.writeText(content).then(() => alert('文本已复制！'));
  }

  const progress = goals.length === 0 ? 0 : Math.round((goals.filter(g => g.completed).length / goals.length) * 100);

  // --- Renderers ---
  const EditButton = ({ goal }) => (
    <div className="flex justify-end no-screenshot">
        <button onClick={() => toggleEditMode(goal.id)} className="text-xs flex items-center gap-1 px-3 py-1 rounded-full bg-white/50 border border-slate-200 text-slate-600 hover:bg-white transition-colors shadow-sm">
            {goal.isEditing ? <><X size={12}/> 完成</> : <><PenLine size={12}/> 编辑</>}
        </button>
    </div>
  );

  const renderReadingContent = (goal, cat) => (
    <div className="flex flex-col gap-6 relative z-10">
       <EditButton goal={goal} />
       <div className="relative group">
            <label className={`flex items-center gap-2 text-xs font-bold ${cat.color} uppercase tracking-wider mb-2`}><BookOpen size={14}/> 书摘 / 核心事实</label>
            <div className={`relative min-h-[120px] rounded-lg border ${cat.border} overflow-hidden transition-all ${goal.isEditing ? `bg-white ring-2 ${cat.ring}` : 'bg-[#fffdf9]'}`} style={{backgroundImage: goal.isEditing ? 'none' : 'url("https://www.transparenttextures.com/patterns/cream-paper.png")'}}>
                {goal.isEditing ? <textarea value={goal.excerpt} onChange={(e) => updateDetails(goal.id, 'excerpt', e.target.value)} className="w-full h-full min-h-[120px] p-6 text-base font-serif bg-transparent focus:outline-none resize-none placeholder:text-slate-300" placeholder="输入书摘 (支持 **高亮**)..." /> : <div className="p-6 h-full w-full text-base font-serif leading-relaxed text-slate-800 whitespace-pre-wrap">{renderWithHighlights(goal.excerpt)}</div>}
            </div>
       </div>
       <div className="relative">
            <label className={`flex items-center gap-2 text-xs font-bold ${cat.color} uppercase tracking-wider mb-2`}><Brain size={14}/> 我的思考</label>
            {goal.isEditing ? <textarea value={goal.thoughts} onChange={(e) => updateDetails(goal.id, 'thoughts', e.target.value)} className={`w-full h-32 p-4 text-sm bg-white/80 border ${cat.border} rounded-lg focus:outline-none focus:ring-2 ${cat.ring} resize-none`} placeholder="输入思考..." /> : <div className={`p-5 bg-${cat.bg.split('-')[1]}-50/60 border ${cat.border} rounded-lg text-sm text-slate-700 leading-relaxed whitespace-pre-wrap min-h-[60px] shadow-sm`}>{goal.thoughts || "暂无思考"}</div>}
       </div>
    </div>
  );

  const renderReflectionContent = (goal, cat) => (
    <div className="flex flex-col gap-5 relative z-10">
        <EditButton goal={goal} />
       <div className={`grid gap-4 bg-white/60 p-6 rounded-xl border ${cat.border} shadow-sm`}>
           <div><label className="flex items-center gap-2 text-xs font-bold text-slate-500 uppercase tracking-wider mb-2"><AlertCircle size={14} /> 触发情境</label>{goal.isEditing ? <input type="text" value={goal.reflectionTrigger} onChange={(e) => updateDetails(goal.id, 'reflectionTrigger', e.target.value)} className={`w-full p-2 text-sm border ${cat.border} rounded focus:outline-none focus:ring-1 ${cat.ring} bg-white/80`} placeholder="发生了什么..." /> : <div className="text-slate-800 font-medium pl-1">{goal.reflectionTrigger || "..."}</div>}</div>
           <div className={`border-t ${cat.border} my-1 opacity-50`}></div>
           <div><label className={`flex items-center gap-2 text-xs font-bold ${cat.color} uppercase tracking-wider mb-2`}><Brain size={14} /> 暴露的弱点</label>{goal.isEditing ? <textarea value={goal.reflectionBug} onChange={(e) => updateDetails(goal.id, 'reflectionBug', e.target.value)} className={`w-full p-2 text-sm border ${cat.border} rounded focus:outline-none focus:ring-1 ${cat.ring} h-20 resize-none bg-white/80`} placeholder="深挖根源..." /> : <div className={`text-${cat.color.split('-')[1]}-800 bg-${cat.bg.split('-')[1]}-100/50 p-3 rounded-lg text-sm leading-relaxed font-medium`}>{goal.reflectionBug || "..."}</div>}</div>
           <div><label className={`flex items-center gap-2 text-xs font-bold text-emerald-600 uppercase tracking-wider mb-2`}><CheckCircle size={14} /> 修正原则</label>{goal.isEditing ? <textarea value={goal.reflectionFix} onChange={(e) => updateDetails(goal.id, 'reflectionFix', e.target.value)} className={`w-full p-2 text-sm border ${cat.border} rounded focus:outline-none focus:ring-1 ${cat.ring} h-20 resize-none bg-white/80`} placeholder="下次怎么做..." /> : <div className="flex items-start gap-2 text-slate-700 text-sm pl-1"><ArrowRight size={16} className="text-emerald-500 mt-0.5 shrink-0" /><div className="leading-relaxed font-medium">{goal.reflectionFix || "..."}</div></div>}</div>
       </div>
    </div>
  );

  const renderLogicContent = (goal, cat) => (
    <div className="flex flex-col gap-6 relative z-10">
        <EditButton goal={goal} />
        <div className="grid md:grid-cols-2 gap-6">
            <div><label className={`flex items-center gap-2 text-xs font-bold ${cat.color} uppercase tracking-wider mb-3`}><ImageIcon size={14}/> 可视化证据</label>
                <div className={`relative rounded-xl overflow-hidden border-2 shadow-sm bg-white ${goal.isEditing ? `border-dashed ${cat.border} cursor-pointer hover:bg-${cat.bg}` : 'border-white'}`} onClick={() => goal.isEditing && fileInputRef.current?.click()}>
                    {goal.logicImage ? <img src={goal.logicImage} alt="Logic" className="w-full h-auto object-cover rounded-lg" /> : <div className="min-h-[150px] flex items-center justify-center text-slate-400 text-sm italic">{goal.isEditing ? "点击上传图片" : "无图片"}</div>}
                    {goal.isEditing && <input type="file" accept="image/*" ref={fileInputRef} onChange={(e) => handleImageUpload(e, goal.id, 'logicImage')} className="hidden" />}
                    {goal.isEditing && goal.logicImage && <button onClick={(e)=>{e.stopPropagation();updateDetails(goal.id, 'logicImage', null)}} className="absolute top-2 right-2 bg-white/80 p-1 rounded-full text-red-500 shadow-sm"><Trash2 size={12}/></button>}
                </div>
            </div>
            <div><label className={`flex items-center gap-2 text-xs font-bold ${cat.color} uppercase tracking-wider mb-3`}><ListPlus size={14}/> 逻辑骨架</label>
                <div className={`space-y-2 bg-white/60 p-4 rounded-xl border ${cat.border} shadow-sm`}>{goal.logicBullets.map((bullet, index) => (<div key={index} className="flex items-start gap-2"><Circle size={6} className={`${cat.color} shrink-0 mt-2 fill-current opacity-60`} />{goal.isEditing ? (<div className="flex-1 flex gap-2"><input type="text" value={bullet} onChange={(e) => updateBullet(goal.id, index, e.target.value)} className={`flex-1 text-sm bg-transparent border-b ${cat.border} focus:border-${cat.color.split('-')[1]}-400 focus:outline-none py-1`} placeholder="论点..." onKeyDown={(e) => e.key === 'Enter' && addBullet(goal.id)} /><button onClick={()=>removeBullet(goal.id, index)} className="text-slate-300 hover:text-red-400"><MinusCircle size={14}/></button></div>) : ( <span className="text-sm text-slate-700 leading-relaxed py-0.5 font-medium">{bullet}</span> )}</div>))}{goal.isEditing && <button onClick={() => addBullet(goal.id)} className={`text-xs ${cat.color} font-medium mt-2 opacity-80 hover:opacity-100`}>+ 添加论点</button>}</div>
            </div>
        </div>
        <div className="relative"><label className={`flex items-center gap-2 text-xs font-bold ${cat.color} uppercase tracking-wider mb-2`}><Mic size={14}/> 表达脚本</label>{goal.isEditing ? <textarea value={goal.thoughts} onChange={(e) => updateDetails(goal.id, 'thoughts', e.target.value)} className={`w-full h-32 p-4 text-sm bg-white/80 border ${cat.border} rounded-lg focus:outline-none focus:ring-2 ${cat.ring} resize-none`} placeholder="撰写脚本..." /> : <div className={`p-5 bg-${cat.bg.split('-')[1]}-50/60 border ${cat.border} rounded-lg text-sm text-slate-700 leading-relaxed whitespace-pre-wrap shadow-sm`}>{goal.thoughts || "暂无脚本"}</div>}</div>
    </div>
  );

  const renderMusicContent = (goal, cat) => (
    <div className="flex flex-col gap-6 relative z-10">
        <EditButton goal={goal} />
        
        {/* 1. Visual Inspiration (Cover/Score) */}
        <div>
            <label className={`flex items-center gap-2 text-xs font-bold ${cat.color} uppercase tracking-wider mb-3`}><ImageIcon size={14}/> 视觉灵感 / 乐谱 / 封面</label>
            <div className={`relative rounded-xl overflow-hidden border-2 shadow-sm bg-white ${goal.isEditing ? `border-dashed ${cat.border} cursor-pointer hover:bg-${cat.bg}` : 'border-white'}`} onClick={() => goal.isEditing && fileInputRef.current?.click()}>
                {goal.musicImage ? <img src={goal.musicImage} alt="Music Score" className="w-full h-auto object-cover rounded-lg" /> : <div className="min-h-[120px] flex items-center justify-center text-slate-400 text-sm italic">{goal.isEditing ? "上传乐谱或封面" : "暂无图片"}</div>}
                {goal.isEditing && <input type="file" accept="image/*" ref={fileInputRef} onChange={(e) => handleImageUpload(e, goal.id, 'musicImage')} className="hidden" />}
                {goal.isEditing && goal.musicImage && <button onClick={(e)=>{e.stopPropagation();updateDetails(goal.id, 'musicImage', null)}} className="absolute top-2 right-2 bg-white/80 p-1 rounded-full text-red-500 shadow-sm"><Trash2 size={12}/></button>}
            </div>
        </div>

        {/* 2. Audio Recorder (Voice Memo) */}
        <div>
             <label className={`flex items-center gap-2 text-xs font-bold ${cat.color} uppercase tracking-wider mb-3`}><Mic size={14}/> 哼唱 / 动机记录 (Voice Memo)</label>
             <div className={`flex items-center gap-4 p-4 rounded-xl border ${cat.border} bg-white/60`}>
                 {/* Recording Controls */}
                 {goal.isEditing ? (
                     <div className="flex items-center gap-3">
                         {recordingId === goal.id ? (
                             <button onClick={stopRecording} className="flex items-center gap-2 px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-full text-xs font-bold animate-pulse transition-colors"><StopCircle size={16}/> 停止录音</button>
                         ) : (
                             <button onClick={() => startRecording(goal.id)} className={`flex items-center gap-2 px-4 py-2 ${goal.musicAudio ? 'bg-slate-100 text-slate-600' : 'bg-amber-500 text-white'} hover:bg-amber-600 rounded-full text-xs font-bold transition-colors`}><Mic size={16}/> {goal.musicAudio ? '重新录制' : '开始录音'}</button>
                         )}
                         {goal.musicAudio && <button onClick={() => updateDetails(goal.id, 'musicAudio', null)} className="p-2 text-slate-400 hover:text-red-500"><Trash2 size={16}/></button>}
                     </div>
                 ) : null}

                 {/* Playback UI */}
                 {goal.musicAudio ? (
                     <div className="flex-1 flex items-center gap-3">
                         <button onClick={() => togglePlay(goal.musicAudio, goal.id)} className={`p-3 rounded-full ${playingId === goal.id ? 'bg-amber-500 text-white' : 'bg-white text-amber-500 border border-amber-200'} shadow-sm hover:shadow-md transition-all`}>
                             {playingId === goal.id ? <Pause size={18} fill="currentColor" /> : <Play size={18} fill="currentColor" className="ml-1"/>}
                         </button>
                         <div className="flex-1">
                             <div className="h-8 w-full bg-amber-100/50 rounded flex items-center justify-center overflow-hidden gap-0.5">
                                 {/* Fake waveform visualization */}
                                 {[...Array(20)].map((_,i) => (
                                     <div key={i} className="w-1 bg-amber-300 rounded-full animate-pulse" style={{height: `${Math.random() * 100}%`, animationDuration: `${Math.random() * 1 + 0.5}s`}}></div>
                                 ))}
                             </div>
                         </div>
                     </div>
                 ) : (
                     !goal.isEditing && <div className="text-sm text-slate-400 italic">暂无录音</div>
                 )}
             </div>
        </div>

        {/* 3. Lyrics/Notes */}
        <div className="relative">
             <label className={`flex items-center gap-2 text-xs font-bold ${cat.color} uppercase tracking-wider mb-2`}><PenLine size={14}/> 歌词 / 备注</label>
             {goal.isEditing ? (
                 <textarea value={goal.thoughts} onChange={(e) => updateDetails(goal.id, 'thoughts', e.target.value)}
                 className={`w-full h-32 p-4 text-sm bg-white/80 border ${cat.border} rounded-lg focus:outline-none focus:ring-2 ${cat.ring} resize-none`} placeholder="输入歌词或和弦..." />
             ) : (
                 <div className={`p-5 bg-${cat.bg.split('-')[1]}-50/60 border ${cat.border} rounded-lg text-sm text-slate-700 leading-relaxed whitespace-pre-wrap shadow-sm`}>{goal.thoughts || "暂无备注"}</div>
             )}
        </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#f5f7fa] p-4 md:p-8 font-sans text-slate-800 antialiased relative">
      <div className="fixed inset-0 bg-[url('https://www.transparenttextures.com/patterns/cream-paper.png')] opacity-50 pointer-events-none"></div>
      <div className="max-w-3xl mx-auto relative z-10">
        {/* Header */}
        <div className="mb-8 text-center relative">
             <Feather className="mx-auto text-slate-300 mb-2 opacity-50" size={32} />
             <h1 className="text-3xl font-serif font-bold tracking-tight text-slate-800">2026 Self-Mastery Protocol</h1>
             <div className="flex items-center justify-center gap-3 mt-3 text-sm text-slate-500 font-medium uppercase tracking-widest"><span>Deep Reading</span> • <span>Radical Truth</span> • <span>Clear Logic</span> • <span>Music Muse</span></div>
             <div className="mt-6 max-w-xs mx-auto h-1 bg-slate-200 rounded-full overflow-hidden"><div className="h-full bg-gradient-to-r from-blue-400 via-rose-400 to-amber-500 transition-all duration-500" style={{ width: `${progress}%` }} /></div>
             <p className="text-xs text-slate-400 mt-2">Yearly Progress: {progress}%</p>
        </div>

        {/* Input */}
        <div className="bg-white/80 backdrop-blur-md rounded-2xl shadow-lg border border-slate-200/60 p-6 mb-8 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500/20 via-rose-500/20 to-amber-500/20"></div>
          <div className="flex flex-col gap-4">
            <div className="relative"><input type="text" value={input} onChange={(e) => setInput(e.target.value)} onKeyPress={(e) => e.key === 'Enter' && addGoal()} placeholder="What's on your mind for 2026?" className="w-full p-4 pl-12 rounded-xl border border-slate-200 bg-white/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-slate-900/10 shadow-sm transition-all font-medium placeholder:text-slate-400 placeholder:font-serif italic"/><Feather className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} /></div>
            <div className="flex flex-wrap gap-2 justify-center sm:justify-start">{CATEGORIES.map(cat => (<button key={cat.id} onClick={() => setSelectedCategory(cat.id)} className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-bold transition-all border ${selectedCategory === cat.id ? `bg-white ${cat.color} ${cat.border} shadow-md scale-105 ring-2 ${cat.ring}` : `bg-white/50 text-slate-500 border-slate-200 hover:bg-white hover:text-slate-700`}`}><cat.icon size={14} strokeWidth={2.5} />{cat.label.split(' ')[0]}</button>))}</div>
            <button onClick={addGoal} className="w-full bg-slate-800 hover:bg-slate-700 text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2 shadow-md transition-all active:scale-[0.98]"><Plus size={18} strokeWidth={2.5} /> Begin New Entry</button>
          </div>
        </div>

        {/* List */}
        <div className="min-h-[500px] space-y-8">
          {goals.length === 0 ? <div className="text-center py-20 text-slate-400 italic font-serif"><p className="text-xl">"Music is the silence between the notes."</p><p className="text-sm mt-2 opacity-60">- Debussy</p></div> : (
            <ul className="space-y-8">
              {goals.map(goal => {
                const cat = CATEGORIES.find(c => c.id === goal.category);
                const isExpanded = expandedId === goal.id;
                return (
                  <li key={goal.id} id={`goal-card-${goal.id}`} className={`relative transition-all duration-500 group rounded-2xl ${isExpanded ? `shadow-xl scale-[1.02] bg-[#fdfcf8] ${cat.ring.replace('ring-','ring-offset-4 ring-')}` : 'shadow hover:shadow-md bg-white/80 hover:bg-white border border-white'}`}>
                    <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cream-paper.png')] opacity-30 rounded-2xl pointer-events-none"></div>
                    {isExpanded && <div className={`absolute inset-2 border-[3px] ${cat.border} rounded-xl pointer-events-none opacity-30`}></div>}
                    {isExpanded && <CornerDecor className={`top-0 left-0 ${cat.decor}`} />}
                    {isExpanded && <CornerDecor className={`bottom-0 right-0 rotate-180 ${cat.decor}`} />}
                    <div className="relative z-10 p-1">
                        <div className={`flex items-center p-5 cursor-pointer select-none rounded-xl transition-colors ${isExpanded ? 'bg-transparent' : ''}`} onClick={() => setExpandedId(isExpanded ? null : goal.id)}>
                            <button onClick={(e) => { e.stopPropagation(); toggleGoal(goal.id); }} className={`mr-5 transition-colors ${goal.completed ? 'text-slate-300' : `${cat.color} opacity-60 hover:opacity-100`}`}>{goal.completed ? <CheckCircle size={28} weight="fill" /> : <Circle size={28} />}</button>
                            <div className="flex-1"><div className="flex items-center justify-between"><span className={`font-bold text-xl font-serif ${goal.completed ? 'line-through text-slate-400' : 'text-slate-800'}`}>{goal.text}</span>{isExpanded ? <ChevronUp size={20} className="text-slate-400" /> : <ChevronDown size={20} className="text-slate-400" />}</div><div className="flex items-center gap-3 mt-2"><span className={`inline-flex items-center gap-1 text-xs font-bold px-3 py-1 rounded-full border ${cat.bg} ${cat.color} ${cat.border}`}>{cat.label.split(' ')[0]}</span><span className="text-xs font-medium text-slate-400 font-serif italic">{goal.createdAt}</span></div></div>
                        </div>
                        {isExpanded && (
                        <div className="px-6 pb-8 pt-2 animate-in slide-in-from-top-2 duration-300">
                            <div className={`border-t-2 ${cat.border} border-dashed my-6 opacity-30`}></div>
                            <div className="bg-white/60 backdrop-blur-sm rounded-xl p-6 shadow-sm border border-white/50 relative overflow-hidden">
                                <div className={`absolute top-0 inset-x-0 h-1 bg-${cat.bg.split('-')[1]}-200 opacity-50`}></div>
                                {goal.category === 'music' ? renderMusicContent(goal, cat) : goal.category === 'logic' ? renderLogicContent(goal, cat) : goal.category === 'reflection' ? renderReflectionContent(goal, cat) : renderReadingContent(goal, cat)}
                            </div>
                            <div className="mt-8 pt-4 flex justify-between items-center text-xs text-slate-400 font-serif italic relative z-10"><div className="flex items-center gap-2"><Feather size={12} className={cat.color}/> <span>2026 Self-Mastery Protocol</span></div><span className="uppercase tracking-widest opacity-60">{cat.label.split(' ')[0]} LOG</span></div>
                            <div className="no-screenshot flex items-center justify-between mt-6 pt-4 border-t border-slate-200/50 relative z-10">
                            <button onClick={(e) => { e.stopPropagation(); deleteGoal(goal.id); }} className="text-slate-400 hover:text-red-500 text-sm font-medium flex items-center gap-1.5 px-3 py-2 rounded-lg hover:bg-red-50/50 transition-colors"><Trash2 size={16} /> 删除</button>
                            <div className="flex gap-3"><button onClick={() => copyText(goal)} className="px-4 py-2 text-sm font-bold text-slate-600 hover:bg-white border border-slate-200 rounded-lg transition-all flex items-center gap-2 shadow-sm hover:shadow-md"><Share2 size={16} /> 复制文本</button><button onClick={() => handleScreenshot(goal)} disabled={isCapturing} className={`px-5 py-2 text-sm font-bold text-white rounded-lg transition-all flex items-center gap-2 shadow-md hover:shadow-lg active:scale-95 disabled:opacity-50 bg-gradient-to-r ${cat.color === 'text-blue-700' ? 'from-blue-600 to-indigo-600' : cat.color === 'text-rose-700' ? 'from-rose-500 to-pink-600' : cat.color === 'text-amber-700' ? 'from-amber-500 to-orange-600' : 'from-emerald-500 to-teal-600'}`}>{isCapturing ? '生成中...' : <><Camera size={16} /> 保存手账卡片</>}</button></div>
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