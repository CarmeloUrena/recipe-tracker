'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Recipe, RecipeVersion } from '@/types';
import { X, Plus, Trash2, Save } from 'lucide-react';

interface Props {
  recipe?: Recipe; 
  activeVersion?: RecipeVersion; // NEW: The specific version we want to overwrite
  onClose: () => void;
  onRefresh: () => void;
}

export default function RecipeForm({ recipe, activeVersion, onClose, onRefresh }: Props) {
  const [name, setName] = useState(recipe?.name || '');
  const [ingredients, setIngredients] = useState<string[]>(['']);
  const [directions, setDirections] = useState<string[]>(['']);
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // If we have an active version, fill the form with its data for editing
    if (activeVersion) {
      setIngredients(activeVersion.ingredients);
      setDirections(activeVersion.directions);
      setNotes(activeVersion.notes || '');
    } else if (recipe && recipe.versions.length > 0) {
      // If we are adding a NEW version, pre-fill with the latest data as a starting point
      const latest = [...recipe.versions].sort((a,b) => b.version_number - a.version_number)[0];
      setIngredients(latest.ingredients);
      setDirections(latest.directions);
      setNotes('');
    }
  }, [activeVersion, recipe]);

  const addItem = (setter: any) => setter((prev: string[]) => [...prev, '']);
  const updateItem = (setter: any, index: number, value: string) => {
    setter((prev: string[]) => {
      const next = [...prev];
      next[index] = value;
      return next;
    });
  };
  const removeItem = (setter: any, index: number) => setter((prev: string[]) => prev.filter((_, i) => i !== index));

  const handleSave = async () => {
    if (!name.trim()) return alert("Enter a name");
    setLoading(true);

    try {
      let recipeId = recipe?.id;

      // Update Recipe Name
      if (!recipeId) {
        const { data: newR, error: re } = await supabase.from('recipes').insert([{ name }]).select().single();
        if (re) throw re;
        recipeId = newR.id;
      } else {
        await supabase.from('recipes').update({ name }).eq('id', recipeId);
      }

      const versionData = {
        ingredients: ingredients.filter(i => i.trim() !== ''),
        directions: directions.filter(d => d.trim() !== ''),
        notes
      };

      if (activeVersion) {
        // OVERWRITE the specific version we were looking at
        const { error: vError } = await supabase
          .from('recipe_versions')
          .update(versionData)
          .eq('id', activeVersion.id);
        if (vError) throw vError;
      } else {
        // CREATE a brand new version
        const nextVer = recipe ? Math.max(...recipe.versions.map(v => v.version_number)) + 1 : 1;
        const { error: vError } = await supabase
          .from('recipe_versions')
          .insert([{ ...versionData, recipe_id: recipeId, version_number: nextVer }]);
        if (vError) throw vError;
      }

      onRefresh();
      onClose();
    } catch (err) {
      console.error(err);
      alert('Error saving.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-md" onClick={onClose} />
      <div className="relative w-full max-w-4xl max-h-[90vh] bg-white rounded-3xl shadow-2xl flex flex-col overflow-hidden">
        <div className="px-8 py-6 border-b border-slate-100 flex items-center justify-between">
          <h2 className="text-2xl font-semibold">
            {activeVersion ? `Editing Version ${activeVersion.version_number}` : 'Add New Version'}
          </h2>
          <button onClick={onClose} className="p-2"><X className="w-6 h-6 text-slate-400" /></button>
        </div>
        <div className="overflow-y-auto p-8 space-y-8">
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-widest text-slate-400">Title</label>
            <input value={name} onChange={(e) => setName(e.target.value)} className="w-full text-3xl font-medium border-none focus:ring-0 p-0 outline-none" />
          </div>
          <div className="grid md:grid-cols-2 gap-12">
            <Section label="Ingredients" items={ingredients} setter={setIngredients} addItem={addItem} updateItem={updateItem} removeItem={removeItem} />
            <Section label="Method" items={directions} setter={setDirections} addItem={addItem} updateItem={updateItem} removeItem={removeItem} isTextArea />
          </div>
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-widest text-slate-400">Notes</label>
            <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} className="w-full text-sm bg-slate-50 border-none rounded-2xl p-4 outline-none" />
          </div>
        </div>
        <div className="px-8 py-6 bg-slate-50 border-t border-slate-100 flex justify-end gap-4">
          <button onClick={onClose} className="px-6 py-2.5 text-sm font-medium text-slate-500">Cancel</button>
          <button onClick={handleSave} disabled={loading} className="px-8 py-2.5 bg-slate-900 text-white rounded-xl text-sm font-medium hover:bg-slate-800 shadow-lg">
            {loading ? 'Saving...' : activeVersion ? 'Update Current Version' : 'Save as New Version'}
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
        <label className="text-xs font-bold uppercase tracking-widest text-slate-400">{label}</label>
        <button onClick={() => addItem(setter)} className="text-blue-600"><Plus className="w-4 h-4" /></button>
      </div>
      <div className="space-y-3">
        {items.map((item: string, i: number) => (
          <div key={i} className="flex gap-2">
            {isTextArea ? (
              <textarea value={item} onChange={(e) => updateItem(setter, i, e.target.value)} rows={1} className="flex-1 text-sm bg-slate-50 border-none rounded-lg p-2 outline-none resize-none" />
            ) : (
              <input value={item} onChange={(e) => updateItem(setter, i, e.target.value)} className="flex-1 text-sm bg-slate-50 border-none rounded-lg p-2 outline-none" />
            )}
            <button onClick={() => removeItem(setter, i)} className="p-2 text-slate-300 hover:text-red-500"><Trash2 className="w-4 h-4" /></button>
          </div>
        ))}
      </div>
    </div>
  );
}
