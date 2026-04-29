/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { 
  collection, 
  addDoc, 
  onSnapshot, 
  query, 
  orderBy, 
  serverTimestamp, 
  Timestamp,
  deleteDoc,
  doc,
  updateDoc,
  where
} from 'firebase/firestore';
import { 
  signInWithPopup, 
  signInWithRedirect,
  GoogleAuthProvider, 
  signOut, 
  onAuthStateChanged, 
  User 
} from 'firebase/auth';
import { db, auth } from './lib/firebase';
import { 
  LogIn, 
  LogOut, 
  Plus, 
  Trash2, 
  Download, 
  Layers, 
  ChevronRight, 
  ChevronLeft,
  ExternalLink,
  LayoutDashboard,
  Grid,
  FileJson,
  Check,
  AlertCircle,
  Loader2,
  Image as ImageIcon,
  Save,
  Wand2,
  X,
  UploadCloud,
  Archive
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  TilesetType, 
  GeneratorResult,
  BLOB_TILES, 
  TRANS_TILES, 
  CAVE_TILES, 
  generateBlob16, 
  generateBlob47, 
  generateTransition25, 
  generateCave16 
} from './lib/autotile';

// --- Types ---
enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
  }
}

function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
    },
    operationType,
    path
  }
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

interface TilesetData {
  id: string;
  name: string;
  type: TilesetType;
  ruleMode: number;
  imageUrl: string;
  rulesJSON?: any;
  authorId: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

interface LibraryAsset {
  id: string;
  name: string;
  imageUrl: string;
  authorId: string;
  metadata?: any;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

// --- Components ---

const Button = ({ children, onClick, variant = 'primary', disabled = false, className = '' }: any) => {
  const variants = {
    primary: 'bg-blue-600 hover:bg-blue-500 text-white shadow-sm',
    secondary: 'bg-zinc-800 border border-zinc-700 hover:bg-zinc-700 text-zinc-300 hover:text-white',
    danger: 'bg-red-500/10 border border-red-500/20 text-red-500 hover:bg-red-500 hover:text-white',
    ghost: 'text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800'
  };

  return (
    <button 
      onClick={onClick} 
      disabled={disabled}
      className={`px-4 py-2 rounded-xl font-medium transition-all flex items-center justify-center gap-2 disabled:opacity-30 active:scale-95 ${variants[variant as keyof typeof variants]} ${className}`}
    >
      {children}
    </button>
  );
};

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeModule, setActiveModule] = useState<'portal' | 'autotile' | 'library'>('portal');
  const [tilesets, setTilesets] = useState<TilesetData[]>([]);
  const [assets, setAssets] = useState<LibraryAsset[]>([]);
  const [view, setView] = useState<'dashboard' | 'editor'>('dashboard');
  const [editingTileset, setEditingTileset] = useState<TilesetData | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // Sync Autotile Tilesets
  useEffect(() => {
    if (!user || activeModule !== 'autotile') return;

    const q = query(
      collection(db, 'tilesets'), 
      where('authorId', '==', user.uid),
      orderBy('updatedAt', 'desc')
    );
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as TilesetData));
      setTilesets(data);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'tilesets');
    });

    return () => unsubscribe();
  }, [user, activeModule]);

  // Sync Library Assets
  useEffect(() => {
    if (!user || activeModule !== 'library') return;

    const q = query(
      collection(db, 'assets'), 
      where('authorId', '==', user.uid),
      orderBy('updatedAt', 'desc')
    );
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as LibraryAsset));
      setAssets(data);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'assets');
    });

    return () => unsubscribe();
  }, [user, activeModule]);

  const handleLogin = async () => {
    try {
      await signInWithRedirect(auth, new GoogleAuthProvider());
    } catch (error: any) {
      console.error('Login error:', error);
      alert('Login failed: ' + error.message);
    }
  };

  const handleLogout = () => {
    signOut(auth);
    setActiveModule('portal');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0A0A0A] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    );
  }

  const handleSkipAuth = () => {
    setUser({ uid: 'local-dev', displayName: 'Guest (Local)', email: 'guest@local' } as any);
  };

  if (!user) {
    return <LandingPage onLogin={handleLogin} onSkip={handleSkipAuth} />;
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 font-sans selection:bg-blue-500/30">
      <Header 
        user={user} 
        onLogout={handleLogout} 
        onHome={activeModule !== 'portal' ? () => setActiveModule('portal') : undefined}
      />
      
      <main className="relative max-w-7xl mx-auto p-6">
        <AnimatePresence mode="wait">
          {activeModule === 'portal' ? (
            <ProjectPortal 
              key="portal" 
              onLaunchAutotile={() => setActiveModule('autotile')} 
              onLaunchLibrary={() => setActiveModule('library')}
            />
          ) : activeModule === 'library' ? (
            <Library 
              key="library"
              assets={assets}
              onHome={() => setActiveModule('portal')}
              userId={user.uid}
              onSendToAutotile={(asset: LibraryAsset) => {
                setEditingTileset({
                  id: '',
                  name: asset.name,
                  imageUrl: asset.imageUrl,
                  type: 'blob',
                  ruleMode: 16,
                  authorId: user.uid,
                  createdAt: Timestamp.now(),
                  updatedAt: Timestamp.now()
                });
                setActiveModule('autotile');
                setView('editor');
              }}
            />
          ) : (
            <motion.div
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              className="relative z-10"
            >
              {view === 'dashboard' ? (
                <Dashboard 
                  key="dash"
                  tilesets={tilesets} 
                  onNew={() => { setEditingTileset(null); setView('editor'); }}
                  onEdit={(t: any) => { setEditingTileset(t); setView('editor'); }}
                  onDelete={async (id: string) => { 
                    if(confirm("Are you sure?")) await deleteDoc(doc(db, 'tilesets', id)); 
                  }}
                />
              ) : (
                <TilesetEditor 
                  key="edit"
                  initialData={editingTileset}
                  onBack={() => setView('dashboard')}
                  userId={user.uid}
                />
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      <footer className="mt-20 border-t border-zinc-800/50 py-12">
        <div className="max-w-7xl mx-auto px-6 flex justify-between items-center text-zinc-500 text-[10px] uppercase font-mono tracking-widest">
          <p>© 2026 Asset Studio - Workspace</p>
          <div className="flex gap-6">
            <p>PROJECT: {auth.app.options.projectId}</p>
          </div>
        </div>
      </footer>
    </div>
  );
}

// --- Sub-Pages ---

function LandingPage({ onLogin, onSkip }: { onLogin: () => void, onSkip?: () => void }) {
  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col items-center justify-center p-6 text-center space-y-12">
      <div className="space-y-4">
        <div className="inline-flex p-4 bg-zinc-900 rounded-3xl border border-zinc-800 shadow-xl">
          <Layers className="w-16 h-16 text-blue-500" />
        </div>
        <h1 className="text-5xl font-bold tracking-tight leading-none">
          Asset Studio
        </h1>
        <p className="text-zinc-500 text-sm max-w-sm mx-auto uppercase tracking-wider font-mono">
          Game Asset & Autotile Rule Manager
        </p>
      </div>
      
      <div className="flex flex-col gap-3">
        <Button onClick={onLogin} className="px-12 py-4 text-lg rounded-xl">
          <LogIn className="w-5 h-5" />
          Sign in to Workspace
        </Button>
        {onSkip && (
          <Button variant="ghost" onClick={onSkip} className="px-8 py-3 text-sm">
            Continue as Guest (Local Only)
          </Button>
        )}
      </div>
    </div>
  );
}

function ProjectPortal({ onLaunchAutotile, onLaunchLibrary }: any) {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="py-12 space-y-10"
    >
      <div className="space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">Project Dashboard</h2>
        <p className="text-zinc-500 font-mono text-[10px] tracking-wider uppercase">Select a module to continue</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Tileset Tool Link */}
        <motion.div 
          whileHover={{ y: -4, transition: { duration: 0.2 } }}
          onClick={onLaunchAutotile}
          className="group relative h-64 p-8 bg-zinc-900 border border-zinc-800 rounded-3xl overflow-hidden cursor-pointer hover:border-blue-500/50 transition-all flex flex-col justify-between shadow-lg shadow-black/20"
        >
          <div className="absolute top-0 right-0 p-8">
            <ChevronRight className="w-5 h-5 text-zinc-600 group-hover:text-blue-500 transition-all" />
          </div>
          <div className="w-14 h-14 bg-zinc-950 rounded-2xl flex items-center justify-center border border-zinc-800 group-hover:border-blue-500/30 transition-all">
            <Layers className="w-6 h-6 text-blue-500" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-zinc-100 mb-2">Autotile Synthesizer</h3>
            <p className="text-zinc-400 text-xs">Generate Wang and Blob rules directly from your tileset images.</p>
          </div>
        </motion.div>

        {/* Library Tool Link */}
        <motion.div 
          whileHover={{ y: -4, transition: { duration: 0.2 } }}
          onClick={onLaunchLibrary}
          className="group relative h-64 p-8 bg-zinc-900 border border-zinc-800 rounded-3xl overflow-hidden cursor-pointer hover:border-emerald-500/50 transition-all flex flex-col justify-between shadow-lg shadow-black/20"
        >
          <div className="absolute top-0 right-0 p-8">
            <ChevronRight className="w-5 h-5 text-zinc-600 group-hover:text-emerald-500 transition-all" />
          </div>
          <div className="w-14 h-14 bg-zinc-950 rounded-2xl flex items-center justify-center border border-zinc-800 group-hover:border-emerald-500/30 transition-all">
            <Archive className="w-6 h-6 text-emerald-500" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-zinc-100 mb-2">Asset Library</h3>
            <p className="text-zinc-400 text-xs">Manage your game assets, sprites, and raw tileset materials.</p>
          </div>
        </motion.div>

        {/* External Link */}
        <motion.a 
          href="https://le-tspa-rt-y.vercel.app/"
          target="_blank"
          rel="noopener noreferrer"
          whileHover={{ y: -4, transition: { duration: 0.2 } }}
          className="group relative h-64 p-8 bg-zinc-900 border border-zinc-800 rounded-3xl overflow-hidden cursor-pointer hover:border-indigo-500/50 transition-all flex flex-col justify-between shadow-lg shadow-black/20"
        >
          <div className="absolute top-0 right-0 p-8">
            <ExternalLink className="w-5 h-5 text-zinc-600 group-hover:text-indigo-500 transition-all" />
          </div>
          <div className="w-14 h-14 bg-zinc-950 rounded-2xl flex items-center justify-center border border-zinc-800 group-hover:border-indigo-500/30 transition-all">
            <LayoutDashboard className="w-6 h-6 text-indigo-500" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-zinc-100 mb-2">Le Tspa Rt Y</h3>
            <p className="text-zinc-400 text-xs">Access external game rendering dashboard.</p>
          </div>
        </motion.a>
      </div>
    </motion.div>
  );
}

