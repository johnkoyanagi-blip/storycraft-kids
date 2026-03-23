'use client';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export function Input({ label, error, className = '', ...props }: InputProps) {
  return (
    <div className="w-full">
      {label && <label className="block text-sm font-semibold text-purple-900 mb-1">{label}</label>}
      <input
        className={`w-full px-4 py-3 rounded-xl border-2 border-purple-200 focus:border-purple-500 focus:outline-none text-base text-gray-900 placeholder-gray-400 ${
          error ? 'border-red-400' : ''
        } ${className}`}
        {...props}
      />
      {error && <p className="text-red-500 text-sm mt-1">{error}</p>}
    </div>
  );
}
