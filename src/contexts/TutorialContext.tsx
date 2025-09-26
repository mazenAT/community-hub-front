import { secureStorage } from '@/services/native';
import React, { createContext, ReactNode, useContext, useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

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
  getFilteredTutorialSteps: () => TutorialStep[];
}

const defaultTutorialSteps: TutorialStep[] = [
  // WELCOME & OVERVIEW
  {
    id: 'welcome',
    title: 'Welcome to Lite Bite Cafeteria System! 🎉',
    description: 'Your all-in-one app for managing school meals, payments, and wallet management. Let\'s take a guided tour through each feature!',
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
    description: 'This is your financial command center! Here you can:\n\n• View your current balance\n• See recent transactions\n• Access payment gateways\n• Manage your account',
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
    description: 'Click this button to add money to your wallet:\n\n• InstaPay bank transfer\n• Secure authentication\n• Instant balance updates\n• Parent name validation',
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

  // RECHARGE PAGE TUTORIAL - UPDATED STEPS
  {
    id: 'recharge-amount',
    title: 'Enter Recharge Amount 💰',
    description: 'Enter how much money you want to add to your wallet:\n\n• Minimum amount: 10 EGP\n• Enter any amount you prefer\n• Amount will be validated during payment\n• Secure processing guaranteed',
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
    actionRequired: 'input',
    hint: 'Enter the amount you want to add to your wallet',
    showArrow: true,
    arrowDirection: 'up'
  },
  {
    id: 'recharge-payment-methods',
    title: 'Choose Payment Method 💳',
    description: 'Select your preferred payment method:\n\n• InstaPay - Bank transfer with receipt upload\n• Card Payment - Credit/Debit cards via Paymob\n• Mobile Wallet - Vodafone Cash, Orange Money\n• All methods are secure and encrypted',
    target: '[data-tutorial="recharge-payment-methods"]',
    position: 'right',
    order: 8,
    completed: false,
    page: 'recharge',
    route: '/recharge',
    highlightElement: true,
    spotlightRadius: 150,
    animation: 'glow',
    interactive: true,
    actionRequired: 'click',
    hint: 'Select your preferred payment method',
    showArrow: true,
    arrowDirection: 'left'
  },
  {
    id: 'recharge-continue-button',
    title: 'Continue to Payment ➡️',
    description: 'Click this button to proceed with your selected payment method:\n\n• Validates your amount\n• Redirects to payment processing\n• Secure authentication required\n• Instant balance update upon completion',
    target: '[data-tutorial="recharge-continue-button"]',
    position: 'top',
    order: 9,
    completed: false,
    page: 'recharge',
    route: '/recharge',
    highlightElement: true,
    spotlightRadius: 100,
    animation: 'pulse',
    interactive: true,
    actionRequired: 'click',
    hint: 'Click to continue with your payment',
    showArrow: true,
    arrowDirection: 'up'
  },

  // INSTAPAY SPECIFIC STEPS
  {
    id: 'instapay-transfer-details',
    title: 'InstaPay Transfer Details 🏦',
    description: 'Complete your bank transfer using these details:\n\n• Transfer the exact amount shown\n• Use the provided account number\n• Include parent name in transfer description\n• Keep your transfer receipt for upload',
    target: '[data-tutorial="instapay-transfer-details"]',
    position: 'left',
    order: 10,
    completed: false,
    page: 'recharge',
    route: '/recharge',
    highlightElement: true,
    spotlightRadius: 120,
    animation: 'glow',
    interactive: false
  },
  {
    id: 'instapay-receipt-upload',
    title: 'Upload Transfer Receipt 📸',
    description: 'Complete your InstaPay recharge:\n\n• Take a clear photo of your transfer receipt\n• Ensure all details are visible\n• Upload the image through the app\n• Automatic verification and balance update',
    target: '[data-tutorial="instapay-receipt-upload"]',
    position: 'top',
    order: 11,
    completed: false,
    page: 'recharge',
    route: '/recharge',
    highlightElement: true,
    spotlightRadius: 100,
    animation: 'pulse',
    interactive: true,
    actionRequired: 'click',
    hint: 'Upload your transfer receipt to complete the process',
    showArrow: true,
    arrowDirection: 'down'
  },

  // PAYMOB PAYMENT STEPS
  {
    id: 'paymob-card-redirect',
    title: 'Card Payment Processing 💳',
    description: 'You\'ll be redirected to Paymob for secure card payment:\n\n• Enter your card details securely\n• Complete 3DS authentication\n• Instant balance update\n• Transaction confirmation',
    target: '[data-tutorial="paymob-card-redirect"]',
    position: 'center',
    order: 12,
    completed: false,
    page: 'recharge',
    route: '/recharge',
    highlightElement: true,
    spotlightRadius: 120,
    animation: 'pulse',
    interactive: false
  },
  {
    id: 'paymob-wallet-redirect',
    title: 'Mobile Wallet Payment 📱',
    description: 'Complete payment through your mobile wallet:\n\n• Redirected to wallet provider\n• Enter wallet PIN/password\n• Confirm payment amount\n• Instant balance update',
    target: '[data-tutorial="paymob-wallet-redirect"]',
    position: 'center',
    order: 13,
    completed: false,
    page: 'recharge',
    route: '/recharge',
    highlightElement: true,
    spotlightRadius: 120,
    animation: 'pulse',
    interactive: false
  },


  // MEAL PLANNER PAGE TUTORIAL
  {
    id: 'planner-header',
    title: 'Meal Planning Hub 🍽️',
    description: 'Welcome to your meal planning center! Here you can:\n\n• Browse weekly meal schedules\n• Pre-order meals for your family\n• View meal details and pricing\n• Manage meal selections',
    target: '[data-tutorial="planner-header"]',
    position: 'bottom',
    order: 14,
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
    description: 'Select which family member you\'re ordering for:\n\n• Different meal preferences\n• Separate order tracking\n• Individual meal management\n• Family meal coordination',
    target: '[data-tutorial="planner-family-selector"]',
    position: 'right',
    order: 15,
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
    id: 'planner-filters',
    title: 'Filter and Organize Options 🔍',
    description: 'Use these controls to organize your meal planning:\n\n• Week Selection - Choose different time periods\n• Meal Type Filters - Browse specific categories\n• Custom Date Ranges - Plan for specific dates\n• Family Member Selection - Order for different family members',
    target: '[data-tutorial="planner-filters"]',
    position: 'left',
    order: 16,
    completed: false,
    page: 'planner',
    route: '/planner',
    highlightElement: true,
    spotlightRadius: 150,
    animation: 'glow',
    interactive: true,
    actionRequired: 'click',
    hint: 'Use these filters to organize your meal planning',
    showArrow: true,
    arrowDirection: 'right'
  },
  {
    id: 'planner-meal-grid',
    title: 'Meal Options 🥗',
    description: 'Explore the available meals for each day:\n\n• Different meal categories\n• Pricing information\n• Meal details\n• Pre-order options',
    target: '[data-tutorial="meal-list"]',
    position: 'left',
    order: 17,
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
    description: 'Access the complete menu:\n\n• Download PDF menu\n• See all available options\n• Plan your family\'s meals\n• Review meal selections',
    target: '[data-tutorial="planner-order-button"]',
    position: 'bottom',
    order: 18,
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
    order: 19,
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
    description: 'Organize your orders by family member:\n\n• View all orders together\n• Filter by specific family member\n• Track individual orders\n• Manage multiple accounts',
    target: '[data-tutorial="orders-filter"]',
    position: 'right',
    order: 20,
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
    description: 'Manage your personal information and preferences:\n\n• Update contact details\n• Change passwords\n• Manage family members\n• Set account preferences',
    target: '[data-tutorial="profile-header"]',
    position: 'bottom',
    order: 21,
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
    description: 'Add and manage your family members:\n\n• Add new family members\n• Set individual preferences\n• Manage account settings\n• Track orders per member',
    target: '[data-tutorial="profile-family-section"]',
    position: 'right',
    order: 22,
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
    description: 'Update your personal details:\n\n• Change your name\n• Update phone number\n• Modify account settings\n• Save preferences',
    target: '[data-tutorial="profile-edit"]',
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
    order: 24,
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

  // CONTACT US PAGE TUTORIAL
  {
    id: 'contact-header',
    title: 'Get Help & Support 📞',
    description: 'Need assistance? The Contact Us page is here to help:\n\n• Send us messages and questions\n• Get support for any issues\n• Report problems or suggestions\n• Quick response within 48 hours',
    target: '[data-tutorial="contact-header"]',
    position: 'bottom',
    order: 25,
    completed: false,
    page: 'contact',
    route: '/contact',
    highlightElement: true,
    spotlightRadius: 120,
    animation: 'pulse',
    interactive: false
  },
  {
    id: 'contact-form',
    title: 'Contact Form 📝',
    description: 'Fill out this form to get in touch:\n\n• Provide your contact information\n• Describe your question or issue\n• Submit and get a quick response\n• Track your support requests',
    target: '[data-tutorial="contact-form"]',
    position: 'top',
    order: 26,
    completed: false,
    page: 'contact',
    route: '/contact',
    highlightElement: true,
    spotlightRadius: 100,
    animation: 'glow',
    interactive: true,
    actionRequired: 'click',
    hint: 'Fill out the form to contact support',
    showArrow: true,
    arrowDirection: 'down'
  },

  // COMPLETION
  {
    id: 'completion',
    title: 'Tutorial Complete! 🎓',
    description: 'Excellent! You now know how to use Cafeteria Smart System:\n\n• Navigate between features\n• Manage your wallet and recharge\n• Use Paymob payment methods (Card & Mobile Wallet)\n• Use InstaPay bank transfers\n• Plan and order meals\n• Track orders and manage profile\n• Get help and support\n\nStart exploring and enjoy the convenience!',
    target: 'body',
    position: 'center',
    order: 27,
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

  // Filter tutorial steps based on current context (e.g., payment method selected)
  const getFilteredTutorialSteps = () => {
    return tutorialSteps.filter(step => {
      // Always include non-conditional steps
      if (!step.id.includes('paymob-') && !step.id.includes('instapay-')) {
        return true;
      }
      
      // For conditional steps, we would need to check the current state
      // This is a placeholder for future enhancement where we can check
      // the selected payment method from the recharge page state
      return true;
    });
  };

  const navigateToStep = (step: TutorialStep) => {
    // Handle conditional tutorial steps based on payment method
    if (step.id === 'paymob-card-redirect' || step.id === 'paymob-wallet-redirect') {
      // These steps only show for Paymob payments
      // Skip these steps if not in Paymob flow
      return;
    }
    
    if (step.id === 'instapay-transfer-details' || step.id === 'instapay-receipt-upload') {
      // These steps only show for InstaPay payments
      // Skip these steps if not in InstaPay flow
      return;
    }
    
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
      
      // Skip conditional steps that don't apply to current context
      if (nextStep.id === 'paymob-card-redirect' || nextStep.id === 'paymob-wallet-redirect') {
        // Skip Paymob steps if not in Paymob flow
        if (nextIndex < tutorialSteps.length - 1) {
          const skipIndex = nextIndex + 1;
          const skipStep = tutorialSteps[skipIndex];
          setCurrentStepIndex(skipIndex);
          setCurrentStep(skipStep);
          setCurrentPage(skipStep.page);
          navigateToStep(skipStep);
        }
        return;
      }
      
      if (nextStep.id === 'instapay-transfer-details' || nextStep.id === 'instapay-receipt-upload') {
        // Skip InstaPay steps if not in InstaPay flow
        if (nextIndex < tutorialSteps.length - 1) {
          const skipIndex = nextIndex + 1;
          const skipStep = tutorialSteps[skipIndex];
          setCurrentStepIndex(skipIndex);
          setCurrentStep(skipStep);
          setCurrentPage(skipStep.page);
          navigateToStep(skipStep);
        }
        return;
      }
      
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
    getCurrentPageSteps,
    getFilteredTutorialSteps
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