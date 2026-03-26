'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Recipe, RecipeVersion } from '@/types';
import { X, Trash2, Edit3, Plus, AlertCircle } from 'lucide-react';
import RecipeForm from './RecipeForm';

interface Props {
  recipe: Recipe;
  onClose: () => void;
  isAdmin?: boolean;
  onRefresh: () => void;
}

export default function RecipeModal({ recipe, onClose, isAdmin, onRefresh }: Props) {
  const sortedVersions = [...recipe.versions].sort((a, b) => a.version_number - b.version_number);
  const [activeVersionIdx, setActiveVersionIdx] = useState(0);
  const [isEditing, setIsEditing] = useState(false);
  const [editMode, setEditMode] = useState<'overwrite' | 'new'>('overwrite');
  
  const currentVersion = sortedVersions[activeVersionIdx];

  const deleteEntireRecipe = async () => {
    if (!confirm("Permanently delete this ENTIRE recipe and all versions?")) return;
    const { error } = await supabase.from('recipes').delete().eq('id', recipe.id);
    if (!error) { onRefresh(); onClose(); }
  };

  const deleteCurrentVersion = async () => {
    if (recipe.versions.length <= 1) {
      alert("You cannot delete the only version. Delete the whole recipe instead.");
      return;
    }
    if (!confirm(`Delete Version ${currentVersion.version_number}?`)) return;
    
    const { error } = await supabase.from('recipe_versions').delete().eq('id', currentVersion.id);
    if (!error) {
      onRefresh();
      setActiveVersionIdx(0); // Reset to v1
    }
  };

  if (!currentVersion) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-xl" onClick={onClose} />
      
      <div className="relative w-full max-w-5xl max-h-[90vh] bg-white rounded-[2.5rem] shadow-2xl flex flex-col overflow-hidden">
        
        {/* Header */}
        <div className="px-10 py-8 border-b border-slate-100 flex items-start justify-between bg-white">
          <div className="space-y-1">
            <div className="flex items-center gap-3">
              <h2 className="text-3xl font-semibold text-slate-900">{recipe.name}</h2>
              <span className="px-2 py-1 bg-slate-100 rounded text-[10px] font-bold text-slate-500 uppercase">v{currentVersion.version_number}</span>
            </div>
            <p className="text-slate-400 text-sm font-medium">Updated {new Date(currentVersion.created_at).toLocaleDateString()}</p>
          </div>

          <div className="flex items-center gap-3">
            {isAdmin && (
              <>
                <button 
                  onClick={() => { setEditMode('overwrite'); setIsEditing(true); }}
                  className="p-3 bg-blue-50 text-blue-600 rounded-2xl hover:bg-blue-100"
                  title="Edit Current Version"
                >
                  <Edit3 className="w-5 h-5" />
                </button>
                <button 
                  onClick={deleteCurrentVersion}
                  className="p-3 bg-orange-50 text-orange-500 rounded-2xl hover:bg-orange-100"
                  title="Delete This Version"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
                <div className="w-px h-8 bg-slate-100 mx-1" />
                <button 
                  onClick={deleteEntireRecipe}
                  className="p-3 bg-red-50 text-red-500 rounded-2xl hover:bg-red-100"
                  title="Delete Whole Recipe"
                >
                  <AlertCircle className="w-5 h-5" />
                </button>
              </>
            )}
            <button onClick={onClose} className="p-3 hover:bg-slate-100 rounded-2xl ml-2">
              <X className="w-6 h-6 text-slate-400" />
            </button>
          </div>
        </div>

        {/* Tabs + Add New */}
        <div className="px-10 py-3 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
          <div className="flex gap-2 overflow-x-auto no-scrollbar">
            {sortedVersions.map((v, idx) => (
              <button
                key={v.id}
                onClick={() => setActiveVersionIdx(idx)}
                className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all ${
                  activeVersionIdx === idx ? 'bg-slate-900 text-white shadow-md' : 'text-slate-400 hover:bg-slate-200'
                }`}
              >
                Version {v.version_number}
              </button>
            ))}
          </div>
          {isAdmin && (
            <button 
              onClick={() => { setEditMode('new'); setIsEditing(true); }}
              className="flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 shadow-sm"
            >
              <Plus className="w-3.5 h-3.5" /> New Version
            </button>
          )}
        </div>

        {/* Body Content (Same as before) */}
        <div className="overflow-y-auto p-10 grid md:grid-cols-5 gap-16 flex-1">
          <div className="md:col-span-2 space-y-6">
            <h3 className="text-xs font-bold uppercase tracking-widest text-blue-600">Ingredients</h3>
            <ul className="space-y-4">
              {currentVersion.ingredients.map((ing, i) => (
                <li key={i} className="flex items-start gap-3 text-slate-700"><div className="w-1.5 h-1.5 rounded-full bg-slate-200 mt-2 flex-shrink-0" />{ing}</li>
              ))}
            </ul>
          </div>
          <div className="md:col-span-3 space-y-8">
            <h3 className="text-xs font-bold uppercase tracking-widest text-blue-600">Method</h3>
            <div className="space-y-8">
              {currentVersion.directions.map((step, i) => (
                <div key={i} className="flex gap-6"><span className="text-4xl font-light text-slate-300">{(i + 1).toString().padStart(2, '0')}</span><p className="text-slate-700 pt-2">{step}</p></div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {isEditing && (
        <RecipeForm 
          recipe={recipe} 
          // If mode is 'new', we don't pass an activeVersion so the form creates a fresh one
          activeVersion={editMode === 'overwrite' ? currentVersion : undefined} 
          onClose={() => setIsEditing(false)} 
          onRefresh={() => { onRefresh(); setIsEditing(false); }} 
        />
      )}
    </div>
  );
}
