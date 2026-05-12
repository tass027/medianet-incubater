'use client';

import { cn } from '@/app/lib/utils';
import { X } from 'lucide-react';

export default function Alert({ 
  type = 'info', 
  message, 
  onClose,
  className 
}) {
  const types = {
    success: {
      bg: 'bg-green-50 border-green-200',
      text: 'text-green-800',
      icon: '✓',
    },
    error: {
      bg: 'bg-red-50 border-red-200',
      text: 'text-red-800',
      icon: '✕',
    },
    warning: {
      bg: 'bg-yellow-50 border-yellow-200',
      text: 'text-yellow-800',
      icon: '⚠',
    },
    info: {
      bg: 'bg-blue-50 border-blue-200',
      text: 'text-blue-800',
      icon: 'ℹ',
    },
  };

  const config = types[type];

  return (
    <div
      className={cn(
        'border rounded-lg p-4 flex items-start gap-3',
        config.bg,
        config.text,
        className
      )}
    >
      <span className="text-lg font-bold">{config.icon}</span>
      <p className="flex-1">{message}</p>
      {onClose && (
        <button
          onClick={onClose}
          className="hover:opacity-70 transition-opacity"
        >
          <X size={18} />
        </button>
      )}
    </div>
  );
}