// Local re-export of nutrition engine for reliable EAS builds.
// The packages/engines/nutrition-engine dist/ is gitignored, so we import
// the generator directly and re-export types the screens need.

export {
  generateStructuredMealPlan,
  getMedicalDietNotes,
  getDefaultMealReminders,
} from "../../../packages/engines/nutrition-engine/src/meal-plan-generator";

export { FOOD_DATABASE } from "../../../packages/engines/nutrition-engine/src/food-data";
