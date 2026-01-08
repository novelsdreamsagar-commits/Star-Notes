
import React, { useState } from 'react';
import { Note, Folder } from '../types';
import { Trash2, RotateCcw, ArrowLeft, X, AlertTriangle } from 'lucide-react';

interface RecycleBinProps {
  notes: Note[];
  folders: Folder[];
  onRestore: (noteIds: Set<string>, folderIds: Set<string>) => void;
  onPermanentDelete: (noteIds: Set<string>, folderIds: Set<string>) => void;
  onBack: () => void;
}

const RecycleBin: React.FC<RecycleBinProps> = ({ notes, folders, onRestore, onPermanentDelete, onBack }) => {
  const [selectedNotes, setSelectedNotes] = useState<Set<string>>(new Set());
  const [selectedFolders, setSelectedFolders] = useState<Set<string>>(new Set());

  const toggleNote = (id: string) => {
    const next = new Set(selectedNotes);
    if (next.has(id)) next.delete(id); else next.add(id);
    setSelectedNotes(next);
  };

  const toggleFolder = (id: string) => {
    const next = new Set(selectedFolders);
    if (next.has(id)) next.delete(id); else next.add(id);
    setSelectedFolders(next);
  };

  const handleRestore = () => {
    onRestore(selectedNotes, selectedFolders);
    setSelectedNotes(new Set());
    setSelectedFolders(new Set());
  };

  const handlePermanentDelete = () => {
    if (window.confirm('নির্বাচিত আইটেমগুলো চিরতরে মুছে যাবে। আপনি কি নিশ্চিত?')) {
      onPermanentDelete(selectedNotes, selectedFolders);
      setSelectedNotes(new Set());
      setSelectedFolders(new Set());
    }
  };

  const handleEmptyBin = () => {
    if (window.confirm('রিসাইকেল বিন এর সকল আইটেম চিরতরে মুছে ফেলতে চান?')) {
      onPermanentDelete(new Set(notes.map(n => n.id)), new Set(folders.map(f => f.id)));
    }
  };

  const totalSelected = selectedNotes.size + selectedFolders.size;
  const hasItems = notes.length > 0 || folders.length > 0;

  return (
    <div className="fixed inset-0 z-[100] bg-black flex flex-col animate-in fade-in duration-300">
      <header className="h-14 bg-rose-900 flex items-center justify-between px-4 shadow-lg shrink-0">
        <div className="flex items-center gap-4">
          <button onClick={onBack} className="p-2 text-white/80 hover:text-white transition-colors active:scale-90"><ArrowLeft size={24} /></button>
          <h2 className="text-lg font-black text-white uppercase tracking-wider">Recycle Bin</h2>
        </div>
        {hasItems && (
            <button onClick={handleEmptyBin} className="px-4 py-1.5 bg-rose-700 hover:bg-rose-600 text-white text-xs font-bold rounded-full transition-all active:scale-95 uppercase">
                Empty Bin
            </button>
        )}
      </header>

      {totalSelected > 0 && (
        <div className="bg-rose-950/50 p-4 border-b border-rose-900/50 flex items-center justify-between animate-in slide-in-from-top duration-300">
           <span className="text-rose-200 font-bold">{totalSelected} items selected</span>
           <div className="flex gap-2">
             <button onClick={handleRestore} className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg font-bold text-sm active:scale-95 transition-all">
                <RotateCcw size={16} /> Restore
             </button>
             <button onClick={handlePermanentDelete} className="flex items-center gap-2 px-4 py-2 bg-rose-600 text-white rounded-lg font-bold text-sm active:scale-95 transition-all">
                <Trash2 size={16} /> Delete
             </button>
           </div>
        </div>
      )}

      <div className="flex-1 overflow-y-auto custom-scrollbar p-4 flex flex-col gap-2 bg-[#050505]">
        {!hasItems ? (
           <div className="h-full flex flex-col items-center justify-center text-white/10 p-10 text-center">
             <Trash2 size={80} strokeWidth={1} className="mb-6 opacity-20" />
             <p className="text-lg font-bold">Your Recycle Bin is empty</p>
             <p className="text-sm mt-2">Deleted items will appear here for 30 days.</p>
           </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {folders.map(f => (
              <div 
                key={f.id} 
                onClick={() => toggleFolder(f.id)}
                className={`p-5 rounded-2xl border transition-all cursor-pointer flex items-center gap-4 ${selectedFolders.has(f.id) ? 'bg-rose-900/20 border-rose-500' : 'bg-white/5 border-white/5 hover:border-white/20'}`}
              >
                <Trash2 className="text-rose-500" size={24} />
                <div className="flex-1">
                   <h3 className="text-white font-bold truncate">{f.name}</h3>
                   <p className="text-[10px] text-white/30 uppercase font-bold mt-1">Folder</p>
                </div>
              </div>
            ))}
            {notes.map(n => (
              <div 
                key={n.id} 
                onClick={() => toggleNote(n.id)}
                className={`p-5 rounded-2xl border transition-all cursor-pointer flex items-center gap-4 ${selectedNotes.has(n.id) ? 'bg-rose-900/20 border-rose-500' : 'bg-white/5 border-white/5 hover:border-white/20'}`}
              >
                <Trash2 className="text-rose-500" size={24} />
                <div className="flex-1">
                   <h3 className="text-white font-bold truncate">{n.title || 'Untitled'}</h3>
                   <p className="text-[10px] text-white/30 uppercase font-bold mt-1">Note</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      
      {hasItems && (
          <div className="p-4 bg-rose-950/20 flex items-center gap-3">
             <AlertTriangle size={18} className="text-rose-500" />
             <p className="text-[11px] text-rose-200/50 font-medium">Items here will be permanently deleted after 30 days if not restored.</p>
          </div>
      )}
    </div>
  );
};

export default RecycleBin;
