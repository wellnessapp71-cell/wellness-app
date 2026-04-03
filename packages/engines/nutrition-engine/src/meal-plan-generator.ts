// ─── Structured Meal Plan Generator ────────────────────────────────────
// Generates daily meal plans with per-ingredient macro/micro breakdown,
// medical condition rules, regional cuisine support, and time-based slots.

import type {
  ActivityLevel,
  AllergyType,
  CuisineRegion,
  DailyMealPlan,
  DietType,
  Gender,
  HealthGoal,
  IngredientBreakdown,
  MealNutrientTotals,
  MealSlot,
  MedicalCondition,
  StructuredMeal,
  StructuredMealPlanRequest,
} from "@aura/types";
import { MEAL_SLOT_TIMES } from "@aura/types";
import { FOOD_DATABASE, type IngredientNutrients } from "./food-data";

// ─── BMR & Calorie Target ──────────────────────────────────────────────

function calculateBMR(gender: Gender, weightKg: number, heightCm: number, age: number): number {
  if (gender === "male") {
    return 10 * weightKg + 6.25 * heightCm - 5 * age + 5;
  }
  return 10 * weightKg + 6.25 * heightCm - 5 * age - 161;
}

const ACTIVITY_MULTIPLIERS: Record<string, number> = {
  sedentary: 1.2,
  light: 1.375,
  moderate: 1.55,
  active: 1.725,
  lightly_active: 1.375,
  very_active: 1.725,
};

function getCalorieTarget(
  gender: Gender,
  weightKg: number,
  heightCm: number,
  age: number,
  activityLevel: string,
  healthGoal: HealthGoal,
): number {
  const bmr = calculateBMR(gender, weightKg, heightCm, age);
  const tdee = bmr * (ACTIVITY_MULTIPLIERS[activityLevel] ?? 1.55);
  switch (healthGoal) {
    case "weight_loss": return Math.round(tdee - 500);
    case "weight_gain": return Math.round(tdee + 400);
    case "muscle_gain": return Math.round(tdee + 300);
    case "maintenance":
    default: return Math.round(tdee);
  }
}

// ─── Macro Split by Goal ───────────────────────────────────────────────

interface MacroSplit { proteinPct: number; carbsPct: number; fatPct: number; }

function getMacroSplit(goal: HealthGoal, diet: DietType): MacroSplit {
  if (diet === "keto") return { proteinPct: 25, carbsPct: 5, fatPct: 70 };
  switch (goal) {
    case "weight_loss": return { proteinPct: 35, carbsPct: 35, fatPct: 30 };
    case "muscle_gain": return { proteinPct: 40, carbsPct: 35, fatPct: 25 };
    case "weight_gain": return { proteinPct: 25, carbsPct: 50, fatPct: 25 };
    case "maintenance":
    default: return { proteinPct: 30, carbsPct: 40, fatPct: 30 };
  }
}

// ─── Calorie Distribution Across 4 Meals ───────────────────────────────

const MEAL_CALORIE_SHARE: Record<MealSlot, number> = {
  breakfast: 0.25,
  lunch: 0.35,
  snacks: 0.15,
  dinner: 0.25,
};

// ─── Medical Condition Diet Rules ──────────────────────────────────────

interface DietRule {
  avoid: string[];
  prefer: string[];
  note: string;
  maxSodium?: number;
  maxSugar?: boolean;
  highFiber?: boolean;
  highProtein?: boolean;
  lowFat?: boolean;
}

const CONDITION_RULES: Record<MedicalCondition, DietRule> = {
  diabetes: {
    avoid: ["sugar", "jaggery", "honey", "white rice", "mango", "grape", "banana"],
    prefer: ["oats", "ragi", "bitter gourd", "fenugreek", "flax seeds", "barley"],
    note: "Low glycemic index foods preferred. Avoid refined carbs and added sugars.",
    maxSugar: true,
    highFiber: true,
  },
  hypertension: {
    avoid: ["pickle", "papad", "chips", "processed foods"],
    prefer: ["banana", "spinach", "sweet potato", "beetroot", "garlic", "flax seeds"],
    note: "Low sodium diet. Rich in potassium and magnesium.",
    maxSodium: 1500,
  },
  cardiovascular: {
    avoid: ["butter", "ghee", "red meat", "fried foods", "coconut oil"],
    prefer: ["salmon", "walnuts", "flax seeds", "oats", "olive oil", "avocado"],
    note: "Heart-healthy fats, omega-3 rich. Avoid trans fats and saturated fats.",
    lowFat: true,
  },
  thyroid: {
    avoid: ["soy", "cabbage", "cauliflower", "broccoli", "kale"],
    prefer: ["eggs", "fish", "dairy", "brazil nuts", "pumpkin seeds"],
    note: "Avoid goitrogens. Ensure adequate iodine and selenium intake.",
  },
  pcod_pcos: {
    avoid: ["sugar", "white rice", "maida", "processed foods"],
    prefer: ["flax seeds", "cinnamon", "turmeric", "green leafy vegetables", "berries"],
    note: "Anti-inflammatory foods. Low glycemic, high fiber diet.",
    maxSugar: true,
    highFiber: true,
  },
  fatty_liver: {
    avoid: ["alcohol", "sugar", "white bread", "fried foods", "red meat"],
    prefer: ["oats", "walnuts", "green tea", "garlic", "olive oil", "beetroot"],
    note: "Low fat, high fiber. Avoid processed and fried foods.",
    lowFat: true,
    highFiber: true,
  },
  obesity: {
    avoid: ["sugar", "fried foods", "white bread", "soft drinks", "sweets"],
    prefer: ["high-fiber vegetables", "lean protein", "whole grains", "chia seeds"],
    note: "Calorie-controlled, high protein, high fiber for satiety.",
    highProtein: true,
    highFiber: true,
  },
  kidney_disorder: {
    avoid: ["banana", "tomato", "spinach", "potato", "chocolate"],
    prefer: ["rice", "apple", "cabbage", "bell pepper", "cranberry"],
    note: "Low potassium, low phosphorus. Moderate protein intake.",
  },
  liver_disorder: {
    avoid: ["alcohol", "fried foods", "processed meat", "excess salt"],
    prefer: ["oats", "garlic", "green tea", "beetroot", "turmeric", "lemon"],
    note: "Easy-to-digest foods. Low fat, moderate protein.",
    lowFat: true,
  },
  poor_gut_health: {
    avoid: ["spicy foods", "fried foods", "caffeine", "carbonated drinks"],
    prefer: ["yogurt", "banana", "oats", "ginger", "papaya", "fennel"],
    note: "Probiotic-rich foods, easily digestible. Avoid irritants.",
    highFiber: true,
  },
  cancer_support: {
    avoid: ["processed meat", "alcohol", "sugar", "refined flour"],
    prefer: ["turmeric", "broccoli", "berries", "green tea", "garlic", "spinach"],
    note: "Antioxidant-rich, anti-inflammatory foods. High in vitamins and minerals.",
    highProtein: true,
  },
  post_surgery: {
    avoid: ["spicy foods", "fried foods", "alcohol", "caffeine"],
    prefer: ["eggs", "chicken", "fish", "dairy", "fruits", "vegetables"],
    note: "High protein for tissue repair. Vitamin C and zinc for wound healing.",
    highProtein: true,
  },
};

// ─── Allergy Filtering ─────────────────────────────────────────────────

const ALLERGY_TAG_MAP: Record<AllergyType, string[]> = {
  gluten: ["wheat", "barley", "rye", "maida", "bread", "roti", "chapati", "pasta", "naan"],
  lactose: ["milk", "paneer", "cheese", "curd", "yogurt", "whey", "ghee", "butter"],
  nuts: ["almond", "walnut", "cashew", "pistachio", "peanut", "brazil nut"],
  soy: ["soy", "tofu", "soy milk", "edamame"],
  eggs: ["egg", "eggs"],
  shellfish: ["shrimp", "prawn", "crab", "lobster"],
  fish: ["salmon", "tuna", "sardine", "mackerel", "fish"],
};

