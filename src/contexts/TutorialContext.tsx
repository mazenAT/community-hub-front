import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { secureStorage } from '@/services/native';

interface TutorialStep {
  id: string;
  title: string;
  description: string;
  target: string; // CSS selector or element ID
  position: 'top' | 'bottom' | 'left' | 'right';
  order: number;
  completed: boolean;
}

interface TutorialContextType {
  isTutorialActive: boolean;
  currentStep: TutorialStep | null;
  tutorialSteps: TutorialStep[];
  currentStepIndex: number;
  startTutorial: () => void;
  completeStep: (stepId: string) => void;
  skipTutorial: () => void;
  nextStep: () => void;
  previousStep: () => void;
  resetTutorial: () => void;
  checkTutorialStatus: () => Promise<void>; // Add this method
}

const defaultTutorialSteps: TutorialStep[] = [
  {
    id: 'welcome',
    title: 'Welcome to Smart Community! 🎉',
    description: 'Your all-in-one app for managing school meals, payments, and family activities. Let\'s take a quick tour of what you can do!',
    target: 'body',
    position: 'top',
    order: 1,
    completed: false,
  },
  {
    id: 'wallet-features',
    title: 'Digital Wallet 💳',
    description: '• View your current balance\n• Add money using various payment methods\n• Track all your transactions\n• Request refunds when needed\n• Manage payment methods',
    target: 'body',
    position: 'top',
    order: 2,
    completed: false,
  },
  {
    id: 'meal-planning',
    title: 'Smart Meal Planning 🍽️',
    description: '• Browse weekly meal plans from your school\n• Pre-order meals for different days\n• Manage family member preferences\n• View meal categories and options\n• Download meal plan PDFs',
    target: 'body',
    position: 'top',
    order: 3,
    completed: false,
  },
  {
    id: 'family-management',
    title: 'Family Management 👨‍👩‍👧‍👦',
    description: '• Add and manage family members\n• Set individual preferences and allergies\n• Track orders for each family member\n• Manage grade and class information',
    target: 'body',
    position: 'top',
    order: 4,
    completed: false,
  },
  {
    id: 'notifications',
    title: 'Stay Connected 🔔',
    description: '• Get notified about meal updates\n• Payment confirmations\n• Important announcements\n• Order status changes\n• School communications',
    target: 'body',
    position: 'top',
    order: 5,
    completed: false,
  },
  {
    id: 'add-ons',
    title: 'Extra Services ➕',
    description: '• Order additional food items\n• Special dietary requirements\n• Extra meal portions\n• Custom food requests\n• Track add-on orders',
    target: 'body',
    position: 'top',
    order: 6,
    completed: false,
  },
  {
    id: 'profile-settings',
    title: 'Your Profile & Settings ⚙️',
    description: '• Update personal information\n• Change passwords securely\n• Customize app preferences\n• Manage account settings\n• View activity history',
    target: 'body',
    position: 'top',
    order: 7,
    completed: false,
  },
  {
    id: 'completion',
    title: 'You\'re All Set! 🚀',
    description: 'Congratulations! You now know how to use Smart Community. Start exploring the features and enjoy the convenience of managing everything in one place!',
    target: 'body',
    position: 'top',
    order: 8,
    completed: false,
  }
];

const TutorialContext = createContext<TutorialContextType | undefined>(undefined);

export const useTutorial = () => {
  const context = useContext(TutorialContext);
  if (context === undefined) {
    throw new Error('useTutorial must be used within a TutorialProvider');
  }
  return context;
};

interface TutorialProviderProps {
  children: ReactNode;
}

export const TutorialProvider: React.FC<TutorialProviderProps> = ({ children }) => {
  const [isTutorialActive, setIsTutorialActive] = useState(false);
  const [tutorialSteps, setTutorialSteps] = useState<TutorialStep[]>(defaultTutorialSteps);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);

  // Load tutorial progress from storage
  useEffect(() => {
    const loadTutorialProgress = async () => {
      try {
        const savedProgress = await secureStorage.get('tutorial-progress');
        if (savedProgress) {
          const progress = JSON.parse(savedProgress);
          setTutorialSteps(prev => 
            prev.map(step => ({
              ...step,
              completed: progress[step.id] || false
            }))
          );
        }
      } catch (error) {
        console.error('Failed to load tutorial progress:', error);
      }
    };

    loadTutorialProgress();
  }, []);

  // Check if user should see tutorial - ONLY when explicitly called
  const checkTutorialStatus = async () => {
    try {
      // Check if user has seen the tutorial
      const hasSeenTutorial = await secureStorage.get('has-seen-tutorial');
      
      // Check if user has family members (only show tutorial if they do)
      const hasFamilyMembers = await secureStorage.get('has-family-members');
      
      // Show tutorial if user hasn't seen it and has family members
      if (!hasSeenTutorial && hasFamilyMembers === 'true') {
        setIsTutorialActive(true);
      }
    } catch (error) {
      console.error('Failed to check tutorial status:', error);
      // Don't crash the app if tutorial check fails
      // Just assume tutorial should not be shown
      setIsTutorialActive(false);
    }
  };

  // Don't automatically check tutorial status on mount
  // It will be called manually after user signs in

  const currentStep = tutorialSteps[currentStepIndex] || null;

  const saveTutorialProgress = async (stepId: string, completed: boolean) => {
    try {
      const savedProgress = await secureStorage.get('tutorial-progress');
      const progress = savedProgress ? JSON.parse(savedProgress) : {};
      progress[stepId] = completed;
      await secureStorage.set('tutorial-progress', JSON.stringify(progress));
    } catch (error) {
      console.error('Failed to save tutorial progress:', error);
    }
  };

  const startTutorial = () => {
    setIsTutorialActive(true);
    setCurrentStepIndex(0);
  };

  const completeStep = async (stepId: string) => {
    setTutorialSteps(prev => 
      prev.map(step => 
        step.id === stepId ? { ...step, completed: true } : step
      )
    );
    
    await saveTutorialProgress(stepId, true);
    
    // Move to next step
    if (currentStepIndex < tutorialSteps.length - 1) {
      setCurrentStepIndex(prev => prev + 1);
    } else {
      // Tutorial completed
      await completeTutorial();
    }
  };

  const nextStep = () => {
    if (currentStepIndex < tutorialSteps.length - 1) {
      setCurrentStepIndex(prev => prev + 1);
    }
  };

  const previousStep = () => {
    if (currentStepIndex > 0) {
      setCurrentStepIndex(prev => prev - 1);
    }
  };

  const skipTutorial = async () => {
    setIsTutorialActive(false);
    await secureStorage.set('has-seen-tutorial', 'true');
  };

  const completeTutorial = async () => {
    setIsTutorialActive(false);
    await secureStorage.set('has-seen-tutorial', 'true');
  };

  const resetTutorial = async () => {
    setCurrentStepIndex(0);
    setTutorialSteps(defaultTutorialSteps);
    await secureStorage.remove('tutorial-progress');
    await secureStorage.remove('has-seen-tutorial');
    setIsTutorialActive(true);
  };

  const value: TutorialContextType = {
    isTutorialActive,
    currentStep,
    tutorialSteps,
    currentStepIndex,
    startTutorial,
    completeStep,
    skipTutorial,
    nextStep,
    previousStep,
    resetTutorial,
    checkTutorialStatus,
  };

  return (
    <TutorialContext.Provider value={value}>
      {children}
    </TutorialContext.Provider>
  );
};

export default TutorialContext; 