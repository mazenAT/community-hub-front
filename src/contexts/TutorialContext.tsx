import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
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
    description: 'This is your financial command center! Here you can:\n\n• View your current balance\n• See recent transactions\n• Access Fawry payment gateway\n• Manage your account',
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
    description: 'Click this button to add money to your wallet:\n\n• Fawry payment gateway\n• Secure 3DS authentication\n• Instant balance updates\n• Transaction history tracking',
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

  // RECHARGE PAGE TUTORIAL
  {
    id: 'recharge-amount',
    title: 'Select Recharge Amount 💰',
    description: 'Choose how much money to add to your wallet:\n\n• Quick preset amounts (50, 100, 200, 500 EGP)\n• Custom amount option\n• Secure Fawry payment processing',
    target: '[data-tutorial="recharge-amount"]',
    position: 'bottom',
    order: 7,
    completed: false,
    page: 'recharge',
    route: '/recharge',
    highlightElement: true,
    spotlightRadius: 120,
    animation: 'pulse',
    interactive: true,
    actionRequired: 'click',
    hint: 'Click on an amount or enter a custom value',
    showArrow: true,
    arrowDirection: 'up'
  },
  {
    id: 'recharge-payment-method',
    title: 'Payment Method 💳',
    description: 'Secure payment processing:\n\n• Fawry payment gateway\n• Safe and encrypted transactions\n• 3DS authentication for security',
    target: '[data-tutorial="recharge-payment-method"]',
    position: 'right',
    order: 8,
    completed: false,
    page: 'recharge',
    route: '/recharge',
    highlightElement: true,
    spotlightRadius: 100,
    animation: 'glow',
    interactive: false
  },
  {
    id: 'recharge-card-info',
    title: 'Payment Information 🏦',
    description: 'Enter your payment details:\n\n• Use saved cards for quick checkout\n• Add new card information\n• Secure card tokenization via Fawry',
    target: '[data-tutorial="recharge-card-info"]',
    position: 'left',
    order: 9,
    completed: false,
    page: 'recharge',
    route: '/recharge',
    highlightElement: true,
    spotlightRadius: 120,
    animation: 'glow',
    interactive: true,
    actionRequired: 'click',
    hint: 'Choose between saved card or new card',
    showArrow: true,
    arrowDirection: 'right'
  },
  {
    id: 'recharge-total',
    title: 'Payment Summary 📋',
    description: 'Review your payment details:\n\n• Total amount to recharge\n• Current wallet balance\n• Payment confirmation',
    target: '[data-tutorial="recharge-total"]',
    position: 'top',
    order: 10,
    completed: false,
    page: 'recharge',
    route: '/recharge',
    highlightElement: true,
    spotlightRadius: 100,
    animation: 'glow',
    interactive: false
  },
  {
    id: 'recharge-pay-button',
    title: 'Complete Payment 💳',
    description: 'Ready to add money to your wallet:\n\n• Secure 3DS authentication\n• Instant balance update\n• Transaction confirmation',
    target: '[data-tutorial="recharge-pay-button"]',
    position: 'top',
    order: 11,
    completed: false,
    page: 'recharge',
    route: '/recharge',
    highlightElement: true,
    spotlightRadius: 80,
    animation: 'pulse',
    interactive: true,
    actionRequired: 'click',
    hint: 'Click the Pay button to complete your recharge',
    showArrow: true,
    arrowDirection: 'up'
  },

  // MEAL PLANNER PAGE TUTORIAL
  {
    id: 'planner-header',
    title: 'Meal Planning Hub 🍽️',
    description: 'Welcome to your meal planning center! Here you can:\n\n• Browse weekly meal schedules\n• Pre-order meals for your family\n• View nutritional information\n• Manage dietary preferences',
    target: '[data-tutorial="planner-header"]',
    position: 'bottom',
    order: 12,
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
    order: 13,
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
    order: 14,
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
    id: 'planner-meal-filters',
    title: 'Filter Meals by Type 🥗',
    description: 'Find exactly what you\'re looking for:\n\n• All Meals - Complete menu\n• Hot Meal - Cooked dishes\n• Sandwich - Quick options\n• Burger - Fast food\n• Crepe - Sweet treats\n• Nursery - Young children meals',
    target: '[data-tutorial="planner-meal-filters"]',
    position: 'left',
    order: 15,
    completed: false,
    page: 'planner',
    route: '/planner',
    highlightElement: true,
    spotlightRadius: 100,
    animation: 'glow',
    interactive: true,
    actionRequired: 'click',
    hint: 'Click on meal type buttons to filter',
    showArrow: true,
    arrowDirection: 'right'
  },
  {
    id: 'planner-meal-grid',
    title: 'Meal Options 🥗',
    description: 'Explore the available meals for each day:\n\n• Different meal categories\n• Pricing information\n• Nutritional details\n• Pre-order options',
    target: '[data-tutorial="meal-list"]',
    position: 'left',
    order: 16,
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
    title: 'View Full Menu 📋',
    description: 'Access the complete meal plan:\n\n• Download PDF menu\n• See all available options\n• Plan your family\'s meals\n• Make informed decisions',
    target: '[data-tutorial="planner-order-button"]',
    position: 'bottom',
    order: 17,
    completed: false,
    page: 'planner',
    route: '/planner',
    highlightElement: true,
    spotlightRadius: 60,
    animation: 'pulse',
    interactive: true,
    actionRequired: 'click',
    hint: 'Click to view the complete menu PDF',
    showArrow: true,
    arrowDirection: 'up'
  },

  // ORDERS PAGE TUTORIAL
  {
    id: 'orders-header',
    title: 'Order Management 📋',
    description: 'Track all your meal and add-on orders:\n\n• View order history\n• Check order status\n• Filter by family member\n• Monitor deliveries',
    target: '[data-tutorial="orders-header"]',
    position: 'bottom',
    order: 18,
    completed: false,
    page: 'orders',
    route: '/orders',
    highlightElement: true,
    spotlightRadius: 120,
    animation: 'pulse',
    interactive: false
  },
  {
    id: 'orders-filter',
    title: 'Filter Orders 👨‍👩‍👧‍👦',
    description: 'Organize your orders by family member:\n\n• View all orders together\n• Filter by specific family member\n• Track individual preferences\n• Manage multiple accounts',
    target: '[data-tutorial="orders-filter"]',
    position: 'right',
    order: 19,
    completed: false,
    page: 'orders',
    route: '/orders',
    highlightElement: true,
    spotlightRadius: 80,
    animation: 'glow',
    interactive: true,
    actionRequired: 'click',
    hint: 'Select a family member to filter orders',
    showArrow: true,
    arrowDirection: 'left'
  },

  // PROFILE PAGE TUTORIAL
  {
    id: 'profile-header',
    title: 'Your Profile & Settings ⚙️',
    description: 'Manage your personal information and preferences:\n\n• Update contact details\n• Change passwords\n• Manage family members\n• Set dietary preferences',
    target: '[data-tutorial="profile-header"]',
    position: 'bottom',
    order: 20,
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
    order: 21,
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
    id: 'profile-edit',
    title: 'Edit Profile Information ✏️',
    description: 'Update your personal details:\n\n• Change your name\n• Update phone number\n• Add allergy information\n• Save preferences',
    target: '[data-tutorial="profile-edit"]',
    position: 'left',
    order: 22,
    completed: false,
    page: 'profile',
    route: '/profile',
    highlightElement: true,
    spotlightRadius: 80,
    animation: 'glow',
    interactive: true,
    actionRequired: 'click',
    hint: 'Click to edit your profile information',
    showArrow: true,
    arrowDirection: 'right'
  },
  {
    id: 'profile-settings',
    title: 'Account Settings 🔧',
    description: 'Customize your app experience:\n\n• Update personal information\n• Change security settings\n• Manage notifications\n• View activity history',
    target: '[data-tutorial="profile-settings"]',
    position: 'left',
    order: 23,
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
    description: 'Excellent! You now know how to use Smart Community:\n\n• Navigate between features\n• Manage your wallet and recharge\n• Plan and order meals\n• Track orders and manage profile\n\nStart exploring and enjoy the convenience!',
    target: 'body',
    position: 'center',
    order: 24,
    completed: false,
    page: 'completion',
    route: '/wallet',
    highlightElement: false,
    animation: 'bounce'
  }
];

