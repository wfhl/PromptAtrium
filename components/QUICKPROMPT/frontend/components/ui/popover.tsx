import React, { createContext, useContext, useState, useRef, useEffect } from 'react';

interface PopoverContextValue {
  open: boolean;
  setOpen: (open: boolean) => void;
}

const PopoverContext = createContext<PopoverContextValue | undefined>(undefined);

export const Popover: React.FC<{ children: React.ReactNode; open?: boolean; onOpenChange?: (open: boolean) => void }> = ({ 
  children, 
  open: controlledOpen, 
  onOpenChange 
}) => {
  const [internalOpen, setInternalOpen] = useState(false);
  
  const open = controlledOpen !== undefined ? controlledOpen : internalOpen;
  
  const setOpen = (newOpen: boolean) => {
    if (controlledOpen === undefined) {
      setInternalOpen(newOpen);
    }
    onOpenChange?.(newOpen);
  };

  return (
    <PopoverContext.Provider value={{ open, setOpen }}>
      <div className="relative inline-block">
        {children}
      </div>
    </PopoverContext.Provider>
  );
};

export const PopoverTrigger: React.FC<{ children: React.ReactNode; asChild?: boolean; className?: string }> = ({ 
  children, 
  asChild = false,
  className = '' 
}) => {
  const context = useContext(PopoverContext);
  if (!context) throw new Error('PopoverTrigger must be used within Popover');
  
  const handleClick = () => {
    context.setOpen(!context.open);
  };

  if (asChild && React.isValidElement(children)) {
    return React.cloneElement(children as React.ReactElement<any>, {
      onClick: handleClick,
      className: `${(children as React.ReactElement<any>).props.className || ''} ${className}`
    });
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      className={className}
    >
      {children}
    </button>
  );
};

export const PopoverContent: React.FC<{ 
  children: React.ReactNode; 
  className?: string;
  align?: 'start' | 'center' | 'end';
  sideOffset?: number;
}> = ({ 
  children, 
  className = '',
  align = 'center',
  sideOffset = 4
}) => {
  const context = useContext(PopoverContext);
  const ref = useRef<HTMLDivElement>(null);
  
  if (!context) throw new Error('PopoverContent must be used within Popover');
  
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        context.setOpen(false);
      }
    };

    if (context.open) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [context.open, context]);

  if (!context.open) return null;
  
  const alignments = {
    start: 'left-0',
    center: 'left-1/2 -translate-x-1/2',
    end: 'right-0'
  };

  return (
    <div
      ref={ref}
      className={`absolute z-50 w-72 rounded-md border bg-popover p-4 text-popover-foreground shadow-md outline-none ${alignments[align]} ${className}`}
      style={{ top: `calc(100% + ${sideOffset}px)` }}
    >
      {children}
    </div>
  );
};

export const PopoverArrow: React.FC<{ className?: string }> = ({ className = '' }) => {
  return (
    <svg
      width="10"
      height="5"
      viewBox="0 0 30 10"
      preserveAspectRatio="none"
      className={`absolute -top-[5px] left-1/2 -translate-x-1/2 fill-popover stroke-border ${className}`}
    >
      <polygon points="0,10 15,0 30,10" />
    </svg>
  );
};