import React, { useState } from 'react';
import { useFinance } from '../context/FinanceContext';
import { useLanguage } from '../context/LanguageContext';
import { Plus, X, Tag, Search } from 'lucide-react';

const Categories: React.FC = () => {
  const { categories, addCategory, removeCategory } = useFinance();
  const { t } = useLanguage();
  const [newCategory, setNewCategory] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (newCategory.trim()) {
        addCategory(newCategory.trim());
        setNewCategory('');
    }
  };

  const filteredCategories = categories.filter(c => 
    c.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
           <h2 className="text-2xl font-bold text-slate-800">{t('cat_title')}</h2>
           <p className="text-slate-500">{t('cat_subtitle')}</p>
        </div>
      </div>

      <div className="space-y-6">
        {/* Add Category Section */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
            <h3 className="text-lg font-bold text-slate-800 mb-4">{t('add_new_tag')}</h3>
            <form onSubmit={handleAdd} className="flex gap-2 max-w-xl">
                <div className="relative flex-1">
                    <Tag className="absolute left-3 top-2.5 w-5 h-5 text-slate-400" />
                    <input 
                        type="text" 
                        value={newCategory}
                        onChange={(e) => setNewCategory(e.target.value)}
                        placeholder="e.g. Groceries, Fuel, Dividends"
                        className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                        required
                    />
                </div>
                <button 
                    type="submit"
                    className="bg-blue-600 text-white px-6 py-2 rounded-xl hover:bg-blue-700 transition-colors font-medium flex items-center"
                >
                    <Plus className="w-5 h-5 mr-2" /> {t('add')}
                </button>
            </form>
        </div>

        {/* Categories Tag Cloud */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm min-h-[400px]">
             <div className="mb-6 flex items-center justify-between">
                <h3 className="text-lg font-bold text-slate-800">{t('existing_tags')}</h3>
                <div className="relative w-64">
                    <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                    <input 
                        type="text" 
                        placeholder={t('filter_tags')}
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                    />
                </div>
             </div>
             
             <div className="flex flex-wrap gap-2">
                {filteredCategories.length > 0 ? (
                    filteredCategories.map(category => (
                        <div 
                            key={category} 
                            className="inline-flex items-center px-3 py-1.5 rounded-full bg-slate-100 text-slate-700 text-sm font-medium hover:bg-slate-200 transition-colors group"
                        >
                            <span>{category}</span>
                            <button 
                                onClick={() => {
                                    if(confirm(`${t('remove_tag_confirm')} "${category}"?`)) removeCategory(category);
                                }}
                                className="ml-2 p-0.5 rounded-full text-slate-400 hover:bg-red-100 hover:text-red-500 transition-colors"
                            >
                                <X className="w-3.5 h-3.5" />
                            </button>
                        </div>
                    ))
                ) : (
                    <div className="w-full py-12 flex flex-col items-center justify-center text-slate-400 border-2 border-dashed border-slate-100 rounded-xl">
                        <Tag className="w-8 h-8 mb-2 opacity-50" />
                        <p>{t('no_tags_found')} "{searchTerm}"</p>
                    </div>
                )}
             </div>
        </div>
      </div>
    </div>
  );
};

export default Categories;