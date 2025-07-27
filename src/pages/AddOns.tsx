import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { addOnApi } from "@/services/api";
import { addOnOrderApi } from "@/services/api";
import BottomNavigation from "@/components/BottomNavigation";

interface AddOn {
  id: number;
  name: string;
  description?: string;
  price: number;
  is_active: boolean;
}

const AddOns = () => {
  const [addOns, setAddOns] = useState<AddOn[]>([]);
  const [loading, setLoading] = useState(true);
  const [quantities, setQuantities] = useState<{ [id: number]: number }>({});

  useEffect(() => {
    fetchAddOns();
  }, []);

  const fetchAddOns = async () => {
    try {
      setLoading(true);
      const response = await addOnApi.getAddOns();
      setAddOns(response.data);
    } catch (error) {
      toast.error("Failed to fetch add-ons");
    } finally {
      setLoading(false);
    }
  };

  const handleQuantityChange = (id: number, value: string) => {
    const qty = Math.max(0, parseInt(value) || 0);
    setQuantities((prev) => ({ ...prev, [id]: qty }));
  };

  const handleOrderNow = async (addOn: AddOn) => {
    const qty = quantities[addOn.id] || 1;
    try {
      await addOnOrderApi.createOrder(addOn.id, qty);
      toast.success(`${qty} x ${addOn.name} ordered successfully!`);
    } catch (error: any) {
      toast.error(error.response?.data?.message || `Failed to order ${addOn.name}`);
    }
  };

  return (
    <div className="min-h-screen bg-brand-yellow/5 pb-20">
      <div className="bg-white px-4 py-4 border-b-2 border-brand-red shadow-sm">
        <h1 className="text-xl font-bold text-brand-black">Available Add-ons</h1>
        <p className="text-brand-black/70 text-sm">Choose extras to add to your order at any time.</p>
      </div>
      <div className="px-4 py-6 grid grid-cols-1 gap-4">
        {loading ? (
          <div className="col-span-full text-center text-brand-black/70">Loading...</div>
        ) : addOns.length === 0 ? (
          <div className="col-span-full text-center text-brand-black/70">No add-ons available</div>
        ) : (
          addOns.filter(a => a.is_active).map((addOn) => (
            <Card key={addOn.id} className="p-4 flex flex-col space-y-3 border border-brand-yellow/30 bg-brand-yellow/10">
              <div>
                <h2 className="text-base font-semibold text-brand-black">{addOn.name}</h2>
                {addOn.description && <p className="text-brand-black/70 text-sm mt-1">{addOn.description}</p>}
              </div>
              <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-2 space-y-2 sm:space-y-0">
                <span className="text-brand-red font-bold text-lg">{addOn.price.toFixed(2)} EGP</span>
                <Input
                  type="number"
                  min={1}
                  value={quantities[addOn.id] || 1}
                  onChange={e => handleQuantityChange(addOn.id, e.target.value)}
                  className="w-full sm:w-20 text-center border-brand-yellow/30 focus:border-brand-red"
                />
                <Button onClick={() => handleOrderNow(addOn)} className="bg-brand-red hover:bg-brand-red/90 text-white w-full sm:w-auto">
                  Order Now
                </Button>
              </div>
            </Card>
          ))
        )}
      </div>
      <BottomNavigation activeTab="addons" />
    </div>
  );
};

export default AddOns; 