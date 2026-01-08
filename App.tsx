
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Note, Folder, SortOption, AppView } from './types';
import Sidebar from './components/Sidebar';
import Editor from './components/Editor';
import FolderView from './components/FolderView';
import DialogueCutter from './components/DialogueCutter';
import CreateFolderModal from './components/CreateFolderModal';
import RecycleBin from './components/RecycleBin';
import { Plus, Search, Menu as MenuIcon, X, Sun, Moon, ChevronDown, FolderPlus, FilePlus, Settings, Trash2 } from 'lucide-react';

const STORAGE_KEY = 'noteflow_v4_data';
const THEME_KEY = 'noteflow_theme';

const App: React.FC = () => {
  const [folders, setFolders] = useState<Folder[]>([]);
  const [notes, setNotes] = useState<Note[]>([]);
  const [activeFolderId, setActiveFolderId] = useState<string | null>('default');
  const [activeNoteId, setActiveNoteId] = useState<string | null>(null);
  const [currentView, setCurrentView] = useState<AppView>('folders');
  
  const [isDialogueCutterOpen, setIsDialogueCutterOpen] = useState(false);
  const [isFolderModalOpen, setIsFolderModalOpen] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [sortOption, setSortOption] = useState<SortOption>('modified_newest');
  
  const createMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const savedData = localStorage.getItem(STORAGE_KEY);
    if (savedData) {
      try {
        const parsed = JSON.parse(savedData);
        setFolders(parsed.folders || []);
        setNotes(parsed.notes || []);
      } catch (e) {
        console.error("Critical: Failed to load storage", e);
      }
    } else {
      const defaultFolder: Folder = { id: 'default', name: 'General', createdAt: Date.now(), parentId: null };
      setFolders([defaultFolder]);
      setActiveFolderId('default');
    }

    const savedTheme = localStorage.getItem(THEME_KEY);
    if (savedTheme === 'light') {
      setIsDarkMode(false);
      document.documentElement.classList.remove('dark');
    } else {
      setIsDarkMode(true);
      document.documentElement.classList.add('dark');
    }
  }, []);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ folders, notes }));
  }, [folders, notes]);

  const toggleDarkMode = () => {
    const newMode = !isDarkMode;
    setIsDarkMode(newMode);
    if (newMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem(THEME_KEY, 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem(THEME_KEY, 'light');
    }
  };

  const handleCreateFolder = (name: string) => {
    const newFolder: Folder = { 
      id: Date.now().toString(), 
      name, 
      createdAt: Date.now(),
      parentId: activeFolderId,
      isDeleted: false
    };
    setFolders(prev => [...prev, newFolder]);
    setActiveFolderId(newFolder.id);
    setActiveNoteId(null);
  };

  const createNote = () => {
    let folderId = activeFolderId;
    if (!folderId && folders.length > 0) {
      folderId = folders[0].id;
    } else if (!folderId) {
      folderId = 'default';
    }
    
    const now = Date.now();
    const newNote: Note = {
      id: now.toString(),
      folderId: folderId!,
      title: '',
      content: '',
      updatedAt: now,
      createdAt: now,
      color: '#ffffff',
      isDeleted: false
    };
    setNotes(prev => [newNote, ...prev]);
    setActiveNoteId(newNote.id);
  };

  const updateNote = (id: string, updates: Partial<Note>) => {
    setNotes(prevNotes => prevNotes.map(n => n.id === id ? { ...n, ...updates, updatedAt: Date.now() } : n));
  };

  const deleteMultipleItems = useCallback((noteIds: Set<string>, folderIds: Set<string>) => {
    const findAllDescendants = (fIds: Set<string>, allFolders: Folder[]): Set<string> => {
      const result = new Set<string>(fIds);
      let added = true;
      while (added) {
        added = false;
        allFolders.forEach(f => {
          if (f.parentId && result.has(f.parentId) && !result.has(f.id)) {
            result.add(f.id);
            added = true;
          }
        });
      }
      return result;
    };

    const finalFolderIdsToDelete = findAllDescendants(folderIds, folders);
    const now = Date.now();

    setNotes(prev => prev.map(n => 
      (noteIds.has(n.id) || finalFolderIdsToDelete.has(n.folderId)) 
      ? { ...n, isDeleted: true, deletedAt: now } 
      : n
    ));
    
    setFolders(prev => prev.map(f => 
      finalFolderIdsToDelete.has(f.id) 
      ? { ...f, isDeleted: true, deletedAt: now } 
      : f
    ));

    if (activeNoteId && noteIds.has(activeNoteId)) setActiveNoteId(null);
  }, [folders, activeNoteId]);

  const permanentDelete = useCallback((noteIds: Set<string>, folderIds: Set<string>) => {
    const allFoldersToPurge = new Set<string>(folderIds);
    let added = true;
    while (added) {
      added = false;
      folders.forEach(f => {
        if (f.parentId && allFoldersToPurge.has(f.parentId) && !allFoldersToPurge.has(f.id)) {
          allFoldersToPurge.add(f.id);
          added = true;
        }
      });
    }
    setNotes(prev => prev.filter(n => !noteIds.has(n.id) && !allFoldersToPurge.has(n.folderId)));
    setFolders(prev => prev.filter(f => !allFoldersToPurge.has(f.id)));
  }, [folders]);

  const restoreItems = useCallback((noteIds: Set<string>, folderIds: Set<string>) => {
    setNotes(prev => prev.map(n => noteIds.has(n.id) ? { ...n, isDeleted: false, deletedAt: undefined } : n));
    setFolders(prev => prev.map(f => folderIds.has(f.id) ? { ...f, isDeleted: false, deletedAt: undefined } : f));
  }, []);

  const handleSaveAndCloseNote = () => setActiveNoteId(null);

  const handleCutDialogues = (searchWord: string, cutPayload: { noteId: string, paragraphs: string[] }[], formattedContent: string) => {
    let cutsFolderId: string;
    const existingCutsFolder = folders.find(f => f.name === 'Cuts' && f.parentId === activeFolderId && !f.isDeleted);
    
    if (existingCutsFolder) {
      cutsFolderId = existingCutsFolder.id;
    } else {
      cutsFolderId = `cuts_${Date.now()}`;
      const newCutsFolder: Folder = { 
        id: cutsFolderId, 
        name: 'Cuts', 
        createdAt: Date.now(), 
        parentId: activeFolderId,
        isDeleted: false 
      };
      setFolders(prev => [...prev, newCutsFolder]);
    }

    const now = Date.now();
    const resultNote: Note = { 
      id: `result_${now}`, 
      folderId: cutsFolderId, 
      title: searchWord.toUpperCase(), 
      content: formattedContent, 
      updatedAt: now, 
      createdAt: now, 
      color: '#006064',
      isDeleted: false 
    };

    setNotes(prevNotes => {
      const updatedOriginals = prevNotes.map(note => {
        const matchingCut = cutPayload.find(cp => cp.noteId === note.id);
        if (!matchingCut) return note;
        const lines = note.content.split(/\n\n+/);
        const filteredLines = lines.filter(line => !matchingCut.paragraphs.includes(line.trim()));
        return { ...note, content: filteredLines.join('\n\n'), updatedAt: Date.now() };
      });
      return [resultNote, ...updatedOriginals];
    });
  };

  const handleAutoCutDialogues = () => {
    if (!activeFolderId) return;
    const folderNotes = notes.filter(n => n.folderId === activeFolderId && !n.isDeleted);
    if (folderNotes.length === 0) {
      alert("এই ফোল্ডারে কোনো নোট নেই।");
      return;
    }

    // characterMap: Character -> Note Title -> Paragraphs[]
    const currentRunMap: Record<string, Record<string, string[]>> = {};
    const now = Date.now();
    let allNotesSnapshot = [...notes];

    // 1. Extract dialogues from the current active folder notes
    folderNotes.forEach(note => {
      const paragraphs = note.content.split(/\n\n+/);
      const remainingParagraphs: string[] = [];
      const noteTitle = note.title || 'Untitled';

      paragraphs.forEach(p => {
        const trimmed = p.trim();
        const match = trimmed.match(/^([^:\-\|\n]+)[:\-\|]/);
        if (match) {
          const charName = match[1].trim();
          if (!currentRunMap[charName]) currentRunMap[charName] = {};
          if (!currentRunMap[charName][noteTitle]) currentRunMap[charName][noteTitle] = [];
          currentRunMap[charName][noteTitle].push(trimmed);
        } else {
          remainingParagraphs.push(trimmed);
        }
      });

      // Update original notes to remove the cut dialogues
      const noteIdx = allNotesSnapshot.findIndex(n => n.id === note.id);
      if (noteIdx !== -1) {
        allNotesSnapshot[noteIdx] = { ...allNotesSnapshot[noteIdx], content: remainingParagraphs.join('\n\n'), updatedAt: now };
      }
    });

    const charactersFound = Object.keys(currentRunMap);
    if (charactersFound.length === 0) {
      alert("কোনো নতুন সংলাপ খুঁজে পাওয়া যায়নি।");
      return;
    }

    // 2. Setup the target AutoCuts folder
    const activeFolderObj = folders.find(f => f.id === activeFolderId);
    const targetAutoCutsName = `${activeFolderObj?.name || 'New'}_AutoCuts`;
    const existingAutoCutsFolder = folders.find(f => f.name === targetAutoCutsName && f.parentId === activeFolderId && !f.isDeleted);
    
    let autoCutsFolderId: string;
    let updatedFolders = [...folders];
    if (existingAutoCutsFolder) {
      autoCutsFolderId = existingAutoCutsFolder.id;
    } else {
      autoCutsFolderId = `autocuts_${now}`;
      const newAutoCutsFolder: Folder = { id: autoCutsFolderId, name: targetAutoCutsName, createdAt: now, parentId: activeFolderId, isDeleted: false };
      updatedFolders.push(newAutoCutsFolder);
    }

    // 3. Process each character and merge with existing data
    charactersFound.forEach((name, charIdx) => {
      const charNameUpper = name.toUpperCase();
      const existingCharNoteIdx = allNotesSnapshot.findIndex(n => n.folderId === autoCutsFolderId && n.title.toUpperCase() === charNameUpper && !n.isDeleted);

      let combinedData: Record<string, string[]> = { ...currentRunMap[name] };

      if (existingCharNoteIdx !== -1) {
        const existingNote = allNotesSnapshot[existingCharNoteIdx];
        
        // Parse existing content back into combinedData
        // Format: [Title]\nParagraphs\n\n---\n\n[Title]
        const sections = existingNote.content.split(/\n\n---\n\n/);
        sections.forEach(section => {
          const match = section.match(/^\[(.*?)\]\n([\s\S]*)/);
          if (match) {
            const title = match[1];
            const content = match[2];
            const paras = content.split(/\n\n+/).map(p => p.trim()).filter(p => p);
            
            if (combinedData[title]) {
              // Merge paragraphs if title matches (preventing duplicates)
              const existingParas = new Set(combinedData[title]);
              paras.forEach(p => existingParas.add(p));
              combinedData[title] = Array.from(existingParas);
            } else {
              combinedData[title] = paras;
            }
          }
        });
      }

      // 4. Sort everything A-Z by Title and generate final string
      const sortedTitles = Object.keys(combinedData).sort((a, b) => a.localeCompare(b, 'bn'));
      const newFormattedContent = sortedTitles
        .map(title => `[${title}]\n${combinedData[title].join('\n\n')}`)
        .join('\n\n---\n\n');

      if (existingCharNoteIdx !== -1) {
        allNotesSnapshot[existingCharNoteIdx] = { 
          ...allNotesSnapshot[existingCharNoteIdx], 
          content: newFormattedContent, 
          updatedAt: now 
        };
      } else {
        allNotesSnapshot.push({ 
          id: `auto_${now}_${charIdx}`, 
          folderId: autoCutsFolderId, 
          title: charNameUpper, 
          content: newFormattedContent, 
          updatedAt: now, 
          createdAt: now, 
          isDeleted: false, 
          color: '#006064' 
        });
      }
    });

    setFolders(updatedFolders);
    setNotes(allNotesSnapshot);
    alert(`${charactersFound.length}টি চরিত্রের সংলাপ একত্রিত এবং সিরিয়াল অনুযায়ী সেভ করা হয়েছে।`);
  };

  const visibleFolders = folders.filter(f => !f.isDeleted);
  const visibleNotes = notes.filter(n => !n.isDeleted);
  const activeNote = visibleNotes.find(n => n.id === activeNoteId) || null;
  const activeFolder = visibleFolders.find(f => f.id === activeFolderId) || null;
  const folderNotes = activeFolderId ? visibleNotes.filter(n => n.folderId === activeFolderId) : [];
  const subFolders = visibleFolders.filter(f => f.parentId === activeFolderId);
  
  const handleGoBack = () => {
    if (activeFolder && activeFolder.parentId) { setActiveFolderId(activeFolder.parentId); } else { setActiveFolderId('default'); }
  };

  const handleNavClick = (view: AppView) => {
    setCurrentView(view);
    setIsSidebarOpen(false);
    if (view === 'folders') { setActiveFolderId('default'); setActiveNoteId(null); }
  };

  return (
    <div className={`flex h-screen w-full overflow-hidden transition-colors duration-300 ${isDarkMode ? 'dark bg-[#0a0a0a] text-slate-100' : 'bg-[#f8fafc] text-slate-900'}`}>
      {isSidebarOpen && <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 transition-opacity" onClick={() => setIsSidebarOpen(false)} />}
      <div className={`fixed inset-y-0 left-0 z-[60] w-72 h-full bg-[#111] border-r border-white/5 transition-transform duration-300 ease-in-out shadow-2xl ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="flex flex-col h-full">
          <div className="p-6 border-b border-white/5 flex items-center justify-between">
            <h2 className="text-xl font-black text-[#00bcd4] tracking-tighter">NoteFlow</h2>
            <button onClick={() => setIsSidebarOpen(false)} className="p-2 text-white/40 hover:text-white transition-colors"><X size={20} /></button>
          </div>
          <div className="flex-1 py-4 flex flex-col gap-1">
            <button onClick={() => handleNavClick('folders')} className={`flex items-center gap-4 px-6 py-4 transition-all ${currentView === 'folders' ? 'bg-[#006064] text-white' : 'text-white/60 hover:bg-white/5'}`}>
              <FilePlus size={20} /> <span className="font-bold">My Notes</span>
            </button>
            <button onClick={() => handleNavClick('trash')} className={`flex items-center gap-4 px-6 py-4 transition-all ${currentView === 'trash' ? 'bg-rose-900 text-white' : 'text-white/60 hover:bg-white/5'}`}>
              <Trash2 size={20} /> <span className="font-bold">Recycle Bin</span>
            </button>
            <button onClick={() => handleNavClick('settings')} className={`flex items-center gap-4 px-6 py-4 transition-all ${currentView === 'settings' ? 'bg-indigo-900 text-white' : 'text-white/60 hover:bg-white/5'}`}>
              <Settings size={20} /> <span className="font-bold">Settings</span>
            </button>
          </div>
          <div className="p-6 border-t border-white/5 flex items-center justify-between">
            <button onClick={toggleDarkMode} className="p-2 text-white/40 hover:text-[#00bcd4] transition-colors">{isDarkMode ? <Sun size={18} /> : <Moon size={18} />}</button>
          </div>
        </div>
      </div>
      <main className="flex-1 flex flex-col min-w-0 w-full relative bg-black">
        <div className="flex-1 overflow-auto relative custom-scrollbar">
          {activeNote ? (
            <Editor 
                note={activeNote} 
                onUpdate={(updates) => updateNote(activeNote.id, updates)} 
                onSave={handleSaveAndCloseNote} 
                isDarkMode={isDarkMode} 
                folders={visibleFolders}
            />
          ) : currentView === 'trash' ? (
            <RecycleBin 
                notes={notes.filter(n => n.isDeleted)} 
                folders={folders.filter(f => f.isDeleted)} 
                onRestore={restoreItems} 
                onPermanentDelete={permanentDelete} 
                onBack={() => setCurrentView('folders')} 
            />
          ) : currentView === 'settings' ? (
            <div className="p-10 text-white flex flex-col gap-6">
                <div className="flex items-center gap-4">
                    <button onClick={() => setCurrentView('folders')} className="p-2 hover:bg-white/10 rounded-full"><X size={24} /></button>
                    <h2 className="text-2xl font-black">Settings</h2>
                </div>
                <div className="p-20 border-2 border-dashed border-white/5 rounded-3xl text-center text-white/20">
                    <Settings size={64} className="mx-auto mb-4 opacity-20" />
                    <p className="font-bold uppercase tracking-widest">Settings are coming soon...</p>
                </div>
            </div>
          ) : activeFolderId ? (
            <FolderView 
                notes={folderNotes} 
                subFolders={subFolders} 
                sortOption={sortOption} 
                setSortOption={setSortOption} 
                onNoteSelect={setActiveNoteId} 
                onFolderSelect={setActiveFolderId} 
                onDeleteNote={(id) => deleteMultipleItems(new Set([id]), new Set())} 
                onDeleteFolder={(id) => deleteMultipleItems(new Set(), new Set([id]))} 
                onDeleteMultiple={deleteMultipleItems} 
                folderName={activeFolder?.name || ''} 
                onBack={handleGoBack} 
                onCreateNote={createNote} 
                onOpenFolderModal={() => setIsFolderModalOpen(true)} 
                onOpenDialogueCutter={() => setIsDialogueCutterOpen(true)}
                onAutoCutDialogues={handleAutoCutDialogues}
                showMenuIcon={activeFolderId === 'default'}
                onToggleSidebar={() => setIsSidebarOpen(true)}
            />
          ) : null}
        </div>
      </main>
      <CreateFolderModal isOpen={isFolderModalOpen} onClose={() => setIsFolderModalOpen(false)} onCreate={handleCreateFolder} />
      {isDialogueCutterOpen && <DialogueCutter isOpen={isDialogueCutterOpen} onClose={() => setIsDialogueCutterOpen(false)} notes={folderNotes} onCut={handleCutDialogues} isDarkMode={isDarkMode} folderName={activeFolder?.name || ''} />}
    </div>
  );
};

export default App;
