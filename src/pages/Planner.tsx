
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { ShoppingCart } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import BottomNavigation from "@/components/BottomNavigation";

const Planner = () => {
  const { toast } = useToast();

  const meals = [
    {
      id: 1,
      type: "Lunch",
      time: "12:30 PM",
      title: "Grilled Chicken Salad",
      calories: "420 cal",
      price: "45 EGP"
    },
    {
      id: 2,
      type: "Dinner", 
      time: "7:00 PM",
      title: "Salmon with Vegetables",
      calories: "580 cal",
      price: "65 EGP"
    }
  ];

  const handlePurchase = (meal: typeof meals[0]) => {
    toast({
      title: "Purchase Successful!",
      description: `You have successfully purchased ${meal.title} for ${meal.price}`,
    });
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Header */}
      <div className="bg-white px-6 py-6 border-b border-gray-100 shadow-sm">
        <h1 className="text-2xl font-bold text-gray-900">Today's Schedule</h1>
        <p className="text-sm text-gray-500 mt-1">Thursday, 15 February</p>
      </div>

      {/* Content */}
      <div className="px-6 py-6">
        {/* Meals Section */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-900">Available Meals</h3>
          
          <div className="space-y-4">
            {meals.map((meal) => (
              <Card key={meal.id} className="p-4 bg-white border border-gray-200 shadow-sm hover:shadow-md transition-shadow duration-200">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                      <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                      </svg>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2 mb-1">
                        <h4 className="font-semibold text-gray-900">{meal.type}</h4>
                        <span className="text-gray-300">•</span>
                        <span className="text-sm text-gray-500">{meal.time}</span>
                      </div>
                      <p className="text-gray-700 font-medium">{meal.title}</p>
                      <p className="text-sm text-gray-500">{meal.calories}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-4 flex-shrink-0">
                    <div className="text-right">
                      <p className="text-xl font-bold text-gray-900">{meal.price}</p>
                    </div>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button size="sm" className="bg-blue-600 hover:bg-blue-700 text-white">
                          <ShoppingCart className="w-4 h-4 mr-2" />
                          Purchase
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Confirm Purchase</AlertDialogTitle>
                          <AlertDialogDescription>
                            Are you sure you want to purchase {meal.title} for {meal.price}?
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction onClick={() => handlePurchase(meal)}>
                            Confirm Purchase
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </div>

      <BottomNavigation activeTab="planner" />
    </div>
  );
};

export default Planner;