// --- Modified existing components ---

function Header({ user, onLogout, onHome }: { user: User, onLogout: () => void, onHome?: () => void }) {
  return (
    <header className="border-b border-zinc-800/50 bg-zinc-950/80 backdrop-blur-md px-6 py-4 flex items-center justify-between sticky top-0 z-50">
      <div className="flex items-center gap-4">
        <button 
          onClick={onHome}
          disabled={!onHome}
          className={`w-9 h-9 bg-zinc-900 rounded-xl flex items-center justify-center border border-zinc-800 transition-all ${onHome ? 'hover:bg-zinc-800 cursor-pointer' : ''}`}
        >
          <Grid className="w-4 h-4 text-zinc-300" />
        </button>
        <div className="flex items-center gap-2">
          {onHome && <span className="text-zinc-700 font-mono">/</span>}
          <h1 className="text-sm font-semibold text-zinc-200">Asset Studio</h1>
        </div>
      </div>
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2 px-3 py-1.5 bg-zinc-900 rounded-full border border-zinc-800">
          <div className="w-2 h-2 rounded-full bg-emerald-500" />
          <span className="text-[10px] font-mono tracking-wider text-zinc-400">{user.displayName}</span>
        </div>
        <Button variant="ghost" onClick={onLogout} title="Sign Out" className="p-2 text-zinc-400">
          <LogOut className="w-4 h-4" />
        </Button>
      </div>
    </header>
  );
}

