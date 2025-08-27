import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { FamilyMemberForm } from './FamilyMemberForm';
import { familyMembersApi } from '@/services/api';
import { toast } from 'sonner';
import { Plus, Edit, Trash2, Users } from 'lucide-react';

interface FamilyMember {
  id: number;
  name: string;
  grade: string;
  class: string;
  allergies: string[];
  is_active: boolean;
}

export const FamilyMembersSection: React.FC = () => {
  const [showForm, setShowForm] = useState(false);
  const [editingMember, setEditingMember] = useState<FamilyMember | null>(null);
  const queryClient = useQueryClient();

  // Fetch family members
  const { data: familyMembersResponse, isLoading } = useQuery({
    queryKey: ['family-members'],
    queryFn: familyMembersApi.getFamilyMembers,
  });

  const familyMembers = familyMembersResponse?.data || [];

  // Create family member mutation
  const createMutation = useMutation({
    mutationFn: familyMembersApi.createFamilyMember,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['family-members'] });
      toast.success('Family member added successfully!');
      setShowForm(false);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to add family member');
    },
  });

  // Update family member mutation
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: any }) => 
      familyMembersApi.updateFamilyMember(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['family-members'] });
      toast.success('Family member updated successfully!');
      setShowForm(false);
      setEditingMember(null);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to update family member');
    },
  });

  // Delete family member mutation
  const deleteMutation = useMutation({
    mutationFn: familyMembersApi.deleteFamilyMember,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['family-members'] });
      toast.success('Family member deleted successfully!');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to delete family member');
    },
  });

  const handleSubmit = (data: any) => {
    if (editingMember) {
      updateMutation.mutate({ id: editingMember.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const handleEdit = (member: FamilyMember) => {
    setEditingMember(member);
    setShowForm(true);
  };

  const handleAddNew = () => {
    setEditingMember(null); // Ensure we're not editing
    setShowForm(true);
  };

  const handleDelete = (id: number) => {
    if (window.confirm('Are you sure you want to delete this family member?')) {
      deleteMutation.mutate(id);
    }
  };

  const isLoadingMutation = createMutation.isPending || updateMutation.isPending || deleteMutation.isPending;

  return (
    <div className="bg-white rounded-xl p-4 sm:p-6 shadow-sm border border-brand-yellow/30">
      <div className="flex items-center justify-between mb-4 sm:mb-6">
        <div className="flex items-center space-x-2">
          <Users className="w-5 h-5 text-brand-red" />
          <h3 className="text-lg sm:text-xl font-semibold text-brand-black">
            Family Members
          </h3>
        </div>
        <Button
          onClick={handleAddNew}
          className="bg-brand-red hover:bg-brand-red/90 text-white rounded-full px-4 py-2 text-sm"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Child
        </Button>
      </div>

      {isLoading ? (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full border-t-2 border-b-2 border-brand-red w-8 h-8 mx-auto"></div>
          <p className="text-brand-black/70 mt-2">Loading family members...</p>
        </div>
      ) : familyMembers.length === 0 ? (
        <div className="text-center py-8">
          <Users className="w-12 h-12 text-brand-black/30 mx-auto mb-3" />
          <p className="text-brand-black/70 mb-4">No family members added yet</p>
          <Button
            onClick={handleAddNew}
            className="bg-brand-red hover:bg-brand-red/90 text-white"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Your First Child
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          {familyMembers.map((member: FamilyMember) => (
            <div
              key={member.id}
              className="bg-brand-yellow/10 rounded-lg p-4 border border-brand-yellow/30"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h4 className="font-semibold text-brand-black text-lg">
                    {member.name}
                  </h4>
                  <p className="text-brand-black/70 text-sm">
                    {member.grade} • Class {member.class}
                  </p>
                  {member.allergies.length > 0 && (
                    <div className="mt-2">
                      <p className="text-xs font-medium text-brand-black/80 mb-1">
                        Allergies:
                      </p>
                      <div className="flex flex-wrap gap-1">
                        {member.allergies.map((allergy) => (
                          <span
                            key={allergy}
                            className="px-2 py-1 bg-brand-red/10 text-brand-red text-xs rounded-full"
                          >
                            {allergy}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
                <div className="flex space-x-2 ml-4">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleEdit(member)}
                    className="border-brand-red text-brand-red hover:bg-brand-red/10"
                    disabled={isLoadingMutation}
                  >
                    <Edit className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDelete(member.id)}
                    className="border-brand-red text-brand-red hover:bg-brand-red/10"
                    disabled={isLoadingMutation}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {showForm && (
        <FamilyMemberForm
          member={editingMember || undefined}
          onSubmit={handleSubmit}
          onCancel={() => {
            setShowForm(false);
            setEditingMember(null);
          }}
          isLoading={isLoadingMutation}
        />
      )}
    </div>
  );
}; 