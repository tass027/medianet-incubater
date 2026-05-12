'use client';

import { useState } from 'react';

export default function Tooltip({ 
  children, 
  content,
  position = 'top', // top, bottom, left, right
  delay = 200,
  className = ''
}) {
  const [isVisible, setIsVisible] = useState(false);
  const [timeoutId, setTimeoutId] = useState(null);

  const positions = {
    top: 'bottom-full left-1/2 -translate-x-1/2 mb-2',
    bottom: 'top-full left-1/2 -translate-x-1/2 mt-2',
    left: 'right-full top-1/2 -translate-y-1/2 mr-2',
    right: 'left-full top-1/2 -translate-y-1/2 ml-2',
  };

  const arrows = {
    top: 'bottom-0 left-1/2 -translate-x-1/2 translate-y-full border-t-gray-900',
    bottom: 'top-0 left-1/2 -translate-x-1/2 -translate-y-full border-b-gray-900',
    left: 'right-0 top-1/2 -translate-y-1/2 translate-x-full border-l-gray-900',
    right: 'left-0 top-1/2 -translate-y-1/2 -translate-x-full border-r-gray-900',
  };

  const handleMouseEnter = () => {
    const id = setTimeout(() => setIsVisible(true), delay);
    setTimeoutId(id);
  };

  const handleMouseLeave = () => {
    clearTimeout(timeoutId);
    setIsVisible(false);
  };

  return (
    <div
      className="relative inline-block"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {children}
      
      {isVisible && (
        <div className={`absolute z-50 ${positions[position]} ${className}`}>
          <div className="relative">
            <div className="bg-gray-900 text-white text-sm rounded-lg px-3 py-2 whitespace-nowrap">
              {content}
            </div>
            <div
              className={`absolute w-2 h-2 bg-gray-900 transform rotate-45 ${arrows[position]}`}
            />
          </div>
        </div>
      )}
    </div>
  );
}