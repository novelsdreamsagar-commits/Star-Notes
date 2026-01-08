
import React, { useState } from 'react';

interface CreateFolderModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (name: string) => void;
}

const CreateFolderModal: React.FC<CreateFolderModalProps> = ({ isOpen, onClose, onCreate }) => {
  const [name, setName] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim()) {
      onCreate(name.trim());
      setName('');
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-6">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-[2px]" onClick={onClose} />
      
      {/* Modal Box with Teal Border */}
      <div className="relative bg-[#0a0a0a] w-full max-w-[320px] rounded-lg border-[1.5px] border-[#006064] shadow-2xl animate-in fade-in zoom-in duration-200">
        <form onSubmit={handleSubmit} className="p-6">
          <h2 className="text-xl font-bold text-white mb-8">New folder</h2>
          
          <div className="relative mb-10">
            <input
              autoFocus
              type="text"
              placeholder="Folder name"
              className="w-full bg-transparent border-b border-white/40 focus:border-[#00bcd4] outline-none text-white text-lg py-1 transition-all placeholder-white/30"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          <div className="flex justify-end gap-8">
            <button
              type="button"
              onClick={onClose}
              className="text-white font-bold text-sm uppercase tracking-wider hover:text-[#00bcd4] transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!name.trim()}
              className={`font-bold text-sm uppercase tracking-wider transition-colors ${
                name.trim() ? 'text-white hover:text-[#00bcd4]' : 'text-white/20'
              }`}
            >
              OK
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateFolderModal;
