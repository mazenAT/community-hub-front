import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useMutation, useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { plannerApi, profileApi, addOnApi, familyMembersApi } from "@/services/api";
import { format, parseISO, getDay, isBefore, startOfDay, subDays, addDays, startOfWeek, endOfWeek, startOfMonth, endOfMonth, isSameDay } from "date-fns";
import { CalendarIcon, AlertCircle, Filter, FileText, ChevronDown, Users } from "lucide-react";
import BottomNavigation from "@/components/BottomNavigation";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import NotificationBell from "@/components/NotificationBell";
import LoadingSpinner from '@/components/common/LoadingSpinner';
import EmptyState from '@/components/common/EmptyState';
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

interface AddOn {
  id: number;
  name: string;
  description?: string;
  price: number;
  is_active: boolean;
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
  const [selectedAddOnType, setSelectedAddOnType] = useState<"all" | "drinks" | "sides" | "condiments" | "desserts">("all");
  const [selectedAddOnPriceRange, setSelectedAddOnPriceRange] = useState<"all" | "low" | "medium" | "high">("all");
  const [addOnSearchTerm, setAddOnSearchTerm] = useState<string>("");
  const [familyMembers, setFamilyMembers] = useState<FamilyMember[]>([]);
  const [selectedFamilyMember, setSelectedFamilyMember] = useState<string>("");
  const [selectedWeek, setSelectedWeek] = useState<string>("1");

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
      
      const uniqueCategories = Array.from(new Set(allMealsFromPlans.map((meal: any) => meal.category).filter(Boolean))) as string[];
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

