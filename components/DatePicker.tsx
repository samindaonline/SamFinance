import React, { useState, useRef, useEffect } from 'react';
import { format, addMonths, subMonths, getYear, getMonth, setYear, setMonth, startOfMonth, endOfMonth, startOfWeek, endOfWeek, addDays, isSameDay, isSameMonth, isValid } from 'date-fns';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, ChevronDown, Check } from 'lucide-react';

interface DatePickerProps {
  label?: string;
  value: string;
  onChange: (value: string) => void;
  className?: string;
  required?: boolean;
}

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

const DatePicker: React.FC<DatePickerProps> = ({ label, value, onChange, className = '', required }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [view, setView] = useState<'calendar' | 'month-year'>('calendar');
  const containerRef = useRef<HTMLDivElement>(null);

  // Helper to parse local YYYY-MM-DD
  const parseDate = (str: string) => {
     if (!str) return new Date();
     if (str.length === 10) return new Date(str + 'T00:00:00');
     return new Date(str);
  };

  const selectedDate = value ? parseDate(value) : undefined;
  const [currentDate, setCurrentDate] = useState(selectedDate && isValid(selectedDate) ? selectedDate : new Date());

  // Sync internal state if external value changes while closed
  useEffect(() => {
    if (!isOpen && value) {
        const d = parseDate(value);
        if (isValid(d)) setCurrentDate(d);
    }
  }, [isOpen, value]);

  // Click outside to close
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setView('calendar');
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleDayClick = (day: Date) => {
    onChange(format(day, 'yyyy-MM-dd'));
    setIsOpen(false);
    setView('calendar');
  };

  const handleMonthSelect = (monthIndex: number) => {
      setCurrentDate(setMonth(currentDate, monthIndex));
  };

  const handleYearSelect = (year: number) => {
      setCurrentDate(setYear(currentDate, year));
  };

  const toggleView = () => {
      setView(view === 'calendar' ? 'month-year' : 'calendar');
  };

  const renderHeader = () => {
    return (
      <div className="flex justify-between items-center mb-4 px-1">
        <button 
            type="button" 
            onClick={() => setCurrentDate(subMonths(currentDate, 1))}
            className="p-1 hover:bg-slate-100 rounded-lg text-slate-500 transition-colors active:scale-95"
            disabled={view !== 'calendar'}
            style={{ opacity: view === 'calendar' ? 1 : 0, pointerEvents: view === 'calendar' ? 'auto' : 'none' }}
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        
        <button 
            type="button"
            onClick={toggleView}
            className="text-sm font-bold text-slate-800 hover:bg-slate-100 px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1 active:scale-95"
        >
          {format(currentDate, 'MMMM yyyy')}
          <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform duration-200 ${view === 'month-year' ? 'rotate-180' : ''}`} />
        </button>

        <button 
            type="button" 
            onClick={() => setCurrentDate(addMonths(currentDate, 1))}
            className="p-1 hover:bg-slate-100 rounded-lg text-slate-500 transition-colors active:scale-95"
            disabled={view !== 'calendar'}
            style={{ opacity: view === 'calendar' ? 1 : 0, pointerEvents: view === 'calendar' ? 'auto' : 'none' }}
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
                  // Explicit white text for selected state
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
           {value ? format(parseDate(value), 'MMMM dd, yyyy') : 'Select Date'}
        </span>
        <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
      </div>
      
      {/* Dropdown */}
      {isOpen && (
        <div className="absolute top-full left-0 z-[60] mt-2 p-4 bg-white rounded-2xl shadow-xl border border-slate-100 w-[320px] animate-zoom-in origin-top-left">
          {renderHeader()}
          
          <div className="min-h-[280px]">
             {view === 'calendar' ? renderCalendar() : renderMonthYearSelector()}
          </div>

          {view === 'calendar' && (
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
      )}
    </div>
  );
};

export default DatePicker;