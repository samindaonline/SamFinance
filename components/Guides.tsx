import React from 'react';
import { useLanguage } from '../context/LanguageContext';
import { BookOpen, Wallet, CreditCard, ScrollText, HandCoins, Calculator, FileJson } from 'lucide-react';

const Guides: React.FC = () => {
  const { t } = useLanguage();

  const guides = [
    { id: 'acc', icon: Wallet, titleKey: 'help_acc_title', stepsKey: 'help_acc_steps', color: 'bg-blue-50 text-blue-600' },
    { id: 'tx', icon: CreditCard, titleKey: 'help_tx_title', stepsKey: 'help_tx_steps', color: 'bg-purple-50 text-purple-600' },
    { id: 'rec', icon: HandCoins, titleKey: 'help_rec_title', stepsKey: 'help_rec_steps', color: 'bg-emerald-50 text-emerald-600' },
    { id: 'liab', icon: ScrollText, titleKey: 'help_liab_title', stepsKey: 'help_liab_steps', color: 'bg-amber-50 text-amber-600' },
    { id: 'bud', icon: Calculator, titleKey: 'help_bud_title', stepsKey: 'help_bud_steps', color: 'bg-indigo-50 text-indigo-600' },
    { id: 'backup', icon: FileJson, titleKey: 'help_backup_title', stepsKey: 'help_backup_steps', color: 'bg-slate-100 text-slate-600' },
  ];

  return (
    <div className="space-y-6 pb-20 md:pb-0 animate-slide-up">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <BookOpen className="w-6 h-6 text-blue-600" />
            {t('guides_title')}
        </h2>
        <p className="text-slate-500 mt-1">{t('guides_subtitle')}</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {guides.map((guide) => {
            const title = t(guide.titleKey as any);
            const steps = t(guide.stepsKey as any).split('|');

            return (
                <div key={guide.id} className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden hover:shadow-md transition-shadow">
                    <div className="p-5 border-b border-slate-100 flex items-center gap-3 bg-slate-50/50">
                        <div className={`p-2.5 rounded-xl ${guide.color}`}>
                            <guide.icon className="w-5 h-5" />
                        </div>
                        <h3 className="font-bold text-slate-800 text-lg">{title}</h3>
                    </div>
                    <div className="p-6">
                        <div className="space-y-4">
                            {steps.map((step, idx) => (
                                <div key={idx} className="flex gap-4">
                                    <div className="flex-shrink-0 flex flex-col items-center">
                                        <div className="w-6 h-6 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center font-bold text-xs border border-slate-200">
                                            {idx + 1}
                                        </div>
                                        {idx !== steps.length - 1 && (
                                            <div className="w-0.5 h-full bg-slate-100 my-1 rounded-full" />
                                        )}
                                    </div>
                                    <p className="text-slate-600 text-sm leading-relaxed">{step.trim()}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            );
        })}
      </div>
    </div>
  );
};

export default Guides;