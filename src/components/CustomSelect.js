import React, { useState, useRef, useEffect } from 'react';
import styles from './CustomSelect.module.css';

/**
 * Generic custom dropdown/select component
 * @param {string} value - Currently selected value
 * @param {Array} options - Array of {value, label, description} objects
 * @param {Function} onChange - Callback with selected value
 * @param {string} placeholder - Placeholder text
 * @param {boolean} disabled - Disabled state
 * @param {string} name - Form field name
 */
export default function CustomSelect({ 
  value, 
  options = [], 
  onChange, 
  placeholder = "Select an option", 
  disabled = false,
  name = ''
}) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Find selected option
  const selectedOption = options.find(opt => String(opt.value) === String(value));

  // Handle outside clicks
  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('touchstart', handleClickOutside);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, [isOpen]);

  const toggleDropdown = () => {
    if (!disabled) setIsOpen(!isOpen);
  };

  const handleSelect = (optionValue) => {
    onChange(optionValue);
    setIsOpen(false);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      toggleDropdown();
    } else if (e.key === 'Escape') {
      setIsOpen(false);
    }
  };

  return (
    <div 
      className={`${styles.dropdown} ${disabled ? styles.disabled : ''}`}
      ref={dropdownRef}
    >
      <button
        type="button"
        className={`${styles.dropdownBtn} ${isOpen ? styles.dropdownBtnOpen : ''}`}
        onClick={toggleDropdown}
        onKeyDown={handleKeyDown}
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
      >
        <div className={styles.dropdownBtnText}>
          {selectedOption ? (
            <div className={styles.selectedValue}>
              <span className={styles.optionLabel}>{selectedOption.label}</span>
              {selectedOption.description && (
                <span className={styles.optionDescription}>{selectedOption.description}</span>
              )}
            </div>
          ) : (
            <span className={styles.placeholder}>{placeholder}</span>
          )}
        </div>
        <span className={`${styles.chevron} ${isOpen ? styles.chevronOpen : ''}`}>
          ▼
        </span>
      </button>

      {isOpen && (
        <div className={styles.dropdownMenu} role="listbox">
          {options.length === 0 ? (
            <div className={styles.emptyState}>No options available</div>
          ) : (
            options.map((option) => {
              const isSelected = String(option.value) === String(value);
              return (
                <button
                  key={option.value}
                  type="button"
                  className={`${styles.dropdownOption} ${isSelected ? styles.dropdownOptionActive : ''}`}
                  onClick={() => handleSelect(option.value)}
                  role="option"
                  aria-selected={isSelected}
                >
                  <div className={styles.optionContent}>
                    <span className={styles.optionLabel}>{option.label}</span>
                    {option.description && (
                      <span className={styles.optionDescription}>{option.description}</span>
                    )}
                  </div>
                  {isSelected && (
                    <span className={styles.checkmark}>✓</span>
                  )}
                </button>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}
