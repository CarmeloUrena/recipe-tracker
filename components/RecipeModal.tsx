'use client';

import { useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { Recipe, RecipeVersion } from '@/types';
import { X, Trash2, Edit3, Plus, AlertCircle, Quote, AlertTriangle, ChefHat, Link, Check } from 'lucide-react';
import RecipeForm from './RecipeForm';

interface Props {
  recipe: Recipe;
  onClose: () => void;
  isAdmin?: boolean;
  onRefresh: () => void;
}

interface ConfirmDialog {
  title: string;
  message: string;
  confirmLabel: string;
  danger?: boolean;
  onConfirm: () => void;
}

// ── Cook Mode — clean full-screen read view ────────────────
function CookMode({ recipe, version, onClose }: { recipe: Recipe; version: RecipeVersion; onClose: () => void }) {
  const [showIngredients, setShowIngredients] = useState(true);

  return (
    <div
      className="fixed inset-0 z-[90] flex flex-col"
      style={{
        background: '#f5f0e8',
        backgroundImage: 'radial-gradient(circle, rgba(0,0,0,0.07) 1px, transparent 1px)',
        backgroundSize: '24px 24px',
      }}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b-2 border-slate-900 bg-[#f5f0e8]/90 backdrop-blur-md sticky top-0">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-widest text-amber-600">Cook Mode</p>
          <h2 className="text-lg font-semibold text-slate-900 leading-tight">{recipe.name}</h2>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowIngredients(v => !v)}
            className={`px-4 py-2 text-xs font-bold border-2 border-slate-900 rounded-xl transition-colors ${
              showIngredients ? 'bg-slate-900 text-white' : 'bg-white text-slate-700 hover:bg-amber-50'
            }`}
            style={{ boxShadow: '2px 2px 0 #0f172a' }}
          >
            Ingredients
          </button>
          <button
            onClick={onClose}
            className="p-2 border-2 border-slate-900 rounded-xl bg-white hover:bg-slate-50 transition-colors"
            style={{ boxShadow: '2px 2px 0 #0f172a' }}
          >
            <X className="w-4 h-4 text-slate-700" />
          </button>
        </div>
      </div>

      {/* Scrollable body */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-2xl mx-auto w-full px-6 py-10 space-y-12">

          {/* Ingredients */}
          {showIngredients && (
            <section className="space-y-4">
              <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-amber-600">Ingredients</h3>
              <ul className="space-y-3">
                {version.ingredients.map((ing, i) => (
                  <li key={i} className="flex items-start gap-3 text-slate-700 leading-relaxed text-base">
                    <div className="w-1.5 h-1.5 rounded-full bg-slate-900 mt-2.5 flex-shrink-0" />
                    {ing}
                  </li>
                ))}
              </ul>
            </section>
          )}

          {/* Divider between sections */}
          {showIngredients && (
            <div className="border-t-2 border-slate-200" />
          )}

          {/* Method */}
          <section className="space-y-6">
            <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-amber-600">Method</h3>
            <div className="space-y-8">
              {version.directions.map((step, i) => (
                <div key={i} className="flex gap-5">
                  <span className="text-3xl font-light text-slate-500 tabular-nums flex-shrink-0 leading-snug mt-0.5">
                    {(i + 1).toString().padStart(2, '0')}
                  </span>
                  <p className="text-slate-800 leading-relaxed text-base">{step}</p>
                </div>
              ))}
            </div>
          </section>

          {/* Chef's notes */}
          {version.notes && (
            <section className="space-y-3">
              <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-amber-600">Chef's Notes</h3>
              <div className="p-5 bg-amber-50 border-l-4 border-slate-900 rounded-r-xl text-base text-slate-700 italic leading-relaxed relative">
                <Quote className="absolute top-3 left-3 w-5 h-5 text-amber-200" />
                <p className="relative z-10 pl-5">{version.notes}</p>
              </div>
            </section>
          )}

          {/* Bottom breathing room */}
          <div className="h-10" />
        </div>
      </div>
    </div>
  );
}

// ── Recipe Modal ───────────────────────────────────────────
export default function RecipeModal({ recipe, onClose, isAdmin, onRefresh }: Props) {
  const sortedVersions = [...recipe.versions].sort((a, b) => a.version_number - b.version_number);

  const [activeVersionIdx, setActiveVersionIdx] = useState(0);
  const [isEditing, setIsEditing] = useState(false);
  const [editMode, setEditMode] = useState<'overwrite' | 'new'>('overwrite');
  const [confirm, setConfirm] = useState<ConfirmDialog | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [cookMode, setCookMode] = useState(false);
  const [copied, setCopied] = useState(false);

  const currentVersion = sortedVersions[activeVersionIdx];

  const askConfirm = (dialog: ConfirmDialog) => setConfirm(dialog);
  const dismissConfirm = () => setConfirm(null);

  const handleCopyLink = useCallback(() => {
    const url = `${window.location.origin}/recipe/${recipe.id}?v=${currentVersion.version_number}`;
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }, [recipe.id, currentVersion.version_number]);

  const deleteEntireRecipe = () => {
    askConfirm({
      title: 'Delete entire recipe?',
      message: `"${recipe.name}" and all ${recipe.versions.length} version${recipe.versions.length !== 1 ? 's' : ''} will be permanently removed. This cannot be undone.`,
      confirmLabel: 'Yes, delete everything',
      danger: true,
      onConfirm: async () => {
        setDeleting(true);
        const { error } = await supabase.from('recipes').delete().eq('id', recipe.id);
        setDeleting(false);
        if (!error) { onRefresh(); onClose(); }
      },
    });
  };

  const deleteCurrentVersion = () => {
    if (recipe.versions.length <= 1) {
      askConfirm({
        title: 'Cannot delete only version',
        message: 'This is the only version. To remove it entirely, use the Delete Recipe button instead.',
        confirmLabel: 'Got it',
        danger: false,
        onConfirm: dismissConfirm,
      });
      return;
    }
    askConfirm({
      title: `Delete Version ${currentVersion.version_number}?`,
      message: `Version ${currentVersion.version_number} will be permanently removed. The other versions will remain.`,
      confirmLabel: 'Delete version',
      danger: true,
      onConfirm: async () => {
        setDeleting(true);
        const { error } = await supabase.from('recipe_versions').delete().eq('id', currentVersion.id);
        setDeleting(false);
        if (!error) { onRefresh(); setActiveVersionIdx(0); dismissConfirm(); }
      },
    });
  };

  if (!currentVersion) return null;

  if (cookMode) {
    return <CookMode recipe={recipe} version={currentVersion} onClose={() => setCookMode(false)} />;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center md:p-4" style={{WebkitOverflowScrolling: "touch"}}>
      <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm" onClick={onClose} />

      <div
        className="relative w-full md:max-w-5xl h-[92dvh] md:h-auto md:max-h-[90vh] bg-white rounded-t-2xl md:rounded-2xl border-2 border-b-0 md:border-b-2 border-slate-900 flex flex-col overflow-hidden overscroll-none"
        style={{ boxShadow: '8px 8px 0 #0f172a' }}
      >
        {/* Mobile drag handle */}
        <div className="flex justify-center pt-3 pb-1 md:hidden bg-white flex-shrink-0">
          <div className="w-10 h-1 rounded-full bg-slate-300" />
        </div>

        {/* Header */}
        <div className="px-4 md:px-10 py-3 md:py-7 border-b-2 border-slate-900 flex items-start justify-between bg-white flex-shrink-0 z-10">
          <div className="space-y-0.5">
            <div className="flex items-center gap-3 flex-wrap">
              <h2 className="text-xl md:text-3xl font-semibold tracking-tight text-slate-900">{recipe.name}</h2>
              <span className="px-2.5 py-1 bg-slate-900 text-white rounded-md text-[10px] font-bold uppercase tracking-widest">
                v{currentVersion.version_number}
              </span>
            </div>
            {/* Source */}
            {currentVersion.source_label && (
              <p className="text-slate-400 text-xs font-medium">
                Source:{' '}
                {currentVersion.source_url ? (
                  <a
                    href={currentVersion.source_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-amber-600 underline underline-offset-2 hover:text-amber-700 transition-colors"
                  >
                    {currentVersion.source_label}
                  </a>
                ) : (
                  <span className="text-slate-600 italic">{currentVersion.source_label}</span>
                )}
              </p>
            )}
            <p className="text-slate-400 text-xs font-medium pt-0.5">
              Created {new Date(currentVersion.created_at).toLocaleDateString()}
            </p>
          </div>

          <div className="flex items-center gap-1.5 md:gap-2 flex-shrink-0 justify-end">
            {/* Cook mode */}
            <button
              onClick={() => setCookMode(true)}
              className="flex items-center gap-1.5 px-3 py-2 bg-amber-50 border-2 border-amber-400 rounded-xl hover:bg-amber-100 transition-colors text-amber-700 text-xs font-bold"
              style={{ boxShadow: '2px 2px 0 #b45309' }}
              title="Cook Mode"
            >
              <ChefHat className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Cook</span>
            </button>

            {/* Share */}
            <button
              onClick={handleCopyLink}
              className={`flex items-center gap-1.5 px-3 py-2 border-2 rounded-xl transition-colors text-xs font-bold ${
                copied
                  ? 'bg-green-50 border-green-400 text-green-700'
                  : 'bg-white border-slate-900 text-slate-700 hover:bg-slate-50'
              }`}
              style={{ boxShadow: copied ? '2px 2px 0 #15803d' : '2px 2px 0 #0f172a' }}
              title="Copy shareable link"
            >
              {copied ? <Check className="w-3.5 h-3.5" /> : <Link className="w-3.5 h-3.5" />}
              <span className="hidden sm:inline">{copied ? 'Copied!' : 'Share'}</span>
            </button>

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
        <div className="px-4 md:px-10 py-3 bg-[#f5f0e8] border-b-2 border-slate-900 flex items-center justify-between sticky top-[72px] md:top-[104px] z-10">
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
        <div className="overflow-y-auto p-4 md:p-10 grid grid-cols-1 md:grid-cols-5 gap-0 md:gap-16 flex-1 bg-white">

          {/* Ingredients */}
          <div className="md:col-span-2 space-y-3 pb-6 md:pb-0 border-b-2 md:border-b-0 border-slate-100">
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
          <div className="md:col-span-3 space-y-8 pt-6 md:pt-0">
            <div className="space-y-4">
              <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-amber-600">Method</h3>
              <div className="space-y-4">
                {currentVersion.directions.map((step, i) => (
                  <div key={i} className="flex gap-3 md:gap-4">
                    <span className="text-lg md:text-2xl font-light text-slate-400 tabular-nums flex-shrink-0 leading-snug mt-0.5 min-w-[28px] md:min-w-0">
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

      {/* Confirm dialog */}
      {confirm && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={dismissConfirm} />
          <div
            className="relative w-full max-w-sm bg-white rounded-2xl border-2 border-slate-900 overflow-hidden"
            style={{ boxShadow: '6px 6px 0 #0f172a' }}
          >
            <div className={`px-6 py-5 border-b-2 border-slate-900 flex items-start gap-3 ${confirm.danger ? 'bg-red-50' : 'bg-[#f5f0e8]'}`}>
              <AlertTriangle className={`w-5 h-5 mt-0.5 flex-shrink-0 ${confirm.danger ? 'text-red-500' : 'text-amber-500'}`} />
              <h3 className="font-semibold text-slate-900 text-base leading-snug">{confirm.title}</h3>
            </div>
            <div className="px-6 py-5">
              <p className="text-sm text-slate-600 leading-relaxed">{confirm.message}</p>
            </div>
            <div className="px-6 pb-6 flex gap-3 justify-end">
              {confirm.danger && (
                <button
                  onClick={dismissConfirm}
                  className="px-4 py-2 text-sm font-semibold text-slate-600 bg-white border-2 border-slate-300 rounded-xl hover:border-slate-900 transition-colors"
                >
                  Cancel
                </button>
              )}
              <button
                onClick={confirm.onConfirm}
                disabled={deleting}
                className={`px-5 py-2 text-sm font-semibold rounded-xl border-2 transition-colors disabled:opacity-50 ${
                  confirm.danger
                    ? 'bg-red-600 text-white border-red-600 hover:bg-red-700'
                    : 'bg-slate-900 text-white border-slate-900 hover:bg-slate-700'
                }`}
                style={{ boxShadow: confirm.danger ? '3px 3px 0 #991b1b' : '3px 3px 0 rgba(0,0,0,0.2)' }}
              >
                {deleting ? 'Deleting...' : confirm.confirmLabel}
              </button>
            </div>
          </div>
        </div>
      )}

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
