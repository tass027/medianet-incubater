'use client';

import { cn } from '@/app/lib/utils';

export default function Card({ 
  title, 
  description, 
  children, 
  className,
  actions,
  padding = true,
  variant = 'default', // 'default', 'bordered', 'elevated', 'flat'
  size = 'md', // 'sm', 'md', 'lg'
  noHeader = false,
  headerClassName,
  bodyClassName,
  ...props
}) {
  
  // Size variations
  const sizeStyles = {
    sm: 'p-4',
    md: 'p-6',
    lg: 'p-8',
  };

  // Variant styles
  const variantStyles = {
    default: 'bg-white dark:bg-gray-800 shadow-md dark:shadow-gray-900/30',
    bordered: 'bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-sm',
    elevated: 'bg-white dark:bg-gray-800 shadow-xl dark:shadow-gray-900/40',
    flat: 'bg-gray-50 dark:bg-gray-800/50 shadow-none',
  };

  // Header text colors based on variant
  const headerTextStyles = {
    default: 'text-gray-900 dark:text-white',
    bordered: 'text-gray-900 dark:text-white',
    elevated: 'text-gray-900 dark:text-white',
    flat: 'text-gray-800 dark:text-gray-100',
  };

  // Description text colors
  const descriptionStyles = {
    default: 'text-gray-600 dark:text-gray-400',
    bordered: 'text-gray-600 dark:text-gray-400',
    elevated: 'text-gray-600 dark:text-gray-400',
    flat: 'text-gray-600 dark:text-gray-400',
  };

  return (
    <div
      className={cn(
        'rounded-xl transition-all duration-200',
        variantStyles[variant],
        className
      )}
      {...props}
    >
      {/* Header Section */}
      {!noHeader && (title || description || actions) && (
        <div className={cn(
          'flex items-start justify-between',
          padding && sizeStyles[size],
          !padding && 'px-0 pt-0',
          headerClassName
        )}>
          <div className="flex-1 min-w-0"> {/* min-w-0 prevents text overflow */}
            {title && (
              <h3 className={cn(
                'font-semibold tracking-tight',
                size === 'sm' && 'text-base',
                size === 'md' && 'text-lg',
                size === 'lg' && 'text-xl',
                headerTextStyles[variant]
              )}>
                {title}
              </h3>
            )}
            {description && (
              <p className={cn(
                'mt-1',
                size === 'sm' && 'text-xs',
                size === 'md' && 'text-sm',
                size === 'lg' && 'text-base',
                descriptionStyles[variant]
              )}>
                {description}
              </p>
            )}
          </div>
          
          {/* Actions */}
          {actions && (
            <div className={cn(
              'flex items-center gap-2 ml-4 shrink-0',
              size === 'sm' && 'text-sm',
              size === 'md' && 'text-base',
              size === 'lg' && 'text-lg'
            )}>
              {actions}
            </div>
          )}
        </div>
      )}

      {/* Content Section */}
      {children && (
        <div className={cn(
          padding && !noHeader && sizeStyles[size],
          padding && noHeader && sizeStyles[size],
          !padding && 'p-0',
          bodyClassName
        )}>
          {children}
        </div>
      )}
    </div>
  );
}

// Optional: Sub-components for more complex cards
Card.Header = function CardHeader({ children, className, size = 'md', noPadding = false }) {
  const sizeStyles = {
    sm: 'p-4',
    md: 'p-6',
    lg: 'p-8',
  };
  
  return (
    <div className={cn(
      'border-b border-gray-100 dark:border-gray-700',
      !noPadding && sizeStyles[size],
      className
    )}>
      {children}
    </div>
  );
};

Card.Body = function CardBody({ children, className, size = 'md', noPadding = false }) {
  const sizeStyles = {
    sm: 'p-4',
    md: 'p-6',
    lg: 'p-8',
  };
  
  return (
    <div className={cn(
      !noPadding && sizeStyles[size],
      className
    )}>
      {children}
    </div>
  );
};

Card.Footer = function CardFooter({ children, className, size = 'md', noPadding = false }) {
  const sizeStyles = {
    sm: 'p-4',
    md: 'p-6',
    lg: 'p-8',
  };
  
  return (
    <div className={cn(
      'border-t border-gray-100 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/50',
      !noPadding && sizeStyles[size],
      className
    )}>
      {children}
    </div>
  );
};