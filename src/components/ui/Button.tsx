import type { ButtonHTMLAttributes } from 'react';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
}

export function Button({ variant = 'primary', size = 'md', className = '', children, ...props }: ButtonProps) {
  const base = 'inline-flex items-center justify-center gap-2 font-medium rounded-xl transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-40 disabled:pointer-events-none cursor-pointer';
  const variants = {
    primary: 'bg-[#1ABC9C] text-white hover:bg-[#17a589] focus:ring-[#1ABC9C]',
    outline: 'border-2 border-[#0D1F3C] text-[#0D1F3C] hover:bg-[#0D1F3C] hover:text-white focus:ring-[#0D1F3C]',
    ghost:   'text-gray-500 hover:text-[#0D1F3C] hover:bg-gray-100 focus:ring-gray-300',
  };
  const sizes = { sm: 'px-3 py-2 text-sm', md: 'px-6 py-3 text-base', lg: 'px-8 py-4 text-lg' };

  return (
    <button className={`${base} ${variants[variant]} ${sizes[size]} ${className}`} {...props}>
      {children}
    </button>
  );
}
