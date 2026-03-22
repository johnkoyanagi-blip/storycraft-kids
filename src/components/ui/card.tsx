'use client';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
}

export function Card({ children, className = '', onClick }: CardProps) {
  return (
    <div
      className={`bg-white rounded-3xl shadow-md p-6 ${
        onClick ? 'cursor-pointer hover:shadow-lg hover:-translate-y-1 transition-all' : ''
      } ${className}`}
      onClick={onClick}
    >
      {children}
    </div>
  );
}
