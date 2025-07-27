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
import { CalendarIcon, ShoppingCart, AlertCircle, ChevronLeft, ChevronRight, Info, Filter } from "lucide-react";
import BottomNavigation from "@/components/BottomNavigation";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";
import NotificationBell from "@/components/NotificationBell";
import LoadingSpinner from '@/components/common/LoadingSpinner';
import EmptyState from '@/components/common/EmptyState';

interface Meal {
  id: number;
  title: string;
  description?: string;
  price: number;
  calories: number;
  type: "breakfast" | "lunch" | "dinner";
  date: string;
  time: string;
  status: "available" | "sold_out" | "pre_ordered";
  category?: string;
  subcategory?: string;
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
  const [selectedType, setSelectedType] = useState<"all" | "breakfast" | "lunch" | "dinner">("all");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [selectedSubcategory, setSelectedSubcategory] = useState<string>("all");
  const [categories, setCategories] = useState<string[]>([]);
  const [subcategories, setSubcategories] = useState<string[]>([]);
  const [viewMode, setViewMode] = useState<'day' | 'week' | 'month' | 'custom'>('week');
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [addOns, setAddOns] = useState<AddOn[]>([]);

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

  const normalizedPlans = weeklyPlans?.data?.map((plan: any) => ({
    ...plan,
    meals: Array.isArray(plan.meals) ? plan.meals.map(normalizeMeal) : [],
  })) || [];

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

  // Helper to get all dates for the current week or month
  const getDatesForView = (plan: WeeklyPlan): Date[] => {
    if (!plan) return [];
    const allDates = getDatesForPlan(plan);
    if (viewMode === 'day') {
      return [selectedDate];
    } else if (viewMode === 'week') {
      const weekStart = startOfWeek(selectedDate, { weekStartsOn: 1 });
      const weekEnd = endOfWeek(selectedDate, { weekStartsOn: 1 });
      return allDates.filter(date => date >= weekStart && date <= weekEnd);
    } else if (viewMode === 'month') {
      const monthStart = startOfMonth(selectedDate);
      const monthEnd = endOfMonth(selectedDate);
      return allDates.filter(date => date >= monthStart && date <= monthEnd);
    }
    return allDates;
  };

  // Helper to move to previous/next week/month
  const goToPrev = () => {
    if (viewMode === 'week') setSelectedDate(prev => addDays(prev, -7));
    else if (viewMode === 'month') setSelectedDate(prev => addDays(startOfMonth(prev), -1));
    else setSelectedDate(prev => addDays(prev, -1));
  };
  const goToNext = () => {
    if (viewMode === 'week') setSelectedDate(prev => addDays(prev, 7));
    else if (viewMode === 'month') setSelectedDate(prev => addDays(endOfMonth(prev), 1));
    else setSelectedDate(prev => addDays(prev, 1));
  };

  // Find the active plan before using it in summary
  const activePlan = normalizedPlans.find((plan: WeeklyPlan) => {
    const start = parseISO(plan.start_date);
    const end = parseISO(plan.end_date);
    const today = new Date();
    return isDateInRange(today, start, end) && plan.is_active;
  });

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
    plannerApi.getMealCategories().then((res) => {
      setCategories(["all", ...res.data.categories.filter(Boolean)]);
    });
    plannerApi.getMealSubcategories().then((res) => {
      setSubcategories(["all", ...res.data.subcategories.filter(Boolean)]);
    });
    addOnApi.getAddOns().then((res) => {
      setAddOns(res.data.filter((addon: AddOn) => addon.is_active));
    });
  }, []);

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
          <Button onClick={() => refetch()} className="bg-blue-500 hover:bg-blue-600 text-white">
            Retry
          </Button>
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
    } else if (viewMode === 'month') {
      return format(selectedDate, 'MMMM yyyy');
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
          {['day', 'week', 'month', 'custom'].map(mode => (
            <Button
              key={mode}
              variant={viewMode === mode ? 'default' : 'outline'}
              size="sm"
              className={`${
                viewMode === mode 
                  ? 'bg-brand-red text-white border-brand-red hover:bg-brand-red/90' 
                  : 'bg-white text-brand-black border-brand-red hover:bg-brand-red/10'
              } rounded-full px-4 py-2 text-sm font-medium`}
              onClick={() => setViewMode(mode as 'day' | 'week' | 'month' | 'custom')}
            >
              {mode.charAt(0).toUpperCase() + mode.slice(1)}
            </Button>
          ))}
        </div>

        {/* Current Date Range */}
        <div className="mt-2 text-sm text-brand-black/70">
          {getCurrentDateRange()}
        </div>
      </div>

      {/* Content */}
      <div className="px-4 py-4">
        {/* Category Filter */}
        <div className="mb-6">
          <div className="flex flex-wrap gap-2">
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

        {/* Meal Planner Table */}
        {activePlan ? (
          <div className="mb-8">
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="border-b-2 border-brand-red">
                    <th className="text-left py-3 px-4 font-bold text-brand-black">Date</th>
                    <th className="text-left py-3 px-4 font-bold text-brand-black">Day</th>
                    <th className="text-left py-3 px-4 font-bold text-brand-black">Breakfast</th>
                    <th className="text-left py-3 px-4 font-bold text-brand-black">Lunch</th>
                  </tr>
                </thead>
                <tbody>
                  {getDatesForView(activePlan).map((date) => {
                    const dayOfWeek = getDay(date) === 0 ? 7 : getDay(date);
                    const breakfastMeals = getMealsForDay(dayOfWeek, [activePlan]).filter(meal => meal.type === 'breakfast');
                    const lunchMeals = getMealsForDay(dayOfWeek, [activePlan]).filter(meal => meal.type === 'lunch');
                    
                    if (breakfastMeals.length === 0 && lunchMeals.length === 0) {
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
                          {breakfastMeals.map((meal: MealWithPivot) => {
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
                          {lunchMeals.map((meal: MealWithPivot) => {
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
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
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
                        onClick={() => navigate('/add-ons')}
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

      <BottomNavigation activeTab="planner" />
    </div>
  );
};

export default Planner;
