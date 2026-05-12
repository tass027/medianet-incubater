'use client';

import { useEffect } from 'react';
import { cn } from '@/app/lib/utils';

/**
 * Modal Component
 * 
 * @param {Object} props
 * @param {boolean} props.isOpen - Controls whether modal is visible
 * @param {function} props.onClose - Function to call when modal should close
 * @param {string} props.title - Modal header title
 * @param {React.ReactNode} props.children - Modal content
 * @param {string} props.size - Modal size: 'sm' | 'md' | 'lg' | 'xl' | 'full' | 'screen'
 * @param {boolean} props.closeOnClickOutside - Whether to close when clicking overlay (default: true)
 * @param {boolean} props.showCloseButton - Whether to show X button in header (default: true)
 * @param {React.ReactNode} props.footer - Custom footer content (optional)
 * @param {string} props.className - Additional CSS classes for modal content
 * @param {string} props.overlayClassName - Additional CSS classes for overlay
 * @param {function} props.onAfterOpen - Callback after modal opens
 * @param {function} props.onAfterClose - Callback after modal closes
 * @param {boolean} props.closeOnEsc - Close on Escape key (default: true)
 * @param {boolean} props.showFooter - Show default footer (default: false)
 * @param {string} props.closeText - Text for default close button (default: 'Close')
 */
export default function Modal({
  // Core props
  isOpen = false,
  onClose,
  title = '',
  children,
  
  // Appearance props
  size = 'md',
  className = '',
  overlayClassName = '',
  
  // Behavior props
  closeOnClickOutside = true,
  closeOnEsc = true,
  showCloseButton = true,
  showFooter = false,
  
  // Optional props
  footer,
  closeText = 'Close',
  onAfterOpen,
  onAfterClose,
}) {
  
  // ===================================================
  // 1. EFFECTS - Handle side effects
  // ===================================================
  
  // Lock body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      const scrollY = window.scrollY;
      const originalStyle = window.getComputedStyle(document.body).overflow;
      
      document.body.style.overflow = 'hidden';
      document.body.style.position = 'fixed';
      document.body.style.top = `-${scrollY}px`;
      document.body.style.width = '100%';
      
      if (onAfterOpen) onAfterOpen();
      
      return () => {
        document.body.style.overflow = originalStyle;
        document.body.style.position = '';
        document.body.style.top = '';
        document.body.style.width = '';
        window.scrollTo(0, scrollY);
        if (onAfterClose) onAfterClose();
      };
    }
  }, [isOpen, onAfterOpen, onAfterClose]);
  
  // Handle ESC key press
  useEffect(() => {
    const handleEscKey = (event) => {
      if (event.key === 'Escape' && isOpen && onClose && closeOnEsc) {
        onClose();
      }
    };
    
    if (isOpen) {
      document.addEventListener('keydown', handleEscKey);
    }
    
    return () => {
      document.removeEventListener('keydown', handleEscKey);
    };
  }, [isOpen, onClose, closeOnEsc]);

  // Handle overlay click
  const handleOverlayClick = (e) => {
    if (closeOnClickOutside && e.target === e.currentTarget && onClose) {
      onClose();
    }
  };

  // Size classes mapping
  const sizeClasses = {
    sm: 'max-w-md',      // 448px
    md: 'max-w-lg',      // 512px
    lg: 'max-w-2xl',     // 672px
    xl: 'max-w-4xl',     // 896px
    full: 'max-w-6xl',   // 1152px
    screen: 'max-w-[95vw] min-h-[90vh] max-h-[90vh]', // Almost full screen
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 overflow-y-auto"
      aria-labelledby="modal-title"
      role="dialog"
      aria-modal="true"
      onClick={handleOverlayClick}
    >
      {/* Centering container */}
      <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
        
        {/* Backdrop with blur effect */}
        <div
          className={cn(
            "fixed inset-0 bg-gray-500/75 dark:bg-gray-900/85 backdrop-blur-sm transition-opacity",
            overlayClassName
          )}
          aria-hidden="true"
          onClick={closeOnClickOutside ? onClose : undefined}
        />

        {/* Centering helper */}
        <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">
          &#8203;
        </span>

        {/* Modal Content */}
        <div
          className={cn(
            // Base styles
            "inline-block align-bottom bg-white dark:bg-gray-800 rounded-2xl text-left overflow-hidden",
            "shadow-xl dark:shadow-2xl transform transition-all",
            "sm:my-8 sm:align-middle w-full",
            "animate-modal-enter", // Custom animation
            
            // Size
            sizeClasses[size] || sizeClasses.md,
            
            // Custom classes
            className
          )}
          onClick={(e) => e.stopPropagation()}
        >
          
          {/* ======================================= */}
          {/* MODAL HEADER */}
          {/* ======================================= */}
          {(title || showCloseButton) && (
            <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between">
                
                {/* Title with optional icon slot */}
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  {title && (
                    <h3
                      className="text-lg font-semibold text-gray-900 dark:text-white truncate"
                      id="modal-title"
                    >
                      {title}
                    </h3>
                  )}
                </div>
                
                {/* Close button */}
                {showCloseButton && (
                  <button
                    type="button"
                    onClick={onClose}
                    className={cn(
                      "flex items-center justify-center",
                      "w-8 h-8 rounded-lg",
                      "text-gray-400 hover:text-gray-500 dark:text-gray-500 dark:hover:text-gray-400",
                      "hover:bg-gray-100 dark:hover:bg-gray-700",
                      "focus:outline-none focus:ring-2 focus:ring-primary-500 dark:focus:ring-primary-400",
                      "transition-colors"
                    )}
                    aria-label="Close modal"
                  >
                    <svg
                      className="h-5 w-5"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={2}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M6 18L18 6M6 6l12 12"
                      />
                    </svg>
                  </button>
                )}
              </div>
            </div>
          )}

          {/* ======================================= */}
          {/* MODAL BODY */}
          {/* ======================================= */}
          <div className="px-6 py-5 dark:text-gray-300">
            {children}
          </div>

          {/* ======================================= */}
          {/* MODAL FOOTER */}
          {/* ======================================= */}
          {footer !== undefined ? (
            // Custom footer
            <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
              {footer}
            </div>
          ) : showFooter ? (
            // Default footer with close button
            <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={onClose}
                  className={cn(
                    "px-5 py-2 text-sm font-medium",
                    "text-gray-700 dark:text-gray-300",
                    "bg-white dark:bg-gray-800",
                    "border border-gray-300 dark:border-gray-600",
                    "rounded-lg",
                    "hover:bg-gray-50 dark:hover:bg-gray-700",
                    "focus:outline-none focus:ring-2 focus:ring-offset-2",
                    "focus:ring-primary-500 dark:focus:ring-primary-400",
                    "transition-colors"
                  )}
                >
                  {closeText}
                </button>
              </div>
            </div>
          ) : null}
        </div>
      </div>

      {/* Add animation styles */}
      <style jsx>{`
        @keyframes modalEnter {
          from {
            opacity: 0;
            transform: scale(0.95) translateY(-10px);
          }
          to {
            opacity: 1;
            transform: scale(1) translateY(0);
          }
        }
        
        .animate-modal-enter {
          animation: modalEnter 0.2s ease-out;
        }
      `}</style>
    </div>
  );
}