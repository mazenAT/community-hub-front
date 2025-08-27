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
  // Page-specific properties
  page: string; // Which page this step belongs to
  route: string; // Route to navigate to
  // Interactive properties
  highlightElement: boolean; // Whether to highlight the target element
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
  // Page-specific tutorial
  startPageTutorial: (page: string) => void;
  getCurrentPageSteps: () => TutorialStep[];
}

const defaultTutorialSteps: TutorialStep[] = [
  // WELCOME & OVERVIEW
  {
    id: 'welcome',
    title: 'Welcome to Smart Community! 🎉',
    description: 'Your all-in-one app for managing school meals, payments, and family activities. Let\'s take a guided tour through each feature!',
    target: 'body',
    position: 'center',
    order: 1,
    completed: false,
    page: 'welcome',
    route: '/wallet',
    highlightElement: false,
    animation: 'bounce'
  },

  // WALLET PAGE TUTORIAL
  {
    id: 'wallet-header',
    title: 'Wallet Dashboard 💳',
    description: 'This is your financial command center! Here you can:\n\n• View your current balance\n• See recent transactions\n• Access payment options\n• Manage your account',
    target: '[data-tutorial="wallet-header"]',
    position: 'bottom',
    order: 2,
    completed: false,
    page: 'wallet',
    route: '/wallet',
    highlightElement: true,
    spotlightRadius: 120,
    animation: 'pulse',
    interactive: false
  },
  {
    id: 'wallet-balance',
    title: 'Your Balance 💰',
    description: 'This card shows your current wallet balance. You can:\n\n• Add money using the "Recharge" button\n• Request refunds if needed\n• See your total available funds',
    target: '[data-tutorial="wallet-balance"]',
    position: 'right',
    order: 3,
    completed: false,
    page: 'wallet',
    route: '/wallet',
    highlightElement: true,
    spotlightRadius: 100,
    animation: 'glow',
    interactive: false
  },
  {
    id: 'wallet-recharge',
    title: 'Add Money to Wallet ➕',
    description: 'Click this button to add money to your wallet:\n\n• Secure payment methods\n• Multiple recharge options\n• Instant balance updates\n• Transaction history tracking',
    target: '[data-tutorial="wallet-recharge"]',
    position: 'top',
    order: 4,
    completed: false,
    page: 'wallet',
    route: '/wallet',
    highlightElement: true,
    spotlightRadius: 60,
    animation: 'pulse',
    interactive: true,
    actionRequired: 'click',
    hint: 'Click the Recharge button to add money',
    showArrow: true,
    arrowDirection: 'down'
  },
  {
    id: 'wallet-transactions',
    title: 'Transaction History 📊',
    description: 'Keep track of all your financial activities:\n\n• See when money was added\n• Track spending on meals\n• View refund requests\n• Monitor payment confirmations',
    target: '[data-tutorial="wallet-transactions"]',
    position: 'left',
    order: 5,
    completed: false,
    page: 'wallet',
    route: '/wallet',
    highlightElement: true,
    spotlightRadius: 80,
    animation: 'glow',
    interactive: false
  },
  {
    id: 'wallet-navigation',
    title: 'Navigate to Other Features 🧭',
    description: 'Use the bottom navigation to explore other app features:\n\n• View Menu - Browse meal plans\n• Contact Us - Get help and support\n• Profile - Manage your account',
    target: '[data-tutorial="wallet-nav"]',
    position: 'top',
    order: 6,
    completed: false,
    page: 'wallet',
    route: '/wallet',
    highlightElement: true,
    spotlightRadius: 80,
    animation: 'pulse',
    interactive: true,
    actionRequired: 'click',
    hint: 'Click any navigation icon to explore',
    showArrow: true,
    arrowDirection: 'down'
  },

  // MEAL PLANNER PAGE TUTORIAL
  {
    id: 'planner-header',
    title: 'Meal Planning Hub 🍽️',
    description: 'Welcome to your meal planning center! Here you can:\n\n• Browse weekly meal schedules\n• Pre-order meals for your family\n• View nutritional information\n• Manage dietary preferences',
    target: '[data-tutorial="planner-header"]',
    position: 'bottom',
    order: 7,
    completed: false,
    page: 'planner',
    route: '/planner',
    highlightElement: true,
    spotlightRadius: 120,
    animation: 'pulse',
    interactive: false
  },
  {
    id: 'planner-family-selector',
    title: 'Choose Family Member 👨‍👩‍👧‍👦',
    description: 'Select which family member you\'re ordering for:\n\n• Different meal preferences\n• Individual dietary needs\n• Separate order tracking\n• Personalized recommendations',
    target: '[data-tutorial="planner-family-selector"]',
    position: 'right',
    order: 8,
    completed: false,
    page: 'planner',
    route: '/planner',
    highlightElement: true,
    spotlightRadius: 80,
    animation: 'glow',
    interactive: true,
    actionRequired: 'click',
    hint: 'Select a family member from the dropdown',
    showArrow: true,
    arrowDirection: 'left'
  },
  {
    id: 'planner-week-selector',
    title: 'Select Week 📅',
    description: 'Choose which week\'s meals to view:\n\n• Browse different weeks\n• See meal variations\n• Plan ahead for your family\n• Check availability',
    target: '[data-tutorial="planner-week-selector"]',
    position: 'right',
    order: 9,
    completed: false,
    page: 'planner',
    route: '/planner',
    highlightElement: true,
    spotlightRadius: 80,
    animation: 'glow',
    interactive: true,
    actionRequired: 'click',
    hint: 'Click on different week buttons',
    showArrow: true,
    arrowDirection: 'left'
  },
  {
    id: 'planner-meal-grid',
    title: 'Meal Options 🥗',
    description: 'Explore the available meals for each day:\n\n• Different meal categories\n• Pricing information\n• Nutritional details\n• Pre-order options',
    target: '[data-tutorial="meal-list"]',
    position: 'left',
    order: 10,
    completed: false,
    page: 'planner',
    route: '/planner',
    highlightElement: true,
    spotlightRadius: 120,
    animation: 'glow',
    interactive: true,
    actionRequired: 'scroll',
    hint: 'Scroll through the meal options for each day'
  },
  {
    id: 'planner-order-button',
    title: 'Order Your Meals 🛒',
    description: 'Ready to order? Click the order button:\n\n• Secure payment processing\n• Order confirmation\n• Delivery tracking\n• Easy reordering',
    target: '[data-tutorial="planner-order-button"]',
    position: 'bottom',
    order: 11,
    completed: false,
    page: 'planner',
    route: '/planner',
    highlightElement: true,
    spotlightRadius: 60,
    animation: 'pulse',
    interactive: true,
    actionRequired: 'click',
    hint: 'Click the order button for your selected meals',
    showArrow: true,
    arrowDirection: 'up'
  },

  // PROFILE PAGE TUTORIAL
  {
    id: 'profile-header',
    title: 'Your Profile & Settings ⚙️',
    description: 'Manage your personal information and preferences:\n\n• Update contact details\n• Change passwords\n• Manage family members\n• Set dietary preferences',
    target: '[data-tutorial="profile-header"]',
    position: 'bottom',
    order: 12,
    completed: false,
    page: 'profile',
    route: '/profile',
    highlightElement: true,
    spotlightRadius: 120,
    animation: 'pulse',
    interactive: false
  },
  {
    id: 'profile-family-management',
    title: 'Family Member Management 👨‍👩‍👧‍👦',
    description: 'Add and manage your family members:\n\n• Add new family members\n• Set individual preferences\n• Manage allergies and dietary needs\n• Track orders per member',
    target: '[data-tutorial="profile-family-section"]',
    position: 'right',
    order: 13,
    completed: false,
    page: 'profile',
    route: '/profile',
    highlightElement: true,
    spotlightRadius: 100,
    animation: 'glow',
    interactive: true,
    actionRequired: 'click',
    hint: 'Click to add or manage family members',
    showArrow: true,
    arrowDirection: 'left'
  },
  {
    id: 'profile-settings',
    title: 'Account Settings 🔧',
    description: 'Customize your app experience:\n\n• Update personal information\n• Change security settings\n• Manage notifications\n• View activity history',
    target: '[data-tutorial="profile-settings"]',
    position: 'left',
    order: 14,
    completed: false,
    page: 'profile',
    route: '/profile',
    highlightElement: true,
    spotlightRadius: 80,
    animation: 'glow',
    interactive: true,
    actionRequired: 'click',
    hint: 'Click to access your account settings',
    showArrow: true,
    arrowDirection: 'right'
  },

  // COMPLETION
  {
    id: 'completion',
    title: 'Tutorial Complete! 🎓',
    description: 'Excellent! You now know how to use Smart Community:\n\n• Navigate between features\n• Manage your wallet\n• Plan and order meals\n• Manage your profile\n\nStart exploring and enjoy the convenience!',
    target: 'body',
    position: 'center',
    order: 15,
    completed: false,
    page: 'completion',
    route: '/wallet',
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
  const [currentPage, setCurrentPage] = useState<string>('welcome');

  const tutorialProgress = tutorialSteps.filter(step => step.completed).length / tutorialSteps.length;

  const startTutorial = () => {
    setIsTutorialActive(true);
    setCurrentStepIndex(0);
    setCurrentStep(tutorialSteps[0]);
    setCurrentPage('welcome');
  };

  const startPageTutorial = (page: string) => {
    const pageSteps = tutorialSteps.filter(step => step.page === page);
    if (pageSteps.length > 0) {
      setIsTutorialActive(true);
      setCurrentStepIndex(0);
      setCurrentStep(pageSteps[0]);
      setCurrentPage(page);
    }
  };

  const getCurrentPageSteps = () => {
    return tutorialSteps.filter(step => step.page === currentPage);
  };

  const navigateToStep = (step: TutorialStep) => {
    if (step.route && step.route !== window.location.pathname) {
      // Navigate to the required page
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
      setCurrentPage(nextStep.page);
      
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
      setCurrentPage(prevStep.page);
      
      // Navigate to the correct page for the previous step
      navigateToStep(prevStep);
    }
  };

  const skipTutorial = () => {
    setIsTutorialActive(false);
    setCurrentStep(null);
    setCurrentStepIndex(0);
    setCurrentPage('welcome');
    // Mark tutorial as completed
    secureStorage.set('tutorial_completed', 'true');
  };

  const resetTutorial = () => {
    const resetSteps = tutorialSteps.map(step => ({ ...step, completed: false }));
    setTutorialSteps(resetSteps);
    setCurrentStepIndex(0);
    setCurrentStep(resetSteps[0]);
    setCurrentPage('welcome');
  };

  const completeTutorial = () => {
    setIsTutorialActive(false);
    setCurrentStep(null);
    setCurrentStepIndex(0);
    setCurrentPage('welcome');
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
    navigateToStep,
    startPageTutorial,
    getCurrentPageSteps
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