function Dashboard({ tilesets, onNew, onEdit, onDelete }: any) {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-8 py-8"
    >
      <div className="flex items-end justify-between border-b border-zinc-800/50 pb-8">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Active Projects</h2>
          <p className="text-zinc-500 text-sm mt-1">Manage your autotile rule configurations</p>
        </div>
        <Button onClick={onNew} className="px-6 py-2.5">
          <Plus className="w-5 h-5" />
          Create New
        </Button>
      </div>

      {tilesets.length === 0 ? (
        <div className="py-24 text-center rounded-3xl border border-zinc-800 border-dashed bg-zinc-900/50 flex flex-col items-center gap-4 cursor-pointer hover:bg-zinc-900 transition-all" onClick={onNew}>
          <div className="w-16 h-16 bg-zinc-800 rounded-full flex items-center justify-center text-zinc-400 group-hover:text-blue-500 group-hover:scale-110 transition-all">
            <Plus className="w-8 h-8" />
          </div>
          <p className="text-zinc-500 font-medium">No projects found. Create a new autotile configuration.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {tilesets.map((t: TilesetData) => (
            <TilesetCard key={t.id} tileset={t} onEdit={() => onEdit(t)} onDelete={() => onDelete(t.id)} />
          ))}
        </div>
      )}
    </motion.div>
  );
}

function TilesetCard({ tileset, onEdit, onDelete }: any) {
  return (
    <motion.div 
      whileHover={{ y: -4 }}
      className="group relative bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden hover:border-zinc-700 transition-all flex flex-col shadow-sm"
    >
      <div className="aspect-video relative overflow-hidden bg-black/50 border-b border-zinc-800">
        <img src={tileset.imageUrl} alt={tileset.name} className="w-full h-full object-contain p-4 group-hover:scale-105 transition-all duration-500" />
        <div className="absolute inset-0 bg-gradient-to-t from-zinc-950/80 via-transparent to-transparent flex items-end p-4">
          <div className="flex gap-2">
            <span className="text-[10px] font-bold uppercase tracking-wider bg-blue-600/90 text-white px-2 py-1 rounded">
              {tileset.type}
            </span>
            <span className="text-[10px] font-bold uppercase tracking-wider bg-zinc-800 text-zinc-300 px-2 py-1 rounded border border-zinc-700">
              Rules: {tileset.ruleMode}
            </span>
          </div>
        </div>
      </div>
      
      <div className="p-5 flex flex-col justify-between flex-1 gap-6">
        <div>
          <h3 className="text-lg font-bold text-zinc-100 group-hover:text-blue-400 transition-colors truncate">{tileset.name}</h3>
          <p className="text-xs text-zinc-500 mt-1">Updated {tileset.updatedAt?.toDate().toLocaleDateString()}</p>
        </div>
        
        <div className="flex gap-2">
          <Button onClick={onEdit} className="flex-1 py-2 text-sm bg-zinc-800 hover:bg-zinc-700 text-zinc-100">
            Edit Project
          </Button>
          <Button variant="danger" onClick={onDelete} className="px-3">
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </motion.div>
  );
}

