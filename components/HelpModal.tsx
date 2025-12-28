import React from 'react';
import { createPortal } from 'react-dom';
import { X, HelpCircle, ChevronRight } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

interface HelpModalProps {
  isOpen: boolean;
  onClose: () => void;
  titleKey: string;
  contentKey: string;
}

const HelpModal: React.FC<HelpModalProps> = ({ isOpen, onClose, titleKey, contentKey }) => {
  const { t } = useLanguage();

  if (!isOpen) return null;

  // Split content by pipe '|' character
  const steps = t(contentKey as any).split('|');
  const title = t(titleKey as any);

  return createPortal(
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
      <div 
        className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />
      <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl relative z-10 overflow-hidden animate-zoom-in">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 p-6 flex justify-between items-start text-white">
            <div className="flex items-center gap-3">
                <div className="p-2 bg-white/20 rounded-lg backdrop-blur-md">
                    <HelpCircle className="w-6 h-6 text-white" />
                </div>
                <div>
                    <h3 className="text-lg font-bold leading-tight">{title}</h3>
                    <p className="text-blue-100 text-xs mt-1 font-medium opacity-90">{t('help_guide')}</p>
                </div>
            </div>
            <button 
                onClick={onClose}
                className="p-1.5 bg-white/10 hover:bg-white/20 rounded-full transition-colors active:scale-90"
            >
                <X className="w-5 h-5 text-white" />
            </button>
        </div>

        {/* Content */}
        <div className="p-6 max-h-[60vh] overflow-y-auto custom-scrollbar">
            <div className="space-y-4">
                {steps.map((step, idx) => (
                    <div key={idx} className="flex gap-4 group">
                        <div className="flex-shrink-0 flex flex-col items-center">
                            <div className="w-8 h-8 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-sm border border-blue-100 group-hover:scale-110 transition-transform duration-300 shadow-sm">
                                {idx + 1}
                            </div>
                            {idx !== steps.length - 1 && (
                                <div className="w-0.5 h-full bg-slate-100 my-1 rounded-full group-hover:bg-blue-100 transition-colors" />
                            )}
                        </div>
                        <div className="pb-4">
                            <p className="text-slate-700 text-sm leading-relaxed pt-1.5">{step.trim()}</p>
                        </div>
                    </div>
                ))}
            </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-end">
            <button 
                onClick={onClose}
                className="px-6 py-2 bg-slate-800 text-white text-sm font-semibold rounded-xl hover:bg-slate-900 transition-colors shadow-lg shadow-slate-200 active:scale-95 duration-200"
            >
                Got it
            </button>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default HelpModal;