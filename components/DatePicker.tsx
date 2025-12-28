import React, { useState, useRef, useEffect, useLayoutEffect } from 'react';
import { createPortal } from 'react-dom';
import { format, addMonths, subMonths, getYear, getMonth, setYear, setMonth, startOfMonth, endOfMonth, startOfWeek, endOfWeek, addDays, isSameDay, isSameMonth, isValid } from 'date-fns';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, ChevronDown, Check } from 'lucide-react';

interface DatePickerProps {
  label?: string;
  value: string;
  onChange: (value: string) => void;
  className?: string;
  required?: boolean;
  mode?: 'date' | 'month-year';
}

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

const DatePicker: React.FC<DatePickerProps> = ({ label, value, onChange, className = '', required, mode = 'date' }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [view, setView] = useState<'calendar' | 'month-year'>('calendar');
  const containerRef = useRef<HTMLDivElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [coords, setCoords] = useState({ top: 0, left: 0, width: 320, maxHeight: 400 });
  const [positionClass, setPositionClass] = useState('origin-top-left');

  // Helper to parse local YYYY-MM-DD
  const parseDate = (str: string) => {
     if (!str) return new Date();
     if (str.length === 10) return new Date(str + 'T00:00:00');
     // Handle YYYY-MM for month-year mode
     if (str.length === 7) return new Date(str + '-01T00:00:00');
     return new Date(str);
  };

  const selectedDate = value ? parseDate(value) : undefined;
  const [currentDate, setCurrentDate] = useState(selectedDate && isValid(selectedDate) ? selectedDate : new Date());

  // Initialize view based on mode
  useEffect(() => {
      if (mode === 'month-year') setView('month-year');
  }, [mode]);

  // Sync internal state if external value changes while closed
  useEffect(() => {
    if (!isOpen && value) {
        const d = parseDate(value);
        if (isValid(d)) setCurrentDate(d);
    }
  }, [isOpen, value]);

  // Smart Positioning
  const updatePosition = () => {
    if (containerRef.current && isOpen) {
        const inputRect = containerRef.current.getBoundingClientRect();
        const viewportWidth = window.innerWidth;
        const viewportHeight = window.innerHeight;
        
        // Default Dimensions
        const width = 320; 
        const height = 380; // Approximate max height of content
        
        let top = inputRect.bottom + window.scrollY + 5;
        let left = inputRect.left + window.scrollX;
        let origin = 'origin-top-left';

        // Vertical Flip Check
        if (inputRect.bottom + height > viewportHeight && inputRect.top - height > 0) {
            // Flip to top
            top = inputRect.top + window.scrollY - height - 5;
            origin = 'origin-bottom-left';
        }

        // Horizontal Constraint
        if (left + width > viewportWidth) {
            left = Math.max(10, viewportWidth - width - 10);
            origin = origin.replace('left', 'right');
        } else if (left < 10) {
            left = 10;
        }

        // Mobile Width adjustment
        const finalWidth = Math.min(width, viewportWidth - 20);

        setCoords({ top, left, width: finalWidth, maxHeight: height });
        setPositionClass(origin);
    }
  };

  useLayoutEffect(() => {
      if (isOpen) {
          updatePosition();
          window.addEventListener('resize', updatePosition);
          window.addEventListener('scroll', updatePosition, true);
      }
      return () => {
          window.removeEventListener('resize', updatePosition);
          window.removeEventListener('scroll', updatePosition, true);
      };
  }, [isOpen]);

  // Click outside to close (Updated for Portal)
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      // Check if click is inside the trigger input
      const isClickInsideContainer = containerRef.current && containerRef.current.contains(event.target as Node);
      
      // Check if click is inside the dropdown (since it's in a portal, we look for data attribute)
      const target = event.target as HTMLElement;
      const isClickInsideDropdown = target.closest('[data-datepicker-dropdown]');

      if (!isClickInsideContainer && !isClickInsideDropdown) {
        setIsOpen(false);
        setView(mode === 'month-year' ? 'month-year' : 'calendar');
      }
    };
    
    if (isOpen) {
        document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen, mode]);

  const handleDayClick = (day: Date) => {
    onChange(format(day, 'yyyy-MM-dd'));
    setIsOpen(false);
    setView('calendar');
  };

  const handleMonthSelect = (monthIndex: number) => {
      const newDate = setMonth(currentDate, monthIndex);
      setCurrentDate(newDate);
      
      // If in month-year mode, selection ends here
      if (mode === 'month-year') {
          onChange(format(endOfMonth(newDate), 'yyyy-MM-dd')); // Return end of month
          setIsOpen(false);
      }
  };

  const handleYearSelect = (year: number) => {
      setCurrentDate(setYear(currentDate, year));
  };

  const toggleView = () => {
      if (mode === 'month-year') return; // Disable toggle in month-year mode
      setView(view === 'calendar' ? 'month-year' : 'calendar');
  };

  const renderHeader = () => {
    return (
      <div className="flex justify-between items-center mb-4 px-1">
        <button 
            type="button" 
            onClick={() => setCurrentDate(subMonths(currentDate, 1))}
            className="p-1 hover:bg-slate-100 rounded-lg text-slate-500 transition-colors active:scale-95"
            disabled={view !== 'calendar' && mode !== 'month-year'}
            style={{ opacity: (view === 'calendar' || mode === 'month-year') ? 1 : 0, pointerEvents: (view === 'calendar' || mode === 'month-year') ? 'auto' : 'none' }}
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        
        <button 
            type="button"
            onClick={toggleView}
            disabled={mode === 'month-year'}
            className={`text-sm font-bold text-slate-800 hover:bg-slate-100 px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1 active:scale-95 ${mode === 'month-year' ? 'cursor-default hover:bg-transparent' : ''}`}
        >
          {format(currentDate, mode === 'month-year' ? 'yyyy' : 'MMMM yyyy')}
          {mode !== 'month-year' && (
              <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform duration-200 ${view === 'month-year' ? 'rotate-180' : ''}`} />
          )}
        </button>

        <button 
            type="button" 
            onClick={() => setCurrentDate(addMonths(currentDate, 1))}
            className="p-1 hover:bg-slate-100 rounded-lg text-slate-500 transition-colors active:scale-95"
            disabled={view !== 'calendar' && mode !== 'month-year'}
            style={{ opacity: (view === 'calendar' || mode === 'month-year') ? 1 : 0, pointerEvents: (view === 'calendar' || mode === 'month-year') ? 'auto' : 'none' }}
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>
    );
  };

  const renderCalendar = () => {
      const monthStart = startOfMonth(currentDate);
      const monthEnd = endOfMonth(monthStart);
      const startDate = startOfWeek(monthStart);
      const endDate = endOfWeek(monthEnd);
      
      const dateFormat = "d";
      const rows = [];
      let days = [];
      let day = startDate;
      let formattedDate = "";

      // Headers
      const weekDays = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];
      const headerRow = (
          <div className="grid grid-cols-7 mb-2">
              {weekDays.map(d => (
                  <div key={d} className="text-[10px] font-bold text-slate-400 text-center uppercase tracking-wider">{d}</div>
              ))}
          </div>
      );

      while (day <= endDate) {
          for (let i = 0; i < 7; i++) {
              formattedDate = format(day, dateFormat);
              const cloneDay = new Date(day);
              const isSelected = selectedDate && isSameDay(day, selectedDate);
              const isCurrentMonth = isSameMonth(day, monthStart);
              const isToday = isSameDay(day, new Date());
              
              let dayClassName = "h-9 w-9 flex items-center justify-center text-sm rounded-full transition-all duration-200 relative ";
              
              if (isSelected) {
                  dayClassName += "bg-blue-600 text-white font-bold shadow-md hover:bg-blue-700";
              } else if (isToday) {
                  dayClassName += "text-blue-600 font-bold bg-blue-50 hover:bg-slate-100";
              } else if (!isCurrentMonth) {
                  dayClassName += "text-slate-300 hover:bg-slate-100";
              } else {
                  dayClassName += "text-slate-700 font-medium hover:bg-slate-100";
              }

              days.push(
                  <button
                      key={day.toString()}
                      type="button"
                      onClick={() => handleDayClick(cloneDay)}
                      className={dayClassName}
                  >
                      {formattedDate}
                      {isToday && !isSelected && (
                          <div className="absolute bottom-1 w-1 h-1 bg-blue-500 rounded-full" />
                      )}
                  </button>
              );
              day = addDays(day, 1);
          }
          rows.push(
              <div className="grid grid-cols-7 gap-y-1 justify-items-center" key={day.toString()}>
                  {days}
              </div>
          );
          days = [];
      }
      
      return (
          <div className="animate-fade-in">
              {headerRow}
              <div className="space-y-1">{rows}</div>
          </div>
      );
  };

  const renderMonthYearSelector = () => {
      const currentYear = getYear(currentDate);
      const currentMonthIndex = getMonth(currentDate);
      const startYear = currentYear - 10;
      const endYear = currentYear + 10;
      const years = Array.from({length: endYear - startYear + 1}, (_, i) => startYear + i);

      return (
          <div className="grid grid-cols-2 gap-4 h-[280px] animate-fade-in">
              {/* Months */}
              <div className="overflow-y-auto custom-scrollbar pr-1">
                  <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 sticky top-0 bg-white py-1">Month</div>
                  <div className="space-y-1">
                      {MONTHS.map((m, idx) => (
                          <button
                              key={m}
                              type="button"
                              onClick={() => {
                                  handleMonthSelect(idx);
                              }}
                              className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors flex items-center justify-between ${
                                  idx === currentMonthIndex 
                                  ? 'bg-blue-50 text-blue-700 font-bold' 
                                  : 'text-slate-600 hover:bg-slate-50'
                              }`}
                          >
                              {m}
                              {idx === currentMonthIndex && <Check className="w-3.5 h-3.5" />}
                          </button>
                      ))}
                  </div>
              </div>
              
              {/* Years */}
              <div className="overflow-y-auto custom-scrollbar pr-1">
                  <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 sticky top-0 bg-white py-1">Year</div>
                  <div className="space-y-1">
                      {years.map(y => (
                          <button
                              key={y}
                              type="button"
                              onClick={() => {
                                  handleYearSelect(y);
                              }}
                              className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors flex items-center justify-between ${
                                  y === currentYear 
                                  ? 'bg-blue-50 text-blue-700 font-bold' 
                                  : 'text-slate-600 hover:bg-slate-50'
                              }`}
                          >
                              {y}
                              {y === currentYear && <Check className="w-3.5 h-3.5" />}
                          </button>
                      ))}
                  </div>
              </div>
          </div>
      );
  };

  return (
    <div className={`relative ${className}`} ref={containerRef}>
      {label && <label className="block text-sm font-medium text-slate-700 mb-1">{label}</label>}
      
      {/* Input Trigger */}
      <div 
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center w-full px-4 py-2.5 border rounded-xl bg-white cursor-pointer transition-all group shadow-sm outline-none ${
            isOpen ? 'border-blue-500 ring-2 ring-blue-100' : 'border-slate-300 hover:border-blue-400'
        }`}
      >
        <CalendarIcon className={`w-5 h-5 mr-3 transition-colors ${isOpen ? 'text-blue-500' : 'text-slate-400 group-hover:text-blue-500'}`} />
        <span className={`text-sm font-medium flex-1 ${value ? 'text-slate-700' : 'text-slate-400'}`}>
           {value ? format(parseDate(value), mode === 'month-year' ? 'MMMM yyyy' : 'MMMM dd, yyyy') : (mode === 'month-year' ? 'Select Month' : 'Select Date')}
        </span>
        <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
      </div>
      
      {/* Dropdown - Rendered via Portal */}
      {isOpen && createPortal(
        <div 
            ref={dropdownRef}
            data-datepicker-dropdown
            className={`fixed z-[9999] bg-white rounded-2xl shadow-xl border border-slate-100 overflow-hidden flex flex-col animate-zoom-in ${positionClass}`}
            style={{ 
                top: coords.top, 
                left: coords.left, 
                width: coords.width,
                maxHeight: coords.maxHeight
            }}
        >
            <div className="p-4 overflow-y-auto custom-scrollbar">
                {renderHeader()}
                <div className="min-h-[280px]">
                    {(view === 'calendar' && mode !== 'month-year') ? renderCalendar() : renderMonthYearSelector()}
                </div>

                {view === 'calendar' && mode !== 'month-year' && (
                    <div className="pt-3 mt-2 border-t border-slate-100 flex justify-center">
                        <button 
                        type="button"
                        onClick={() => handleDayClick(new Date())}
                        className="text-xs font-bold text-blue-600 hover:text-blue-700 hover:bg-blue-50 px-3 py-1.5 rounded-lg transition-colors"
                        >
                            Today
                        </button>
                    </div>
                )}
            </div>
        </div>,
        document.body
      )}
    </div>
  );
};

export default DatePicker;