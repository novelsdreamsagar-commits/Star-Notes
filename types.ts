
export interface Note {
  id: string;
  folderId: string;
  title: string;
  content: string;
  updatedAt: number;
  createdAt: number;
  color?: string;
  isDeleted?: boolean;
  deletedAt?: number;
}

export interface Folder {
  id: string;
  name: string;
  createdAt: number;
  parentId?: string | null;
  isDeleted?: boolean;
  deletedAt?: number;
}

export type SortOption = 
  | 'title' 
  | 'modified_newest' 
  | 'modified_oldest' 
  | 'created_newest' 
  | 'created_oldest' 
  | 'color' 
  | 'folder';

export interface DialogueCutResult {
  noteId: string;
  noteTitle: string;
  paragraphs: string[];
}

export type AppView = 'folders' | 'trash' | 'settings';
