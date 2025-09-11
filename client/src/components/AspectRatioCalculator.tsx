import React, { useState, useRef, useEffect } from 'react';

// Standard aspect ratios with their display formats
const STANDARD_RATIOS = [
  { ratio: "1:1", display: "1:1", description: "Popular for social media profiles and posts. Twitter", w: 1, h: 1 },
  { ratio: "3:2", display: "3:2", description: "Classic - Common in photography and print sizes.", w: 3, h: 2 },
  { ratio: "4:3", display: "4:3", description: "Standard - Used in older TV screens and computer monitors.", w: 4, h: 3 },
  { ratio: "4:5", display: "4:5", description: "Instagram - Feed Posts for display and photography.", w: 4, h: 5 },
  { ratio: "16:9", display: "16:9", description: "Widescreen - The standard for HD videos and most modern TVs.", w: 16, h: 9 },
  { ratio: "16:10", display: "16:10", description: "A more recent display aspect ratio.", w: 16, h: 10 },
  { ratio: "21:9", display: "21:9", description: "Ultrawide - Used for ultrawide cinema.", w: 21, h: 9 },
  { ratio: "2.35:1", display: "2.35:1", description: "Cinemascope - Another widescreen ratio.", w: 2.35, h: 1 },
  { ratio: "2.39:1", display: "2.39:1", description: "Anamorphic - Yet another widescreen ratio.", w: 2.39, h: 1 },
  { ratio: "2:3", display: "2:3", description: "Portrait - Vertical format.", w: 2, h: 3 },
  { ratio: "3:4", display: "3:4", description: "Portrait - Vertical format.", w: 3, h: 4 },
  { ratio: "9:16", display: "9:16", description: "Mobile - Vertical widescreen, often used for portrait orientation on social media.", w: 9, h: 16 },
  { ratio: "1.91:1", display: "1.91:1", description: "Common Social Media Horizontal", w: 1.91, h: 1 },
];

interface AspectRatioCalculatorProps {
  onChange?: (data: AspectRatioData) => void;
  initialWidth?: number;
  initialHeight?: number;
  initialRatio?: string;
  className?: string;
  style?: React.CSSProperties;
}

interface AspectRatioData {
  width: number;
  height: number;
  megapixels: number;
  aspectRatio: {
    display: string;
    decimal: number;
    width: number;
    height: number;
  };
}

