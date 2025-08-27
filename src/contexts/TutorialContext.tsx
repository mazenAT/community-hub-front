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
  // New interactive properties
  highlightElement?: boolean; // Whether to highlight the target element
  spotlightRadius?: number; // Radius of the spotlight effect
  animation?: 'pulse' | 'bounce' | 'shake' | 'glow' | 'none';
  interactive?: boolean; // Whether user needs to interact with the element
  actionRequired?: 'click' | 'scroll' | 'input' | 'none'; // What action is needed
  hint?: string; // Additional hint text
  showArrow?: boolean; // Whether to show directional arrow
  arrowDirection?: 'up' | 'down' | 'left' | 'right';
  // Game-like properties
  points?: number; // Points earned for completing this step
  difficulty?: 'easy' | 'medium' | 'hard';
  timeLimit?: number; // Optional time limit in seconds
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
  // New interactive features
  highlightElement: (selector: string) => void;
  clearHighlight: () => void;
  getElementPosition: (selector: string) => DOMRect | null;
  // Game-like features
  totalPoints: number;
  earnedPoints: number;
  tutorialProgress: number;
  achievements: string[];
  unlockAchievement: (achievement: string) => void;
  // Step validation
  validateStepCompletion: (stepId: string) => boolean;
  // Tutorial modes
  tutorialMode: 'guided' | 'exploration' | 'challenge';
  setTutorialMode: (mode: 'guided' | 'exploration' | 'challenge') => void;
}

const defaultTutorialSteps: TutorialStep[] = [
  {
    id: 'welcome',
    title: 'Welcome to Smart Community! 🎉',
    description: 'Your all-in-one app for managing school meals, payments, and family activities. Let\'s take an interactive tour!',
    target: 'body',
    position: 'center',
    order: 1,
    completed: false,
    highlightElement: false,
    animation: 'bounce',
    points: 10,
    difficulty: 'easy'
  },
  {
    id: 'wallet-tour',
    title: 'Digital Wallet 💳',
    description: 'Your financial hub! Click on the wallet icon to explore:\n\n• View balance and transactions\n• Add money securely\n• Manage payment methods\n• Request refunds',
    target: '[data-tutorial="wallet-nav"]',
    position: 'bottom',
    order: 2,
    completed: false,
    highlightElement: true,
    spotlightRadius: 60,
    animation: 'pulse',
    interactive: true,
    actionRequired: 'click',
    hint: 'Click the wallet icon in the bottom navigation',
    showArrow: true,
    arrowDirection: 'up',
    points: 20,
    difficulty: 'easy'
  },
  {
    id: 'wallet-features',
    title: 'Wallet Features 🔍',
    description: 'Great! Now let\'s explore what you can do:\n\n• Check your current balance\n• See transaction history\n• Add money to your wallet\n• Manage saved cards',
    target: '[data-tutorial="wallet-balance"]',
    position: 'right',
    order: 3,
    completed: false,
    highlightElement: true,
    spotlightRadius: 80,
    animation: 'glow',
    interactive: false,
    points: 15,
    difficulty: 'easy'
  },
  {
    id: 'meal-planning-intro',
    title: 'Smart Meal Planning 🍽️',
    description: 'Time to explore meal planning! Navigate to the meal planner to see:\n\n• Weekly meal schedules\n• Pre-order options\n• Family preferences',
    target: '[data-tutorial="meal-nav"]',
    position: 'bottom',
    order: 4,
    completed: false,
    highlightElement: true,
    spotlightRadius: 60,
    animation: 'pulse',
    interactive: true,
    actionRequired: 'click',
    hint: 'Click the meal planning icon',
    showArrow: true,
    arrowDirection: 'up',
    points: 25,
    difficulty: 'medium'
  },
  {
    id: 'meal-browsing',
    title: 'Browse Meals 🥗',
    description: 'Explore the meal options:\n\n• Scroll through different days\n• View meal categories\n• Check nutritional info\n• See pricing details',
    target: '[data-tutorial="meal-list"]',
    position: 'left',
    order: 5,
    completed: false,
    highlightElement: true,
    spotlightRadius: 100,
    animation: 'glow',
    interactive: true,
    actionRequired: 'scroll',
    hint: 'Scroll through the meal options',
    points: 20,
    difficulty: 'medium'
  },
  {
    id: 'family-setup',
    title: 'Family Management 👨‍👩‍👧‍👦',
    description: 'Set up your family members:\n\n• Add family members\n• Set dietary preferences\n• Manage allergies\n• Track individual orders',
    target: '[data-tutorial="family-nav"]',
    position: 'bottom',
    order: 6,
    completed: false,
    highlightElement: true,
    spotlightRadius: 60,
    animation: 'pulse',
    interactive: true,
    actionRequired: 'click',
    hint: 'Click the family icon to manage members',
    showArrow: true,
    arrowDirection: 'up',
    points: 30,
    difficulty: 'medium'
  },
  {
    id: 'notifications',
    title: 'Stay Connected 🔔',
    description: 'Never miss important updates:\n\n• Meal changes\n• Payment confirmations\n• School announcements\n• Order updates',
    target: '[data-tutorial="notifications"]',
    position: 'left',
    order: 7,
    completed: false,
    highlightElement: true,
    spotlightRadius: 50,
    animation: 'shake',
    interactive: false,
    points: 15,
    difficulty: 'easy'
  },
  {
    id: 'profile-settings',
    title: 'Your Profile & Settings ⚙️',
    description: 'Customize your experience:\n\n• Update personal info\n• Change preferences\n• Manage security\n• View activity',
    target: '[data-tutorial="profile-nav"]',
    position: 'bottom',
    order: 8,
    completed: false,
    highlightElement: true,
    spotlightRadius: 60,
    animation: 'pulse',
    interactive: true,
    actionRequired: 'click',
    hint: 'Click your profile icon',
    showArrow: true,
    arrowDirection: 'up',
    points: 20,
    difficulty: 'easy'
  },
  {
    id: 'challenge-completion',
    title: 'Tutorial Challenge Complete! 🏆',
    description: 'Amazing job! You\'ve completed the interactive tour.\n\n🎯 Total Points: {points}\n🏅 Difficulty: {difficulty}\n⭐ Achievements: {achievements}\n\nYou\'re ready to explore Smart Community!',
    target: 'body',
    position: 'center',
    order: 9,
    completed: false,
    highlightElement: false,
    animation: 'bounce',
    points: 50,
    difficulty: 'hard'
  }
];

