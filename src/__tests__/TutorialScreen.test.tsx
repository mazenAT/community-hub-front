import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { TutorialProvider } from '@/contexts/TutorialContext';
import TutorialOverlay from '@/components/TutorialOverlay';
import { analytics } from '@/services/analytics';

// Mock analytics service
jest.mock('@/services/analytics', () => ({
  analytics: {
    trackTutorialStarted: jest.fn(),
    trackTutorialCompleted: jest.fn(),
    trackTutorialSkipped: jest.fn(),
    trackStepCompleted: jest.fn(),
    trackStepSkipped: jest.fn(),
    trackPaymentMethodSelected: jest.fn(),
  }
}));

// Mock secure storage
jest.mock('@/services/native', () => ({
  secureStorage: {
    get: jest.fn(),
    set: jest.fn(),
  }
}));

const TutorialWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <BrowserRouter>
    <TutorialProvider>
      {children}
      <TutorialOverlay />
    </TutorialProvider>
  </BrowserRouter>
);

describe('TutorialScreen with Paymob Integration', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Mock localStorage
    Object.defineProperty(window, 'localStorage', {
      value: {
        getItem: jest.fn(),
        setItem: jest.fn(),
        removeItem: jest.fn(),
      },
      writable: true,
    });
  });

  describe('Tutorial Flow', () => {
    test('should start tutorial with welcome step', async () => {
      render(<TutorialWrapper><div>Test Content</div></TutorialWrapper>);
      
      // Mock tutorial start
      const { useTutorial } = require('@/contexts/TutorialContext');
      const { startTutorial } = useTutorial();
      
      startTutorial();
      
      await waitFor(() => {
        expect(screen.getByText('Welcome to Lite Bite Cafeteria System! 🎉')).toBeInTheDocument();
      });
    });

    test('should navigate through tutorial steps', async () => {
      render(<TutorialWrapper><div>Test Content</div></TutorialWrapper>);
      
      const { useTutorial } = require('@/contexts/TutorialContext');
      const { startTutorial, nextStep } = useTutorial();
      
      startTutorial();
      
      await waitFor(() => {
        expect(screen.getByText('Welcome to Lite Bite Cafeteria System! 🎉')).toBeInTheDocument();
      });
      
      // Click next to go to wallet step
      const nextButton = screen.getByText('Next');
      fireEvent.click(nextButton);
      
      await waitFor(() => {
        expect(screen.getByText('Wallet Dashboard 💳')).toBeInTheDocument();
      });
    });

    test('should complete tutorial successfully', async () => {
      render(<TutorialWrapper><div>Test Content</div></TutorialWrapper>);
      
      const { useTutorial } = require('@/contexts/TutorialContext');
      const { startTutorial, completeStep } = useTutorial();
      
      startTutorial();
      
      // Complete the tutorial
      completeStep('welcome');
      
      await waitFor(() => {
        expect(analytics.trackTutorialCompleted).toHaveBeenCalled();
      });
    });
  });

  describe('Paymob Payment Tutorial Steps', () => {
    test('should display card payment tutorial step', async () => {
      render(<TutorialWrapper><div>Test Content</div></TutorialWrapper>);
      
      const { useTutorial } = require('@/contexts/TutorialContext');
      const { startTutorial, nextStep } = useTutorial();
      
      startTutorial();
      
      // Navigate to payment method step
      for (let i = 0; i < 11; i++) {
        nextStep();
      }
      
      await waitFor(() => {
        expect(screen.getByText('Card Payments with Paymob 💳')).toBeInTheDocument();
        expect(screen.getByText(/Select "Card Payment" from payment options/)).toBeInTheDocument();
      });
    });

    test('should display mobile wallet payment tutorial step', async () => {
      render(<TutorialWrapper><div>Test Content</div></TutorialWrapper>);
      
      const { useTutorial } = require('@/contexts/TutorialContext');
      const { startTutorial, nextStep } = useTutorial();
      
      startTutorial();
      
      // Navigate to mobile wallet step
      for (let i = 0; i < 12; i++) {
        nextStep();
      }
      
      await waitFor(() => {
        expect(screen.getByText('Mobile Wallet Payments 📱')).toBeInTheDocument();
        expect(screen.getByText(/Choose "Mobile Wallet" payment method/)).toBeInTheDocument();
      });
    });

    test('should track payment method selection', async () => {
      render(<TutorialWrapper><div>Test Content</div></TutorialWrapper>);
      
      const { useTutorial } = require('@/contexts/TutorialContext');
      const { startTutorial, completeStep } = useTutorial();
      
      startTutorial();
      
      // Complete card payment step
      completeStep('paymob-card-payment');
      
      await waitFor(() => {
        expect(analytics.trackStepCompleted).toHaveBeenCalledWith(
          'paymob-card-payment',
          'Card Payments with Paymob 💳',
          11, // step index
          31, // total steps
          'recharge',
          undefined
        );
      });
    });
  });

  describe('Tutorial Analytics', () => {
    test('should track tutorial start', async () => {
      render(<TutorialWrapper><div>Test Content</div></TutorialWrapper>);
      
      const { useTutorial } = require('@/contexts/TutorialContext');
      const { startTutorial } = useTutorial();
      
      startTutorial();
      
      await waitFor(() => {
        expect(analytics.trackTutorialStarted).toHaveBeenCalledWith(31, 'welcome');
      });
    });

    test('should track tutorial skip', async () => {
      render(<TutorialWrapper><div>Test Content</div></TutorialWrapper>);
      
      const { useTutorial } = require('@/contexts/TutorialContext');
      const { startTutorial, skipTutorial } = useTutorial();
      
      startTutorial();
      skipTutorial();
      
      await waitFor(() => {
        expect(analytics.trackTutorialSkipped).toHaveBeenCalledWith(0, 31, 'welcome');
      });
    });

    test('should track step completion', async () => {
      render(<TutorialWrapper><div>Test Content</div></TutorialWrapper>);
      
      const { useTutorial } = require('@/contexts/TutorialContext');
      const { startTutorial, completeStep } = useTutorial();
      
      startTutorial();
      completeStep('welcome');
      
      await waitFor(() => {
        expect(analytics.trackStepCompleted).toHaveBeenCalledWith(
          'welcome',
          'Welcome to Lite Bite Cafeteria System! 🎉',
          0,
          31,
          'welcome',
          undefined
        );
      });
    });
  });

  describe('Payment Method Validation', () => {
    test('should validate card payment step', async () => {
      render(<TutorialWrapper><div>Test Content</div></TutorialWrapper>);
      
      const { useTutorial } = require('@/contexts/TutorialContext');
      const { startTutorial, validateStepCompletion } = useTutorial();
      
      startTutorial();
      
      // Test card payment step validation
      const isValid = validateStepCompletion('paymob-card-payment');
      expect(isValid).toBe(true);
    });

    test('should validate wallet payment step', async () => {
      render(<TutorialWrapper><div>Test Content</div></TutorialWrapper>);
      
      const { useTutorial } = require('@/contexts/TutorialContext');
      const { startTutorial, validateStepCompletion } = useTutorial();
      
      startTutorial();
      
      // Test wallet payment step validation
      const isValid = validateStepCompletion('paymob-wallet-payment');
      expect(isValid).toBe(true);
    });
  });

  describe('Tutorial Progress', () => {
    test('should calculate correct progress percentage', async () => {
      render(<TutorialWrapper><div>Test Content</div></TutorialWrapper>);
      
      const { useTutorial } = require('@/contexts/TutorialContext');
      const { startTutorial, completeStep, tutorialProgress } = useTutorial();
      
      startTutorial();
      
      // Complete first step
      completeStep('welcome');
      
      await waitFor(() => {
        expect(tutorialProgress).toBeCloseTo(1/31, 2);
      });
    });

    test('should show progress bar', async () => {
      render(<TutorialWrapper><div>Test Content</div></TutorialWrapper>);
      
      const { useTutorial } = require('@/contexts/TutorialContext');
      const { startTutorial } = useTutorial();
      
      startTutorial();
      
      await waitFor(() => {
        expect(screen.getByText('1 of 31 steps')).toBeInTheDocument();
        expect(screen.getByText('3% complete')).toBeInTheDocument();
      });
    });
  });

  describe('Tutorial Navigation', () => {
    test('should navigate to correct page for payment steps', async () => {
      render(<TutorialWrapper><div>Test Content</div></TutorialWrapper>);
      
      const { useTutorial } = require('@/contexts/TutorialContext');
      const { startTutorial, nextStep } = useTutorial();
      
      startTutorial();
      
      // Navigate to payment method step
      for (let i = 0; i < 11; i++) {
        nextStep();
      }
      
      await waitFor(() => {
        expect(screen.getByText(/Navigating to Recharge/)).toBeInTheDocument();
      });
    });

    test('should handle back navigation', async () => {
      render(<TutorialWrapper><div>Test Content</div></TutorialWrapper>);
      
      const { useTutorial } = require('@/contexts/TutorialContext');
      const { startTutorial, nextStep, previousStep } = useTutorial();
      
      startTutorial();
      nextStep();
      
      await waitFor(() => {
        expect(screen.getByText('Wallet Dashboard 💳')).toBeInTheDocument();
      });
      
      previousStep();
      
      await waitFor(() => {
        expect(screen.getByText('Welcome to Lite Bite Cafeteria System! 🎉')).toBeInTheDocument();
      });
    });
  });

  describe('Tutorial Completion', () => {
    test('should show completion message with Paymob features', async () => {
      render(<TutorialWrapper><div>Test Content</div></TutorialWrapper>);
      
      const { useTutorial } = require('@/contexts/TutorialContext');
      const { startTutorial, completeStep } = useTutorial();
      
      startTutorial();
      
      // Complete the last step
      completeStep('completion');
      
      await waitFor(() => {
        expect(screen.getByText('Tutorial Complete! 🎓')).toBeInTheDocument();
        expect(screen.getByText(/Use Paymob payment methods \(Card & Mobile Wallet\)/)).toBeInTheDocument();
      });
    });
  });
});