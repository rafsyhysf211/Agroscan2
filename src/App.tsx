import React, { useState, useRef, useEffect } from 'react';
import { 
  Camera, 
  Upload, 
  Sprout, 
  Calendar, 
  MessageSquare, 
  Info, 
  CheckCircle2, 
  XCircle, 
  AlertTriangle,
  ThumbsUp,
  Frown,
  Loader2,
  Trash2,
  Send,
  Leaf,
  Plus,
  Clock,
  Droplets,
  Scissors
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import ReactMarkdown from 'react-markdown';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';
import { cn } from './lib/utils';
import { detectPlantHealth, chatWithAI, type DetectionResult } from './services/geminiService';
import { type PlantTask, type SavedDetection } from './types';

// --- Sub-components ---

const Header = ({ activeTab, setActiveTab }: { activeTab: string, setActiveTab: (t: string) => void }) => (
  <nav className="flex items-center justify-between px-4 md:px-8 py-4 bg-white border-b border-emerald-100 shrink-0 sticky top-0 z-50">
    <div className="flex items-center gap-3">
      <div className="w-10 h-10 bg-emerald-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-emerald-100">
        <Leaf size={24} />
      </div>
      <span className="text-xl font-bold tracking-tight text-emerald-900 font-serif">Sobat Tani AI</span>
    </div>
    <div className="hidden md:flex gap-6 items-center text-sm font-medium">
      {[
        { id: 'detect', label: 'Deteksi' },
        { id: 'tracker', label: 'Jadwal Tanam' },
        { id: 'knowledge', label: 'Penyakit & Obat' },
      ].map((item) => (
        <button
          key={item.id}
          onClick={() => setActiveTab(item.id)}
          className={cn(
            "transition-colors pb-1 border-b-2 hover:text-emerald-600",
            activeTab === item.id 
              ? "text-emerald-700 border-emerald-600" 
              : "text-slate-500 border-transparent hover:border-emerald-200"
          )}
          id={`nav-${item.id}`}
        >
          {item.label}
        </button>
      ))}
      <button className="px-4 py-2 bg-emerald-100 text-emerald-700 rounded-lg hover:bg-emerald-200 transition-colors font-semibold">
        Petani Ahli
      </button>
    </div>
  </nav>
);

const TargetIcon = (props: any) => <Camera {...props} />;

export default function App() {
  const [activeTab, setActiveTab] = useState('detect');
  const [detections, setDetections] = useState<SavedDetection[]>([]);
  const [tasks, setTasks] = useState<PlantTask[]>([]);
  const [isCapturing, setIsCapturing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [chatMessages, setChatMessages] = useState<{ role: 'user' | 'model', text: string }[]>([]);
  const [chatInput, setChatInput] = useState('');
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load data from localStorage
  useEffect(() => {
    const savedDetections = localStorage.getItem('plant_detections');
    const savedTasks = localStorage.getItem('plant_tasks');
    if (savedDetections) setDetections(JSON.parse(savedDetections));
    if (savedTasks) setTasks(JSON.parse(savedTasks));
  }, []);

  // Save data to localStorage
  useEffect(() => {
    localStorage.setItem('plant_detections', JSON.stringify(detections));
  }, [detections]);

  useEffect(() => {
    localStorage.setItem('plant_tasks', JSON.stringify(tasks));
  }, [tasks]);

  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      setSelectedImage(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const performDetection = async () => {
    if (!selectedImage) return;

    setIsLoading(true);
    try {
      const result = await detectPlantHealth(selectedImage);
      
      const newDetection: SavedDetection = {
        id: Math.random().toString(36).substr(2, 9),
        timestamp: Date.now(),
        imageUrl: selectedImage,
        result: result
      };
      
      setDetections([newDetection, ...detections]);
      setSelectedImage(null);
      setIsLoading(false);
      
      // Scroll to result
      setTimeout(() => {
        const historySection = document.getElementById('history-section');
        historySection?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    } catch (error) {
      console.error(error);
      alert("Gagal menganalisis gambar. Silakan coba lagi.");
      setIsLoading(false);
    }
  };

  const handleChat = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim()) return;

    const userMsg = chatInput;
    setChatInput('');
    setChatMessages(prev => [...prev, { role: 'user', text: userMsg }]);

    try {
      const history = chatMessages.map(m => ({
        role: m.role,
        parts: [{ text: m.text }]
      }));
      const aiResponse = await chatWithAI(userMsg, history);
      setChatMessages(prev => [...prev, { role: 'model', text: aiResponse || 'Maaf, saya tidak dapat menjawab saat ini.' }]);
    } catch (error) {
      console.error(error);
      setChatMessages(prev => [...prev, { role: 'model', text: 'Terjadi kesalahan koneksi. Silakan coba lagi.' }]);
    }
  };

  const addTask = (title: string, type: PlantTask['type']) => {
    const newTask: PlantTask = {
      id: Math.random().toString(36).substr(2, 9),
      title,
      type,
      date: format(new Date(), 'yyyy-MM-dd'),
      isCompleted: false
    };
    setTasks([newTask, ...tasks]);
  };

  const toggleTask = (id: string) => {
    setTasks(tasks.map(t => t.id === id ? { ...t, isCompleted: !t.isCompleted } : t));
  };

  return (
    <div className="flex flex-col min-h-screen bg-[#F4F7F2] font-sans text-slate-800">
      <Header activeTab={activeTab} setActiveTab={setActiveTab} />
      
      <main className="flex-1 flex flex-col md:flex-row gap-6 p-4 md:p-6 max-w-7xl mx-auto w-full">
        {/* Left Column: Detection & Results */}
        <div className="flex-[1.8] flex flex-col gap-6">
          <AnimatePresence mode="wait">
            {activeTab === 'detect' && (
              <motion.section
                key="detect"
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.98 }}
                className="space-y-6"
              >
                {/* Camera Upload Section */}
                <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200 flex flex-col gap-4">
                  <div className="flex items-center justify-between">
                    <h2 className="text-lg font-bold text-slate-800">Deteksi Kesehatan Tanaman</h2>
                    <span className="text-xs font-semibold px-2 py-1 bg-emerald-50 text-emerald-600 rounded uppercase tracking-wider">AI Aktif</span>
                  </div>
                  
                  <div 
                    onClick={() => fileInputRef.current?.click()}
                    className={cn(
                      "relative aspect-video bg-slate-50 rounded-xl border-2 border-dashed flex flex-col items-center justify-center group transition-colors cursor-pointer overflow-hidden",
                      selectedImage ? "border-emerald-400" : "border-slate-300 hover:border-emerald-400"
                    )}
                  >
                    {selectedImage ? (
                      <img src={selectedImage} className="w-full h-full object-cover" alt="Preview" />
                    ) : (
                      <div className="flex flex-col items-center gap-2 text-slate-400">
                        <Camera size={48} strokeWidth={1.5} />
                        <p className="text-slate-500 font-medium">Klik untuk Ambil Foto atau Upload Gambar</p>
                      </div>
                    )}
                    
                    <input 
                      type="file" 
                      ref={fileInputRef} 
                      onChange={handleFileSelect} 
                      className="hidden" 
                      accept="image/*"
                      capture="environment"
                    />

                    {selectedImage && (
                      <div className="absolute top-4 right-4">
                        <button 
                          onClick={(e) => { e.stopPropagation(); setSelectedImage(null); }}
                          className="bg-white/80 backdrop-blur shadow-sm p-2 rounded-lg text-red-500 hover:bg-white transition-colors"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    )}
                  </div>

                  <button
                    onClick={performDetection}
                    disabled={!selectedImage || isLoading}
                    className={cn(
                      "w-full py-4 rounded-xl font-bold text-lg shadow-lg transition-all flex items-center justify-center gap-2",
                      selectedImage && !isLoading 
                        ? "bg-emerald-600 text-white hover:bg-emerald-700 active:scale-95 shadow-emerald-200" 
                        : "bg-slate-200 text-slate-400 cursor-not-allowed"
                    )}
                  >
                    <Sprout size={24} />
                    Deteksi Tanaman Sekarang!
                  </button>
                </div>

                {isLoading && (
                  <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-12 text-center border border-emerald-100 flex flex-col items-center gap-4">
                    <Loader2 size={40} className="text-emerald-600 animate-spin" />
                    <p className="font-bold text-emerald-900">AI Ahli Tani sedang menganalisis gambar Anda...</p>
                  </div>
                )}

                {/* Results Section */}
                <div id="history-section" className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h2 className="text-lg font-bold text-slate-800">Riwayat Deteksi Terkini</h2>
                    {detections.length > 0 && (
                      <button 
                        onClick={() => confirm('Hapus semua?') && setDetections([])}
                        className="text-xs text-slate-400 hover:text-red-500 flex items-center gap-1"
                      >
                        <Trash2 size={12} /> Hapus Riwayat
                      </button>
                    )}
                  </div>
                  
                  {detections.length === 0 ? (
                    <div className="bg-slate-100/50 border-2 border-dashed border-slate-200 rounded-2xl p-12 text-center">
                      <p className="text-slate-400 text-sm font-medium">Belum ada hasil deteksi.</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {detections.map((item) => (
                        <DetectionCard key={item.id} detection={item} />
                      ))}
                    </div>
                  )}
                </div>
              </motion.section>
            )}

            {activeTab === 'tracker' && (
              <motion.section
                key="tracker"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="space-y-6"
              >
                <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200">
                  <h2 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">
                    <Calendar className="text-emerald-600" /> Jadwal Perawatan Lengkap
                  </h2>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                    {[
                      { label: 'Siram Air', icon: Droplets, color: 'bg-blue-500', type: 'watering' },
                      { label: 'Pupuk', icon: Sprout, color: 'bg-emerald-500', type: 'fertilizing' },
                      { label: 'Pangkas', icon: Scissors, color: 'bg-amber-500', type: 'general' },
                      { label: 'Panen', icon: CheckCircle2, color: 'bg-purple-500', type: 'harvesting' },
                    ].map((btn) => (
                      <button
                        key={btn.label}
                        onClick={() => addTask(btn.label, btn.type as any)}
                        className="bg-slate-50 p-4 rounded-xl border border-slate-100 flex flex-col items-center gap-2 hover:bg-white hover:shadow-md hover:border-emerald-200 transition-all group"
                      >
                        <div className={cn("w-10 h-10 rounded-lg flex items-center justify-center text-white shadow-sm transition-transform group-active:scale-90", btn.color)}>
                          <btn.icon size={20} />
                        </div>
                        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">{btn.label}</span>
                      </button>
                    ))}
                  </div>

                  <div className="space-y-3">
                    <h3 className="text-sm font-bold text-slate-700 flex items-center gap-2">Tugas Berjalan</h3>
                    {tasks.length === 0 ? (
                      <p className="p-8 text-center text-slate-400 text-xs italic">Belum ada jadwal yang direncanakan.</p>
                    ) : (
                      tasks.map(task => (
                        <div 
                          key={task.id} 
                          className={cn(
                            "flex items-center gap-3 p-3 rounded-xl border transition-all",
                            task.isCompleted ? "bg-emerald-50 border-emerald-100 opacity-60" : "bg-white border-slate-100 shadow-sm"
                          )}
                        >
                          <div className={cn(
                            "w-8 h-8 rounded-full flex items-center justify-center text-xs",
                            task.type === 'watering' ? "bg-blue-500 text-white" : 
                            task.type === 'fertilizing' ? "bg-emerald-500 text-white" :
                            "bg-amber-500 text-white"
                          )}>
                            {task.type === 'watering' ? '💧' : task.type === 'fertilizing' ? '🧪' : '✂️'}
                          </div>
                          <div className="flex-1">
                            <p className={cn("text-xs font-bold", task.isCompleted ? "line-through text-emerald-900" : "text-slate-900")}>{task.title}</p>
                            <p className="text-[10px] text-slate-400">{format(new Date(task.date), 'dd MMMM yyyy')}</p>
                          </div>
                          <button 
                            onClick={() => toggleTask(task.id)}
                            className={cn(
                              "w-5 h-5 border-2 rounded-md transition-colors",
                              task.isCompleted ? "bg-emerald-600 border-emerald-600" : "border-slate-300 hover:border-emerald-400"
                            )}
                          />
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </motion.section>
            )}

            {activeTab === 'knowledge' && (
              <motion.section
                key="knowledge"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="space-y-6"
              >
                <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200">
                  <h2 className="text-lg font-bold text-slate-800 mb-6">Penyakit & Obat Terkemuka</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {[
                      { title: 'Antraknosa', desc: 'Bercak hitam pada buah dan daun.', cure: 'Fungisida tembaga.' },
                      { title: 'Hawar Daun', desc: 'Daun tampak terbakar dari ujung.', cure: 'Perbaiki drainase tanah.' },
                      { title: 'Kutu Kebul', desc: 'Serangga putih di balik daun.', cure: 'Insektisida organik (mimba).' },
                      { title: 'Layu Bakteri', desc: 'Tanaman layu mendadak tanpa kering.', cure: 'Sterilisasi tanah.' },
                    ].map((item) => (
                      <div key={item.title} className="p-4 bg-slate-50 rounded-xl border border-slate-100 space-y-2">
                        <h4 className="font-bold text-emerald-900 text-sm italic">{item.title}</h4>
                        <p className="text-[11px] text-slate-500 leading-tight">{item.desc}</p>
                        <p className="text-[10px] font-bold text-emerald-700 bg-emerald-50 inline-block px-2 py-0.5 rounded uppercase">Obat: {item.cure}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </motion.section>
            )}
          </AnimatePresence>
        </div>

        {/* Right Column: Mini-Tracker & Chat */}
        <aside className="flex-[1] flex flex-col gap-6">
          {/* Mini Tracker */}
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-200 shrink-0">
            <h2 className="text-base font-bold text-slate-800 mb-4 flex items-center gap-2">
              <Clock size={18} className="text-emerald-600" /> Agenda Mendatang
            </h2>
            <div className="space-y-3">
              {tasks.filter(t => !t.isCompleted).slice(0, 3).map(task => (
                <div key={task.id} className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl border border-slate-100">
                   <div className="text-xs">📅</div>
                   <div className="flex-1">
                     <p className="text-[11px] font-bold text-slate-900">{task.title}</p>
                     <p className="text-[9px] text-slate-400 capitalize">{task.type}</p>
                   </div>
                </div>
              ))}
              {tasks.filter(t => !t.isCompleted).length === 0 && (
                <p className="text-[10px] text-slate-400 text-center py-4 italic">Tidak ada agenda tertunda.</p>
              )}
            </div>
          </div>

          {/* AI Chat Integrated */}
          <div className="flex-1 flex flex-col bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden min-h-[400px]">
             <div className="p-3 bg-emerald-600 text-white flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 bg-white/20 rounded-full flex items-center justify-center">
                    <MessageSquare size={14} />
                  </div>
                  <span className="text-xs font-bold">Asisten Ahli Tani AI</span>
                </div>
                <div className="w-1.5 h-1.5 bg-emerald-300 rounded-full animate-pulse shadow-[0_0_8px_rgba(110,231,183,0.5)]"></div>
             </div>
             
             <div className="flex-1 p-4 flex flex-col gap-3 overflow-y-auto bg-slate-50">
               {chatMessages.length === 0 ? (
                 <div className="bg-white p-3 rounded-xl rounded-tl-none shadow-sm text-xs text-slate-700 max-w-[85%] self-start">
                   Selamat datang Pak Tani! Saya asisten AI ahli pertanian. Tanya saya soal penyakit, pupuk, atau musim tanam.
                 </div>
               ) : (
                 chatMessages.map((msg, i) => (
                   <div 
                    key={i} 
                    className={cn(
                      "p-3 rounded-xl shadow-sm text-[11px] max-w-[85%]",
                      msg.role === 'user' 
                        ? "bg-emerald-100 text-emerald-900 self-end rounded-tr-none" 
                        : "bg-white text-slate-700 self-start rounded-tl-none prose prose-slate prose-sm"
                    )}
                   >
                     <ReactMarkdown>{msg.text}</ReactMarkdown>
                   </div>
                 ))
               )}
             </div>

             <form onSubmit={handleChat} className="p-3 border-t border-slate-100 flex gap-2">
               <input 
                 value={chatInput}
                 onChange={(e) => setChatInput(e.target.value)}
                 type="text" 
                 placeholder="Ketik pertanyaan..." 
                 className="flex-1 bg-slate-100 border-none rounded-lg px-3 py-2 text-xs focus:ring-1 focus:ring-emerald-500 outline-none"
               />
               <button className="bg-emerald-600 text-white p-2 rounded-lg hover:bg-emerald-700 transition-colors">
                 <Send size={14} />
               </button>
             </form>
          </div>
        </aside>
      </main>

      {/* Footer Info */}
      <footer className="px-4 md:px-8 py-3 bg-white border-t border-slate-200 mt-auto flex flex-col md:flex-row justify-between items-center gap-2 text-[10px] text-slate-400 font-medium">
        <p>© 2026 Sobat Tani AI - Solusi Cerdas Pertanian Modern</p>
        <div className="flex gap-4 items-center">
          <span className="flex items-center gap-1"><Droplets size={10} /> Suhu: 28°C</span>
          <span className="flex items-center gap-1 hover:text-emerald-600 cursor-help transition-colors">Kelembapan: 72%</span>
          <span className="text-emerald-700 font-bold flex items-center gap-1">
            <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full"></div>
            Server: Online
          </span>
        </div>
      </footer>

      {/* Floating Chat for Mobile only */}
      <button
        onClick={() => setIsChatOpen(!isChatOpen)}
        className="md:hidden fixed bottom-20 right-4 w-12 h-12 bg-emerald-600 text-white rounded-full flex items-center justify-center shadow-lg z-40"
      >
        <MessageSquare size={20} />
      </button>

      {/* Bottom Nav for Mobile */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 md:hidden flex items-center justify-around h-16 z-40">
        {[
          { id: 'detect', icon: Camera, label: 'Deteksi' },
          { id: 'tracker', icon: Calendar, label: 'Jadwal' },
          { id: 'knowledge', icon: Info, label: 'Info' },
        ].map((item) => (
          <button
            key={item.id}
            onClick={() => setActiveTab(item.id)}
            className={cn(
              "flex flex-col items-center gap-1",
              activeTab === item.id ? "text-emerald-600 border-t-2 border-emerald-600 pt-1 -mt-[2px]" : "text-slate-400"
            )}
          >
            <item.icon size={18} />
            <span className="text-[10px] font-bold uppercase">{item.label}</span>
          </button>
        ))}
      </nav>
    </div>
  );
}

const DetectionCard = ({ detection }: { detection: SavedDetection }) => {
  const { result, imageUrl, timestamp } = detection;
  
  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className={cn(
        "bg-white rounded-xl p-4 flex flex-col gap-3 shadow-sm border transition-shadow hover:shadow-md",
        result.isHealthy ? "border-emerald-100" : "border-red-100"
      )}
    >
      <div className="flex gap-4">
        <div className={cn(
          "w-24 h-24 rounded-lg overflow-hidden shrink-0",
          result.isHealthy ? "bg-emerald-50" : "bg-red-50"
        )}>
          <img src={imageUrl} alt="Identifikasi" className="w-full h-full object-cover" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex justify-between items-start mb-1 gap-2">
            <h3 className="font-bold text-slate-800 uppercase text-[10px] tracking-tight truncate">
              {result.diseaseName || (result.isHealthy ? 'Tanaman Sehat' : 'Terdeteksi Sakit')}
            </h3>
            <span className="text-lg shrink-0">{result.isHealthy ? '👍' : '☹️'}</span>
          </div>
          <div className={cn(
            "text-2xl font-black mb-1",
            result.isHealthy ? "text-emerald-600" : "text-red-600"
          )}>
            {result.percentage}% <span className="text-[10px] font-normal text-slate-400">{result.isHealthy ? 'Sehat' : 'Terinfeksi'}</span>
          </div>
          <p className="text-[10px] leading-snug text-slate-500 line-clamp-2">{result.explanation}</p>
        </div>
      </div>
      {!result.isHealthy && result.actionSteps.length > 0 && (
        <div className="pt-2 border-t border-red-50">
          <p className="text-[10px] font-bold text-red-700 mb-1">Tindakan Segera:</p>
          <div className="flex flex-wrap gap-2">
            {result.actionSteps.slice(0, 2).map((step, i) => (
              <span key={i} className="text-[9px] bg-red-50 text-red-600 px-2 py-0.5 rounded-full border border-red-100">
                {step}
              </span>
            ))}
          </div>
        </div>
      )}
    </motion.div>
  );
};
