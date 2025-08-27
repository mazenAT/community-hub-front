import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { secureStorage } from '@/services/native';

interface TutorialStep {
  id: string;
  title: string;
  description: string;
  target: string; // CSS selector or element ID
  position: 'top' | 'bottom' | 'left' | 'right' | 'center';
  order: number;
  completed: boolean;
  // Navigation properties
  route?: string; // Route to navigate to for this step
  navigateBeforeStep?: boolean; // Whether to navigate before showing the step
  // Interactive properties
  highlightElement?: boolean; // Whether to highlight the target element
  spotlightRadius?: number; // Radius of the spotlight effect
  animation?: 'pulse' | 'bounce' | 'shake' | 'glow' | 'none';
  interactive?: boolean; // Whether user needs to interact with the element
  actionRequired?: 'click' | 'scroll' | 'input' | 'none'; // What action is needed
  hint?: string; // Additional hint text
  showArrow?: boolean; // Whether to show directional arrow
  arrowDirection?: 'up' | 'down' | 'left' | 'right';
}

interface TutorialContextType {
  isTutorialActive: boolean;
  currentStep: TutorialStep | null;
  tutorialSteps: TutorialStep[];
  currentStepIndex: number;
  // Tutorial control
  startTutorial: () => void;
  completeStep: (stepId: string) => void;
  skipTutorial: () => void;
  nextStep: () => void;
  previousStep: () => void;
  resetTutorial: () => void;
  checkTutorialStatus: () => Promise<void>;
  // Interactive features
  highlightElement: (selector: string) => void;
  clearHighlight: () => void;
  getElementPosition: (selector: string) => DOMRect | null;
  // Tutorial progress
  tutorialProgress: number;
  // Step validation
  validateStepCompletion: (stepId: string) => boolean;
  // Navigation
  navigateToStep: (step: TutorialStep) => void;
}

const defaultTutorialSteps: TutorialStep[] = [
  {
    id: 'welcome',
    title: 'Welcome to Smart Community! 🎉',
    description: 'Your all-in-one app for managing school meals, payments, and family activities. Let\'s take a quick tour!',
    target: 'body',
    position: 'center',
    order: 1,
    completed: false,
    highlightElement: false,
    animation: 'bounce'
  },
  {
    id: 'wallet-tour',
    title: 'Digital Wallet 💳',
    description: 'Your financial hub! Let\'s explore the wallet features:\n\n• View balance and transactions\n• Add money securely\n• Manage payment methods\n• Request refunds',
    target: '[data-tutorial="wallet-nav"]',
    position: 'bottom',
    order: 2,
    completed: false,
    route: '/wallet',
    navigateBeforeStep: true,
    highlightElement: true,
    spotlightRadius: 60,
    animation: 'pulse',
    interactive: true,
    actionRequired: 'click',
    hint: 'Click the wallet icon in the bottom navigation',
    showArrow: true,
    arrowDirection: 'up'
  },
  {
    id: 'wallet-features',
    title: 'Wallet Features 🔍',
    description: 'Great! Now let\'s explore what you can do:\n\n• Check your current balance\n• See transaction history\n• Add money to your wallet\n• Manage saved cards',
    target: '[data-tutorial="wallet-balance"]',
    position: 'right',
    order: 3,
    completed: false,
    route: '/wallet',
    navigateBeforeStep: false, // Already on wallet page
    highlightElement: true,
    spotlightRadius: 80,
    animation: 'glow',
    interactive: false
  },
  {
    id: 'meal-planning-intro',
    title: 'Smart Meal Planning 🍽️',
    description: 'Time to explore meal planning! Let\'s navigate to the meal planner:\n\n• Weekly meal schedules\n• Pre-order options\n• Family preferences',
    target: '[data-tutorial="meal-nav"]',
    position: 'bottom',
    order: 4,
    completed: false,
    route: '/planner',
    navigateBeforeStep: true,
    highlightElement: true,
    spotlightRadius: 60,
    animation: 'pulse',
    interactive: true,
    actionRequired: 'click',
    hint: 'Click the meal planning icon',
    showArrow: true,
    arrowDirection: 'up'
  },
  {
    id: 'meal-browsing',
    title: 'Browse Meals 🥗',
    description: 'Explore the meal options:\n\n• Scroll through different days\n• View meal categories\n• Check nutritional info\n• See pricing details',
    target: '[data-tutorial="meal-list"]',
    position: 'left',
    order: 5,
    completed: false,
    route: '/planner',
    navigateBeforeStep: false, // Already on planner page
    highlightElement: true,
    spotlightRadius: 100,
    animation: 'glow',
    interactive: true,
    actionRequired: 'scroll',
    hint: 'Scroll through the meal options'
  },
  {
    id: 'family-setup',
    title: 'Family Management 👨‍👩‍👧‍👦',
    description: 'Set up your family members:\n\n• Add family members\n• Set dietary preferences\n• Manage allergies\n• Track individual orders',
    target: '[data-tutorial="family-nav"]',
    position: 'bottom',
    order: 6,
    completed: false,
    route: '/profile',
    navigateBeforeStep: true,
    highlightElement: true,
    spotlightRadius: 60,
    animation: 'pulse',
    interactive: true,
    actionRequired: 'click',
    hint: 'Click the profile icon to manage family members',
    showArrow: true,
    arrowDirection: 'up'
  },
  {
    id: 'notifications',
    title: 'Stay Connected 🔔',
    description: 'Never miss important updates:\n\n• Meal changes\n• Payment confirmations\n• School announcements\n• Order updates',
    target: '[data-tutorial="notifications"]',
    position: 'left',
    order: 7,
    completed: false,
    route: '/wallet', // Notifications are on wallet page
    navigateBeforeStep: true,
    highlightElement: true,
    spotlightRadius: 50,
    animation: 'shake',
    interactive: false
  },
  {
    id: 'profile-settings',
    title: 'Your Profile & Settings ⚙️',
    description: 'Customize your experience:\n\n• Update personal info\n• Change preferences\n• Manage security\n• View activity',
    target: '[data-tutorial="profile-nav"]',
    position: 'bottom',
    order: 8,
    completed: false,
    route: '/profile',
    navigateBeforeStep: true,
    highlightElement: true,
    spotlightRadius: 60,
    animation: 'pulse',
    interactive: true,
    actionRequired: 'click',
    hint: 'Click your profile icon',
    showArrow: true,
    arrowDirection: 'up'
  },
  {
    id: 'completion',
    title: 'You\'re All Set! 🚀',
    description: 'Congratulations! You now know how to use Smart Community. Start exploring the features and enjoy the convenience of managing everything in one place!',
    target: 'body',
    position: 'center',
    order: 9,
    completed: false,
    highlightElement: false,
    animation: 'bounce'
  }
];

