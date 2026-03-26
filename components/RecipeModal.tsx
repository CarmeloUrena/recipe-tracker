'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Recipe, RecipeVersion } from '@/types';
import { X, Clock, ChevronRight, ChevronLeft, Trash2, Plus, Download } from 'lucide-react';
import RecipeForm from './RecipeForm';

interface Props {
  recipe: Recipe;
  onClose: () => void;
  isAdmin?: boolean;
  onRefresh: () => void;
}

export default function RecipeModal({ recipe, onClose, isAdmin, onRefresh }: Props) {
  // Sort versions ascending (v1, v2, v3...) for the tabs
  const sortedVersions = [...recipe.versions].sort((a, b) => a.version_number - b.version_number);
  
  const [activeVersionIdx, setActiveVersionIdx] = useState(sortedVersions.length - 1);
  const [isEditing, setIsEditing] = useState(false);
  const currentVersion = sortedVersions[activeVersionIdx];

  const handleDelete = async () => {
    if (!confirm("Are you sure? This deletes the entire recipe and all versions.")) return;
    
    const { error } = await supabase.from('recipes').delete().eq('id', recipe.id);
    if (error) alert("Error deleting");
    else {
      onRefresh();
      onClose();
    }
  };

  if (!currentVersion) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-xl" onClick={onClose} />
      
      <div className="relative w-full max-w-5xl max-h-[90vh] bg-white rounded-[2.5rem] shadow-2xl flex flex-col overflow-hidden animate-in fade-in zoom-in duration-300">
        
        {/* Header Section */}
        <div className="px-10 py-8 border-b border-slate-100 flex items-start justify-between bg-white sticky top-0 z-10">
          <div className="space-y-1">
            <div className="flex items-center gap-3">
              <h2 className="text-3xl font-semibold tracking-tight text-slate-900">{recipe.name}</h2>
              <span className="px-2 py-1 bg-slate-100 rounded text-[10px] font-bold uppercase tracking-widest text-slate-500">
                v{currentVersion.version_number}
              </span>
            </div>
            <p className="text-slate-400 text-sm font-medium">Updated {new Date(currentVersion.created_at).toLocaleDateString()}</p>
          </div>

          <div className="flex items-center gap-3">
            {isAdmin && (
              <>
                <button 
                  onClick={() => setIsEditing(true)}
                  className="p-3 bg-blue-50 text-blue-600 rounded-2xl hover:bg-blue-100 transition-colors"
                  title="Add New Version"
                >
                  <Plus className="w-5 h-5" />
                </button>
                <button 
                  onClick={handleDelete}
                  className="p-3 bg-red-50 text-red-500 rounded-2xl hover:bg-red-100 transition-colors"
                  title="Delete Recipe"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              </>
            )}
            <button onClick={onClose} className="p-3 hover:bg-slate-100 rounded-2xl transition-colors">
              <X className="w-6 h-6 text-slate-400" />
            </button>
          </div>
        </div>

        {/* Version Navigation Tabs */}
        <div className="px-10 py-3 bg-slate-50 border-b border-slate-100 flex gap-2 overflow-x-auto no-scrollbar">
          {sortedVersions.map((v, idx) => (
            <button
              key={v.id}
              onClick={() => setActiveVersionIdx(idx)}
              className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all ${
                activeVersionIdx === idx 
                ? 'bg-slate-900 text-white shadow-md' 
                : 'text-slate-400 hover:bg-slate-200'
              }`}
            >
              Version {v.version_number}
            </button>
          ))}
        </div>

        {/* Content Body */}
        <div className="overflow-y-auto p-10 grid md:grid-cols-5 gap-16">
          
          {/* Ingredients Column */}
          <div className="md:col-span-2 space-y-6">
            <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-blue-600">Ingredients</h3>
            <ul className="space-y-4">
              {currentVersion.ingredients.map((ing, i) => (
                <li key={i} className="flex items-start gap-3 text-slate-700 leading-relaxed">
                  <div className="w-1.5 h-1.5 rounded-full bg-slate-200 mt-2 flex-shrink-0" />
                  {ing}
                </li>
              ))}
            </ul>
          </div>

          {/* Directions Column */}
          <div className="md:col-span-3 space-y-8">
             <div className="space-y-6">
                <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-blue-600">Method</h3>
                <div className="space-y-8">
                  {currentVersion.directions.map((step, i) => (
                    <div key={i} className="flex gap-6 group">
                      <span className="text-4xl font-light text-slate-100 group-hover:text-blue-50 group-hover:scale-110 transition-all tabular-nums">
                        {(i + 1).toString().padStart(2, '0')}
                      </span>
                      <p className="text-slate-700 leading-relaxed pt-2">{step}</p>
                    </div>
                  ))}
                </div>
             </div>

             {currentVersion.notes && (
               <div className="pt-8 mt-8 border-t border-slate-100">
                 <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-blue-600 mb-4">Chef's Notes</h3>
                 <div className="p-6 bg-slate-50 rounded-3xl text-sm text-slate-600 italic leading-relaxed">
                   "{currentVersion.notes}"
                 </div>
               </div>
             )}
          </div>
        </div>
      </div>

      {/* Edit/New Version Modal Overlay */}
      {isEditing && (
        <RecipeForm 
          recipe={recipe} 
          onClose={() => setIsEditing(false)} 
          onRefresh={() => {
            onRefresh();
            setIsEditing(false);
          }} 
        />
      )}
    </div>
  );
}
