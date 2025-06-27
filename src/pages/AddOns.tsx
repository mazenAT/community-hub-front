import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { addOnApi } from "@/services/api";

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

  const handleAddToCart = (addOn: AddOn) => {
    const qty = quantities[addOn.id] || 1;
    // TODO: Integrate with cart/order logic
    toast.success(`${qty} x ${addOn.name} added to cart!`);
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <div className="bg-white px-4 py-4 border-b border-gray-100 shadow-sm">
        <h1 className="text-xl font-bold text-gray-900">Available Add-ons</h1>
        <p className="text-gray-500 text-sm">Choose extras to add to your order at any time.</p>
      </div>
      <div className="px-4 py-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? (
          <div className="col-span-full text-center text-gray-500">Loading...</div>
        ) : addOns.length === 0 ? (
          <div className="col-span-full text-center text-gray-500">No add-ons available</div>
        ) : (
          addOns.filter(a => a.is_active).map((addOn) => (
            <Card key={addOn.id} className="p-6 flex flex-col space-y-4">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">{addOn.name}</h2>
                {addOn.description && <p className="text-gray-600 text-sm">{addOn.description}</p>}
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-blue-600 font-bold text-lg">{addOn.price.toFixed(2)} EGP</span>
                <Input
                  type="number"
                  min={1}
                  value={quantities[addOn.id] || 1}
                  onChange={e => handleQuantityChange(addOn.id, e.target.value)}
                  className="w-20 text-center"
                />
                <Button onClick={() => handleAddToCart(addOn)} className="bg-blue-600 hover:bg-blue-700 text-white">
                  Add to Cart
                </Button>
              </div>
            </Card>
          ))
        )}
      </div>
    </div>
  );
};

export default AddOns; 