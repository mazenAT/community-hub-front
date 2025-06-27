import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useMutation, useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { plannerApi, profileApi } from "@/services/api";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { format, parseISO, getDay, isAfter, isBefore, startOfDay, subDays, addDays, startOfWeek, endOfWeek, startOfMonth, endOfMonth, isSameDay, isSameWeek, isSameMonth } from "date-fns";
import { CalendarIcon, ShoppingCart, AlertCircle, ChevronLeft, ChevronRight, Info } from "lucide-react";
import BottomNavigation from "@/components/BottomNavigation";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";

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
    for (const order of plan.pre_orders || []) {
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
  const [viewMode, setViewMode] = useState<'day' | 'week' | 'month'>('week');
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());

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
    mutationFn: (mealId: number) => plannerApi.preOrderMeal(mealId),
    onSuccess: () => {
      toast.success("Meal pre-ordered successfully");
      // TODO: Optimistically update the pre-order status in the UI
      // In a real app, you might want to update the status of the specific meal
      // instead of refetching all plans.
      // refetch();
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Failed to pre-order meal");
    },
  });

  const handlePreOrder = (mealId: number) => {
    // Basic check before attempting to pre-order
    // More detailed checks (like status) would ideally be done before calling this function
     preOrderMutation.mutate(mealId);
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
  }, []);

  if (isLoadingProfile || isLoadingPlans) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
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

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Header */}
      <div className="bg-white px-4 py-4 sm:px-6 sm:py-6 border-b border-gray-100 shadow-sm">
        <div className="flex items-center space-x-3">
          <CalendarIcon className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600" />
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Weekly Meal Planner</h1>
            {activePlan ? (
                <p className="text-xs sm:text-sm text-gray-500 mt-1">Plan active from {format(parseISO(activePlan.start_date), 'MMM dd')} to {format(parseISO(activePlan.end_date), 'MMM dd')}</p>
            ) : (
                 <p className="text-xs sm:text-sm text-gray-500 mt-1">No active weekly plan found for your school.</p>
            )}
          </div>
        </div>
        {/* View Mode Toggle & Calendar */}
        <div className="mt-4 flex flex-wrap gap-2 items-center">
          {['day', 'week', 'month'].map(mode => (
            <Button
              key={mode}
              variant={viewMode === mode ? 'default' : 'outline'}
              className={viewMode === mode ? 'bg-blue-500 text-white' : ''}
              onClick={() => setViewMode(mode as 'day' | 'week' | 'month')}
            >
              {mode.charAt(0).toUpperCase() + mode.slice(1)}
            </Button>
          ))}
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className="ml-2 flex items-center gap-2">
                <CalendarIcon className="w-4 h-4" />
                {format(selectedDate, 'MMM dd, yyyy')}
              </Button>
            </PopoverTrigger>
            <PopoverContent align="start" className="w-auto p-0">
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={date => date && setSelectedDate(date)}
                initialFocus
              />
            </PopoverContent>
          </Popover>
          <Button variant="ghost" size="icon" onClick={goToPrev}><ChevronLeft /></Button>
          <Button variant="ghost" size="icon" onClick={goToNext}><ChevronRight /></Button>
          <span className="ml-4 text-sm text-gray-600">Today: <span className="font-semibold">{format(new Date(), 'MMM dd')}</span></span>
        </div>
        {/* Summary */}
        <div className="mt-2 flex items-center gap-4 text-sm text-gray-700">
          <span><b>{summary.count}</b> meals</span>
          <span>|</span>
          <span>Total: <b>{summary.total.toFixed(2)} EGP</b></span>
        </div>
      </div>

      {/* Content */}
      <div className="px-4 py-4 sm:px-6 sm:py-6">
        <div className="space-y-6">
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 sm:p-4">
            <div className="flex items-start space-x-2">
              <svg className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-xs sm:text-sm text-blue-800">
                <strong>Pre-order Notice:</strong> All meals must be ordered at least 24 hours in advance. 
                Orders close at 12 AM the day before.
              </p>
            </div>
          </div>

          {/* Type, Category, Subcategory Selection */}
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <Select value={selectedType} onValueChange={(value: "all" | "breakfast" | "lunch" | "dinner") => setSelectedType(value)}>
                <SelectTrigger className="h-12 bg-white">
                  <SelectValue placeholder="Select meal type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Meals</SelectItem>
                  <SelectItem value="breakfast">Breakfast</SelectItem>
                  <SelectItem value="lunch">Lunch</SelectItem>
                  <SelectItem value="dinner">Dinner</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex-1">
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger className="h-12 bg-white">
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((cat) => (
                    <SelectItem key={cat} value={cat}>{cat === "all" ? "All Categories" : cat}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex-1">
              <Select value={selectedSubcategory} onValueChange={setSelectedSubcategory}>
                <SelectTrigger className="h-12 bg-white">
                  <SelectValue placeholder="Select subcategory" />
                </SelectTrigger>
                <SelectContent>
                  {subcategories.map((subcat) => (
                    <SelectItem key={subcat} value={subcat}>{subcat === "all" ? "All Subcategories" : subcat}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Weekly Plan Display */}
          {activePlan ? (
            <ScrollArea className="h-[calc(100vh-300px)]">
              <div className="space-y-6">
                {getDatesForView(activePlan).map((date) => {
                  // date-fns getDay(): Sun=0, Mon=1... Our backend: Mon=1, Sun=7
                  const dayOfWeek = getDay(date) === 0 ? 7 : getDay(date);
                  const mealsForDay = activePlan.meals.filter(
                    (meal: MealWithPivot) => meal.pivot.day_of_week === dayOfWeek &&
                      (selectedType === "all" || meal.type === selectedType) &&
                      (selectedCategory === "all" || (meal.category && meal.category === selectedCategory)) &&
                      (selectedSubcategory === "all" || (meal.subcategory && meal.subcategory === selectedSubcategory))
                  );
                  // Don't render the day if there are no meals
                  if (mealsForDay.length === 0) {
                    return null;
                  }
                  const isToday = isSameDay(date, new Date());
                  return (
                    <div key={date.toISOString()} className="space-y-4">
                      <h2 className={`text-lg font-semibold ${isToday ? 'text-blue-600' : 'text-gray-900'}`}> 
                        {format(date, 'eeee')} - <span className="text-gray-500">{format(date, 'MMM dd')}</span>
                        {isToday && <span className="ml-2 px-2 py-0.5 rounded bg-blue-100 text-blue-700 text-xs">Today</span>}
                      </h2>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {mealsForDay.map((meal: MealWithPivot) => {
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
                          const stateInfo = {
                            pre_ordered: { tag: 'Pre-ordered', btn: 'Pre-ordered', color: 'bg-blue-100 text-blue-800', tooltip: 'You have already pre-ordered this meal.' },
                            sold_out: { tag: 'Sold Out', btn: 'Sold Out', color: 'bg-red-100 text-red-800', tooltip: 'This meal is sold out.' },
                            ordering_closed: { tag: 'Unavailable', btn: 'Ordering Closed', color: 'bg-gray-100 text-gray-800', tooltip: 'Ordering for this meal is closed.' },
                            available: { tag: 'Available', btn: 'Pre-order Now', color: 'bg-green-100 text-green-800', tooltip: 'You can pre-order this meal.' },
                          };
                          return (
                            <div key={meal.id} className="bg-white rounded-xl shadow-sm p-6 flex flex-col justify-between border border-gray-100 hover:shadow-md transition-shadow">
                              <div className="flex justify-between items-start mb-4">
                                <div>
                                  <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                                    {meal.title}
                                    <span className="ml-2 px-2 py-0.5 rounded bg-gray-100 text-gray-700 text-xs capitalize">{meal.type}</span>
                                  </h3>
                                  <div className="flex gap-2 mt-1">
                                    {meal.category && <span className="px-2 py-0.5 rounded bg-blue-50 text-blue-700 text-xs">{meal.category}</span>}
                                    {meal.subcategory && <span className="px-2 py-0.5 rounded bg-purple-50 text-purple-700 text-xs">{meal.subcategory}</span>}
                                  </div>
                                  <p className="text-sm text-gray-500 mt-1">{meal.time}</p>
                                </div>
                                <span className={`px-2 py-1 rounded-full text-xs font-medium ${stateInfo[displayState].color}`}>{stateInfo[displayState].tag}</span>
                              </div>
                              {meal.description && (
                                <p className="text-gray-600 mb-4">{meal.description}</p>
                              )}
                              <div className="space-y-2">
                                <div className="flex justify-between text-sm">
                                  <span className="text-gray-500">Calories:</span>
                                  <span className="text-gray-900">{meal.calories} cal</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                  <span className="text-gray-500">Price:</span>
                                  <span className="text-gray-900 font-medium">{meal.price.toFixed(2)} EGP</span>
                                </div>
                              </div>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button
                                    onClick={() => handlePreOrder(meal.id)}
                                    disabled={!canOrder || preOrderMutation.isPending}
                                    className={`w-full mt-4 ${canOrder ? "bg-blue-500 hover:bg-blue-600 text-white" : "bg-gray-100 text-gray-400 cursor-not-allowed"}`}
                                  >
                                    {displayState === 'available' ? (
                                      <>
                                        <ShoppingCart className="w-4 h-4 mr-2" />
                                        {stateInfo[displayState].btn}
                                      </>
                                    ) : (
                                      <>
                                        <Info className="w-4 h-4 mr-2" />
                                        {stateInfo[displayState].btn}
                                      </>
                                    )}
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>{stateInfo[displayState].tooltip}</TooltipContent>
                              </Tooltip>
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            </ScrollArea>
          ) : ( normalizedPlans && normalizedPlans.length > 0 && !activePlan ? (
             <div className="text-center py-12">
              <p className="text-gray-500">No active weekly plan found for your school for the current date.</p>
            </div>
          ) : (
             <div className="text-center py-12">
              <p className="text-gray-500">No weekly plans found for your school.</p>
            </div>
          ))
          }
        </div>
      </div>

      <BottomNavigation activeTab="planner" />
    </div>
  );
};

export default Planner;
