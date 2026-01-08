
import React from 'react';
import { Note } from '../types';
import { X, Check, Calendar, Type, FileText, Hash } from 'lucide-react';

interface NoteInfoModalProps {
  isOpen: boolean;
  onClose: () => void;
  note: Note;
}

const NoteInfoModal: React.FC<NoteInfoModalProps> = ({ isOpen, onClose, note }) => {
  if (!isOpen) return null;

  const characterCount = note.content.length;
  const wordCount = note.content.trim() === '' ? 0 : note.content.trim().split(/\s+/).length;

  const formatDate = (timestamp: number) => {
    const options: Intl.DateTimeFormatOptions = {
      weekday: 'short',
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    };
    return new Intl.DateTimeFormat('en-GB', options).format(new Date(timestamp));
  };

  return (
    <div className="fixed inset-0 z-[200] bg-black flex flex-col animate-in fade-in duration-300">
      {/* Header */}
      <header className="bg-[#006064] h-14 flex items-center justify-between px-4 shrink-0">
        <div className="flex items-center gap-4">
          <div className="w-8 h-8 rounded-full border-2 border-white flex items-center justify-center">
            <span className="text-white font-serif italic font-bold">i</span>
          </div>
          <h2 className="text-white text-xl font-medium">Info</h2>
        </div>
        <button 
          onClick={onClose}
          className="p-2 text-white hover:bg-white/10 rounded-full transition-colors"
        >
          <Check size={30} strokeWidth={2.5} />
        </button>
      </header>

      {/* List Content */}
      <div className="flex-1 bg-black overflow-y-auto">
        <div className="flex flex-col">
          {/* Creation Date */}
          <div className="flex items-center gap-5 p-5 border-b border-white/10">
            <div className="text-white/60">
              <Calendar size={32} strokeWidth={1.5} />
            </div>
            <div className="flex flex-col">
              <span className="text-white text-lg">Creation date</span>
              <span className="text-white/60 text-sm">{formatDate(note.createdAt)}</span>
            </div>
          </div>

          {/* Word Count */}
          <div className="flex items-center gap-5 p-5 border-b border-white/10">
            <div className="relative text-white/60">
              <FileText size={32} strokeWidth={1.5} />
              <div className="absolute -top-1 -right-1 bg-black border border-white/40 px-0.5 text-[8px] font-bold">W</div>
            </div>
            <div className="flex flex-col">
              <span className="text-white text-lg">Word count</span>
              <span className="text-white/60 text-sm">{wordCount}</span>
            </div>
          </div>

          {/* Character Count */}
          <div className="flex items-center gap-5 p-5 border-b border-white/10">
             <div className="relative text-white/60">
              <Type size={32} strokeWidth={1.5} />
              <div className="absolute -bottom-1 -right-1 bg-black border border-white/40 px-0.5 text-[8px] font-bold">abc</div>
            </div>
            <div className="flex flex-col">
              <span className="text-white text-lg">Character count</span>
              <span className="text-white/60 text-sm">{characterCount}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NoteInfoModal;
