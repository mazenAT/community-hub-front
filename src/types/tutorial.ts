export interface TutorialStep {
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
  // Payment-specific properties
  paymentMethod?: 'paymob_card' | 'paymob_wallet' | 'none';
  requiresBilling?: boolean; // Whether this step requires billing information
  securityLevel?: 'low' | 'medium' | 'high'; // Security level for payment steps
}

export interface TutorialCategory {
  id: string;
  name: string;
  description: string;
  icon: string;
  steps: TutorialStep[];
}

export interface TutorialProgress {
  completedSteps: number;
  totalSteps: number;
  percentage: number;
  currentStepIndex: number;
  isCompleted: boolean;
}

export interface TutorialSettings {
  autoStart: boolean;
  showHints: boolean;
  skipOnboarding: boolean;
  enableSound: boolean;
  animationSpeed: 'slow' | 'normal' | 'fast';
}

export interface TutorialAnalytics {
  stepId: string;
  stepTitle: string;
  completedAt: string;
  timeSpent: number; // in seconds
  userAction: string;
  page: string;
  paymentMethod?: string;
}

export interface TutorialContextType {
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
  // Payment-specific methods
  validatePaymentStep: (stepId: string, paymentData?: any) => boolean;
  getPaymentSteps: () => TutorialStep[];
  // Analytics
  trackTutorialEvent: (event: TutorialAnalytics) => void;
}