const TutorialContext = createContext<TutorialContextType | undefined>(undefined);

export const TutorialProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isTutorialActive, setIsTutorialActive] = useState(false);
  const [currentStep, setCurrentStep] = useState<TutorialStep | null>(null);
  const [tutorialSteps, setTutorialSteps] = useState<TutorialStep[]>(defaultTutorialSteps);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [currentPage, setCurrentPage] = useState<string>('welcome');

  // Save tutorial state to localStorage when it changes
  useEffect(() => {
    if (isTutorialActive) {
      localStorage.setItem('tutorial_active', 'true');
      localStorage.setItem('tutorial_step_index', currentStepIndex.toString());
      localStorage.setItem('tutorial_steps', JSON.stringify(tutorialSteps));
    } else {
      localStorage.removeItem('tutorial_active');
      localStorage.removeItem('tutorial_step_index');
      localStorage.removeItem('tutorial_steps');
    }
  }, [isTutorialActive, currentStepIndex, tutorialSteps]);

  // Restore tutorial state on mount
  useEffect(() => {
    const isActive = localStorage.getItem('tutorial_active') === 'true';
    const savedIndex = localStorage.getItem('tutorial_step_index');
    const savedSteps = localStorage.getItem('tutorial_steps');
    
    if (isActive && savedIndex && savedSteps) {
      const index = parseInt(savedIndex);
      const steps = JSON.parse(savedSteps) as TutorialStep[];
      
      setIsTutorialActive(true);
      setTutorialSteps(steps);
      setCurrentStepIndex(index);
      setCurrentStep(steps[index]);
      setCurrentPage(steps[index].page);
    }
  }, []);

  const tutorialProgress = tutorialSteps.filter(step => step.completed).length / tutorialSteps.length;

  const startTutorial = () => {
    // Check if we're on a mobile device
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    
    // For mobile devices, add a small delay to ensure DOM is ready
    if (isMobile) {
      setTimeout(() => {
        setIsTutorialActive(true);
        setCurrentStepIndex(0);
        setCurrentStep(tutorialSteps[0]);
        setCurrentPage(tutorialSteps[0].page);
        
        // Ensure the first step is visible on mobile
        setTimeout(() => {
          const targetElement = document.querySelector(tutorialSteps[0].target);
          if (targetElement) {
            targetElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
          }
        }, 300);
      }, 100);
    } else {
      // Desktop - immediate start
      setIsTutorialActive(true);
      setCurrentStepIndex(0);
      setCurrentStep(tutorialSteps[0]);
      setCurrentPage(tutorialSteps[0].page);
    }
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
    // Check if we need to navigate to a different page
    if (step.route && location.pathname !== step.route) {
      // Navigate to the required page
      navigate(step.route);
      // The tutorial will continue on the new page
    }
  };
  
  // Watch for route changes to continue tutorial on new page
  useEffect(() => {
    if (isTutorialActive && currentStep) {
      // Check if the current step matches the current route
      if (currentStep.route === location.pathname) {
        // We're on the correct page, ensure the step is visible
        // Small delay to allow page to render
        setTimeout(() => {
          const targetElement = document.querySelector(currentStep.target);
          if (targetElement) {
            // Scroll element into view if needed
            targetElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
          }
        }, 500);
      }
    }
  }, [location.pathname, isTutorialActive, currentStep]);

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
    // Clear localStorage
    localStorage.removeItem('tutorial_active');
    localStorage.removeItem('tutorial_step_index');
    localStorage.removeItem('tutorial_steps');
  };

  const resetTutorial = () => {
    const resetSteps = tutorialSteps.map(step => ({ ...step, completed: false }));
    setTutorialSteps(resetSteps);
    setCurrentStepIndex(0);
    setCurrentStep(resetSteps[0]);
    setCurrentPage('welcome');
    // Clear localStorage
    localStorage.removeItem('tutorial_active');
    localStorage.removeItem('tutorial_step_index');
    localStorage.removeItem('tutorial_steps');
  };

  const completeTutorial = () => {
    setIsTutorialActive(false);
    setCurrentStep(null);
    setCurrentStepIndex(0);
    setCurrentPage('welcome');
    // Save completion status
    secureStorage.set('tutorial_completed', 'true');
    // Clear localStorage
    localStorage.removeItem('tutorial_active');
    localStorage.removeItem('tutorial_step_index');
    localStorage.removeItem('tutorial_steps');
  };

  const highlightElement = (selector: string) => {
    // This will be implemented in the enhanced overlay
  };

  const clearHighlight = () => {
    // This will be implemented in the enhanced overlay
  };

  const getElementPosition = (selector: string): DOMRect | null => {
    try {
      const element = document.querySelector(selector);
      return element ? element.getBoundingClientRect() : null;
    } catch (error) {
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
        // Tutorial already completed - don't auto-start
        return;
      }
      
      // Don't automatically start tutorial - let user choose when to start
      // Tutorial will only start when user manually clicks the tutorial button
    } catch (error) {
      // Silent error handling
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