'use client';

import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Search, ChevronDown, Check, X, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface SearchableOption {
  value: string;
  label: string;
  sublabel?: string;
}

export interface SearchableSelectProps {
  value: string;
  onChange: (value: string) => void;
  options: Array<SearchableOption | string>;
  placeholder?: string;
  disabled?: boolean;
  disabledPlaceholder?: string;
  searchPlaceholder?: string;
  className?: string;
  id?: string;
  name?: string;
  isLoading?: boolean;
  loadingPlaceholder?: string;
}

export const SearchableSelect: React.FC<SearchableSelectProps> = ({
  value,
  onChange,
  options,
  placeholder = '-- Pilih --',
  disabled = false,
  disabledPlaceholder = '-- Terkunci --',
  searchPlaceholder = 'Ketik untuk mencari...',
  className,
  id,
  isLoading = false,
  loadingPlaceholder = 'Memuat data...',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Normalize options to SearchableOption[]
  const normalizedOptions = useMemo<SearchableOption[]>(() => {
    return options.map((opt) => {
      if (typeof opt === 'string') {
        return { value: opt, label: opt };
      }
      return opt;
    });
  }, [options]);

  // Find currently selected option
  const selectedOption = useMemo(() => {
    if (!value) return null;
    return (
      normalizedOptions.find((o) => o.value === value || o.label === value) || {
        value,
        label: value,
      }
    );
  }, [normalizedOptions, value]);

  // Filter options by search query
  const filteredOptions = useMemo(() => {
    if (!searchQuery.trim()) return normalizedOptions;
    const q = searchQuery.toLowerCase().trim();
    return normalizedOptions.filter(
      (opt) =>
        opt.label.toLowerCase().includes(q) ||
        (opt.sublabel && opt.sublabel.toLowerCase().includes(q)) ||
        opt.value.toLowerCase().includes(q)
    );
  }, [normalizedOptions, searchQuery]);

  // Auto focus search input when dropdown opens
  useEffect(() => {
    if (isOpen && searchInputRef.current) {
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 50);
    } else {
      setSearchQuery('');
    }
  }, [isOpen]);

  // Close on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      setIsOpen(false);
    } else if (e.key === 'Enter' && isOpen && filteredOptions.length > 0) {
      e.preventDefault();
      handleSelect(filteredOptions[0].value);
    }
  };

  const handleSelect = (selectedValue: string) => {
    onChange(selectedValue);
    setIsOpen(false);
    setSearchQuery('');
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange('');
  };

  return (
    <div ref={containerRef} className="relative w-full text-xs" onKeyDown={handleKeyDown}>
      {/* Trigger Button */}
      <button
        type="button"
        id={id}
        disabled={disabled || isLoading}
        onClick={() => !disabled && !isLoading && setIsOpen(!isOpen)}
        className={cn(
          'flex h-8.5 w-full items-center justify-between rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs text-left shadow-xs transition-all duration-150',
          disabled || isLoading
            ? 'cursor-not-allowed bg-slate-100/80 text-slate-400 border-slate-200/80'
            : isOpen
            ? 'border-blue-500 ring-2 ring-blue-500/20 bg-white'
            : 'hover:border-slate-300 hover:bg-slate-50/50 cursor-pointer',
          className
        )}
      >
        <span className="truncate flex-1 font-medium pr-1">
          {disabled ? (
            <span className="text-slate-400 font-normal">{disabledPlaceholder}</span>
          ) : isLoading ? (
            <span className="text-blue-600 font-normal flex items-center gap-1.5">
              <Loader2 className="h-3 w-3 animate-spin text-blue-600 inline" />
              {loadingPlaceholder}
            </span>
          ) : selectedOption ? (
            <span className="text-slate-800">{selectedOption.label}</span>
          ) : (
            <span className="text-slate-400 font-normal">{placeholder}</span>
          )}
        </span>

        <div className="flex items-center gap-1 shrink-0 text-slate-400">
          {!disabled && !isLoading && selectedOption && (
            <span
              onClick={handleClear}
              className="hover:text-slate-600 hover:bg-slate-200 rounded p-0.5 transition-colors"
              title="Hapus pilihan"
            >
              <X className="h-3 w-3" />
            </span>
          )}
          {isLoading ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin text-blue-600" />
          ) : (
            <ChevronDown
              className={cn(
                'h-3.5 w-3.5 transition-transform duration-200',
                isOpen && 'rotate-180 text-blue-600'
              )}
            />
          )}
        </div>
      </button>

      {/* Dropdown Popup */}
      {isOpen && !disabled && (
        <div className="absolute z-50 mt-1 w-full rounded-xl border border-slate-200 bg-white shadow-xl ring-1 ring-black/5 animate-in fade-in-50 zoom-in-95 duration-100 overflow-hidden">
          {/* Inline Search Input */}
          <div className="p-1.5 border-b border-slate-100 bg-slate-50/80 flex items-center gap-1.5">
            <Search className="h-3.5 w-3.5 text-slate-400 shrink-0 ml-1" />
            <input
              ref={searchInputRef}
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={searchPlaceholder}
              className="w-full bg-transparent text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none py-1"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="text-slate-400 hover:text-slate-600 p-0.5 rounded"
              >
                <X className="h-3 w-3" />
              </button>
            )}
          </div>

          {/* Options List */}
          <div className="max-h-56 overflow-y-auto p-1 divide-y divide-slate-50/50">
            {filteredOptions.length === 0 ? (
              <div className="py-4 text-center text-xs text-slate-400">
                Tidak ada hasil untuk &ldquo;<span className="font-semibold text-slate-600">{searchQuery}</span>&rdquo;
              </div>
            ) : (
              filteredOptions.map((option) => {
                const isSelected = selectedOption?.value === option.value;
                return (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => handleSelect(option.value)}
                    className={cn(
                      'w-full flex items-center justify-between px-2.5 py-1.5 text-xs text-left rounded-md transition-colors cursor-pointer',
                      isSelected
                        ? 'bg-blue-50 text-blue-700 font-semibold'
                        : 'text-slate-700 hover:bg-slate-100/80'
                    )}
                  >
                    <div className="truncate flex-1 pr-2">
                      <div>{option.label}</div>
                      {option.sublabel && (
                        <div className="text-[10px] text-slate-400 font-normal">{option.sublabel}</div>
                      )}
                    </div>
                    {isSelected && <Check className="h-3.5 w-3.5 text-blue-600 shrink-0" />}
                  </button>
                );
              })
            )}
          </div>

          {/* Footer Info */}
          <div className="px-2.5 py-1 border-t border-slate-100 bg-slate-50/50 text-[10px] text-slate-400 flex items-center justify-between">
            <span>{filteredOptions.length} dari {normalizedOptions.length} pilihan</span>
            <span className="text-[9px] text-slate-400">Tekan Esc untuk menutup</span>
          </div>
        </div>
      )}
    </div>
  );
};
