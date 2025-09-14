import React, { createContext, useContext, useState, useRef, useEffect } from 'react';

interface DropdownMenuContextValue {
  open: boolean;
  setOpen: (open: boolean) => void;
}

const DropdownMenuContext = createContext<DropdownMenuContextValue | undefined>(undefined);

export const DropdownMenu: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [open, setOpen] = useState(false);
  
  return (
    <DropdownMenuContext.Provider value={{ open, setOpen }}>
      <div className="relative inline-block text-left">
        {children}
      </div>
    </DropdownMenuContext.Provider>
  );
};

export const DropdownMenuTrigger: React.FC<{ 
  children: React.ReactNode; 
  asChild?: boolean;
  className?: string;
}> = ({ 
  children, 
  asChild = false,
  className = '' 
}) => {
  const context = useContext(DropdownMenuContext);
  if (!context) throw new Error('DropdownMenuTrigger must be used within DropdownMenu');
  
  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
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

export const DropdownMenuContent: React.FC<{ 
  children: React.ReactNode; 
  className?: string;
  align?: 'start' | 'end' | 'center';
  sideOffset?: number;
}> = ({ 
  children, 
  className = '',
  align = 'end',
  sideOffset = 4
}) => {
  const context = useContext(DropdownMenuContext);
  const ref = useRef<HTMLDivElement>(null);
  
  if (!context) throw new Error('DropdownMenuContent must be used within DropdownMenu');
  
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
      className={`absolute z-50 min-w-[8rem] overflow-hidden rounded-md border bg-popover p-1 text-popover-foreground shadow-md ${alignments[align]} ${className}`}
      style={{ top: `calc(100% + ${sideOffset}px)` }}
    >
      {children}
    </div>
  );
};

export const DropdownMenuItem: React.FC<{ 
  children: React.ReactNode; 
  className?: string;
  onSelect?: () => void;
  disabled?: boolean;
}> = ({ 
  children, 
  className = '',
  onSelect,
  disabled = false
}) => {
  const context = useContext(DropdownMenuContext);
  if (!context) throw new Error('DropdownMenuItem must be used within DropdownMenu');
  
  const handleClick = () => {
    if (!disabled) {
      onSelect?.();
      context.setOpen(false);
    }
  };

  return (
    <div
      onClick={handleClick}
      className={`relative flex cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground ${
        disabled ? 'pointer-events-none opacity-50' : ''
      } ${className}`}
    >
      {children}
    </div>
  );
};

export const DropdownMenuSeparator: React.FC<{ className?: string }> = ({ className = '' }) => {
  return <div className={`-mx-1 my-1 h-px bg-muted ${className}`} />;
};

export const DropdownMenuLabel: React.FC<{ children: React.ReactNode; className?: string }> = ({ 
  children, 
  className = '' 
}) => {
  return (
    <div className={`px-2 py-1.5 text-sm font-semibold ${className}`}>
      {children}
    </div>
  );
};

export const DropdownMenuGroup: React.FC<{ children: React.ReactNode; className?: string }> = ({ 
  children, 
  className = '' 
}) => {
  return <div className={className}>{children}</div>;
};

export const DropdownMenuSub: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [subOpen, setSubOpen] = useState(false);
  
  return (
    <DropdownMenuContext.Provider value={{ open: subOpen, setOpen: setSubOpen }}>
      <div className="relative">
        {children}
      </div>
    </DropdownMenuContext.Provider>
  );
};

export const DropdownMenuSubTrigger: React.FC<{ 
  children: React.ReactNode; 
  className?: string;
}> = ({ 
  children, 
  className = '' 
}) => {
  const context = useContext(DropdownMenuContext);
  if (!context) throw new Error('DropdownMenuSubTrigger must be used within DropdownMenu');
  
  return (
    <div
      onMouseEnter={() => context.setOpen(true)}
      onMouseLeave={() => context.setOpen(false)}
      className={`flex cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none focus:bg-accent ${className}`}
    >
      {children}
      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="ml-auto h-4 w-4">
        <polyline points="9 18 15 12 9 6"></polyline>
      </svg>
    </div>
  );
};

export const DropdownMenuSubContent: React.FC<{ 
  children: React.ReactNode; 
  className?: string;
}> = ({ 
  children, 
  className = '' 
}) => {
  const context = useContext(DropdownMenuContext);
  if (!context) throw new Error('DropdownMenuSubContent must be used within DropdownMenu');
  
  if (!context.open) return null;
  
  return (
    <div className={`absolute left-full top-0 z-50 min-w-[8rem] overflow-hidden rounded-md border bg-popover p-1 text-popover-foreground shadow-lg ${className}`}>
      {children}
    </div>
  );
};