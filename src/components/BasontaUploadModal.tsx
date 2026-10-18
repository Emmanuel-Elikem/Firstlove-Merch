import React, { useState, useRef } from 'react';
import { ColorOption } from '../types/merch';
import { sanitizeBasontas } from '../data/merchData';
import { X, Upload, Camera, Check, Plus, Sparkles, Image as ImageIcon, Trash2 } from 'lucide-react';

interface BasontaUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  basontas: ColorOption[];
  customPhotos: Record<string, string>;
  onUploadPhoto: (shirtId: string, file: File) => void;
  onAddNewBasonta?: (name: string, file?: File) => void;
  onDeleteBasonta?: (shirtId: string) => void;
}

export const BasontaUploadModal: React.FC<BasontaUploadModalProps> = ({
  isOpen,
  onClose,
  basontas,
  customPhotos,
  onUploadPhoto,
  onAddNewBasonta,
  onDeleteBasonta,
}) => {
  const [newBasontaName, setNewBasontaName] = useState('');
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [newBasontaFile, setNewBasontaFile] = useState<File | null>(null);
  const activeInputRef = useRef<{ [key: string]: HTMLInputElement | null }>({});

  if (!isOpen) return null;

  const handleFileSelect = (shirtId: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onUploadPhoto(shirtId, file);
    }
  };

  const handleCreateNewBasonta = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBasontaName.trim()) return;
    onAddNewBasonta?.(newBasontaName.trim(), newBasontaFile || undefined);
    setNewBasontaName('');
    setNewBasontaFile(null);
    setIsAddingNew(false);
  };

  const cleanList = sanitizeBasontas(basontas);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-3xl max-h-[90vh] bg-neutral-900 border border-neutral-800 rounded-3xl shadow-2xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="p-6 border-b border-neutral-800 flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 text-xs font-bold text-amber-400 uppercase tracking-wider mb-1">
              <Camera className="w-4 h-4" />
              <span>Direct Photo Manager</span>
            </div>
            <h3 className="text-xl sm:text-2xl font-black text-white tracking-tight">
              Upload Basonta Shirt Images
            </h3>
            <p className="text-xs text-neutral-400 mt-1">
              Directly upload your authentic photos for each Basonta. You can also add more wings at any time.
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-400 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable list of Basontas */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {cleanList.map((b) => {
              const photoSrc = customPhotos[b.id] || b.imageFile;
              const hasPhoto = Boolean(photoSrc);
              const isDefaultWing = [
                'dancing-stars',
                'film-stars',
                'fragrance-ministry',
                'lovelets',
                'ushers',
                'hearing-and-seeing',
                'culinary-stars',
                'worship-stars',
                'sheep-seeking',
              ].includes(b.id);

              return (
                <div
                  key={b.id}
                  className="p-4 rounded-2xl bg-neutral-950/80 border border-neutral-800 flex items-center justify-between gap-4 group hover:border-neutral-700 transition-colors"
                >
                  {/* Thumbnail / Upload Slot */}
                  <div
                    onClick={() => activeInputRef.current[b.id]?.click()}
                    className="relative w-16 h-20 rounded-xl overflow-hidden bg-neutral-900 border border-neutral-800 flex items-center justify-center shrink-0 cursor-pointer hover:border-amber-500/60 transition-colors"
                  >
                    {hasPhoto ? (
                      <img
                        src={photoSrc}
                        alt={b.name}
                        className="w-full h-full object-contain p-1"
                      />
                    ) : (
                      <div className="flex flex-col items-center justify-center text-neutral-500">
                        <Upload className="w-5 h-5 text-amber-400 mb-1" />
                        <span className="text-[9px] uppercase font-bold text-amber-400">Empty</span>
                      </div>
                    )}

                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                      <Camera className="w-4 h-4 text-white" />
                    </div>
                  </div>

                  {/* Info & Status */}
                  <div className="flex-1 min-w-0">
                    <h4 className="text-sm font-bold text-white truncate">{b.name}</h4>
                    <div className="mt-1 flex items-center gap-1.5 text-[11px]">
                      {hasPhoto ? (
                        <span className="text-emerald-400 font-semibold flex items-center gap-1">
                          <Check className="w-3 h-3" /> Image Active
                        </span>
                      ) : (
                        <span className="text-amber-400/90 font-medium">
                          Awaiting your photo
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1.5">
                    <input
                      ref={(el) => {
                        activeInputRef.current[b.id] = el;
                      }}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => handleFileSelect(b.id, e)}
                    />
                    <button
                      type="button"
                      onClick={() => activeInputRef.current[b.id]?.click()}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                        hasPhoto
                          ? 'bg-neutral-800 hover:bg-neutral-700 text-neutral-200 border border-neutral-700'
                          : 'bg-amber-500 hover:bg-amber-400 text-neutral-950 shadow-md shadow-amber-500/20'
                      }`}
                    >
                      <Camera className="w-3.5 h-3.5" />
                      <span>{hasPhoto ? 'Change' : 'Upload'}</span>
                    </button>

                    {onDeleteBasonta && !isDefaultWing && (
                      <button
                        type="button"
                        onClick={() => onDeleteBasonta(b.id)}
                        className="p-1.5 rounded-xl text-neutral-500 hover:text-red-400 hover:bg-red-500/10 transition-colors cursor-pointer"
                        title={`Delete ${b.name}`}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Add Another Basonta Section */}
          <div className="pt-4 border-t border-neutral-800">
            {!isAddingNew ? (
              <button
                type="button"
                onClick={() => setIsAddingNew(true)}
                className="w-full py-3 px-4 rounded-2xl border-2 border-dashed border-neutral-800 hover:border-amber-500/60 hover:bg-neutral-800/40 text-neutral-300 text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer"
              >
                <Plus className="w-4 h-4 text-amber-400" />
                <span>Add Another Basonta Wing</span>
              </button>
            ) : (
              <form onSubmit={handleCreateNewBasonta} className="p-4 rounded-2xl bg-neutral-950 border border-neutral-800 space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                    <span>Create New Basonta Slot</span>
                  </h4>
                  <button
                    type="button"
                    onClick={() => setIsAddingNew(false)}
                    className="text-xs text-neutral-500 hover:text-white"
                  >
                    Cancel
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] font-semibold text-neutral-400 block mb-1">
                      Basonta Name (e.g. &quot;Ushering Wing&quot;)
                    </label>
                    <input
                      type="text"
                      value={newBasontaName}
                      onChange={(e) => setNewBasontaName(e.target.value)}
                      placeholder="Enter name on shirt"
                      required
                      className="w-full px-3 py-2 rounded-xl bg-neutral-900 border border-neutral-800 text-white text-xs focus:border-blue-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-semibold text-neutral-400 block mb-1">
                      Shirt Image (Optional now, can upload later)
                    </label>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => setNewBasontaFile(e.target.files?.[0] || null)}
                      className="w-full text-xs text-neutral-400 file:mr-2 file:py-1 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-neutral-800 file:text-neutral-200 hover:file:bg-neutral-700 cursor-pointer"
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsAddingNew(false)}
                    className="px-3 py-1.5 rounded-xl bg-neutral-900 text-neutral-400 text-xs font-semibold"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold"
                  >
                    Save Basonta Slot
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-neutral-800 bg-neutral-950 flex items-center justify-between text-xs">
          <span className="text-neutral-500">
            Uploaded images are saved directly to the server and appear instantly in the store.
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-white font-bold transition-colors cursor-pointer"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
