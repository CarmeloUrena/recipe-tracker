export interface RecipeVersion {
  id: string;
  recipe_id: string;
  version_number: number;
  ingredients: string[];
  directions: string[];
  notes: string;
  source_label: string | null;
  source_url: string | null;
  created_at: string;
}

export interface Recipe {
  id: string;
  name: string;
  created_at: string;
  versions: RecipeVersion[];
}
