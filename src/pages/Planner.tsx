import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useMutation, useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { plannerApi, profileApi, addOnApi } from "@/services/api";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { format, parseISO, getDay, isAfter, isBefore, startOfDay, subDays, addDays, startOfWeek, endOfWeek, startOfMonth, endOfMonth, isSameDay, isSameWeek, isSameMonth } from "date-fns";
import { CalendarIcon, ShoppingCart, AlertCircle, ChevronLeft, ChevronRight, Info, Filter, FileText } from "lucide-react";
import BottomNavigation from "@/components/BottomNavigation";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";
import NotificationBell from "@/components/NotificationBell";
import LoadingSpinner from '@/components/common/LoadingSpinner';
import EmptyState from '@/components/common/EmptyState';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface Meal {
  id: number;
  title: string;
  description?: string;
  price: number;
  calories: number;
  type: "hot meal" | "sandwich" | "pasta" | "salad";
  date: string;
  time: string;
  status: "available" | "sold_out" | "pre_ordered";
  category?: string;
  subcategory?: string;
  pdf_path?: string;
}

// Define a more specific type for meals that come with weekly plan pivot data
type MealWithPivot = Meal & { pivot: { day_of_week: number } };

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
  pre_orders: PreOrder[];
}

interface AddOn {
  id: number;
  name: string;
  description?: string;
  price: number;
  is_active: boolean;
}

