'use client';

import Link from 'next/link';

export default function Breadcrumbs({
  items = [],
  separator = '/',
  className = ''
}) {
  const separators = {
    '/': 'text-gray-400',
    '>': 'text-gray-400',
    '→': 'text-gray-400',
    '›': 'text-gray-400 text-xl'
  };

  return (
    <nav className={`flex items-center space-x-2 text-sm ${className}`}>
      {items.map((item, index) => {
        const isLast = index === items.length - 1;

        return (
          <div key={index} className="flex items-center">
            {/* Item */}
            {item.href && !isLast ? (
              <Link
                href={item.href}
                className="text-gray-600 hover:text-primary-600 transition"
              >
                {item.label}
              </Link>
            ) : (
              <span className={isLast ? 'text-gray-900 font-medium' : 'text-gray-600'}>
                {item.label}
              </span>
            )}

            {/* Separator (not for last item) */}
            {!isLast && (
              <span className={`mx-2 ${separators[separator] || 'text-gray-400'}`}>
                {separator}
              </span>
            )}
          </div>
        );
      })}
    </nav>
  );
}