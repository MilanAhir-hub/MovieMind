// Reusable Button component with rounded-full styling by default
export default function Button({
  children,
  variant = 'primary',
  size = 'md',
  rounded = 'full',
  href,
  className = '',
  icon,
  iconPosition = 'right',
  type = 'button',
  onClick,
  ...props
}) {
  const baseClasses = 'inline-flex items-center justify-center font-bold transition-all duration-200 cursor-pointer select-none';

  const variantClasses = {
    primary: 'bg-[#E50914] hover:bg-[#b80710] text-white shadow-[0_2px_10px_rgba(229,9,20,0.35)] hover:shadow-[0_4px_16px_rgba(229,9,20,0.5)] hover:-translate-y-0.5 active:translate-y-0',
    secondary: 'bg-[#1f1f1f] hover:bg-[#2e2e2e] text-white border border-white/10 hover:border-white/25 hover:-translate-y-0.5 active:translate-y-0',
    outline: 'bg-transparent hover:bg-white/10 text-white border border-white/30 hover:border-white/60',
    ghost: 'bg-transparent hover:bg-white/10 text-[#b3b3b3] hover:text-white',
  };

  const sizeClasses = {
    sm: 'text-xs px-3.5 py-1.5 gap-1.5',
    md: 'text-[0.82rem] px-4.5 py-2 gap-2',
    lg: 'text-sm px-6 py-2.5 gap-2.5',
  };

  const roundedClass = rounded === 'full' ? 'rounded-full' : (rounded ? `rounded-${rounded}` : 'rounded-full');

  const combinedClasses = `${baseClasses} ${variantClasses[variant] || variantClasses.primary} ${sizeClasses[size] || sizeClasses.md} ${roundedClass} ${className}`.trim();

  const content = (
    <>
      {icon && iconPosition === 'left' && <span className="inline-flex shrink-0">{icon}</span>}
      {children}
      {icon && iconPosition === 'right' && <span className="inline-flex shrink-0">{icon}</span>}
    </>
  );

  if (href) {
    return (
      <a href={href} className={combinedClasses} {...props}>
        {content}
      </a>
    );
  }

  return (
    <button type={type} onClick={onClick} className={combinedClasses} {...props}>
      {content}
    </button>
  );
}
