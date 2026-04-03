// ─── Per-100g nutrient data for each ingredient ──────────────────────────
// Macros in grams, micros in µg/mg as noted, calories in kcal.

export interface IngredientNutrients {
  /** kcal per 100 g (or per unit where noted) */
  calories: number;
  /** grams */
  protein: number;
  fat: number;
  carbs: number;
  fiber: number;
  // Micronutrients
  /** µg retinol equivalents */
  vitA: number;
  /** µg */
  vitB12: number;
  /** mg */
  calcium: number;
  /** mg */
  iron: number;
  /** mg */
  sodium: number;
  /** mg */
  potassium: number;
  /** mg ALA / EPA+DHA combined */
  omega3: number;
  /** Serving description (e.g. "1 medium", "100 g") */
  servingDesc: string;
  /** grams per typical serving */
  servingGrams: number;
  /** Food category for filtering */
  category: FoodCategory;
  /** Dietary tags for filtering */
  tags: DietaryTag[];
  /** Regional cuisine association */
  regions: CuisineRegion[];
}

export type FoodCategory =
  | "protein"
  | "grain"
  | "vegetable"
  | "fruit"
  | "dairy"
  | "legume"
  | "nut_seed"
  | "oil_fat"
  | "spice"
  | "beverage"
  | "snack"
  | "prepared"
  | "superfood";

export type DietaryTag =
  | "veg"
  | "vegan"
  | "non-veg"
  | "jain"
  | "gluten-free"
  | "lactose-free"
  | "nut-free"
  | "keto"
  | "high-protein"
  | "low-sodium"
  | "diabetic-friendly"
  | "heart-healthy";

export type CuisineRegion =
  | "north_indian"
  | "south_indian"
  | "pan_indian"
  | "mediterranean"
  | "asian"
  | "western"
  | "universal";

// ─── Comprehensive Food Database ────────────────────────────────────────