const TutorialContext = createContext<TutorialContextType | undefined>(undefined);

export const TutorialProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [isTutorialActive, setIsTutorialActive] = useState(false);
  const [currentStep, setCurrentStep] = useState<TutorialStep | null>(null);
  const [tutorialSteps, setTutorialSteps] = useState<TutorialStep[]>(defaultTutorialSteps);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);

  const tutorialProgress = tutorialSteps.filter(step => step.completed).length / tutorialSteps.length;

  const startTutorial = () => {
    setIsTutorialActive(true);
    setCurrentStepIndex(0);
    setCurrentStep(tutorialSteps[0]);
  };

  const navigateToStep = (step: TutorialStep) => {
    if (step.route && step.navigateBeforeStep) {
      // Navigate to the required page before showing the step
      window.location.href = step.route;
    }
  };

  const completeStep = (stepId: string) => {
    const updatedSteps = tutorialSteps.map(step =>
      step.id === stepId ? { ...step, completed: true } : step
    );
    setTutorialSteps(updatedSteps);

    // Move to next step or complete tutorial
    if (currentStepIndex < tutorialSteps.length - 1) {
      nextStep();
    } else {
      completeTutorial();
    }
  };

  const nextStep = () => {
    if (currentStepIndex < tutorialSteps.length - 1) {
      const nextIndex = currentStepIndex + 1;
      const nextStep = tutorialSteps[nextIndex];
      
      setCurrentStepIndex(nextIndex);
      setCurrentStep(nextStep);
      
      // Navigate to the correct page for the next step
      navigateToStep(nextStep);
    }
  };

  const previousStep = () => {
    if (currentStepIndex > 0) {
      const prevIndex = currentStepIndex - 1;
      const prevStep = tutorialSteps[prevIndex];
      
      setCurrentStepIndex(prevIndex);
      setCurrentStep(prevStep);
      
      // Navigate to the correct page for the previous step
      navigateToStep(prevStep);
    }
  };

  const skipTutorial = () => {
    setIsTutorialActive(false);
    setCurrentStep(null);
    setCurrentStepIndex(0);
    // Mark tutorial as completed
    secureStorage.set('tutorial_completed', 'true');
  };

  const resetTutorial = () => {
    const resetSteps = tutorialSteps.map(step => ({ ...step, completed: false }));
    setTutorialSteps(resetSteps);
    setCurrentStepIndex(0);
    setCurrentStep(resetSteps[0]);
  };

  const completeTutorial = () => {
    setIsTutorialActive(false);
    setCurrentStep(null);
    // Save completion status
    secureStorage.set('tutorial_completed', 'true');
  };

  const highlightElement = (selector: string) => {
    // This will be implemented in the enhanced overlay
    console.log('Highlighting element:', selector);
  };

  const clearHighlight = () => {
    // This will be implemented in the enhanced overlay
    console.log('Clearing highlight');
  };

  const getElementPosition = (selector: string): DOMRect | null => {
    try {
      const element = document.querySelector(selector);
      return element ? element.getBoundingClientRect() : null;
    } catch (error) {
      console.error('Error getting element position:', error);
      return null;
    }
  };

  const validateStepCompletion = (stepId: string): boolean => {
    const step = tutorialSteps.find(s => s.id === stepId);
    if (!step) return false;

    // Check if user has interacted with the target element
    if (step.interactive && step.actionRequired) {
      // This will be enhanced with actual validation logic
      return true;
    }

    return true;
  };

  const checkTutorialStatus = async () => {
    try {
      const completed = await secureStorage.get('tutorial_completed');
      if (completed === 'true') {
        // Tutorial already completed
        return;
      }
      
      // Check if user is signed in and show tutorial
      const token = await secureStorage.get('token');
      if (token) {
        // User is signed in, show tutorial
        startTutorial();
      }
    } catch (error) {
      console.error('Error checking tutorial status:', error);
    }
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
    highlightElement,
    clearHighlight,
    getElementPosition,
    tutorialProgress,
    validateStepCompletion,
    navigateToStep
  };

  return (
    <TutorialContext.Provider value={value}>
      {children}
    </TutorialContext.Provider>
  );
};

export const useTutorial = (): TutorialContextType => {
  const context = useContext(TutorialContext);
  if (context === undefined) {
    throw new Error('useTutorial must be used within a TutorialProvider');
  }
  return context;
}; 