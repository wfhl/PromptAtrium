import React from 'react';

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'secondary' | 'destructive' | 'outline';
}

function Badge({ className = '', variant = 'default', ...props }: BadgeProps) {
  const variants = {
    default: 'border-transparent bg-blue-600 text-white',
    secondary: 'border-transparent bg-gray-200 text-gray-900',
    destructive: 'border-transparent bg-red-600 text-white',
    outline: 'text-gray-950 border-gray-300',
  };

  const variantStyle = variants[variant] || variants.default;

  return (
    <div
      className={`inline-flex items-center rounded-md border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${variantStyle} ${className}`}
      {...props}
    />
  );
}

export { Badge };