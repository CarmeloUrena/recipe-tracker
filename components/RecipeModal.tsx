'use client';

import { useState, useEffect } from 'react';
import { Recipe, RecipeVersion } from '@/types';
import { X, Download, Edit2 } from 'lucide-react';
import { generatePDF } from '@/lib/generatePDF';

interface Props {
  recipe: Recipe;
  onClose: () => void;
  isAdmin: boolean;
}

export default function RecipeModal({ recipe, onClose, isAdmin }: Props) {
  // Default to latest version (array is already sorted in page.tsx)
  const [selectedVersion, setSelectedVersion] = useState<RecipeVersion>(recipe.versions[0]);

  // Handle ESC key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-slate-900/30 backdrop-blur-sm transition-opacity" onClick={onClose} />
      
      {/* Modal Card */}
      <div className="relative w-full max-w-3xl max-h-[90vh] bg-white rounded-3xl shadow-2xl flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="px-8 py-6 border-b border-slate-100 flex items-start justify-between bg-white/50 backdrop-blur-md sticky top-0 z-10">
          <div>
            <h2 className="text-3xl font-semibold tracking-tight text-slate-900 mb-3">{recipe.name}</h2>
            {/* Version Toggles */}
            <div className="flex gap-2">
              {recipe.versions.map((v) => (
                <button
                  key={v.id}
                  onClick={() => setSelectedVersion(v)}
                  className={`px-3 py-1 text-xs font-medium rounded-full transition-all ${
                    selectedVersion.id === v.id 
                      ? 'bg-slate-900 text-white' 
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  v{v.version_number}
                </button>
              ))}
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <button onClick={() => generatePDF(recipe, selectedVersion)} className="p-2 text-slate-400 hover:text-slate-900 transition-colors rounded-full hover:bg-slate-100" title="Export to PDF">
              <Download className="w-5 h-5" />
            </button>
            {isAdmin && (
              <button className="p-2 text-slate-400 hover:text-blue-600 transition-colors rounded-full hover:bg-slate-100" title="Edit Version">
                <Edit2 className="w-5 h-5" />
              </button>
            )}
            <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-900 transition-colors rounded-full hover:bg-slate-100 ml-2">
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Content (NYT Cooking Style: 1/3 Ingredients, 2/3 Directions) */}
        <div className="overflow-y-auto p-8 flex flex-col md:flex-row gap-12">
          {/* Ingredients Column */}
          <div className="md:w-1/3 shrink-0">
            <h3 className="text-sm uppercase tracking-widest text-slate-400 font-semibold mb-6">Ingredients</h3>
            <ul className="space-y-3">
              {selectedVersion.ingredients.map((ing, i) => (
                <li key={i} className="text-sm leading-relaxed border-b border-slate-100 pb-2 last:border-0">{ing}</li>
              ))}
            </ul>
          </div>

          {/* Directions Column */}
          <div className="md:w-2/3">
            <h3 className="text-sm uppercase tracking-widest text-slate-400 font-semibold mb-6">Preparation</h3>
            <div className="space-y-6">
              {selectedVersion.directions.map((step, i) => (
                <div key={i} className="flex gap-4">
                  <span className="font-semibold text-slate-900 shrink-0">Step {i + 1}</span>
                  <p className="text-slate-700 leading-relaxed">{step}</p>
                </div>
              ))}
            </div>

            {selectedVersion.notes && (
              <div className="mt-12 bg-slate-50 p-6 rounded-2xl text-sm text-slate-600">
                <span className="block font-semibold text-slate-900 mb-2">Notes</span>
                {selectedVersion.notes}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
