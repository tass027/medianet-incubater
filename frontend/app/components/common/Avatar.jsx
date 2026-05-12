'use client';

import { useState } from 'react';
import Image from 'next/image';

export default function Avatar({
  src = null,
  name = '',
  size = 'md',
  shape = 'circle',
  border = false,
  status = null, // 'online', 'offline', 'busy'
  className = ''
}) {
  // Get initials from name
  const getInitials = () => {
    if (!name) return '?';
    const names = name.split(' ');
    if (names.length === 1) return names[0].charAt(0).toUpperCase();
    return (names[0].charAt(0) + names[names.length - 1].charAt(0)).toUpperCase();
  };

  // Random background color based on name
  const getRandomColor = () => {
    if (!name) return 'bg-gray-400';
    const colors = [
      'bg-red-500', 'bg-blue-500', 'bg-green-500', 'bg-yellow-500',
      'bg-purple-500', 'bg-pink-500', 'bg-indigo-500', 'bg-teal-500',
      'bg-orange-500', 'bg-cyan-500'
    ];
    const index = name.charCodeAt(0) % colors.length;
    return colors[index];
  };

  const sizes = {
    xs: 'w-6 h-6 text-xs',
    sm: 'w-8 h-8 text-sm',
    md: 'w-10 h-10 text-base',
    lg: 'w-12 h-12 text-lg',
    xl: 'w-16 h-16 text-xl',
    '2xl': 'w-20 h-20 text-2xl'
  };

  const shapes = {
    circle: 'rounded-full',
    square: 'rounded-lg',
    rounded: 'rounded-md'
  };

  const statusColors = {
    online: 'bg-green-500',
    offline: 'bg-gray-400',
    busy: 'bg-red-500',
    away: 'bg-yellow-500'
  };

  const statusSizes = {
    xs: 'w-1.5 h-1.5',
    sm: 'w-2 h-2',
    md: 'w-2.5 h-2.5',
    lg: 'w-3 h-3',
    xl: 'w-3.5 h-3.5',
    '2xl': 'w-4 h-4'
  };

  return (
    <div className="relative inline-block">
      {/* Avatar */}
      <div
        className={`
          ${sizes[size]} 
          ${shapes[shape]}
          ${border ? 'ring-2 ring-white ring-offset-2 ring-offset-gray-50' : ''}
          flex items-center justify-center
          ${src ? '' : getRandomColor()}
          overflow-hidden
          ${className}
        `}
      >
        {src ? (
          <Image
            src={src}
            alt={name || 'Avatar'}
            width={100}
            height={100}
            className="w-full h-full object-cover"
          />
        ) : (
          <span className="text-white font-medium">
            {getInitials()}
          </span>
        )}
      </div>

      {/* Status indicator */}
      {status && (
        <span
          className={`
            absolute bottom-0 right-0
            ${statusSizes[size]}
            ${statusColors[status]}
            rounded-full
            ring-2 ring-white
          `}
        />
      )}
    </div>
  );
}