// Cafeteria Types for ISE Cafeteria Smart System App

// Meal Categories
export type MealCategory = 
  | 'hot_meal'      // Hot meals (M = 105LE, L = 115LE)
  | 'sandwich'      // Sandwiches (M = 95LE, L = 110LE for items with "bun")
  | 'sandwich_xl'   // Premium sandwiches (140LE)
  | 'burger'        // Burgers (110LE)
  | 'crepe'         // Crepes (110LE, special pricing for Fries Crepe = 80LE)
  | 'nursery';      // Nursery meals (90LE)

// Meal Subcategories
export type MealSubcategory = 
  | 'rice' | 'pasta' | 'noodles' | 'egyptian' | 'potatoes' | 'chicken'
  | 'wrap' | 'bun' | 'beef' | 'hot_dog' | 'fries' | 'premium' | 'special' | 'complete_meal';

// Daily Item Categories
export type DailyItemCategory = 
  | 'snacks'                    // Everyday snacks (30LE - 90LE)
  | 'bakery'                    // Bakery items (30LE - 65LE)
  | 'greek_yoghurt_popsicle'    // Greek yogurt popsicles (60LE - 70LE)
  | 'drinks'                    // Beverages (10LE - 45LE, some TBD)
  | 'dessert'                   // Dessert items (40LE - 50LE)
  | 'salad';                    // Salad items (50LE - 90LE)

// Meal Interface
export interface Meal {
  id: number;
  name: string;
  title?: string;
  description?: string;
  price: number;
  category: MealCategory;
  subcategory?: MealSubcategory;
  status: 'active' | 'inactive';
  image?: string;
  pdf_path?: string;
  daily_items?: number[];
  created_at: string;
  updated_at: string;
}

