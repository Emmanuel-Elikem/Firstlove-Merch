import React, { useRef } from 'react';
import { ColorOption } from '../types/merch';
import { ActualShirtPhoto } from './ActualShirtPhoto';
import { Check, Camera, Upload, Sparkles } from 'lucide-react';

interface ShirtPhotoCardProps {
  color: ColorOption;
  isSelected?: boolean;
  onSelect?: () => void;
  customPhoto?: string;
  onUploadPhoto?: (file: File) => void;
}

export const ShirtPhotoCard: React.FC<ShirtPhotoCardProps> = ({
  color,
  isSelected = false,
  onSelect,
  customPhoto,
  onUploadPhoto,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const photoSrc = customPhoto || color.imageFile;
  const isBasonta = color.category === 'basonta';

  const handleCardClick = (e: React.MouseEvent) => {
    // If target was file input, don't trigger selection
    if ((e.target as HTMLElement).tagName === 'INPUT') return;
    onSelect?.();
  };

  const handleUploadClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && onUploadPhoto) {
      onUploadPhoto(file);
    }
  };

  return (
    <div
      onClick={handleCardClick}
      className={`relative w-full rounded-2xl overflow-hidden transition-all duration-300 cursor-pointer group flex flex-col justify-between ${
        isSelected
          ? 'ring-2 ring-blue-500 shadow-xl shadow-blue-500/20 border-blue-500'
          : 'border border-neutral-800 hover:border-neutral-700 hover:shadow-lg'
      } bg-neutral-900`}
    >
      {/* Hidden file input */}
      {onUploadPhoto && (
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleFileChange}
        />
      )}

      {/* Studio Photo Display / Upload Area */}
      <div className="relative w-full bg-neutral-950 rounded-t-2xl overflow-hidden">
        <ActualShirtPhoto
          color={color}
          customPhoto={customPhoto}
          onUploadPhoto={onUploadPhoto}
          allowDirectUpload={true}
        />

        {/* Selected badge overlay */}
        {isSelected && (
          <div className="absolute top-2.5 right-2.5 px-2.5 py-1 rounded-full bg-blue-600 text-white text-[11px] font-bold shadow-md flex items-center gap-1 z-10">
            <Check className="w-3 h-3" />
            <span>Selected</span>
          </div>
        )}
      </div>

      {/* Card Info Details */}
      <div className="p-3.5 bg-neutral-900 border-t border-neutral-800 flex items-center justify-between gap-2">
        <div className="overflow-hidden">
          <h4 className="text-xs sm:text-sm font-bold text-white truncate">{color.name}</h4>
        </div>

        <div className="text-right shrink-0 flex items-center gap-1.5">
          {/* Quick upload icon button */}
          {onUploadPhoto && (
            <button
              type="button"
              onClick={handleUploadClick}
              className={`p-1.5 rounded-lg border text-xs font-semibold transition-colors cursor-pointer ${
                photoSrc
                  ? 'bg-neutral-800 hover:bg-neutral-700 text-neutral-300 border-neutral-700'
                  : 'bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border-amber-500/40'
              }`}
              title={photoSrc ? 'Change Image' : 'Upload Image'}
            >
              <Camera className="w-3.5 h-3.5" />
            </button>
          )}

          <button
            type="button"
            className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
              isSelected
                ? 'bg-blue-600 text-white shadow-sm'
                : 'bg-neutral-800 text-neutral-300 group-hover:bg-blue-600 group-hover:text-white'
            }`}
          >
            {isSelected ? 'Selected' : 'Select'}
          </button>
        </div>
      </div>
    </div>
  );
};
