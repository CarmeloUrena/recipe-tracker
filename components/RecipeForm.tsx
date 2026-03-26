'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Recipe } from '@/types';
import { X, Plus, Trash2, Save } from 'lucide-react';

interface Props {
  recipe?: Recipe; // If provided, we are editing/adding a version to an existing recipe
  onClose: () => void;
  onRefresh: () => void;
}

export default function RecipeForm({ recipe, onClose, onRefresh }: Props) {
  // If editing, start with the existing name. If new, start blank.
  const [name, setName] = useState(recipe?.name || '');
  const [ingredients, setIngredients] = useState<string[]>(['']);
  const [directions, setDirections] = useState<string[]>(['']);
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);

  const addItem = (setter: any) => setter((prev: string[]) => [...prev, '']);
  
  const updateItem = (setter: any, index: number, value: string) => {
    setter((prev: string[]) => {
      const next = [...prev];
      next[index] = value;
      return next;
    });
  };

  const removeItem = (setter: any, index: number) => {
    setter((prev: string[]) => prev.filter((_, i) => i !== index));
  };

  const handleSave = async () => {
    if (!name.trim()) return alert("Please enter a recipe name");
    setLoading(true);

    try {
      let recipeId = recipe?.id;

      if (!recipeId) {
        // CASE A: Create a brand new recipe
        const { data: newRecipe, error: rError } = await supabase
          .from('recipes')
          .insert([{ name }])
          .select()
          .single();
        
        if (rError) throw rError;
        recipeId = newRecipe.id;
      } else {
        // CASE B: Update the name of the existing recipe
        const { error: uError } = await supabase
          .from('recipes')
          .update({ name })
          .eq('id', recipeId);
        
        if (uError) throw uError;
      }

      // Determine the next version number
      // If we are adding to an existing recipe, look at the highest version and add 1
      const versionNum = recipe && recipe.versions.length > 0 
        ? Math.max(...recipe.versions.map(v => v.version_number)) + 1 
        : 1;

      // Insert the version details
      const { error: vError } = await supabase.from('recipe_versions').insert([
        {
          recipe_id: recipeId,
          version_number: versionNum,
          ingredients: ingredients.filter(i => i.trim() !== ''),
          directions: directions.filter(d => d.trim() !== ''),
          notes
        }
      ]);

      if (vError) throw vError;

      onRefresh();
      onClose();
    } catch (err) {
      console.error('Error saving:', err);
      alert('Error saving recipe. Check console for details.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-md" onClick={onClose} />
      
      <div className="relative w-full max-w-4xl max-h-[90vh] bg-white rounded-3xl shadow-2xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="px-8 py-6 border-b border-slate-100 flex items-center justify-between">
          <h2 className="text-2xl font-semibold tracking-tight">
            {recipe ? `Editing: ${recipe.name}` : 'New Recipe'}
          </h2>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
            <X className="w-6 h-6 text-slate-400" />
          </button>
        </div>

        {/* Form Body */}
        <div className="overflow-y-auto p-8 space-y-10">
          {/* Recipe Name Input */}
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-widest text-slate-400">
              {recipe ? 'Rename Recipe' : 'Recipe Title'}
            </label>
            <input 
              type="text"
              placeholder="e.g. Sourdough Bread"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full text-3xl font-medium border-none focus:ring-0 p-0 placeholder:text-slate-200 outline-none"
            />
          </div>

          <div className="grid md:grid-cols-2 gap-12">
            {/* Ingredients */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold uppercase tracking-widest text-slate-400">Ingredients</label>
                <button onClick={() => addItem(setIngredients)} className="text-blue-600 hover:text-blue-700">
                  <Plus className="w-4 h-4" />
                </button>
              </div>
              <div className="space-y-3">
                {ingredients.map((ing, i) => (
                  <div key={i} className="flex gap-2 group">
                    <input 
                      value={ing}
                      onChange={(e) => updateItem(setIngredients, i, e.target.value)}
                      placeholder="Add ingredient..."
                      className="flex-1 text-sm bg-slate-50 border-none rounded-lg p-2 focus:ring-2 focus:ring-blue-100 outline-none"
                    />
                    <button onClick={() => removeItem(setIngredients, i)} className="p-2 text-slate-300 hover:text-red-500">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Directions */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold uppercase tracking-widest text-slate-400">Directions</label>
                <button onClick={() => addItem(setDirections)} className="text-blue-600 hover:text-blue-700">
                  <Plus className="w-4 h-4" />
                </button>
              </div>
              <div className="space-y-3">
                {directions.map((step, i) => (
                  <div key={i} className="flex gap-2 group">
                    <span className="text-xs font-bold text-slate-300 pt-3">{i + 1}</span>
                    <textarea 
                      value={step}
                      onChange={(e) => updateItem(setDirections, i, e.target.value)}
                      placeholder="Add step..."
                      rows={1}
                      className="flex-1 text-sm bg-slate-50 border-none rounded-lg p-2 focus:ring-2 focus:ring-blue-100 outline-none resize-none"
                    />
                    <button onClick={() => removeItem(setDirections, i)} className="p-2 text-slate-300 hover:text-red-500">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-widest text-slate-400">Notes for this version</label>
            <textarea 
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="What changed in this version? Better flavor? Higher temp?"
              rows={3}
              className="w-full text-sm bg-slate-50 border-none rounded-2xl p-4 focus:ring-2 focus:ring-blue-100 outline-none"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="px-8 py-6 bg-slate-50 border-t border-slate-100 flex justify-end gap-4">
          <button onClick={onClose} className="px-6 py-2.5 text-sm font-medium text-slate-500">Cancel</button>
          <button 
            onClick={handleSave}
            disabled={loading}
            className="flex items-center gap-2 px-8 py-2.5 bg-slate-900 text-white rounded-xl text-sm font-medium hover:bg-slate-800 disabled:opacity-50 shadow-lg"
          >
            <Save className="w-4 h-4" />
            {loading ? 'Saving...' : 'Save as New Version'}
          </button>
        </div>
      </div>
    </div>
  );
}
