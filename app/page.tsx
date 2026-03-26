'use client';

import { useEffect, useState, useMemo } from 'react';
import { useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { Recipe } from '@/types';
import RecipeModal from '@/components/RecipeModal';
import { Search } from 'lucide-react';

export default function Home() {
  const searchParams = useSearchParams();
  const isAdmin = searchParams.get('admin') === 'true';

  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [query, setQuery] = useState('');
  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null);

  useEffect(() => {
    async function fetchRecipes() {
      const { data: recipesData, error } = await supabase
        .from('recipes')
        .select(`
          id, name, created_at,
          recipe_versions ( id, recipe_id, version_number, ingredients, directions, notes, created_at )
        `)
        .order('name');
      
      if (!error && recipesData) {
        // Map Supabase payload to our TypeScript definitions and sort versions
        const formatted = recipesData.map(r => ({
          ...r,
          versions: r.recipe_versions.sort((a, b) => b.version_number - a.version_number)
        })) as Recipe[];
        setRecipes(formatted);
      }
    }
    fetchRecipes();
  }, []);

  const filteredRecipes = useMemo(() => {
    if (!query) return recipes;
    const lowerQuery = query.toLowerCase();
    
    return recipes.filter(recipe => {
      if (recipe.name.toLowerCase().includes(lowerQuery)) return true;
      const latestVersion = recipe.versions[0];
      if (!latestVersion) return false;
      
      return (
        latestVersion.ingredients.some(i => i.toLowerCase().includes(lowerQuery)) ||
        latestVersion.directions.some(d => d.toLowerCase().includes(lowerQuery)) ||
        latestVersion.notes?.toLowerCase().includes(lowerQuery)
      );
    });
  }, [recipes, query]);

  return (
    <main className="min-h-screen bg-[#fafafa] text-slate-900 font-sans selection:bg-slate-200">
      <div className="max-w-6xl mx-auto px-6 py-12">
        {/* Sticky Header / Search */}
        <header className="sticky top-0 z-10 bg-[#fafafa]/80 backdrop-blur-md pt-4 pb-8 border-b border-slate-200 mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <h1 className="text-3xl font-semibold tracking-tight">Recipes.</h1>
          <div className="relative w-full md:max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 h-4 w-4" />
            <input 
              type="text" 
              placeholder="Search recipes, ingredients, notes..." 
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-slate-900/10 shadow-sm transition-all"
            />
          </div>
          {isAdmin && (
            <button className="bg-slate-900 text-white px-5 py-2.5 rounded-xl text-sm font-medium hover:bg-slate-800 transition-colors">
              + New Recipe
            </button>
          )}
        </header>

        {/* Recipe Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredRecipes.map((recipe) => (
            <div 
              key={recipe.id}
              onClick={() => setSelectedRecipe(recipe)}
              className="group bg-white rounded-2xl p-6 shadow-sm border border-slate-100 hover:shadow-md hover:border-slate-200 hover:-translate-y-0.5 transition-all cursor-pointer flex flex-col justify-between aspect-square"
            >
              <h2 className="text-xl font-medium tracking-tight leading-snug group-hover:text-blue-600 transition-colors">{recipe.name}</h2>
              <div className="text-xs text-slate-400 font-medium">
                {recipe.versions.length} {recipe.versions.length === 1 ? 'Version' : 'Versions'}
              </div>
            </div>
          ))}
        </div>
      </div>

      {selectedRecipe && (
        <RecipeModal 
          recipe={selectedRecipe} 
          onClose={() => setSelectedRecipe(null)} 
          isAdmin={isAdmin}
        />
      )}
    </main>
  );
}