// Daily Item Interface
export interface DailyItem {
  id: number;
  name: string;
  description?: string;
  category: DailyItemCategory;
  price: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

// Pricing Structure
export interface PricingStructure {
  hot_meal: {
    base_price: 105; // LE
    description: 'Hot meals including rice, pasta, noodles, potatoes, and chicken dishes';
  };
  sandwich: {
    base_price_m: 95;  // LE for wraps
    base_price_l: 110; // LE for items with "bun"
    description: 'Sandwiches and wraps with different pricing based on type';
  };
  sandwich_xl: {
    base_price: 140; // LE
    description: 'Premium sandwiches with extra ingredients';
  };
  burger: {
    base_price: 110; // LE
    description: 'Beef and chicken burgers';
  };
  crepe: {
    base_price: 110; // LE
    special_items: {
      'Fries Crepe': 80; // LE
    };
    description: 'Various crepe options with special pricing for some items';
  };
  nursery: {
    base_price: 90; // LE
    special_items: {
      'Corn flakes + milk + Pasta red sauce + grilled chicken + Salad + Fruits / Dessert': 130,    // LE - Complete meal package
      'Omelette Wrap + Rice + Potatoes + minced meat + Salad + Fruits / Dessert': 130,    // LE - Complete meal package
      'Biscuit Yoghurt + Rice + green beans + grilled chicken + Salad + Fruits / Dessert': 130,   // LE - Complete meal package
      'Oat Cookies + Pasta cheese sauce + grilled chicken + Salad + Fruits / Dessert': 130, // LE - Complete meal package
      'Feta Cheese Petit Pain + Rice + grilled chicken + Molokhia + Salad + Fruits / Dessert': 130,  // LE - Complete meal package
      'Corn flakes + milk + Basmati Rice + shish tawook + Salad + Fruits / Dessert': 130,    // LE - Complete meal package
      'Omelette Wrap + Pasta white sauce + grilled chicken + Salad + Fruits / Dessert': 130,    // LE - Complete meal package
      'Fruit Yoghurt + Chinese Noodles + soy chicken + Salad + Fruits / Dessert': 130,   // LE - Complete meal package
      'Plain Croissant + Pasta Bolognese + Salad + Fruits / Dessert': 130, // LE - Complete meal package
      'Cheddar Cheese Petit Pain + Rice + grilled chicken + Molokhia + Salad + Fruits / Dessert': 130,  // LE - Complete meal package
    };
    description: 'Special meals for nursery students including complete KG meal packages';
  };
}

// Special Pricing Items
export const SPECIAL_PRICING_ITEMS = {
  'Fries Crepe': 80,    // LE (instead of 110LE)
  'Fries Wrap': 70,     // LE (instead of 95LE)
  'Corn flakes + milk + Pasta red sauce + grilled chicken + Salad + Fruits / Dessert': 130,    // LE - Complete meal package
  'Omelette Wrap + Rice + Potatoes + minced meat + Salad + Fruits / Dessert': 130,   // LE - Complete meal package
  'Biscuit Yoghurt + Rice + green beans + grilled chicken + Salad + Fruits / Dessert': 130,   // LE - Complete meal package
  'Oat Cookies + Pasta cheese sauce + grilled chicken + Salad + Fruits / Dessert': 130, // LE - Complete meal package
  'Feta Cheese Petit Pain + Rice + grilled chicken + Molokhia + Salad + Fruits / Dessert': 130,  // LE - Complete meal package
  'Corn flakes + milk + Basmati Rice + shish tawook + Salad + Fruits / Dessert': 130,    // LE - Complete meal package
  'Omelette Wrap + Pasta white sauce + grilled chicken + Salad + Fruits / Dessert': 130,    // LE - Complete meal package
  'Fruit Yoghurt + Chinese Noodles + soy chicken + Salad + Fruits / Dessert': 130,   // LE - Complete meal package
  'Plain Croissant + Pasta Bolognese + Salad + Fruits / Dessert': 130, // LE - Complete meal package
  'Cheddar Cheese Petit Pain + Rice + grilled chicken + Molokhia + Salad + Fruits / Dessert': 130,  // LE - Complete meal package
} as const;

// Bun Items (L pricing for sandwiches)
export const BUN_ITEMS = [
  'Chicken strips BBQ Bun',
  'Pulled Chicken BBQ bun',
  'Chicken strips Ranch Bun'
] as const;

// Category Labels for UI
export const CATEGORY_LABELS: Record<MealCategory, string> = {
  hot_meal: 'Hot Meal',
  sandwich: 'Sandwich',
  sandwich_xl: 'Sandwich XL',
  burger: 'Burger',
  crepe: 'Crepe',
  nursery: 'Nursery'
};

// Daily Item Category Labels for UI
export const DAILY_ITEM_CATEGORY_LABELS: Record<DailyItemCategory, string> = {
  snacks: 'Snacks',
  bakery: 'Bakery',
  greek_yoghurt_popsicle: 'Greek Yogurt Popsicle',
  drinks: 'Drinks',
  dessert: 'Dessert',
  salad: 'Salad'
};

// Price Range Information
export const PRICE_RANGES = {
  snacks: { min: 30, max: 90, unit: 'LE' },
  bakery: { min: 30, max: 65, unit: 'LE' },
  greek_yoghurt_popsicle: { min: 60, max: 70, unit: 'LE' },
  drinks: { min: 10, max: 45, unit: 'LE' },
  dessert: { min: 40, max: 50, unit: 'LE' },
  salad: { min: 50, max: 90, unit: 'LE' }
} as const;

// Helper Functions
export const isBunItem = (mealName: string): boolean => {
  return BUN_ITEMS.some(bunItem => mealName.includes(bunItem));
};

export const getMealPrice = (meal: Meal): number => {
  // Check for special pricing items
  if (meal.name in SPECIAL_PRICING_ITEMS) {
    return SPECIAL_PRICING_ITEMS[meal.name as keyof typeof SPECIAL_PRICING_ITEMS];
  }
  
  // Check for bun items (L pricing)
  if (meal.category === 'sandwich' && isBunItem(meal.name)) {
    return 110; // L price
  }
  
  return meal.price;
};

export const getPriceDisplay = (price: number): string => {
  if (price === 0) return 'TBD';
  return `${price} LE`;
}; 