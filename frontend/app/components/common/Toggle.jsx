'use client';

export default function Toggle({
  enabled = false,
  onChange,
  label,
  disabled = false,
  size = 'md',
  className = ''
}) {
  const sizes = {
    sm: {
      toggle: 'w-8 h-4',
      circle: 'w-3 h-3',
      translate: 'translate-x-4'
    },
    md: {
      toggle: 'w-10 h-5',
      circle: 'w-4 h-4',
      translate: 'translate-x-5'
    },
    lg: {
      toggle: 'w-12 h-6',
      circle: 'w-5 h-5',
      translate: 'translate-x-6'
    }
  };

  return (
    <label className={`flex items-center ${disabled ? 'opacity-50' : 'cursor-pointer'} ${className}`}>
      <div className="relative">
        {/* Toggle background */}
        <div
          className={`
            ${sizes[size].toggle}
            ${enabled ? 'bg-primary-500' : 'bg-gray-300'}
            rounded-full
            transition-colors duration-200
          `}
          onClick={() => !disabled && onChange(!enabled)}
        />
        
        {/* Toggle circle */}
        <div
          className={`
            absolute top-0.5 left-0.5
            ${sizes[size].circle}
            bg-white
            rounded-full
            shadow
            transform transition-transform duration-200
            ${enabled ? sizes[size].translate : 'translate-x-0'}
          `}
          onClick={() => !disabled && onChange(!enabled)}
        />
      </div>

      {/* Label */}
      {label && (
        <span className="ml-3 text-gray-700">
          {label}
        </span>
      )}
    </label>
  );
}