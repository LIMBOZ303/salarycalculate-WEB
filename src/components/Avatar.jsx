import { useState } from 'react';

const SIZES = {
  sm: 'w-6 h-6 text-[10px]',
  md: 'w-8 h-8 text-xs',
  lg: 'w-12 h-12 text-lg',
  xl: 'w-16 h-16 text-2xl',
  '2xl': 'w-20 h-20 text-3xl',
};

export default function Avatar({ src, name, size = 'md', className = '' }) {
  const [imgError, setImgError] = useState(false);

  const getInitials = () => {
    if (!name) return '?';
    return name.charAt(0).toUpperCase();
  };

  const sizeClass = SIZES[size] || SIZES.md;
  const baseClass = `rounded-full flex items-center justify-center shrink-0 overflow-hidden ${sizeClass} ${className}`;

  if (src && !imgError) {
    return (
      <div className={`${baseClass} bg-slate-100`}>
        <img
          src={src}
          alt={name || 'Avatar'}
          className="w-full h-full object-cover"
          onError={() => setImgError(true)}
        />
      </div>
    );
  }

  return (
    <div className={`${baseClass} bg-[#EFF6FF] text-[#2563EB] font-semibold`}>
      {getInitials()}
    </div>
  );
}
