import { useState, useEffect } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";

interface SizeBoxProps {
  label: string;
  dimensions: string;
  ratio: string;
  width: number;
  height: number;
}

interface PlatformData {
  name: string;
  icon: React.ReactNode;
  color: string;
  sizes: SizeBoxProps[];
  videoSpecs?: {
    maxLength: string;
    aspectRatio: string;
    resolution: string;
    frameRate: string;
    fileSize: string;
  };
}

const SizeBox = ({ label, dimensions, ratio, width, height }: SizeBoxProps) => (
  <div 
    className="border-2 border-white rounded-xl p-3 text-center bg-gradient-to-br from-white/30 to-white/10 backdrop-blur-sm text-white font-semibold text-xs leading-tight shadow-lg flex flex-col justify-center"
    style={{ width: `${width}px`, height: `${height}px`, minWidth: `${width}px`, minHeight: `${height}px` }}
  >
    <div className="font-bold mb-1.5 text-xs text-white text-shadow uppercase tracking-wide leading-none">
      {label}
    </div>
    <div className="text-xs mb-1 text-white/95 font-mono font-medium leading-none">
      {dimensions}
    </div>
    <div className="text-xs text-white/90 font-semibold bg-black/25 px-2 py-1 rounded-lg mt-1 leading-none">
      {ratio}
    </div>
  </div>
);

// Helper function to calculate accurate aspect ratio dimensions
const calculateDimensions = (ratio: string, baseSize: number = 120): { width: number; height: number } => {
  const [w, h] = ratio.split(':').map(Number);
  if (w && h) {
    const aspectRatio = w / h;
    if (aspectRatio > 1) {
      // Landscape: fixed width, calculated height
      // For very wide ratios (like 5:1, 4:1, 3:1), ensure minimum width for text
      const minWidth = aspectRatio >= 3 ? Math.max(baseSize, 180) : baseSize;
      return { width: minWidth, height: Math.round(minWidth / aspectRatio) };
    } else {
      // Portrait: fixed height, calculated width
      return { width: Math.round(baseSize * aspectRatio), height: baseSize };
    }
  }
  // Square fallback
  return { width: baseSize, height: baseSize };
};

