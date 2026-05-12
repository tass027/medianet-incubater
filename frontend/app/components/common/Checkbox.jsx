'use client';

export default function Checkbox({
  label,
  checked = false,
  onChange,
  disabled = false,
  error = false,
  size = 'md',
  className = ''
}) {
  const sizes = {
    sm: 'h-3 w-3',
    md: 'h-4 w-4',
    lg: 'h-5 w-5'
  };

  const labelSizes = {
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-lg'
  };

  return (
    <label className={`flex items-center space-x-3 ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}>
      <input
        type="checkbox"
        checked={checked}
        onChange={onChange}
        disabled={disabled}
        className={`
          ${sizes[size]}
          rounded
          border-2
          transition
          focus:ring-2 focus:ring-primary-500 focus:ring-offset-2
          ${error ? 'border-red-500' : 'border-gray-300'}
          ${checked ? 'bg-primary-600 border-primary-600' : ''}
          ${disabled ? 'cursor-not-allowed' : ''}
          ${className}
        `}
      />
      {label && (
        <span className={`${labelSizes[size]} text-gray-700`}>
          {label}
        </span>
      )}
    </label>
  );
}