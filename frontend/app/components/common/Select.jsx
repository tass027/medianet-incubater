'use client';
// 🖥️ Required for Next.js - this component runs in the browser

import React from 'react';
// ✅ Import React explicitly

// ===================================================
// SELECT COMPONENT
// A reusable dropdown select component with label, options, and error handling
// ===================================================

/**
 * Select Component
 * 
 * @param {Object} props
 * @param {string} props.label - Label text displayed above the select
 * @param {Array} props.options - Array of option objects: [{ value: 'id', label: 'Display Text' }]
 * @param {string} props.value - Currently selected value (controlled component)
 * @param {function} props.onChange - Change handler function (receives event)
 * @param {string} props.error - Error message to display (shows red border and message)
 * @param {string} props.className - Additional CSS classes to apply
 * @param {boolean} props.required - Whether field is required (adds * to label)
 * @param {boolean} props.disabled - Whether select is disabled
 * @param {string} props.placeholder - Placeholder text for first option
 * @param {string} props.name - Name attribute for form submission
 * @param {string} props.id - ID attribute for label association
 * @param {boolean} props.searchable - Whether to enable search (future feature)
 * @param {string} props.size - Size variant: 'sm' | 'md' | 'lg'
 * @param {string} props.variant - Style variant: 'default' | 'outline' | 'filled'
 * @param {function} props.onBlur - Blur event handler
 * @param {function} props.onFocus - Focus event handler
 * @param {any} props.defaultValue - Default value for uncontrolled component
 * @param {React.ReactNode} props.icon - Optional icon to display on left
 * @param {string} props.helperText - Additional helper text below select
 * @param {boolean} props.fullWidth - Whether select takes full width (default: true)
 */
export default function Select({
  // Core props
  label,
  options = [],
  value,
  onChange,
  error,
  
  // Appearance props
  className = '',
  size = 'md',           // 'sm' | 'md' | 'lg'
  variant = 'default',   // 'default' | 'outline' | 'filled'
  fullWidth = true,
  icon,
  
  // Behavior props
  required = false,
  disabled = false,
  placeholder = 'Select an option',
  
  // Form props
  name,
  id,
  
  // Event props
  onBlur,
  onFocus,
  
  // Other props
  helperText,
  defaultValue,
  ...props // Spread remaining props to select element
}) {
  
  // ===================================================
  // 1. HELPER FUNCTIONS - Get classes based on props
  // ===================================================
  
  /**
   * Get size classes based on size prop
   */
  const getSizeClasses = () => {
    switch(size) {
      case 'sm':
        return 'px-3 py-2 text-sm';      // Small - less padding, smaller text
      case 'lg':
        return 'px-6 py-4 text-lg';      // Large - more padding, larger text
      case 'md':
      default:
        return 'px-4 py-3 text-base';    // Medium - default
    }
  };

  /**
   * Get variant classes based on variant prop and error state
   */
  const getVariantClasses = () => {
    // Base classes that apply to all variants
    const baseClasses = 'w-full rounded-lg transition duration-200 outline-none';
    
    // Error state overrides all variants
    if (error) {
      return `${baseClasses} border-red-500 focus:ring-2 focus:ring-red-200 focus:border-red-500`;
    }
    
    // Variant-specific classes
    switch(variant) {
      case 'outline':
        return `${baseClasses} border-2 border-gray-300 bg-transparent hover:border-gray-400 focus:border-primary-500 focus:ring-2 focus:ring-primary-200`;
        
      case 'filled':
        return `${baseClasses} border border-transparent bg-gray-100 hover:bg-gray-200 focus:bg-white focus:border-primary-500 focus:ring-2 focus:ring-primary-200`;
        
      case 'default':
      default:
        return `${baseClasses} border border-gray-300 bg-white hover:border-gray-400 focus:border-primary-500 focus:ring-2 focus:ring-primary-200`;
    }
  };

  /**
   * Get disabled classes
   */
  const getDisabledClasses = () => {
    if (disabled) {
      return 'bg-gray-100 cursor-not-allowed opacity-60';
    }
    return '';
  };

  /**
   * Generate unique ID if not provided
   */
  const selectId = id || `select-${Math.random().toString(36).substr(2, 9)}`;


  // ===================================================
  // 2. RENDER THE COMPONENT
  // ===================================================
  
  return (
    <div className={`${fullWidth ? 'w-full' : 'w-auto'} ${className}`}>
      
      {/* ===== LABEL SECTION ===== */}
      {label && (
        <label
          htmlFor={selectId}
          className={`
            block 
            text-sm 
            font-medium 
            mb-2
            ${disabled ? 'text-gray-400' : 'text-gray-700'}
          `}
        >
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}

      {/* ===== SELECT CONTAINER ===== */}
      <div className="relative">
        
        {/* Optional icon on left side */}
        {icon && (
          <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">
            {icon}
          </div>
        )}

        {/* ===== SELECT ELEMENT ===== */}
        <select
          id={selectId}
          name={name}
          value={value}
          onChange={onChange}
          onBlur={onBlur}
          onFocus={onFocus}
          disabled={disabled}
          required={required}
          defaultValue={defaultValue}
          className={`
            ${getSizeClasses()}
            ${getVariantClasses()}
            ${getDisabledClasses()}
            ${icon ? 'pl-10' : ''}  // Add left padding if icon exists
            appearance-none           // Remove default browser styling
            bg-no-repeat
            bg-right
            pr-10                     // Space for custom arrow
          `}
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3E%3Cpath stroke='%236B7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3E%3C/svg%3E")`,
            backgroundPosition: 'right 0.75rem center',
            backgroundSize: '1.5em 1.5em',
          }}
          {...props}  // Spread any additional props to the select element
        >
          {/* Placeholder option (disabled so can't be selected) */}
          <option value="" disabled>
            {placeholder}
          </option>
          
          {/* Map through options array */}
          {options.map((option) => (
            <option
              key={option.value}
              value={option.value}
              disabled={option.disabled || false}
              className="py-2"
            >
              {option.label}
            </option>
          ))}
        </select>

        {/* ===== CUSTOM DROPDOWN ARROW ===== */}
        {/* Hidden - we're using background-image above */}
        
      </div>

      {/* ===== ERROR MESSAGE ===== */}
      {error && (
        <p className="mt-2 text-sm text-red-600 flex items-center gap-1">
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
          {error}
        </p>
      )}

      {/* ===== HELPER TEXT ===== */}
      {helperText && !error && (
        <p className="mt-2 text-sm text-gray-500">
          {helperText}
        </p>
      )}
    </div>
  );
}