function isAllergenic(ingredientKey: string, allergies: AllergyType[]): boolean {
  for (const allergy of allergies) {
    const banned = ALLERGY_TAG_MAP[allergy] ?? [];
    if (banned.some((b) => ingredientKey.includes(b))) return true;
  }
  return false;
}

// ─── Diet Filtering ────────────────────────────────────────────────────

function matchesDiet(item: IngredientNutrients, diet: DietType): boolean {
  if (diet === "veg" || diet === "vegan") {
    if (item.tags.includes("non-veg")) return false;
    if (diet === "vegan" && (item.category === "dairy")) return false;
  }
  if (diet === "jain") {
    if (item.tags.includes("non-veg")) return false;
    // Jain: no root vegetables
    const jainAvoid = ["onion", "garlic", "potato", "carrot", "beetroot", "radish", "ginger"];
    return true; // We'll check by key in the caller
  }
  return true;
}

const JAIN_AVOID_ROOTS = ["onion", "garlic", "potato", "carrot", "beetroot", "radish", "ginger", "turnip"];

// ─── Regional Cuisine Meal Templates ───────────────────────────────────

interface MealTemplate {
  dishName: string;
  ingredientKeys: string[];
  servings: number[];
  regions: CuisineRegion[];
  slot: MealSlot;
}

