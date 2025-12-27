import React, { useState, useRef, useEffect } from 'react';
import { format, addMonths, subMonths, startOfMonth, endOfMonth, startOfWeek, endOfWeek, addDays, isSameMonth, isSameDay, parseISO, isValid } from 'date-fns';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon } from 'lucide-react';

interface DatePickerProps {
  label?: string;
  value: string;
  onChange: (value: string) => void;
  className?: string;
  required?: boolean;
}

const DatePicker: React.FC<DatePickerProps> = ({ label, value, onChange, className = '', required }) => {
  const [isOpen, setIsOpen] = useState(false);
  // Parse value to date, default to today if invalid/empty
  const selectedDate = value ? parseISO(value) : undefined;
  const [currentMonth, setCurrentMonth] = useState(isValid(selectedDate) ? selectedDate! : new Date());
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen && selectedDate && isValid(selectedDate)) {
        setCurrentMonth(selectedDate);
    }
  }, [isOpen]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [wrapperRef]);

  const nextMonth = () => setCurrentMonth(addMonths(currentMonth, 1));
  const prevMonth = () => setCurrentMonth(subMonths(currentMonth, 1));
  
  const handleDayClick = (day: Date) => {
    onChange(format(day, 'yyyy-MM-dd'));
    setIsOpen(false);
  };

  const renderHeader = () => {
    return (
      <div className="flex justify-between items-center mb-3 px-1">
        <button type="button" onClick={prevMonth} className="p-1 hover:bg-slate-100 rounded-full text-slate-600 transition-colors">
          <ChevronLeft className="w-4 h-4" />
        </button>
        <span className="text-sm font-bold text-slate-800">
          {format(currentMonth, 'MMMM yyyy')}
        </span>
        <button type="button" onClick={nextMonth} className="p-1 hover:bg-slate-100 rounded-full text-slate-600 transition-colors">
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    );
  };

  const renderDays = () => {
    const dateFormat = "EEE";
    const days = [];
    let startDate = startOfWeek(currentMonth);
    
    for (let i = 0; i < 7; i++) {
      days.push(
        <div className="text-[10px] font-bold text-slate-400 text-center py-1 uppercase tracking-wide" key={i}>
          {format(addDays(startDate, i), dateFormat)}
        </div>
      );
    }
    return <div className="grid grid-cols-7 mb-1">{days}</div>;
  };

  const renderCells = () => {
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(monthStart);
    const startDate = startOfWeek(monthStart);
    const endDate = endOfWeek(monthEnd);

    const dateFormat = "d";
    const rows = [];
    let days = [];
    let day = startDate;
    let formattedDate = "";

    while (day <= endDate) {
      for (let i = 0; i < 7; i++) {
        formattedDate = format(day, dateFormat);
        const cloneDay = day;
        const isSelected = selectedDate && isSameDay(day, selectedDate);
        const isCurrentMonth = isSameMonth(day, monthStart);
        const isTodayDate = isSameDay(day, new Date());
        
        days.push(
          <div
            key={day.toString()}
            onClick={() => handleDayClick(cloneDay)}
            className={`
              relative h-8 flex items-center justify-center cursor-pointer text-sm rounded-lg transition-all duration-200
              ${!isCurrentMonth ? "text-slate-300" : "text-slate-700"}
              ${isSelected ? "bg-blue-600 text-white font-bold shadow-md" : "hover:bg-slate-100"}
              ${isTodayDate && !isSelected ? "border border-blue-200 text-blue-600 font-bold" : ""}
            `}
          >
            {formattedDate}
          </div>
        );
        day = addDays(day, 1);
      }
      rows.push(
        <div className="grid grid-cols-7 gap-1 mb-1" key={day.toString()}>
          {days}
        </div>
      );
      days = [];
    }
    return <div>{rows}</div>;
  };

  return (
    <div className={`relative ${className}`} ref={wrapperRef}>
      {label && <label className="block text-sm font-medium text-slate-700 mb-1">{label}</label>}
      <div 
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center w-full px-4 py-2 border border-slate-300 rounded-xl bg-white cursor-pointer hover:border-blue-400 transition-all focus-within:ring-2 focus-within:ring-blue-500 group shadow-sm"
      >
        <CalendarIcon className="w-4 h-4 text-slate-400 mr-2 group-hover:text-blue-500 transition-colors" />
        <span className={`text-sm font-medium ${value ? 'text-slate-700' : 'text-slate-400'}`}>
           {value ? format(parseISO(value), 'MMM dd, yyyy') : 'Select Date'}
        </span>
      </div>
      
      {isOpen && (
        <div className="absolute top-full left-0 z-50 mt-2 p-4 bg-white rounded-2xl shadow-xl border border-slate-100 w-[280px] animate-in fade-in zoom-in-95 duration-200">
          {renderHeader()}
          {renderDays()}
          {renderCells()}
        </div>
      )}
    </div>
  );
};

export default DatePicker;