'use client';

import Button from './Button';

export default function Pagination({
  currentPage = 1,
  totalPages = 1,
  onPageChange,
  siblingCount = 1,
  showFirstLast = true,
  showPrevNext = true,
  size = 'md',
  className = ''
}) {
  // Generate page numbers to display
  const getPageNumbers = () => {
    const pages = [];
    const leftSibling = Math.max(1, currentPage - siblingCount);
    const rightSibling = Math.min(totalPages, currentPage + siblingCount);

    if (leftSibling > 2) {
      pages.push(1, '...');
    } else if (leftSibling === 2) {
      pages.push(1);
    }

    for (let i = leftSibling; i <= rightSibling; i++) {
      pages.push(i);
    }

    if (rightSibling < totalPages - 1) {
      pages.push('...', totalPages);
    } else if (rightSibling === totalPages - 1) {
      pages.push(totalPages);
    }

    return pages;
  };

  const sizes = {
    sm: 'px-2 py-1 text-sm',
    md: 'px-3 py-2',
    lg: 'px-4 py-3 text-lg'
  };

  return (
    <div className={`flex items-center justify-center space-x-2 ${className}`}>
      {/* First page button */}
      {showFirstLast && (
        <Button
          variant="ghost"
          size={size}
          onClick={() => onPageChange(1)}
          disabled={currentPage === 1}
          className="px-2"
        >
          «
        </Button>
      )}

      {/* Previous button */}
      {showPrevNext && (
        <Button
          variant="ghost"
          size={size}
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
        >
          ←
        </Button>
      )}

      {/* Page numbers */}
      {getPageNumbers().map((page, index) => (
        page === '...' ? (
          <span key={`ellipsis-${index}`} className="px-3 py-2 text-gray-400">
            ...
          </span>
        ) : (
          <button
            key={page}
            onClick={() => onPageChange(page)}
            className={`
              ${sizes[size]}
              rounded-lg
              transition
              ${currentPage === page
                ? 'bg-primary-500 text-white font-medium'
                : 'text-gray-700 hover:bg-gray-100'
              }
            `}
          >
            {page}
          </button>
        )
      ))}

      {/* Next button */}
      {showPrevNext && (
        <Button
          variant="ghost"
          size={size}
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
        >
          →
        </Button>
      )}

      {/* Last page button */}
      {showFirstLast && (
        <Button
          variant="ghost"
          size={size}
          onClick={() => onPageChange(totalPages)}
          disabled={currentPage === totalPages}
          className="px-2"
        >
          »
        </Button>
      )}
    </div>
  );
}