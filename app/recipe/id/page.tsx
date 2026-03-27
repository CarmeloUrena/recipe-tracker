import { createClient } from '@supabase/supabase-js';
import { notFound } from 'next/navigation';
import { Quote } from 'lucide-react';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

interface Props {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ v?: string }>;
}

export default async function SharedRecipePage({ params, searchParams }: Props) {
  const { id } = await params;
  const { v } = await searchParams;

  const { data: recipe, error } = await supabase
    .from('recipes')
    .select(`
      id, name, origin, created_at,
      recipe_versions ( id, recipe_id, version_number, ingredients, directions, notes, version_origin, created_at )
    `)
    .eq('id', id)
    .single();

  if (error || !recipe) notFound();

  const versions = (recipe.recipe_versions || []).sort(
    (a: any, b: any) => a.version_number - b.version_number
  );

  const requestedVersion = v ? parseInt(v) : null;
  const version = requestedVersion
    ? versions.find((v: any) => v.version_number === requestedVersion) ?? versions[versions.length - 1]
    : versions[versions.length - 1];

  if (!version) notFound();

  return (
    <main
      className="min-h-screen text-slate-900"
      style={{
        background: '#f5f0e8',
        backgroundImage: 'radial-gradient(circle, rgba(0,0,0,0.07) 1px, transparent 1px)',
        backgroundSize: '24px 24px',
        fontFamily: "'Space Grotesk', sans-serif",
        WebkitFontSmoothing: 'antialiased',
      }}
    >
      <div className="max-w-3xl mx-auto px-5 py-12 md:py-20">

        {/* Header */}
        <div className="mb-10 pb-8 border-b-2 border-slate-900">
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div className="space-y-0.5">
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-amber-600 mb-2">Recipe</p>
              <h1 className="text-3xl md:text-4xl font-semibold tracking-tight text-slate-900 leading-tight">
                {recipe.name}
              </h1>
              {/* Recipe-level origin */}
              {recipe.origin && (
                <p className="text-slate-400 text-sm italic">{recipe.origin}</p>
              )}
              {/* Version-level origin */}
              {version.version_origin && version.version_origin !== recipe.origin && (
                <p className="text-amber-500 text-xs italic">v{version.version_number}: {version.version_origin}</p>
              )}
            </div>
            <span className="px-3 py-1.5 bg-slate-900 text-white rounded-md text-[10px] font-bold uppercase tracking-widest self-start mt-1">
              v{version.version_number}
            </span>
          </div>
          <p className="text-slate-400 text-xs font-medium mt-3">
            Updated {new Date(version.created_at).toLocaleDateString()}
          </p>
        </div>

        {/* Content */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-10 md:gap-16">

          {/* Ingredients */}
          <div className="md:col-span-2 space-y-4">
            <h2 className="text-[10px] font-bold uppercase tracking-[0.2em] text-amber-600">Ingredients</h2>
            <ul className="space-y-2.5">
              {version.ingredients.map((ing: string, i: number) => (
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
              <h2 className="text-[10px] font-bold uppercase tracking-[0.2em] text-amber-600">Method</h2>
              <div className="space-y-4">
                {version.directions.map((step: string, i: number) => (
                  <div key={i} className="flex gap-4">
                    <span className="text-2xl font-light text-slate-200 tabular-nums flex-shrink-0 leading-snug mt-0.5">
                      {(i + 1).toString().padStart(2, '0')}
                    </span>
                    <p className="text-slate-700 leading-relaxed text-sm">{step}</p>
                  </div>
                ))}
              </div>
            </div>

            {version.notes && (
              <div className="pt-6 border-t-2 border-slate-100">
                <h2 className="text-[10px] font-bold uppercase tracking-[0.2em] text-amber-600 mb-3">Chef's Notes</h2>
                <div className="p-5 bg-amber-50 border-l-4 border-slate-900 rounded-r-xl text-sm text-slate-700 italic leading-relaxed relative">
                  <Quote className="absolute top-3 left-3 w-5 h-5 text-amber-200" />
                  <p className="relative z-10 pl-5">{version.notes}</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="mt-16 pt-6 border-t-2 border-slate-200">
          <p className="text-xs text-slate-400 italic">Shared from Recipes. — Made with love.</p>
        </div>

      </div>
    </main>
  );
}
