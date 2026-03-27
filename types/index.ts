export interface RecipeVersion {
  id: string;
  recipe_id: string;
  version_number: number;
  ingredients: string[];
  directions: string[];
  notes: string;
  version_origin: string | null;
  created_at: string;
}

export interface Recipe {
  id: string;
  name: string;
  origin: string | null;
  created_at: string;
  versions: RecipeVersion[];
}
