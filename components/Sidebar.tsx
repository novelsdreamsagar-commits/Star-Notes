
import React from 'react';
import { Folder, Note } from '../types';
import { Folder as FolderIcon, FileText, Trash2, ChevronRight } from 'lucide-react';

interface SidebarProps {
  folders: Folder[];
  activeFolderId: string | null;
  setActiveFolderId: (id: string) => void;
  notes: Note[];
  activeNoteId: string | null;
  setActiveNoteId: (id: string) => void;
  deleteNote: (id: string) => void;
}

const Sidebar: React.FC<SidebarProps> = ({
  folders, activeFolderId, setActiveFolderId,
  notes, activeNoteId, setActiveNoteId, deleteNote
}) => {
  return (
    <div className="flex flex-col h-full bg-slate-50 dark:bg-slate-950">
      <div className="p-6">
        <h2 className="text-xs font-bold uppercase tracking-[0.2em] text-slate-400 mb-6">Library</h2>
        
        {/* Folders Section */}
        <div className="space-y-1 mb-10">
          <h3 className="text-[10px] font-bold text-slate-500 uppercase px-3 mb-2">Folders</h3>
          {folders.map(folder => (
            <button
              key={folder.id}
              onClick={() => setActiveFolderId(folder.id)}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-semibold transition-all group ${
                activeFolderId === folder.id 
                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20' 
                : 'text-slate-600 dark:text-slate-400 hover:bg-white dark:hover:bg-slate-900'
              }`}
            >
              <FolderIcon size={16} fill={activeFolderId === folder.id ? "currentColor" : "none"} />
              <span className="truncate flex-1 text-left">{folder.name}</span>
              <ChevronRight size={14} className={`opacity-0 group-hover:opacity-100 transition-opacity ${activeFolderId === folder.id ? 'text-indigo-200' : 'text-slate-300'}`} />
            </button>
          ))}
        </div>

        {/* Active Folder Notes Section */}
        <div className="flex flex-col flex-1 overflow-hidden">
          <h3 className="text-[10px] font-bold text-slate-500 uppercase px-3 mb-2">Notes</h3>
          <div className="space-y-1 overflow-y-auto max-h-[60vh] custom-scrollbar">
            {activeFolderId ? (
              notes.length === 0 ? (
                <div className="p-4 text-center text-[10px] text-slate-400 italic">No notes in this folder</div>
              ) : (
                notes.map(note => (
                  <div
                    key={note.id}
                    className={`group relative flex items-center justify-between p-3 rounded-xl cursor-pointer transition-all border ${
                      activeNoteId === note.id
                      ? 'bg-white dark:bg-slate-900 border-indigo-200 dark:border-indigo-900 shadow-sm'
                      : 'bg-transparent border-transparent hover:bg-white dark:hover:bg-slate-900 hover:border-slate-200 dark:hover:border-slate-800'
                    }`}
                    onClick={() => setActiveNoteId(note.id)}
                  >
                    <div className="flex flex-col min-w-0 pr-6">
                      <h4 className={`text-sm font-bold truncate ${activeNoteId === note.id ? 'text-indigo-900 dark:text-indigo-100' : 'text-slate-700 dark:text-slate-300'}`}>
                        {note.title || 'Untitled'}
                      </h4>
                      <p className="text-[10px] text-slate-400 truncate mt-1">
                        {note.content.substring(0, 30) || 'Empty note...'}
                      </p>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteNote(note.id);
                      }}
                      className="opacity-0 group-hover:opacity-100 p-1.5 text-slate-300 hover:text-rose-500 transition-all absolute right-2"
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                ))
              )
            ) : (
              <div className="p-4 text-center text-[10px] text-slate-400 italic">Select a folder to see notes</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
