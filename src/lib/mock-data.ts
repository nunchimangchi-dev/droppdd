export interface Exercise {
  name: string;
  sets: number;
  reps: string | number;
  rest: string;
  notes?: string;
}

export interface Workout {
  id: string;
  title: string;
  description: string;
  duration: string; // e.g., "35 mins"
  intensity: "HIGH" | "EXtreme" | "ANARCHIC" | "MEDIUM";
  category: "METCON" | "STRENGTH" | "AMRAP" | "ENDURANCE";
  target: string; // e.g., "Full Body", "Lower Body"
  caloriesBurn: number;
  exercises: Exercise[];
}

export interface Meal {
  id: string;
  title: string;
  description: string;
  calories: number;
  protein: number; // in grams
  fat: number; // in grams
  netCarbs: number; // in grams
  category: "OMAD FEAST" | "KETO POWER" | "REFUEL";
  ingredients: string[];
  instructions: string[];
}

export interface WeightRecord {
  date: string; // e.g., "Aug 10", "Aug 11"
  weight: number; // in lbs or kgs
}

export interface ProgressData {
  currentStreak: number;
  bestStreak: number;
  weightHistory: WeightRecord[];
  targetWeight: number;
  currentWeight: number;
  startWeight: number;
}

export const mockWorkouts: Workout[] = [
  {
    id: "hellfire-metcon",
    title: "HELLFIRE METCON",
    description: "High-intensity metabolic conditioning designed to incinerate fat reserves and push VO2 max to the absolute limit. Zero rest between exercises.",
    duration: "25 MINS",
    intensity: "ANARCHIC",
    category: "METCON",
    target: "FULL BODY",
    caloriesBurn: 480,
    exercises: [
      { name: "Kettlebell Swings", sets: 4, reps: "20 reps", rest: "None" },
      { name: "Burpees over bar", sets: 4, reps: "15 reps", rest: "None" },
      { name: "Dumbbell Thrusters", sets: 4, reps: "12 reps (heavy)", rest: "None" },
      { name: "Double Unders", sets: 4, reps: "50 reps", rest: "60s rest after round" },
    ],
  },
  {
    id: "iron-apex",
    title: "IRON APEX: LOWER ENDURANCE",
    description: "High-volume barbell squat assault. Build structural integrity, thick muscle fibers, and unbreakable physical mental durability.",
    duration: "45 MINS",
    intensity: "EXtreme",
    category: "STRENGTH",
    target: "LEGS & CORE",
    caloriesBurn: 620,
    exercises: [
      { name: "Barbell Back Squats", sets: 5, reps: "8 reps @ 80% 1RM", rest: "120s" },
      { name: "Romanian Deadlifts", sets: 4, reps: "10 reps", rest: "90s" },
      { name: "Walking Lunges (Weighted)", sets: 3, reps: "24 steps total", rest: "60s" },
      { name: "Hanging Toes-To-Bar", sets: 4, reps: "Max Reps", rest: "60s" },
    ],
  },
  {
    id: "chainbreaker-amrap",
    title: "CHAINBREAKER AMRAP",
    description: "As Many Rounds As Possible. Pure willpower test. Maintain pristine form as exhaustion creeps in. Do not back down.",
    duration: "20 MINS",
    intensity: "HIGH",
    category: "AMRAP",
    target: "UPPER BODY / CARDIO",
    caloriesBurn: 410,
    exercises: [
      { name: "Handstand Pushups", sets: 1, reps: "10 reps", rest: "No rest" },
      { name: "Pull-ups (Strict)", sets: 1, reps: "12 reps", rest: "No rest" },
      { name: "Ring Dips", sets: 1, reps: "15 reps", rest: "No rest" },
      { name: "Renegade Rows", sets: 1, reps: "10 reps per side", rest: "No rest" },
    ],
  },
  {
    id: "blackout-cardio",
    title: "BLACKOUT CARDIO INTENSITY",
    description: "A ruthless high-intensity cardio endurance sprint. Keep your heart rate in Zone 4/5. Pain is just information.",
    duration: "30 MINS",
    intensity: "EXtreme",
    category: "ENDURANCE",
    target: "CARDIOVASCULAR",
    caloriesBurn: 550,
    exercises: [
      { name: "Assault Bike Sprint", sets: 6, reps: "30s Sprint / 30s Active Rest", rest: "No rest" },
      { name: "Rowing Machine", sets: 5, reps: "500m Power Sprint", rest: "90s" },
      { name: "Box Jumps (30 inch)", sets: 4, reps: "20 reps", rest: "60s" },
    ],
  },
];

