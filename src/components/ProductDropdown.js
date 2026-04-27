import React, { useState, useRef, useEffect } from 'react';
import styles from './ProductDropdown.module.css';

/**
 * ProductDropdown — Custom dropdown component replacing native <select>
 * 
 * Features:
 * - Displays product name, price, and stock information
 * - Fully responsive (desktop, tablet, mobile)
 * - Touch and keyboard friendly
 * - Closes on outside click
 * - Scrollable options list
 * 
 * Props:
 * - value: Currently selected product ID (or empty string)
 * - options: Array of product objects { id, name, price, stock }
 * - onChange: Callback function (productId) => void
 * - placeholder: Optional placeholder text (default: "Select product")
 * - disabled: Optional disabled state
 */
export default function ProductDropdown({ 
  value, 
  options = [], 
  onChange, 
  placeholder = "Select product",
  disabled = false 
}) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Find the currently selected product
  const selectedProduct = options.find(p => p.id === value);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('touchstart', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, [isOpen]);

  // Handle option selection
  const handleSelect = (productId) => {
    onChange(productId);
    setIsOpen(false);
  };

  // Toggle dropdown open/close
  const toggleDropdown = () => {
    if (!disabled) {
      setIsOpen(!isOpen);
    }
  };

  // Keyboard support: Enter/Space to open, Escape to close
  const handleKeyDown = (e) => {
    if (disabled) return;
    
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      toggleDropdown();
    } else if (e.key === 'Escape' && isOpen) {
      setIsOpen(false);
    }
  };

  return (
    <div 
      className={`${styles.dropdown} ${disabled ? styles.disabled : ''}`} 
      ref={dropdownRef}
    >
      {/* Dropdown Button (shows selected value or placeholder) */}
      <button
        type="button"
        className={`${styles.dropdownBtn} ${isOpen ? styles.dropdownBtnOpen : ''}`}
        onClick={toggleDropdown}
        onKeyDown={handleKeyDown}
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
      >
        <span className={styles.dropdownBtnText}>
          {selectedProduct ? (
            <span className={styles.selectedValue}>
              <span className={styles.productName}>{selectedProduct.name}</span>
              <span className={styles.productMeta}>
                Rs.{Number(selectedProduct.price).toFixed(2)} · Stock: {selectedProduct.stock}
              </span>
            </span>
          ) : (
            <span className={styles.placeholder}>{placeholder}</span>
          )}
        </span>
        
        {/* Chevron icon */}
        <svg 
          className={`${styles.chevron} ${isOpen ? styles.chevronOpen : ''}`}
          width="16" 
          height="16" 
          viewBox="0 0 24 24" 
          fill="none"
          stroke="currentColor" 
          strokeWidth="2" 
          strokeLinecap="round"
        >
          <path d="M6 9l6 6 6-6" />
        </svg>
      </button>

      {/* Dropdown Options List */}
      {isOpen && (
        <div className={styles.dropdownMenu} role="listbox">
          {options.length === 0 ? (
            <div className={styles.emptyState}>No products available</div>
          ) : (
            options.map((product) => (
              <button
                key={product.id}
                type="button"
                className={`${styles.dropdownOption} ${
                  product.id === value ? styles.dropdownOptionActive : ''
                }`}
                onClick={() => handleSelect(product.id)}
                role="option"
                aria-selected={product.id === value}
              >
                <div className={styles.optionContent}>
                  <span className={styles.optionName}>{product.name}</span>
                  <span className={styles.optionMeta}>
                    Rs.{Number(product.price).toFixed(2)} · Stock: {product.stock}
                  </span>
                </div>
                
                {/* Checkmark for selected item */}
                {product.id === value && (
                  <svg 
                    className={styles.checkmark}
                    width="16" 
                    height="16" 
                    viewBox="0 0 24 24" 
                    fill="none"
                    stroke="currentColor" 
                    strokeWidth="3" 
                    strokeLinecap="round"
                  >
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                )}
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}
