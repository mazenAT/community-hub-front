import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useMutation, useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { plannerApi, profileApi, dailyItemsApi, familyMembersApi, dailyItemOrderApi } from "@/services/api";
import { format, parseISO, getDay, isBefore, startOfDay, endOfDay, subDays, addDays, startOfWeek, endOfWeek, startOfMonth, endOfMonth, isSameDay } from "date-fns";
import { CalendarIcon, AlertCircle, FileText, ChevronDown, Users } from "lucide-react";
import BottomNavigation from "@/components/BottomNavigation";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import NotificationBell from "@/components/NotificationBell";
import LoadingSpinner from '@/components/common/LoadingSpinner';
import EmptyState from '@/components/common/EmptyState';
import { formatCurrency } from "@/utils/format";
import { MealCategory, DailyItemCategory, CATEGORY_LABELS, DAILY_ITEM_CATEGORY_LABELS, getMealPrice, getPriceDisplay } from "@/types/cafeteria";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface Meal {
  id: number;
  name: string;
  title?: string;
  description?: string;
  price: number;
  category: MealCategory;
  subcategory?: string;
  status: 'active' | 'inactive';
  image?: string;
  pdf_path?: string;
  daily_items?: number[];
  created_at: string;
  updated_at: string;
}

// Define a more specific type for meals that come with weekly plan pivot data
interface MealWithPivot extends Meal {
  pivot: { 
    day_of_week: number;
    meal_date?: string;
  };
}

interface PreOrder {
  id: number;
  user_id: number;
  items: { meal_id: number; meal_date: string }[];
}

interface WeeklyPlan {
  id: number;
  start_date: string;
  end_date: string;
  is_active: boolean;
  school_id: number;
  meals: MealWithPivot[];
  meals_by_day?: { [date: string]: any[] };
  pre_orders: PreOrder[];
}

