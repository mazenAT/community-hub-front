import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { familyMembersApi } from "@/services/api";
import { Plus, X, Users } from "lucide-react";

interface FamilyMember {
  name: string;
  grade: string;
  class: string;
  allergies: string[];
}

const FamilyMemberSetup = () => {
  const navigate = useNavigate();
  const [familyMembers, setFamilyMembers] = useState<FamilyMember[]>([
    { name: "", grade: "", class: "", allergies: [] }
  ]);
  const [currentAllergy, setCurrentAllergy] = useState("");
  const [currentMemberIndex, setCurrentMemberIndex] = useState(0);

  const createFamilyMemberMutation = useMutation({
    mutationFn: (data: FamilyMember) => familyMembersApi.createFamilyMember(data),
    onSuccess: () => {
      toast.success("Family member added successfully!");
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Failed to add family member");
    },
  });

  const handleAddMember = () => {
    setFamilyMembers([...familyMembers, { name: "", grade: "", class: "", allergies: [] }]);
  };

  const handleRemoveMember = (index: number) => {
    if (familyMembers.length > 1) {
      setFamilyMembers(familyMembers.filter((_, i) => i !== index));
    }
  };

  const handleUpdateMember = (index: number, field: keyof FamilyMember, value: any) => {
    const updatedMembers = [...familyMembers];
    updatedMembers[index] = { ...updatedMembers[index], [field]: value };
    setFamilyMembers(updatedMembers);
  };

  const handleAddAllergy = (memberIndex: number) => {
    if (currentAllergy.trim()) {
      const updatedMembers = [...familyMembers];
      updatedMembers[memberIndex].allergies.push(currentAllergy.trim());
      setFamilyMembers(updatedMembers);
      setCurrentAllergy("");
    }
  };

  const handleRemoveAllergy = (memberIndex: number, allergyIndex: number) => {
    const updatedMembers = [...familyMembers];
    updatedMembers[memberIndex].allergies.splice(allergyIndex, 1);
    setFamilyMembers(updatedMembers);
  };

  const handleSkip = () => {
    toast.success("You can add family members later from your profile");
    navigate("/planner");
  };

  const handleComplete = async () => {
    // Validate that at least one family member has a name
    const validMembers = familyMembers.filter(member => member.name.trim() !== "");
    
    if (validMembers.length === 0) {
      toast.error("Please add at least one family member");
      return;
    }

    // Create all family members
    try {
      for (const member of validMembers) {
        if (member.name.trim()) {
          await createFamilyMemberMutation.mutateAsync({
            name: member.name.trim(),
            grade: member.grade.trim(),
            class: member.class.trim(),
            allergies: member.allergies,
          });
        }
      }
      
      toast.success("Family members added successfully!");
      navigate("/planner");
    } catch (error) {
      toast.error("Failed to add some family members");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-100 via-gray-200 to-gray-300 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl bg-white rounded-2xl shadow-xl p-8">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <Users className="w-12 h-12 text-brand-red" />
          </div>
          <h1 className="text-3xl font-bold text-brand-black mb-2">Add Your Family Members</h1>
          <p className="text-brand-black/70">
            Add your children or family members who will be ordering meals
          </p>
        </div>

        {/* Family Members Form */}
        <div className="space-y-6">
          {familyMembers.map((member, index) => (
            <div key={index} className="bg-brand-yellow/5 rounded-xl p-6 border border-brand-yellow/20">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-brand-black">
                  Family Member {index + 1}
                </h3>
                {familyMembers.length > 1 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleRemoveMember(index)}
                    className="text-red-500 hover:text-red-700"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-brand-black mb-2">
                    Full Name *
                  </label>
                  <Input
                    type="text"
                    placeholder="Enter full name"
                    value={member.name}
                    onChange={(e) => handleUpdateMember(index, "name", e.target.value)}
                    className="border-brand-yellow/30 focus:border-brand-red"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-brand-black mb-2">
                    Grade
                  </label>
                  <Input
                    type="text"
                    placeholder="e.g., 1st, 2nd, 3rd"
                    value={member.grade}
                    onChange={(e) => handleUpdateMember(index, "grade", e.target.value)}
                    className="border-brand-yellow/30 focus:border-brand-red"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-brand-black mb-2">
                    Class
                  </label>
                  <Input
                    type="text"
                    placeholder="e.g., A, B, C"
                    value={member.class}
                    onChange={(e) => handleUpdateMember(index, "class", e.target.value)}
                    className="border-brand-yellow/30 focus:border-brand-red"
                  />
                </div>
              </div>

              {/* Allergies Section */}
              <div>
                <label className="block text-sm font-medium text-brand-black mb-2">
                  Allergies (Optional)
                </label>
                <div className="flex gap-2 mb-2">
                  <Input
                    type="text"
                    placeholder="Add allergy (e.g., nuts, dairy)"
                    value={currentAllergy}
                    onChange={(e) => setCurrentAllergy(e.target.value)}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddAllergy(index);
                      }
                    }}
                    className="border-brand-yellow/30 focus:border-brand-red"
                  />
                  <Button
                    type="button"
                    onClick={() => handleAddAllergy(index)}
                    className="bg-brand-red hover:bg-brand-red/90 text-white"
                  >
                    Add
                  </Button>
                </div>
                
                {member.allergies.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {member.allergies.map((allergy, allergyIndex) => (
                      <span
                        key={allergyIndex}
                        className="inline-flex items-center gap-1 px-3 py-1 bg-red-100 text-red-700 rounded-full text-sm"
                      >
                        {allergy}
                        <button
                          type="button"
                          onClick={() => handleRemoveAllergy(index, allergyIndex)}
                          className="text-red-500 hover:text-red-700"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}

          {/* Add Another Member Button */}
          <Button
            onClick={handleAddMember}
            variant="outline"
            className="w-full border-brand-yellow/30 text-brand-black hover:bg-brand-yellow/10"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Another Family Member
          </Button>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-4 mt-8">
          <Button
            onClick={handleSkip}
            variant="outline"
            className="flex-1 border-brand-yellow/30 text-brand-black hover:bg-brand-yellow/10"
          >
            Skip for Now
          </Button>
          <Button
            onClick={handleComplete}
            disabled={createFamilyMemberMutation.isPending}
            className="flex-1 bg-gradient-to-r from-brand-red to-brand-orange hover:from-brand-red/90 hover:to-brand-orange/90 text-white"
          >
            {createFamilyMemberMutation.isPending ? (
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                <span>Adding...</span>
              </div>
            ) : (
              "Complete Setup"
            )}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default FamilyMemberSetup; 