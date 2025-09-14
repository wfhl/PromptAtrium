import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Calculator } from "lucide-react";

interface AspectRatioCalculatorProps {
  onRatioSelect?: (width: number, height: number) => void;
}

export default function AspectRatioCalculator({ onRatioSelect }: AspectRatioCalculatorProps) {
  const [width, setWidth] = useState(1024);
  const [height, setHeight] = useState(1024);

  const commonRatios = [
    { label: "1:1", width: 1024, height: 1024 },
    { label: "16:9", width: 1920, height: 1080 },
    { label: "9:16", width: 1080, height: 1920 },
    { label: "4:3", width: 1024, height: 768 },
    { label: "3:4", width: 768, height: 1024 },
  ];

  const handleRatioClick = (w: number, h: number) => {
    setWidth(w);
    setHeight(h);
    if (onRatioSelect) onRatioSelect(w, h);
  };

  return (
    <Card className="p-4 bg-gray-900/50 border-gray-700">
      <div className="flex items-center gap-2 mb-4">
        <Calculator className="h-4 w-4 text-purple-400" />
        <h3 className="text-sm font-semibold">Aspect Ratio Calculator</h3>
      </div>
      
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="text-xs text-gray-400">Width</label>
            <Input
              type="number"
              value={width}
              onChange={(e) => setWidth(Number(e.target.value))}
              className="h-8 text-sm"
            />
          </div>
          <div>
            <label className="text-xs text-gray-400">Height</label>
            <Input
              type="number"
              value={height}
              onChange={(e) => setHeight(Number(e.target.value))}
              className="h-8 text-sm"
            />
          </div>
        </div>
        
        <div className="flex flex-wrap gap-1">
          {commonRatios.map((ratio) => (
            <Button
              key={ratio.label}
              size="sm"
              variant="outline"
              className="h-7 px-2 text-xs"
              onClick={() => handleRatioClick(ratio.width, ratio.height)}
            >
              {ratio.label}
            </Button>
          ))}
        </div>
        
        <div className="text-xs text-gray-400">
          Current: {width} × {height} ({Math.round((width / height) * 100) / 100}:1)
        </div>
      </div>
    </Card>
  );
}