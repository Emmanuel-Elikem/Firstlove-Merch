import React, { useState, useRef } from 'react';
import { ColorOption } from '../types/merch';
import { Upload, Camera, Image as ImageIcon, Sparkles } from 'lucide-react';

interface ActualShirtPhotoProps {
  color: ColorOption;
  customPhoto?: string;
  className?: string;
  onUploadPhoto?: (file: File) => void;
  allowDirectUpload?: boolean;
}

export const ActualShirtPhoto: React.FC<ActualShirtPhotoProps> = ({
  color,
  customPhoto,
  className = '',
  onUploadPhoto,
  allowDirectUpload = true,
}) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const photoSrc = customPhoto || color.imageFile;
  const isBasonta = color.category === 'basonta';

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && onUploadPhoto) {
      onUploadPhoto(file);
    }
  };

  const triggerUpload = (e: React.MouseEvent) => {
    e.stopPropagation();
    fileInputRef.current?.click();
  };

  return (
    <div
      className={`relative w-full aspect-[4/5] bg-neutral-950 rounded-xl overflow-hidden flex items-center justify-center select-none group ${className}`}
    >
      {/* Hidden File Input for Direct Upload */}
      {allowDirectUpload && onUploadPhoto && (
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleFileChange}
        />
      )}

      {/* Actual Shirt Photo If Uploaded */}
      {photoSrc && !hasError ? (
        <div className="relative w-full h-full flex items-center justify-center">
          <img
            src={photoSrc}
            alt={`${color.name} shirt - First Love Cape Coast`}
            loading="eager"
            decoding="async"
            onLoad={() => setIsLoaded(true)}
            onError={() => setHasError(true)}
            className={`w-full h-full object-contain p-2 sm:p-3 transition-all duration-300 group-hover:scale-[1.03] ${
              isLoaded ? 'opacity-100' : 'opacity-0'
            }`}
          />

          {/* Quick "Change Photo" overlay button */}
          {allowDirectUpload && onUploadPhoto && (
            <button
              type="button"
              onClick={triggerUpload}
              className="absolute bottom-2.5 right-2.5 px-2.5 py-1.5 rounded-lg bg-neutral-900/90 hover:bg-neutral-800 text-neutral-200 border border-neutral-700/80 text-[11px] font-semibold flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-all shadow-lg backdrop-blur-sm cursor-pointer z-10"
              title="Change shirt image"
            >
              <Camera className="w-3.5 h-3.5 text-amber-400" />
              <span>Change Image</span>
            </button>
          )}
        </div>
      ) : (
        /* Empty Slot Awaiting User Upload */
        <div 
          onClick={allowDirectUpload && onUploadPhoto ? triggerUpload : undefined}
          className={`w-full h-full flex flex-col items-center justify-center p-6 text-center transition-all ${
            allowDirectUpload && onUploadPhoto 
              ? 'cursor-pointer hover:bg-neutral-900/60 border-2 border-dashed border-neutral-800 hover:border-amber-500/60' 
              : 'border border-neutral-800/60'
          }`}
        >
          <div className="w-12 h-12 rounded-2xl bg-neutral-900 border border-neutral-800 flex items-center justify-center mb-3 text-neutral-400 group-hover:text-amber-400 group-hover:border-amber-500/40 transition-colors shadow-inner">
            <Upload className="w-5 h-5" />
          </div>

          <h5 className="text-sm font-bold text-white mb-3">
            {color.name}
          </h5>

          {allowDirectUpload && onUploadPhoto && (
            <button
              type="button"
              onClick={triggerUpload}
              className="px-3.5 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-neutral-950 text-xs font-bold flex items-center gap-1.5 shadow-md shadow-amber-500/20 transition-all cursor-pointer"
            >
              <Camera className="w-3.5 h-3.5" />
              <span>Upload Image</span>
            </button>
          )}
        </div>
      )}
    </div>
  );
};