const MEAL_TEMPLATES: MealTemplate[] = [
  // ══════════════════════════════════════════════════════════════════════
  // BREAKFAST — single-dish
  // ══════════════════════════════════════════════════════════════════════
  { dishName: "Masala Oats Bowl", ingredientKeys: ["oats", "onion", "tomato", "spinach", "peanut"], servings: [0.5, 0.3, 0.5, 0.3, 0.2], regions: ["pan_indian", "north_indian"], slot: "breakfast" },
  { dishName: "Poha with Peanuts", ingredientKeys: ["poha", "peanut", "onion", "lemon", "coriander"], servings: [1, 0.3, 0.3, 0.2, 0.1], regions: ["pan_indian", "north_indian"], slot: "breakfast" },
  { dishName: "Idli Sambar", ingredientKeys: ["idli", "sambar"], servings: [2, 1], regions: ["south_indian"], slot: "breakfast" },
  { dishName: "Dosa with Chutney", ingredientKeys: ["dosa", "coconut"], servings: [2, 0.3], regions: ["south_indian"], slot: "breakfast" },
  { dishName: "Moong Dal Cheela", ingredientKeys: ["moong dal", "spinach", "tomato", "curd"], servings: [0.5, 0.3, 0.3, 0.5], regions: ["north_indian", "pan_indian"], slot: "breakfast" },
  { dishName: "Greek Yogurt Parfait", ingredientKeys: ["greek yogurt", "mixed berries", "oats", "honey", "chia seeds"], servings: [1, 0.5, 0.3, 0.1, 0.1], regions: ["western", "mediterranean"], slot: "breakfast" },
  { dishName: "Upma with Vegetables", ingredientKeys: ["upma", "onion", "carrot", "peas"], servings: [1, 0.3, 0.3, 0.3], regions: ["south_indian", "pan_indian"], slot: "breakfast" },
  // ── BREAKFAST — combo meals ──
  { dishName: "Eggs, Toast & Banana with Milk", ingredientKeys: ["egg", "bread", "banana", "milk"], servings: [3, 2, 1, 1], regions: ["pan_indian", "western"], slot: "breakfast" },
  { dishName: "Oatmeal with Nuts, Dried Fruits & Milk", ingredientKeys: ["oats", "almond", "walnut", "raisin", "dates", "milk"], servings: [1, 1, 1, 0.5, 0.5, 1], regions: ["pan_indian", "western"], slot: "breakfast" },
  { dishName: "Avocado Toast with Eggs & Orange Juice", ingredientKeys: ["bread", "avocado", "egg", "orange juice"], servings: [2, 0.5, 2, 1], regions: ["western", "mediterranean"], slot: "breakfast" },
  { dishName: "Protein Smoothie with Banana & Spinach", ingredientKeys: ["whey protein", "banana", "spinach", "almond milk"], servings: [1, 1, 0.5, 1], regions: ["western", "pan_indian"], slot: "breakfast" },
  { dishName: "Whole Wheat Pancakes with Eggs & Honey", ingredientKeys: ["chapati", "egg", "honey", "milk"], servings: [2, 2, 0.2, 0.5], regions: ["western", "pan_indian"], slot: "breakfast" },
  { dishName: "Paneer Paratha with Curd & Chai", ingredientKeys: ["chapati", "paneer", "curd", "masala chai"], servings: [2, 0.5, 0.5, 1], regions: ["north_indian"], slot: "breakfast" },
  { dishName: "Idli with Sambhar & Milk", ingredientKeys: ["idli", "sambar", "coconut", "milk"], servings: [3, 1, 0.2, 1], regions: ["south_indian"], slot: "breakfast" },
  { dishName: "Ragi Porridge with Banana & Almonds", ingredientKeys: ["ragi", "milk", "banana", "almond", "honey"], servings: [0.5, 1, 1, 0.5, 0.1], regions: ["south_indian", "pan_indian"], slot: "breakfast" },
  { dishName: "Overnight Oats with Seeds & Berries", ingredientKeys: ["oats", "milk", "chia seeds", "pumpkin seeds", "mixed berries"], servings: [0.5, 0.8, 0.2, 0.2, 0.5], regions: ["western", "pan_indian"], slot: "breakfast" },
  { dishName: "Millet Porridge with Nuts & Dates", ingredientKeys: ["millet", "milk", "almond", "walnut", "dates"], servings: [0.5, 1, 0.3, 0.3, 0.3], regions: ["south_indian", "pan_indian"], slot: "breakfast" },
  { dishName: "Egg Omelette, Toast & Orange Juice", ingredientKeys: ["egg", "bread", "onion", "bell pepper", "orange juice"], servings: [3, 2, 0.3, 0.3, 1], regions: ["western", "pan_indian"], slot: "breakfast" },

  // ══════════════════════════════════════════════════════════════════════
  // LUNCH — single-dish
  // ══════════════════════════════════════════════════════════════════════
  { dishName: "Dal Rice with Sabzi", ingredientKeys: ["toor dal", "brown rice", "spinach", "ghee", "salad"], servings: [0.5, 1, 0.5, 0.1, 0.5], regions: ["north_indian", "pan_indian"], slot: "lunch" },
  { dishName: "Rajma Chawal", ingredientKeys: ["rajma", "brown rice", "onion", "tomato", "curd"], servings: [0.5, 1, 0.3, 0.3, 0.5], regions: ["north_indian"], slot: "lunch" },
  { dishName: "South Indian Thali", ingredientKeys: ["sambar", "rasam", "brown rice", "curd", "banana"], servings: [1, 1, 1, 0.5, 0.5], regions: ["south_indian"], slot: "lunch" },
  { dishName: "Chole with Brown Rice", ingredientKeys: ["chickpeas", "brown rice", "onion", "tomato", "spinach"], servings: [0.5, 1, 0.3, 0.3, 0.3], regions: ["north_indian", "pan_indian"], slot: "lunch" },
  { dishName: "Vegetable Biryani", ingredientKeys: ["biryani", "carrot", "peas", "paneer", "curd"], servings: [1, 0.3, 0.3, 0.3, 0.5], regions: ["pan_indian"], slot: "lunch" },
  { dishName: "Mediterranean Salad Bowl", ingredientKeys: ["quinoa", "chickpeas", "cucumber", "tomato", "olive oil", "lemon"], servings: [0.5, 0.3, 0.5, 0.5, 0.15, 0.2], regions: ["mediterranean", "western"], slot: "lunch" },
  { dishName: "Egg Curry with Rice", ingredientKeys: ["egg", "brown rice", "onion", "tomato", "spinach"], servings: [2, 1, 0.3, 0.3, 0.3], regions: ["pan_indian"], slot: "lunch" },
  { dishName: "Khichdi with Ghee", ingredientKeys: ["khichdi", "ghee", "curd", "papad"], servings: [1.5, 0.1, 0.5, 0.2], regions: ["pan_indian", "north_indian"], slot: "lunch" },
  // ── LUNCH — combo meals ──
  { dishName: "Grilled Chicken, Brown Rice & Mixed Veggies", ingredientKeys: ["chicken breast", "brown rice", "mixed vegetables", "salad"], servings: [1.5, 1, 0.5, 0.5], regions: ["pan_indian", "western"], slot: "lunch" },
  { dishName: "Chicken Tikka with Quinoa & Salad", ingredientKeys: ["chicken breast", "quinoa", "cucumber", "tomato", "curd", "lemon"], servings: [1.5, 0.5, 0.5, 0.5, 0.5, 0.1], regions: ["north_indian", "pan_indian"], slot: "lunch" },
  { dishName: "Fish Curry, Brown Rice & Roti", ingredientKeys: ["salmon", "brown rice", "chapati", "onion", "tomato"], servings: [1, 0.8, 1, 0.3, 0.3], regions: ["south_indian", "pan_indian"], slot: "lunch" },
  { dishName: "Lentil Soup, Roti & Greens Salad", ingredientKeys: ["toor dal", "chapati", "spinach", "cucumber", "tomato", "lemon"], servings: [0.5, 2, 0.5, 0.5, 0.5, 0.1], regions: ["north_indian", "pan_indian"], slot: "lunch" },
  { dishName: "Paneer Tikka with Roti & Raita", ingredientKeys: ["paneer", "chapati", "bell pepper", "onion", "raita"], servings: [1, 2, 0.3, 0.3, 1], regions: ["north_indian"], slot: "lunch" },
  { dishName: "Chicken Biryani with Raita", ingredientKeys: ["chicken breast", "biryani", "raita", "onion", "salad"], servings: [0.8, 1.5, 1, 0.2, 0.5], regions: ["pan_indian", "north_indian"], slot: "lunch" },
  { dishName: "Lamb Curry with Rice & Roti", ingredientKeys: ["lamb", "brown rice", "chapati", "onion", "tomato"], servings: [1, 0.8, 1, 0.3, 0.3], regions: ["north_indian", "pan_indian"], slot: "lunch" },
  { dishName: "Grilled Fish with Quinoa & Broccoli", ingredientKeys: ["salmon", "quinoa", "broccoli", "olive oil", "lemon"], servings: [1, 0.5, 0.5, 0.1, 0.1], regions: ["western", "mediterranean"], slot: "lunch" },
  { dishName: "Grilled Paneer, Brown Rice & Veggies", ingredientKeys: ["paneer", "brown rice", "mixed vegetables", "curd", "salad"], servings: [1, 1, 0.5, 0.5, 0.5], regions: ["north_indian", "pan_indian"], slot: "lunch" },
  { dishName: "Chicken Curry, Roti & Dal", ingredientKeys: ["chicken breast", "chapati", "toor dal", "onion", "tomato", "curd"], servings: [1, 2, 0.3, 0.3, 0.3, 0.5], regions: ["north_indian", "pan_indian"], slot: "lunch" },

  // ══════════════════════════════════════════════════════════════════════
  // SNACKS — single items
  // ══════════════════════════════════════════════════════════════════════
  { dishName: "Makhana (Fox Nuts)", ingredientKeys: ["makhana", "ghee"], servings: [0.3, 0.05], regions: ["north_indian", "pan_indian"], slot: "snacks" },
  { dishName: "Boiled Egg Snack", ingredientKeys: ["egg", "black pepper"], servings: [2, 0.02], regions: ["pan_indian", "western"], slot: "snacks" },
  { dishName: "Roasted Seed Mix", ingredientKeys: ["sunflower seeds", "pumpkin seeds", "flax seeds", "chia seeds"], servings: [0.15, 0.15, 0.1, 0.1], regions: ["pan_indian", "western"], slot: "snacks" },
  // ── SNACKS — combo ──
  { dishName: "Nuts & Dried Fruits Mix", ingredientKeys: ["almond", "walnut", "cashew", "raisin", "dates"], servings: [0.3, 0.2, 0.2, 0.3, 0.2], regions: ["pan_indian", "western"], slot: "snacks" },
  { dishName: "Protein Shake with Banana", ingredientKeys: ["whey protein", "banana", "milk"], servings: [1, 1, 1], regions: ["pan_indian", "western"], slot: "snacks" },
  { dishName: "Peanut Butter Toast & Banana", ingredientKeys: ["bread", "peanut butter", "banana"], servings: [1, 0.3, 1], regions: ["western", "pan_indian"], slot: "snacks" },
  { dishName: "Fruit & Yogurt Bowl", ingredientKeys: ["greek yogurt", "apple", "banana", "honey", "almond"], servings: [1, 0.5, 0.5, 0.1, 0.2], regions: ["western", "pan_indian"], slot: "snacks" },
  { dishName: "Sprout Chaat with Lemon", ingredientKeys: ["moong dal", "onion", "tomato", "lemon", "coriander"], servings: [0.3, 0.2, 0.2, 0.1, 0.05], regions: ["pan_indian", "north_indian"], slot: "snacks" },
  { dishName: "Moringa Smoothie", ingredientKeys: ["moringa powder", "banana", "milk", "honey"], servings: [0.1, 1, 0.5, 0.1], regions: ["pan_indian", "south_indian"], slot: "snacks" },
  { dishName: "Cottage Cheese & Fruit Bowl", ingredientKeys: ["cottage cheese", "apple", "walnut", "honey"], servings: [1, 0.5, 0.2, 0.1], regions: ["western"], slot: "snacks" },
  { dishName: "Trail Mix with Dates & Seeds", ingredientKeys: ["peanut", "almond", "dates", "pumpkin seeds", "raisin"], servings: [0.3, 0.2, 0.3, 0.2, 0.2], regions: ["pan_indian", "western"], slot: "snacks" },
  { dishName: "Yogurt with Berries & Seeds", ingredientKeys: ["greek yogurt", "mixed berries", "chia seeds", "honey"], servings: [1, 0.5, 0.1, 0.1], regions: ["western", "mediterranean"], slot: "snacks" },

  // ══════════════════════════════════════════════════════════════════════
  // DINNER — single-dish
  // ══════════════════════════════════════════════════════════════════════
  { dishName: "Dal Tadka with Roti", ingredientKeys: ["toor dal", "chapati", "ghee", "onion", "tomato"], servings: [0.5, 2, 0.1, 0.3, 0.3], regions: ["north_indian", "pan_indian"], slot: "dinner" },
  { dishName: "Palak Paneer with Roti", ingredientKeys: ["paneer", "spinach", "chapati", "onion", "tomato"], servings: [0.5, 0.5, 2, 0.3, 0.3], regions: ["north_indian"], slot: "dinner" },
  { dishName: "Tofu Stir Fry with Quinoa", ingredientKeys: ["tofu", "quinoa", "broccoli", "bell pepper", "soy sauce"], servings: [1, 0.5, 0.3, 0.3, 0.05], regions: ["asian", "western"], slot: "dinner" },
  { dishName: "Vegetable Khichdi", ingredientKeys: ["khichdi", "ghee", "carrot", "peas", "curd"], servings: [1.5, 0.1, 0.3, 0.3, 0.5], regions: ["pan_indian"], slot: "dinner" },
  { dishName: "Rasam Rice with Papad", ingredientKeys: ["rasam", "brown rice", "papad", "curd"], servings: [1, 1, 0.2, 0.5], regions: ["south_indian"], slot: "dinner" },
  { dishName: "Mixed Vegetable Curry with Millet Roti", ingredientKeys: ["millet", "mixed vegetables", "onion", "tomato", "curd"], servings: [0.5, 1, 0.3, 0.3, 0.5], regions: ["pan_indian", "south_indian"], slot: "dinner" },
  // ── DINNER — combo meals ──
  { dishName: "Grilled Salmon, Sweet Potato & Green Beans", ingredientKeys: ["salmon", "sweet potato", "green beans", "olive oil", "lemon"], servings: [1, 0.5, 0.5, 0.1, 0.1], regions: ["western", "mediterranean"], slot: "dinner" },
  { dishName: "Chicken Breast, Brown Rice & Broccoli", ingredientKeys: ["chicken breast", "brown rice", "broccoli", "olive oil", "salad"], servings: [1.5, 1, 0.5, 0.1, 0.3], regions: ["western", "pan_indian"], slot: "dinner" },
  { dishName: "Paneer Tikka, Quinoa & Salad", ingredientKeys: ["paneer", "quinoa", "cucumber", "tomato", "bell pepper", "lemon"], servings: [1, 0.5, 0.5, 0.5, 0.3, 0.1], regions: ["north_indian", "pan_indian"], slot: "dinner" },
  { dishName: "Lentil Curry, Roti & Mixed Veggies", ingredientKeys: ["toor dal", "chapati", "mixed vegetables", "curd", "salad"], servings: [0.5, 2, 0.5, 0.5, 0.3], regions: ["north_indian", "pan_indian"], slot: "dinner" },
  { dishName: "Grilled Chicken, Brown Rice & Carrots", ingredientKeys: ["chicken breast", "brown rice", "carrot", "olive oil", "lemon"], servings: [1.5, 1, 0.5, 0.1, 0.1], regions: ["western", "pan_indian"], slot: "dinner" },
  { dishName: "Lamb Curry, Brown Rice & Roti", ingredientKeys: ["lamb", "brown rice", "chapati", "onion", "tomato", "curd"], servings: [1, 0.8, 1, 0.3, 0.3, 0.5], regions: ["north_indian", "pan_indian"], slot: "dinner" },
  { dishName: "Fish Curry, Quinoa & Mixed Veggies", ingredientKeys: ["salmon", "quinoa", "mixed vegetables", "coconut", "tomato"], servings: [1, 0.5, 0.5, 0.2, 0.3], regions: ["south_indian", "western"], slot: "dinner" },
  { dishName: "Egg Bhurji with Roti & Salad", ingredientKeys: ["egg", "chapati", "onion", "tomato", "bell pepper", "salad"], servings: [3, 2, 0.3, 0.3, 0.3, 0.5], regions: ["north_indian", "pan_indian"], slot: "dinner" },
  { dishName: "Salmon with Steamed Vegetables & Quinoa", ingredientKeys: ["salmon", "broccoli", "sweet potato", "quinoa", "olive oil"], servings: [1, 0.5, 0.5, 0.3, 0.1], regions: ["western", "mediterranean"], slot: "dinner" },
  { dishName: "Chicken Curry, Roti & Raita", ingredientKeys: ["chicken breast", "chapati", "onion", "tomato", "raita"], servings: [1, 2, 0.3, 0.3, 1], regions: ["north_indian", "pan_indian"], slot: "dinner" },

  // ══════════════════════════════════════════════════════════════════════
  // EXPANDED TEMPLATES — 106 new meals
  // ══════════════════════════════════════════════════════════════════════

  // ── BREAKFAST — expanded single & combo (30) ──────────────────────────

  { dishName: "Aloo Paratha with Curd & Ghee", ingredientKeys: ["paratha", "potato", "curd", "ghee"], servings: [2, 0.5, 0.5, 0.2], regions: ["north_indian"], slot: "breakfast" },
  { dishName: "Scrambled Eggs with Toast & Juice", ingredientKeys: ["egg", "bread", "bell pepper", "onion", "orange juice"], servings: [3, 2, 0.3, 0.2, 1], regions: ["western", "pan_indian"], slot: "breakfast" },
  { dishName: "French Toast with Berries & Honey", ingredientKeys: ["bread", "egg", "milk", "mixed berries", "honey"], servings: [2, 2, 0.3, 0.5, 0.1], regions: ["western"], slot: "breakfast" },
  { dishName: "Chia Pudding with Mango & Almonds", ingredientKeys: ["chia seeds", "almond milk", "mango", "almond", "honey"], servings: [0.3, 1, 0.5, 0.5, 0.1], regions: ["western", "pan_indian"], slot: "breakfast" },
  { dishName: "Smoothie Bowl with Berries & Oats", ingredientKeys: ["banana", "mixed berries", "greek yogurt", "oats", "honey"], servings: [1, 0.5, 1, 0.3, 0.1], regions: ["western"], slot: "breakfast" },
  { dishName: "Masala Dosa with Sambar & Coconut", ingredientKeys: ["dosa", "potato", "sambar", "coconut"], servings: [2, 0.5, 1, 0.3], regions: ["south_indian"], slot: "breakfast" },
  { dishName: "Poha with Sprouts & Lemon", ingredientKeys: ["poha", "sprouts", "onion", "lemon", "coriander"], servings: [1, 0.3, 0.3, 0.2, 0.1], regions: ["pan_indian"], slot: "breakfast" },
  { dishName: "Sabudana Khichdi with Peanuts & Curd", ingredientKeys: ["sabudana", "peanut", "potato", "curd"], servings: [0.5, 0.3, 0.3, 0.5], regions: ["pan_indian", "north_indian"], slot: "breakfast" },
  { dishName: "Mushroom Omelette with Toast & Milk", ingredientKeys: ["egg", "mushroom", "bread", "milk"], servings: [3, 1, 2, 0.5], regions: ["western", "pan_indian"], slot: "breakfast" },
  { dishName: "Banana Oat Pancakes with Honey", ingredientKeys: ["banana", "oats", "egg", "honey", "milk"], servings: [1, 0.5, 2, 0.15, 0.3], regions: ["western", "pan_indian"], slot: "breakfast" },
  { dishName: "Tofu Scramble with Veggies & Toast", ingredientKeys: ["tofu", "bell pepper", "onion", "spinach", "bread"], servings: [1, 0.3, 0.3, 0.5, 2], regions: ["western", "asian"], slot: "breakfast" },
  { dishName: "Fruit Salad with Yogurt & Honey", ingredientKeys: ["banana", "apple", "papaya", "yogurt", "honey"], servings: [0.5, 0.5, 0.5, 1, 0.1], regions: ["pan_indian", "western"], slot: "breakfast" },
  { dishName: "Egg Fried Rice with Veggies", ingredientKeys: ["egg", "rice", "carrot", "peas", "soy sauce"], servings: [2, 0.8, 0.3, 0.3, 0.1], regions: ["asian", "pan_indian"], slot: "breakfast" },
  { dishName: "Quinoa Breakfast Bowl with Almonds", ingredientKeys: ["quinoa", "almond", "banana", "milk", "honey"], servings: [0.5, 0.5, 1, 0.5, 0.1], regions: ["western"], slot: "breakfast" },
  { dishName: "Ragi Dosa with Sambar & Curd", ingredientKeys: ["ragi", "coconut", "sambar", "curd"], servings: [0.3, 0.2, 1, 0.5], regions: ["south_indian"], slot: "breakfast" },
  { dishName: "Cottage Cheese Pancakes with Berries", ingredientKeys: ["cottage cheese", "oats", "egg", "mixed berries", "honey"], servings: [1, 0.3, 2, 0.5, 0.1], regions: ["western"], slot: "breakfast" },
  { dishName: "Veggie Paratha with Yogurt", ingredientKeys: ["paratha", "mixed vegetables", "yogurt"], servings: [2, 0.5, 1], regions: ["north_indian", "pan_indian"], slot: "breakfast" },
  { dishName: "Shakshuka (Eggs in Tomato)", ingredientKeys: ["egg", "tomato", "bell pepper", "onion", "olive oil"], servings: [3, 1, 0.3, 0.3, 0.1], regions: ["mediterranean", "western"], slot: "breakfast" },
  { dishName: "Spinach Egg Wrap with Cheese", ingredientKeys: ["chapati", "egg", "spinach", "cheese"], servings: [2, 2, 0.5, 0.5], regions: ["western", "pan_indian"], slot: "breakfast" },
  { dishName: "Sweet Potato & Egg Hash", ingredientKeys: ["sweet potato", "egg", "bell pepper", "onion"], servings: [0.5, 2, 0.3, 0.3], regions: ["western"], slot: "breakfast" },
  { dishName: "Chia Smoothie with Banana & Walnuts", ingredientKeys: ["chia seeds", "banana", "almond milk", "walnut", "honey"], servings: [0.2, 1, 1, 0.3, 0.1], regions: ["western", "pan_indian"], slot: "breakfast" },
  { dishName: "Cauliflower Poha with Peanuts", ingredientKeys: ["cauliflower", "peanut", "onion", "lemon", "coriander"], servings: [1, 0.3, 0.3, 0.2, 0.1], regions: ["pan_indian"], slot: "breakfast" },
  { dishName: "Muesli with Fruits & Milk", ingredientKeys: ["oats", "raisin", "almond", "apple", "milk"], servings: [0.5, 0.3, 0.5, 0.3, 1], regions: ["western", "pan_indian"], slot: "breakfast" },
  { dishName: "Vegetable Upma with Corn", ingredientKeys: ["upma", "corn", "peas", "onion"], servings: [1, 0.3, 0.3, 0.2], regions: ["south_indian", "pan_indian"], slot: "breakfast" },
  { dishName: "Avocado Smoothie with Spinach", ingredientKeys: ["avocado", "banana", "spinach", "almond milk", "honey"], servings: [0.5, 1, 0.5, 1, 0.1], regions: ["western"], slot: "breakfast" },
  { dishName: "Beetroot Paratha with Curd", ingredientKeys: ["chapati", "beetroot", "curd", "onion"], servings: [2, 0.5, 0.5, 0.2], regions: ["north_indian", "pan_indian"], slot: "breakfast" },
  { dishName: "Oats with Peanut Butter & Banana", ingredientKeys: ["oats", "peanut butter", "banana", "milk"], servings: [0.5, 0.5, 1, 0.5], regions: ["western", "pan_indian"], slot: "breakfast" },
  { dishName: "Masala Omelette with Paratha & Chai", ingredientKeys: ["egg", "paratha", "onion", "tomato", "masala chai"], servings: [3, 2, 0.3, 0.3, 1], regions: ["north_indian", "pan_indian"], slot: "breakfast" },
  { dishName: "Pineapple Smoothie with Greek Yogurt", ingredientKeys: ["pineapple", "greek yogurt", "banana", "honey"], servings: [0.5, 1, 0.5, 0.1], regions: ["western", "pan_indian"], slot: "breakfast" },
  { dishName: "Moong Dal Dosa with Coconut Chutney", ingredientKeys: ["moong dal", "coconut", "onion", "coriander"], servings: [0.5, 0.3, 0.2, 0.1], regions: ["south_indian", "pan_indian"], slot: "breakfast" },

  // ── LUNCH — expanded single & combo (30) ──────────────────────────────

  { dishName: "Aloo Gobi with Roti", ingredientKeys: ["potato", "cauliflower", "chapati", "onion", "tomato"], servings: [0.5, 0.5, 2, 0.3, 0.3], regions: ["north_indian", "pan_indian"], slot: "lunch" },
  { dishName: "Mushroom Masala with Brown Rice", ingredientKeys: ["mushroom", "brown rice", "onion", "tomato", "peas"], servings: [1.5, 1, 0.3, 0.3, 0.3], regions: ["pan_indian", "western"], slot: "lunch" },
  { dishName: "Prawn Curry with Brown Rice", ingredientKeys: ["prawns", "brown rice", "coconut", "onion", "tomato"], servings: [1.5, 1, 0.2, 0.3, 0.3], regions: ["south_indian", "pan_indian"], slot: "lunch" },
  { dishName: "Baingan Bharta with Roti & Curd", ingredientKeys: ["eggplant", "chapati", "onion", "tomato", "curd"], servings: [1.5, 2, 0.3, 0.3, 0.5], regions: ["north_indian", "pan_indian"], slot: "lunch" },
  { dishName: "Turkey Sandwich with Salad", ingredientKeys: ["turkey", "bread", "lettuce", "tomato", "cucumber"], servings: [1, 3, 1, 0.5, 0.3], regions: ["western"], slot: "lunch" },
  { dishName: "Chicken Wrap with Veggies", ingredientKeys: ["chicken breast", "tortilla", "lettuce", "tomato", "cucumber"], servings: [1, 2, 1, 0.5, 0.3], regions: ["western"], slot: "lunch" },
  { dishName: "Pasta with Vegetables & Olive Oil", ingredientKeys: ["pasta", "tomato", "bell pepper", "mushroom", "olive oil"], servings: [1.5, 0.5, 0.3, 1, 0.1], regions: ["western", "mediterranean"], slot: "lunch" },
  { dishName: "Tofu Rice Bowl with Stir Fry Veggies", ingredientKeys: ["tofu", "rice", "bell pepper", "carrot", "soy sauce"], servings: [1, 1, 0.3, 0.3, 0.1], regions: ["asian"], slot: "lunch" },
  { dishName: "Falafel Bowl with Hummus & Quinoa", ingredientKeys: ["chickpeas", "quinoa", "cucumber", "tomato", "hummus"], servings: [0.5, 0.5, 0.5, 0.5, 0.5], regions: ["mediterranean"], slot: "lunch" },
  { dishName: "Tuna Salad Sandwich", ingredientKeys: ["tuna", "bread", "lettuce", "cucumber", "tomato"], servings: [1, 3, 1, 0.3, 0.5], regions: ["western"], slot: "lunch" },
  { dishName: "Kadai Paneer with Naan", ingredientKeys: ["paneer", "naan", "bell pepper", "onion", "tomato"], servings: [1, 1.5, 0.3, 0.3, 0.3], regions: ["north_indian"], slot: "lunch" },
  { dishName: "Curd Rice with Salad", ingredientKeys: ["rice", "curd", "carrot", "cucumber", "coriander"], servings: [1, 1, 0.3, 0.3, 0.1], regions: ["south_indian", "pan_indian"], slot: "lunch" },
  { dishName: "Chicken Shawarma Bowl with Quinoa", ingredientKeys: ["chicken breast", "quinoa", "cucumber", "tomato", "yogurt"], servings: [1.5, 0.5, 0.5, 0.5, 0.5], regions: ["mediterranean", "western"], slot: "lunch" },
  { dishName: "Mixed Dal with Roti & Salad", ingredientKeys: ["toor dal", "moong dal", "chapati", "salad"], servings: [0.3, 0.3, 2, 0.5], regions: ["north_indian", "pan_indian"], slot: "lunch" },
  { dishName: "Bhindi Masala with Brown Rice", ingredientKeys: ["okra", "brown rice", "onion", "tomato"], servings: [1, 1, 0.3, 0.3], regions: ["north_indian", "pan_indian"], slot: "lunch" },
  { dishName: "Grilled Turkey with Quinoa & Broccoli", ingredientKeys: ["turkey", "quinoa", "broccoli", "carrot", "olive oil"], servings: [1.5, 0.5, 0.5, 0.3, 0.1], regions: ["western"], slot: "lunch" },
  { dishName: "Palak Dal with Brown Rice & Ghee", ingredientKeys: ["toor dal", "spinach", "brown rice", "ghee", "onion"], servings: [0.3, 0.5, 1, 0.1, 0.3], regions: ["north_indian", "pan_indian"], slot: "lunch" },
  { dishName: "Shrimp Stir Fry with Brown Rice", ingredientKeys: ["shrimp", "brown rice", "bell pepper", "carrot", "soy sauce"], servings: [1.5, 1, 0.3, 0.3, 0.1], regions: ["asian", "western"], slot: "lunch" },
  { dishName: "Black Bean Burrito Bowl", ingredientKeys: ["black beans", "rice", "bell pepper", "tomato", "avocado"], servings: [0.5, 1, 0.3, 0.5, 0.3], regions: ["western"], slot: "lunch" },
  { dishName: "Paneer Bhurji with Paratha", ingredientKeys: ["paneer", "paratha", "onion", "tomato", "bell pepper"], servings: [1, 2, 0.3, 0.3, 0.3], regions: ["north_indian"], slot: "lunch" },
  { dishName: "Masoor Dal with Roti & Salad", ingredientKeys: ["masoor dal", "chapati", "onion", "tomato", "salad"], servings: [0.5, 2, 0.3, 0.3, 0.5], regions: ["north_indian", "pan_indian"], slot: "lunch" },
  { dishName: "Stuffed Bell Pepper with Quinoa & Paneer", ingredientKeys: ["bell pepper", "quinoa", "paneer", "onion", "tomato"], servings: [1, 0.5, 0.5, 0.3, 0.3], regions: ["pan_indian", "western"], slot: "lunch" },
  { dishName: "Salmon Poke Bowl", ingredientKeys: ["salmon", "rice", "avocado", "cucumber", "soy sauce"], servings: [1, 1, 0.3, 0.5, 0.1], regions: ["asian", "western"], slot: "lunch" },
  { dishName: "Cauliflower Rice Stir Fry with Egg", ingredientKeys: ["cauliflower", "egg", "carrot", "peas", "soy sauce"], servings: [1.5, 2, 0.3, 0.3, 0.1], regions: ["western", "asian"], slot: "lunch" },
  { dishName: "Egg Biryani with Raita", ingredientKeys: ["egg", "biryani", "raita", "onion"], servings: [2, 1.5, 1, 0.2], regions: ["pan_indian"], slot: "lunch" },
  { dishName: "Grilled Chicken Salad with Olive Oil", ingredientKeys: ["chicken breast", "salad", "cucumber", "tomato", "olive oil"], servings: [1.5, 1, 0.5, 0.5, 0.1], regions: ["western", "mediterranean"], slot: "lunch" },
  { dishName: "Cabbage & Peas Curry with Roti", ingredientKeys: ["cabbage", "peas", "chapati", "onion", "tomato"], servings: [1, 0.5, 2, 0.3, 0.3], regions: ["north_indian", "pan_indian"], slot: "lunch" },
  { dishName: "Cod Fish with Couscous & Veggies", ingredientKeys: ["cod", "couscous", "tomato", "cucumber", "olive oil"], servings: [1.5, 1, 0.5, 0.5, 0.1], regions: ["mediterranean", "western"], slot: "lunch" },
  { dishName: "Mushroom & Spinach Wrap", ingredientKeys: ["mushroom", "tortilla", "spinach", "cheese", "onion"], servings: [1.5, 2, 0.5, 0.5, 0.2], regions: ["western"], slot: "lunch" },
  { dishName: "Rajma Rice with Salad & Curd", ingredientKeys: ["rajma", "brown rice", "salad", "curd"], servings: [0.5, 1, 0.5, 0.5], regions: ["north_indian"], slot: "lunch" },

  // ── SNACKS — expanded (20) ────────────────────────────────────────────

  { dishName: "Hummus with Cucumber Sticks", ingredientKeys: ["hummus", "cucumber"], servings: [0.5, 1], regions: ["mediterranean", "western"], slot: "snacks" },
  { dishName: "Roasted Chickpeas with Spices", ingredientKeys: ["chickpeas", "olive oil", "black pepper"], servings: [0.3, 0.05, 0.1], regions: ["pan_indian", "mediterranean"], slot: "snacks" },
  { dishName: "Masala Corn Cup", ingredientKeys: ["corn", "lemon", "black pepper"], servings: [1, 0.2, 0.05], regions: ["pan_indian"], slot: "snacks" },
  { dishName: "Fruit Chaat with Lemon & Pepper", ingredientKeys: ["apple", "banana", "pomegranate", "lemon", "black pepper"], servings: [0.3, 0.5, 0.5, 0.2, 0.03], regions: ["pan_indian", "north_indian"], slot: "snacks" },
  { dishName: "Paneer Tikka Bites", ingredientKeys: ["paneer", "bell pepper", "onion"], servings: [0.5, 0.3, 0.2], regions: ["north_indian", "pan_indian"], slot: "snacks" },
  { dishName: "Oats Energy Balls", ingredientKeys: ["oats", "peanut butter", "honey", "chia seeds"], servings: [0.3, 0.3, 0.15, 0.1], regions: ["western", "pan_indian"], slot: "snacks" },
  { dishName: "Sweet Potato Wedges", ingredientKeys: ["sweet potato", "olive oil", "black pepper"], servings: [0.5, 0.05, 0.03], regions: ["western", "pan_indian"], slot: "snacks" },
  { dishName: "Makhana & Peanut Trail Mix", ingredientKeys: ["makhana", "peanut", "raisin", "dates"], servings: [0.5, 0.3, 0.2, 0.3], regions: ["pan_indian", "north_indian"], slot: "snacks" },
  { dishName: "Banana Almond Smoothie", ingredientKeys: ["banana", "almond", "milk", "honey"], servings: [1, 0.5, 0.5, 0.1], regions: ["pan_indian", "western"], slot: "snacks" },
  { dishName: "Guava with Lemon & Pepper", ingredientKeys: ["guava", "lemon", "black pepper"], servings: [1, 0.2, 0.03], regions: ["pan_indian"], slot: "snacks" },
  { dishName: "Chickpea Salad with Lemon", ingredientKeys: ["chickpeas", "cucumber", "tomato", "lemon", "onion"], servings: [0.3, 0.5, 0.5, 0.2, 0.2], regions: ["pan_indian", "mediterranean"], slot: "snacks" },
  { dishName: "Protein Oat Bites", ingredientKeys: ["oats", "whey protein", "peanut butter", "honey"], servings: [0.3, 0.5, 0.3, 0.1], regions: ["western", "pan_indian"], slot: "snacks" },
  { dishName: "Avocado Egg Toast", ingredientKeys: ["bread", "avocado", "egg"], servings: [2, 0.5, 1], regions: ["western", "mediterranean"], slot: "snacks" },
  { dishName: "Mixed Fruit Smoothie", ingredientKeys: ["banana", "mango", "yogurt", "honey"], servings: [0.5, 0.5, 0.5, 0.1], regions: ["pan_indian", "western"], slot: "snacks" },
  { dishName: "Green Smoothie Bowl", ingredientKeys: ["spinach", "banana", "almond milk", "chia seeds"], servings: [0.5, 1, 1, 0.15], regions: ["western"], slot: "snacks" },
  { dishName: "Watermelon & Cheese Bites", ingredientKeys: ["watermelon", "cheese", "lemon"], servings: [1, 0.3, 0.1], regions: ["western", "mediterranean"], slot: "snacks" },
  { dishName: "Kiwi Yogurt Cup", ingredientKeys: ["kiwi", "greek yogurt", "honey"], servings: [1, 1, 0.1], regions: ["western"], slot: "snacks" },
  { dishName: "Pineapple & Cottage Cheese Bowl", ingredientKeys: ["pineapple", "cottage cheese", "honey"], servings: [0.5, 1, 0.1], regions: ["western"], slot: "snacks" },
  { dishName: "Sesame Seed Ladoo", ingredientKeys: ["sesame seeds", "jaggery", "peanut"], servings: [0.5, 0.3, 0.2], regions: ["pan_indian"], slot: "snacks" },
  { dishName: "Beetroot & Carrot Juice", ingredientKeys: ["beetroot", "carrot", "lemon"], servings: [1, 0.5, 0.2], regions: ["pan_indian", "western"], slot: "snacks" },

  // ── DINNER — expanded single & combo (26) ─────────────────────────────

  { dishName: "Mushroom Curry with Brown Rice", ingredientKeys: ["mushroom", "brown rice", "onion", "tomato", "peas"], servings: [1.5, 1, 0.3, 0.3, 0.3], regions: ["pan_indian", "western"], slot: "dinner" },
  { dishName: "Baked Cod with Sweet Potato & Beans", ingredientKeys: ["cod", "sweet potato", "green beans", "olive oil", "lemon"], servings: [1.5, 0.5, 0.5, 0.1, 0.1], regions: ["western", "mediterranean"], slot: "dinner" },
  { dishName: "Palak Dal with Brown Rice & Curd", ingredientKeys: ["toor dal", "spinach", "brown rice", "ghee", "curd"], servings: [0.3, 0.5, 1, 0.1, 0.5], regions: ["north_indian", "pan_indian"], slot: "dinner" },
  { dishName: "Cauliflower Steak with Quinoa & Salad", ingredientKeys: ["cauliflower", "quinoa", "olive oil", "lemon", "salad"], servings: [1.5, 0.5, 0.1, 0.1, 0.5], regions: ["western", "mediterranean"], slot: "dinner" },
  { dishName: "Prawn Masala with Rice & Roti", ingredientKeys: ["prawns", "rice", "chapati", "onion", "tomato"], servings: [1.5, 1, 1, 0.3, 0.3], regions: ["south_indian", "pan_indian"], slot: "dinner" },
  { dishName: "Stuffed Eggplant with Rice & Curd", ingredientKeys: ["eggplant", "rice", "onion", "tomato", "curd"], servings: [1.5, 1, 0.3, 0.3, 0.5], regions: ["pan_indian", "south_indian"], slot: "dinner" },
  { dishName: "Chicken Tikka with Naan & Raita", ingredientKeys: ["chicken breast", "naan", "raita", "onion"], servings: [1.5, 1.5, 1, 0.2], regions: ["north_indian", "pan_indian"], slot: "dinner" },
  { dishName: "Baked Sweet Potato with Black Beans & Avocado", ingredientKeys: ["sweet potato", "black beans", "avocado", "tomato"], servings: [1, 0.5, 0.3, 0.5], regions: ["western"], slot: "dinner" },
  { dishName: "Grilled Tofu with Brown Rice & Spinach", ingredientKeys: ["tofu", "brown rice", "spinach", "broccoli", "soy sauce"], servings: [1.5, 1, 0.5, 0.3, 0.1], regions: ["asian", "western"], slot: "dinner" },
  { dishName: "Mushroom & Spinach Pasta", ingredientKeys: ["mushroom", "pasta", "spinach", "cheese", "olive oil"], servings: [1.5, 1.5, 0.5, 0.3, 0.1], regions: ["western", "mediterranean"], slot: "dinner" },
  { dishName: "Kadhi Rice with Roti", ingredientKeys: ["curd", "chickpeas", "rice", "chapati"], servings: [1, 0.2, 1, 1], regions: ["north_indian", "pan_indian"], slot: "dinner" },
  { dishName: "Mixed Veg Korma with Roti & Raita", ingredientKeys: ["mixed vegetables", "chapati", "curd", "cashew", "raita"], servings: [1, 2, 0.3, 0.5, 1], regions: ["north_indian", "pan_indian"], slot: "dinner" },
  { dishName: "Butter Chicken with Rice & Naan", ingredientKeys: ["butter chicken", "rice", "naan"], servings: [1, 1, 1], regions: ["north_indian"], slot: "dinner" },
  { dishName: "Cabbage & Peas Sabzi with Roti & Dal", ingredientKeys: ["cabbage", "peas", "chapati", "toor dal", "onion"], servings: [1, 0.3, 2, 0.3, 0.3], regions: ["north_indian", "pan_indian"], slot: "dinner" },
  { dishName: "Shrimp Curry with Brown Rice & Roti", ingredientKeys: ["shrimp", "brown rice", "chapati", "onion", "tomato"], servings: [1.5, 0.8, 1, 0.3, 0.3], regions: ["south_indian", "pan_indian"], slot: "dinner" },
  { dishName: "Paneer Butter Masala with Roti & Salad", ingredientKeys: ["paneer", "chapati", "onion", "tomato", "salad", "ghee"], servings: [1, 2, 0.3, 0.3, 0.5, 0.1], regions: ["north_indian", "pan_indian"], slot: "dinner" },
  { dishName: "Mixed Dal Tadka with Rice & Papad", ingredientKeys: ["toor dal", "moong dal", "rice", "papad", "ghee"], servings: [0.3, 0.3, 1, 0.3, 0.1], regions: ["pan_indian", "north_indian"], slot: "dinner" },
  { dishName: "Baingan Bharta with Roti & Dal", ingredientKeys: ["eggplant", "chapati", "toor dal", "onion", "tomato"], servings: [1.5, 2, 0.3, 0.3, 0.3], regions: ["north_indian", "pan_indian"], slot: "dinner" },
  { dishName: "Cottage Cheese Salad with Quinoa", ingredientKeys: ["cottage cheese", "quinoa", "cucumber", "tomato", "bell pepper"], servings: [1, 0.5, 0.5, 0.5, 0.3], regions: ["western", "mediterranean"], slot: "dinner" },
  { dishName: "Grilled Lamb with Quinoa & Broccoli", ingredientKeys: ["lamb", "quinoa", "broccoli", "olive oil", "lemon"], servings: [1, 0.5, 0.5, 0.1, 0.1], regions: ["mediterranean", "pan_indian"], slot: "dinner" },
  { dishName: "Okra Masala with Rice & Roti", ingredientKeys: ["okra", "rice", "chapati", "onion", "tomato"], servings: [1, 0.8, 1, 0.3, 0.3], regions: ["north_indian", "pan_indian"], slot: "dinner" },
  { dishName: "Pasta Primavera with Vegetables", ingredientKeys: ["pasta", "bell pepper", "mushroom", "tomato", "olive oil"], servings: [1.5, 0.3, 1, 0.5, 0.1], regions: ["western", "mediterranean"], slot: "dinner" },
  { dishName: "Turkey & Vegetable Stir Fry with Rice", ingredientKeys: ["turkey", "rice", "bell pepper", "carrot", "soy sauce"], servings: [1.5, 1, 0.3, 0.3, 0.1], regions: ["western", "asian"], slot: "dinner" },
  { dishName: "Masoor Dal with Rice & Salad", ingredientKeys: ["masoor dal", "brown rice", "onion", "salad", "ghee"], servings: [0.5, 1, 0.3, 0.5, 0.1], regions: ["north_indian", "pan_indian"], slot: "dinner" },
  { dishName: "Coconut Curry with Tofu & Rice", ingredientKeys: ["tofu", "coconut milk", "rice", "bell pepper", "spinach"], servings: [1, 0.3, 1, 0.3, 0.3], regions: ["south_indian", "asian"], slot: "dinner" },
  { dishName: "Grilled Chicken with Couscous & Veggies", ingredientKeys: ["chicken breast", "couscous", "broccoli", "tomato", "olive oil"], servings: [1.5, 1, 0.5, 0.5, 0.1], regions: ["mediterranean", "western"], slot: "dinner" },
];