const TutorialContext = createContext<TutorialContextType | undefined>(undefined);

export const TutorialProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [isTutorialActive, setIsTutorialActive] = useState(false);
  const [currentStep, setCurrentStep] = useState<TutorialStep | null>(null);
  const [tutorialSteps, setTutorialSteps] = useState<TutorialStep[]>(defaultTutorialSteps);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [totalPoints, setTotalPoints] = useState(0);
  const [earnedPoints, setEarnedPoints] = useState(0);
  const [achievements, setAchievements] = useState<string[]>([]);
  const [tutorialMode, setTutorialMode] = useState<'guided' | 'exploration' | 'challenge'>('guided');

  // Calculate total points and progress
  useEffect(() => {
    const total = tutorialSteps.reduce((sum, step) => sum + (step.points || 0), 0);
    setTotalPoints(total);
    
    const completed = tutorialSteps.filter(step => step.completed);
    const earned = completed.reduce((sum, step) => sum + (step.points || 0), 0);
    setEarnedPoints(earned);
  }, [tutorialSteps]);

  const tutorialProgress = tutorialSteps.filter(step => step.completed).length / tutorialSteps.length;

  const startTutorial = () => {
    setIsTutorialActive(true);
    setCurrentStepIndex(0);
    setCurrentStep(tutorialSteps[0]);
    setEarnedPoints(0);
    setAchievements([]);
  };

  const completeStep = (stepId: string) => {
    const updatedSteps = tutorialSteps.map(step =>
      step.id === stepId ? { ...step, completed: true } : step
    );
    setTutorialSteps(updatedSteps);

    // Award points
    const step = tutorialSteps.find(s => s.id === stepId);
    const points = step?.points || 0;
    if (points > 0) {
      setEarnedPoints(prev => prev + points);
    }

    // Check for achievements
    checkAchievements(updatedSteps);

    // Move to next step or complete tutorial
    if (currentStepIndex < tutorialSteps.length - 1) {
      nextStep();
    } else {
      completeTutorial();
    }
  };

  const checkAchievements = (steps: TutorialStep[]) => {
    const newAchievements: string[] = [];
    
    // First step achievement
    if (steps[0].completed && !achievements.includes('First Steps')) {
      newAchievements.push('First Steps');
    }
    
    // Halfway achievement
    const completedCount = steps.filter(s => s.completed).length;
    if (completedCount >= Math.ceil(steps.length / 2) && !achievements.includes('Halfway There')) {
      newAchievements.push('Halfway There');
    }
    
    // Speed achievement (if tutorial completed quickly)
    if (completedCount === steps.length && !achievements.includes('Speed Runner')) {
      newAchievements.push('Speed Runner');
    }
    
    // Perfect score achievement
    if (earnedPoints >= totalPoints * 0.9 && !achievements.includes('Perfect Score')) {
      newAchievements.push('Perfect Score');
    }

    if (newAchievements.length > 0) {
      setAchievements(prev => [...prev, ...newAchievements]);
    }
  };

  const unlockAchievement = (achievement: string) => {
    if (!achievements.includes(achievement)) {
      setAchievements(prev => [...prev, achievement]);
    }
  };

  const nextStep = () => {
    if (currentStepIndex < tutorialSteps.length - 1) {
      const nextIndex = currentStepIndex + 1;
      setCurrentStepIndex(nextIndex);
      setCurrentStep(tutorialSteps[nextIndex]);
    }
  };

  const previousStep = () => {
    if (currentStepIndex > 0) {
      const prevIndex = currentStepIndex - 1;
      setCurrentStepIndex(prevIndex);
      setCurrentStep(tutorialSteps[prevIndex]);
    }
  };

  const skipTutorial = () => {
    setIsTutorialActive(false);
    setCurrentStep(null);
    setCurrentStepIndex(0);
  };

  const resetTutorial = () => {
    const resetSteps = tutorialSteps.map(step => ({ ...step, completed: false }));
    setTutorialSteps(resetSteps);
    setCurrentStepIndex(0);
    setCurrentStep(resetSteps[0]);
    setEarnedPoints(0);
    setAchievements([]);
  };

  const completeTutorial = () => {
    setIsTutorialActive(false);
    setCurrentStep(null);
    unlockAchievement('Tutorial Master');
    // Save completion status
    secureStorage.set('tutorial_completed', 'true');
    secureStorage.set('tutorial_score', earnedPoints.toString());
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
      
      // Check if it's user's first time
      const firstTime = await secureStorage.get('first_time_user');
      if (firstTime === 'true') {
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
    totalPoints,
    earnedPoints,
    tutorialProgress,
    achievements,
    unlockAchievement,
    validateStepCompletion,
    tutorialMode,
    setTutorialMode
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