'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Recipe, RecipeVersion } from '@/types';
import { X, Trash2, Edit3, Plus, AlertCircle, Quote } from 'lucide-react';
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
    if (!error) {
      onRefresh();
      onClose();
    }
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
      setActiveVersionIdx(0);
    }
  };

  if (!currentVersion) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm" onClick={onClose} />

      <div
        className="relative w-full max-w-5xl max-h-[90vh] bg-white rounded-2xl border-2 border-slate-900 flex flex-col overflow-hidden"
        style={{ boxShadow: '8px 8px 0 #0f172a' }}
      >
        {/* Header */}
        <div className="px-5 md:px-10 py-5 md:py-7 border-b-2 border-slate-900 flex items-start justify-between bg-white sticky top-0 z-10">
          <div className="space-y-1">
            <div className="flex items-center gap-3 flex-wrap">
              <h2 className="text-xl md:text-3xl font-semibold tracking-tight text-slate-900">{recipe.name}</h2>
              <span className="px-2.5 py-1 bg-slate-900 text-white rounded-md text-[10px] font-bold uppercase tracking-widest">
                v{currentVersion.version_number}
              </span>
            </div>
            <p className="text-slate-400 text-sm font-medium">
              Updated {new Date(currentVersion.created_at).toLocaleDateString()}
            </p>
          </div>

          <div className="flex items-center gap-2">
            {isAdmin && (
              <>
                <button
                  onClick={() => { setEditMode('overwrite'); setIsEditing(true); }}
                  className="p-2.5 bg-white border-2 border-slate-900 rounded-xl hover:bg-amber-50 transition-colors"
                  style={{ boxShadow: '2px 2px 0 #0f172a' }}
                  title="Edit This Version"
                >
                  <Edit3 className="w-4 h-4 text-slate-700" />
                </button>
                <button
                  onClick={deleteCurrentVersion}
                  className="p-2.5 bg-white border-2 border-slate-900 rounded-xl hover:bg-orange-50 transition-colors"
                  style={{ boxShadow: '2px 2px 0 #0f172a' }}
                  title="Delete This Version"
                >
                  <Trash2 className="w-4 h-4 text-slate-700" />
                </button>
                <div className="w-px h-7 bg-slate-200 mx-1" />
                <button
                  onClick={deleteEntireRecipe}
                  className="p-2.5 bg-white border-2 border-red-400 rounded-xl hover:bg-red-50 transition-colors"
                  style={{ boxShadow: '2px 2px 0 #f87171' }}
                  title="Delete Entire Recipe"
                >
                  <AlertCircle className="w-4 h-4 text-red-500" />
                </button>
              </>
            )}
            <button
              onClick={onClose}
              className="p-2.5 border-2 border-slate-900 rounded-xl hover:bg-slate-50 transition-colors ml-1"
              style={{ boxShadow: '2px 2px 0 #0f172a' }}
            >
              <X className="w-5 h-5 text-slate-600" />
            </button>
          </div>
        </div>

        {/* Version tabs */}
        <div className="px-5 md:px-10 py-3 bg-[#f5f0e8] border-b-2 border-slate-900 flex items-center justify-between sticky top-[88px] md:top-[104px] z-10">
          <div className="flex gap-2 overflow-x-auto">
            {sortedVersions.map((v, idx) => (
              <button
                key={v.id}
                onClick={() => setActiveVersionIdx(idx)}
                className={`px-4 py-1.5 rounded-md text-xs font-bold border-2 transition-all ${
                  activeVersionIdx === idx
                    ? 'bg-slate-900 text-white border-slate-900'
                    : 'text-slate-500 border-slate-300 bg-white hover:border-slate-900'
                }`}
                style={activeVersionIdx === idx ? { boxShadow: '2px 2px 0 rgba(0,0,0,0.2)' } : {}}
              >
                Version {v.version_number}
              </button>
            ))}
          </div>

          {isAdmin && (
            <button
              onClick={() => { setEditMode('new'); setIsEditing(true); }}
              className="flex items-center gap-2 px-4 py-1.5 rounded-md text-xs font-bold text-white bg-slate-900 border-2 border-slate-900 hover:bg-slate-700 transition-colors"
              style={{ boxShadow: '2px 2px 0 rgba(0,0,0,0.25)' }}
            >
              <Plus className="w-3.5 h-3.5" /> New Version
            </button>
          )}
        </div>

        {/* Content */}
        <div className="overflow-y-auto p-5 md:p-10 grid grid-cols-1 md:grid-cols-5 gap-8 md:gap-16 flex-1 bg-white">

          {/* Ingredients */}
          <div className="md:col-span-2 space-y-4">
            <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-amber-600">Ingredients</h3>
            <ul className="space-y-2">
              {currentVersion.ingredients.map((ing, i) => (
                <li key={i} className="flex items-start gap-3 text-slate-700 leading-relaxed text-sm">
                  <div className="w-1.5 h-1.5 rounded-full bg-slate-900 mt-2 flex-shrink-0" />
                  {ing}
                </li>
              ))}
            </ul>
          </div>

          {/* Directions & Notes */}
          <div className="md:col-span-3 space-y-8">
            <div className="space-y-4">
              <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-amber-600">Method</h3>
              <div className="space-y-4">
                {currentVersion.directions.map((step, i) => (
                  <div key={i} className="flex gap-4">
                    <span className="text-2xl font-light text-slate-200 tabular-nums flex-shrink-0 leading-snug mt-0.5">
                      {(i + 1).toString().padStart(2, '0')}
                    </span>
                    <p className="text-slate-700 leading-relaxed text-sm">{step}</p>
                  </div>
                ))}
              </div>
            </div>

            {currentVersion.notes && (
              <div className="pt-6 border-t-2 border-slate-100">
                <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-amber-600 mb-3">Chef's Notes</h3>
                <div className="p-5 bg-amber-50 border-l-4 border-slate-900 rounded-r-xl text-sm text-slate-700 italic leading-relaxed relative">
                  <Quote className="absolute top-3 left-3 w-5 h-5 text-amber-200" />
                  <p className="relative z-10 pl-5">{currentVersion.notes}</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {isEditing && (
        <RecipeForm
          recipe={recipe}
          activeVersion={editMode === 'overwrite' ? currentVersion : undefined}
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
