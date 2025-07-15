import React from 'react';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  className?: string;
}

export function Card({ children, className = '', ...props }: CardProps) {
  return (
    <div 
      className={`bg-white rounded-lg shadow-md p-6 ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}