// ─── Ingredient Breakdown Calculator ───────────────────────────────────

function calcIngredientBreakdown(
  key: string,
  servingMultiplier: number,
): IngredientBreakdown | null {
  const data = FOOD_DATABASE[key];
  if (!data) return null;
  const grams = data.servingGrams * servingMultiplier;
  const factor = grams / 100; // nutrients are per 100g
  return {
    name: key.replace(/_/g, " "),
    servingDesc: `${Math.round(grams)}g`,
    servingGrams: Math.round(grams),
    calories: Math.round(data.calories * factor),
    protein: round1(data.protein * factor),
    fat: round1(data.fat * factor),
    carbs: round1(data.carbs * factor),
    fiber: round1(data.fiber * factor),
    vitA: round1(data.vitA * factor),
    vitB12: round1(data.vitB12 * factor),
    calcium: round1(data.calcium * factor),
    iron: round1(data.iron * factor),
    sodium: round1(data.sodium * factor),
    potassium: round1(data.potassium * factor),
    omega3: round1(data.omega3 * factor),
  };
}

function round1(n: number): number {
  return Math.round(n * 10) / 10;
}

function sumNutrients(items: Pick<MealNutrientTotals, keyof MealNutrientTotals>[]): MealNutrientTotals {
  const t: MealNutrientTotals = {
    calories: 0, protein: 0, fat: 0, carbs: 0, fiber: 0,
    vitA: 0, vitB12: 0, calcium: 0, iron: 0, sodium: 0, potassium: 0, omega3: 0,
  };
  for (const item of items) {
    t.calories += item.calories;
    t.protein += item.protein;
    t.fat += item.fat;
    t.carbs += item.carbs;
    t.fiber += item.fiber;
    t.vitA += item.vitA;
    t.vitB12 += item.vitB12;
    t.calcium += item.calcium;
    t.iron += item.iron;
    t.sodium += item.sodium;
    t.potassium += item.potassium;
    t.omega3 += item.omega3;
  }
  // Round totals
  for (const k of Object.keys(t) as (keyof MealNutrientTotals)[]) {
    t[k] = Math.round(t[k] * 10) / 10;
  }
  return t;
}