const isOrderingWindowOpen = (mealDate: Date): boolean => {
  // Rule: Orders must be placed before midnight of the day BEFORE the meal.
  // For a meal on Wednesday, the deadline is the start of Tuesday (Tuesday 00:00).
  const cutoffDate = startOfDay(subDays(mealDate, 1));
  return isBefore(new Date(), cutoffDate);
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
  const navigate = useNavigate();
  const [selectedType, setSelectedType] = useState<"all" | "hot meal" | "sandwich" | "pasta" | "salad">("all");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [selectedSubcategory, setSelectedSubcategory] = useState<string>("all");
  const [categories, setCategories] = useState<string[]>([]);
  const [subcategories, setSubcategories] = useState<string[]>([]);
  const [viewMode, setViewMode] = useState<'day' | 'week' | 'month' | 'custom' | 'next-week' | 'next-month'>('week');
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [customStartDate, setCustomStartDate] = useState<Date | undefined>(undefined);
  const [customEndDate, setCustomEndDate] = useState<Date | undefined>(undefined);
  const [addOns, setAddOns] = useState<AddOn[]>([]);
  const [showPdfModal, setShowPdfModal] = useState(false);
  const [selectedPdfUrl, setSelectedPdfUrl] = useState<string>('');
  const [loadingPdf, setLoadingPdf] = useState(false);
  const [allMeals, setAllMeals] = useState<Meal[]>([]);
  const [isLoadingMeals, setIsLoadingMeals] = useState(false);

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

  // Fetch all meals for filtering
  const { data: mealsData, isLoading: isLoadingMealsData, error: mealsError } = useQuery({
    queryKey: ["allMeals"],
    queryFn: () => plannerApi.getMeals({}),
    retry: 1,
  });

  // Extract categories and subcategories from all meals
  useEffect(() => {
    if (mealsData?.data) {
      const meals = mealsData.data;
      const uniqueCategories = Array.from(new Set(meals.map((meal: any) => meal.category).filter(Boolean))) as string[];
      const uniqueSubcategories = Array.from(new Set(meals.map((meal: any) => meal.subcategory).filter(Boolean))) as string[];
      
      setCategories(["all", ...uniqueCategories]);
      setSubcategories(["all", ...uniqueSubcategories]);
      setAllMeals(meals);
    }
  }, [mealsData]);

  const preOrderMutation = useMutation({
    mutationFn: (payload: any) => plannerApi.preOrderMeal(payload),
    onSuccess: () => {
      toast.success("Meal pre-ordered successfully");
      refetch(); // Update the UI after pre-order
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Failed to pre-order meal");
    },
  });

  const handlePreOrder = (meal: MealWithPivot, date: Date) => {
    if (!activePlan) return;
    const payload = {
      weekly_plan_id: activePlan.id,
      items: [
        {
          meal_id: meal.id,
          meal_date: format(date, 'yyyy-MM-dd'),
          quantity: 1,
        },
      ],
    };
    preOrderMutation.mutate(payload);
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

  const handleViewMealPlanPdf = async (mealPlan: WeeklyPlan) => {
    try {
      setLoadingPdf(true);
      const response = await plannerApi.getMealPlanPdf(mealPlan.id);
      if (response.data.pdf_url) {
        setSelectedPdfUrl(response.data.pdf_url);
        setShowPdfModal(true);
      } else {
        toast.error('No PDF available for this meal plan');
      }
    } catch (error) {
      toast.error('Failed to load meal plan PDF');
    } finally {
      setLoadingPdf(false);
    }
  };

  // Add normalization helper
  const normalizeMeal = (meal: any) => ({
    ...meal,
    title: meal.title || meal.name || "Meal",
    type: meal.type || "lunch", // fallback or infer if needed
    category: meal.category || "",
    subcategory: meal.subcategory || "",
    calories: meal.calories || 0,
    date: meal.date || "",
    time: meal.time || "",
    // Correctly map the 'available' boolean from the backend to the frontend status
    status: meal.available === false ? 'sold_out' : 'available',
  });

  const normalizedPlans = (() => {
    if (!weeklyPlans?.data) {
      console.log('No weekly plans data available');
      return [];
    }
    
    // Handle different possible data structures
    const plansData = Array.isArray(weeklyPlans.data) ? weeklyPlans.data : [weeklyPlans.data];
    
    return plansData.map((plan: any) => ({
      ...plan,
      meals: Array.isArray(plan.meals) ? plan.meals.map(normalizeMeal) : [],
    }));
  })();

  const getMealsForDay = (dayOfWeek: number, plans?: WeeklyPlan[]) => {
    if (!plans) return [];
    const activePlan = plans.find(plan => plan.is_active);
    if (!activePlan) return [];
    const mealsForDay = activePlan.meals.filter(meal => {
      const matchesDayOfWeek = meal.pivot.day_of_week === dayOfWeek;
      const matchesType = selectedType === "all" || meal.type === selectedType;
      const matchesCategory = selectedCategory === "all" || (meal.category && meal.category === selectedCategory);
      const matchesSubcategory = selectedSubcategory === "all" || (meal.subcategory && meal.subcategory === selectedSubcategory);
      return matchesDayOfWeek && matchesType && matchesCategory && matchesSubcategory;
    });
    return mealsForDay;
  };

  const daysOfWeek = [
    { name: 'Monday', dayOfWeek: 1 },
    { name: 'Tuesday', dayOfWeek: 2 },
    { name: 'Wednesday', dayOfWeek: 3 },
    { name: 'Thursday', dayOfWeek: 4 },
    { name: 'Friday', dayOfWeek: 5 },
    { name: 'Saturday', dayOfWeek: 6 },
    { name: 'Sunday', dayOfWeek: 7 },
  ];

  // Helper to compare only the date part (ignoring time and timezone)
  const isDateInRange = (date: Date, start: Date, end: Date) => {
    const d = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    const s = new Date(start.getFullYear(), start.getMonth(), start.getDate());
    const e = new Date(end.getFullYear(), end.getMonth(), end.getDate());
    return d >= s && d <= e;
  };

  // Helper to get all dates within a plan's range
  const getDatesForPlan = (plan: WeeklyPlan): Date[] => {
    const dates = [];
    let currentDate = parseISO(plan.start_date);
    const endDate = parseISO(plan.end_date);

    while (startOfDay(currentDate) <= startOfDay(endDate)) {
      dates.push(new Date(currentDate));
      currentDate = addDays(currentDate, 1);
    }
    return dates;
  };

  // Helper to get all dates for the current view mode
  const getDatesForView = (plan: WeeklyPlan): Date[] => {
    if (!plan) return [];
    const allDates = getDatesForPlan(plan);
    
    if (viewMode === 'day') {
      return [selectedDate];
    } else if (viewMode === 'week') {
      const weekStart = startOfWeek(selectedDate, { weekStartsOn: 1 });
      const weekEnd = endOfWeek(selectedDate, { weekStartsOn: 1 });
      return allDates.filter(date => date >= weekStart && date <= weekEnd);
    } else if (viewMode === 'next-week') {
      const nextWeekStart = startOfWeek(addDays(selectedDate, 7), { weekStartsOn: 1 });
      const nextWeekEnd = endOfWeek(addDays(selectedDate, 7), { weekStartsOn: 1 });
      return allDates.filter(date => date >= nextWeekStart && date <= nextWeekEnd);
    } else if (viewMode === 'month') {
      const monthStart = startOfMonth(selectedDate);
      const monthEnd = endOfMonth(selectedDate);
      return allDates.filter(date => date >= monthStart && date <= monthEnd);
    } else if (viewMode === 'next-month') {
      const nextMonth = new Date(selectedDate.getFullYear(), selectedDate.getMonth() + 1, 1);
      const nextMonthStart = startOfMonth(nextMonth);
      const nextMonthEnd = endOfMonth(nextMonth);
      return allDates.filter(date => date >= nextMonthStart && date <= nextMonthEnd);
    } else if (viewMode === 'custom' && customStartDate && customEndDate) {
      return allDates.filter(date => date >= customStartDate && date <= customEndDate);
    }
    return allDates;
  };

  // Helper to move to previous/next week/month
  const goToPrev = () => {
    if (viewMode === 'week' || viewMode === 'next-week') setSelectedDate(prev => addDays(prev, -7));
    else if (viewMode === 'month' || viewMode === 'next-month') setSelectedDate(prev => addDays(startOfMonth(prev), -1));
    else setSelectedDate(prev => addDays(prev, -1));
  };
  const goToNext = () => {
    if (viewMode === 'week' || viewMode === 'next-week') setSelectedDate(prev => addDays(prev, 7));
    else if (viewMode === 'month' || viewMode === 'next-month') setSelectedDate(prev => addDays(endOfMonth(prev), 1));
    else setSelectedDate(prev => addDays(prev, 1));
  };

  // Find the active plan before using it in summary
  const activePlan = normalizedPlans.find((plan: WeeklyPlan) => {
    const start = parseISO(plan.start_date);
    const end = parseISO(plan.end_date);
    const today = new Date();
    return isDateInRange(today, start, end) && plan.is_active;
  });

  // Debug logging to help understand data issues
  useEffect(() => {
    if (weeklyPlans?.data) {
      console.log('Weekly Plans Data:', weeklyPlans.data);
      console.log('Normalized Plans:', normalizedPlans);
      console.log('Active Plan:', activePlan);
      if (activePlan) {
        console.log('Active Plan Meals:', activePlan.meals);
        console.log('Dates for View:', getDatesForView(activePlan));
      }
    }
    if (mealsData?.data) {
      console.log('All Meals Data:', mealsData.data);
      console.log('Categories:', categories);
      console.log('Subcategories:', subcategories);
    }
    if (plansError) {
      console.error('Weekly plans error:', plansError);
    }
    if (mealsError) {
      console.error('Meals error:', mealsError);
    }
  }, [weeklyPlans, normalizedPlans, activePlan, plansError, mealsData, categories, subcategories, mealsError]);

  // Calculate summary for the current view
  const summary = (() => {
    if (!activePlan) return { count: 0, total: 0 };
    const dates = getDatesForView(activePlan);
    let count = 0;
    let total = 0;
    dates.forEach(date => {
      const dayOfWeek = getDay(date) === 0 ? 7 : getDay(date);
      const mealsForDay = activePlan.meals.filter(
        (meal: MealWithPivot) => meal.pivot.day_of_week === dayOfWeek &&
          (selectedType === "all" || meal.type === selectedType) &&
          (selectedCategory === "all" || (meal.category && meal.category === selectedCategory)) &&
          (selectedSubcategory === "all" || (meal.subcategory && meal.subcategory === selectedSubcategory))
      );
      count += mealsForDay.length;
      total += mealsForDay.reduce((sum: number, meal: MealWithPivot) => sum + meal.price, 0);
    });
    return { count, total };
  })();

  useEffect(() => {
    // Handle add-ons with error handling
    addOnApi.getAddOns()
      .then((res) => {
        setAddOns(res.data.filter((addon: AddOn) => addon.is_active));
      })
      .catch((error) => {
        console.warn('Failed to load add-ons:', error);
        setAddOns([]);
      });
  }, []);

  // Replace loading spinner in loading state
  if (isLoadingProfile || isLoadingPlans || isLoadingMealsData) {
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

  if (plansError || mealsError) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center p-6">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Error Loading Data</h2>
          <p className="text-gray-600 mb-4">
            {plansError && mealsError 
              ? "There was a problem loading both weekly plans and meals data." 
              : plansError 
                ? "There was a problem loading the weekly plans." 
                : "There was a problem loading meals data."
            } Please try again.
          </p>
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

  // Get current date range for display
  const getCurrentDateRange = () => {
    if (viewMode === 'day') {
      return format(selectedDate, 'MMMM dd, yyyy');
    } else if (viewMode === 'week') {
      const weekStart = startOfWeek(selectedDate, { weekStartsOn: 1 });
      const weekEnd = endOfWeek(selectedDate, { weekStartsOn: 1 });
      return `${format(weekStart, 'MMMM dd')} - ${format(weekEnd, 'MMMM dd, yyyy')}`;
    } else if (viewMode === 'next-week') {
      const nextWeekStart = startOfWeek(addDays(selectedDate, 7), { weekStartsOn: 1 });
      const nextWeekEnd = endOfWeek(addDays(selectedDate, 7), { weekStartsOn: 1 });
      return `${format(nextWeekStart, 'MMMM dd')} - ${format(nextWeekEnd, 'MMMM dd, yyyy')}`;
    } else if (viewMode === 'month') {
      return format(selectedDate, 'MMMM yyyy');
    } else if (viewMode === 'next-month') {
      const nextMonth = new Date(selectedDate.getFullYear(), selectedDate.getMonth() + 1, 1);
      return format(nextMonth, 'MMMM yyyy');
    } else if (viewMode === 'custom' && customStartDate && customEndDate) {
      return `${format(customStartDate, 'MMMM dd')} - ${format(customEndDate, 'MMMM dd, yyyy')}`;
    }
    return format(selectedDate, 'MMMM dd, yyyy');
  };

  return (
    <div className="min-h-screen bg-brand-yellow/5 pb-20">
      {/* Header */}
      <div className="bg-white px-4 py-4 border-b-2 border-brand-red">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-brand-black">Meal Planner</h1>
          <div className="flex items-center space-x-2">
            <Filter className="w-5 h-5 text-brand-red" />
            <NotificationBell />
          </div>
        </div>

        {/* Date Range Selection */}
        <div className="mt-4 flex flex-wrap gap-2">
          {[
            { key: 'day', label: 'Today' },
            { key: 'week', label: 'This Week' },
            { key: 'next-week', label: 'Next Week' },
            { key: 'month', label: 'This Month' },
            { key: 'next-month', label: 'Next Month' },
            { key: 'custom', label: 'Custom Range' }
          ].map(({ key, label }) => (
            <Button
              key={key}
              variant={viewMode === key ? 'default' : 'outline'}
              size="sm"
              className={`${
                viewMode === key 
                  ? 'bg-brand-red text-white border-brand-red hover:bg-brand-red/90' 
                  : 'bg-white text-brand-black border-brand-red hover:bg-brand-red/10'
              } rounded-full px-4 py-2 text-sm font-medium`}
              onClick={() => {
                setViewMode(key as 'day' | 'week' | 'month' | 'custom' | 'next-week' | 'next-month');
                if (key === 'custom') {
                  setCustomStartDate(undefined);
                  setCustomEndDate(undefined);
                }
              }}
            >
              {label}
            </Button>
          ))}
        </div>

        {/* Custom Date Range Picker */}
        {viewMode === 'custom' && (
          <div className="mt-4 flex flex-wrap gap-2 items-center">
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className="bg-white text-brand-black border-brand-yellow/30 hover:bg-brand-yellow/10"
                >
                  <CalendarIcon className="w-4 h-4 mr-2" />
                  {customStartDate ? format(customStartDate, 'MMM dd') : 'Start Date'}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={customStartDate}
                  onSelect={setCustomStartDate}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
            
            <span className="text-brand-black/70">to</span>
            
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className="bg-white text-brand-black border-brand-yellow/30 hover:bg-brand-yellow/10"
                >
                  <CalendarIcon className="w-4 h-4 mr-2" />
                  {customEndDate ? format(customEndDate, 'MMM dd') : 'End Date'}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={customEndDate}
                  onSelect={setCustomEndDate}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>
        )}

        {/* Current Date Range */}
        <div className="mt-2 text-sm text-brand-black/70">
          {getCurrentDateRange()}
        </div>

        {/* Pre-Order Warning Message */}
        {activePlan && (
          <div className="mt-4 p-3 bg-brand-yellow/20 border border-brand-yellow/30 rounded-lg">
            <div className="flex items-start space-x-2">
              <AlertCircle className="w-5 h-5 text-brand-red mt-0.5 flex-shrink-0" />
              <div className="text-sm text-brand-black">
                <p className="font-medium mb-1">Pre-Order Deadline</p>
                <p>Orders must be placed before <strong>12:00 AM (midnight)</strong> the day before each meal. After this time, ordering will be closed for that meal.</p>
              </div>
            </div>
          </div>
        )}

        {/* Debug Info */}
        <div className="mt-4 p-3 bg-gray-100 border border-gray-300 rounded-lg">
          <div className="text-sm text-gray-700">
            <p><strong>Debug Info:</strong></p>
            <p>School ID: {schoolId || 'Not loaded'}</p>
            <p>Weekly Plans Loading: {isLoadingPlans ? 'Yes' : 'No'}</p>
            <p>Weekly Plans Error: {plansError ? 'Yes' : 'No'}</p>
            <p>Weekly Plans Data: {weeklyPlans?.data ? 'Available' : 'Not available'}</p>
            <p>Active Plan: {activePlan ? 'Found' : 'Not found'}</p>
            <p>All Meals Loading: {isLoadingMealsData ? 'Yes' : 'No'}</p>
            <p>All Meals Error: {mealsError ? 'Yes' : 'No'}</p>
            <p>All Meals Data: {mealsData?.data ? `${mealsData.data.length} meals` : 'Not available'}</p>
            <p>Categories: {categories.length > 1 ? categories.slice(1).join(', ') : 'None'}</p>
            <p>Subcategories: {subcategories.length > 1 ? subcategories.slice(1).join(', ') : 'None'}</p>
            {plansError && (
              <p className="text-red-600">Plans Error: {JSON.stringify(plansError)}</p>
            )}
            {mealsError && (
              <p className="text-red-600">Meals Error: {JSON.stringify(mealsError)}</p>
            )}
            <div className="mt-2 space-x-2">
              <Button 
                size="sm" 
                onClick={() => refetch()}
                className="bg-blue-500 text-white hover:bg-blue-600"
              >
                Retry Load Plans
              </Button>
              <Button 
                size="sm" 
                onClick={() => window.location.reload()}
                className="bg-green-500 text-white hover:bg-green-600"
              >
                Reload Page
              </Button>
            </div>
          </div>
        </div>
      </div>



      {/* Content */}
      <div className="px-4 py-4">
        {/* Meal Type and Category Filters */}
        <div className="mb-6 space-y-4">
          {/* Meal Type Filter */}
          <div>
            <h3 className="text-sm font-semibold text-brand-black mb-2">Meal Type</h3>
            <div className="flex flex-wrap gap-2">
              {[
                { key: 'all', label: 'All Meals' },
                { key: 'hot meal', label: 'Hot Meal' },
                { key: 'sandwich', label: 'Sandwich' },
                { key: 'pasta', label: 'Pasta' },
                { key: 'salad', label: 'Salad' }
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
                  onClick={() => setSelectedType(key as 'all' | 'hot meal' | 'sandwich' | 'pasta' | 'salad')}
                >
                  {label}
                </Button>
              ))}
            </div>
          </div>

          {/* Category Filter */}
          {categories.length > 1 && (
            <div>
              <h3 className="text-sm font-semibold text-brand-black mb-2">Meal Categories</h3>
              <div className="flex flex-wrap gap-2">
                <Button
                  variant={selectedCategory === 'all' ? 'default' : 'outline'}
                  size="sm"
                  className={`${
                    selectedCategory === 'all' 
                      ? 'bg-brand-orange text-white border-brand-orange hover:bg-brand-orange/90' 
                      : 'bg-white text-brand-black border-brand-orange hover:bg-brand-orange/10'
                  } rounded-full px-3 py-1 text-xs font-medium`}
                  onClick={() => setSelectedCategory('all')}
                >
                  All Categories
                </Button>
                {categories.filter(cat => cat !== 'all').map((category) => (
                  <Button
                    key={category}
                    variant={selectedCategory === category ? 'default' : 'outline'}
                    size="sm"
                    className={`${
                      selectedCategory === category 
                        ? 'bg-brand-orange text-white border-brand-orange hover:bg-brand-orange/90' 
                        : 'bg-white text-brand-black border-brand-orange hover:bg-brand-orange/10'
                    } rounded-full px-3 py-1 text-xs font-medium`}
                    onClick={() => setSelectedCategory(category)}
                  >
                    {category}
                  </Button>
                ))}
              </div>
            </div>
          )}

          {/* Subcategory Filter */}
          {subcategories.length > 1 && selectedCategory !== 'all' && (
            <div>
              <h3 className="text-sm font-semibold text-brand-black mb-2">Subcategories</h3>
              <div className="flex flex-wrap gap-2">
                <Button
                  variant={selectedSubcategory === 'all' ? 'default' : 'outline'}
                  size="sm"
                  className={`${
                    selectedSubcategory === 'all' 
                      ? 'bg-brand-yellow text-brand-black border-brand-yellow hover:bg-brand-yellow/90' 
                      : 'bg-white text-brand-black border-brand-yellow hover:bg-brand-yellow/10'
                  } rounded-full px-3 py-1 text-xs font-medium`}
                  onClick={() => setSelectedSubcategory('all')}
                >
                  All Subcategories
                </Button>
                {subcategories.filter(sub => sub !== 'all').map((subcategory) => (
                  <Button
                    key={subcategory}
                    variant={selectedSubcategory === subcategory ? 'default' : 'outline'}
                    size="sm"
                    className={`${
                      selectedSubcategory === subcategory 
                        ? 'bg-brand-yellow text-brand-black border-brand-yellow hover:bg-brand-yellow/90' 
                        : 'bg-white text-brand-black border-brand-yellow hover:bg-brand-yellow/10'
                    } rounded-full px-3 py-1 text-xs font-medium`}
                    onClick={() => setSelectedSubcategory(subcategory)}
                  >
                    {subcategory}
                  </Button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Show Plans Button */}
        {activePlan && (
          <div className="mb-6 flex justify-center">
            <Button
              variant="outline"
              size="lg"
              className="bg-brand-yellow text-brand-black border-brand-yellow hover:bg-brand-yellow/90 rounded-full px-6 py-3 font-medium"
              onClick={() => handleViewMealPlanPdf(activePlan)}
              disabled={loadingPdf}
            >
              <FileText className="w-5 h-5 mr-2" />
              Show Plans
            </Button>
          </div>
        )}

        {/* Meal Planner Table */}
        {activePlan ? (
          <div className="mb-8">
            {(() => {
              const datesWithMeals = getDatesForView(activePlan).filter((date) => {
                const dayOfWeek = getDay(date) === 0 ? 7 : getDay(date);
                const hotMeals = getMealsForDay(dayOfWeek, [activePlan]).filter(meal => meal.type === 'hot meal');
                const sandwiches = getMealsForDay(dayOfWeek, [activePlan]).filter(meal => meal.type === 'sandwich');
                const pastas = getMealsForDay(dayOfWeek, [activePlan]).filter(meal => meal.type === 'pasta');
                const salads = getMealsForDay(dayOfWeek, [activePlan]).filter(meal => meal.type === 'salad');
                return hotMeals.length > 0 || sandwiches.length > 0 || pastas.length > 0 || salads.length > 0;
              });

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
                          setSelectedCategory("all");
                          setSelectedSubcategory("all");
                          setViewMode("week");
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
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="border-b-2 border-brand-red">
                        <th className="text-left py-3 px-4 font-bold text-brand-black">Date</th>
                        <th className="text-left py-3 px-4 font-bold text-brand-black">Day</th>
                        <th className="text-left py-3 px-4 font-bold text-brand-black">Hot Meals</th>
                        <th className="text-left py-3 px-4 font-bold text-brand-black">Sandwiches</th>
                        <th className="text-left py-3 px-4 font-bold text-brand-black">Pasta</th>
                        <th className="text-left py-3 px-4 font-bold text-brand-black">Salads</th>
                      </tr>
                    </thead>
                    <tbody>
                      {datesWithMeals.map((date) => {
                        const dayOfWeek = getDay(date) === 0 ? 7 : getDay(date);
                        const hotMeals = getMealsForDay(dayOfWeek, [activePlan]).filter(meal => meal.type === 'hot meal');
                        const sandwiches = getMealsForDay(dayOfWeek, [activePlan]).filter(meal => meal.type === 'sandwich');
                        const pastas = getMealsForDay(dayOfWeek, [activePlan]).filter(meal => meal.type === 'pasta');
                        const salads = getMealsForDay(dayOfWeek, [activePlan]).filter(meal => meal.type === 'salad');
                        
                        if (hotMeals.length === 0 && sandwiches.length === 0 && pastas.length === 0 && salads.length === 0) {
                          return null;
                        }

                        const isToday = isSameDay(date, new Date());
                        
                        return (
                          <tr key={date.toISOString()} className="border-b border-brand-yellow/30">
                            <td className="py-4 px-4 text-sm text-brand-black/70">
                              {format(date, 'dd/MM')}
                            </td>
                            <td className="py-4 px-4 text-sm font-medium text-brand-black">
                              {format(date, 'EEEE')}
                            </td>
                            <td className="py-4 px-4">
                              {hotMeals.map((meal: MealWithPivot) => {
                                const isWindowOpen = isOrderingWindowOpen(date);
                                const existingPreOrder = findPreOrderForMeal(meal.id, date, normalizedPlans);
                                let displayState: 'pre_ordered' | 'sold_out' | 'ordering_closed' | 'available';
                                if (existingPreOrder) {
                                  displayState = 'pre_ordered';
                                } else if (meal.status === 'sold_out') {
                                  displayState = 'sold_out';
                                } else if (!isWindowOpen) {
                                  displayState = 'ordering_closed';
                                } else {
                                  displayState = 'available';
                                }
                                const canOrder = displayState === 'available';

                                return (
                                  <div key={meal.id} className="mb-3 p-3 bg-brand-yellow/20 rounded-lg border border-brand-yellow/30">
                                    <div className="flex justify-between items-start mb-2">
                                      <h3 className="font-medium text-brand-black">{meal.title}</h3>
                                      <span className="px-2 py-1 rounded-full text-xs font-medium bg-brand-orange text-white">
                                        {meal.category || 'Healthy'}
                                      </span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                      <span className="text-sm font-medium text-brand-black">${meal.price.toFixed(2)}</span>
                                      <div className="flex space-x-2">
                                        {meal.pdf_path && (
                                          <Button
                                            size="sm"
                                            variant="outline"
                                            className="border-brand-blue text-brand-blue hover:bg-brand-blue/10 rounded-full px-3 py-1 text-xs"
                                            onClick={() => handleViewPdf(meal)}
                                            disabled={loadingPdf}
                                          >
                                            <FileText className="w-3 h-3 mr-1" />
                                            PDF
                                          </Button>
                                        )}
                                        <Button
                                          size="sm"
                                          variant="outline"
                                          className={`${
                                            canOrder 
                                              ? 'border-brand-red text-brand-red hover:bg-brand-red/10' 
                                              : 'border-gray-300 text-gray-400 cursor-not-allowed'
                                          } rounded-full px-3 py-1 text-xs`}
                                          onClick={() => handlePreOrder(meal, date)}
                                          disabled={!canOrder || preOrderMutation.isPending}
                                        >
                                          {displayState === 'available' ? 'Order' : 'Unavailable'}
                                        </Button>
                                      </div>
                                    </div>
                                  </div>
                                );
                              })}
                            </td>
                            <td className="py-4 px-4">
                              {sandwiches.map((meal: MealWithPivot) => {
                                const isWindowOpen = isOrderingWindowOpen(date);
                                const existingPreOrder = findPreOrderForMeal(meal.id, date, normalizedPlans);
                                let displayState: 'pre_ordered' | 'sold_out' | 'ordering_closed' | 'available';
                                if (existingPreOrder) {
                                  displayState = 'pre_ordered';
                                } else if (meal.status === 'sold_out') {
                                  displayState = 'sold_out';
                                } else if (!isWindowOpen) {
                                  displayState = 'ordering_closed';
                                } else {
                                  displayState = 'available';
                                }
                                const canOrder = displayState === 'available';

                                return (
                                  <div key={meal.id} className="mb-3 p-3 bg-brand-yellow/20 rounded-lg border border-brand-yellow/30">
                                    <div className="flex justify-between items-start mb-2">
                                      <h3 className="font-medium text-brand-black">{meal.title}</h3>
                                      <span className="px-2 py-1 rounded-full text-xs font-medium bg-brand-orange text-white">
                                        {meal.category || 'Protein'}
                                      </span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                      <span className="text-sm font-medium text-brand-black">${meal.price.toFixed(2)}</span>
                                      <Button
                                        size="sm"
                                        variant="outline"
                                        className={`${
                                          canOrder 
                                            ? 'border-brand-red text-brand-red hover:bg-brand-red/10' 
                                            : 'border-gray-300 text-gray-400 cursor-not-allowed'
                                        } rounded-full px-3 py-1 text-xs`}
                                        onClick={() => handlePreOrder(meal, date)}
                                        disabled={!canOrder || preOrderMutation.isPending}
                                      >
                                        {displayState === 'available' ? 'Order' : 'Unavailable'}
                                      </Button>
                                    </div>
                                  </div>
                                );
                              })}
                            </td>
                            <td className="py-4 px-4">
                              {pastas.map((meal: MealWithPivot) => {
                                const isWindowOpen = isOrderingWindowOpen(date);
                                const existingPreOrder = findPreOrderForMeal(meal.id, date, normalizedPlans);
                                let displayState: 'pre_ordered' | 'sold_out' | 'ordering_closed' | 'available';
                                if (existingPreOrder) {
                                  displayState = 'pre_ordered';
                                } else if (meal.status === 'sold_out') {
                                  displayState = 'sold_out';
                                } else if (!isWindowOpen) {
                                  displayState = 'ordering_closed';
                                } else {
                                  displayState = 'available';
                                }
                                const canOrder = displayState === 'available';

                                return (
                                  <div key={meal.id} className="mb-3 p-3 bg-brand-yellow/20 rounded-lg border border-brand-yellow/30">
                                    <div className="flex justify-between items-start mb-2">
                                      <h3 className="font-medium text-brand-black">{meal.title}</h3>
                                      <span className="px-2 py-1 rounded-full text-xs font-medium bg-brand-orange text-white">
                                        {meal.category || 'Pasta'}
                                      </span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                      <span className="text-sm font-medium text-brand-black">${meal.price.toFixed(2)}</span>
                                      <div className="flex space-x-2">
                                        {meal.pdf_path && (
                                          <Button
                                            size="sm"
                                            variant="outline"
                                            className="border-brand-blue text-brand-blue hover:bg-brand-blue/10 rounded-full px-3 py-1 text-xs"
                                            onClick={() => handleViewPdf(meal)}
                                            disabled={loadingPdf}
                                          >
                                            <FileText className="w-3 h-3 mr-1" />
                                            PDF
                                          </Button>
                                        )}
                                        <Button
                                          size="sm"
                                          variant="outline"
                                          className={`${
                                            canOrder 
                                              ? 'border-brand-red text-brand-red hover:bg-brand-red/10' 
                                              : 'border-gray-300 text-gray-400 cursor-not-allowed'
                                          } rounded-full px-3 py-1 text-xs`}
                                          onClick={() => handlePreOrder(meal, date)}
                                          disabled={!canOrder || preOrderMutation.isPending}
                                        >
                                          {displayState === 'available' ? 'Order' : 'Unavailable'}
                                        </Button>
                                      </div>
                                    </div>
                                  </div>
                                );
                              })}
                            </td>
                            <td className="py-4 px-4">
                              {salads.map((meal: MealWithPivot) => {
                                const isWindowOpen = isOrderingWindowOpen(date);
                                const existingPreOrder = findPreOrderForMeal(meal.id, date, normalizedPlans);
                                let displayState: 'pre_ordered' | 'sold_out' | 'ordering_closed' | 'available';
                                if (existingPreOrder) {
                                  displayState = 'pre_ordered';
                                } else if (meal.status === 'sold_out') {
                                  displayState = 'sold_out';
                                } else if (!isWindowOpen) {
                                  displayState = 'ordering_closed';
                                } else {
                                  displayState = 'available';
                                }
                                const canOrder = displayState === 'available';

                                return (
                                  <div key={meal.id} className="mb-3 p-3 bg-brand-yellow/20 rounded-lg border border-brand-yellow/30">
                                    <div className="flex justify-between items-start mb-2">
                                      <h3 className="font-medium text-brand-black">{meal.title}</h3>
                                      <span className="px-2 py-1 rounded-full text-xs font-medium bg-brand-orange text-white">
                                        {meal.category || 'Salad'}
                                      </span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                      <span className="text-sm font-medium text-brand-black">${meal.price.toFixed(2)}</span>
                                      <div className="flex space-x-2">
                                        {meal.pdf_path && (
                                          <Button
                                            size="sm"
                                            variant="outline"
                                            className="border-brand-blue text-brand-blue hover:bg-brand-blue/10 rounded-full px-3 py-1 text-xs"
                                            onClick={() => handleViewPdf(meal)}
                                            disabled={loadingPdf}
                                          >
                                            <FileText className="w-3 h-3 mr-1" />
                                            PDF
                                          </Button>
                                        )}
                                        <Button
                                          size="sm"
                                          variant="outline"
                                          className={`${
                                            canOrder 
                                              ? 'border-brand-red text-brand-red hover:bg-brand-red/10' 
                                              : 'border-gray-300 text-gray-400 cursor-not-allowed'
                                          } rounded-full px-3 py-1 text-xs`}
                                          onClick={() => handlePreOrder(meal, date)}
                                          disabled={!canOrder || preOrderMutation.isPending}
                                        >
                                          {displayState === 'available' ? 'Order' : 'Unavailable'}
                                        </Button>
                                      </div>
                                    </div>
                                  </div>
                                );
                              })}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              );
            })()}
          </div>
        ) : (
          <EmptyState message="No active weekly plan found for your school." />
        )}

        {/* Available Add-ons Section */}
        <div className="mt-8">
          <h2 className="text-lg font-bold text-brand-black mb-4">Available Add-ons</h2>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b-2 border-brand-red">
                  <th className="text-left py-3 px-4 font-bold text-brand-black">Item</th>
                  <th className="text-left py-3 px-4 font-bold text-brand-black">Description</th>
                  <th className="text-left py-3 px-4 font-bold text-brand-black">Price</th>
                  <th className="text-left py-3 px-4 font-bold text-brand-black">Action</th>
                </tr>
              </thead>
              <tbody>
                {addOns.map((addon) => (
                  <tr key={addon.id} className="border-b border-brand-yellow/30">
                    <td className="py-4 px-4 text-sm font-medium text-brand-black">
                      {addon.name}
                    </td>
                    <td className="py-4 px-4 text-sm text-brand-black/70">
                      {addon.description || 'Additional item'}
                    </td>
                    <td className="py-4 px-4 text-sm font-medium text-brand-black">
                      ${addon.price.toFixed(2)}
                    </td>
                    <td className="py-4 px-4">
                      <Button
                        size="sm"
                        variant="outline"
                        className="border-brand-red text-brand-red hover:bg-brand-red/10 rounded-full px-3 py-1 text-xs"
                        onClick={() => {
                          // Handle add-on ordering directly here
                          toast.success(`${addon.name} added to order!`);
                        }}
                      >
                        Order
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
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

      <BottomNavigation activeTab="planner" />
    </div>
  );
};

export default Planner;
