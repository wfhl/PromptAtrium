import React, { useState, useRef, useEffect } from 'react';
import { X, Check, Crop, Upload } from 'lucide-react';

interface ImageCropperProps {
  initialImage?: string | null; // Base64 or URL
  onClose: () => void;
  onCropComplete: (croppedBase64: string) => void;
}

const ImageCropper: React.FC<ImageCropperProps> = ({ initialImage, onClose, onCropComplete }) => {
  const [imageSrc, setImageSrc] = useState<string | null>(initialImage || null);
  const [crop, setCrop] = useState<{ x: number, y: number, w: number, h: number } | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [startPos, setStartPos] = useState<{ x: number, y: number } | null>(null);

  const imgRef = useRef<HTMLImageElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Handle file upload within the cropper
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const reader = new FileReader();
      reader.onload = () => {
        setImageSrc(reader.result as string);
        setCrop(null); // Reset crop on new image
      };
      reader.readAsDataURL(e.target.files[0]);
    }
  };

  const getClientCoordinates = (e: React.MouseEvent | React.TouchEvent) => {
    if (containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      const clientX = 'touches' in e ? e.touches[0].clientX : (e as React.MouseEvent).clientX;
      const clientY = 'touches' in e ? e.touches[0].clientY : (e as React.MouseEvent).clientY;
      return {
        x: clientX - rect.left,
        y: clientY - rect.top
      };
    }
    return { x: 0, y: 0 };
  };

  const handleMouseDown = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    if (!imageSrc) return;
    const coords = getClientCoordinates(e);
    setIsDragging(true);
    setStartPos(coords);
    setCrop({ x: coords.x, y: coords.y, w: 0, h: 0 });
  };

  const handleMouseMove = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDragging || !startPos || !containerRef.current) return;
    e.preventDefault();
    const coords = getClientCoordinates(e);
    
    // Calculate new rect
    let x = Math.min(coords.x, startPos.x);
    let y = Math.min(coords.y, startPos.y);
    let w = Math.abs(coords.x - startPos.x);
    let h = Math.abs(coords.y - startPos.y);

    // Constrain to container
    const rect = containerRef.current.getBoundingClientRect();
    if (x < 0) x = 0;
    if (y < 0) y = 0;
    if (x + w > rect.width) w = rect.width - x;
    if (y + h > rect.height) h = rect.height - y;

    setCrop({ x, y, w, h });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const executeCrop = () => {
    if (!imgRef.current || !crop || crop.w === 0 || crop.h === 0) return;

    const canvas = document.createElement('canvas');
    const scaleX = imgRef.current.naturalWidth / imgRef.current.width;
    const scaleY = imgRef.current.naturalHeight / imgRef.current.height;

    canvas.width = crop.w * scaleX;
    canvas.height = crop.h * scaleY;
    const ctx = canvas.getContext('2d');

    if (ctx) {
      ctx.drawImage(
        imgRef.current,
        crop.x * scaleX,
        crop.y * scaleY,
        crop.w * scaleX,
        crop.h * scaleY,
        0,
        0,
        canvas.width,
        canvas.height
      );
      
      const base64 = canvas.toDataURL('image/png');
      onCropComplete(base64);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-700 rounded-xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden shadow-2xl">
        
        {/* Header */}
        <div className="p-4 border-b border-slate-700 flex justify-between items-center bg-slate-800">
          <h3 className="text-lg font-semibold text-white flex items-center gap-2">
            <Crop className="w-5 h-5 text-blue-400" />
            Crop Example Image
          </h3>
          <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors">
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Workspace */}
        <div className="flex-1 overflow-hidden relative bg-black flex items-center justify-center p-4 select-none">
          {imageSrc ? (
            <div 
              ref={containerRef}
              className="relative inline-block"
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseUp}
              onTouchStart={handleMouseDown}
              onTouchMove={handleMouseMove}
              onTouchEnd={handleMouseUp}
            >
              <img 
                ref={imgRef} 
                src={imageSrc} 
                alt="Source" 
                className="max-h-[60vh] md:max-h-[70vh] object-contain pointer-events-none select-none"
                draggable={false}
              />
              {/* Crop Overlay */}
              {crop && (
                <div 
                  className="absolute border-2 border-blue-500 bg-blue-500/20 shadow-[0_0_0_9999px_rgba(0,0,0,0.7)]"
                  style={{
                    left: crop.x,
                    top: crop.y,
                    width: crop.w,
                    height: crop.h,
                    pointerEvents: 'none'
                  }}
                />
              )}
            </div>
          ) : (
            <div className="text-center text-slate-500">
              <p>No image selected</p>
            </div>
          )}
        </div>

        {/* Footer Controls */}
        <div className="p-4 border-t border-slate-700 bg-slate-800 flex justify-between items-center gap-4">
          <div className="flex gap-2">
             <button 
               onClick={() => fileInputRef.current?.click()}
               className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-slate-200 rounded-lg text-sm font-medium flex items-center gap-2 transition-colors"
             >
               <Upload className="w-4 h-4" />
               Upload Different Image
             </button>
             <input 
               type="file" 
               ref={fileInputRef} 
               onChange={handleFileChange} 
               className="hidden" 
               accept="image/*"
             />
          </div>

          <button 
            onClick={executeCrop}
            disabled={!crop || crop.w < 5 || crop.h < 5}
            className={`
              px-6 py-2 rounded-lg text-sm font-bold flex items-center gap-2 transition-all
              ${(!crop || crop.w < 5) 
                ? 'bg-slate-700 text-slate-500 cursor-not-allowed' 
                : 'bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-900/50'}
            `}
          >
            <Check className="w-4 h-4" />
            Apply Crop
          </button>
        </div>
      </div>
    </div>
  );
};

export default ImageCropper;