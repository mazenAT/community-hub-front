import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

import { X } from 'lucide-react';

interface FamilyMember {
  id?: number;
  name: string;
  grade: string;
  class: string;
  allergies: string[];
}

interface FamilyMemberFormProps {
  member?: FamilyMember;
  onSubmit: (data: FamilyMember) => void;
  onCancel: () => void;
  isLoading?: boolean;
}



const grades = [
  'Pre-K', 'Kindergarten', '1st Grade', '2nd Grade', '3rd Grade', '4th Grade',
  '5th Grade', '6th Grade', '7th Grade', '8th Grade', '9th Grade', '10th Grade',
  '11th Grade', '12th Grade'
];

const classes = [
  'A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P'
];

export const FamilyMemberForm: React.FC<FamilyMemberFormProps> = ({
  member,
  onSubmit,
  onCancel,
  isLoading = false
}) => {
  const [formData, setFormData] = useState<FamilyMember>({
    name: '',
    grade: '',
    class: '',
    allergies: []
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  // Reset form when member prop changes (for editing vs adding new)
  useEffect(() => {
    if (member) {
      // Editing existing member - populate form
      setFormData({
        name: member.name || '',
        grade: member.grade || '',
        class: member.class || '',
        allergies: member.allergies || []
      });
    } else {
      // Adding new member - reset form to empty state
      setFormData({
        name: '',
        grade: '',
        class: '',
        allergies: []
      });
    }
    // Clear any previous errors
    setErrors({});
  }, [member]);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    }

    if (!formData.grade) {
      newErrors.grade = 'Grade is required';
    }

    if (!formData.class) {
      newErrors.class = 'Class is required';
    }

    // Allergies are now optional - no validation needed

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validateForm()) {
      onSubmit(formData);
    }
  };



  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-brand-black">
            {member ? 'Edit Family Member' : 'Add Family Member'}
          </h2>
          <button
            onClick={onCancel}
            className="text-brand-black/70 hover:text-brand-black"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 pr-2">
          {/* Name */}
          <div>
            <Label htmlFor="name" className="text-brand-black font-medium">
              Child's Name *
            </Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              className={`mt-1 border-2 focus:border-brand-red ${
                errors.name ? 'border-brand-red' : 'border-brand-yellow/30'
              }`}
              placeholder="Enter child's full name"
            />
            {errors.name && (
              <p className="text-brand-red text-xs mt-1">{errors.name}</p>
            )}
          </div>

          {/* Grade */}
          <div>
            <Label htmlFor="grade" className="text-brand-black font-medium">
              Grade *
            </Label>
            <select
              id="grade"
              value={formData.grade}
              onChange={(e) => setFormData(prev => ({ ...prev, grade: e.target.value }))}
              className={`mt-1 w-full p-3 border-2 rounded-lg focus:border-brand-red ${
                errors.grade ? 'border-brand-red' : 'border-brand-yellow/30'
              }`}
            >
              <option value="">Select Grade</option>
              {grades.map(grade => (
                <option key={grade} value={grade}>{grade}</option>
              ))}
            </select>
            {errors.grade && (
              <p className="text-brand-red text-xs mt-1">{errors.grade}</p>
            )}
          </div>

          {/* Class */}
          <div>
            <Label htmlFor="class" className="text-brand-black font-medium">
              Class *
            </Label>
            <select
              id="class"
              value={formData.class}
              onChange={(e) => setFormData(prev => ({ ...prev, class: e.target.value }))}
              className={`mt-1 w-full p-3 border-2 rounded-lg focus:border-brand-red ${
                errors.class ? 'border-brand-red' : 'border-brand-yellow/30'
              }`}
            >
              <option value="">Select Class</option>
              {classes.map(cls => (
                <option key={cls} value={cls}>Class {cls}</option>
              ))}
            </select>
            {errors.class && (
              <p className="text-brand-red text-xs mt-1">{errors.class}</p>
            )}
          </div>

          {/* Allergies */}
          <div>
            <Label htmlFor="allergies" className="text-brand-black font-medium">
              Allergies (Optional)
            </Label>
            <Input
              id="allergies"
              value={formData.allergies.join(', ')}
              onChange={(e) => setFormData(prev => ({ 
                ...prev, 
                allergies: e.target.value ? e.target.value.split(',').map(a => a.trim()).filter(a => a) : []
              }))}
              className="mt-1 border-2 focus:border-brand-red border-brand-yellow/30"
              placeholder="Enter allergies separated by commas (e.g., Lactose, Peanuts, Chocolate)"
            />
            <p className="text-xs text-gray-500 mt-1">
              Enter any food allergies or dietary restrictions, separated by commas
            </p>
          </div>

          {/* Buttons */}
          <div className="flex space-x-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              className="flex-1 border-brand-red text-brand-red hover:bg-brand-red/10"
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="flex-1 bg-brand-red hover:bg-brand-red/90 text-white"
              disabled={isLoading}
            >
              {isLoading ? 'Saving...' : (member ? 'Update' : 'Add')}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}; 