'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Recipe, RecipeVersion } from '@/types';
import { X, Plus, Trash2 } from 'lucide-react';

interface Props {
  recipe?: Recipe;
  activeVersion?: RecipeVersion;
  onClose: () => void;
  onRefresh: () => void;
}

export default function RecipeForm({ recipe, activeVersion, onClose, onRefresh }: Props) {
  const [name, setName] = useState(recipe?.name || '');
  const [origin, setOrigin] = useState(recipe?.origin || '');
  const [versionOrigin, setVersionOrigin] = useState(activeVersion?.version_origin || '');
  const [ingredients, setIngredients] = useState<string[]>(['']);
  const [directions, setDirections] = useState<string[]>(['']);
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (activeVersion) {
      setIngredients(activeVersion.ingredients);
      setDirections(activeVersion.directions);
      setNotes(activeVersion.notes || '');
      setVersionOrigin(activeVersion.version_origin || '');
    } else if (recipe && recipe.versions.length > 0) {
      const latest = [...recipe.versions].sort((a, b) => b.version_number - a.version_number)[0];
      setIngredients(latest.ingredients);
      setDirections(latest.directions);
      setNotes('');
      setVersionOrigin('');
    }
  }, [activeVersion, recipe]);

  const addItem = (setter: any) => setter((prev: string[]) => [...prev, '']);
  const updateItem = (setter: any, index: number, value: string) => {
    setter((prev: string[]) => { const next = [...prev]; next[index] = value; return next; });
  };
  const removeItem = (setter: any, index: number) =>
    setter((prev: string[]) => prev.filter((_, i) => i !== index));

  const handleSave = async () => {
    if (!name.trim()) return alert('Name required');
    setLoading(true);
    try {
      let recipeId = recipe?.id;

      if (!recipeId) {
        const { data: newR } = await supabase
          .from('recipes')
          .insert([{ name, origin: origin.trim() || null }])
          .select()
          .single();
        recipeId = newR.id;
      } else {
        await supabase
          .from('recipes')
          .update({ name, origin: origin.trim() || null })
          .eq('id', recipeId);
      }

      const versionPayload = {
        ingredients: ingredients.filter(i => i.trim() !== ''),
        directions: directions.filter(d => d.trim() !== ''),
        notes,
        version_origin: versionOrigin.trim() || null,
      };

      if (activeVersion) {
        await supabase
          .from('recipe_versions')
          .update(versionPayload)
          .eq('id', activeVersion.id);
      } else {
        const nextVer = recipe
          ? Math.max(...recipe.versions.map(v => v.version_number)) + 1
          : 1;
        await supabase
          .from('recipe_versions')
          .insert([{ ...versionPayload, recipe_id: recipeId, version_number: nextVer }]);
      }

      onRefresh();
      onClose();
    } catch (err) {
      alert('Save failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm" onClick={onClose} />
      <div
        className="relative w-full max-w-4xl max-h-[90vh] bg-white rounded-2xl border-2 border-slate-900 flex flex-col overflow-hidden"
        style={{ boxShadow: '8px 8px 0 #0f172a' }}
      >
        {/* Header */}
        <div className="px-8 py-5 border-b-2 border-slate-900 flex items-center justify-between bg-[#f5f0e8]">
          <h2 className="text-xl font-semibold text-slate-900">
            {activeVersion ? `Editing Version ${activeVersion.version_number}` : 'New Version'}
          </h2>
          <button
            onClick={onClose}
            className="p-2 border-2 border-slate-900 rounded-xl hover:bg-white transition-colors"
            style={{ boxShadow: '2px 2px 0 #0f172a' }}
          >
            <X className="w-5 h-5 text-slate-600" />
          </button>
        </div>

        <div className="overflow-y-auto p-8 space-y-8 bg-white">

          {/* Title */}
          <div className="space-y-2">
            <label className="text-[10px] font-bold uppercase tracking-widest text-amber-600">Title</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full text-3xl font-semibold border-none focus:ring-0 p-0 outline-none bg-transparent text-slate-900 placeholder:text-slate-300"
              placeholder="Recipe name..."
            />
            <div className="h-0.5 bg-slate-900 w-full" />
          </div>

          {/* Origin fields — side by side on desktop */}
          <div className="grid md:grid-cols-2 gap-6 p-5 bg-slate-50 rounded-xl border-2 border-slate-200">
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold uppercase tracking-widest text-amber-600">
                Recipe Origin
              </label>
              <input
                value={origin}
                onChange={(e) => setOrigin(e.target.value)}
                className="w-full text-sm italic text-slate-600 bg-transparent border-none focus:ring-0 p-0 outline-none placeholder:text-slate-300 placeholder:not-italic"
                placeholder="e.g. Grandma's kitchen, NYT adapted..."
              />
              <p className="text-[10px] text-slate-400">Applies to all versions of this recipe</p>
            </div>
            <div className="space-y-1.5 md:border-l-2 md:border-slate-200 md:pl-6">
              <label className="text-[10px] font-bold uppercase tracking-widest text-amber-600">
                Version Origin
              </label>
              <input
                value={versionOrigin}
                onChange={(e) => setVersionOrigin(e.target.value)}
                className="w-full text-sm italic text-slate-600 bg-transparent border-none focus:ring-0 p-0 outline-none placeholder:text-slate-300 placeholder:not-italic"
                placeholder="e.g. Adapted from Ottolenghi, that trip to Lisbon..."
              />
              <p className="text-[10px] text-slate-400">Specific to this version only</p>
            </div>
          </div>

          {/* Ingredients + Method */}
          <div className="grid md:grid-cols-2 gap-12">
            <Section
              label="Ingredients"
              items={ingredients}
              setter={setIngredients}
              addItem={addItem}
              updateItem={updateItem}
              removeItem={removeItem}
            />
            <Section
              label="Method"
              items={directions}
              setter={setDirections}
              addItem={addItem}
              updateItem={updateItem}
              removeItem={removeItem}
              isTextArea
            />
          </div>

          {/* Chef's Notes */}
          <div className="space-y-2">
            <label className="text-[10px] font-bold uppercase tracking-widest text-amber-600">Chef's Notes</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              placeholder="Any tips, variations, or reminders..."
              className="w-full text-sm bg-amber-50 border-2 border-slate-200 rounded-xl p-4 outline-none focus:border-slate-900 transition-colors resize-none placeholder:text-slate-300"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="px-8 py-5 bg-[#f5f0e8] border-t-2 border-slate-900 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-5 py-2.5 text-sm font-semibold text-slate-600 border-2 border-slate-300 rounded-xl hover:border-slate-900 transition-colors bg-white"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={loading}
            className="px-7 py-2.5 bg-slate-900 text-white rounded-xl text-sm font-semibold hover:bg-slate-700 border-2 border-slate-900 disabled:opacity-50"
            style={{ boxShadow: '3px 3px 0 rgba(0,0,0,0.2)' }}
          >
            {loading ? 'Saving...' : activeVersion ? 'Overwrite Version' : 'Create New Version'}
          </button>
        </div>
      </div>
    </div>
  );
}

function Section({ label, items, setter, addItem, updateItem, removeItem, isTextArea = false }: any) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <label className="text-[10px] font-bold uppercase tracking-widest text-amber-600">{label}</label>
        <button
          onClick={() => addItem(setter)}
          className="p-1.5 border-2 border-slate-900 rounded-lg hover:bg-slate-900 hover:text-white text-slate-700 transition-colors"
          style={{ boxShadow: '2px 2px 0 #0f172a' }}
        >
          <Plus className="w-3.5 h-3.5" />
        </button>
      </div>
      <div className="space-y-3">
        {items.map((item: string, i: number) => (
          <div key={i} className="flex gap-2 items-start">
            {isTextArea ? (
              <textarea
                value={item}
                onChange={(e) => updateItem(setter, i, e.target.value)}
                rows={2}
                className="flex-1 text-sm bg-slate-50 border-2 border-slate-200 rounded-lg p-2.5 outline-none focus:border-slate-900 transition-colors resize-none"
              />
            ) : (
              <input
                value={item}
                onChange={(e) => updateItem(setter, i, e.target.value)}
                className="flex-1 text-sm bg-slate-50 border-2 border-slate-200 rounded-lg p-2.5 outline-none focus:border-slate-900 transition-colors"
              />
            )}
            <button
              onClick={() => removeItem(setter, i)}
              className="p-2 text-slate-300 hover:text-red-500 border-2 border-transparent rounded-lg transition-colors mt-0.5"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