// ─── Template Filtering & Selection ────────────────────────────────────

function filterTemplates(
  slot: MealSlot,
  req: StructuredMealPlanRequest,
  conditionRules: DietRule[],
): MealTemplate[] {
  const allAvoided = new Set<string>();
  for (const rule of conditionRules) {
    for (const a of rule.avoid) allAvoided.add(a.toLowerCase());
  }

  return MEAL_TEMPLATES.filter((tpl) => {
    if (tpl.slot !== slot) return false;

    // Region match
    if (req.cuisinePreferences.length > 0) {
      const hasMatch = tpl.regions.some(
        (r) => req.cuisinePreferences.includes(r as CuisineRegion) || r === "pan_indian",
      );
      if (!hasMatch) return false;
    }

    // Check each ingredient
    for (const key of tpl.ingredientKeys) {
      // Allergy check
      if (isAllergenic(key, req.allergies)) return false;

      // Diet check
      const data = FOOD_DATABASE[key];
      if (data && !matchesDiet(data, req.dietaryPreference)) return false;

      // Jain root vegetable check
      if (req.dietaryPreference === "jain" && JAIN_AVOID_ROOTS.some((r) => key.includes(r))) return false;

      // Medical condition avoidance
      if (allAvoided.has(key)) return false;
    }

    return true;
  });
}

