
import React, { useRef, useEffect, useState, useMemo } from 'react';
import { Note, Folder } from '../types';
import { Check, Menu, Undo2, Redo2, Type, Image as ImageIcon, FolderInput, Search as SearchIcon, X, ChevronRight, Eraser, Info } from 'lucide-react';
import NoteInfoModal from './NoteInfoModal';

interface EditorProps {
  note: Note;
  onUpdate: (updates: Partial<Note>) => void;
  onSave: () => void;
  isDarkMode: boolean;
  folders: Folder[];
}

const Editor: React.FC<EditorProps> = ({ note, onUpdate, onSave, isDarkMode, folders }) => {
  const contentRef = useRef<HTMLTextAreaElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isMoveOpen, setIsMoveOpen] = useState(false);
  const [isInfoOpen, setIsInfoOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const menuRef = useRef<HTMLDivElement>(null);

  // Close menu on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setIsMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Auto-resize textarea to fit content and sync height
  useEffect(() => {
    if (contentRef.current) {
      contentRef.current.style.height = '0px';
      const scrollHeight = contentRef.current.scrollHeight;
      contentRef.current.style.height = `${scrollHeight}px`;
    }
  }, [note.content]);

  const handleSaveClick = () => {
    setIsSaving(true);
    onUpdate({ updatedAt: Date.now() });
    setTimeout(() => {
      setIsSaving(false);
      onSave();
    }, 400);
  };

  const applyFormatting = () => {
    let text = note.content;

    // 1. Bengali Character Normalization (Fixing Unicode inconsistencies)
    // য + ় (\u09AF + \u09BC) -> য় (\u09DF)
    text = text.replace(/\u09AF\u09BC/g, '\u09DF');
    // ড + ় (\u09A1 + \u09BC) -> ড় (\u09DC)
    text = text.replace(/\u09A1\u09BC/g, '\u09DC');
    // ঢ + ় (\u09A2 + \u09BC) -> ঢ় (\u09DD)
    text = text.replace(/\u09A2\u09BC/g, '\u09DD');
    // ব + ় (\u09AC + \u09BC) -> র (\u09B0)
    text = text.replace(/\u09AC\u09BC/g, '\u09B0');

    // 2. Paragraph Formatting
    const paragraphs = text.split('\n').filter(line => line.trim() !== '');
    const formatted = paragraphs.join('\n\n');
    
    onUpdate({ content: formatted });
    setIsMenuOpen(false);
  };

  const moveToFolder = (folderId: string) => {
    onUpdate({ folderId });
    setIsMoveOpen(false);
    setIsMenuOpen(false);
    alert(`Moved to ${folders.find(f => f.id === folderId)?.name}`);
  };

  const closeSearch = () => {
    setIsSearchOpen(false);
    setSearchTerm('');
  };

  const openSearch = () => {
    setIsSearchOpen(true);
    setIsMenuOpen(false);
  };

  // Highlighting Logic for Search - Perfectly synced with textarea
  const highlightedContent = useMemo(() => {
    if (!isSearchOpen || !searchTerm.trim()) return null;
    
    const escapedSearch = searchTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const parts = note.content.split(new RegExp(`(${escapedSearch})`, 'gi'));
    
    return (
      <div 
        className="absolute top-0 left-0 w-full pointer-events-none px-4 py-3 whitespace-pre-wrap break-words text-[18px] leading-relaxed text-transparent font-medium"
        style={{ fontFamily: 'inherit' }}
      >
        {parts.map((part, i) => 
          part.toLowerCase() === searchTerm.toLowerCase() 
            ? <span key={i} className="bg-[#b9f6ca] text-black rounded-sm ring-1 ring-[#b9f6ca]">{part}</span> 
            : part
        )}
      </div>
    );
  }, [note.content, searchTerm, isSearchOpen]);

  return (
    <div className="fixed inset-0 z-[100] bg-black flex flex-col animate-in fade-in duration-300">
      {/* Top Header */}
      <header className="bg-[#006064] h-14 flex items-center justify-between px-3 shadow-md shrink-0 relative z-[110]">
        <div className="flex items-center">
          <button 
            onClick={handleSaveClick}
            className="p-2.5 text-white hover:bg-white/10 rounded-full transition-colors active:scale-90"
          >
            <Check size={30} strokeWidth={2.5} />
          </button>
        </div>
        
        <div className="flex items-center gap-1">
          <button className="p-2.5 text-white/80 hover:bg-white/10 rounded-full transition-colors active:scale-95">
            <Undo2 size={24} />
          </button>
          <button className="p-2.5 text-white/80 hover:bg-white/10 rounded-full transition-colors active:scale-95">
            <Redo2 size={24} />
          </button>
          <button className="p-2.5 text-white hover:bg-white/10 rounded-full transition-colors active:scale-95">
            <ImageIcon size={24} />
          </button>
          <div className="relative" ref={menuRef}>
            <button 
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className={`p-2.5 text-white hover:bg-white/10 rounded-full transition-all duration-300 ${isMenuOpen ? 'bg-white/20 rotate-90 scale-110' : ''}`}
            >
              <Menu size={28} />
            </button>

            {/* Pop-up Menu with Professional Animation */}
            {isMenuOpen && (
              <div className="absolute right-0 mt-3 w-64 bg-[#1a1a1a] border border-white/20 rounded-[24px] shadow-[0_20px_60px_-15px_rgba(0,0,0,0.7)] overflow-hidden z-[150] origin-top-right transition-all animate-in fade-in zoom-in-95 slide-in-from-top-4 duration-300 ease-out">
                <div className="flex flex-col p-1.5">
                  <button 
                    onClick={applyFormatting} 
                    className="w-full flex items-center gap-4 px-5 py-4 text-white hover:bg-white/10 rounded-t-[18px] transition-all group"
                  >
                    <div className="w-8 h-8 rounded-full bg-indigo-500/20 flex items-center justify-center text-indigo-400 group-hover:scale-110 transition-transform">
                      <Type size={18} />
                    </div>
                    <span className="font-bold">Formatting</span>
                  </button>
                  
                  <button 
                    onClick={() => { setIsMoveOpen(true); setIsMenuOpen(false); }} 
                    className="w-full flex items-center gap-4 px-5 py-4 text-white hover:bg-white/10 transition-all group"
                  >
                    <div className="w-8 h-8 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-400 group-hover:scale-110 transition-transform">
                      <FolderInput size={18} />
                    </div>
                    <span className="font-bold">Move to folder</span>
                  </button>
                  
                  <button 
                    onClick={openSearch} 
                    className="w-full flex items-center gap-4 px-5 py-4 text-white hover:bg-white/10 transition-all group"
                  >
                    <div className="w-8 h-8 rounded-full bg-[#00bcd4]/20 flex items-center justify-center text-[#00bcd4] group-hover:scale-110 transition-transform">
                      <SearchIcon size={18} />
                    </div>
                    <span className="font-bold">Search</span>
                  </button>
                  
                  <button 
                    onClick={() => { setIsInfoOpen(true); setIsMenuOpen(false); }} 
                    className="w-full flex items-center gap-4 px-5 py-4 text-white hover:bg-white/10 rounded-b-[18px] transition-all group"
                  >
                    <div className="w-8 h-8 rounded-full bg-amber-500/20 flex items-center justify-center text-amber-400 group-hover:scale-110 transition-transform">
                      <Info size={18} />
                    </div>
                    <span className="font-bold">Info</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Editor Surface - The Scrollable Container */}
      <div className="flex-1 overflow-y-auto custom-scrollbar bg-black relative" ref={containerRef}>
        <div className="w-full flex flex-col min-h-full max-w-4xl mx-auto">
          <input
            type="text"
            value={note.title}
            onChange={(e) => onUpdate({ title: e.target.value })}
            placeholder="Title"
            className="w-full bg-transparent border-none focus:ring-0 text-[22px] font-bold text-white placeholder-slate-400 outline-none px-4 pt-6 pb-4"
          />
          <div className="h-[1px] bg-white/10 w-full mb-2" />
          
          <div className="relative w-full h-full flex-1">
            {/* Highlighter Overlay - Perfectly matches the textarea's padding/font */}
            {highlightedContent}
            
            <textarea
              ref={contentRef}
              value={note.content}
              onChange={(e) => onUpdate({ content: e.target.value })}
              onFocus={() => { if (isSearchOpen && !searchTerm) setIsSearchOpen(false); }}
              placeholder="Start writing..."
              className="w-full bg-transparent border-none focus:ring-0 text-[18px] leading-relaxed text-slate-100 placeholder-slate-400 resize-none outline-none px-4 py-3 font-medium overflow-hidden block"
              style={{ caretColor: 'white', minHeight: '60vh' }}
            />
          </div>
        </div>
      </div>

      {/* Move to Folder Modal */}
      {isMoveOpen && (
        <div className="fixed inset-0 z-[150] bg-black/80 backdrop-blur-sm flex items-end sm:items-center justify-center p-4">
          <div className="bg-[#111] w-full max-w-md rounded-3xl border border-white/10 shadow-2xl overflow-hidden animate-in slide-in-from-bottom duration-300">
            <div className="p-6 border-b border-white/5 flex items-center justify-between">
              <h3 className="text-xl font-bold text-white">Move Note</h3>
              <button onClick={() => setIsMoveOpen(false)} className="p-2 text-white/40 hover:text-white"><X size={24} /></button>
            </div>
            <div className="max-h-64 overflow-y-auto p-2">
              {folders.filter(f => !f.isDeleted && f.id !== note.folderId).map(f => (
                <button 
                  key={f.id} 
                  onClick={() => moveToFolder(f.id)}
                  className="w-full flex items-center justify-between p-4 text-white hover:bg-white/5 rounded-2xl transition-all"
                >
                  <span className="font-bold text-lg">{f.name}</span>
                  <ChevronRight size={20} className="text-white/20" />
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Search Bar */}
      <div className={`fixed bottom-0 left-0 right-0 z-[110] bg-[#1a1a1a] border-t border-white/10 p-4 transition-transform duration-300 ease-in-out shadow-2xl ${isSearchOpen ? 'translate-y-0' : 'translate-y-full'}`}>
        <div className="max-w-4xl mx-auto flex items-center gap-3">
          <div className="flex-1 relative">
            <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" size={18} />
            <input 
              autoFocus={isSearchOpen}
              type="text" 
              placeholder="Search in note..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-xl py-3 pl-10 pr-10 text-white placeholder-white/20 focus:border-[#00bcd4] outline-none font-bold"
            />
            {searchTerm && (
              <button 
                onClick={() => setSearchTerm('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white p-1"
              >
                <Eraser size={18} />
              </button>
            )}
          </div>
          <button 
            onClick={closeSearch}
            className="p-3 bg-white/5 hover:bg-white/10 rounded-xl text-white/60 hover:text-white transition-colors border border-white/5"
          >
            <X size={24} />
          </button>
        </div>
      </div>

      {/* Note Info Modal */}
      <NoteInfoModal 
        isOpen={isInfoOpen} 
        onClose={() => setIsInfoOpen(false)} 
        note={note} 
      />

      {/* Save Success Indicator */}
      {isSaving && (
        <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px] flex items-center justify-center z-[110]">
          <div className="bg-[#006064] px-8 py-3 rounded-full shadow-2xl flex items-center gap-3 animate-in zoom-in duration-200">
            <Check size={20} className="text-white" />
            <span className="text-white font-bold tracking-wide">Saved</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default Editor;
