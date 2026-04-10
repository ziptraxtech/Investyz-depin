import React from 'react';
import { Link } from 'react-router-dom';

const BrandLogo = ({ className = '', frameClassName = '', logoClassName = '' }) => {
  return (
    <Link to="/" className={`inline-flex items-center ${className}`} data-testid="brand-logo">
      <div className={`overflow-hidden rounded-xl border border-slate-800 bg-slate-950 shadow-[0_12px_30px_rgba(15,23,42,0.38)] dark:border-white/10 dark:bg-slate-950 ${frameClassName}`}>
        <img
          src="/investyz-logo-optimized.jpg"
          alt="Investyz logo"
          width="480"
          height="320"
          fetchPriority="high"
          decoding="async"
          className={`h-full w-full object-cover object-center scale-[1.42] brightness-110 contrast-110 ${logoClassName}`}
        />
      </div>
    </Link>
  );
};

export default BrandLogo;