// --- Editor Component ---

// --- Library Components ---

function Library({ assets, onHome, userId, onSendToAutotile }: any) {
  const [isAdding, setIsAdding] = useState(false);
  const [activeTab, setActiveTab] = useState('All');

  const categories = ['All', 'Sprite', 'Tileset', 'UI', 'Audio', 'Other'];
  
  const filteredAssets = assets.filter((a: LibraryAsset) => {
    if (activeTab === 'All') return true;
    return a.metadata?.category === activeTab;
  });

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="space-y-8 py-8"
    >
      <div className="flex items-end justify-between border-b border-zinc-800/50 pb-8">
        <div className="flex items-center gap-6">
          <Button variant="ghost" onClick={onHome} className="p-2">
            <ChevronLeft className="w-5 h-5" />
          </Button>
          <div>
            <h2 className="text-3xl font-bold tracking-tight text-zinc-100">Asset Library</h2>
            <p className="text-zinc-500 text-sm mt-1">Manage game assets and raw tilesets</p>
          </div>
        </div>
        {!isAdding && (
          <Button onClick={() => setIsAdding(true)} className="px-5 bg-emerald-600 hover:bg-emerald-500 text-white">
            <Plus className="w-4 h-4" />
            Upload Asset
          </Button>
        )}
      </div>

      <AnimatePresence>
        {isAdding && (
          <AddAssetForm 
            userId={userId} 
            onClose={() => setIsAdding(false)} 
          />
        )}
      </AnimatePresence>

      {!isAdding && (
         <div className="flex gap-2">
           {categories.map(c => (
             <button
               key={c}
               onClick={() => setActiveTab(c)}
               className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-all ${activeTab === c ? 'bg-zinc-800 text-emerald-400 border border-zinc-700' : 'text-zinc-500 hover:text-zinc-300 hover:bg-zinc-900 border border-transparent'}`}
             >
               {c}
             </button>
           ))}
         </div>
      )}

      {filteredAssets.length === 0 && !isAdding ? (
        <div className="py-24 text-center rounded-3xl border border-zinc-800 border-dashed bg-zinc-900/50 flex flex-col items-center gap-4 cursor-pointer hover:bg-zinc-900 transition-all" onClick={() => setIsAdding(true)}>
          <div className="w-16 h-16 bg-zinc-800 rounded-full flex items-center justify-center group-hover:scale-110 transition-all">
            <Archive className="w-8 h-8 text-zinc-400 group-hover:text-emerald-500" />
          </div>
          <p className="text-zinc-500 font-medium">No assets found in this category.</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
          {filteredAssets.map((asset: LibraryAsset) => (
            <AssetCard 
              key={asset.id} 
              asset={asset} 
              onSendToAutotile={() => onSendToAutotile(asset)}
              onDelete={async () => {
                if(confirm("Confirm asset deletion?")) {
                  try {
                    await deleteDoc(doc(db, 'assets', asset.id));
                  } catch (e) {
                    handleFirestoreError(e, OperationType.DELETE, `assets/${asset.id}`);
                  }
                }
              }}
            />
          ))}
        </div>
      )}
    </motion.div>
  );
}

interface PendingAsset {
  id: string;
  name: string;
  image: string;
}

function AddAssetForm({ userId, onClose }: any) {
  const [pendingAssets, setPendingAssets] = useState<PendingAsset[]>([]);
  const [category, setCategory] = useState('Sprite');
  const [isAutotile, setIsAutotile] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [urlInput, setUrlInput] = useState('');

  const categories = ['Sprite', 'Tileset', 'UI', 'Audio', 'Other'];

  const handleFiles = (files: FileList | File[]) => {
    Array.from(files).forEach(file => {
      if (!file.type.startsWith('image/')) return;
      const reader = new FileReader();
      reader.onload = (event) => {
        const id = Math.random().toString(36).substr(2, 9);
        const name = file.name.split('.')[0] || 'Unknown';
        setPendingAssets(prev => [...prev, { id, name, image: event.target?.result as string }]);
      };
      reader.readAsDataURL(file);
    });
  };

  const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) handleFiles(e.target.files);
    e.target.value = ''; // Reset
  };

  const addFromUrl = () => {
    if (!urlInput) return;
    const id = Math.random().toString(36).substr(2, 9);
    const name = "ImportedAsset_" + id;
    setPendingAssets(prev => [...prev, { id, name, image: urlInput }]);
    setUrlInput('');
  };

  const removeAsset = (id: string) => {
    setPendingAssets(prev => prev.filter(a => a.id !== id));
  };

  const updateAssetName = (id: string, newName: string) => {
    setPendingAssets(prev => prev.map(a => a.id === id ? { ...a, name: newName } : a));
  };

  useEffect(() => {
    const handlePaste = (e: ClipboardEvent) => {
      if (e.clipboardData?.files.length) {
        handleFiles(e.clipboardData.files);
      } else if (e.clipboardData?.getData('text')) {
        const text = e.clipboardData.getData('text');
        if (text.startsWith('http://') || text.startsWith('https://')) {
           const id = Math.random().toString(36).substr(2, 9);
           const name = "PastedAsset_" + id;
           setPendingAssets(prev => [...prev, { id, name, image: text }]);
        }
      }
    };
    window.addEventListener('paste', handlePaste);
    return () => window.removeEventListener('paste', handlePaste);
  }, []);

  const handleSave = async () => {
    if (pendingAssets.length === 0) return alert("Select or paste assets to upload.");
    setUploading(true);
    try {
      for (const asset of pendingAssets) {
        await addDoc(collection(db, 'assets'), {
          name: asset.name,
          imageUrl: asset.image,
          authorId: userId,
          metadata: {
            category,
            isAutotile
          },
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        });
      }
      onClose();
    } catch (e) {
      console.error(e);
      alert("Archive attempt failed: " + String(e));
    } finally {
      setUploading(false);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: 'auto' }}
      exit={{ opacity: 0, height: 0 }}
      className="bg-zinc-900/50 border border-zinc-800 rounded-3xl p-8 overflow-hidden mb-8"
    >
      <div className="flex flex-col md:flex-row gap-8">
        <div className="flex-1 space-y-6">
          <Section label="1. Organization Strategy (Applies to all)">
             <div className="space-y-4">
               <div>
                 <label className="text-xs text-zinc-500 mb-2 block">Category</label>
                 <select 
                   value={category} 
                   onChange={(e) => setCategory(e.target.value)} 
                   className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-emerald-500"
                 >
                   {categories.map(c => <option key={c} value={c}>{c}</option>)}
                 </select>
               </div>
               
               <label className="flex items-center gap-3 cursor-pointer p-3 bg-zinc-950 border border-zinc-800 rounded-xl hover:border-emerald-500/50 transition-all">
                  <input 
                    type="checkbox" 
                    checked={isAutotile} 
                    onChange={(e) => setIsAutotile(e.target.checked)}
                    className="w-5 h-5 rounded border-zinc-700 text-emerald-500 focus:ring-emerald-500 bg-zinc-900"
                  />
                  <div>
                    <p className="text-sm font-semibold text-zinc-200">Use with Auto-Rule System</p>
                    <p className="text-xs text-zinc-500">Marks these assets as valid raw tileset images</p>
                  </div>
               </label>
             </div>
          </Section>

          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            <Button onClick={handleSave} disabled={uploading || pendingAssets.length === 0} className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-500 text-white shadow-sm">
              {uploading ? <Loader2 className="animate-spin" /> : <><Save className="w-4 h-4" /> Save {pendingAssets.length} Assets</>}
            </Button>
            <Button variant="secondary" onClick={onClose} className="px-6 py-3">Cancel</Button>
          </div>
        </div>

        <div className="w-full md:w-[600px] border-t md:border-t-0 md:border-l border-zinc-800 pt-6 md:pt-0 md:pl-8 flex flex-col">
          <Section label="2. Sources">
             <div className="flex gap-2">
                 <input 
                   type="text" 
                   placeholder="Image URL" 
                   value={urlInput}
                   onChange={(e) => setUrlInput(e.target.value)}
                   className="flex-1 bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-2 text-white focus:outline-none focus:border-emerald-500 text-sm font-semibold selection:bg-emerald-500/30"
                 />
                 <Button onClick={addFromUrl} variant="secondary" className="px-5">Import</Button>
             </div>
             
             <div className="relative p-6 mt-4 bg-zinc-950 border border-dashed border-zinc-800 rounded-2xl flex flex-col items-center justify-center gap-3 group hover:border-emerald-500/50 cursor-pointer min-h-[140px] shadow-inner">
                 <UploadCloud className="w-10 h-10 text-zinc-700 group-hover:text-emerald-500 transition-all" />
                 <p className="text-sm text-zinc-500 font-medium text-center">Click to select files, or <span className="text-zinc-300 font-bold">Ctrl+V</span> to paste</p>
                 <input 
                   type="file" 
                   multiple
                   onChange={handleUpload}
                   className="absolute inset-0 opacity-0 cursor-pointer"
                 />
             </div>
          </Section>

          {pendingAssets.length > 0 && (
             <div className="mt-6 flex-1 overflow-auto bg-zinc-950/50 border border-zinc-800/80 rounded-xl p-2 h-56 space-y-2 custom-scrollbar shadow-inner">
                {pendingAssets.map(asset => (
                   <div key={asset.id} className="flex items-center gap-4 bg-zinc-900 border border-zinc-800 p-2 rounded-lg pr-4 shadow-sm hover:border-zinc-700 transition-colors">
                      <div className="w-12 h-12 bg-zinc-950 rounded overflow-hidden flex-shrink-0 flex items-center justify-center">
                         <img src={asset.image} className="max-w-full max-h-full object-contain" alt="" />
                      </div>
                      <input
                        type="text"
                        value={asset.name}
                        onChange={(e) => updateAssetName(asset.id, e.target.value)}
                        className="flex-1 bg-transparent border-b border-transparent hover:border-zinc-700 focus:border-emerald-500 px-1 py-0.5 text-sm font-semibold text-zinc-200 outline-none transition-all focus:bg-zinc-950"
                      />
                      <button onClick={() => removeAsset(asset.id)} className="text-zinc-600 hover:text-red-400 hover:bg-red-500/10 transition-all p-2 rounded-md">
                         <X className="w-4 h-4" />
                      </button>
                   </div>
                ))}
             </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}

function AssetCard({ asset, onDelete, onSendToAutotile }: any) {
  const isTileset = asset.metadata?.isAutotile;

  return (
    <motion.div 
      whileHover={{ y: -4 }}
      className="group relative bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden hover:border-emerald-500/30 transition-all shadow-sm flex flex-col"
    >
      <div className="aspect-square bg-black/50 p-4 border-b border-zinc-800 relative">
        <img src={asset.imageUrl} className="w-full h-full object-contain group-hover:scale-105 transition-all" alt={asset.name} />
        {asset.metadata?.category && (
          <div className="absolute top-2 left-2 bg-zinc-800/90 text-zinc-300 text-[10px] font-bold px-2 py-0.5 rounded border border-zinc-700 backdrop-blur-md hidden group-hover:block transition-all">
            {asset.metadata.category}
          </div>
        )}
      </div>
      <div className="p-4 flex flex-col gap-3 flex-1">
        <div className="flex-1 min-w-0">
          <h4 className="text-sm font-bold text-zinc-100 truncate">{asset.name}</h4>
          <p className="text-[10px] text-zinc-500 mt-0.5">
            {asset.createdAt ? `Added ${asset.createdAt.toDate().toLocaleDateString()}` : 'Uploading...'}
          </p>
        </div>
        
        <div className="flex items-center gap-2 mt-auto">
          {isTileset ? (
            <Button onClick={onSendToAutotile} className="flex-1 py-1.5 text-[10px] uppercase tracking-wider bg-emerald-600/20 text-emerald-400 hover:bg-emerald-600/30 border border-transparent">
               Send to Autotiler
            </Button>
          ) : (
             <div className="flex-1" />
          )}
          <button onClick={onDelete} className="p-1.5 text-zinc-500 hover:text-red-400 hover:bg-red-400/10 rounded-md transition-all shrink-0">
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>
    </motion.div>
  );
}

function TilesetEditor({ initialData, onBack, userId }: any) {
  const [name, setName] = useState(initialData?.name || '');
  const [type, setType] = useState<TilesetType>(initialData?.type || 'blob');
  const [ruleMode, setRuleMode] = useState<number>(initialData?.ruleMode || 16);
  const [image, setImage] = useState<string | null>(initialData?.imageUrl || null);
  const [file, setFile] = useState<File | null>(null);
  const [tiles, setTiles] = useState<string[]>([]);
  const [rulesJSON, setRulesJSON] = useState(initialData?.rulesJSON || null);
  const [tileMap, setTileMap] = useState<Record<number, number[]> | null>(null);
  const [saving, setSaving] = useState(false);
  const [generating, setGenerating] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Slicer Logic
  useEffect(() => {
    if (!image) {
      setTiles([]);
      return;
    }
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      const cols = type === 'blob' ? 6 : 3;
      const rows = type === 'blob' ? 4 : (type === 'transition' ? 6 : 3);
      
      const tileWidth = img.width / cols;
      const tileHeight = img.height / rows;
      
      const newTiles: string[] = [];
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d')!;
      canvas.width = tileWidth;
      canvas.height = tileHeight;
      ctx.imageSmoothingEnabled = false;

      for (let y = 0; y < rows; y++) {
        for (let x = 0; x < cols; x++) {
          ctx.clearRect(0,0, tileWidth, tileHeight);
          ctx.drawImage(img, x * tileWidth, y * tileHeight, tileWidth, tileHeight, 0, 0, tileWidth, tileHeight);
          newTiles.push(canvas.toDataURL());
        }
      }
      setTiles(newTiles);
    };
    img.src = image;
  }, [image, type]);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      setImage(event.target?.result as string);
    };
    reader.readAsDataURL(selectedFile);
    setFile(selectedFile);
  };

  const handleGenerate = () => {
    setGenerating(true);
    const tileSource = type === 'blob' ? BLOB_TILES : (type === 'transition' ? TRANS_TILES : CAVE_TILES);
    let result: GeneratorResult;
    
    if (type === 'blob') {
      result = ruleMode === 16 ? generateBlob16(tileSource) : generateBlob47();
    } else if (type === 'transition') {
      result = generateTransition25(tileSource);
    } else {
      result = generateCave16(tileSource);
    }

    setRulesJSON({ version: "1.0.0", ruleSets: result.rules });
    setTileMap(result.tileMap);
    setGenerating(false);
  };

  const handleSave = async () => {
    if (!name || !image) return alert("Missing name or image");
    setSaving(true);
    try {
      const payload = {
        name,
        type,
        ruleMode,
        imageUrl: image, // Store the base64 string directly
        rulesJSON,
        authorId: userId,
        updatedAt: serverTimestamp(),
      };

      if (initialData) {
        await updateDoc(doc(db, 'tilesets', initialData.id), payload);
      } else {
        await addDoc(collection(db, 'tilesets'), {
          ...payload,
          createdAt: serverTimestamp(),
        });
      }
      onBack();
    } catch (error) {
      console.error(error);
      alert("Save failed: " + String(error));
    } finally {
      setSaving(false);
    }
  };

  const handleDownload = () => {
    const blob = new Blob([JSON.stringify(rulesJSON, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${name.replace(/\s+/g, '_')}_rules.json`;
    a.click();
  };

  return (
    <motion.div 
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="space-y-12"
    >
      <div className="flex items-center gap-6">
        <Button variant="ghost" onClick={onBack} className="p-3">
          <ChevronLeft className="w-5 h-5" />
        </Button>
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-zinc-100">
            {initialData ? 'Edit Configuration' : 'New Autotile Configuration'}
          </h2>
          <p className="text-zinc-500 font-mono text-[10px] tracking-wider mt-1 uppercase font-semibold">MODE: {type.toUpperCase()} / {ruleMode} RULES</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Config */}
        <div className="lg:col-span-4 space-y-6">
          <Section label="Identification">
            <input 
              type="text" 
              placeholder="Tileset Name" 
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500 transition-all font-semibold"
            />
          </Section>

          <Section label="Hardware Logic">
            <div className="grid grid-cols-3 gap-2">
              {(['blob', 'transition', 'cave'] as TilesetType[]).map(t => (
                <button 
                  key={t}
                  onClick={() => { setType(t); setRulesJSON(null); if(t === 'transition') setRuleMode(25); else setRuleMode(16); }}
                  className={`py-3 text-[10px] font-bold uppercase tracking-wider rounded-xl border transition-all ${type === t ? 'bg-blue-600 border-blue-500 text-white shadow-sm' : 'bg-zinc-900 border-zinc-800 text-zinc-500 hover:bg-zinc-800 hover:text-white'}`}
                >
                  {t}
                </button>
              ))}
            </div>
            
            {type === 'blob' && (
              <div className="grid grid-cols-2 gap-2 mt-4">
                {[16, 47].map(m => (
                  <button 
                    key={m}
                    onClick={() => { setRuleMode(m); setRulesJSON(null); }}
                    className={`py-2 text-[10px] font-bold uppercase tracking-wider rounded-xl border transition-all ${ruleMode === m ? 'bg-blue-600/20 border-blue-600 text-blue-400' : 'bg-zinc-900 border-zinc-800 text-zinc-500 hover:bg-zinc-800 hover:text-white'}`}
                  >
                    {m} Rules
                  </button>
                ))}
              </div>
            )}
          </Section>

          <Section label="Source Material">
            <div className="relative group overflow-hidden bg-zinc-900 border border-dashed border-zinc-800 rounded-3xl aspect-video flex flex-col items-center justify-center gap-4 hover:border-blue-500/50 transition-all cursor-pointer">
              {image ? (
                <img src={image} className="w-full h-full object-contain p-4" alt="" />
              ) : (
                <>
                  <ImageIcon className="w-8 h-8 text-zinc-600 group-hover:text-blue-500/50 transition-all" />
                  <p className="text-xs font-semibold text-zinc-400">Drop PNG Tileset Here</p>
                </>
              )}
              <input 
                id="tileset-input"
                type="file" 
                accept="image/png" 
                onChange={handleUpload}
                className="absolute inset-0 opacity-0 cursor-pointer"
              />
            </div>
          </Section>

          <div className="pt-6 space-y-3">
            <Button 
              className="w-full py-3.5 text-xs font-bold uppercase tracking-wider shadow-sm"
              onClick={handleGenerate}
              disabled={!image || generating}
            >
              {generating ? <Loader2 className="animate-spin" /> : <><Wand2 className="w-4 h-4" /> Generate Rules</>}
            </Button>
            <Button 
              variant="secondary"
              className="w-full py-3.5 text-xs font-bold tracking-wider uppercase border-transparent bg-zinc-900 border border-zinc-800"
              onClick={handleSave}
              disabled={saving}
            >
              {saving ? <Loader2 className="animate-spin" /> : <><Save className="w-4 h-4" /> Save Configuration</>}
            </Button>
          </div>
        </div>

        {/* Right Column: Preview & Results */}
        <div className="lg:col-span-8 space-y-8">
          {image && (
            <Section label="Grid Decomposition">
              <div className="grid gap-1 overflow-auto max-h-[70vh] p-2 bg-zinc-900 rounded-2xl border border-zinc-800" style={{ gridTemplateColumns: `repeat(${type === 'blob' ? 6 : 3}, 1fr)` }}>
                {tiles.map((t, i) => (
                  <div key={i} className="group relative aspect-square bg-black/50 border border-zinc-800/50 overflow-hidden flex items-center justify-center hover:border-blue-500 transition-colors">
                    <img src={t} alt="" className="w-full h-full object-contain block" style={{ imageRendering: 'pixelated' }} />
                    <div className="absolute top-0 left-0 p-1 opacity-0 group-hover:opacity-100 transition-all pointer-events-none">
                      <span className="text-[10px] font-mono bg-blue-600 text-white px-1.5 py-0.5 rounded shadow-sm">{i+1}</span>
                    </div>
                  </div>
                ))}
              </div>
            </Section>
          )}

          {rulesJSON && (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6"
            >
              <Section label="Results">
                <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6 flex flex-col md:flex-row items-center gap-6">
                  <div className="w-16 h-16 bg-blue-600/10 rounded-2xl flex items-center justify-center border border-blue-500/20">
                    <Check className="w-8 h-8 text-blue-500" />
                  </div>
                  <div className="flex-1 text-center md:text-left">
                    <h4 className="text-xl font-bold text-zinc-100 mb-1">Synthesized Rules Ready</h4>
                    <p className="text-zinc-500 text-xs font-mono tracking-wider">
                      {rulesJSON.ruleSets.filter((r: any) => r !== null).length} active rule clusters generated.
                    </p>
                  </div>
                  <Button onClick={handleDownload} variant="primary" className="px-8 flex-shrink-0">
                    <Download className="w-4 h-4" />
                    Download JSON
                  </Button>
                </div>
              </Section>

              {tileMap && tiles.length > 0 && (
                <Section label="Tile → Rule Mapping">
                  <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 space-y-2">
                    {Object.entries(tileMap).map(([tileNum, ruleNums]) => {
                      const idx = parseInt(tileNum) - 1;
                      const tileImg = tiles[idx];
                      const hasRules = ruleNums.length > 0;
                      const tileSource = type === 'blob' ? BLOB_TILES : (type === 'transition' ? TRANS_TILES : CAVE_TILES);
                      const tileDef = tileSource[parseInt(tileNum)];
                      return (
                        <div 
                          key={tileNum} 
                          className={`flex items-center gap-4 p-3 rounded-xl border transition-all ${hasRules ? 'bg-zinc-950 border-zinc-800 hover:border-blue-500/30' : 'bg-zinc-950/30 border-zinc-800/30 opacity-40'}`}
                        >
                          <div className="w-12 h-12 bg-black rounded-lg overflow-hidden flex items-center justify-center flex-shrink-0 border border-zinc-800">
                            {tileImg && <img src={tileImg} alt="" className="w-full h-full object-contain" style={{ imageRendering: 'pixelated' }} />}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-mono font-bold text-blue-400">#{tileNum}</span>
                              <span className="text-[10px] text-zinc-500 truncate">{tileDef?.desc || ''}</span>
                            </div>
                            {hasRules ? (
                              <div className="flex flex-wrap gap-1 mt-1">
                                {ruleNums.map((r: number) => (
                                  <span key={r} className="text-[10px] font-mono bg-blue-600/20 text-blue-400 px-2 py-0.5 rounded border border-blue-500/20">
                                    R{r}
                                  </span>
                                ))}
                              </div>
                            ) : (
                              <span className="text-[10px] text-zinc-600 italic">No rules (placeholder)</span>
                            )}
                          </div>
                          <span className="text-[10px] font-mono text-zinc-600 flex-shrink-0">{ruleNums.length} rule{ruleNums.length !== 1 ? 's' : ''}</span>
                        </div>
                      );
                    })}
                  </div>
                </Section>
              )}

              <Section label="JSON Preview">
                <div className="bg-zinc-950 p-6 rounded-3xl border border-zinc-800 overflow-hidden relative">
                  <div className="absolute top-0 right-0 p-4">
                    <FileJson className="text-zinc-800" size={40} />
                  </div>
                  <pre className="text-[10px] font-mono text-zinc-400 overflow-auto max-h-60 custom-scrollbar relative z-10">
                    {JSON.stringify(rulesJSON, null, 2)}
                  </pre>
                </div>
              </Section>
            </motion.div>
          )}

          {!image && (
            <div className="h-full flex flex-col items-center justify-center py-32 text-center space-y-4">
              <AlertCircle className="w-10 h-10 text-zinc-600" />
              <p className="text-zinc-500 font-mono text-xs uppercase tracking-widest max-w-xs">Waiting for source image...</p>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}

function Section({ label, children }: { label: string, children: React.ReactNode }) {
  return (
    <div className="space-y-3">
      <h3 className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider px-1">{label}</h3>
      {children}
    </div>
  );
}
