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
    <main className="min-h-screen text-slate-900">
      <div className="max-w-6xl mx-auto px-4 md:px-6 py-6 md:py-12">

        {/* Header */}
        <header className="sticky top-0 z-30 bg-[#f5f0e8]/90 backdrop-blur-md pt-4 pb-5 md:pb-8 border-b-2 border-slate-900 mb-6 md:mb-12 flex flex-col md:flex-row md:items-center justify-between gap-4 md:gap-6">
          <div>
            <h1 className="text-4xl font-semibold tracking-tight text-slate-900">Recipes.</h1>
            <p className="text-slate-500 text-sm mt-1 font-medium">Your personal digital cookbook.</p>
          </div>
          <div className="flex items-center gap-4 w-full md:max-w-md">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 h-4 w-4" />
              <input
                type="text"
                placeholder="Search ingredients..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-white border-2 border-slate-900 rounded-xl text-sm focus:outline-none focus:ring-4 focus:ring-slate-900/10"
                style={{ boxShadow: '3px 3px 0 #0f172a' }}
              />
            </div>
            {isAdmin && (
              <button
                onClick={() => {
                  setSelectedRecipe(null);
                  setIsAdding(true);
                }}
                className="bg-slate-900 text-white p-3 rounded-xl border-2 border-slate-900 hover:bg-slate-700 transition-colors"
                style={{ boxShadow: '3px 3px 0 rgba(0,0,0,0.25)' }}
              >
                <Plus className="w-5 h-5" />
              </button>
            )}
          </div>
        </header>

        {/* Recipe Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredRecipes.map((recipe) => (
            <div
              key={recipe.id}
              className="group relative bg-white rounded-xl border-2 border-slate-900 cursor-pointer flex flex-col"
              style={{ boxShadow: '4px 4px 0 #0f172a', transition: 'transform 0.12s, box-shadow 0.12s' }}
              onMouseEnter={e => {
                (e.currentTarget as HTMLElement).style.transform = 'translate(-2px, -2px)';
                (e.currentTarget as HTMLElement).style.boxShadow = '6px 6px 0 #0f172a';
              }}
              onMouseLeave={e => {
                (e.currentTarget as HTMLElement).style.transform = '';
                (e.currentTarget as HTMLElement).style.boxShadow = '4px 4px 0 #0f172a';
              }}
            >
              {/* Admin edit pencil */}
              {isAdmin && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedRecipe(recipe);
                    setIsAdding(true);
                  }}
                  className="absolute top-3 right-3 z-20 p-1.5 bg-white border-2 border-slate-900 rounded-lg opacity-0 group-hover:opacity-100 transition-all hover:bg-amber-50 text-slate-500 hover:text-amber-700"
                  style={{ boxShadow: '2px 2px 0 #0f172a' }}
                >
                  <Edit3 className="w-3 h-3" />
                </button>
              )}

              {/* Clickable area */}
              <div
                onClick={() => setSelectedRecipe(recipe)}
                className="p-5 flex flex-col gap-6"
              >
                <h2 className="text-base font-semibold tracking-tight leading-snug text-slate-900 pr-6">
                  {recipe.name}
                </h2>
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
                    {recipe.versions.length} {recipe.versions.length === 1 ? 'Ver' : 'Vers'}
                  </span>
                  <div className="w-7 h-7 rounded-md border-2 border-slate-900 flex items-center justify-center group-hover:bg-slate-900 transition-colors">
                    <Plus className="w-3.5 h-3.5 text-slate-900 group-hover:text-white" />
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Modal view */}
      {selectedRecipe && !isAdding && (
        <RecipeModal
          recipe={selectedRecipe}
          onClose={() => setSelectedRecipe(null)}
          isAdmin={isAdmin}
          onRefresh={fetchRecipes}
        />
      )}

      {/* Edit / add form */}
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
      <div className="min-h-screen bg-[#f5f0e8] flex items-center justify-center font-medium text-slate-400 animate-pulse">
        Loading Recipes...
      </div>
    }>
      <RecipeApp />
    </Suspense>
  );
}