  // Filter add-ons based on selected filters (Frontend-only filtering)
  const filteredAddOns = addOns.filter((addon) => {
    // Filter by search term
    const addonName = addon.name.toLowerCase();
    const addonDescription = (addon.description || '').toLowerCase();
    const searchText = `${addonName} ${addonDescription}`;
    
    const searchMatch = !addOnSearchTerm || searchText.includes(addOnSearchTerm.toLowerCase());
    
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
      (selectedAddOnPriceRange === "low" && addon.price <= 1.00) ||
      (selectedAddOnPriceRange === "medium" && addon.price > 1.00 && addon.price <= 3.00) ||
      (selectedAddOnPriceRange === "high" && addon.price > 3.00);

    return searchMatch && typeMatch && priceMatch;
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
    
    if (!selectedFamilyMember) {
      toast.error("Please select a family member before placing an order");
      return;
    }
    
    const payload = {
      weekly_plan_id: activePlan.id,
      family_member_id: parseInt(selectedFamilyMember),
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
    type: meal.type || meal.category || "hot meal", // Use category as type if type is not available
    category: meal.category || "",
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
      console.log('No weekly plans data available');
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

  const getMealsForDay = (date: Date, plans?: WeeklyPlan[]) => {
    if (!plans) return [];
    const activePlan = plans.find(plan => plan.is_active);
    if (!activePlan) return [];
    
    // Format date as YYYY-MM-DD to match the API structure
    const dateKey = format(date, 'yyyy-MM-dd');
    
    // Check if we have meals_by_day structure (for monthly plans)
    if (activePlan.meals_by_day && activePlan.meals_by_day[dateKey]) {
      const mealsForDay = activePlan.meals_by_day[dateKey].filter((meal: any) => {
        const matchesType = selectedType === "all" || meal.type === selectedType;
        return matchesType;
      });
      return mealsForDay;
    }
    
    // For weekly plans: map day_of_week to calendar date
    const dayOfWeek = getDay(date) === 0 ? 7 : getDay(date); // Convert Sunday=0 to Sunday=7
    
    const allMeals = activePlan.meals || [];
    const mealsForDay = allMeals.filter((meal: any) => {
      const matchesType = selectedType === "all" || meal.type === selectedType;
      const matchesDayOfWeek = meal.pivot?.day_of_week === dayOfWeek;
      return matchesType && matchesDayOfWeek;
    });
    
    return mealsForDay;
  };



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

  // Helper to determine if a plan is monthly (has specific date assignments) or weekly
  const isMonthlyPlan = (plan: WeeklyPlan): boolean => {
    return plan.meals.some(meal => meal.pivot?.meal_date);
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

  // Helper to get dates for specific week (1-4)
  const getDatesForWeek = (plan: WeeklyPlan, weekNumber: number): Date[] => {
    if (!plan) return [];
    const allDates = getDatesForPlan(plan);
    
    // Calculate week start based on plan start date
    const planStart = parseISO(plan.start_date);
    const weekStart = addDays(planStart, (weekNumber - 1) * 7);
    const weekEnd = addDays(weekStart, 6);
    
    return allDates.filter(date => date >= weekStart && date <= weekEnd);
  };



  // Find the active plan before using it in summary
  const activePlan = normalizedPlans.find((plan: WeeklyPlan) => {
    const start = parseISO(plan.start_date);
    const end = parseISO(plan.end_date);
    const today = new Date();
    return isDateInRange(today, start, end) && plan.is_active;
  });





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
    <div className="min-h-screen bg-gradient-to-br from-brand-yellow/10 via-brand-orange/5 to-brand-red/5 pb-20">
      {/* Header */}
      <div className="bg-gradient-to-r from-brand-red via-brand-orange to-brand-yellow px-4 py-4 border-b-2 border-brand-red">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-white">Meal Planner</h1>
          <div className="flex items-center space-x-2">
            <Filter className="w-5 h-5 text-white" />
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
                  ? 'bg-white text-brand-red border-white hover:bg-white/90' 
                  : 'bg-white/20 text-white border-white/30 hover:bg-white/30'
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
                <p>Orders must be placed before <strong>12:00 AM (midnight)</strong> the day before each meal. After this time, ordering will be closed for that meal.</p>
              </div>
            </div>
          </div>
        )}


      </div>



      {/* Content */}
      <div className="px-4 py-4">
        {/* Family Member Selection */}
        <div className="mb-6 bg-white rounded-lg p-4 shadow-sm border border-brand-yellow/30">
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
        <div className="mb-6 bg-white rounded-lg p-4 shadow-sm border border-brand-yellow/30">
          <h3 className="text-sm font-semibold text-brand-black mb-3">Week Selection</h3>
          <div className="flex flex-wrap gap-2">
            {[1, 2, 3, 4].map((week) => (
              <Button
                key={week}
                variant={selectedWeek === week.toString() ? 'default' : 'outline'}
                size="sm"
                className={`${
                  selectedWeek === week.toString()
                    ? 'bg-brand-red text-white border-brand-red hover:bg-brand-red/90' 
                    : 'bg-white text-brand-black border-brand-red hover:bg-brand-red/10'
                } rounded-full px-3 py-1 text-xs font-medium`}
                onClick={() => setSelectedWeek(week.toString())}
              >
                Week {week}
              </Button>
            ))}
          </div>
        </div>

        {/* Meal Filters */}
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
              // Get dates for the current view or selected week
              let datesForView = getDatesForView(activePlan);
              
              // If week filter is selected, use that instead
              if (selectedWeek && selectedWeek !== "1") {
                datesForView = getDatesForWeek(activePlan, parseInt(selectedWeek));
              }
              
              // Filter dates that have meals
              const datesWithMeals = datesForView.filter((date) => {
                const mealsForDay = getMealsForDay(date, [activePlan]);
                return mealsForDay.length > 0;
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
                <div className="bg-white rounded-lg border border-brand-yellow/30 overflow-hidden">
                  {/* Table Header */}
                  <div className="bg-brand-yellow/20 px-6 py-4 border-b border-brand-yellow/30">
                    <div className="flex items-center justify-between">
                      <h3 className="font-semibold text-brand-black">Meal Plan Schedule</h3>
                      <div className="text-sm text-brand-black/70">
                        {datesWithMeals.length} day{datesWithMeals.length !== 1 ? 's' : ''} with meals
                        {activePlan && (
                          <span className={`ml-2 px-2 py-1 text-xs rounded-full ${
                            isMonthlyPlan(activePlan)
                              ? 'bg-brand-blue/20 text-brand-blue'
                              : 'bg-brand-orange/20 text-brand-orange'
                          }`}>
                            {isMonthlyPlan(activePlan) ? 'Monthly Plan' : 'Weekly Plan'}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  {/* Table */}
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-brand-yellow/10">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-brand-black uppercase tracking-wider">
                            Date
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-brand-black uppercase tracking-wider">
                            Meal
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-brand-black uppercase tracking-wider">
                            Type
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-brand-black uppercase tracking-wider">
                            Price
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-brand-black uppercase tracking-wider">
                            Calories
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-brand-black uppercase tracking-wider">
                            Actions
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-brand-yellow/20">
                        {datesWithMeals.map((date) => {
                          const mealsForDay = getMealsForDay(date, [activePlan]);
                          
                          return mealsForDay.map((meal: any, mealIndex: number) => (
                            <tr key={`${date.toISOString()}-${meal.id}-${mealIndex}`} className="hover:bg-brand-yellow/5">
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="text-sm font-medium text-brand-black">
                                  {format(date, 'EEEE')}
                                </div>
                                <div className="text-sm text-brand-black/60">
                                  {format(date, 'MMM dd, yyyy')}
                                </div>
                              </td>
                              <td className="px-6 py-4">
                                <div>
                                  <div className="text-sm font-medium text-brand-black">
                                    {meal.title || meal.name}
                                  </div>
                                  <div className="text-sm text-brand-black/60 max-w-xs truncate">
                                    {meal.description || 'No description available'}
                                  </div>
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <span className="px-2 py-1 rounded-full text-xs font-medium bg-brand-orange/20 text-brand-orange">
                                  {meal.type || meal.category || 'N/A'}
                                </span>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-brand-black">
                                ${meal.price ? meal.price.toFixed(2) : 'N/A'}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-brand-black/60">
                                {meal.calories ? `${meal.calories} cal` : 'N/A'}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
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
                                    className="border-brand-red text-brand-red hover:bg-brand-red/10 rounded-full px-3 py-1 text-xs"
                                    onClick={() => handlePreOrder(meal, date)}
                                    disabled={preOrderMutation.isPending}
                                  >
                                    Order
                                  </Button>
                                </div>
                              </td>
                            </tr>
                          ));
                        })}
                      </tbody>
                    </table>
                  </div>
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
          
          {/* Add-ons Filters */}
          <div className="mb-6 space-y-4">
            {/* Add-on Search */}
            <div>
              <h3 className="text-sm font-semibold text-brand-black mb-2">Search Add-ons</h3>
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search by name or description..."
                  value={addOnSearchTerm}
                  onChange={(e) => setAddOnSearchTerm(e.target.value)}
                  className="w-full px-4 py-2 border border-brand-yellow/30 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-yellow/50 focus:border-brand-yellow"
                />
                {addOnSearchTerm && (
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setAddOnSearchTerm("")}
                    className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    ✕
                  </Button>
                )}
              </div>
            </div>

            {/* Add-on Type Filter */}
            <div>
              <h3 className="text-sm font-semibold text-brand-black mb-2">Add-on Type</h3>
              <div className="flex flex-wrap gap-2">
                {[
                  { key: 'all', label: 'All Types' },
                  { key: 'drinks', label: 'Drinks' },
                  { key: 'sides', label: 'Sides' },
                  { key: 'condiments', label: 'Condiments' },
                  { key: 'desserts', label: 'Desserts' }
                ].map(({ key, label }) => (
                  <Button
                    key={key}
                    variant={selectedAddOnType === key ? 'default' : 'outline'}
                    size="sm"
                    className={`${
                      selectedAddOnType === key 
                        ? 'bg-brand-red text-white border-brand-red hover:bg-brand-red/90' 
                        : 'bg-white text-brand-black border-brand-red hover:bg-brand-red/10'
                    } rounded-full px-3 py-1 text-xs font-medium`}
                    onClick={() => setSelectedAddOnType(key as "all" | "drinks" | "sides" | "condiments" | "desserts")}
                  >
                    {label}
                  </Button>
                ))}
              </div>
            </div>

            {/* Add-on Price Range Filter */}
            <div>
              <h3 className="text-sm font-semibold text-brand-black mb-2">Price Range</h3>
              <div className="flex flex-wrap gap-2">
                {[
                  { key: 'all', label: 'All Prices' },
                  { key: 'low', label: 'Under $1.00' },
                  { key: 'medium', label: '$1.00 - $3.00' },
                  { key: 'high', label: 'Over $3.00' }
                ].map(({ key, label }) => (
                  <Button
                    key={key}
                    variant={selectedAddOnPriceRange === key ? 'default' : 'outline'}
                    size="sm"
                    className={`${
                      selectedAddOnPriceRange === key 
                        ? 'bg-brand-orange text-white border-brand-orange hover:bg-brand-orange/90' 
                        : 'bg-white text-brand-black border-brand-orange hover:bg-brand-orange/10'
                    } rounded-full px-3 py-1 text-xs font-medium`}
                    onClick={() => setSelectedAddOnPriceRange(key as "all" | "low" | "medium" | "high")}
                  >
                    {label}
                  </Button>
                ))}
              </div>
            </div>
          </div>

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
                {filteredAddOns.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="py-8 text-center text-brand-black/50">
                      <div className="flex flex-col items-center">
                        <AlertCircle className="w-8 h-8 mb-2" />
                        <p>No add-ons match the selected filters.</p>
                        <Button 
                          size="sm" 
                          onClick={() => {
                            setSelectedAddOnType("all");
                            setSelectedAddOnPriceRange("all");
                            setAddOnSearchTerm("");
                          }}
                          className="mt-2 bg-brand-yellow text-brand-black border-brand-yellow hover:bg-brand-yellow/90"
                        >
                          Clear Filters
                        </Button>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredAddOns.map((addon) => (
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
                  ))
                )}
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
