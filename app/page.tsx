'use client';

import { useEffect, useState, useMemo, useCallback, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { Recipe } from '@/types';
import RecipeModal from '@/components/RecipeModal';
import RecipeForm from '@/components/RecipeForm';
import { Search, Plus, Edit3 } from 'lucide-react';

function RecipeApp() {
  const searchParams = useSearchParams();
  const isAdmin = searchParams.get('admin') === 'true';

  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [query, setQuery] = useState('');
  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null);
  const [isAdding, setIsAdding] = useState(false);

  // The "Brain" of the refresh - pulls latest data from Supabase
  const fetchRecipes = useCallback(async () => {
    const { data: recipesData, error } = await supabase
      .from('recipes')
      .select(`
        id, name, created_at,
        recipe_versions ( id, recipe_id, version_number, ingredients, directions, notes, created_at )
      `)
      .order('name');
    
    if (!error && recipesData) {
      const formatted = recipesData.map(r => ({
        ...r,
        versions: (r.recipe_versions || []).sort((a: any, b: any) => a.version_number - b.version_number)
      })) as Recipe[];
      setRecipes(formatted);
    }
  }, []);

  useEffect(() => {
    fetchRecipes();
  }, [fetchRecipes]);

  const filteredRecipes = useMemo(() => {
    if (!query) return recipes;
    const lowerQuery = query.toLowerCase();
    return recipes.filter(recipe => {
      if (recipe.name.toLowerCase().includes(lowerQuery)) return true;
      const latestVersion = recipe.versions[recipe.versions.length - 1];
      if (!latestVersion) return false;
      return (
        latestVersion.ingredients.some(i => i.toLowerCase().includes(lowerQuery)) ||
        latestVersion.directions.some(d => d.toLowerCase().includes(lowerQuery)) ||
        latestVersion.notes?.toLowerCase().includes(lowerQuery)
      );
    });
  }, [recipes, query]);

  return (
    <main className="min-h-screen bg-[#fafafa] text-slate-900">
      <div className="max-w-6xl mx-auto px-6 py-12">
        <header className="sticky top-0 z-30 bg-[#fafafa]/80 backdrop-blur-md pt-4 pb-8 border-b border-slate-200 mb-12 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <h1 className="text-4xl font-semibold tracking-tight text-slate-900">Recipes.</h1>
            <p className="text-slate-400 text-sm mt-1 font-medium">Your personal digital cookbook.</p>
          </div>
          <div className="flex items-center gap-4 w-full md:max-w-md">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 h-4 w-4" />
              <input 
                type="text" 
                placeholder="Search ingredients..." 
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-white border border-slate-200 rounded-2xl text-sm focus:outline-none focus:ring-4 focus:ring-slate-900/5 shadow-sm transition-all"
              />
            </div>
            {isAdmin && (
              <button 
                onClick={() => {
                  setSelectedRecipe(null);
                  setIsAdding(true);
                }} 
                className="bg-slate-900 text-white p-3 rounded-2xl hover:bg-slate-800 transition-all shadow-lg shadow-slate-200"
              >
                <Plus className="w-5 h-5" />
              </button>
            )}
          </div>
        </header>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
          {filteredRecipes.map((recipe) => (
            <div key={recipe.id} className="group relative bg-white rounded-[2rem] shadow-sm border border-slate-100 hover:shadow-xl hover:border-slate-200 hover:-translate-y-1 transition-all cursor-pointer aspect-[4/5] flex flex-col">
              
              {/* ADMIN EDIT PENCIL */}
              {isAdmin && (
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedRecipe(recipe);
                    setIsAdding(true);
                  }}
                  className="absolute top-6 right-6 z-20 p-2.5 bg-white/90 backdrop-blur shadow-sm rounded-xl opacity-0 group-hover:opacity-100 transition-all hover:bg-blue-50 text-slate-400 hover:text-blue-600 border border-slate-100"
                >
                  <Edit3 className="w-4 h-4" />
                </button>
              )}

              {/* CLICKABLE AREA FOR MODAL */}
              <div 
                onClick={() => setSelectedRecipe(recipe)} 
                className="p-8 flex-1 flex flex-col justify-between"
              >
                <h2 className="text-2xl font-semibold tracking-tight leading-tight group-hover:text-blue-600 transition-colors">
                  {recipe.name}
                </h2>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-widest text-slate-300">
                    {recipe.versions.length} {recipe.versions.length === 1 ? 'Ver' : 'Vers'}
                  </span>
                  <div className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center group-hover:bg-blue-50 transition-colors">
                    <Plus className="w-4 h-4 text-slate-300 group-hover:text-blue-500" />
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* MODAL VIEW */}
      {selectedRecipe && !isAdding && (
        <RecipeModal 
          recipe={selectedRecipe} 
          onClose={() => setSelectedRecipe(null)} 
          isAdmin={isAdmin}
          onRefresh={fetchRecipes}
        />
      )}

      {/* EDIT/ADD FORM */}
      {isAdding && (
        <RecipeForm 
          recipe={selectedRecipe || undefined} 
          onClose={() => {
            setIsAdding(false);
            setSelectedRecipe(null);
          }} 
          onRefresh={() => {
            fetchRecipes();
            setIsAdding(false);
            setSelectedRecipe(null);
          }} 
        />
      )}
    </main>
  );
}

export default function Home() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#fafafa] flex items-center justify-center font-medium text-slate-400 animate-pulse">
        Loading Recipes...
      </div>
    }>
      <RecipeApp />
    </Suspense>
  );
}
