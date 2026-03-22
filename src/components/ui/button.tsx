'use client';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
}

export function Button({
  variant = 'primary',
  size = 'md',
  loading,
  children,
  className = '',
  ...props
}: ButtonProps) {
  const base =
    'font-bold rounded-2xl transition-all duration-200 active:scale-95 disabled:opacity-50 min-h-[48px] flex items-center justify-center';
  const variants = {
    primary: 'bg-purple-600 hover:bg-purple-700 text-white shadow-lg shadow-purple-200',
    secondary: 'bg-teal-500 hover:bg-teal-600 text-white shadow-lg shadow-teal-200',
    ghost: 'bg-transparent hover:bg-purple-100 text-purple-700',
  };
  const sizes = {
    sm: 'px-4 py-2 text-sm',
    md: 'px-6 py-3 text-base',
    lg: 'px-8 py-4 text-lg',
  };

  return (
    <button
      className={`${base} ${variants[variant]} ${sizes[size]} ${className}`}
      disabled={loading || props.disabled}
      {...props}
    >
      {loading ? (
        <span className="animate-spin inline-block w-5 h-5 border-2 border-white border-t-transparent rounded-full" />
      ) : (
        children
      )}
    </button>
  );
}
