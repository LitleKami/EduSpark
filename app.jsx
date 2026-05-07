```react
import React, { useState, useEffect } from 'react';
import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously, onAuthStateChanged } from 'firebase/auth';
import { getFirestore, collection, addDoc, onSnapshot, query, orderBy } from 'firebase/firestore';
import { 
  BookOpen, Sparkles, Lightbulb, Presentation, 
  FileText, ChevronRight, Loader2, History, Layout 
} from 'lucide-react';

// --- CONFIGURATION ---
// Replace these with your actual Firebase project settings
const firebaseConfig = {
  apiKey: "YOUR_FIREBASE_API_KEY",
  authDomain: "your-app.firebaseapp.com",
  projectId: "your-app",
  storageBucket: "your-app.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abcdef"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

const App = () => {
  const [user, setUser] = useState(null);
  const [activeTab, setActiveTab] = useState('home');
  const [topic, setTopic] = useState('');
  const [level, setLevel] = useState('Key Stage 2 (Year 3-6)');
  const [loading, setLoading] = useState(false);
  const [savedLessons, setSavedLessons] = useState([]);
  const [viewingLesson, setViewingLesson] = useState(null);

  // Authentication Setup
  useEffect(() => {
    signInAnonymously(auth).catch(err => console.error("Auth Error", err));
    const unsubscribe = onAuthStateChanged(auth, (u) => setUser(u));
    return () => unsubscribe();
  }, []);

  // Fetch Saved Lessons
  useEffect(() => {
    if (!user) return;
    const q = query(
      collection(db, 'users', user.uid, 'lessons'),
      orderBy('timestamp', 'desc')
    );
    const unsubscribe = onSnapshot(q, (snap) => {
      setSavedLessons(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
    return () => unsubscribe();
  }, [user]);

  const handleGenerate = async () => {
    if (!topic.trim()) return;
    setLoading(true);

    try {
      // Note: In production, call your Python backend instead of Gemini directly for security
      const response = await fetch(`YOUR_BACKEND_URL/generate-lesson`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topic, level })
      });
      
      const data = await response.json();

      await addDoc(collection(db, 'users', user.uid, 'lessons'), {
        topic,
        level,
        content: data,
        timestamp: Date.now()
      });

      setViewingLesson(data);
      setActiveTab('view');
    } catch (err) {
      alert("Error generating lesson. Check your backend connection.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans pb-24">
      {/* Header */}
      <header className="bg-white border-b p-4 flex justify-between items-center sticky top-0 z-20">
        <h1 className="text-indigo-600 font-black text-xl flex items-center gap-2">
          <Sparkles fill="currentColor" /> EDUSPARK
        </h1>
        <div className="bg-slate-100 px-3 py-1 rounded-full text-[10px] font-bold text-slate-500">
          {level.split(' ')[1]} {level.split(' ')[2]}
        </div>
      </header>

      <main className="p-4 max-w-xl mx-auto">
        {activeTab === 'home' && (
          <div className="space-y-6 animate-in fade-in duration-500">
            <section className="bg-gradient-to-br from-indigo-600 to-blue-700 p-6 rounded-3xl text-white shadow-xl">
              <h2 className="text-2xl font-bold mb-1">Hello! 👋</h2>
              <p className="text-indigo-100 text-sm mb-6">Ready to master a new topic today?</p>
              
              <div className="space-y-3">
                <select 
                  className="w-full p-4 rounded-2xl bg-white/10 border border-white/20 text-white outline-none"
                  value={level}
                  onChange={(e) => setLevel(e.target.value)}
                >
                  <option className="text-slate-900">Key Stage 1 (Year 1-2)</option>
                  <option className="text-slate-900">Key Stage 2 (Year 3-6)</option>
                  <option className="text-slate-900">Key Stage 3 (JSS 1-3)</option>
                </select>

                <div className="relative">
                  <input 
                    type="text"
                    placeholder="Topic (e.g. Fractions)"
                    className="w-full p-4 rounded-2xl text-slate-900 outline-none shadow-inner"
                    value={topic}
                    onChange={(e) => setTopic(e.target.value)}
                  />
                  <button 
                    onClick={handleGenerate}
                    disabled={loading}
                    className="absolute right-2 top-2 bottom-2 px-4 bg-indigo-600 rounded-xl hover:bg-indigo-500 transition-colors disabled:opacity-50"
                  >
                    {loading ? <Loader2 className="animate-spin" /> : <ChevronRight />}
                  </button>
                </div>
              </div>
            </section>

            <section>
              <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
                <History size={18} /> Your Lessons
              </h3>
              <div className="grid grid-cols-1 gap-3">
                {savedLessons.map((l) => (
                  <div 
                    key={l.id}
                    onClick={() => { setViewingLesson(l.content); setActiveTab('view'); }}
                    className="bg-white p-4 rounded-2xl border border-slate-200 flex justify-between items-center active:scale-95 transition-transform"
                  >
                    <div>
                      <p className="font-bold text-slate-900">{l.topic}</p>
                      <p className="text-xs text-slate-500">{l.level}</p>
                    </div>
                    <div className="p-2 bg-indigo-50 rounded-lg text-indigo-600">
                      <FileText size={20} />
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </div>
        )}

        {activeTab === 'view' && viewingLesson && (
          <div className="animate-in slide-in-from-right duration-300">
            <button onClick={() => setActiveTab('home')} className="mb-4 text-indigo-600 font-bold flex items-center gap-1">
              <ChevronRight className="rotate-180" /> Back
            </button>
            
            <div className="bg-white p-6 rounded-3xl border border-slate-200 mb-6">
              <h2 className="text-xl font-bold text-slate-900 mb-4 border-b pb-2">Lesson Notes</h2>
              <div className="text-slate-700 leading-relaxed whitespace-pre-wrap text-sm">
                {viewingLesson.lessonNote}
              </div>
            </div>

            <h2 className="text-xl font-bold text-slate-900 mb-4">Slides</h2>
            <div className="space-y-4">
              {viewingLesson.presentation.map((slide, i) => (
                <div key={i} className="bg-indigo-950 text-white p-6 rounded-3xl shadow-lg border-b-4 border-indigo-500">
                  <p className="text-[10px] uppercase tracking-widest text-indigo-400 font-bold mb-2">Slide {i+1}</p>
                  <h3 className="text-lg font-bold mb-3">{slide.title}</h3>
                  <ul className="space-y-2">
                    {slide.points.map((p, j) => (
                      <li key={j} className="text-xs text-indigo-100 flex gap-2">
                        <span className="text-indigo-400">•</span> {p}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>

      {/* Mobile Nav */}
      <nav className="fixed bottom-6 left-4 right-4 bg-white/80 backdrop-blur-md border border-slate-200 h-16 rounded-2xl flex items-center justify-around shadow-2xl z-30">
        <button onClick={() => setActiveTab('home')} className={`flex flex-col items-center ${activeTab === 'home' ? 'text-indigo-600' : 'text-slate-400'}`}>
          <BookOpen size={20} />
          <span className="text-[10px] font-bold mt-1">Learn</span>
        </button>
        <button className="flex flex-col items-center text-slate-400">
          <Lightbulb size={20} />
          <span className="text-[10px] font-bold mt-1">Tips</span>
        </button>
        <button className="flex flex-col items-center text-slate-400">
          <Layout size={20} />
          <span className="text-[10px] font-bold mt-1">Quiz</span>
        </button>
      </nav>
    </div>
  );
};

export default App;


```
  