const AspectRatioCalculator: React.FC<AspectRatioCalculatorProps> = ({ 
  onChange, 
  initialWidth = 1024, 
  initialHeight = 1024, 
  initialRatio = "1:1",
  className = '',
  style = {}
}) => {
  // State
  const [width, setWidth] = useState(initialWidth);
  const [height, setHeight] = useState(initialHeight);
  const [megapixels, setMegapixels] = useState(1.1);
  const [aspectLocked, setAspectLocked] = useState(true);
  const [showDropdown, setShowDropdown] = useState(false);
  const [showCustom, setShowCustom] = useState(false);
  const [customW, setCustomW] = useState(1);
  const [customH, setCustomH] = useState(1);
  const [tooltipVisible, setTooltipVisible] = useState(false);
  const [copyButtonText, setCopyButtonText] = useState("Copy Dimensions");
  const [currentRatioDisplay, setCurrentRatioDisplay] = useState(initialRatio);
  
  // Refs for dropdown positioning
  const ratioDisplayRef = useRef<HTMLDivElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Aspect ratio represented as [width, height]
  const [aspect, setAspect] = useState(() => {
    // Parse initial ratio
    const initialRatioObj = STANDARD_RATIOS.find(r => r.display === initialRatio);
    if (initialRatioObj) {
      return [initialRatioObj.w, initialRatioObj.h];
    }
    return [1, 1]; // Default to 1:1
  });

  // Utility functions
  const gcd = (a: number, b: number): number => {
    return b === 0 ? a : gcd(b, a % b);
  };
  
  const simplifyRatio = (w: number, h: number) => {
    const divisor = gcd(Math.round(w), Math.round(h));
    return [w / divisor, h / divisor];
  };
  
  const formatNumber = (num: number) => {
    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  };
  
  // Calculate pixels and file size
  const totalPixels = width * height;
  const fileSize = ((totalPixels * 4) / (1024 * 1024)).toFixed(1);
  
  // Check if current ratio matches a standard ratio
  const findMatchingStandardRatio = () => {
    if (!width || !height) return null;
    
    const [simpW, simpH] = simplifyRatio(width, height);
    
    // Check for standard ratios
    for (const ratio of STANDARD_RATIOS) {
      if (ratio.display.includes(':')) {
        if (Math.abs(simpW - ratio.w) < 0.01 && Math.abs(simpH - ratio.h) < 0.01) {
          return ratio.display;
        }
      } else if (ratio.display.includes('.')) {
        // For decimal ratios like 2.35:1
        const currentRatio = width / height;
        if (Math.abs(currentRatio - (ratio.w / ratio.h)) < 0.01) {
          return ratio.display;
        }
      }
    }
    
    return null;
  };

  // Effect to call onChange when data changes
  useEffect(() => {
    if (onChange) {
      const [simpW, simpH] = simplifyRatio(width, height);
      onChange({
        width,
        height,
        megapixels: parseFloat(((totalPixels) / 1_000_000).toFixed(2)),
        aspectRatio: {
          display: currentRatioDisplay,
          decimal: width / height,
          width: simpW,
          height: simpH,
        }
      });
    }
  }, [width, height, currentRatioDisplay, onChange, totalPixels]);
  
  // Event handlers
  const handleWidthChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newWidth = parseInt(e.target.value) || 0;
    setWidth(newWidth);
    
    if (aspectLocked && newWidth > 0) {
      const [wRatio, hRatio] = aspect;
      setHeight(Math.round((newWidth / wRatio) * hRatio));
    } else if (newWidth > 0 && height > 0) {
      const [simpW, simpH] = simplifyRatio(newWidth, height);
      setAspect([simpW, simpH]);
      
      // Update ratio display
      const matchedRatio = findMatchingStandardRatio();
      if (matchedRatio) {
        setCurrentRatioDisplay(matchedRatio);
      } else {
        setCurrentRatioDisplay(`${(newWidth / height).toFixed(3)}:1`);
      }
    }
  };
  
  const handleHeightChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newHeight = parseInt(e.target.value) || 0;
    setHeight(newHeight);
    
    if (aspectLocked && newHeight > 0) {
      const [wRatio, hRatio] = aspect;
      setWidth(Math.round((newHeight / hRatio) * wRatio));
    } else if (width > 0 && newHeight > 0) {
      const [simpW, simpH] = simplifyRatio(width, newHeight);
      setAspect([simpW, simpH]);
      
      // Update ratio display
      const matchedRatio = findMatchingStandardRatio();
      if (matchedRatio) {
        setCurrentRatioDisplay(matchedRatio);
      } else {
        setCurrentRatioDisplay(`${(width / newHeight).toFixed(3)}:1`);
      }
    }
  };
  
  const handleMegapixelsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const mp = parseFloat(e.target.value);
    setMegapixels(mp);
    
    // Update dimensions based on megapixels
    const pixelCount = mp * 1_000_000;
    const [wRatio, hRatio] = aspect;
    const scale = Math.sqrt(pixelCount / (wRatio * hRatio));
    setWidth(Math.round(wRatio * scale));
    setHeight(Math.round(hRatio * scale));
  };
  
  const handleRatioSelect = (ratio: string) => {
    if (ratio === "custom") {
      setShowCustom(true);
      setShowDropdown(false);
      
      // Initialize custom ratio inputs with current aspect ratio
      const [simpW, simpH] = simplifyRatio(width, height);
      setCustomW(simpW);
      setCustomH(simpH);
    } else {
      const selected = STANDARD_RATIOS.find(r => r.ratio === ratio);
      if (selected) {
        setAspect([selected.w, selected.h]);
        setCurrentRatioDisplay(selected.display);
        setAspectLocked(true);
        
        // Update dimensions keeping the megapixels constant
        const pixelCount = megapixels * 1_000_000;
        const scale = Math.sqrt(pixelCount / (selected.w * selected.h));
        setWidth(Math.round(selected.w * scale));
        setHeight(Math.round(selected.h * scale));
      }
      setShowDropdown(false);
    }
  };
  
  const handleApplyCustomRatio = () => {
    const w = parseFloat(customW.toString()) || 1;
    const h = parseFloat(customH.toString()) || 1;
    setAspect([w, h]);
    setCurrentRatioDisplay(`${w}:${h}`);
    setAspectLocked(true);
    
    // Update dimensions keeping the megapixels constant
    const pixelCount = megapixels * 1_000_000;
    const scale = Math.sqrt(pixelCount / (w * h));
    setWidth(Math.round(w * scale));
    setHeight(Math.round(h * scale));
    
    setShowCustom(false);
  };
  
  const handleSwap = () => {
    setWidth(height);
    setHeight(width);
    
    if (aspectLocked) {
      setAspect([aspect[1], aspect[0]]);
      
      // Swap the ratio display if it's in standard format
      if (currentRatioDisplay.includes(':')) {
        const parts = currentRatioDisplay.split(':');
        setCurrentRatioDisplay(`${parts[1]}:${parts[0]}`);
      }
    } else {
      // Check if the swapped dimensions match a standard ratio
      const matchedRatio = findMatchingStandardRatio();
      if (matchedRatio) {
        setCurrentRatioDisplay(matchedRatio);
      } else {
        setCurrentRatioDisplay(`${(height / width).toFixed(3)}:1`);
      }
    }
  };
  
  const handleCopy = () => {
    navigator.clipboard.writeText(`${width}×${height}`);
    setCopyButtonText("Copied!");
    setTimeout(() => {
      setCopyButtonText("Copy Dimensions");
    }, 1500);
  };
  
  const handleReset = () => {
    setWidth(1049);
    setHeight(1049);
    setMegapixels(1.1);
    setAspect([1, 1]);
    setCurrentRatioDisplay("1:1");
    setAspectLocked(true);
    setShowCustom(false);
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node) &&
          ratioDisplayRef.current && !ratioDisplayRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  return (
    <div 
      ref={containerRef}
      className={`w-full overflow-hidden text-gray-100 ${className}`}
      style={style}
    >
      <h3 className="text-sm font-semibold text-gray-300 mb-3">Aspect Ratio Calculator</h3>
      
      {/* Ratio Selection and Action Buttons */}
      <div className="flex items-end gap-3 mb-3">
        <div className="relative flex-1 z-10">
          <div className="flex justify-between items-center mb-1">
            <label className="text-xs text-gray-400">Ratio</label>
            <button 
              onClick={() => setAspectLocked(!aspectLocked)}
              className="bg-transparent border-0 text-gray-200 text-sm flex items-center p-0.5 cursor-pointer hover:text-white"
            >
              {aspectLocked ? '🔒' : '🔓'}
            </button>
          </div>
          
          <div
            ref={ratioDisplayRef}
            onClick={() => setShowDropdown(!showDropdown)}
            className="text-center text-sm py-1.5 bg-gray-700 rounded-md text-white cursor-pointer select-none hover:bg-gray-600 transition-colors"
          >
            {currentRatioDisplay}
          </div>
          
          {showDropdown && (
            <div 
              ref={dropdownRef}
              className="absolute top-full left-0 right-0 bg-gray-700 rounded-md shadow-lg z-20 max-h-80 overflow-y-auto mt-1"
            >
              {STANDARD_RATIOS.map((ratio) => (
                <div
                  key={ratio.ratio}
                  onClick={() => handleRatioSelect(ratio.ratio)}
                  className="p-2 border-b border-gray-600 cursor-pointer transition-colors hover:bg-gray-600 text-xs leading-tight"
                >
                  <div className="font-medium">{ratio.display}</div>
                  <div className="text-gray-400 text-xs">{ratio.description}</div>
                </div>
              ))}
              <div
                onClick={() => handleRatioSelect("custom")}
                className="p-2 cursor-pointer transition-colors hover:bg-gray-600 text-xs text-blue-400"
              >
                Custom Ratio...
              </div>
            </div>
          )}
        </div>
        
        {/* Compact Action Buttons */}
        <div className="flex flex-col gap-1 min-w-[80px]">
          <button
            onClick={handleReset}
            className="px-2 py-1 bg-gray-600 hover:bg-gray-500 rounded text-gray-100 text-xs transition-colors"
          >
            Reset
          </button>
          <button
            onClick={handleCopy}
            className="px-2 py-1 bg-gray-600 hover:bg-gray-500 rounded text-gray-100 text-xs transition-colors"
          >
            {copyButtonText}
          </button>
        </div>
      </div>

      {/* Custom Ratio Inputs */}
      {showCustom && (
        <div className="mb-3">
          <div className="flex justify-between gap-2 mb-2 items-center">
            <input
              type="number"
              value={customW}
              onChange={(e) => setCustomW(parseFloat(e.target.value) || 1)}
              className="flex-1 p-2 border border-gray-600 rounded-md bg-gray-700 text-gray-100 text-sm"
              min="0.1"
              step="0.1"
            />
            <span className="text-gray-400">:</span>
            <input
              type="number"
              value={customH}
              onChange={(e) => setCustomH(parseFloat(e.target.value) || 1)}
              className="flex-1 p-2 border border-gray-600 rounded-md bg-gray-700 text-gray-100 text-sm"
              min="0.1"
              step="0.1"
            />
          </div>
          <button
            onClick={handleApplyCustomRatio}
            className="w-full p-2 bg-blue-600 hover:bg-blue-700 rounded-md text-white text-sm transition-colors"
          >
            Apply Custom Ratio
          </button>
        </div>
      )}

      {/* Dimensions */}
      <div className="flex items-center gap-2 mb-3">
        <div className="flex-1">
          <label className="text-sm text-gray-400 block mb-1">Width (px)</label>
          <input
            type="number"
            value={width}
            onChange={handleWidthChange}
            className="w-full p-2 border border-gray-600 rounded-md bg-gray-700 text-gray-100 text-sm"
          />
        </div>
        <button
          onClick={handleSwap}
          className="bg-transparent border-0 text-gray-400 cursor-pointer text-base p-0 mt-6 hover:text-gray-200"
        >
          ⇄
        </button>
        <div className="flex-1">
          <label className="text-sm text-gray-400 block mb-1">Height (px)</label>
          <input
            type="number"
            value={height}
            onChange={handleHeightChange}
            className="w-full p-2 border border-gray-600 rounded-md bg-gray-700 text-gray-100 text-sm"
          />
        </div>
      </div>

      {/* Megapixels */}
      <div className="mb-3">
        <div className="flex items-center gap-1 mb-1">
          <label className="text-sm text-gray-400">Megapixels</label>
          <div 
            className="relative cursor-help text-xs"
            onMouseEnter={() => setTooltipVisible(true)}
            onMouseLeave={() => setTooltipVisible(false)}
          >
            ⓘ
            {tooltipVisible && (
              <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-1 bg-gray-600 text-white p-1 rounded text-xs whitespace-nowrap z-10">
                Adjust image resolution
              </div>
            )}
          </div>
        </div>
        <input
          type="range"
          min="0.1"
          max="16"
          step="0.1"
          value={megapixels}
          onChange={handleMegapixelsChange}
          className="w-full h-2 bg-gray-600 rounded-lg appearance-none cursor-pointer mb-2"
          style={{
            background: `linear-gradient(to right, #4f9cf9 0%, #4f9cf9 ${(megapixels / 16) * 100}%, #374151 ${(megapixels / 16) * 100}%, #374151 100%)`
          }}
        />
        <div className="flex justify-between text-xs text-gray-400 mb-2">
          <span>0.1MP</span>
          <span>1.1MP</span>
          <span>16MP</span>
        </div>
      </div>



      {/* Results */}
      <div className="flex flex-col gap-2 pt-2 border-t border-gray-600">
        <div className="flex justify-between text-xs text-gray-400">
          <span>Total Pixels:</span>
          <span className="text-gray-200 font-medium">{formatNumber(totalPixels)} px</span>
        </div>
        <div className="flex justify-between text-xs text-gray-400">
          <span>File Size (approx JPEG):</span>
          <span className="text-gray-200 font-medium">{fileSize} MB</span>
        </div>
      </div>
    </div>
  );
};

export default AspectRatioCalculator;