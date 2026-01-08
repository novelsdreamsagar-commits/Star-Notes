
import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Note, Folder, SortOption } from '../types';
import { ArrowLeft, Search, ListFilter, Plus, FileText, Folder as FolderIcon, FilePlus, FolderPlus, X, Check, Menu, Trash2, Download, Loader2, Zap } from 'lucide-react';
import JSZip from 'jszip';

interface FolderViewProps {
  notes: Note[];
  subFolders: Folder[];
  sortOption: SortOption;
  setSortOption: (opt: SortOption) => void;
  onNoteSelect: (id: string) => void;
  onFolderSelect: (id: string) => void;
  onDeleteNote: (id: string) => void;
  onDeleteFolder: (id: string) => void;
  onDeleteMultiple: (noteIds: Set<string>, folderIds: Set<string>) => void;
  folderName: string;
  onBack: () => void;
  onCreateNote: () => void;
  onOpenFolderModal: () => void;
  onOpenDialogueCutter: () => void;
  onAutoCutDialogues: () => void;
  showMenuIcon?: boolean;
  onToggleSidebar?: () => void;
}

const FolderView: React.FC<FolderViewProps> = ({ 
  notes, 
  subFolders,
  sortOption,
  setSortOption,
  onNoteSelect, 
  onFolderSelect,
  onDeleteNote, 
  onDeleteFolder,
  onDeleteMultiple,
  folderName, 
  onBack,
  onCreateNote,
  onOpenFolderModal,
  onOpenDialogueCutter,
  onAutoCutDialogues,
  showMenuIcon,
  onToggleSidebar
}) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isSortOpen, setIsSortOpen] = useState(false);
  const [selectedNotes, setSelectedNotes] = useState<Set<string>>(new Set());
  const [selectedFolders, setSelectedFolders] = useState<Set<string>>(new Set());
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  
  const menuRef = useRef<HTMLDivElement>(null);
  const longPressTimer = useRef<number | null>(null);
  
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    setIsSelectionMode(false);
    setSelectedNotes(new Set());
    setSelectedFolders(new Set());
  }, [folderName]);

  const sortedNotes = useMemo(() => {
    const items = [...notes];
    switch (sortOption) {
      case 'title': return items.sort((a, b) => (a.title || 'Untitled').localeCompare(b.title || 'Untitled', 'bn'));
      case 'modified_newest': return items.sort((a, b) => b.updatedAt - a.updatedAt);
      case 'modified_oldest': return items.sort((a, b) => a.updatedAt - b.updatedAt);
      case 'created_newest': return items.sort((a, b) => b.createdAt - a.createdAt);
      case 'created_oldest': return items.sort((a, b) => a.createdAt - b.createdAt);
      case 'color': return items.sort((a, b) => (a.color || '').localeCompare(b.color || ''));
      default: return items;
    }
  }, [notes, sortOption]);

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    const now = new Date();
    if (date.toDateString() === now.toDateString()) return `Today ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    return date.toLocaleDateString();
  };

  const handleExportFolder = async () => {
    if (notes.length === 0) {
      alert("এক্সপোর্ট করার মতো কোনো নোট নেই।");
      return;
    }

    setIsExporting(true);
    try {
      const zip = new JSZip();
      const usedFilenames = new Map<string, number>();

      notes.forEach(note => {
        let baseName = (note.title || 'Untitled').replace(/[/\\?%*:|"<>]/g, '-');
        let fileName = `${baseName}.txt`;

        // Check for duplicate filenames and append counter if necessary
        if (usedFilenames.has(baseName)) {
          const count = usedFilenames.get(baseName)! + 1;
          usedFilenames.set(baseName, count);
          fileName = `${baseName} (${count}).txt`;
        } else {
          usedFilenames.set(baseName, 0);
        }

        zip.file(fileName, note.content || '');
      });

      const content = await zip.generateAsync({ type: 'blob' });
      const url = URL.createObjectURL(content);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${folderName || 'Notes'}_Export.zip`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Export failed:", error);
      alert("এক্সপোর্ট করতে সমস্যা হয়েছে।");
    } finally {
      setIsExporting(false);
    }
  };

  const handleLongPress = (id: string, isFolder: boolean) => {
    setIsSelectionMode(true);
    if (isFolder) setSelectedFolders(new Set([id]));
    else setSelectedNotes(new Set([id]));
    if (window.navigator && window.navigator.vibrate) window.navigator.vibrate(60);
  };

  const startPress = (id: string, isFolder: boolean) => {
    cancelPress();
    longPressTimer.current = window.setTimeout(() => handleLongPress(id, isFolder), 600);
  };

  const cancelPress = () => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
  };

  const toggleSelection = (id: string, isFolder: boolean) => {
    if (isFolder) {
      const next = new Set(selectedFolders);
      if (next.has(id)) next.delete(id); else next.add(id);
      setSelectedFolders(next);
      if (next.size === 0 && selectedNotes.size === 0) setIsSelectionMode(false);
    } else {
      const next = new Set(selectedNotes);
      if (next.has(id)) next.delete(id); else next.add(id);
      setSelectedNotes(next);
      if (next.size === 0 && selectedFolders.size === 0) setIsSelectionMode(false);
    }
  };

  const handleDeleteSelected = () => {
    const total = selectedNotes.size + selectedFolders.size;
    if (total === 0) return;
    if (window.confirm(`${total}টি আইটেম রিসাইকেল বিন-এ পাঠাতে চান?`)) {
      onDeleteMultiple(new Set(selectedNotes), new Set(selectedFolders));
      setIsSelectionMode(false);
      setSelectedNotes(new Set());
      setSelectedFolders(new Set());
    }
  };

  return (
    <div className="fixed inset-0 z-[40] bg-black flex flex-col animate-in fade-in duration-300">
      <header className={`h-14 flex items-center justify-between px-4 shadow-md shrink-0 transition-all duration-300 ${isSelectionMode ? 'bg-rose-900 shadow-rose-900/20' : 'bg-[#006064]'}`}>
        {isSelectionMode ? (
          <>
            <div className="flex items-center gap-6">
              <button onClick={() => { setIsSelectionMode(false); setSelectedNotes(new Set()); setSelectedFolders(new Set()); }} className="p-2 text-white hover:bg-white/10 rounded-full active:scale-90"><X size={24} /></button>
              <span className="text-white text-lg font-bold">{selectedNotes.size + selectedFolders.size} Selected</span>
            </div>
            <button onClick={handleDeleteSelected} className="p-3 text-white bg-rose-600 hover:bg-rose-500 rounded-full shadow-lg active:scale-90"><Trash2 size={24} /></button>
          </>
        ) : (
          <>
            <div className="flex items-center gap-4">
              {showMenuIcon ? (
                <button onClick={onToggleSidebar} className="p-2 text-white hover:bg-white/10 rounded-full active:scale-90 transition-transform">
                  <Menu size={26} />
                </button>
              ) : (
                <button onClick={onBack} className="p-2 text-white hover:bg-white/10 rounded-full active:scale-90">
                  <ArrowLeft size={24} />
                </button>
              )}
              <h2 className="text-lg font-black text-white truncate max-w-[150px]">{folderName}</h2>
            </div>
            <div className="flex items-center gap-1">
              {/* Auto Cut Action */}
              <button 
                onClick={onAutoCutDialogues}
                title="Automatic Dialogue Cutter"
                className="p-2 text-white hover:bg-white/10 rounded-full active:scale-90 transition-colors"
              >
                <Zap size={22} className="fill-yellow-400 text-yellow-400" />
              </button>

              {/* Document Icon for Export */}
              <button 
                onClick={handleExportFolder} 
                disabled={isExporting}
                title="Export Folder to .txt"
                className="p-2 text-white hover:bg-white/10 rounded-full active:scale-90 transition-colors disabled:opacity-50"
              >
                {isExporting ? <Loader2 size={22} className="animate-spin" /> : <FileText size={22} />}
              </button>
              
              <button onClick={onOpenDialogueCutter} className="p-2 text-white hover:bg-white/10 rounded-full active:scale-90"><Search size={22} /></button>
              <button onClick={() => setIsSortOpen(true)} className="p-2 text-white hover:bg-white/10 rounded-full active:scale-90"><ListFilter size={22} /></button>
              <div className="relative" ref={menuRef}>
                <button onClick={() => setIsMenuOpen(!isMenuOpen)} className={`p-2 text-white hover:bg-white/10 rounded-full transition-all active:scale-90 ${isMenuOpen ? 'bg-white/20' : ''}`}>
                  <Plus size={24} className={`transition-transform duration-200 ${isMenuOpen ? 'rotate-45' : ''}`} />
                </button>
                {isMenuOpen && (
                  <div className="absolute right-0 mt-2 w-48 bg-[#1a1a1a] border border-white/10 rounded-xl shadow-2xl overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200 z-[50]">
                    <button onClick={() => { onCreateNote(); setIsMenuOpen(false); }} className="w-full flex items-center gap-3 px-4 py-4 text-white hover:bg-white/5 transition-colors text-left font-bold border-b border-white/5">
                      <FilePlus size={18} className="text-[#00bcd4]" /> Create Note
                    </button>
                    <button onClick={() => { onOpenFolderModal(); setIsMenuOpen(false); }} className="w-full flex items-center gap-3 px-4 py-4 text-white hover:bg-white/5 transition-colors text-left font-bold">
                      <FolderPlus size={18} className="text-[#00bcd4]" /> Create Folder
                    </button>
                  </div>
                )}
              </div>
            </div>
          </>
        )}
      </header>

      <div className="flex-1 overflow-y-auto custom-scrollbar bg-[#050505]">
        <div className="flex flex-col select-none">
          {subFolders.map(folder => (
            <div 
              key={folder.id}
              onMouseDown={() => startPress(folder.id, true)}
              onMouseUp={cancelPress}
              onClick={() => isSelectionMode ? toggleSelection(folder.id, true) : onFolderSelect(folder.id)}
              className={`group flex items-center gap-4 px-5 py-5 border-b border-white/5 transition-all cursor-pointer ${selectedFolders.has(folder.id) ? 'bg-rose-500/10 border-l-4 border-l-rose-500' : 'hover:bg-white/[0.03]'}`}
            >
              <FolderIcon className={selectedFolders.has(folder.id) ? "text-rose-500" : "text-white/40"} size={30} />
              <span className={`flex-1 text-[19px] truncate ${selectedFolders.has(folder.id) ? 'text-rose-500 font-bold' : 'text-white/90 font-medium'}`}>{folder.name}</span>
              {!isSelectionMode && (
                <button onClick={(e) => { e.stopPropagation(); onDeleteFolder(folder.id); }} className="p-3 text-white/20 hover:text-rose-500 transition-colors"><Trash2 size={20} /></button>
              )}
            </div>
          ))}

          {sortedNotes.map((note) => (
            <div 
              key={note.id}
              onMouseDown={() => startPress(note.id, false)}
              onMouseUp={cancelPress}
              onClick={() => isSelectionMode ? toggleSelection(note.id, false) : onNoteSelect(note.id)}
              className={`group relative px-5 py-5 border-b border-white/5 transition-all cursor-pointer ${selectedNotes.has(note.id) ? 'bg-rose-500/10 border-l-4 border-l-rose-500' : 'hover:bg-white/[0.03]'}`}
            >
              <div className="flex flex-col">
                <div className="flex items-start justify-between gap-4">
                  <h3 className={`text-[19px] mb-1 leading-tight truncate transition-colors flex-1 ${selectedNotes.has(note.id) ? 'text-rose-500 font-black' : 'text-white font-bold'}`}>
                    {note.title || 'Untitled'}
                  </h3>
                  {!isSelectionMode && (
                    <button onClick={(e) => { e.stopPropagation(); onDeleteNote(note.id); }} className="p-2 text-white/20 hover:text-rose-500 transition-colors shrink-0"><Trash2 size={18} /></button>
                  )}
                </div>
                <p className={`text-[15px] line-clamp-2 leading-relaxed mb-4 transition-colors ${selectedNotes.has(note.id) ? 'text-rose-500/70' : 'text-white/50 font-medium'}`}>
                  {note.content || 'Empty note content...'}
                </p>
                <div className="flex justify-end">
                  <span className="text-white/30 text-[11px] font-bold uppercase tracking-wider">{formatDate(note.updatedAt)}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {isSortOpen && (
        <div className="fixed inset-0 z-[200] bg-black/95 flex flex-col animate-in slide-in-from-bottom duration-300">
          <header className="bg-[#006064] h-14 flex items-center justify-between px-4">
            <h2 className="text-white font-bold">Sort Settings</h2>
            <button onClick={() => setIsSortOpen(false)} className="text-white/80 p-2"><X size={28} /></button>
          </header>
          <div className="flex-1 p-6 flex flex-col gap-2 overflow-y-auto">
            {['title', 'modified_newest', 'modified_oldest', 'created_newest', 'created_oldest', 'color'].map((opt) => (
              <button
                key={opt}
                onClick={() => { setSortOption(opt as SortOption); setIsSortOpen(false); }}
                className="flex items-center gap-6 px-6 py-6 text-white hover:bg-white/5 transition-all rounded-2xl border border-white/5"
              >
                <div className={`w-7 h-7 rounded-full border-2 flex items-center justify-center ${sortOption === opt ? 'border-[#00bcd4] bg-black' : 'border-white/20'}`}>
                  {sortOption === opt && <div className="w-4 h-4 rounded-full bg-[#00bcd4]" />}
                </div>
                <span className={`text-lg font-bold capitalize ${sortOption === opt ? 'text-[#00bcd4]' : 'text-white/70'}`}>{opt.replace('_', ' ')}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default FolderView;