function pickTemplate(
  templates: MealTemplate[],
  usedIndices: Set<number>,
  seed: number,
): MealTemplate | null {
  const available = templates.filter((_, i) => !usedIndices.has(i));
  if (available.length === 0) return templates[seed % templates.length] ?? null;
  return available[seed % available.length];
}

// ─── Main Generator ────────────────────────────────────────────────────

export function generateStructuredMealPlan(
  req: StructuredMealPlanRequest,
  dateIso?: string,
): DailyMealPlan {
  const date = dateIso ?? new Date().toISOString().split("T")[0];
  const calorieTarget = getCalorieTarget(
    req.gender, req.weightKg, req.heightCm, req.age,
    req.activityLevel, req.healthGoal,
  );

  // Collect applicable condition rules
  const conditionRules: DietRule[] = req.medicalConditions
    .filter((c) => c in CONDITION_RULES)
    .map((c) => CONDITION_RULES[c]);

  const healthNotes: string[] = conditionRules.map((r) => r.note);

  // Use date hash as seed for variety
  const dateSeed = date.split("-").reduce((a, b) => a + parseInt(b, 10), 0);

  const slots: MealSlot[] = ["breakfast", "lunch", "snacks", "dinner"];
  const usedIndices = new Set<number>();
  const meals: StructuredMeal[] = [];

  for (const slot of slots) {
    const templates = filterTemplates(slot, req, conditionRules);
    const tpl = pickTemplate(templates, usedIndices, dateSeed + slots.indexOf(slot));
    if (!tpl) {
      // Fallback minimal meal
      meals.push({
        slot,
        time: MEAL_SLOT_TIMES[slot],
        dishName: "Custom Meal",
        ingredients: [],
        totals: { calories: 0, protein: 0, fat: 0, carbs: 0, fiber: 0, vitA: 0, vitB12: 0, calcium: 0, iron: 0, sodium: 0, potassium: 0, omega3: 0 },
      });
      continue;
    }

    // Mark original index as used
    const origIdx = MEAL_TEMPLATES.indexOf(tpl);
    if (origIdx >= 0) usedIndices.add(origIdx);

    // Calculate target calories for this slot and adjust servings
    const slotCalTarget = calorieTarget * MEAL_CALORIE_SHARE[slot];

    // Build ingredients
    const ingredients: IngredientBreakdown[] = [];
    for (let i = 0; i < tpl.ingredientKeys.length; i++) {
      const bd = calcIngredientBreakdown(tpl.ingredientKeys[i], tpl.servings[i]);
      if (bd) ingredients.push(bd);
    }

    // Scale ingredients to match calorie target for this slot
    const rawCal = ingredients.reduce((s, ing) => s + ing.calories, 0);
    if (rawCal > 0 && rawCal !== slotCalTarget) {
      const scale = slotCalTarget / rawCal;
      for (const ing of ingredients) {
        ing.servingGrams = Math.round(ing.servingGrams * scale);
        ing.servingDesc = `${ing.servingGrams}g`;
        ing.calories = Math.round(ing.calories * scale);
        ing.protein = round1(ing.protein * scale);
        ing.fat = round1(ing.fat * scale);
        ing.carbs = round1(ing.carbs * scale);
        ing.fiber = round1(ing.fiber * scale);
        ing.vitA = round1(ing.vitA * scale);
        ing.vitB12 = round1(ing.vitB12 * scale);
        ing.calcium = round1(ing.calcium * scale);
        ing.iron = round1(ing.iron * scale);
        ing.sodium = round1(ing.sodium * scale);
        ing.potassium = round1(ing.potassium * scale);
        ing.omega3 = round1(ing.omega3 * scale);
      }
    }

    const totals = sumNutrients(ingredients);

    meals.push({
      slot,
      time: MEAL_SLOT_TIMES[slot],
      dishName: tpl.dishName,
      ingredients,
      totals,
    });
  }

  const dailyTotals = sumNutrients(meals.map((m) => m.totals));

  // Add goal-specific notes
  const split = getMacroSplit(req.healthGoal, req.dietaryPreference);
  healthNotes.push(
    `Target: ${calorieTarget} kcal/day (P ${split.proteinPct}% · C ${split.carbsPct}% · F ${split.fatPct}%)`,
  );

  return {
    dateIso: date,
    meals,
    dailyTotals,
    calorieTarget,
    healthNotes,
  };
}

/** Get diet restriction notes for given medical conditions */
export function getMedicalDietNotes(conditions: MedicalCondition[]): string[] {
  return conditions
    .filter((c) => c in CONDITION_RULES)
    .map((c) => `${c.replace(/_/g, " ").toUpperCase()}: ${CONDITION_RULES[c].note}`);
}

/** Get default meal reminder schedule */
export function getDefaultMealReminders() {
  return [
    { slot: "breakfast" as MealSlot, time: "07:30", enabled: true },
    { slot: "lunch" as MealSlot, time: "12:30", enabled: true },
    { slot: "snacks" as MealSlot, time: "16:00", enabled: true },
    { slot: "dinner" as MealSlot, time: "20:00", enabled: true },
  ];
}
