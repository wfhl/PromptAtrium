import React, { createContext, useContext, useState } from 'react';

interface SelectContextValue {
  value: string;
  onValueChange: (value: string) => void;
  open: boolean;
  setOpen: (open: boolean) => void;
}

const SelectContext = createContext<SelectContextValue | undefined>(undefined);

interface SelectProps {
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  disabled?: boolean;
  children: React.ReactNode;
}

export const Select: React.FC<SelectProps> = ({
  value,
  defaultValue = '',
  onValueChange = () => {},
  disabled = false,
  children
}) => {
  const [internalValue, setInternalValue] = useState(defaultValue);
  const [open, setOpen] = useState(false);
  
  const actualValue = value !== undefined ? value : internalValue;
  
  const handleValueChange = (newValue: string) => {
    if (value === undefined) {
      setInternalValue(newValue);
    }
    onValueChange(newValue);
    setOpen(false);
  };

  return (
    <SelectContext.Provider value={{ value: actualValue, onValueChange: handleValueChange, open, setOpen }}>
      <div className="relative">
        {children}
      </div>
    </SelectContext.Provider>
  );
};

export const SelectTrigger: React.FC<{ children: React.ReactNode; className?: string }> = ({ 
  children, 
  className = '' 
}) => {
  const context = useContext(SelectContext);
  if (!context) throw new Error('SelectTrigger must be used within Select');
  
  return (
    <button
      type="button"
      onClick={() => context.setOpen(!context.open)}
      className={`flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ${className}`}
    >
      {children}
      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4 opacity-50">
        <polyline points="6 9 12 15 18 9"></polyline>
      </svg>
    </button>
  );
};

export const SelectValue: React.FC<{ placeholder?: string; className?: string }> = ({ 
  placeholder = 'Select...', 
  className = '' 
}) => {
  const context = useContext(SelectContext);
  if (!context) throw new Error('SelectValue must be used within Select');
  
  return <span className={className}>{context.value || placeholder}</span>;
};

export const SelectContent: React.FC<{ children: React.ReactNode; className?: string }> = ({ 
  children, 
  className = '' 
}) => {
  const context = useContext(SelectContext);
  if (!context) throw new Error('SelectContent must be used within Select');
  
  if (!context.open) return null;
  
  return (
    <div className={`absolute z-50 min-w-[8rem] overflow-hidden rounded-md border bg-popover text-popover-foreground shadow-md mt-1 ${className}`}>
      <div className="p-1">
        {children}
      </div>
    </div>
  );
};

export const SelectItem: React.FC<{ 
  value: string; 
  children: React.ReactNode; 
  className?: string;
  disabled?: boolean;
}> = ({ 
  value, 
  children, 
  className = '',
  disabled = false 
}) => {
  const context = useContext(SelectContext);
  if (!context) throw new Error('SelectItem must be used within Select');
  
  return (
    <div
      onClick={() => !disabled && context.onValueChange(value)}
      className={`relative flex w-full cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50 hover:bg-accent hover:text-accent-foreground ${
        context.value === value ? 'bg-accent text-accent-foreground' : ''
      } ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'} ${className}`}
    >
      {children}
    </div>
  );
};

export const SelectGroup: React.FC<{ children: React.ReactNode; className?: string }> = ({ 
  children, 
  className = '' 
}) => {
  return <div className={`p-1 ${className}`}>{children}</div>;
};

export const SelectLabel: React.FC<{ children: React.ReactNode; className?: string }> = ({ 
  children, 
  className = '' 
}) => {
  return <div className={`px-2 py-1.5 text-sm font-semibold ${className}`}>{children}</div>;
};

export const SelectSeparator: React.FC<{ className?: string }> = ({ className = '' }) => {
  return <div className={`-mx-1 my-1 h-px bg-muted ${className}`} />;
};