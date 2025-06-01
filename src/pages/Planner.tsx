import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useMutation, useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { plannerApi } from "@/services/api";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { format } from "date-fns";
import { CalendarIcon, Plus, Trash2, ShoppingCart } from "lucide-react";
import BottomNavigation from "@/components/BottomNavigation";

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
}

const Planner = () => {
  const navigate = useNavigate();
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [selectedType, setSelectedType] = useState<"all" | "breakfast" | "lunch" | "dinner">("all");

  const { data: meals, isLoading, refetch } = useQuery({
    queryKey: ["meals", format(selectedDate, "yyyy-MM-dd"), selectedType],
    queryFn: () => plannerApi.getMeals({
      date: format(selectedDate, "yyyy-MM-dd"),
      type: selectedType === "all" ? undefined : selectedType,
    }),
  });

  const preOrderMutation = useMutation({
    mutationFn: (mealId: number) => plannerApi.preOrderMeal(mealId),
    onSuccess: () => {
      toast.success("Meal pre-ordered successfully");
      refetch();
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Failed to pre-order meal");
    },
  });

  const handlePreOrder = (meal: Meal) => {
    if (meal.status === "sold_out") {
      toast.error("This meal is sold out");
      return;
    }

    if (meal.status === "pre_ordered") {
      toast.error("You have already pre-ordered this meal");
      return;
    }

    preOrderMutation.mutate(meal.id);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Header */}
      <div className="bg-white px-4 py-4 sm:px-6 sm:py-6 border-b border-gray-100 shadow-sm">
        <div className="flex items-center space-x-3">
          <Calendar className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600" />
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Weekly Meal Planner</h1>
            <p className="text-xs sm:text-sm text-gray-500 mt-1">Pre-order your meals for next week</p>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="px-4 py-4 sm:px-6 sm:py-6">
        <div className="space-y-4 sm:space-y-6">
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 sm:p-4">
            <div className="flex items-start space-x-2">
              <svg className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-xs sm:text-sm text-blue-800">
                <strong>Pre-order Notice:</strong> All meals must be ordered at least 24 hours in advance. 
                Orders close at 6 PM the day before.
              </p>
            </div>
          </div>

          {/* Date and Type Selection */}
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-full h-12 bg-white justify-start text-left font-normal"
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {format(selectedDate, "PPP")}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={selectedDate}
                    onSelect={(date) => date && setSelectedDate(date)}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
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
          </div>

          {/* Meals List */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {meals?.data.map((meal: Meal) => (
              <div key={meal.id} className="bg-white rounded-xl shadow-sm p-6">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">{meal.title}</h3>
                    <p className="text-sm text-gray-500">{meal.type.charAt(0).toUpperCase() + meal.type.slice(1)} • {meal.time}</p>
                  </div>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    meal.status === "available" ? "bg-green-100 text-green-800" :
                    meal.status === "sold_out" ? "bg-red-100 text-red-800" :
                    "bg-blue-100 text-blue-800"
                  }`}>
                    {meal.status === "available" ? "Available" :
                     meal.status === "sold_out" ? "Sold Out" :
                     "Pre-ordered"}
                  </span>
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
                <Button
                  onClick={() => handlePreOrder(meal)}
                  disabled={meal.status !== "available" || preOrderMutation.isPending}
                  className={`w-full mt-4 ${
                    meal.status === "available"
                      ? "bg-blue-500 hover:bg-blue-600 text-white"
                      : "bg-gray-100 text-gray-400 cursor-not-allowed"
                  }`}
                >
                  {meal.status === "available" ? (
                    <>
                      <ShoppingCart className="w-4 h-4 mr-2" />
                      Pre-order Now
                    </>
                  ) : meal.status === "sold_out" ? (
                    "Sold Out"
                  ) : (
                    "Pre-ordered"
                  )}
                </Button>
              </div>
            ))}
          </div>
        </div>
      </div>

      <BottomNavigation activeTab="planner" />
    </div>
  );
};

export default Planner;