export default function SocialMediaGuide() {
  const [activeTab, setActiveTab] = useState<string>("images");
  const [collapsedSections, setCollapsedSections] = useState<Record<string, boolean>>({});

  // Load collapsed state from localStorage on mount
  useEffect(() => {
    const savedState = localStorage.getItem('socialMediaGuideCollapsed');
    if (savedState) {
      try {
        setCollapsedSections(JSON.parse(savedState));
      } catch (e) {
        // If parsing fails, start with all sections collapsed
        setCollapsedSections({
          Instagram: true,
          Facebook: true,
          Twitter: true,
          LinkedIn: true,
          YouTube: true,
          TikTok: true
        });
      }
    } else {
      // Default to all sections collapsed
      setCollapsedSections({
        Instagram: true,
        Facebook: true,
        Twitter: true,
        LinkedIn: true,
        YouTube: true,
        TikTok: true
      });
    }
  }, []);

  const toggleSection = (platformName: string) => {
    const newState = {
      ...collapsedSections,
      [platformName]: !collapsedSections[platformName]
    };
    setCollapsedSections(newState);
    // Save to localStorage
    localStorage.setItem('socialMediaGuideCollapsed', JSON.stringify(newState));
  };

  const platforms: PlatformData[] = [
    {
      name: "Instagram",
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
        </svg>
      ),
      color: "from-pink-500/20 to-purple-600/25",
      sizes: [
        { label: "Square Post", dimensions: "1080 × 1080 px", ratio: "1:1", ...calculateDimensions("1:1", 120) },
        { label: "Portrait Post", dimensions: "1080 × 1350 px", ratio: "4:5", ...calculateDimensions("4:5", 120) },
        { label: "NEW Format", dimensions: "1080 × 1440 px", ratio: "3:4", ...calculateDimensions("3:4", 120) },
        { label: "Landscape Post", dimensions: "1080 × 566 px", ratio: "1.91:1", ...calculateDimensions("1.91:1", 140) },
        { label: "Story", dimensions: "1080 × 1920 px", ratio: "9:16", ...calculateDimensions("9:16", 120) },
        { label: "Reels", dimensions: "1080 × 1920 px", ratio: "9:16", ...calculateDimensions("9:16", 120) },
        { label: "Profile Picture", dimensions: "320 × 320 px", ratio: "1:1", ...calculateDimensions("1:1", 100) }
      ],
      videoSpecs: {
        maxLength: "180 seconds (Reels), 60 seconds (Stories)",
        aspectRatio: "1:1, 4:5, 9:16",
        resolution: "1080 × 1920 px (9:16)",
        frameRate: "30 fps",
        fileSize: "Under ~150 MB"
      }
    },
    {
      name: "Facebook",
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
          <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
        </svg>
      ),
      color: "from-blue-600/20 to-blue-700/25",
      sizes: [
        { label: "Post Image", dimensions: "1200 × 630 px", ratio: "1.91:1", ...calculateDimensions("1.91:1", 140) },
        { label: "Cover Photo", dimensions: "851 × 315 px", ratio: "2.7:1", ...calculateDimensions("2.7:1", 200) },
        { label: "Profile Picture", dimensions: "180 × 180 px", ratio: "1:1", ...calculateDimensions("1:1", 100) },
        { label: "Story", dimensions: "1080 × 1920 px", ratio: "9:16", ...calculateDimensions("9:16", 120) },
        { label: "Event Cover", dimensions: "1920 × 1080 px", ratio: "16:9", ...calculateDimensions("16:9", 140) }
      ],
      videoSpecs: {
        maxLength: "240 minutes",
        aspectRatio: "16:9, 1:1, 4:5",
        resolution: "1280 × 720 px minimum",
        frameRate: "30 fps",
        fileSize: "10GB maximum"
      }
    },
    {
      name: "TikTok",
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
          <path d="M19.321 5.562a5.123 5.123 0 01-.443-.258 6.228 6.228 0 01-1.137-.966c-.849-.849-1.532-1.849-1.848-3.019C15.659.848 15.56.434 15.56 0h-3.301c0 .151 0 8.112 0 8.112 0 1.581-.971 2.975-2.402 3.501-1.032.379-2.223.258-3.121-.405-.899-.663-1.409-1.792-1.306-2.945.103-1.154.758-2.136 1.696-2.565 1.032-.472 2.223-.258 3.121.405v-3.3c-2.066-.441-4.298.104-6.098 1.483-1.8 1.379-2.8 3.567-2.563 5.851.237 2.283 1.554 4.245 3.425 5.145 1.87.9 4.11.698 5.737-.529 1.627-1.227 2.563-3.188 2.4-5.145 0 0 0-5.395 0-5.395.966.621 2.085 1.0 3.301 1.121z"/>
        </svg>
      ),
      color: "from-red-500/20 to-cyan-400/25",
      sizes: [
        { label: "Video", dimensions: "1080 × 1920 px", ratio: "9:16", ...calculateDimensions("9:16", 120) },
        { label: "Profile Picture", dimensions: "200 × 200 px", ratio: "1:1", ...calculateDimensions("1:1", 100) }
      ],
      videoSpecs: {
        maxLength: "10 minutes",
        aspectRatio: "9:16 (recommended)",
        resolution: "1080 × 1920 px",
        frameRate: "30 fps",
        fileSize: "287.6MB maximum"
      }
    },
    {
      name: "Twitter/X",
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
          <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
        </svg>
      ),
      color: "from-blue-400/20 to-blue-600/25",
      sizes: [
        { label: "Post Image", dimensions: "1200 × 675 px", ratio: "16:9", ...calculateDimensions("16:9", 140) },
        { label: "Header", dimensions: "1500 × 500 px", ratio: "3:1", ...calculateDimensions("3:1", 200) },
        { label: "Profile Picture", dimensions: "400 × 400 px", ratio: "1:1", ...calculateDimensions("1:1", 100) },
        { label: "Card Image", dimensions: "1200 × 628 px", ratio: "1.91:1", ...calculateDimensions("1.91:1", 140) }
      ],
      videoSpecs: {
        maxLength: "2 minutes 20 seconds",
        aspectRatio: "1:2.39 to 2.39:1",
        resolution: "1920 × 1080 px maximum",
        frameRate: "40 fps maximum",
        fileSize: "512MB maximum"
      }
    },
    {
      name: "YouTube",
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
          <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
        </svg>
      ),
      color: "from-red-600/20 to-red-700/25",
      sizes: [
        { label: "Thumbnail", dimensions: "1280 × 720 px", ratio: "16:9", ...calculateDimensions("16:9", 140) },
        { label: "Channel Art", dimensions: "2560 × 1440 px", ratio: "16:9", ...calculateDimensions("16:9", 140) },
        { label: "Profile Picture", dimensions: "800 × 800 px", ratio: "1:1", ...calculateDimensions("1:1", 100) },
        { label: "End Screen", dimensions: "1280 × 720 px", ratio: "16:9", ...calculateDimensions("16:9", 140) }
      ],
      videoSpecs: {
        maxLength: "12 hours",
        aspectRatio: "16:9 (recommended)",
        resolution: "1920 × 1080 px (1080p)",
        frameRate: "24, 25, 30, 48, 50, 60 fps",
        fileSize: "256GB maximum"
      }
    },
    {
      name: "LinkedIn",
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
          <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
        </svg>
      ),
      color: "from-blue-700/20 to-blue-800/25",
      sizes: [
        { label: "Post Image", dimensions: "1200 × 627 px", ratio: "1.91:1", ...calculateDimensions("1.91:1", 140) },
        { label: "Cover Photo", dimensions: "1584 × 396 px", ratio: "4:1", ...calculateDimensions("4:1", 200) },
        { label: "Profile Picture", dimensions: "400 × 400 px", ratio: "1:1", ...calculateDimensions("1:1", 100) },
        { label: "Company Logo", dimensions: "300 × 300 px", ratio: "1:1", ...calculateDimensions("1:1", 100) }
      ],
      videoSpecs: {
        maxLength: "10 minutes",
        aspectRatio: "1:2.4 to 2.4:1",
        resolution: "256 × 144 px minimum",
        frameRate: "30 fps maximum",
        fileSize: "5GB maximum"
      }
    },
    {
      name: "Pinterest",
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12.017 0C5.396 0 .029 5.367.029 11.987c0 5.079 3.158 9.417 7.618 11.174-.105-.949-.199-2.403.041-3.439.219-.937 1.219-5.175 1.219-5.175s-.31-.62-.31-1.538c0-1.441.834-2.517 1.873-2.517.883 0 1.309.662 1.309 1.455 0 .887-.565 2.211-.857 3.434-.244 1.02.512 1.852 1.519 1.852 1.824 0 3.228-1.924 3.228-4.699 0-2.455-1.766-4.172-4.288-4.172-2.922 0-4.636 2.188-4.636 4.449 0 .881.336 1.824.757 2.338.083.099.094.188.07.291-.077.312-.248 1.006-.282 1.146-.044.183-.145.223-.334.134-1.249-.581-2.03-2.407-2.03-3.874 0-3.154 2.292-6.052 6.608-6.052 3.469 0 6.165 2.473 6.165 5.776 0 3.447-2.173 6.22-5.19 6.22-1.013 0-1.965-.525-2.291-1.148l-.623 2.378c-.226.869-.835 1.958-1.244 2.621.937.29 1.931.446 2.962.446 6.624 0 11.99-5.367 11.99-11.987C24.007 5.367 18.641.001 12.017.001z"/>
        </svg>
      ),
      color: "from-red-800/20 to-red-900/25",
      sizes: [
        { label: "Standard Pin", dimensions: "1000 × 1500 px", ratio: "2:3", ...calculateDimensions("2:3", 120) },
        { label: "Square Pin", dimensions: "1000 × 1000 px", ratio: "1:1", ...calculateDimensions("1:1", 120) },
        { label: "Profile Picture", dimensions: "165 × 165 px", ratio: "1:1", ...calculateDimensions("1:1", 100) },
        { label: "Board Cover", dimensions: "222 × 150 px", ratio: "1.48:1", ...calculateDimensions("1.48:1", 130) }
      ],
      videoSpecs: {
        maxLength: "15 minutes",
        aspectRatio: "2:3, 1:1, 9:16",
        resolution: "1000 × 1500 px",
        frameRate: "30 fps maximum",
        fileSize: "2GB maximum"
      }
    },
    {
      name: "Bluesky",
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 10.8c-1.087-2.114-4.046-6.053-6.798-7.995C2.566.944 1.561 1.266.902 1.565.139 1.908 0 3.08 0 3.768c0 .69.378 5.65.624 6.479.815 2.736 3.713 3.66 6.383 3.364.136-.02.275-.038.415-.056-.138.022-.276.04-.415.056-2.67-.296-5.568.628-6.383 3.364C.378 17.902 0 22.862 0 23.55c0 .688.139 1.86.902 2.203.659.299 1.664.621 4.3-1.239C7.954 22.572 10.913 18.633 12 16.519c1.087 2.114 4.046 6.053 6.798 7.995 2.636 1.86 3.641 1.538 4.3 1.239.763-.343.902-1.515.902-2.203 0-.688-.378-5.648-.624-6.477-.815-2.736-3.713-3.66-6.383-3.364-.139.018-.277.036-.415.056.138-.018.276-.036.415-.056 2.67.296 5.568-.628 6.383-3.364.246-.829.624-5.789.624-6.477 0-.688-.139-1.86-.902-2.203-.659-.299-1.664-.621-4.3 1.239C16.046 4.747 13.087 8.686 12 10.8z"/>
        </svg>
      ),
      color: "from-sky-400/20 to-blue-500/25",
      sizes: [
        { label: "Post Image", dimensions: "1200 × 675 px", ratio: "16:9", ...calculateDimensions("16:9", 140) },
        { label: "Profile Picture", dimensions: "400 × 400 px", ratio: "1:1", ...calculateDimensions("1:1", 100) },
        { label: "Banner", dimensions: "1500 × 500 px", ratio: "3:1", ...calculateDimensions("3:1", 200) }
      ],
      videoSpecs: {
        maxLength: "60 seconds",
        aspectRatio: "16:9, 1:1, 9:16",
        resolution: "1920 × 1080 px",
        frameRate: "30 fps",
        fileSize: "50MB maximum"
      }
    },
    {
      name: "Snapchat",
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12.166 3c-1.165 0-2.104.938-2.104 2.104 0 .635.287 1.2.735 1.588-.123.02-.25.03-.38.03-.652 0-1.226-.264-1.65-.688-.424-.425-.688-.999-.688-1.651C8.079 3.383 7.696 3 7.226 3s-.853.383-.853.853c0 1.058.43 2.016 1.124 2.71.694.693 1.652 1.123 2.71 1.123.471 0 .853.383.853.853s-.382.853-.853.853c-1.429 0-2.725-.58-3.663-1.518C5.546 6.936 4.966 5.64 4.966 4.21c0-1.165-.938-2.104-2.104-2.104C1.697 2.106.759 3.045.759 4.21c0 2.15.873 4.098 2.28 5.505S6.685 12 8.835 12h6.33c2.15 0 4.098-.873 5.505-2.285S23 6.36 23 4.21c0-1.165-.938-2.104-2.104-2.104s-2.104.939-2.104 2.104c0 1.43-.58 2.726-1.518 3.664-.938.938-2.234 1.518-3.663 1.518-.471 0-.853-.383-.853-.853s.382-.853.853-.853c1.058 0 2.016-.43 2.71-1.123.694-.694 1.124-1.652 1.124-2.71 0-.47.383-.853.853-.853s.853.383.853.853c0 .652-.264 1.226-.688 1.651-.424.424-.998.688-1.65.688-.13 0-.257-.01-.38-.03.448-.388.735-.953.735-1.588C14.27 3.938 13.331 3 12.166 3z"/>
        </svg>
      ),
      color: "from-yellow-400/20 to-yellow-500/25",
      sizes: [
        { label: "Snap", dimensions: "1080 × 1920 px", ratio: "9:16", ...calculateDimensions("9:16", 120) },
        { label: "Profile Picture", dimensions: "320 × 320 px", ratio: "1:1", ...calculateDimensions("1:1", 100) }
      ],
      videoSpecs: {
        maxLength: "60 seconds",
        aspectRatio: "9:16 (vertical)",
        resolution: "1080 × 1920 px",
        frameRate: "30 fps",
        fileSize: "32MB maximum"
      }
    },
    {
      name: "Threads",
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12.186 24h-.007c-3.581-.024-6.334-1.205-8.184-3.509C2.35 18.44 1.5 15.586 1.472 12.01v-.017c.03-3.579.879-6.43 2.525-8.482C5.845 1.205 8.6.024 12.18 0h.014c2.746.02 5.043.725 6.826 2.098 1.677 1.29 2.858 3.13 3.509 5.467l-2.04.569c-.542-1.954-1.494-3.384-2.835-4.25-1.433-1.097-3.308-1.67-5.58-1.704-3.26.045-5.548 1.245-6.797 3.567C4.688 7.015 4.049 9.418 4.024 12.008v.013c.02 2.583.652 4.983 1.829 6.144 1.26 2.322 3.551 3.522 6.814 3.565 2.05-.014 3.734-.394 5.005-1.132 1.26-.73 2.139-1.778 2.618-3.11.346-1.097.573-2.28.677-3.52H17.95v-2.142h4.002c.069.757.106 1.529.106 2.315-.015 2.667-.297 5.024-.84 7.017-.546 2.004-1.463 3.734-2.725 5.14C16.756 22.676 14.691 23.944 12.186 24z"/>
        </svg>
      ),
      color: "from-gray-800/20 to-black/25",
      sizes: [
        { label: "Post Image", dimensions: "1080 × 1080 px", ratio: "1:1", ...calculateDimensions("1:1", 120) },
        { label: "Profile Picture", dimensions: "400 × 400 px", ratio: "1:1", ...calculateDimensions("1:1", 100) }
      ],
      videoSpecs: {
        maxLength: "5 minutes",
        aspectRatio: "1:1, 9:16",
        resolution: "1080 × 1080 px",
        frameRate: "30 fps",
        fileSize: "100MB maximum"
      }
    },
    {
      name: "Reddit",
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0zm5.01 4.744c.688 0 1.25.561 1.25 1.249a1.25 1.25 0 0 1-2.498.056l-2.597-.547-.8 3.747c1.824.07 3.48.632 4.674 1.488.308-.309.73-.491 1.207-.491.968 0 1.754.786 1.754 1.754 0 .716-.435 1.333-1.01 1.614a3.111 3.111 0 0 1 .042.52c0 2.694-3.13 4.87-7.004 4.87-3.874 0-7.004-2.176-7.004-4.87 0-.183.015-.366.043-.534A1.748 1.748 0 0 1 4.028 12c0-.968.786-1.754 1.754-1.754.463 0 .898.196 1.207.49 1.207-.883 2.878-1.43 4.744-1.487l.885-4.182a.342.342 0 0 1 .14-.197.35.35 0 0 1 .238-.042l2.906.617a1.214 1.214 0 0 1 1.108-.701zM9.25 12C8.561 12 8 12.562 8 13.25c0 .687.561 1.248 1.25 1.248.687 0 1.248-.561 1.248-1.249 0-.688-.561-1.249-1.249-1.249zm5.5 0c-.687 0-1.248.561-1.248 1.25 0 .687.561 1.248 1.249 1.248.688 0 1.249-.561 1.249-1.249 0-.687-.562-1.249-1.25-1.249zm-5.466 3.99a.327.327 0 0 0-.231.094.33.33 0 0 0 0 .463c.842.842 2.484.913 2.961.913.477 0 2.105-.056 2.961-.913a.361.361 0 0 0 .029-.463.33.33 0 0 0-.464 0c-.547.533-1.684.73-2.512.73-.828 0-1.979-.196-2.512-.73a.326.326 0 0 0-.232-.095z"/>
        </svg>
      ),
      color: "from-orange-600/20 to-red-600/25",
      sizes: [
        { label: "Post Image", dimensions: "1200 × 675 px", ratio: "16:9", ...calculateDimensions("16:9", 140) },
        { label: "Profile Picture", dimensions: "256 × 256 px", ratio: "1:1", ...calculateDimensions("1:1", 100) },
        { label: "Banner", dimensions: "1920 × 384 px", ratio: "5:1", ...calculateDimensions("5:1", 220) }
      ],
      videoSpecs: {
        maxLength: "15 minutes",
        aspectRatio: "16:9, 1:1, 9:16",
        resolution: "1920 × 1080 px",
        frameRate: "30 fps",
        fileSize: "1GB maximum"
      }
    }
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center space-y-4">
        <h2 className="text-3xl font-bold text-white">Social Media Image & Video Size Guide 2025</h2>
        <p className="text-gray-400 max-w-3xl mx-auto">
          Complete reference for optimal image and video dimensions across all major social media platforms
        </p>
      </div>

      {/* Content Toggle */}
      <div className="flex justify-center gap-4 mb-8">
        <button
          onClick={() => setActiveTab("images")}
          className={`px-6 py-2 rounded-full font-semibold transition-all ${
            activeTab === "images"
              ? "bg-white/20 border-2 border-white/30 text-white"
              : "bg-white/5 border-2 border-white/10 text-white/70 hover:bg-white/10"
          }`}
        >
          Image Sizes
        </button>
        <button
          onClick={() => setActiveTab("videos")}
          className={`px-6 py-2 rounded-full font-semibold transition-all ${
            activeTab === "videos"
              ? "bg-white/20 border-2 border-white/30 text-white"
              : "bg-white/5 border-2 border-white/10 text-white/70 hover:bg-white/10"
          }`}
        >
          Video Specs
        </button>
      </div>

      {/* Platform Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {platforms.map((platform) => (
          <div
            key={platform.name}
            className={`bg-gradient-to-br ${platform.color} rounded-3xl shadow-2xl backdrop-blur-sm border border-white/10 overflow-hidden`}
          >
            {/* Platform Header - Clickable */}
            <button
              onClick={() => toggleSection(platform.name)}
              className="w-full flex items-center justify-between p-8 hover:bg-white/5 transition-all duration-200"
            >
              <div className="flex items-center">
                <div className="w-15 h-15 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center text-white mr-4">
                  {platform.icon}
                </div>
                <div className="text-left">
                  <h3 className="text-2xl font-bold text-white">{platform.name}</h3>
                  <p className="text-white/80 italic">
                    {activeTab === "images" ? "Image & video sizes" : "Video specifications"}
                  </p>
                </div>
              </div>
              <div className="text-white">
                {collapsedSections[platform.name] ? (
                  <ChevronDown className="h-6 w-6" />
                ) : (
                  <ChevronUp className="h-6 w-6" />
                )}
              </div>
            </button>

            {/* Collapsible Content */}
            {!collapsedSections[platform.name] && (
              <div className="px-8 pb-8">
                {activeTab === "images" ? (
                  <div className="space-y-4">
                    <div className="flex flex-wrap gap-3">
                      {platform.sizes.map((size, index) => (
                        <SizeBox key={index} {...size} />
                      ))}
                    </div>
                    {platform.name === "Instagram" && (
                      <div className="space-y-6">
                        <div className="p-4 bg-black/20 rounded-lg border border-white/10">
                          <h4 className="text-lg font-semibold text-white mb-3">📸 Image Post Recommendations</h4>
                          <div className="space-y-2 text-sm text-white/90">
                            <div>📐 <strong>Optimal Size:</strong> 1080 x 1350 px (4:5 ratio) or NEW 1080 x 1440 px (3:4 ratio)</div>
                            <div>🎨 <strong>Color profile:</strong> sRGB</div>
                            <div>💾 <strong>Export:</strong> JPG (100% quality) or PNG</div>
                            <div>📦 <strong>File size:</strong> must be under 1 MB</div>
                            <div>❌ Never enable automatic compression</div>
                            <div>❌ Don't crop inside Instagram</div>
                            <div>❌ Avoid using IG filters or edits</div>
                            <div>📶 Use a stable Wi-Fi connection (avoid weak 4G)</div>
                            <div>🖥️ Post from PC or Meta Business Suite for better quality control</div>
                            <div>💡 Add a soft Gaussian blur (0.3 px) to image edges</div>
                            <div>🎨 Avoid overly saturated colors to reduce compression</div>
                          </div>
                        </div>
                        
                        <div className="p-4 bg-gradient-to-r from-pink-500/10 to-purple-600/10 rounded-lg border border-pink-500/20">
                          <h4 className="text-lg font-semibold text-white mb-3">🎠 Carousel Post Strategy</h4>
                          <div className="space-y-2 text-sm text-white/90">
                            <div>📏 <strong>Consistency is Key:</strong> All carousel images must be the same exact size</div>
                            <div>📐 <strong>Recommended Ratio:</strong> 4:5 (1080 x 1350 px) for maximum screen real estate</div>
                            <div>🔄 <strong>Second Chance Engagement:</strong> Posting carousels gives your followers an additional chance to like your post if they didn't give it a like the first time they see it</div>
                            <div>📱 <strong>Swipe Value:</strong> Each slide should provide unique value to encourage full carousel viewing</div>
                            <div>💫 <strong>Algorithm Boost:</strong> Higher engagement from carousel interactions can improve post visibility</div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="bg-white/10 rounded-xl p-4 backdrop-blur-sm border border-white/20">
                      {platform.videoSpecs && (
                        <div className="space-y-3">
                          <div className="flex justify-between items-center py-2 border-b border-white/10">
                            <span className="font-semibold text-white/90">Max Length:</span>
                            <span className="text-white/80 font-mono text-sm">{platform.videoSpecs.maxLength}</span>
                          </div>
                          <div className="flex justify-between items-center py-2 border-b border-white/10">
                            <span className="font-semibold text-white/90">Aspect Ratio:</span>
                            <span className="text-white/80 font-mono text-sm">{platform.videoSpecs.aspectRatio}</span>
                          </div>
                          <div className="flex justify-between items-center py-2 border-b border-white/10">
                            <span className="font-semibold text-white/90">Resolution:</span>
                            <span className="text-white/80 font-mono text-sm">{platform.videoSpecs.resolution}</span>
                          </div>
                          <div className="flex justify-between items-center py-2 border-b border-white/10">
                            <span className="font-semibold text-white/90">Frame Rate:</span>
                            <span className="text-white/80 font-mono text-sm">{platform.videoSpecs.frameRate}</span>
                          </div>
                          <div className="flex justify-between items-center py-2">
                            <span className="font-semibold text-white/90">File Size:</span>
                            <span className="text-white/80 font-mono text-sm">{platform.videoSpecs.fileSize}</span>
                          </div>
                        </div>
                      )}
                    </div>
                    {platform.name === "Instagram" && (
                      <div className="p-4 bg-black/20 rounded-lg border border-white/10">
                        <h4 className="text-lg font-semibold text-white mb-3">⚙️ Video Export Recommendations</h4>
                        <div className="space-y-2 text-sm text-white/90">
                          <div>🎥 Resolution: 1080×1920 (9:16)</div>
                          <div>📽️ Frame Rate: 30 fps</div>
                          <div>💿 Codec: H.264, AAC audio</div>
                          <div>👾 Bitrate Enc.: VBR 2-pass</div>
                          <div>👾 Target Bitrate: 20 Mbps</div>
                          <div>👾 Maximum Bitrate: 24 Mbps</div>
                          <div>💾 File Size Cap: Under ~150 MB</div>
                          <div>✅ Insta App Setting: Upload at Highest Quality</div>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Pro Tips Section */}
      <div className="bg-white/50 rounded-3xl p-8 shadow-2xl backdrop-blur-sm">
        <h3 className="text-2xl font-bold text-gray-800 mb-6">Pro Tips & Resources for Social Media Success 2025</h3>
        <ul className="space-y-3 mb-8">
          <li className="flex items-start gap-3 text-gray-700 leading-relaxed">
            <span className="flex-shrink-0 w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-xs font-bold mt-0.5">1</span>
            <span><strong>Safe Zones:</strong> Keep important elements within the center of the image to avoid being cropped on different platforms. Leave 14% (250px) margin on Stories for UI elements.</span>
          </li>
          <li className="flex items-start gap-3 text-gray-700 leading-relaxed">
            <span className="flex-shrink-0 w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-xs font-bold mt-0.5">2</span>
            <span><strong>Resolution Best Practices:</strong> 
              📸 Quick Guide: Post on Instagram in 4:5 Without Quality Loss
              📐 Size: 1080 x 1350 px (4:5 ratio)

              🎨 Color profile: sRGB

              💾 Export: JPG (100% quality) or PNG

              📦 File size: must be under 1 MB

              ❌ Never enable automatic compression

              ❌ Don’t crop inside Instagram

              ❌ Avoid using IG filters or edits

              📶 Use a stable Wi-Fi connection (avoid weak 4G)

              🖥️ Post from PC or Meta Business Suite

              💡 Add a soft Gaussian blur (0.3 px) to image edges

              🎨 Avoid overly saturated colors to reduce compression

              📚 All carousel images must be the same exact size
              Always upload the highest quality possible. Instagram resizes images over 1080px down to 1080px, but maintains quality for images between 320-1080px.</span>
          </li>
          <li className="flex items-start gap-3 text-gray-700 leading-relaxed">
            <span className="flex-shrink-0 w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-xs font-bold mt-0.5">3</span>
            <span><strong>File Types & Formats:</strong> Use PNG for images with transparency and logos, JPG for photographs, and GIF for simple animations. Avoid animated GIFs on YouTube.</span>
          </li>
          <li className="flex items-start gap-3 text-gray-700 leading-relaxed">
            <span className="flex-shrink-0 w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-xs font-bold mt-0.5">4</span>
            <span><strong>File Size Limits:</strong> Instagram: 30MB, Facebook: 30MB, X: 5MB photos/15MB web, LinkedIn: 8MB, TikTok: 72MB, YouTube: 6MB banners.</span>
          </li>
          <li className="flex items-start gap-3 text-gray-700 leading-relaxed">
            <span className="flex-shrink-0 w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-xs font-bold mt-0.5">5</span>
            <span><strong>Video Dominance:</strong> Video content gets 2.4x more exposure and 1.2x greater engagement than images. Focus on vertical 9:16 for short-form content.</span>
          </li>
          <li className="flex items-start gap-3 text-gray-700 leading-relaxed">
            <span className="flex-shrink-0 w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-xs font-bold mt-0.5">6</span>
            <span><strong>Mobile-First Strategy:</strong> 70%+ of social media consumption is mobile. Ensure text is readable and subjects are well-centered for smaller screens.</span>
          </li>
          <li className="flex items-start gap-3 text-gray-700 leading-relaxed">
            <span className="flex-shrink-0 w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-xs font-bold mt-0.5">7</span>
            <span><strong>Platform-Specific Optimization:</strong> Create multiple versions optimized for each platform rather than using one-size-fits-all approach.</span>
          </li>
        </ul>

        <h4 className="text-xl font-bold text-gray-800 mb-4">🔗 Helpful Resources & Tools</h4>
        <ul className="space-y-3 mb-8">
          <li className="flex items-start gap-3 text-gray-700 leading-relaxed">
            <span className="flex-shrink-0 w-6 h-6 bg-green-500 text-white rounded-full flex items-center justify-center text-xs font-bold mt-0.5">1</span>
            <span><strong>Content Creation:</strong> <a href="https://docs.google.com/document/d/1a9Adp-ty3tnSPoz5BjcflmBgNZbFWph_-qACsp8X6tQ" target="_blank" className="text-blue-600 hover:underline">Instagram Hacks to Go Viral</a> - Free comprehensive guide</span>
          </li>
          <li className="flex items-start gap-3 text-gray-700 leading-relaxed">
            <span className="flex-shrink-0 w-6 h-6 bg-green-500 text-white rounded-full flex items-center justify-center text-xs font-bold mt-0.5">2</span>
            <span><strong>Link in Bio Tools:</strong> <a href="https://docs.google.com/spreadsheets/d/1fP1Jv9QYb7KiKU47fsnudgFPCOhFVll-B23o96QBu2E/edit?gid=0#gid=0" target="_blank" className="text-blue-600 hover:underline">Complete List of Link in Bio Tools</a> - Compare features and pricing</span>
          </li>
          <li className="flex items-start gap-3 text-gray-700 leading-relaxed">
            <span className="flex-shrink-0 w-6 h-6 bg-green-500 text-white rounded-full flex items-center justify-center text-xs font-bold mt-0.5">3</span>
            <span><strong>Video Content:</strong> <a href="https://lovedbycreators.com/Faceless01" target="_blank" className="text-blue-600 hover:underline">Start a Viral Faceless Channel</a> - Build audience without showing face</span>
          </li>
          <li className="flex items-start gap-3 text-gray-700 leading-relaxed">
            <span className="flex-shrink-0 w-6 h-6 bg-green-500 text-white rounded-full flex items-center justify-center text-xs font-bold mt-0.5">4</span>
            <span><strong>Social Media Management:</strong> <a href="https://get.socialbee.io/83ik491mqscw" target="_blank" className="text-blue-600 hover:underline">SocialBee</a> - Automated posting and scheduling</span>
          </li>
          <li className="flex items-start gap-3 text-gray-700 leading-relaxed">
            <span className="flex-shrink-0 w-6 h-6 bg-green-500 text-white rounded-full flex items-center justify-center text-xs font-bold mt-0.5">5</span>
            <span><strong>Monetization:</strong> <a href="https://docs.google.com/document/d/1Hb2FzF2NVkYQt_uogpYc_ivkdWj4zSnCX66GPOSKgok/edit?tab=t.0" target="_blank" className="text-blue-600 hover:underline">Noob Guide to Affiliate Marketing</a> - Beginner-friendly strategies</span>
          </li>
          <li className="flex items-start gap-3 text-gray-700 leading-relaxed">
            <span className="flex-shrink-0 w-6 h-6 bg-green-500 text-white rounded-full flex items-center justify-center text-xs font-bold mt-0.5">6</span>
            <span><strong>Advanced Tools:</strong> <a href="http://affilionaire.org/" target="_blank" className="text-blue-600 hover:underline">Affilionaire.org</a> - Professional affiliate marketing tools and guides</span>
          </li>
          <li className="flex items-start gap-3 text-gray-700 leading-relaxed">
            <span className="flex-shrink-0 w-6 h-6 bg-green-500 text-white rounded-full flex items-center justify-center text-xs font-bold mt-0.5">7</span>
            <span><strong>Community:</strong> <a href="https://www.reddit.com/r/Snipfeed/" target="_blank" className="text-blue-600 hover:underline">Snipfeed Reddit Community</a> - Connect with other creators</span>
          </li>
          <li className="flex items-start gap-3 text-gray-700 leading-relaxed">
            <span className="flex-shrink-0 w-6 h-6 bg-green-500 text-white rounded-full flex items-center justify-center text-xs font-bold mt-0.5">8</span>
            <span><strong>Growth Strategies:</strong> <a href="https://lovedbycreators.com/how-to-get-more-followers-on-twitter/" target="_blank" className="text-blue-600 hover:underline">How to Get More X (Twitter) Followers</a> - Proven tactics</span>
          </li>
        </ul>

        <h4 className="text-xl font-bold text-gray-800 mb-4">⚡ Quick Reference - Most Common Sizes</h4>
        <ul className="space-y-3">
          <li className="flex items-start gap-3 text-gray-700 leading-relaxed">
            <span className="flex-shrink-0 w-6 h-6 bg-purple-500 text-white rounded-full flex items-center justify-center text-xs font-bold mt-0.5">1</span>
            <span><strong>Short-form Video:</strong> 9:16 (1080 × 1920px) - TikTok, Instagram Reels, YouTube Shorts</span>
          </li>
          <li className="flex items-start gap-3 text-gray-700 leading-relaxed">
            <span className="flex-shrink-0 w-6 h-6 bg-purple-500 text-white rounded-full flex items-center justify-center text-xs font-bold mt-0.5">2</span>
            <span><strong>Long-form Video:</strong> 16:9 (1920 × 1080px) - YouTube, Facebook, LinkedIn</span>
          </li>
          <li className="flex items-start gap-3 text-gray-700 leading-relaxed">
            <span className="flex-shrink-0 w-6 h-6 bg-purple-500 text-white rounded-full flex items-center justify-center text-xs font-bold mt-0.5">3</span>
            <span><strong>Square Posts:</strong> 1:1 (1080 × 1080px) - Instagram, Facebook, LinkedIn feed</span>
          </li>
          <li className="flex items-start gap-3 text-gray-700 leading-relaxed">
            <span className="flex-shrink-0 w-6 h-6 bg-purple-500 text-white rounded-full flex items-center justify-center text-xs font-bold mt-0.5">4</span>
            <span><strong>Profile Photos:</strong> 400 × 400px minimum for future-proofing across platforms</span>
          </li>
          <li className="flex items-start gap-3 text-gray-700 leading-relaxed">
            <span className="flex-shrink-0 w-6 h-6 bg-purple-500 text-white rounded-full flex items-center justify-center text-xs font-bold mt-0.5">5</span>
            <span><strong>Stories:</strong> 9:16 (1080 × 1920px) - Universal across Instagram, Facebook, Snapchat</span>
          </li>
        </ul>
      </div>
    </div>
  );
}