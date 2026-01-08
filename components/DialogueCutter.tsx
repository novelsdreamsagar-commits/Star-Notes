
import React, { useState, useMemo } from 'react';
import { Note } from '../types';
import { X, Search, Copy, Scissors, Check, AlertCircle, FileText, ChevronRight } from 'lucide-react';

interface DialogueCutterProps {
  isOpen: boolean;
  onClose: () => void;
  notes: Note[];
  onCut: (searchWord: string, cutParagraphs: { noteId: string, paragraphs: string[] }[], formattedContent: string) => void;
  isDarkMode: boolean;
  folderName: string;
}

interface GroupedResult {
  noteId: string;
  noteTitle: string;
  paragraphs: string[];
}

const DialogueCutter: React.FC<DialogueCutterProps> = ({ isOpen, onClose, notes, onCut, isDarkMode, folderName }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [copied, setCopied] = useState(false);

  // Grouping and Sorting Logic
  const groupedResults = useMemo(() => {
    if (!searchTerm.trim()) return [];
    
    const lowerSearch = searchTerm.toLowerCase();
    const groups: GroupedResult[] = [];

    notes.forEach(note => {
      const paragraphs = note.content.split(/\n\n+/);
      const matchedParagraphs = paragraphs
        .map(p => p.trim())
        .filter(p => p.toLowerCase().startsWith(lowerSearch));

      if (matchedParagraphs.length > 0) {
        // Sort paragraphs within this note A to Z
        matchedParagraphs.sort((a, b) => a.localeCompare(b, 'bn'));
        
        groups.push({
          noteId: note.id,
          noteTitle: note.title || 'Untitled',
          paragraphs: matchedParagraphs
        });
      }
    });

    return groups.sort((a, b) => a.noteTitle.localeCompare(b.noteTitle, 'bn'));
  }, [searchTerm, notes]);

  const totalMatches = useMemo(() => {
    return groupedResults.reduce((acc, curr) => acc + curr.paragraphs.length, 0);
  }, [groupedResults]);

  // Format text for copying and saving
  const allMatchedText = useMemo(() => {
    return groupedResults.map(g => {
      return `[${g.noteTitle}]\n${g.paragraphs.join('\n\n')}`;
    }).join('\n\n---\n\n');
  }, [groupedResults]);

  const handleCopyAndCut = async () => {
    if (groupedResults.length === 0) return;
    try {
      await navigator.clipboard.writeText(allMatchedText);
      setCopied(true);
      
      const cutPayload = groupedResults.map(g => ({
        noteId: g.noteId,
        paragraphs: g.paragraphs
      }));

      // Pass formatted text as the third argument
      onCut(searchTerm, cutPayload, allMatchedText);
      
      setTimeout(() => {
        setCopied(false);
        onClose();
      }, 1500);
    } catch (err) {
      console.error('Failed to copy: ', err);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center p-0 sm:p-4">
      <div className="absolute inset-0 bg-black/90 backdrop-blur-md transition-opacity" onClick={onClose} />
      
      <div className="relative bg-[#0f0f0f] w-full max-w-2xl h-full sm:h-auto sm:max-h-[90vh] sm:rounded-3xl shadow-2xl overflow-hidden flex flex-col animate-in fade-in zoom-in duration-300 border border-white/10">
        {/* Header */}
        <div className="p-6 border-b border-white/10 flex items-center justify-between bg-[#161616]">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 bg-[#006064] text-white rounded-xl flex items-center justify-center shadow-lg">
              <Scissors size={20} />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">Dialogue Cutter</h2>
              <p className="text-[10px] text-[#00bcd4] font-bold uppercase tracking-widest">Folder: {folderName}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white/10 text-white/50 hover:text-white rounded-full transition-colors">
            <X size={24} />
          </button>
        </div>

        {/* Search Input */}
        <div className="p-6 bg-[#0f0f0f]">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30" size={20} />
            <input
              autoFocus
              type="text"
              placeholder="Search by name (e.g. 'রহিম')"
              className="w-full pl-12 pr-6 py-4 bg-white/5 border border-white/10 rounded-2xl focus:border-[#00bcd4] outline-none transition-all text-white font-medium text-lg placeholder-white/20"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        {/* Results List */}
        <div className="flex-1 overflow-y-auto p-6 custom-scrollbar bg-black/20">
          {!searchTerm ? (
            <div className="h-64 flex flex-col items-center justify-center text-white/20 space-y-4">
              <Search size={48} strokeWidth={1} />
              <p className="text-xs font-bold uppercase tracking-widest">Type a name to filter dialogues</p>
            </div>
          ) : groupedResults.length > 0 ? (
            <div className="space-y-8">
              {groupedResults.map((group, groupIdx) => (
                <div key={group.noteId} className="animate-in fade-in slide-in-from-bottom-4 duration-500" style={{ animationDelay: `${groupIdx * 100}ms` }}>
                  <div className="flex items-center gap-2 mb-4 px-1 sticky top-0 bg-[#0f0f0f]/80 backdrop-blur-sm py-2 z-10 border-b border-white/5">
                    <FileText size={16} className="text-[#00bcd4]" />
                    <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                      {group.noteTitle}
                    </h3>
                    <div className="flex-1 h-[1px] bg-white/10 ml-2" />
                    <span className="text-[10px] text-white/40 bg-white/5 px-2 py-0.5 rounded-full">
                      {group.paragraphs.length} items
                    </span>
                  </div>
                  
                  <div className="space-y-3">
                    {group.paragraphs.map((para, paraIdx) => (
                      <div 
                        key={`${group.noteId}-${paraIdx}`} 
                        className="group relative flex gap-3 p-5 bg-white/5 border border-white/10 rounded-2xl text-white/80 text-[16px] leading-relaxed shadow-sm hover:border-[#00bcd4]/30 transition-all hover:bg-white/[0.07]"
                      >
                        <div className="mt-1.5 shrink-0">
                          <ChevronRight size={14} className="text-[#00bcd4]/40 group-hover:text-[#00bcd4] transition-colors" />
                        </div>
                        <p className="flex-1">{para}</p>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="h-64 flex flex-col items-center justify-center text-rose-500/30 space-y-4">
              <AlertCircle size={48} strokeWidth={1} />
              <p className="text-xs font-bold uppercase tracking-widest">No matching dialogues found</p>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-6 border-t border-white/10 bg-[#161616] flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="flex flex-col">
            <div className="text-[11px] font-bold uppercase tracking-widest text-white/40">
              {totalMatches} Matches Across {groupedResults.length} Notes
            </div>
            <div className="text-[9px] text-[#00bcd4]/60 font-medium mt-1">
              Sorted A-Z within each note
            </div>
          </div>
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <button 
              onClick={onClose} 
              className="flex-1 sm:flex-none px-6 py-3 text-white/60 font-bold hover:text-white transition-all text-sm"
            >
              Cancel
            </button>
            <button
              disabled={totalMatches === 0 || copied}
              onClick={handleCopyAndCut}
              className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-8 py-3 rounded-xl font-bold transition-all shadow-xl
                ${copied 
                  ? 'bg-emerald-600 text-white' 
                  : totalMatches > 0 
                    ? 'bg-[#006064] text-white hover:bg-[#00838f] active:scale-95' 
                    : 'bg-white/5 text-white/20 cursor-not-allowed'
                }
              `}
            >
              {copied ? <><Check size={18} /> Done!</> : <><Copy size={18} /> Copy & Cut</>}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DialogueCutter;