export const FOOD_DATABASE: Record<string, IngredientNutrients> = {
  // ── Proteins ──
  "chicken breast": {
    calories: 165, protein: 31, fat: 3.6, carbs: 0, fiber: 0,
    vitA: 6, vitB12: 0.3, calcium: 15, iron: 1.0, sodium: 74, potassium: 256, omega3: 0,
    servingDesc: "100 g", servingGrams: 100, category: "protein",
    tags: ["non-veg", "gluten-free", "high-protein", "keto", "low-sodium"],
    regions: ["universal"],
  },
  "chicken thigh": {
    calories: 209, protein: 26, fat: 10.9, carbs: 0, fiber: 0,
    vitA: 17, vitB12: 0.3, calcium: 12, iron: 1.3, sodium: 84, potassium: 222, omega3: 0,
    servingDesc: "100 g", servingGrams: 100, category: "protein",
    tags: ["non-veg", "gluten-free", "high-protein", "keto"],
    regions: ["universal"],
  },
  egg: {
    calories: 155, protein: 13, fat: 11, carbs: 1.1, fiber: 0,
    vitA: 160, vitB12: 0.9, calcium: 56, iron: 1.8, sodium: 124, potassium: 126, omega3: 37,
    servingDesc: "1 large (50 g)", servingGrams: 50, category: "protein",
    tags: ["veg", "non-veg", "gluten-free", "keto", "high-protein"],
    regions: ["universal"],
  },
  salmon: {
    calories: 208, protein: 20, fat: 13, carbs: 0, fiber: 0,
    vitA: 12, vitB12: 3.2, calcium: 12, iron: 0.3, sodium: 59, potassium: 363, omega3: 2260,
    servingDesc: "100 g fillet", servingGrams: 100, category: "protein",
    tags: ["non-veg", "gluten-free", "high-protein", "heart-healthy", "keto"],
    regions: ["western", "mediterranean"],
  },
  tuna: {
    calories: 132, protein: 28, fat: 1.3, carbs: 0, fiber: 0,
    vitA: 18, vitB12: 9.4, calcium: 10, iron: 1.0, sodium: 47, potassium: 252, omega3: 270,
    servingDesc: "100 g", servingGrams: 100, category: "protein",
    tags: ["non-veg", "gluten-free", "high-protein", "low-sodium", "heart-healthy"],
    regions: ["western", "asian"],
  },
  shrimp: {
    calories: 99, protein: 24, fat: 0.3, carbs: 0.2, fiber: 0,
    vitA: 54, vitB12: 1.1, calcium: 70, iron: 0.5, sodium: 111, potassium: 259, omega3: 540,
    servingDesc: "100 g", servingGrams: 100, category: "protein",
    tags: ["non-veg", "gluten-free", "high-protein", "low-sodium"],
    regions: ["asian", "western", "south_indian"],
  },
  paneer: {
    calories: 265, protein: 18, fat: 20, carbs: 1.2, fiber: 0,
    vitA: 90, vitB12: 0.8, calcium: 480, iron: 0.2, sodium: 18, potassium: 100, omega3: 0,
    servingDesc: "100 g", servingGrams: 100, category: "dairy",
    tags: ["veg", "gluten-free", "high-protein", "keto"],
    regions: ["north_indian", "pan_indian"],
  },
  tofu: {
    calories: 76, protein: 8, fat: 4.8, carbs: 1.9, fiber: 0.3,
    vitA: 0, vitB12: 0, calcium: 350, iron: 5.4, sodium: 7, potassium: 121, omega3: 400,
    servingDesc: "100 g", servingGrams: 100, category: "protein",
    tags: ["vegan", "veg", "gluten-free", "high-protein", "low-sodium", "heart-healthy"],
    regions: ["asian", "universal"],
  },
  turkey: {
    calories: 135, protein: 30, fat: 1, carbs: 0, fiber: 0,
    vitA: 0, vitB12: 0.4, calcium: 10, iron: 1.4, sodium: 70, potassium: 305, omega3: 0,
    servingDesc: "100 g", servingGrams: 100, category: "protein",
    tags: ["non-veg", "gluten-free", "high-protein", "low-sodium"],
    regions: ["western"],
  },

  // ── Dairy ──
  milk: {
    calories: 62, protein: 3.2, fat: 3.3, carbs: 4.8, fiber: 0,
    vitA: 46, vitB12: 0.5, calcium: 120, iron: 0, sodium: 44, potassium: 150, omega3: 0,
    servingDesc: "1 cup (240 ml)", servingGrams: 240, category: "dairy",
    tags: ["veg", "gluten-free"],
    regions: ["universal"],
  },
  yogurt: {
    calories: 61, protein: 3.5, fat: 3.3, carbs: 4.7, fiber: 0,
    vitA: 27, vitB12: 0.4, calcium: 121, iron: 0.1, sodium: 46, potassium: 155, omega3: 0,
    servingDesc: "1 cup (150 g)", servingGrams: 150, category: "dairy",
    tags: ["veg", "gluten-free"],
    regions: ["universal"],
  },
  "greek yogurt": {
    calories: 97, protein: 9, fat: 5, carbs: 3.6, fiber: 0,
    vitA: 22, vitB12: 0.8, calcium: 100, iron: 0.1, sodium: 47, potassium: 141, omega3: 0,
    servingDesc: "1 cup (150 g)", servingGrams: 150, category: "dairy",
    tags: ["veg", "gluten-free", "high-protein"],
    regions: ["western", "mediterranean"],
  },
  curd: {
    calories: 60, protein: 3.1, fat: 3.3, carbs: 4.7, fiber: 0,
    vitA: 27, vitB12: 0.4, calcium: 121, iron: 0.1, sodium: 46, potassium: 155, omega3: 0,
    servingDesc: "1 cup (150 g)", servingGrams: 150, category: "dairy",
    tags: ["veg", "gluten-free"],
    regions: ["pan_indian"],
  },
  buttermilk: {
    calories: 40, protein: 3.3, fat: 0.9, carbs: 4.8, fiber: 0,
    vitA: 14, vitB12: 0.2, calcium: 116, iron: 0.1, sodium: 105, potassium: 151, omega3: 0,
    servingDesc: "1 cup (240 ml)", servingGrams: 240, category: "dairy",
    tags: ["veg", "gluten-free", "low-sodium"],
    regions: ["pan_indian", "south_indian"],
  },
  cheese: {
    calories: 402, protein: 25, fat: 33, carbs: 1.3, fiber: 0,
    vitA: 265, vitB12: 1.1, calcium: 721, iron: 0.7, sodium: 621, potassium: 98, omega3: 0,
    servingDesc: "30 g slice", servingGrams: 30, category: "dairy",
    tags: ["veg", "gluten-free", "keto", "high-protein"],
    regions: ["western", "mediterranean"],
  },

  // ── Grains & Cereals ──
  rice: {
    calories: 130, protein: 2.7, fat: 0.3, carbs: 28, fiber: 0.4,
    vitA: 0, vitB12: 0, calcium: 10, iron: 0.2, sodium: 1, potassium: 35, omega3: 0,
    servingDesc: "1 cup cooked (158 g)", servingGrams: 158, category: "grain",
    tags: ["vegan", "veg", "jain", "gluten-free", "nut-free"],
    regions: ["universal"],
  },
  "brown rice": {
    calories: 111, protein: 2.6, fat: 0.9, carbs: 23, fiber: 1.8,
    vitA: 0, vitB12: 0, calcium: 10, iron: 0.4, sodium: 5, potassium: 43, omega3: 0,
    servingDesc: "1 cup cooked (195 g)", servingGrams: 195, category: "grain",
    tags: ["vegan", "veg", "jain", "gluten-free", "diabetic-friendly", "heart-healthy"],
    regions: ["universal"],
  },
  oats: {
    calories: 389, protein: 16.9, fat: 6.9, carbs: 66, fiber: 10.6,
    vitA: 0, vitB12: 0, calcium: 54, iron: 4.7, sodium: 2, potassium: 429, omega3: 110,
    servingDesc: "½ cup dry (40 g)", servingGrams: 40, category: "grain",
    tags: ["vegan", "veg", "jain", "gluten-free", "diabetic-friendly", "heart-healthy"],
    regions: ["universal"],
  },
  quinoa: {
    calories: 120, protein: 4.4, fat: 1.9, carbs: 21, fiber: 2.8,
    vitA: 1, vitB12: 0, calcium: 17, iron: 1.5, sodium: 7, potassium: 172, omega3: 58,
    servingDesc: "1 cup cooked (185 g)", servingGrams: 185, category: "grain",
    tags: ["vegan", "veg", "jain", "gluten-free", "high-protein", "diabetic-friendly"],
    regions: ["western", "mediterranean"],
  },
  roti: {
    calories: 120, protein: 3.3, fat: 3.7, carbs: 18, fiber: 1.9,
    vitA: 0, vitB12: 0, calcium: 10, iron: 1.0, sodium: 180, potassium: 60, omega3: 0,
    servingDesc: "1 medium (40 g)", servingGrams: 40, category: "grain",
    tags: ["vegan", "veg"],
    regions: ["north_indian", "pan_indian"],
  },
  chapati: {
    calories: 120, protein: 3.3, fat: 3.7, carbs: 18, fiber: 1.9,
    vitA: 0, vitB12: 0, calcium: 10, iron: 1.0, sodium: 180, potassium: 60, omega3: 0,
    servingDesc: "1 medium (40 g)", servingGrams: 40, category: "grain",
    tags: ["vegan", "veg"],
    regions: ["north_indian", "pan_indian"],
  },
  dosa: {
    calories: 168, protein: 3.9, fat: 3.7, carbs: 29, fiber: 0.9,
    vitA: 0, vitB12: 0, calcium: 13, iron: 0.6, sodium: 140, potassium: 68, omega3: 0,
    servingDesc: "1 medium (80 g)", servingGrams: 80, category: "grain",
    tags: ["vegan", "veg", "gluten-free"],
    regions: ["south_indian"],
  },
  idli: {
    calories: 39, protein: 2, fat: 0.2, carbs: 8, fiber: 0.3,
    vitA: 0, vitB12: 0, calcium: 5, iron: 0.3, sodium: 65, potassium: 20, omega3: 0,
    servingDesc: "1 piece (30 g)", servingGrams: 30, category: "grain",
    tags: ["vegan", "veg", "gluten-free", "low-sodium", "diabetic-friendly"],
    regions: ["south_indian"],
  },
  paratha: {
    calories: 260, protein: 5, fat: 10, carbs: 36, fiber: 2,
    vitA: 0, vitB12: 0, calcium: 18, iron: 1.2, sodium: 240, potassium: 80, omega3: 0,
    servingDesc: "1 medium (80 g)", servingGrams: 80, category: "grain",
    tags: ["veg"],
    regions: ["north_indian", "pan_indian"],
  },
  naan: {
    calories: 262, protein: 8.7, fat: 5.3, carbs: 45, fiber: 1.7,
    vitA: 0, vitB12: 0, calcium: 56, iron: 2.5, sodium: 418, potassium: 79, omega3: 0,
    servingDesc: "1 piece (90 g)", servingGrams: 90, category: "grain",
    tags: ["veg"],
    regions: ["north_indian"],
  },
  poha: {
    calories: 130, protein: 2.5, fat: 3.5, carbs: 23, fiber: 0.5,
    vitA: 0, vitB12: 0, calcium: 5, iron: 2.5, sodium: 120, potassium: 50, omega3: 0,
    servingDesc: "1 cup (150 g)", servingGrams: 150, category: "grain",
    tags: ["vegan", "veg", "gluten-free"],
    regions: ["pan_indian"],
  },
  upma: {
    calories: 155, protein: 3.5, fat: 5, carbs: 24, fiber: 1.5,
    vitA: 0, vitB12: 0, calcium: 12, iron: 0.8, sodium: 180, potassium: 55, omega3: 0,
    servingDesc: "1 cup (200 g)", servingGrams: 200, category: "grain",
    tags: ["veg"],
    regions: ["south_indian", "pan_indian"],
  },
  bread: {
    calories: 265, protein: 9, fat: 3.2, carbs: 49, fiber: 2.7,
    vitA: 0, vitB12: 0, calcium: 260, iron: 3.6, sodium: 491, potassium: 115, omega3: 0,
    servingDesc: "1 slice (30 g)", servingGrams: 30, category: "grain",
    tags: ["veg"],
    regions: ["western", "universal"],
  },
  millet: {
    calories: 378, protein: 11, fat: 4.2, carbs: 73, fiber: 8.5,
    vitA: 0, vitB12: 0, calcium: 8, iron: 3.0, sodium: 5, potassium: 195, omega3: 0,
    servingDesc: "½ cup dry (100 g)", servingGrams: 100, category: "grain",
    tags: ["vegan", "veg", "jain", "gluten-free", "diabetic-friendly"],
    regions: ["pan_indian", "south_indian"],
  },
  ragi: {
    calories: 328, protein: 7.3, fat: 1.3, carbs: 72, fiber: 11.5,
    vitA: 0, vitB12: 0, calcium: 344, iron: 3.9, sodium: 11, potassium: 408, omega3: 0,
    servingDesc: "½ cup dry (100 g)", servingGrams: 100, category: "grain",
    tags: ["vegan", "veg", "jain", "gluten-free", "diabetic-friendly"],
    regions: ["south_indian", "pan_indian"],
  },

  // ── Legumes & Pulses ──
  dal: {
    calories: 116, protein: 9, fat: 0.4, carbs: 20, fiber: 8,
    vitA: 2, vitB12: 0, calcium: 19, iron: 3.3, sodium: 2, potassium: 369, omega3: 0,
    servingDesc: "1 cup cooked (200 g)", servingGrams: 200, category: "legume",
    tags: ["vegan", "veg", "jain", "gluten-free", "high-protein", "diabetic-friendly"],
    regions: ["pan_indian"],
  },
  "moong dal": {
    calories: 105, protein: 7.0, fat: 0.4, carbs: 19, fiber: 7.6,
    vitA: 2, vitB12: 0, calcium: 16, iron: 2.4, sodium: 2, potassium: 266, omega3: 0,
    servingDesc: "1 cup cooked (200 g)", servingGrams: 200, category: "legume",
    tags: ["vegan", "veg", "jain", "gluten-free", "diabetic-friendly"],
    regions: ["pan_indian"],
  },
  lentils: {
    calories: 116, protein: 9, fat: 0.4, carbs: 20, fiber: 7.9,
    vitA: 1, vitB12: 0, calcium: 19, iron: 3.3, sodium: 2, potassium: 369, omega3: 0,
    servingDesc: "1 cup cooked (198 g)", servingGrams: 198, category: "legume",
    tags: ["vegan", "veg", "jain", "gluten-free", "high-protein", "diabetic-friendly", "heart-healthy"],
    regions: ["universal"],
  },
  chickpeas: {
    calories: 164, protein: 8.9, fat: 2.6, carbs: 27, fiber: 7.6,
    vitA: 1, vitB12: 0, calcium: 49, iron: 2.9, sodium: 7, potassium: 291, omega3: 43,
    servingDesc: "1 cup cooked (164 g)", servingGrams: 164, category: "legume",
    tags: ["vegan", "veg", "jain", "gluten-free", "high-protein", "diabetic-friendly"],
    regions: ["pan_indian", "mediterranean"],
  },
  rajma: {
    calories: 127, protein: 8.7, fat: 0.5, carbs: 23, fiber: 6.4,
    vitA: 0, vitB12: 0, calcium: 35, iron: 2.2, sodium: 2, potassium: 403, omega3: 0,
    servingDesc: "1 cup cooked (177 g)", servingGrams: 177, category: "legume",
    tags: ["vegan", "veg", "gluten-free", "high-protein"],
    regions: ["north_indian"],
  },
  sprouts: {
    calories: 30, protein: 3.0, fat: 0.2, carbs: 5.9, fiber: 1.8,
    vitA: 1, vitB12: 0, calcium: 13, iron: 0.9, sodium: 6, potassium: 155, omega3: 0,
    servingDesc: "1 cup (100 g)", servingGrams: 100, category: "legume",
    tags: ["vegan", "veg", "jain", "gluten-free", "diabetic-friendly"],
    regions: ["pan_indian"],
  },

  // ── Vegetables ──
  spinach: {
    calories: 23, protein: 2.9, fat: 0.4, carbs: 3.6, fiber: 2.2,
    vitA: 469, vitB12: 0, calcium: 99, iron: 2.7, sodium: 79, potassium: 558, omega3: 138,
    servingDesc: "1 cup raw (30 g)", servingGrams: 30, category: "vegetable",
    tags: ["vegan", "veg", "jain", "gluten-free", "keto", "diabetic-friendly", "heart-healthy"],
    regions: ["universal"],
  },
  broccoli: {
    calories: 34, protein: 2.8, fat: 0.4, carbs: 7, fiber: 2.6,
    vitA: 31, vitB12: 0, calcium: 47, iron: 0.7, sodium: 33, potassium: 316, omega3: 0,
    servingDesc: "1 cup (91 g)", servingGrams: 91, category: "vegetable",
    tags: ["vegan", "veg", "jain", "gluten-free", "keto", "diabetic-friendly"],
    regions: ["universal"],
  },
  carrot: {
    calories: 41, protein: 0.9, fat: 0.2, carbs: 10, fiber: 2.8,
    vitA: 835, vitB12: 0, calcium: 33, iron: 0.3, sodium: 69, potassium: 320, omega3: 0,
    servingDesc: "1 medium (61 g)", servingGrams: 61, category: "vegetable",
    tags: ["vegan", "veg", "jain", "gluten-free", "diabetic-friendly"],
    regions: ["universal"],
  },
  "sweet potato": {
    calories: 86, protein: 1.6, fat: 0.1, carbs: 20, fiber: 3,
    vitA: 709, vitB12: 0, calcium: 30, iron: 0.6, sodium: 55, potassium: 337, omega3: 0,
    servingDesc: "1 medium (130 g)", servingGrams: 130, category: "vegetable",
    tags: ["vegan", "veg", "jain", "gluten-free", "diabetic-friendly"],
    regions: ["universal"],
  },
  potato: {
    calories: 77, protein: 2, fat: 0.1, carbs: 17, fiber: 2.2,
    vitA: 0, vitB12: 0, calcium: 12, iron: 0.8, sodium: 6, potassium: 421, omega3: 0,
    servingDesc: "1 medium (150 g)", servingGrams: 150, category: "vegetable",
    tags: ["vegan", "veg", "jain", "gluten-free", "nut-free"],
    regions: ["universal"],
  },
  tomato: {
    calories: 18, protein: 0.9, fat: 0.2, carbs: 3.9, fiber: 1.2,
    vitA: 42, vitB12: 0, calcium: 10, iron: 0.3, sodium: 5, potassium: 237, omega3: 0,
    servingDesc: "1 medium (123 g)", servingGrams: 123, category: "vegetable",
    tags: ["vegan", "veg", "jain", "gluten-free", "keto", "diabetic-friendly"],
    regions: ["universal"],
  },
  cucumber: {
    calories: 15, protein: 0.7, fat: 0.1, carbs: 3.6, fiber: 0.5,
    vitA: 5, vitB12: 0, calcium: 16, iron: 0.3, sodium: 2, potassium: 147, omega3: 0,
    servingDesc: "1 medium (150 g)", servingGrams: 150, category: "vegetable",
    tags: ["vegan", "veg", "jain", "gluten-free", "keto", "diabetic-friendly"],
    regions: ["universal"],
  },
  "bottle gourd": {
    calories: 15, protein: 0.6, fat: 0.1, carbs: 3.4, fiber: 0.5,
    vitA: 16, vitB12: 0, calcium: 26, iron: 0.2, sodium: 2, potassium: 150, omega3: 0,
    servingDesc: "1 cup (100 g)", servingGrams: 100, category: "vegetable",
    tags: ["vegan", "veg", "jain", "gluten-free", "diabetic-friendly"],
    regions: ["pan_indian"],
  },
  "bitter gourd": {
    calories: 17, protein: 1.0, fat: 0.2, carbs: 3.7, fiber: 2.8,
    vitA: 24, vitB12: 0, calcium: 19, iron: 0.4, sodium: 5, potassium: 296, omega3: 0,
    servingDesc: "1 cup (100 g)", servingGrams: 100, category: "vegetable",
    tags: ["vegan", "veg", "gluten-free", "diabetic-friendly"],
    regions: ["pan_indian", "south_indian"],
  },
  drumstick: {
    calories: 37, protein: 2.1, fat: 0.2, carbs: 8.5, fiber: 2.0,
    vitA: 74, vitB12: 0, calcium: 30, iron: 0.4, sodium: 42, potassium: 461, omega3: 0,
    servingDesc: "1 cup (100 g)", servingGrams: 100, category: "vegetable",
    tags: ["vegan", "veg", "gluten-free"],
    regions: ["south_indian", "pan_indian"],
  },
  "bell pepper": {
    calories: 31, protein: 1.0, fat: 0.3, carbs: 6, fiber: 2.1,
    vitA: 157, vitB12: 0, calcium: 7, iron: 0.4, sodium: 4, potassium: 211, omega3: 0,
    servingDesc: "1 medium (120 g)", servingGrams: 120, category: "vegetable",
    tags: ["vegan", "veg", "jain", "gluten-free", "keto", "diabetic-friendly"],
    regions: ["universal"],
  },
  avocado: {
    calories: 160, protein: 2, fat: 15, carbs: 9, fiber: 7,
    vitA: 7, vitB12: 0, calcium: 12, iron: 0.6, sodium: 7, potassium: 485, omega3: 110,
    servingDesc: "½ medium (100 g)", servingGrams: 100, category: "vegetable",
    tags: ["vegan", "veg", "jain", "gluten-free", "keto", "heart-healthy"],
    regions: ["western", "mediterranean"],
  },

  // ── Fruits ──
  banana: {
    calories: 89, protein: 1.1, fat: 0.3, carbs: 23, fiber: 2.6,
    vitA: 3, vitB12: 0, calcium: 5, iron: 0.3, sodium: 1, potassium: 358, omega3: 27,
    servingDesc: "1 medium (118 g)", servingGrams: 118, category: "fruit",
    tags: ["vegan", "veg", "jain", "gluten-free", "nut-free"],
    regions: ["universal"],
  },
  apple: {
    calories: 52, protein: 0.3, fat: 0.2, carbs: 14, fiber: 2.4,
    vitA: 3, vitB12: 0, calcium: 6, iron: 0.1, sodium: 1, potassium: 107, omega3: 9,
    servingDesc: "1 medium (182 g)", servingGrams: 182, category: "fruit",
    tags: ["vegan", "veg", "jain", "gluten-free", "nut-free", "diabetic-friendly"],
    regions: ["universal"],
  },
  orange: {
    calories: 47, protein: 0.9, fat: 0.1, carbs: 12, fiber: 2.4,
    vitA: 11, vitB12: 0, calcium: 40, iron: 0.1, sodium: 0, potassium: 181, omega3: 7,
    servingDesc: "1 medium (131 g)", servingGrams: 131, category: "fruit",
    tags: ["vegan", "veg", "jain", "gluten-free", "nut-free", "diabetic-friendly"],
    regions: ["universal"],
  },
  mango: {
    calories: 60, protein: 0.8, fat: 0.4, carbs: 15, fiber: 1.6,
    vitA: 54, vitB12: 0, calcium: 11, iron: 0.2, sodium: 1, potassium: 168, omega3: 0,
    servingDesc: "1 cup (165 g)", servingGrams: 165, category: "fruit",
    tags: ["vegan", "veg", "jain", "gluten-free", "nut-free"],
    regions: ["pan_indian", "asian"],
  },
  papaya: {
    calories: 43, protein: 0.5, fat: 0.3, carbs: 11, fiber: 1.7,
    vitA: 47, vitB12: 0, calcium: 20, iron: 0.3, sodium: 8, potassium: 182, omega3: 0,
    servingDesc: "1 cup (145 g)", servingGrams: 145, category: "fruit",
    tags: ["vegan", "veg", "jain", "gluten-free", "diabetic-friendly"],
    regions: ["pan_indian"],
  },
  guava: {
    calories: 68, protein: 2.6, fat: 1.0, carbs: 14, fiber: 5.4,
    vitA: 31, vitB12: 0, calcium: 18, iron: 0.3, sodium: 2, potassium: 417, omega3: 0,
    servingDesc: "1 medium (100 g)", servingGrams: 100, category: "fruit",
    tags: ["vegan", "veg", "jain", "gluten-free", "diabetic-friendly"],
    regions: ["pan_indian"],
  },
  berries: {
    calories: 57, protein: 0.7, fat: 0.3, carbs: 14, fiber: 2.4,
    vitA: 1, vitB12: 0, calcium: 6, iron: 0.4, sodium: 1, potassium: 77, omega3: 68,
    servingDesc: "1 cup (150 g)", servingGrams: 150, category: "fruit",
    tags: ["vegan", "veg", "jain", "gluten-free", "diabetic-friendly", "heart-healthy"],
    regions: ["western", "universal"],
  },
  pomegranate: {
    calories: 83, protein: 1.7, fat: 1.2, carbs: 19, fiber: 4,
    vitA: 0, vitB12: 0, calcium: 10, iron: 0.3, sodium: 3, potassium: 236, omega3: 0,
    servingDesc: "½ cup seeds (87 g)", servingGrams: 87, category: "fruit",
    tags: ["vegan", "veg", "jain", "gluten-free", "heart-healthy"],
    regions: ["pan_indian", "mediterranean"],
  },
  coconut: {
    calories: 354, protein: 3.3, fat: 33, carbs: 15, fiber: 9,
    vitA: 0, vitB12: 0, calcium: 14, iron: 2.4, sodium: 20, potassium: 356, omega3: 0,
    servingDesc: "¼ cup grated (20 g)", servingGrams: 20, category: "fruit",
    tags: ["vegan", "veg", "jain", "gluten-free", "keto"],
    regions: ["south_indian", "pan_indian"],
  },

  // ── Nuts & Seeds ──
  almonds: {
    calories: 579, protein: 21, fat: 50, carbs: 22, fiber: 12.5,
    vitA: 0, vitB12: 0, calcium: 269, iron: 3.7, sodium: 1, potassium: 733, omega3: 6,
    servingDesc: "¼ cup (23 g)", servingGrams: 23, category: "nut_seed",
    tags: ["vegan", "veg", "jain", "gluten-free", "keto", "heart-healthy"],
    regions: ["universal"],
  },
  walnuts: {
    calories: 654, protein: 15, fat: 65, carbs: 14, fiber: 6.7,
    vitA: 1, vitB12: 0, calcium: 98, iron: 2.9, sodium: 2, potassium: 441, omega3: 9080,
    servingDesc: "¼ cup (28 g)", servingGrams: 28, category: "nut_seed",
    tags: ["vegan", "veg", "jain", "gluten-free", "keto", "heart-healthy"],
    regions: ["universal"],
  },
  "pumpkin seeds": {
    calories: 559, protein: 30, fat: 49, carbs: 11, fiber: 6,
    vitA: 1, vitB12: 0, calcium: 46, iron: 8.8, sodium: 7, potassium: 809, omega3: 120,
    servingDesc: "¼ cup (30 g)", servingGrams: 30, category: "nut_seed",
    tags: ["vegan", "veg", "jain", "gluten-free", "keto", "high-protein", "nut-free"],
    regions: ["universal"],
  },
  "sunflower seeds": {
    calories: 584, protein: 21, fat: 51, carbs: 20, fiber: 8.6,
    vitA: 3, vitB12: 0, calcium: 78, iron: 5.3, sodium: 9, potassium: 645, omega3: 74,
    servingDesc: "¼ cup (30 g)", servingGrams: 30, category: "nut_seed",
    tags: ["vegan", "veg", "jain", "gluten-free", "nut-free", "heart-healthy"],
    regions: ["universal"],
  },
  "flax seeds": {
    calories: 534, protein: 18, fat: 42, carbs: 29, fiber: 27,
    vitA: 0, vitB12: 0, calcium: 255, iron: 5.7, sodium: 30, potassium: 813, omega3: 22800,
    servingDesc: "1 tbsp (10 g)", servingGrams: 10, category: "nut_seed",
    tags: ["vegan", "veg", "jain", "gluten-free", "nut-free", "heart-healthy", "diabetic-friendly"],
    regions: ["universal"],
  },
  "chia seeds": {
    calories: 486, protein: 17, fat: 31, carbs: 42, fiber: 34,
    vitA: 0, vitB12: 0, calcium: 631, iron: 7.7, sodium: 16, potassium: 407, omega3: 17800,
    servingDesc: "1 tbsp (12 g)", servingGrams: 12, category: "nut_seed",
    tags: ["vegan", "veg", "jain", "gluten-free", "nut-free", "heart-healthy", "diabetic-friendly"],
    regions: ["universal"],
  },
  cashews: {
    calories: 553, protein: 18, fat: 44, carbs: 30, fiber: 3.3,
    vitA: 0, vitB12: 0, calcium: 37, iron: 6.7, sodium: 12, potassium: 660, omega3: 62,
    servingDesc: "¼ cup (28 g)", servingGrams: 28, category: "nut_seed",
    tags: ["vegan", "veg", "jain", "gluten-free"],
    regions: ["pan_indian", "universal"],
  },
  peanuts: {
    calories: 567, protein: 26, fat: 49, carbs: 16, fiber: 8.5,
    vitA: 0, vitB12: 0, calcium: 92, iron: 4.6, sodium: 18, potassium: 705, omega3: 3,
    servingDesc: "¼ cup (36 g)", servingGrams: 36, category: "nut_seed",
    tags: ["vegan", "veg", "gluten-free", "high-protein"],
    regions: ["universal"],
  },

  // ── Superfoods & Singles ──
  "moringa powder": {
    calories: 205, protein: 27, fat: 2.3, carbs: 38, fiber: 19.2,
    vitA: 3780, vitB12: 0, calcium: 2003, iron: 28.2, sodium: 9, potassium: 1324, omega3: 44,
    servingDesc: "1 tsp (5 g)", servingGrams: 5, category: "superfood",
    tags: ["vegan", "veg", "jain", "gluten-free", "nut-free", "diabetic-friendly"],
    regions: ["pan_indian", "south_indian"],
  },
  turmeric: {
    calories: 312, protein: 9.7, fat: 3.3, carbs: 67, fiber: 22.7,
    vitA: 0, vitB12: 0, calcium: 168, iron: 55, sodium: 27, potassium: 2080, omega3: 0,
    servingDesc: "1 tsp (3 g)", servingGrams: 3, category: "spice",
    tags: ["vegan", "veg", "jain", "gluten-free", "nut-free"],
    regions: ["pan_indian"],
  },
  ghee: {
    calories: 900, protein: 0, fat: 100, carbs: 0, fiber: 0,
    vitA: 840, vitB12: 0, calcium: 0, iron: 0, sodium: 0, potassium: 0, omega3: 1500,
    servingDesc: "1 tsp (5 g)", servingGrams: 5, category: "oil_fat",
    tags: ["veg", "gluten-free", "keto", "lactose-free"],
    regions: ["pan_indian"],
  },
  "olive oil": {
    calories: 884, protein: 0, fat: 100, carbs: 0, fiber: 0,
    vitA: 0, vitB12: 0, calcium: 1, iron: 0.6, sodium: 2, potassium: 1, omega3: 761,
    servingDesc: "1 tbsp (14 g)", servingGrams: 14, category: "oil_fat",
    tags: ["vegan", "veg", "jain", "gluten-free", "keto", "heart-healthy"],
    regions: ["mediterranean", "western"],
  },
  "coconut oil": {
    calories: 862, protein: 0, fat: 100, carbs: 0, fiber: 0,
    vitA: 0, vitB12: 0, calcium: 0, iron: 0, sodium: 0, potassium: 0, omega3: 0,
    servingDesc: "1 tbsp (14 g)", servingGrams: 14, category: "oil_fat",
    tags: ["vegan", "veg", "jain", "gluten-free", "keto"],
    regions: ["south_indian", "pan_indian"],
  },
  honey: {
    calories: 304, protein: 0.3, fat: 0, carbs: 82, fiber: 0.2,
    vitA: 0, vitB12: 0, calcium: 6, iron: 0.4, sodium: 4, potassium: 52, omega3: 0,
    servingDesc: "1 tbsp (21 g)", servingGrams: 21, category: "superfood",
    tags: ["veg", "gluten-free", "nut-free"],
    regions: ["universal"],
  },
  jaggery: {
    calories: 383, protein: 0.4, fat: 0.1, carbs: 98, fiber: 0,
    vitA: 0, vitB12: 0, calcium: 80, iron: 11, sodium: 30, potassium: 1050, omega3: 0,
    servingDesc: "1 tbsp (20 g)", servingGrams: 20, category: "superfood",
    tags: ["vegan", "veg", "jain", "gluten-free", "nut-free"],
    regions: ["pan_indian"],
  },

  // ── Prepared Indian Dishes ──
  "palak paneer": {
    calories: 170, protein: 9, fat: 12, carbs: 6, fiber: 2,
    vitA: 280, vitB12: 0.3, calcium: 240, iron: 2.8, sodium: 450, potassium: 320, omega3: 50,
    servingDesc: "1 cup (200 g)", servingGrams: 200, category: "prepared",
    tags: ["veg", "gluten-free"],
    regions: ["north_indian"],
  },
  "chana masala": {
    calories: 125, protein: 6, fat: 4.5, carbs: 17, fiber: 5,
    vitA: 15, vitB12: 0, calcium: 40, iron: 2.5, sodium: 380, potassium: 270, omega3: 0,
    servingDesc: "1 cup (200 g)", servingGrams: 200, category: "prepared",
    tags: ["vegan", "veg", "gluten-free"],
    regions: ["north_indian", "pan_indian"],
  },
  "butter chicken": {
    calories: 175, protein: 14, fat: 10, carbs: 8, fiber: 1,
    vitA: 85, vitB12: 0.3, calcium: 50, iron: 1.2, sodium: 520, potassium: 200, omega3: 0,
    servingDesc: "1 cup (200 g)", servingGrams: 200, category: "prepared",
    tags: ["non-veg", "gluten-free"],
    regions: ["north_indian"],
  },
  sambhar: {
    calories: 65, protein: 3.5, fat: 1.5, carbs: 10, fiber: 3,
    vitA: 20, vitB12: 0, calcium: 25, iron: 1.5, sodium: 350, potassium: 200, omega3: 0,
    servingDesc: "1 cup (200 g)", servingGrams: 200, category: "prepared",
    tags: ["vegan", "veg", "gluten-free"],
    regions: ["south_indian"],
  },
  rasam: {
    calories: 30, protein: 1.5, fat: 0.5, carbs: 5, fiber: 1,
    vitA: 10, vitB12: 0, calcium: 10, iron: 0.5, sodium: 300, potassium: 100, omega3: 0,
    servingDesc: "1 cup (200 g)", servingGrams: 200, category: "prepared",
    tags: ["vegan", "veg", "gluten-free", "low-sodium"],
    regions: ["south_indian"],
  },
  biryani: {
    calories: 180, protein: 8, fat: 6, carbs: 25, fiber: 1,
    vitA: 15, vitB12: 0.2, calcium: 20, iron: 1.0, sodium: 500, potassium: 120, omega3: 0,
    servingDesc: "1 cup (250 g)", servingGrams: 250, category: "prepared",
    tags: ["non-veg", "gluten-free"],
    regions: ["pan_indian"],
  },
  khichdi: {
    calories: 105, protein: 4, fat: 2, carbs: 18, fiber: 2,
    vitA: 5, vitB12: 0, calcium: 15, iron: 1.0, sodium: 200, potassium: 100, omega3: 0,
    servingDesc: "1 cup (200 g)", servingGrams: 200, category: "prepared",
    tags: ["veg", "gluten-free", "diabetic-friendly"],
    regions: ["pan_indian"],
  },

  // ── Additional ingredients for meal templates ──

  onion: {
    calories: 40, protein: 1.1, fat: 0.1, carbs: 9.3, fiber: 1.7,
    vitA: 0, vitB12: 0, calcium: 23, iron: 0.2, sodium: 4, potassium: 146, omega3: 0,
    servingDesc: "1 medium (100 g)", servingGrams: 100, category: "vegetable",
    tags: ["veg", "vegan", "gluten-free", "lactose-free"],
    regions: ["universal"],
  },
  peas: {
    calories: 81, protein: 5.4, fat: 0.4, carbs: 14.5, fiber: 5.7,
    vitA: 38, vitB12: 0, calcium: 25, iron: 1.5, sodium: 5, potassium: 244, omega3: 0,
    servingDesc: "1 cup (100 g)", servingGrams: 100, category: "vegetable",
    tags: ["veg", "vegan", "gluten-free", "high-protein"],
    regions: ["universal"],
  },
  lemon: {
    calories: 29, protein: 1.1, fat: 0.3, carbs: 9.3, fiber: 2.8,
    vitA: 1, vitB12: 0, calcium: 26, iron: 0.6, sodium: 2, potassium: 138, omega3: 0,
    servingDesc: "1 medium (58 g)", servingGrams: 58, category: "fruit",
    tags: ["veg", "vegan", "gluten-free"],
    regions: ["universal"],
  },
  coriander: {
    calories: 23, protein: 2.1, fat: 0.5, carbs: 3.7, fiber: 2.8,
    vitA: 337, vitB12: 0, calcium: 67, iron: 1.8, sodium: 46, potassium: 521, omega3: 0,
    servingDesc: "1 cup leaves (16 g)", servingGrams: 16, category: "spice",
    tags: ["veg", "vegan", "gluten-free"],
    regions: ["pan_indian"],
  },
  dates: {
    calories: 277, protein: 1.8, fat: 0.2, carbs: 75, fiber: 6.7,
    vitA: 7, vitB12: 0, calcium: 64, iron: 0.9, sodium: 1, potassium: 696, omega3: 0,
    servingDesc: "3 pieces (30 g)", servingGrams: 30, category: "fruit",
    tags: ["veg", "vegan", "gluten-free"],
    regions: ["pan_indian", "mediterranean"],
  },
  "toor dal": {
    calories: 343, protein: 22, fat: 1.5, carbs: 63, fiber: 15,
    vitA: 3, vitB12: 0, calcium: 73, iron: 5, sodium: 17, potassium: 1392, omega3: 0,
    servingDesc: "1 cup dry (200 g)", servingGrams: 200, category: "legume",
    tags: ["veg", "vegan", "gluten-free", "high-protein"],
    regions: ["pan_indian", "south_indian"],
  },
  "peanut butter": {
    calories: 588, protein: 25, fat: 50, carbs: 20, fiber: 6,
    vitA: 0, vitB12: 0, calcium: 45, iron: 1.7, sodium: 459, potassium: 649, omega3: 0,
    servingDesc: "2 tbsp (32 g)", servingGrams: 32, category: "nut_seed",
    tags: ["veg", "vegan", "gluten-free", "high-protein"],
    regions: ["western"],
  },
  makhana: {
    calories: 350, protein: 9.7, fat: 0.1, carbs: 77, fiber: 14.5,
    vitA: 0, vitB12: 0, calcium: 60, iron: 1.4, sodium: 1, potassium: 500, omega3: 0,
    servingDesc: "1 cup (30 g)", servingGrams: 30, category: "snack",
    tags: ["veg", "vegan", "gluten-free", "jain", "diabetic-friendly"],
    regions: ["north_indian", "pan_indian"],
  },
  sambar: {
    calories: 65, protein: 3.5, fat: 1.5, carbs: 10, fiber: 2.5,
    vitA: 40, vitB12: 0, calcium: 30, iron: 1.2, sodium: 350, potassium: 200, omega3: 0,
    servingDesc: "1 cup (200 g)", servingGrams: 200, category: "prepared",
    tags: ["veg", "vegan", "gluten-free"],
    regions: ["south_indian"],
  },
  salad: {
    calories: 20, protein: 1.5, fat: 0.2, carbs: 3.5, fiber: 1.8,
    vitA: 200, vitB12: 0, calcium: 30, iron: 0.8, sodium: 10, potassium: 200, omega3: 0,
    servingDesc: "1 cup mixed (100 g)", servingGrams: 100, category: "vegetable",
    tags: ["veg", "vegan", "gluten-free"],
    regions: ["universal"],
  },
  papad: {
    calories: 371, protein: 25, fat: 1.5, carbs: 60, fiber: 18,
    vitA: 5, vitB12: 0, calcium: 90, iron: 6, sodium: 1500, potassium: 700, omega3: 0,
    servingDesc: "1 piece (15 g)", servingGrams: 15, category: "snack",
    tags: ["veg", "vegan", "gluten-free"],
    regions: ["pan_indian"],
  },
  "soy sauce": {
    calories: 53, protein: 8, fat: 0, carbs: 5, fiber: 0,
    vitA: 0, vitB12: 0, calcium: 20, iron: 2.4, sodium: 5493, potassium: 212, omega3: 0,
    servingDesc: "1 tbsp (15 ml)", servingGrams: 15, category: "spice",
    tags: ["veg", "vegan"],
    regions: ["asian"],
  },
  "mixed berries": {
    calories: 57, protein: 1.2, fat: 0.5, carbs: 13, fiber: 3.5,
    vitA: 10, vitB12: 0, calcium: 20, iron: 0.5, sodium: 1, potassium: 150, omega3: 60,
    servingDesc: "1 cup (150 g)", servingGrams: 150, category: "fruit",
    tags: ["veg", "vegan", "gluten-free"],
    regions: ["western"],
  },
  "mixed vegetables": {
    calories: 65, protein: 2.5, fat: 0.3, carbs: 13, fiber: 4,
    vitA: 300, vitB12: 0, calcium: 30, iron: 1.0, sodium: 40, potassium: 250, omega3: 0,
    servingDesc: "1 cup (150 g)", servingGrams: 150, category: "vegetable",
    tags: ["veg", "vegan", "gluten-free"],
    regions: ["universal"],
  },
  "black pepper": {
    calories: 251, protein: 10, fat: 3.3, carbs: 64, fiber: 25,
    vitA: 27, vitB12: 0, calcium: 443, iron: 9.7, sodium: 20, potassium: 1329, omega3: 0,
    servingDesc: "1 tsp (2 g)", servingGrams: 2, category: "spice",
    tags: ["veg", "vegan", "gluten-free", "jain"],
    regions: ["universal"],
  },
  // Singular aliases for plural keys
  almond: {
    calories: 579, protein: 21, fat: 50, carbs: 22, fiber: 12,
    vitA: 0.5, vitB12: 0, calcium: 269, iron: 3.7, sodium: 1, potassium: 733, omega3: 6,
    servingDesc: "10 pieces (14 g)", servingGrams: 14, category: "nut_seed",
    tags: ["veg", "vegan", "gluten-free", "keto", "high-protein"],
    regions: ["pan_indian", "mediterranean", "western"],
  },
  walnut: {
    calories: 654, protein: 15, fat: 65, carbs: 14, fiber: 7,
    vitA: 1, vitB12: 0, calcium: 98, iron: 2.9, sodium: 2, potassium: 441, omega3: 9080,
    servingDesc: "5 halves (15 g)", servingGrams: 15, category: "nut_seed",
    tags: ["veg", "vegan", "gluten-free", "keto", "heart-healthy"],
    regions: ["pan_indian", "mediterranean", "western"],
  },
  peanut: {
    calories: 567, protein: 26, fat: 49, carbs: 16, fiber: 8.5,
    vitA: 0, vitB12: 0, calcium: 92, iron: 4.6, sodium: 18, potassium: 705, omega3: 0,
    servingDesc: "1 handful (30 g)", servingGrams: 30, category: "nut_seed",
    tags: ["veg", "vegan", "gluten-free", "high-protein"],
    regions: ["pan_indian", "asian"],
  },

  // ── Additional items for combo meals ──

  lamb: {
    calories: 294, protein: 25, fat: 21, carbs: 0, fiber: 0,
    vitA: 0, vitB12: 2.6, calcium: 17, iron: 1.9, sodium: 72, potassium: 310, omega3: 0,
    servingDesc: "100 g", servingGrams: 100, category: "protein",
    tags: ["non-veg", "gluten-free", "high-protein", "keto"],
    regions: ["north_indian", "pan_indian", "mediterranean"],
  },
  "whey protein": {
    calories: 400, protein: 80, fat: 5, carbs: 10, fiber: 0,
    vitA: 0, vitB12: 2, calcium: 500, iron: 4, sodium: 200, potassium: 400, omega3: 0,
    servingDesc: "1 scoop (30 g)", servingGrams: 30, category: "protein",
    tags: ["veg", "gluten-free", "high-protein"],
    regions: ["universal"],
  },
  "orange juice": {
    calories: 45, protein: 0.7, fat: 0.2, carbs: 10.4, fiber: 0.2,
    vitA: 10, vitB12: 0, calcium: 11, iron: 0.2, sodium: 1, potassium: 200, omega3: 0,
    servingDesc: "1 glass (250 ml)", servingGrams: 250, category: "beverage",
    tags: ["veg", "vegan", "gluten-free"],
    regions: ["universal"],
  },
  "green beans": {
    calories: 31, protein: 1.8, fat: 0.2, carbs: 7, fiber: 2.7,
    vitA: 35, vitB12: 0, calcium: 37, iron: 1, sodium: 6, potassium: 211, omega3: 0,
    servingDesc: "1 cup (100 g)", servingGrams: 100, category: "vegetable",
    tags: ["veg", "vegan", "gluten-free"],
    regions: ["universal"],
  },
  raisin: {
    calories: 299, protein: 3.1, fat: 0.5, carbs: 79, fiber: 3.7,
    vitA: 0, vitB12: 0, calcium: 50, iron: 1.9, sodium: 11, potassium: 749, omega3: 0,
    servingDesc: "1/4 cup (40 g)", servingGrams: 40, category: "fruit",
    tags: ["veg", "vegan", "gluten-free", "jain"],
    regions: ["universal"],
  },
  "almond milk": {
    calories: 15, protein: 0.6, fat: 1.2, carbs: 0.6, fiber: 0.2,
    vitA: 0, vitB12: 0, calcium: 184, iron: 0.3, sodium: 72, potassium: 67, omega3: 0,
    servingDesc: "1 cup (240 ml)", servingGrams: 240, category: "beverage",
    tags: ["vegan", "veg", "gluten-free", "lactose-free", "keto"],
    regions: ["western"],
  },
  "cottage cheese": {
    calories: 98, protein: 11, fat: 4.3, carbs: 3.4, fiber: 0,
    vitA: 37, vitB12: 0.4, calcium: 83, iron: 0.1, sodium: 364, potassium: 104, omega3: 0,
    servingDesc: "1/2 cup (113 g)", servingGrams: 113, category: "dairy",
    tags: ["veg", "gluten-free", "high-protein"],
    regions: ["western"],
  },
  raita: {
    calories: 42, protein: 2.5, fat: 1.5, carbs: 5, fiber: 0.3,
    vitA: 15, vitB12: 0.2, calcium: 80, iron: 0.1, sodium: 200, potassium: 120, omega3: 0,
    servingDesc: "1 cup (150 g)", servingGrams: 150, category: "prepared",
    tags: ["veg", "gluten-free"],
    regions: ["north_indian", "pan_indian"],
  },
  "masala chai": {
    calories: 50, protein: 1.8, fat: 1.5, carbs: 7, fiber: 0,
    vitA: 20, vitB12: 0.2, calcium: 60, iron: 0.3, sodium: 30, potassium: 80, omega3: 0,
    servingDesc: "1 cup (200 ml)", servingGrams: 200, category: "beverage",
    tags: ["veg", "gluten-free"],
    regions: ["pan_indian", "north_indian"],
  },

  // ── Expanded ingredients for 100+ meal templates ──

  cauliflower: {
    calories: 25, protein: 1.9, fat: 0.3, carbs: 5, fiber: 2,
    vitA: 0, vitB12: 0, calcium: 22, iron: 0.4, sodium: 30, potassium: 299, omega3: 0,
    servingDesc: "1 cup (100 g)", servingGrams: 100, category: "vegetable",
    tags: ["veg", "vegan", "jain", "gluten-free", "keto", "diabetic-friendly"],
    regions: ["universal"],
  },
  mushroom: {
    calories: 22, protein: 3.1, fat: 0.3, carbs: 3.3, fiber: 1,
    vitA: 0, vitB12: 0.04, calcium: 3, iron: 0.5, sodium: 5, potassium: 318, omega3: 0,
    servingDesc: "1 cup sliced (70 g)", servingGrams: 70, category: "vegetable",
    tags: ["veg", "vegan", "gluten-free", "keto", "diabetic-friendly"],
    regions: ["universal"],
  },
  eggplant: {
    calories: 25, protein: 1, fat: 0.2, carbs: 6, fiber: 3,
    vitA: 1, vitB12: 0, calcium: 9, iron: 0.2, sodium: 2, potassium: 229, omega3: 0,
    servingDesc: "1 cup (82 g)", servingGrams: 82, category: "vegetable",
    tags: ["veg", "vegan", "gluten-free", "keto", "diabetic-friendly"],
    regions: ["pan_indian", "mediterranean"],
  },
  okra: {
    calories: 33, protein: 1.9, fat: 0.2, carbs: 7, fiber: 3.2,
    vitA: 36, vitB12: 0, calcium: 82, iron: 0.6, sodium: 7, potassium: 299, omega3: 0,
    servingDesc: "1 cup (100 g)", servingGrams: 100, category: "vegetable",
    tags: ["veg", "vegan", "gluten-free", "diabetic-friendly"],
    regions: ["pan_indian", "south_indian"],
  },
  cabbage: {
    calories: 25, protein: 1.3, fat: 0.1, carbs: 6, fiber: 2.5,
    vitA: 5, vitB12: 0, calcium: 40, iron: 0.5, sodium: 18, potassium: 170, omega3: 0,
    servingDesc: "1 cup shredded (89 g)", servingGrams: 89, category: "vegetable",
    tags: ["veg", "vegan", "jain", "gluten-free", "keto", "diabetic-friendly"],
    regions: ["universal"],
  },
  beetroot: {
    calories: 43, protein: 1.6, fat: 0.2, carbs: 10, fiber: 2.8,
    vitA: 2, vitB12: 0, calcium: 16, iron: 0.8, sodium: 78, potassium: 325, omega3: 0,
    servingDesc: "1 medium (100 g)", servingGrams: 100, category: "vegetable",
    tags: ["veg", "vegan", "gluten-free", "diabetic-friendly"],
    regions: ["universal"],
  },
  lettuce: {
    calories: 15, protein: 1.4, fat: 0.2, carbs: 2.9, fiber: 1.3,
    vitA: 370, vitB12: 0, calcium: 36, iron: 0.9, sodium: 28, potassium: 194, omega3: 0,
    servingDesc: "1 cup shredded (36 g)", servingGrams: 36, category: "vegetable",
    tags: ["veg", "vegan", "jain", "gluten-free", "keto"],
    regions: ["western", "universal"],
  },
  corn: {
    calories: 86, protein: 3.3, fat: 1.4, carbs: 19, fiber: 2.7,
    vitA: 9, vitB12: 0, calcium: 2, iron: 0.5, sodium: 15, potassium: 270, omega3: 0,
    servingDesc: "1 medium ear (100 g)", servingGrams: 100, category: "vegetable",
    tags: ["veg", "vegan", "jain", "gluten-free"],
    regions: ["universal"],
  },
  pasta: {
    calories: 131, protein: 5, fat: 1.1, carbs: 25, fiber: 1.8,
    vitA: 0, vitB12: 0, calcium: 7, iron: 1.3, sodium: 1, potassium: 44, omega3: 0,
    servingDesc: "1 cup cooked (140 g)", servingGrams: 140, category: "grain",
    tags: ["veg", "vegan"],
    regions: ["western", "mediterranean"],
  },
  couscous: {
    calories: 112, protein: 3.8, fat: 0.2, carbs: 23, fiber: 1.4,
    vitA: 0, vitB12: 0, calcium: 8, iron: 0.4, sodium: 5, potassium: 58, omega3: 0,
    servingDesc: "1 cup cooked (157 g)", servingGrams: 157, category: "grain",
    tags: ["veg", "vegan"],
    regions: ["mediterranean"],
  },
  tortilla: {
    calories: 218, protein: 5.7, fat: 4.8, carbs: 36, fiber: 2.4,
    vitA: 0, vitB12: 0, calcium: 45, iron: 2.2, sodium: 380, potassium: 80, omega3: 0,
    servingDesc: "1 medium (45 g)", servingGrams: 45, category: "grain",
    tags: ["veg", "vegan"],
    regions: ["western"],
  },
  "black beans": {
    calories: 132, protein: 8.9, fat: 0.5, carbs: 24, fiber: 8.7,
    vitA: 0, vitB12: 0, calcium: 27, iron: 2.1, sodium: 1, potassium: 355, omega3: 0,
    servingDesc: "1 cup cooked (172 g)", servingGrams: 172, category: "legume",
    tags: ["veg", "vegan", "jain", "gluten-free", "high-protein", "diabetic-friendly"],
    regions: ["western"],
  },
  "masoor dal": {
    calories: 116, protein: 9, fat: 0.4, carbs: 20, fiber: 7.9,
    vitA: 1, vitB12: 0, calcium: 19, iron: 3.3, sodium: 2, potassium: 369, omega3: 0,
    servingDesc: "1 cup cooked (200 g)", servingGrams: 200, category: "legume",
    tags: ["veg", "vegan", "gluten-free", "high-protein", "diabetic-friendly"],
    regions: ["pan_indian", "north_indian"],
  },
  hummus: {
    calories: 166, protein: 7.9, fat: 9.6, carbs: 14, fiber: 6,
    vitA: 0, vitB12: 0, calcium: 38, iron: 2.4, sodium: 379, potassium: 228, omega3: 0,
    servingDesc: "1/3 cup (80 g)", servingGrams: 80, category: "prepared",
    tags: ["veg", "vegan", "gluten-free"],
    regions: ["mediterranean", "western"],
  },
  cod: {
    calories: 82, protein: 18, fat: 0.7, carbs: 0, fiber: 0,
    vitA: 12, vitB12: 0.9, calcium: 16, iron: 0.4, sodium: 54, potassium: 413, omega3: 158,
    servingDesc: "100 g fillet", servingGrams: 100, category: "protein",
    tags: ["non-veg", "gluten-free", "high-protein", "low-sodium", "heart-healthy"],
    regions: ["western", "mediterranean"],
  },
  prawns: {
    calories: 99, protein: 24, fat: 0.3, carbs: 0.2, fiber: 0,
    vitA: 54, vitB12: 1.1, calcium: 70, iron: 0.5, sodium: 111, potassium: 259, omega3: 540,
    servingDesc: "100 g", servingGrams: 100, category: "protein",
    tags: ["non-veg", "gluten-free", "high-protein", "low-sodium"],
    regions: ["south_indian", "pan_indian", "asian"],
  },
  "cocoa powder": {
    calories: 228, protein: 20, fat: 14, carbs: 58, fiber: 33,
    vitA: 0, vitB12: 0, calcium: 128, iron: 13.9, sodium: 21, potassium: 1524, omega3: 0,
    servingDesc: "1 tbsp (5 g)", servingGrams: 5, category: "superfood",
    tags: ["veg", "vegan", "gluten-free"],
    regions: ["universal"],
  },
  cashew: {
    calories: 553, protein: 18, fat: 44, carbs: 30, fiber: 3.3,
    vitA: 0, vitB12: 0, calcium: 37, iron: 6.7, sodium: 12, potassium: 660, omega3: 62,
    servingDesc: "10 pieces (15 g)", servingGrams: 15, category: "nut_seed",
    tags: ["veg", "vegan", "jain", "gluten-free"],
    regions: ["pan_indian", "universal"],
  },
  sabudana: {
    calories: 332, protein: 0.2, fat: 0.02, carbs: 83, fiber: 0.9,
    vitA: 0, vitB12: 0, calcium: 20, iron: 1.6, sodium: 1, potassium: 11, omega3: 0,
    servingDesc: "1 cup (100 g)", servingGrams: 100, category: "grain",
    tags: ["veg", "vegan", "jain", "gluten-free"],
    regions: ["pan_indian", "north_indian"],
  },
  watermelon: {
    calories: 30, protein: 0.6, fat: 0.2, carbs: 8, fiber: 0.4,
    vitA: 28, vitB12: 0, calcium: 7, iron: 0.2, sodium: 1, potassium: 112, omega3: 0,
    servingDesc: "1 cup diced (152 g)", servingGrams: 152, category: "fruit",
    tags: ["veg", "vegan", "jain", "gluten-free"],
    regions: ["universal"],
  },
  pineapple: {
    calories: 50, protein: 0.5, fat: 0.1, carbs: 13, fiber: 1.4,
    vitA: 3, vitB12: 0, calcium: 13, iron: 0.3, sodium: 1, potassium: 109, omega3: 0,
    servingDesc: "1 cup chunks (165 g)", servingGrams: 165, category: "fruit",
    tags: ["veg", "vegan", "jain", "gluten-free"],
    regions: ["universal"],
  },
  kiwi: {
    calories: 61, protein: 1.1, fat: 0.5, carbs: 15, fiber: 3,
    vitA: 4, vitB12: 0, calcium: 34, iron: 0.3, sodium: 3, potassium: 312, omega3: 42,
    servingDesc: "1 medium (76 g)", servingGrams: 76, category: "fruit",
    tags: ["veg", "vegan", "jain", "gluten-free"],
    regions: ["western", "universal"],
  },
  "sesame seeds": {
    calories: 573, protein: 18, fat: 50, carbs: 23, fiber: 12,
    vitA: 0, vitB12: 0, calcium: 975, iron: 14.6, sodium: 11, potassium: 468, omega3: 376,
    servingDesc: "1 tbsp (9 g)", servingGrams: 9, category: "nut_seed",
    tags: ["veg", "vegan", "jain", "gluten-free", "nut-free"],
    regions: ["pan_indian", "asian", "mediterranean"],
  },
  "coconut milk": {
    calories: 230, protein: 2.3, fat: 24, carbs: 6, fiber: 0,
    vitA: 0, vitB12: 0, calcium: 16, iron: 1.6, sodium: 15, potassium: 263, omega3: 0,
    servingDesc: "1 cup (240 ml)", servingGrams: 240, category: "beverage",
    tags: ["veg", "vegan", "gluten-free", "lactose-free", "keto"],
    regions: ["south_indian", "asian"],
  },
};

// ── Legacy calorie-only map (for backward compat with calorie-estimator) ──
export const FOOD_CALORIE_MAP: Record<string, number> = Object.fromEntries(
  Object.entries(FOOD_DATABASE).map(([k, v]) => [k, v.calories])
);

// Extend with cooking modifiers that carry zero calories
const MODIFIERS = [
  "boiled", "fried", "grilled", "baked", "roasted", "steamed",
  "raw", "cooked", "large", "small", "medium", "cup", "bowl",
  "plate", "serving",
];
for (const m of MODIFIERS) FOOD_CALORIE_MAP[m] = 0;
