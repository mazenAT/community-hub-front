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
}

const defaultTutorialSteps: TutorialStep[] = [
  {
    id: 'welcome',
    title: 'Welcome to Smart Community!',
    description: 'Let\'s take a quick tour of your new app. We\'ll show you how to use all the features.',
    target: 'body',
    position: 'top',
    order: 1,
    completed: false,
  },
  {
    id: 'wallet-overview',
    title: 'Your Digital Wallet',
    description: 'Here you can see your current balance, add money, and view all your transactions.',
    target: '.wallet-balance',
    position: 'bottom',
    order: 2,
    completed: false,
  },
  {
    id: 'add-money',
    title: 'Add Money to Wallet',
    description: 'Click the "Add Money" button to top up your wallet using various payment methods.',
    target: '.add-money-btn',
    position: 'top',
    order: 3,
    completed: false,
  },
  {
    id: 'transactions',
    title: 'Transaction History',
    description: 'View all your spending, meal purchases, and refunds in one place.',
    target: '.transactions-section',
    position: 'top',
    order: 4,
    completed: false,
  },
  {
    id: 'planner-intro',
    title: 'Meal Planning',
    description: 'Browse weekly meal plans, order meals, and manage your family\'s food preferences.',
    target: '.planner-section',
    position: 'bottom',
    order: 5,
    completed: false,
  },
  {
    id: 'order-meals',
    title: 'Order Meals',
    description: 'Select meals for different days and family members. You can order in advance!',
    target: '.meal-ordering',
    position: 'top',
    order: 6,
    completed: false,
  },
  {
    id: 'family-members',
    title: 'Family Management',
    description: 'Add and manage family members, set their preferences, and track their orders.',
    target: '.family-members',
    position: 'right',
    order: 7,
    completed: false,
  },
  {
    id: 'notifications',
    title: 'Stay Updated',
    description: 'Get notified about meal updates, payment confirmations, and important announcements.',
    target: '.notifications-bell',
    position: 'left',
    order: 8,
    completed: false,
  },
  {
    id: 'profile-settings',
    title: 'Profile & Settings',
    description: 'Update your personal information, change passwords, and customize app preferences.',
    target: '.profile-section',
    position: 'top',
    order: 9,
    completed: false,
  },
  {
    id: 'support',
    title: 'Need Help?',
    description: 'Contact our support team anytime. We\'re here to help you get the most out of the app!',
    target: '.contact-support',
    position: 'bottom',
    order: 10,
    completed: false,
  },
];

const TutorialContext = createContext<TutorialContextType | undefined>(undefined);

export const useTutorial = () => {
  const context = useContext(TutorialContext);
  if (!context) {
    throw new Error('useTutorial must be used within a TutorialProvider');
  }
  return context;
};

interface TutorialProviderProps {
  children: ReactNode;
}

export const TutorialProvider: React.FC<TutorialProviderProps> = ({ children }) => {
  const [isTutorialActive, setIsTutorialActive] = useState(false);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [tutorialSteps, setTutorialSteps] = useState<TutorialStep[]>(defaultTutorialSteps);

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
              completed: progress[step.id] || false,
            }))
          );
        }
      } catch (error) {
        console.error('Failed to load tutorial progress:', error);
      }
    };

    loadTutorialProgress();
  }, []);

  // Check if user should see tutorial
  useEffect(() => {
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

    checkTutorialStatus();
  }, []);

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
  };

  return (
    <TutorialContext.Provider value={value}>
      {children}
    </TutorialContext.Provider>
  );
};

export default TutorialContext; 