export const mockMeals: Meal[] = [
  {
    id: "beast-feast",
    title: "RIBEYE BEEF & AVOCADO BOMB",
    description: "The ultimate high-fat OMAD centerpiece. Premium pasture-raised ribeye paired with rich compound butter and direct potassium source avocado.",
    calories: 1450,
    protein: 95,
    fat: 115,
    netCarbs: 4,
    category: "OMAD FEAST",
    ingredients: [
      "16oz Prime Bone-In Ribeye",
      "2 tbsp Grass-fed Kerrygold Butter",
      "1 Whole Avocado, sliced",
      "2 cups Fresh Organic Spinach",
      "1 tbsp Extra Virgin Olive Oil",
      "Coarse Pink Himalayan Salt & Black Pepper",
    ],
    instructions: [
      "Generously season ribeye with pink salt and coarse pepper 45 minutes before cooking.",
      "Sear in a white-hot cast-iron skillet for 3 minutes per side for medium-rare.",
      "Add 1 tbsp of compound butter and baste meat for 1 additional minute.",
      "Let the steak rest for 8 minutes to lock in juices.",
      "Toss spinach with olive oil and serve next to sliced avocado and the steak.",
      "Top steak with remaining butter and serve immediately.",
    ],
  },
  {
    id: "crispy-salmon-plate",
    title: "CRISPY SKIN SALMON & ASPARAGUS SPEARS",
    description: "Packed with heavy Omega-3 fatty acids, clean marine protein, and essential micronutrients. Zero-sugar garlic lemon butter glaze.",
    calories: 1120,
    protein: 78,
    fat: 88,
    netCarbs: 5,
    category: "KETO POWER",
    ingredients: [
      "12oz Wild-Caught Sockeye Salmon (Skin-on)",
      "1 bunch Fresh Organic Asparagus",
      "2 tbsp Ghee (clarified butter)",
      "1 Whole Lemon (juiced & zested)",
      "2 cloves Fresh Garlic, minced",
      "Flaky sea salt",
    ],
    instructions: [
      "Pat salmon skin bone-dry with paper towels and score skin slightly.",
      "Heat ghee in a skillet over medium-high heat.",
      "Place salmon skin-side down, pressing firmly for 30 seconds. Cook for 5 mins until skin is perfectly crispy.",
      "Flip and cook for 2 more minutes, then remove salmon.",
      "Sauté minced garlic in the remaining fat for 30 seconds. Toss in asparagus spears and cook for 4 minutes.",
      "Deglaze pan with lemon juice, pour over salmon and asparagus, and garnish with lemon zest and sea salt.",
    ],
  },
  {
    id: "keto-bacon-egg-bowl",
    title: "THE ANARCHIC KETO SCRIPPED BOWL",
    description: "High-density protein and fat bowl designed to smash hunger. Ideal for breaking a heavy fast without spiking insulin levels.",
    calories: 980,
    protein: 65,
    fat: 78,
    netCarbs: 3,
    category: "REFUEL",
    ingredients: [
      "5 Large Pasture-Raised Eggs",
      "6 thick-cut strips of Organic Hickory Bacon",
      "1/2 cup Shredded Sharp Cheddar Cheese",
      "1/4 cup Sour Cream (full fat)",
      "1 tbsp Chopped Chives",
      "Hot Sauce (cholula/habanero) to taste",
    ],
    instructions: [
      "Fry bacon strips in a cold pan over medium heat until extremely crispy. Set bacon aside and crumble.",
      "Pour off half the bacon grease (reserve for later use) and lower heat.",
      "Whisk eggs with a pinch of salt. Pour into skillet and scramble slowly for soft curds.",
      "Just before eggs are fully set, fold in sharp cheddar cheese and crumbled bacon.",
      "Plate scramble in a deep bowl, top with a dollop of sour cream, fresh chives, and aggressive hot sauce splashes.",
    ],
  },
];

export const mockProgress: ProgressData = {
  currentStreak: 12,
  bestStreak: 28,
  targetWeight: 185.0,
  currentWeight: 191.4,
  startWeight: 204.0,
  weightHistory: [
    { date: "Jul 05", weight: 204.0 },
    { date: "Jul 12", weight: 201.2 },
    { date: "Jul 19", weight: 199.0 },
    { date: "Jul 26", weight: 196.5 },
    { date: "Aug 02", weight: 194.2 },
    { date: "Aug 09", weight: 192.5 },
    { date: "Aug 16", weight: 191.4 },
  ],
};

export const mockOMAD = {
  status: "FASTING",
  hoursCompleted: 19.5,
  hoursTotal: 23,
  timeRemaining: "03h 30m 12s",
  percentComplete: 84.7,
  windowStart: "20:00",
  windowEnd: "21:00",
};