// ===================================================
// PROPTYPES DOCUMENTATION (for reference)
// ===================================================

/**
 * Select Component Usage Examples:
 * 
 * // Basic usage
 * <Select
 *   label="Country"
 *   options={[
 *     { value: 'tn', label: 'Tunisia' },
 *     { value: 'ma', label: 'Morocco' },
 *     { value: 'ci', label: 'Côte d\'Ivoire' }
 *   ]}
 *   value={country}
 *   onChange={(e) => setCountry(e.target.value)}
 * />
 * 
 * // With error
 * <Select
 *   label="Role"
 *   options={roleOptions}
 *   value={role}
 *   onChange={handleRoleChange}
 *   error="Please select a role"
 *   required
 * />
 * 
 * // Small size with icon
 * <Select
 *   size="sm"
 *   icon={<UserIcon />}
 *   options={userOptions}
 *   value={userId}
 *   onChange={handleUserChange}
 * />
 * 
 * // Disabled state
 * <Select
 *   label="Status"
 *   options={statusOptions}
 *   value="active"
 *   disabled
 * />
 * 
 * // Filled variant
 * <Select
 *   variant="filled"
 *   label="Department"
 *   options={deptOptions}
 *   value={department}
 *   onChange={handleDeptChange}
 * />
 * 
 * // With helper text
 * <Select
 *   label="Investment Stage"
 *   options={stageOptions}
 *   value={stage}
 *   onChange={handleStageChange}
 *   helperText="Select the current stage of your startup"
 * />
 */


// ===================================================
// COMMON OPTION SETS FOR VENTUREBRIDGE
// ===================================================

// These are examples of option sets you might use in your app

/**
 * Role options for user management
 */
export const ROLE_OPTIONS = [
  { value: 'admin', label: 'MEDIANET Admin' },
  { value: 'founder', label: 'Intrapreneur' },
  { value: 'investor', label: 'Africinvest Investor' },
  { value: 'mentor', label: 'Mentor' },
  { value: 'applicant', label: 'External Applicant' },
];

/**
 * Status options
 */
export const STATUS_OPTIONS = [
  { value: 'active', label: 'Active' },
  { value: 'inactive', label: 'Inactive' },
  { value: 'pending', label: 'Pending' },
];

/**
 * Industry/sector options
 */
export const INDUSTRY_OPTIONS = [
  { value: 'fintech', label: 'FinTech / Mobile Money' },
  { value: 'healthtech', label: 'HealthTech / Telemedicine' },
  { value: 'agritech', label: 'AgriTech' },
  { value: 'edtech', label: 'EdTech' },
  { value: 'cleantech', label: 'CleanTech / Renewable Energy' },
  { value: 'ecommerce', label: 'E-commerce' },
  { value: 'logistics', label: 'Logistics & Supply Chain' },
  { value: 'tourism', label: 'Digital Tourism' },
  { value: 'other', label: 'Other' },
];

/**
 * Startup stage options
 */
export const STAGE_OPTIONS = [
  { value: 'idea', label: 'Idea / Concept' },
  { value: 'pre-seed', label: 'Pre-seed' },
  { value: 'seed', label: 'Seed' },
  { value: 'series-a', label: 'Series A' },
  { value: 'growth', label: 'Growth' },
];

/**
 * Location options (Tunisia/Africa focus)
 */
export const LOCATION_OPTIONS = [
  { value: 'tunis', label: 'Tunis, Tunisia' },
  { value: 'sfax', label: 'Sfax, Tunisia' },
  { value: 'sousse', label: 'Sousse, Tunisia' },
  { value: 'casablanca', label: 'Casablanca, Morocco' },
  { value: 'rabat', label: 'Rabat, Morocco' },
  { value: 'abidjan', label: 'Abidjan, Côte d\'Ivoire' },
  { value: 'dakar', label: 'Dakar, Senegal' },
  { value: 'nairobi', label: 'Nairobi, Kenya' },
  { value: 'remote', label: 'Remote / Any' },
];

/**
 * Investment amount options (in TND)
 */
export const AMOUNT_OPTIONS = [
  { value: '0-100k', label: '0 - 100,000 TND' },
  { value: '100k-250k', label: '100,000 - 250,000 TND' },
  { value: '250k-500k', label: '250,000 - 500,000 TND' },
  { value: '500k-1m', label: '500,000 - 1,000,000 TND' },
  { value: '1m-2m', label: '1,000,000 - 2,000,000 TND' },
  { value: '2m+', label: '2,000,000+ TND' },
];