interface DailyItem {
  id: number;
  name: string;
  description?: string;
  category: DailyItemCategory;
  price: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

interface FamilyMember {
  id: number;
  name: string;
  grade: string;
  class: string;
  allergies: string[];
  is_active: boolean;
}

const isOrderingWindowOpen = (mealDate: Date): boolean => {
  // Rule: Orders must be placed before 11:59 AM of the day before the meal date.
  // For a meal on Wednesday, users can order until Tuesday 11:59 AM.
  const dayBeforeMeal = subDays(mealDate, 1);
  const orderingDeadline = new Date(dayBeforeMeal.getFullYear(), dayBeforeMeal.getMonth(), dayBeforeMeal.getDate(), 11, 59, 0);
  const now = new Date();
  
  // Check if the current time is before the deadline
  return isBefore(now, orderingDeadline);
};

// Helper to check if a meal has been pre-ordered on a specific date
const findPreOrderForMeal = (mealId: number, date: Date, plans?: WeeklyPlan[]): PreOrder | undefined => {
  if (!plans) return undefined;

  const dateString = format(date, 'yyyy-MM-dd');
  for (const plan of plans) {
    if (!Array.isArray(plan.pre_orders)) continue;
    for (const order of plan.pre_orders) {
      if (!Array.isArray(order.items)) continue;
      const item = order.items.find(item => 
        item.meal_id === mealId && 
        format(parseISO(item.meal_date), 'yyyy-MM-dd') === dateString
      );
      if (item) return order;
    }
  }
  return undefined;
};

const Planner = () => {
  // Add missing function definitions at the top
  const getCurrentDateRange = () => {
    if (viewMode === 'custom') {
      if (customStartDate && customEndDate) {
        return `${format(customStartDate, 'MMM dd')} to ${format(customEndDate, 'MMM dd')}`;
      } else if (customStartDate) {
        return `${format(customStartDate, 'MMM dd')} only`;
      } else {
        return 'Select custom date range';
      }
    } else {
      // Week-based view - show actual plan dates
      if (!activePlan) return 'No plan available';
      
      const startDate = parseISO(activePlan.start_date);
      const endDate = parseISO(activePlan.end_date);
      
      return `${format(startDate, 'MMM dd')} to ${format(endDate, 'MMM dd')}`;
    }
  };

  const getDatesForWeek = (plan: WeeklyPlan, weekNumber: number): Date[] => {
    if (!plan.start_date || !plan.end_date) return [];
    
    const startDate = parseISO(plan.start_date);
    const endDate = parseISO(plan.end_date);
    const dates: Date[] = [];
    
    // Calculate week start (assuming week 1 starts from start_date)
    const weekStart = addDays(startDate, (weekNumber - 1) * 7);
    const weekEnd = addDays(weekStart, 6);
    
    // Ensure we don't go beyond the plan end date
    const actualWeekEnd = isBefore(weekEnd, endDate) ? weekEnd : endDate;
    
    let currentDate = new Date(weekStart);
    while (isBefore(currentDate, actualWeekEnd) || isSameDay(currentDate, actualWeekEnd)) {
      dates.push(new Date(currentDate));
      currentDate = addDays(currentDate, 1);
    }
    
    return dates;
  };

  const getDatesForView = (plan: WeeklyPlan): Date[] => {
    if (!customStartDate || !customEndDate) return [];
    
    const startDate = new Date(customStartDate);
    const endDate = new Date(customEndDate);
        const dates: Date[] = [];
        
    let currentDate = new Date(startDate);
    while (isBefore(currentDate, endDate) || isSameDay(currentDate, endDate)) {
          dates.push(new Date(currentDate));
          currentDate = addDays(currentDate, 1);
        }
    
        return dates;
  };

  const getMealsForDay = (date: Date, plans: WeeklyPlan[]): any[] => {
    if (!plans || plans.length === 0) return [];
    
    const dateString = format(date, 'yyyy-MM-dd');
    const allMeals: any[] = [];
    
    for (const plan of plans) {
      // Check if we have meals_by_day structure (new API format)
      if (plan.meals_by_day && plan.meals_by_day[dateString]) {
        const mealsForDate = plan.meals_by_day[dateString];
        allMeals.push(...mealsForDate);
      }
      // Fallback to old pivot structure if meals_by_day doesn't exist
      else if (plan.meals && Array.isArray(plan.meals)) {
        const mealsForDate = plan.meals.filter((meal: any) => {
          // Check if meal is assigned to this specific date
          if (meal.pivot && meal.pivot.meal_date) {
            return format(parseISO(meal.pivot.meal_date), 'yyyy-MM-dd') === dateString;
          }
          
          // Check if meal is assigned to this day of week
          if (meal.pivot && meal.pivot.day_of_week) {
            const dayOfWeek = getDay(date);
            // Convert from JavaScript Sunday=0 to backend Sunday=1 format
            const jsDayOfWeek = dayOfWeek === 0 ? 1 : dayOfWeek + 1; // Sunday=0 becomes 1, Monday=1 becomes 2, etc.
            const mealDayOfWeek = meal.pivot.day_of_week;
            return mealDayOfWeek === jsDayOfWeek;
          }
          
          return false;
        });
        
        allMeals.push(...mealsForDate);
      }
    }
    
    // Debug: Log all meals before filtering
    console.log(`All meals for ${dateString}:`, allMeals);
    console.log('Selected meal type:', selectedType);
    
    // Filter by selected meal type
    if (selectedType !== 'all') {
      const filteredMeals = allMeals.filter(meal => meal.category === selectedType);
      console.log(`Meals after filtering by ${selectedType}:`, filteredMeals);
      return filteredMeals;
    }
    
    return allMeals;
  };

  const isMonthlyPlan = (plan: WeeklyPlan): boolean => {
    if (!plan.start_date || !plan.end_date) return false;
    
    const startDate = parseISO(plan.start_date);
    const endDate = parseISO(plan.end_date);
    const daysDiff = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
    
    // Consider it monthly if more than 21 days
    return daysDiff > 21;
  };

  const isDateInRange = (date: Date, start: Date, end: Date): boolean => {
    const d = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    const s = new Date(start.getFullYear(), start.getMonth(), start.getDate());
    const e = new Date(end.getFullYear(), end.getMonth(), end.getDate());
    return d >= s && d <= e;
  };

  const [selectedType, setSelectedType] = useState<"all" | "hot_meal" | "sandwich" | "sandwich_xl" | "burger" | "crepe" | "nursery">("all");
  const [selectedCategory, setSelectedCategory] = useState<MealCategory | "all">("all");
  const [selectedSubcategory, setSelectedSubcategory] = useState<string>("all");
  const [categories, setCategories] = useState<(MealCategory | "all")[]>([]);
  const [subcategories, setSubcategories] = useState<string[]>([]);
  const [viewMode, setViewMode] = useState<'custom' | 'week'>('week');
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [customStartDate, setCustomStartDate] = useState<Date | undefined>(undefined);
  const [customEndDate, setCustomEndDate] = useState<Date | undefined>(undefined);
  const [dailyItems, setDailyItems] = useState<DailyItem[]>([]);
  const [showPdfModal, setShowPdfModal] = useState(false);
  const [selectedPdfUrl, setSelectedPdfUrl] = useState<string>('');
  const [loadingPdf, setLoadingPdf] = useState(false);
  const [selectedAddOnType, setSelectedAddOnType] = useState<"all" | "drinks" | "sides" | "condiments" | "desserts">("all");
  const [selectedAddOnPriceRange, setSelectedAddOnPriceRange] = useState<"all" | "low" | "medium" | "high">("all");
  const [dailyItemSearchTerm, setAddOnSearchTerm] = useState<string>("");
  const [familyMembers, setFamilyMembers] = useState<FamilyMember[]>([]);
  const [selectedFamilyMember, setSelectedFamilyMember] = useState<string>("");
  const [selectedWeek, setSelectedWeek] = useState<string>("1");

  // Daily Items modal state
  const [showAddOnsModal, setShowAddOnsModal] = useState(false);
  const [selectedAddOnCategory, setSelectedAddOnCategory] = useState<string>("");
  const [selectedMealForAddOns, setSelectedMealForAddOns] = useState<any>(null);
  const [selectedDateForAddOns, setSelectedDateForAddOns] = useState<Date | null>(null);
  const [selectedAddOns, setSelectedAddOns] = useState<{[key: number]: number}>({});
  
  // Store daily-items for each meal (key: mealId_date, value: array of daily-items)
  const [mealAddOns, setMealAddOns] = useState<{[key: string]: {daily_item_id: number, quantity: number}[]}>({});

  const { data: profile, isLoading: isLoadingProfile, error: profileError } = useQuery({
    queryKey: ["profile"],
    queryFn: profileApi.getProfile,
  });

  const schoolId = profile?.data?.school_id;

  const { data: weeklyPlans, isLoading: isLoadingPlans, error: plansError, refetch } = useQuery({
    queryKey: ["weeklyPlans", schoolId],
    queryFn: () => plannerApi.getWeeklyPlansBySchool(schoolId as number),
    enabled: !!schoolId, // Only run the query if schoolId is available
    retry: 1,
  });

  // Fetch family members
  const { data: familyMembersResponse, isLoading: isLoadingFamilyMembers } = useQuery({
    queryKey: ["family-members"],
    queryFn: familyMembersApi.getFamilyMembers,
  });

  // Extract categories and subcategories from weekly plans meals
  useEffect(() => {
    if (weeklyPlans?.data) {
      const allMealsFromPlans = weeklyPlans.data.flatMap((plan: any) => 
        Array.isArray(plan.meals) ? plan.meals : []
      );
      
      const uniqueCategories = Array.from(new Set(allMealsFromPlans.map((meal: any) => meal.category).filter(Boolean))) as MealCategory[];
      const uniqueSubcategories = Array.from(new Set(allMealsFromPlans.map((meal: any) => meal.subcategory).filter(Boolean))) as string[];
      
      setCategories(["all", ...uniqueCategories]);
      setSubcategories(["all", ...uniqueSubcategories]);
    }
  }, [weeklyPlans]);

  // Update family members state
  useEffect(() => {
    if (familyMembersResponse?.data) {
      setFamilyMembers(familyMembersResponse.data);
    }
  }, [familyMembersResponse]);

  // Filter daily-items based on selected filters (Frontend-only filtering)
  const filteredDailyItems = dailyItems.filter((dailyItem) => {
    // Filter by search term
    const addonName = dailyItem.name.toLowerCase();
    const addonDescription = (dailyItem.description || '').toLowerCase();
    const searchText = `${addonName} ${addonDescription}`;
    
    const searchMatch = !dailyItemSearchTerm || searchText.includes(dailyItemSearchTerm.toLowerCase());
    
    // Filter by type (based on name/description - more flexible matching)
    const typeMatch = selectedAddOnType === "all" || 
      (selectedAddOnType === "drinks" && (
        searchText.includes('cola') || 
        searchText.includes('drink') || 
        searchText.includes('soda') || 
        searchText.includes('coke') ||
        searchText.includes('beverage')
      )) ||
      (selectedAddOnType === "sides" && (
        searchText.includes('fries') || 
        searchText.includes('side') ||
        searchText.includes('chips') ||
        searchText.includes('potato')
      )) ||
      (selectedAddOnType === "condiments" && (
        searchText.includes('sauce') || 
        searchText.includes('dressing') || 
        searchText.includes('cheese') ||
        searchText.includes('ketchup') ||
        searchText.includes('mayo') ||
        searchText.includes('mustard')
      )) ||
      (selectedAddOnType === "desserts" && (
        searchText.includes('dessert') || 
        searchText.includes('sweet') ||
        searchText.includes('cake') ||
        searchText.includes('cookie') ||
        searchText.includes('ice cream')
      ));

    // Filter by price range
    const priceMatch = selectedAddOnPriceRange === "all" ||
      (selectedAddOnPriceRange === "low" && dailyItem.price <= 1.00) ||
      (selectedAddOnPriceRange === "medium" && dailyItem.price > 1.00 && dailyItem.price <= 3.00) ||
      (selectedAddOnPriceRange === "high" && dailyItem.price > 3.00);

    return searchMatch && typeMatch && priceMatch;
  });

  const preOrderMutation = useMutation({
    mutationFn: (payload: any) => plannerApi.preOrderMeal(payload),
    onSuccess: (response) => {
      toast.success("Order placed successfully!");
      
      // Show order confirmation with details
      const orderDetails = response.data;
      if (orderDetails) {
        // Navigate to order confirmation or show modal with details
        showOrderConfirmation(orderDetails);
      }
      
      refetch(); // Update the UI after pre-order
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Failed to place order");
    },
  });

  const [showOrderConfirmationModal, setShowOrderConfirmationModal] = useState(false);
  const [orderConfirmationData, setOrderConfirmationData] = useState<any>(null);
  const [showAddOnOrderModal, setShowAddOnOrderModal] = useState(false);
  const [selectedAddOnsForOrder, setSelectedAddOnsForOrder] = useState<Record<number, number>>({});

  const showOrderConfirmation = (orderData: any) => {
    setOrderConfirmationData(orderData);
    setShowOrderConfirmationModal(true);
  };

  // Handle viewing meal plan PDF
  const handleViewMealPlanPdf = async (plan: WeeklyPlan) => {
    try {
      setLoadingPdf(true);
      
      // Check if plan has PDF path
      if (plan.meals && plan.meals.length > 0) {
        const firstMeal = plan.meals[0];
        if (firstMeal.pdf_path) {
          // Open PDF in new tab
          window.open(firstMeal.pdf_path, '_blank');
        } else {
          // Show message if no PDF available
          toast.info("PDF menu is not available for this plan. Please contact the school for the full menu.");
        }
      } else {
        toast.info("No meals available in this plan to view.");
      }
    } catch (error) {
      console.error('Error viewing PDF:', error);
      toast.error("Failed to open PDF menu. Please try again.");
    } finally {
      setLoadingPdf(false);
    }
  };

  // Handle viewing general PDF from admin panel
  const handleViewGeneralPdf = async () => {
    try {
      setLoadingPdf(true);
      
      // Fetch general PDF from admin panel
      const response = await plannerApi.getGeneralPdf();
      
      // Handle different possible response structures
      let pdfUrl = null;
      if (response.data?.pdf_url) {
        pdfUrl = response.data.pdf_url;
      } else if (response.data?.data?.pdf_url) {
        pdfUrl = response.data.data.pdf_url;
      } else if (response.data?.url) {
        pdfUrl = response.data.url;
      }
      
      if (pdfUrl) {
        // Open PDF in new tab
        window.open(pdfUrl, '_blank');
        toast.success("Opening full menu PDF...");
      } else {
        toast.info("PDF menu is not available. Please contact the school for the full menu.");
      }
    } catch (error) {
      console.error('Error fetching general PDF:', error);
      toast.error("Failed to load PDF menu. Please try again or contact support.");
    } finally {
      setLoadingPdf(false);
    }
  };

  const handlePreOrder = (meal: MealWithPivot, date: Date) => {
    if (!activePlan) return;
    
    if (!selectedFamilyMember) {
      toast.error("Please select a family member before placing an order");
      return;
    }
    
    // Check if there are selected daily-items for this meal and date
    const mealKey = `${meal.id}_${format(date, 'yyyy-MM-dd')}`;
    const selectedMealAddOns = mealAddOns[mealKey] || [];
    
    const payload = {
      weekly_plan_id: activePlan.id,
      family_member_id: parseInt(selectedFamilyMember),
      items: [
        {
          meal_id: meal.id,
          meal_date: format(date, 'yyyy-MM-dd'),
          quantity: 1,
          daily_items: selectedMealAddOns.length > 0 ? selectedMealAddOns : undefined,
        },
      ],
    };
    
    // Clear the selected daily-items for this meal after ordering
    if (selectedMealAddOns.length > 0) {
      setMealAddOns(prev => {
        const newState = { ...prev };
        delete newState[mealKey];
        return newState;
      });
    }
    
    preOrderMutation.mutate(payload);
  };

  const handleAddOnsClick = (date: Date, meal: any, category: string) => {
    if (!selectedFamilyMember) {
      toast.error("Please select a family member before adding items");
      return;
    }
    
    // Filter daily-items by their actual category field
    const categoryAddOns = filteredDailyItems.filter(dailyItem => {
      // Direct category matching for more accurate filtering
      switch (category) {
        case 'Bakery':
          return dailyItem.category === 'bakery';
        case 'Snacks':
          return dailyItem.category === 'snacks';
        case 'Drinks':
          return dailyItem.category === 'drinks';
        default:
          return true;
      }
    });

    if (categoryAddOns.length === 0) {
      toast.info(`No ${category} items available`);
      return;
    }

    // Set modal state and open modal
    setSelectedAddOnCategory(category);
    setSelectedMealForAddOns(meal);
    setSelectedDateForAddOns(date);
    setSelectedAddOns({});
    setShowAddOnsModal(true);
  };

  // Handle PDF viewing
  const handleViewPdf = async (meal: MealWithPivot) => {
    try {
      setLoadingPdf(true);
      const response = await plannerApi.getMealPdf(meal.id);
      if (response.data.pdf_url) {
        setSelectedPdfUrl(response.data.pdf_url);
        setShowPdfModal(true);
      } else {
        toast.error('No PDF available for this meal');
      }
    } catch (error) {
      toast.error('Failed to load PDF');
    } finally {
      setLoadingPdf(false);
    }
  };

  // Add normalization helper
  const normalizeMeal = (meal: any) => ({
    ...meal,
    title: meal.title || meal.name || "Meal",
    category: meal.category || "hot_meal",
    subcategory: meal.subcategory || "",
    calories: meal.calories || 0,
    date: meal.date || "",
    time: meal.time || "",
    // Correctly map the 'available' boolean from the backend to the frontend status
    status: meal.available === false ? 'sold_out' : 'available',
    // Add a default pivot structure since the API doesn't provide it
    pivot: meal.pivot || { 
      day_of_week: 1, // Default to Monday if no pivot data
      meal_date: meal.meal_date || null, // Include meal_date if available
    },
  });

  const normalizedPlans = (() => {
    if (!weeklyPlans?.data) {
      // No weekly plans available
      return [];
    }
    
    // Handle different possible data structures
    const plansData = Array.isArray(weeklyPlans.data) ? weeklyPlans.data : [weeklyPlans.data];
    
    return plansData.map((plan: any) => ({
      ...plan,
      meals: Array.isArray(plan.meals) ? plan.meals.map(normalizeMeal) : [],
      // Handle meals_by_day structure if it exists
      meals_by_day: plan.meals_by_day ? 
        Object.keys(plan.meals_by_day).reduce((acc: any, dateKey: string) => {
          acc[dateKey] = plan.meals_by_day[dateKey].map(normalizeMeal);
          return acc;
        }, {}) : undefined,
    }));
  })();

  // Find the active plan based on selected week
  const activePlan = (() => {
    if (normalizedPlans.length === 0) return null;
    
    // Find the plan that matches the selected week
    const selectedWeekNumber = parseInt(selectedWeek);
    
    // If selectedWeek is 1, 2, 3, etc., find the corresponding plan
    if (selectedWeekNumber >= 1 && selectedWeekNumber <= normalizedPlans.length) {
      return normalizedPlans[selectedWeekNumber - 1];
    }
    
    // If selectedWeek doesn't match any available plans, use the first one
    // and update the selectedWeek state to match
    if (normalizedPlans.length > 0) {
      // Update selectedWeek to match the first available plan
      if (selectedWeek !== "1") {
        setSelectedWeek("1");
      }
      return normalizedPlans[0];
    }
    
    return null;
  })();





  useEffect(() => {
    // Handle daily-items with error handling
    dailyItemsApi.getDailyItems()
      .then((res) => {
        setDailyItems(res.data.filter((dailyItem: DailyItem) => dailyItem.is_active));
      })
      .catch((error) => {
        // Failed to load daily-items
        setDailyItems([]);
      });
  }, []);

  const navigate = useNavigate();

  const dailyItemOrderMutation = useMutation({
    mutationFn: (payload: any) => dailyItemOrderApi.createOrder(payload.daily_item_id, payload.quantity, parseInt(selectedFamilyMember)),
    onSuccess: (response) => {
      toast.success("Daily Item order placed successfully!");
      
      // Show order confirmation with details
      const orderDetails = response.data;
      if (orderDetails) {
        showOrderConfirmation(orderDetails);
      }
      
      // Clear selected daily-items
      setSelectedAddOnsForOrder({});
      setShowAddOnOrderModal(false);
      
      refetch(); // Update the UI after order
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Failed to place daily-item order");
    },
  });

  const handleAddOnOrder = () => {
    if (!selectedFamilyMember) {
      toast.error("Please select a family member before placing an order");
      return;
    }

    const selectedItems = Object.entries(selectedAddOnsForOrder)
      .filter(([_, quantity]) => quantity > 0)
      .map(([addonId, quantity]) => ({
        daily_item_id: parseInt(addonId),
        quantity
      }));

    if (selectedItems.length === 0) {
      toast.error("Please select at least one daily-item item");
      return;
    }

    // Place order for each selected daily-item
    selectedItems.forEach(item => {
      dailyItemOrderMutation.mutate(item);
    });
  };

  // Replace loading spinner in loading state
  if (isLoadingProfile || isLoadingPlans) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <LoadingSpinner size={48} />
      </div>
    );
  }

  if (profileError) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center p-6">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Error Loading Profile</h2>
          <p className="text-gray-600 mb-4">Could not load user profile to determine school.</p>
        </div>
      </div>
    );
  }

  if (plansError) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center p-6">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Error Loading Weekly Plans</h2>
          <p className="text-gray-600 mb-4">There was a problem loading the weekly plans. Please try again.</p>
          <div className="space-x-2">
            <Button onClick={() => refetch()} className="bg-blue-500 hover:bg-blue-600 text-white">
              Retry Plans
            </Button>
            <Button onClick={() => window.location.reload()} className="bg-green-500 hover:bg-green-600 text-white">
              Reload Page
            </Button>
          </div>
        </div>
      </div>
    );
  }


  

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-100 via-gray-200 to-gray-300 pb-20">
      {/* Header */}
      <div 
        className="bg-gradient-to-r from-brand-red via-brand-orange to-brand-yellow px-4 py-4 border-b-2 border-brand-red"
        data-tutorial="planner-header"
      >
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-white">View Menu</h1>
          <div className="flex items-center space-x-2">
            <FileText className="w-5 h-5 text-white" />
            <NotificationBell />
          </div>
        </div>

        {/* Date Range Selection */}
        <div className="mt-4 flex flex-wrap gap-2">
          <Button
            variant={viewMode === 'week' ? 'default' : 'outline'}
            size="sm"
            className={`${
              viewMode === 'week' 
                ? 'bg-white text-brand-red border-white hover:bg-white/90' 
                : 'bg-white/20 text-white border-white/30 hover:bg-white/30'
            } rounded-full px-4 py-2 text-sm font-medium`}
            onClick={() => {
              setViewMode('week');
              setCustomStartDate(undefined);
              setCustomEndDate(undefined);
            }}
          >
            Week View
          </Button>
          
          <Button
            variant={viewMode === 'custom' ? 'default' : 'outline'}
            size="sm"
            className={`${
              viewMode === 'custom' 
                ? 'bg-white text-brand-red border-white hover:bg-white/90' 
                : 'bg-white/20 text-white border-white/30 hover:bg-white/30'
            } rounded-full px-4 py-2 text-sm font-medium`}
            onClick={() => {
              setViewMode('custom');
              setCustomStartDate(undefined);
              setCustomEndDate(undefined);
            }}
          >
            Custom Range
          </Button>
        </div>

        {/* Custom Date Range Picker */}
        {viewMode === 'custom' && (
          <div className="mt-4 flex flex-wrap gap-2 items-center">
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className="bg-white/20 text-white border-white/30 hover:bg-white/30"
                >
                  <CalendarIcon className="w-4 h-4 mr-2" />
                  {customStartDate ? format(customStartDate, 'MMM dd') : 'Start Date'}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={customStartDate}
                  onSelect={(date) => {
                    setCustomStartDate(date);
                    // If end date is before start date, reset it
                    if (customEndDate && date && customEndDate < date) {
                      setCustomEndDate(undefined);
                    }
                  }}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
            
            <span className="text-white/80">to</span>
            
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className="bg-white/20 text-white border-white/30 hover:bg-white/30"
                >
                  <CalendarIcon className="w-4 h-4 mr-2" />
                  {customEndDate ? format(customEndDate, 'MMM dd') : 'End Date'}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={customEndDate}
                  onSelect={(date) => {
                    setCustomEndDate(date);
                  }}
                  disabled={(date) => {
                    // Allow same day selection
                    return customStartDate ? date < customStartDate : false;
                  }}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>
        )}

        {/* Current Date Range */}
        <div className="mt-2 text-sm text-white/90">
          {getCurrentDateRange()}
          {activePlan && (
            <span className={`ml-2 px-2 py-1 text-xs rounded-full ${
              isMonthlyPlan(activePlan) 
                ? 'bg-white/20 text-white' 
                : 'bg-white/20 text-white'
            }`}>
              {isMonthlyPlan(activePlan) ? 'Monthly Plan' : 'Weekly Plan'}
            </span>
          )}
        </div>

        {/* Pre-Order Warning Message */}
        {activePlan && (
          <div className="mt-4 p-3 bg-white/20 border border-white/30 rounded-lg">
            <div className="flex items-start space-x-2">
              <AlertCircle className="w-5 h-5 text-white mt-0.5 flex-shrink-0" />
              <div className="text-sm text-white">
                <p className="font-medium mb-1">Pre-Order Deadline</p>
                <p>Orders must be placed before <strong>11:59 AM</strong> the day before each meal. After this time, ordering will be closed for that meal.</p>
              </div>
            </div>
          </div>
        )}


      </div>



      {/* Content */}
      <div className="px-4 py-4">
        {/* Family Member Selection */}
        <div 
          className="mb-6 bg-white rounded-lg p-4 shadow-sm border border-brand-yellow/30"
          data-tutorial="planner-family-selector"
        >
          <div className="flex items-center space-x-2 mb-3">
            <Users className="w-5 h-5 text-brand-red" />
            <h3 className="text-sm font-semibold text-brand-black">Select Family Member</h3>
          </div>
          <Select value={selectedFamilyMember} onValueChange={setSelectedFamilyMember}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Choose a family member to order for" />
            </SelectTrigger>
            <SelectContent>
              {familyMembers.map((member) => (
                <SelectItem key={member.id} value={member.id.toString()}>
                  {member.name} - {member.grade} Class {member.class}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {familyMembers.length === 0 && !isLoadingFamilyMembers && (
            <p className="text-sm text-brand-black/60 mt-2">
              No family members found. Please add family members in your profile.
            </p>
          )}
        </div>

        {/* Week Filter */}
        <div 
          className="mb-6 bg-white rounded-lg p-4 shadow-sm border border-brand-yellow/30"
          data-tutorial="planner-week-selector"
        >
          <h3 className="text-sm font-semibold text-brand-black mb-3">Week Selection</h3>
          {normalizedPlans.length === 0 ? (
            <p className="text-sm text-brand-black/60">No weekly plans available</p>
          ) : (
          <div className="flex flex-wrap gap-2">
            {normalizedPlans.map((plan: WeeklyPlan, index: number) => (
              <Button
                key={plan.id}
                variant={selectedWeek === (index + 1).toString() ? 'default' : 'outline'}
                size="sm"
                className={`${
                  selectedWeek === (index + 1).toString()
                    ? 'bg-brand-red text-white border-brand-red hover:bg-brand-red/90' 
                    : 'bg-white text-brand-black border-brand-red hover:bg-brand-red/10'
                } rounded-full px-3 py-1 text-xs font-medium`}
                onClick={() => {
                  setSelectedWeek((index + 1).toString());
                  setViewMode('week');
                }}
              >
                Week {index + 1}
              </Button>
            ))}
          </div>
          )}
          {normalizedPlans.length > 0 && (
            <p className="text-xs text-brand-black/40 mt-2">
              {normalizedPlans.length} plan{normalizedPlans.length !== 1 ? 's' : ''} available
            </p>
          )}
        </div>

        {/* Meal Filters */}
        <div className="mb-6 bg-white rounded-lg p-4 shadow-sm border border-brand-yellow/30" data-tutorial="planner-meal-filters">
          <h3 className="text-sm font-semibold text-brand-black mb-3">Meal Type</h3>
          <div className="flex flex-wrap gap-2">
            {[
              { key: 'all', label: 'All Meals' },
              { key: 'hot_meal', label: 'Hot Meal' },
              { key: 'sandwich', label: 'Sandwich' },
              { key: 'sandwich_xl', label: 'Sandwich XL' },
              { key: 'burger', label: 'Burger' },
              { key: 'crepe', label: 'Crepe' },
              { key: 'nursery', label: 'Nursery' }
            ].map(({ key, label }) => (
              <Button
                key={key}
                variant={selectedType === key ? 'default' : 'outline'}
                size="sm"
                className={`${
                  selectedType === key 
                    ? 'bg-brand-red text-white border-brand-red hover:bg-brand-red/90' 
                    : 'bg-white text-brand-black border-brand-red hover:bg-brand-red/10'
                } rounded-full px-3 py-1 text-xs font-medium`}
                onClick={() => setSelectedType(key as 'all' | 'hot_meal' | 'sandwich' | 'sandwich_xl' | 'burger' | 'crepe' | 'nursery')}
              >
                {label}
              </Button>
            ))}
          </div>
        </div>

        {/* View Full Menu Button */}
        <div className="mb-6 flex justify-center" data-tutorial="planner-order-button">
          <Button
            onClick={handleViewGeneralPdf}
            className="bg-brand-orange hover:bg-brand-orange/90 text-white px-8 py-3 rounded-xl text-lg font-semibold shadow-lg"
            disabled={loadingPdf}
          >
            <FileText className="w-5 h-5 mr-2" />
            View Full Menu
          </Button>
        </div>

        {/* Meal Planner Cards */}
        {activePlan ? (
          <div className="mb-8">
            {(() => {
              // Debug: Log the active plan and its meals
              console.log('Active Plan:', activePlan);
              console.log('Active Plan Meals:', activePlan.meals);
              console.log('Selected Week:', selectedWeek);
              console.log('View Mode:', viewMode);
              
              // Get dates based on week filter or custom range
              let datesForView;
              
              if (viewMode === 'custom') {
                datesForView = getDatesForView(activePlan);
              } else {
                // Week-based view
                datesForView = getDatesForWeek(activePlan, parseInt(selectedWeek));
              }
              
              console.log('Dates for View:', datesForView);
              
              // Filter dates that have meals
              const datesWithMeals = datesForView.filter((date) => {
                const mealsForDay = getMealsForDay(date, [activePlan]);
                console.log(`Meals for ${format(date, 'yyyy-MM-dd')}:`, mealsForDay);
                return mealsForDay.length > 0;
              });
              
              console.log('Dates with Meals:', datesWithMeals);

              if (datesWithMeals.length === 0) {
                return (
                  <EmptyState 
                    icon={<AlertCircle />}
                    message="No meals available for the selected date range and filters." 
                    action={
                      <Button 
                        variant="outline" 
                        onClick={() => {
                          setSelectedType("all");
                          setSelectedWeek("1");
                          setCustomStartDate(undefined);
                          setCustomEndDate(undefined);
                        }}
                        className="bg-brand-yellow text-brand-black border-brand-yellow hover:bg-brand-yellow/90"
                      >
                        Clear Filters
                      </Button>
                    }
                  />
                );
              }

              return (
                <div className="space-y-6">
                  {datesWithMeals.map((date) => {
                    const mealsForDay = getMealsForDay(date, [activePlan]);
                    
                    return (
                      <div key={date.toISOString()} className="bg-white rounded-xl border border-brand-yellow/30 overflow-hidden shadow-sm">
                        {/* Day Header */}
                        <div className="bg-gradient-to-r from-brand-red via-brand-orange to-brand-yellow px-6 py-4">
                          <div className="flex items-center justify-between">
                            <div>
                              <h3 className="text-lg font-bold text-white">
                                {format(date, 'EEEE')}
                              </h3>
                              <p className="text-white/90 text-sm">
                                {format(date, 'MMMM dd, yyyy')}
                              </p>
                            </div>
                            <div className="text-white/80 text-sm">
                              {mealsForDay.length} meal{mealsForDay.length !== 1 ? 's' : ''}
                              {!isOrderingWindowOpen(date) && (
                                <div className="text-red-200 text-xs mt-1">
                                  Ordering closed
                                </div>
                              )}
                              {isOrderingWindowOpen(date) && (
                                <div className="text-green-200 text-xs mt-1">
                                  Order until {format(subDays(date, 1), 'MMM dd')} 11:59 AM
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                        
                        {/* Meals Grid - Talabat Style */}
                        <div className="p-6">
                          <div 
                            className="grid grid-cols-2 gap-6 sm:gap-8"
                            data-tutorial="meal-list"
                          >
                            {mealsForDay.map((meal: any, mealIndex: number) => (
                              <div key={`${date.toISOString()}-${meal.id}-${mealIndex}`} className="bg-gradient-to-br from-white via-gray-50/50 to-white rounded-3xl border border-gray-200/60 hover:border-brand-orange/60 hover:shadow-2xl hover:shadow-brand-orange/10 transition-all duration-500 overflow-hidden group relative">
                                {/* Premium Glow Effect */}
                                <div className="absolute inset-0 bg-gradient-to-br from-brand-orange/5 via-transparent to-brand-red/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                                
                                {/* Meal Content */}
                                <div className="p-6 relative z-10">
                                  {/* Meal Header */}
                                  <div className="flex items-start justify-between mb-5">
                                    <div className="flex-1 pr-4">
                                      <h4 className="font-extrabold text-brand-black text-xl leading-tight line-clamp-2 mb-3 bg-gradient-to-r from-brand-black to-brand-black/80 bg-clip-text">
                                        {meal.title || meal.name}
                                      </h4>
                                      <p className="text-gray-600 text-sm leading-relaxed line-clamp-2 mb-3 font-medium">
                                        {meal.description || 'Delicious meal prepared with fresh ingredients'}
                                      </p>
                                    </div>
                                    <div className="ml-3 text-right flex-shrink-0">
                                      <div className="bg-gradient-to-br from-brand-orange to-brand-red p-3 rounded-2xl shadow-lg">
                                        <span className="text-2xl font-black text-white">
                                          {meal.price ? formatCurrency(meal.price) : 'N/A'}
                                        </span>
                                      </div>
                                    </div>
                                  </div>
                                  
                                  {/* Meal Category Badge */}
                                  <div className="mb-5">
                                    <span className="inline-block px-5 py-3 rounded-2xl text-sm font-bold bg-gradient-to-r from-brand-orange/10 via-brand-orange/20 to-brand-red/10 text-brand-orange border-2 border-brand-orange/30 shadow-lg backdrop-blur-sm">
                                      {CATEGORY_LABELS[meal.category as MealCategory] || meal.category || 'N/A'}
                                    </span>
                                  </div>
                                  
                                  {/* Daily Items Selected Indicator */}
                                  {(() => {
                                    const mealKey = `${meal.id}_${format(date, 'yyyy-MM-dd')}`;
                                    const selectedMealAddOns = mealAddOns[mealKey] || [];
                                    return selectedMealAddOns.length > 0 && (
                                      <div className="mb-3 p-2 bg-green-50 border border-green-200 rounded-lg">
                                        <div className="flex items-center gap-2">
                                          <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                                          <span className="text-xs font-medium text-green-800">
                                            {selectedMealAddOns.length} daily-item{selectedMealAddOns.length !== 1 ? 's' : ''} selected
                                          </span>
                                        </div>
                                      </div>
                                    );
                                  })()}
                                  
                                  {/* Daily Items Section */}
                                  <div className="mb-6">
                                    <h5 className="text-sm font-bold text-brand-black mb-4 flex items-center">
                                      <div className="w-3 h-3 bg-gradient-to-r from-brand-orange to-brand-red rounded-full mr-3 animate-pulse"></div>
                                      <span className="bg-gradient-to-r from-brand-orange to-brand-red bg-clip-text text-transparent">Add Daily Items</span>
                                    </h5>
                                    <div className="grid grid-cols-2 gap-3">
                                      <Button
                                        size="sm"
                                        variant="outline"
                                        className="h-12 px-4 border-2 border-brand-yellow/60 text-brand-black hover:bg-gradient-to-r hover:from-brand-yellow/20 hover:to-brand-orange/20 hover:border-brand-yellow/80 text-xs font-bold rounded-xl transition-all duration-300 hover:scale-105 hover:shadow-lg"
                                        onClick={() => handleAddOnsClick(date, meal, 'Bakery')}
                                      >
                                        <span className="mr-2 text-lg">🥐</span>
                                        Bakery
                                      </Button>
                                      <Button
                                        size="sm"
                                        variant="outline"
                                        className="h-12 px-4 border-2 border-brand-yellow/60 text-brand-black hover:bg-gradient-to-r hover:from-brand-yellow/20 hover:to-brand-orange/20 hover:border-brand-yellow/80 text-xs font-bold rounded-xl transition-all duration-300 hover:scale-105 hover:shadow-lg"
                                        onClick={() => handleAddOnsClick(date, meal, 'Snacks')}
                                      >
                                        <span className="mr-2 text-lg">🍿</span>
                                        Snacks
                                      </Button>
                                      <Button
                                        size="sm"
                                        variant="outline"
                                        className="h-12 px-4 border-2 border-brand-yellow/60 text-brand-black hover:bg-gradient-to-r hover:from-brand-yellow/20 hover:to-brand-orange/20 hover:border-brand-yellow/80 text-xs font-bold rounded-xl transition-all duration-300 hover:scale-105 hover:shadow-lg"
                                        onClick={() => handleAddOnsClick(date, meal, 'Drinks')}
                                      >
                                        <span className="mr-2 text-lg">🥤</span>
                                        Drinks
                                      </Button>
                                      <Button
                                        size="sm"
                                        variant="outline"
                                        className="h-12 px-4 border-2 border-brand-yellow/60 text-brand-black hover:bg-gradient-to-r hover:from-brand-yellow/20 hover:to-brand-orange/20 hover:border-brand-yellow/80 text-xs font-bold rounded-xl transition-all duration-300 hover:scale-105 hover:shadow-lg"
                                        onClick={() => handleAddOnsClick(date, meal, 'Greek Yogurt Popsicle')}
                                      >
                                        <span className="mr-2 text-lg">🍦</span>
                                        Popsicle
                                      </Button>
                                    </div>
                                  </div>
                                  
                                  {/* Action Buttons */}
                                  <div className="flex gap-4">
                                    {meal.pdf_path && (
                                      <Button
                                        size="sm"
                                        variant="outline"
                                        className="flex-1 h-14 border-2 border-brand-blue/60 text-brand-blue hover:bg-gradient-to-r hover:from-brand-blue/10 hover:to-blue-500/10 hover:border-brand-blue/80 rounded-2xl font-bold transition-all duration-300 hover:scale-105 hover:shadow-lg"
                                        onClick={() => handleViewPdf(meal)}
                                        disabled={loadingPdf}
                                      >
                                        <FileText className="w-5 h-5 mr-2" />
                                        View PDF
                                      </Button>
                                    )}
                                    <Button
                                      size="sm"
                                      className="flex-1 h-14 bg-gradient-to-r from-brand-red via-brand-orange to-brand-red hover:from-brand-red/80 hover:via-brand-orange/80 hover:to-brand-red/80 text-white font-black rounded-2xl shadow-xl transition-all duration-300 hover:scale-105 hover:shadow-2xl hover:shadow-brand-orange/20"
                                      onClick={() => handlePreOrder(meal, date)}
                                      disabled={!isOrderingWindowOpen(date)}
                                    >
                                      {!isOrderingWindowOpen(date) ? "Order Closed" : "Order Now"}
                                    </Button>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              );
            })()}
          </div>
        ) : (
          <EmptyState message="No active weekly plan found for your school." />
        )}

        {/* Separate Daily Item Ordering Section */}
        <div className="mb-8 bg-white rounded-xl border border-brand-yellow/30 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-brand-black">Order Daily Items Separately</h2>
            <Button
              onClick={() => setShowAddOnOrderModal(true)}
              className="bg-gradient-to-r from-brand-red to-brand-orange hover:from-brand-red/90 hover:to-brand-orange/90 text-white"
            >
              Order Daily Items
            </Button>
          </div>
          
          <p className="text-sm text-gray-600 mb-4">
            You can order daily-items independently of meals. These will be available for pickup on the same day.
          </p>

          {/* Quick Daily Item Categories */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
            {['Bakery', 'Snacks', 'Drinks', 'Greek Yogurt Popsicle'].map((category) => (
              <div key={category} className="text-center p-3 bg-brand-yellow/10 rounded-lg border border-brand-yellow/30">
                <div className="text-sm font-medium text-brand-black">{category}</div>
                <div className="text-xs text-gray-600 mt-1">
                  {filteredDailyItems.filter(dailyItem => {
                    switch (category) {
                      case 'Bakery': return dailyItem.category === 'bakery';
                      case 'Snacks': return dailyItem.category === 'snacks';
                      case 'Drinks': return dailyItem.category === 'drinks';
                      case 'Greek Yogurt Popsicle': return dailyItem.category === 'greek_yoghurt_popsicle';
                      default: return false;
                    }
                  }).length} items
                </div>
              </div>
            ))}
          </div>
        </div>

        </div>

      {/* PDF Viewer Modal */}
      <Dialog open={showPdfModal} onOpenChange={setShowPdfModal}>
        <DialogContent className="max-w-4xl max-h-[90vh]">
          <DialogHeader>
            <DialogTitle>Meal PDF</DialogTitle>
          </DialogHeader>
          <div className="w-full h-[70vh]">
            {selectedPdfUrl && (
              <iframe
                src={selectedPdfUrl}
                className="w-full h-full border-0"
                title="Meal PDF"
              />
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Daily Items Modal - Talabat Style */}
      <Dialog open={showAddOnsModal} onOpenChange={setShowAddOnsModal}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader className="text-center">
            <DialogTitle className="text-2xl font-bold text-brand-black">
              🍽️ {selectedAddOnCategory} Items
            </DialogTitle>
            <p className="text-lg text-brand-black/70">
              {selectedMealForAddOns?.title || selectedMealForAddOns?.name}
            </p>
            <p className="text-sm text-brand-orange font-medium">
              {selectedDateForAddOns && format(selectedDateForAddOns, 'EEEE, MMMM dd, yyyy')}
            </p>
          </DialogHeader>
          
          <div className="space-y-4">
            {(() => {
              const categoryAddOns = filteredDailyItems.filter(dailyItem => {
                switch (selectedAddOnCategory) {
                  case 'Bakery':
                    return dailyItem.category === 'bakery';
                  case 'Snacks':
                    return dailyItem.category === 'snacks';
                  case 'Drinks':
                    return dailyItem.category === 'drinks';
                  case 'Greek Yogurt Popsicle':
                    return dailyItem.category === 'greek_yoghurt_popsicle';
                  default:
                    return true;
                }
              });

              return (
                <div className="grid grid-cols-2 gap-6 sm:gap-8">
                  {categoryAddOns.map((dailyItem) => (
                    <div key={dailyItem.id} className="bg-gradient-to-br from-white via-gray-50/50 to-white rounded-3xl border border-gray-200/60 hover:border-brand-orange/60 hover:shadow-2xl hover:shadow-brand-orange/10 transition-all duration-500 overflow-hidden group relative">
                      {/* Premium Glow Effect */}
                      <div className="absolute inset-0 bg-gradient-to-br from-brand-orange/5 via-transparent to-brand-red/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                      
                      {/* Item Content */}
                      <div className="p-6 relative z-10">
                        {/* Item Header */}
                        <div className="mb-5">
                          <h4 className="font-extrabold text-brand-black text-xl leading-tight line-clamp-2 mb-3 bg-gradient-to-r from-brand-black to-brand-black/80 bg-clip-text">
                            {dailyItem.name}
                          </h4>
                          {dailyItem.description && (
                            <p className="text-gray-600 text-sm leading-relaxed line-clamp-2 mb-4 font-medium">
                              {dailyItem.description}
                            </p>
                          )}
                        </div>
                        
                        {/* Price */}
                        <div className="mb-6">
                          <div className="bg-gradient-to-br from-brand-orange to-brand-red p-3 rounded-2xl shadow-lg">
                            <span className="text-3xl font-black text-white">
                              {formatCurrency(dailyItem.price)}
                            </span>
                          </div>
                        </div>
                        
                        {/* Quantity Controls */}
                        <div className="flex items-center justify-between mb-4">
                          <span className="text-sm font-medium text-brand-black">Quantity:</span>
                          <div className="flex items-center space-x-4">
                            <Button
                              size="sm"
                              variant="outline"
                              className="w-12 h-12 p-0 border-brand-orange text-brand-orange hover:bg-brand-orange/10 hover:border-brand-orange/600 rounded-xl transition-all duration-200 hover:scale-105"
                              onClick={() => {
                                setSelectedAddOns(prev => ({
                                  ...prev,
                                  [dailyItem.id]: Math.max(0, (prev[dailyItem.id] || 0) - 1)
                                }));
                              }}
                              disabled={!selectedAddOns[dailyItem.id] || selectedAddOns[dailyItem.id] === 0}
                            >
                              <span className="text-xl font-bold">−</span>
                            </Button>
                            <span className="w-16 text-center text-2xl font-bold text-brand-black">
                              {selectedAddOns[dailyItem.id] || 0}
                            </span>
                            <Button
                              size="sm"
                              variant="outline"
                              className="w-12 h-12 p-0 border-brand-orange text-brand-orange hover:bg-brand-orange/10 hover:border-brand-orange/600 rounded-xl transition-all duration-200 hover:scale-105"
                              onClick={() => {
                                setSelectedAddOns(prev => ({
                                  ...prev,
                                  [dailyItem.id]: (prev[dailyItem.id] || 0) + 1
                                }));
                              }}
                            >
                              <span className="text-xl font-bold">+</span>
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              );
            })()}
          </div>

          <div className="flex justify-between items-center pt-4 border-t">
            <div className="text-sm text-gray-600">
              Total: {formatCurrency(
                Object.entries(selectedAddOns).reduce((total, [addonId, quantity]) => {
                  const addon = dailyItems.find(a => a.id === parseInt(addonId));
                  return total + (addon ? addon.price * quantity : 0);
                }, 0)
              )}
            </div>
            <div className="space-x-2">
              <Button
                variant="outline"
                onClick={() => setShowAddOnsModal(false)}
              >
                Cancel
              </Button>
              <Button
                className="bg-gradient-to-r from-brand-red to-brand-orange hover:from-brand-red/90 hover:to-brand-orange/90 text-white"
                onClick={() => {
                  // Store selected daily-items for this meal
                  const selectedItems = Object.entries(selectedAddOns)
                    .filter(([_, quantity]) => quantity > 0)
                    .map(([addonId, quantity]) => ({
                      daily_item_id: parseInt(addonId),
                      quantity
                    }));
                  
                  if (selectedItems.length > 0 && selectedMealForAddOns && selectedDateForAddOns) {
                    // Create a unique key for this meal and date
                    const mealKey = `${selectedMealForAddOns.id}_${format(selectedDateForAddOns, 'yyyy-MM-dd')}`;
                    
                    // Store daily-items for this specific meal and date
                    setMealAddOns(prev => ({
                      ...prev,
                      [mealKey]: selectedItems
                    }));
                    
                    toast.success(`Selected ${selectedItems.length} ${selectedAddOnCategory.toLowerCase()} item(s) for ${selectedMealForAddOns?.title || selectedMealForAddOns?.name}. They will be included when you order this meal.`);
                  } else {
                    toast.info("No daily-items selected");
                  }
                  setShowAddOnsModal(false);
                }}
                disabled={Object.values(selectedAddOns).every(qty => qty === 0)}
              >
                Select Daily Items
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Daily Item Order Modal */}
      <Dialog open={showAddOnOrderModal} onOpenChange={setShowAddOnOrderModal}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-center text-brand-black">
              🍽️ Order Daily Items Separately
            </DialogTitle>
            <p className="text-sm text-gray-600 text-center">
              Select daily-items to order independently of meals
            </p>
          </DialogHeader>
          
          <div className="space-y-6">
            {/* Daily Item Categories */}
            {['Bakery', 'Snacks', 'Drinks', 'Greek Yogurt Popsicle'].map((category) => {
              const categoryAddOns = filteredDailyItems.filter(dailyItem => {
                switch (category) {
                  case 'Bakery': return dailyItem.category === 'bakery';
                  case 'Snacks': return dailyItem.category === 'snacks';
                  case 'Drinks': return dailyItem.category === 'drinks';
                  case 'Greek Yogurt Popsicle': return dailyItem.category === 'greek_yoghurt_popsicle';
                  default: return false;
                }
              });

              if (categoryAddOns.length === 0) return null;

              return (
                <div key={category} className="border border-gray-200 rounded-lg p-4">
                  <h3 className="text-lg font-semibold text-brand-black mb-3">{category}</h3>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-brand-yellow/30">
                          <th className="text-left p-3 text-sm font-semibold text-brand-black">Item</th>
                          <th className="text-center p-3 text-sm font-semibold text-brand-black">Price</th>
                          <th className="text-center p-3 text-sm font-semibold text-brand-black">Quantity</th>
                          <th className="text-center p-3 text-sm font-semibold text-brand-black">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {categoryAddOns.map((dailyItem) => (
                          <tr key={dailyItem.id} className="border-b border-brand-yellow/20 hover:bg-brand-yellow/5 transition-colors">
                            <td className="p-3">
                              <div>
                                <h4 className="font-semibold text-brand-black text-sm">{dailyItem.name}</h4>
                                {dailyItem.description && (
                                  <p className="text-xs text-brand-black/60 mt-1">{dailyItem.description}</p>
                                )}
                              </div>
                            </td>
                            <td className="p-3 text-center">
                              <span className="text-sm font-medium text-brand-orange">
                                {formatCurrency(dailyItem.price)}
                              </span>
                            </td>
                            <td className="p-3 text-center">
                              <span className="text-sm font-medium text-brand-black">
                                {selectedAddOnsForOrder[dailyItem.id] || 0}
                              </span>
                            </td>
                            <td className="p-3 text-center">
                              <div className="flex items-center justify-center space-x-2">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="w-7 h-7 p-0 border-brand-orange text-brand-orange hover:bg-brand-orange/10"
                                  onClick={() => {
                                    setSelectedAddOnsForOrder(prev => ({
                                      ...prev,
                                      [dailyItem.id]: Math.max(0, (prev[dailyItem.id] || 0) - 1)
                                    }));
                                  }}
                                  disabled={!selectedAddOnsForOrder[dailyItem.id] || selectedAddOnsForOrder[dailyItem.id] === 0}
                                >
                                  -
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="w-7 h-7 p-0 border-brand-orange text-brand-orange hover:bg-brand-orange/10"
                                  onClick={() => {
                                    setSelectedAddOnsForOrder(prev => ({
                                      ...prev,
                                      [dailyItem.id]: (prev[dailyItem.id] || 0) + 1
                                    }));
                                  }}
                                >
                                  +
                                </Button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              );
            })}

            {/* Order Summary and Actions */}
            <div className="border-t border-gray-200 pt-4">
              <div className="flex justify-between items-center mb-4">
                <div className="text-sm text-gray-600">
                  Total: {formatCurrency(
                    Object.entries(selectedAddOnsForOrder).reduce((total, [addonId, quantity]) => {
                      const addon = filteredDailyItems.find(a => a.id === parseInt(addonId));
                      return total + (addon ? addon.price * quantity : 0);
                    }, 0)
                  )}
                </div>
                <div className="space-x-2">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setShowAddOnOrderModal(false);
                      setSelectedAddOnsForOrder({});
                    }}
                  >
                    Cancel
                  </Button>
                  <Button
                    className="bg-gradient-to-r from-brand-red to-brand-orange hover:from-brand-red/90 hover:to-brand-orange/90 text-white"
                    onClick={handleAddOnOrder}
                    disabled={Object.values(selectedAddOnsForOrder).every(qty => qty === 0)}
                  >
                    Place Daily Item Order
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Order Confirmation Modal */}
      <Dialog open={showOrderConfirmationModal} onOpenChange={setShowOrderConfirmationModal}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-center text-green-600">
              ✅ Order Confirmed Successfully!
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            {orderConfirmationData && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <h3 className="font-semibold text-green-800 mb-3">Order Summary</h3>
                
                {/* Order Details */}
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Order ID:</span>
                    <span className="font-medium">#{orderConfirmationData.id || 'N/A'}</span>
                  </div>
                  
                  {orderConfirmationData.items && orderConfirmationData.items.map((item: any, index: number) => (
                    <div key={index} className="border-l-2 border-green-300 pl-3">
                      <div className="font-medium text-gray-800">
                        {item.meal?.name || item.meal?.title || item.add_on?.name || 'Item'}
                      </div>
                      <div className="text-gray-600">
                        Type: {item.meal ? 'Meal' : 'Daily Item'}
                      </div>
                      {item.meal_date && (
                        <div className="text-gray-600">
                          Date: {new Date(item.meal_date).toLocaleDateString()}
                        </div>
                      )}
                      <div className="text-gray-600">
                        Quantity: {item.quantity}
                      </div>
                      {item.meal && item.daily_items && item.daily_items.length > 0 && (
                        <div className="mt-1">
                          <div className="text-gray-600 text-xs">Daily Items:</div>
                                                      {item.daily_items.map((addon: any, addonIndex: number) => (
                              <div key={addonIndex} className="text-xs text-gray-500 ml-2">
                                • {addon.add_on?.name || 'Daily Item'} (x{addon.quantity})
                              </div>
                            ))}
                        </div>
                      )}
                    </div>
                  ))}
                  
                  {/* Handle daily-item only orders */}
                  {!orderConfirmationData.items && orderConfirmationData.add_on && (
                    <div className="border-l-2 border-green-300 pl-3">
                      <div className="font-medium text-gray-800">
                        {orderConfirmationData.add_on.name || 'Daily Item'}
                      </div>
                      <div className="text-gray-600">
                        Type: Daily Item
                      </div>
                      <div className="text-gray-600">
                        Quantity: {orderConfirmationData.quantity}
                      </div>
                      <div className="text-gray-600">
                        Unit Price: {formatCurrency(orderConfirmationData.unit_price)}
                      </div>
                    </div>
                  )}
                  
                  {orderConfirmationData.total_amount && (
                    <div className="border-t border-green-200 pt-2 mt-3">
                      <div className="flex justify-between font-semibold">
                        <span>Total Amount:</span>
                        <span className="text-green-700">
                          {formatCurrency(orderConfirmationData.total_amount)}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
            
            {/* Action Buttons */}
            <div className="flex flex-col space-y-3">
              <Button
                onClick={() => {
                  setShowOrderConfirmationModal(false);
                  navigate('/orders');
                }}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white"
              >
                View My Orders
              </Button>
              <Button
                onClick={() => setShowOrderConfirmationModal(false)}
                variant="outline"
                className="w-full"
              >
                Back to Menu
              </Button>
            </div>
            
            <div className="text-center text-sm text-gray-500">
              You can always view your previous orders with full details
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <BottomNavigation activeTab="planner" />
    </div>
  );
};

export default Planner;

