// Analytics service for tutorial and user interaction tracking
import { TutorialAnalytics } from '@/types/tutorial';

export interface AnalyticsEvent {
  eventType: string;
  eventName: string;
  properties: Record<string, any>;
  timestamp: string;
  userId?: string;
  sessionId: string;
}

export interface TutorialEvent extends AnalyticsEvent {
  eventType: 'tutorial';
  eventName: 'tutorial_started' | 'tutorial_completed' | 'tutorial_skipped' | 'step_completed' | 'step_skipped';
  properties: {
    stepId?: string;
    stepTitle?: string;
    stepIndex?: number;
    totalSteps?: number;
    page?: string;
    paymentMethod?: string;
    timeSpent?: number;
    userAction?: string;
  };
}

export interface PaymentEvent extends AnalyticsEvent {
  eventType: 'payment';
  eventName: 'payment_initiated' | 'payment_completed' | 'payment_failed' | 'payment_method_selected';
  properties: {
    paymentMethod: 'paymob_card' | 'paymob_wallet';
    amount?: number;
    currency?: string;
    transactionId?: string;
    errorMessage?: string;
    billingData?: any;
  };
}

export interface UserEvent extends AnalyticsEvent {
  eventType: 'user';
  eventName: 'user_registered' | 'user_logged_in' | 'user_logged_out' | 'profile_updated';
  properties: {
    userId: string;
    userType?: string;
    registrationMethod?: string;
  };
}

export type AnalyticsEventType = TutorialEvent | PaymentEvent | UserEvent;

class AnalyticsService {
  private sessionId: string;
  private userId?: string;
  private events: AnalyticsEventType[] = [];

  constructor() {
    this.sessionId = this.generateSessionId();
    this.loadStoredEvents();
  }

  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
  }

  private loadStoredEvents(): void {
    try {
      const stored = localStorage.getItem('analytics_events');
      if (stored) {
        this.events = JSON.parse(stored);
      }
    } catch (error) {
      console.error('Error loading stored analytics events:', error);
      this.events = [];
    }
  }

  private saveEvents(): void {
    try {
      localStorage.setItem('analytics_events', JSON.stringify(this.events));
    } catch (error) {
      console.error('Error saving analytics events:', error);
    }
  }

  private trackEvent(event: AnalyticsEventType): void {
    this.events.push(event);
    this.saveEvents();
    
    // Log to console in development
    if (process.env.NODE_ENV === 'development') {
      console.log('Analytics Event:', event);
    }
  }

  // Tutorial Analytics
  trackTutorialStarted(totalSteps: number, page: string): void {
    const event: TutorialEvent = {
      eventType: 'tutorial',
      eventName: 'tutorial_started',
      properties: {
        totalSteps,
        page,
        stepIndex: 0
      },
      timestamp: new Date().toISOString(),
      sessionId: this.sessionId,
      userId: this.userId
    };
    this.trackEvent(event);
  }

  trackTutorialCompleted(totalSteps: number, timeSpent: number): void {
    const event: TutorialEvent = {
      eventType: 'tutorial',
      eventName: 'tutorial_completed',
      properties: {
        totalSteps,
        timeSpent,
        stepIndex: totalSteps - 1
      },
      timestamp: new Date().toISOString(),
      sessionId: this.sessionId,
      userId: this.userId
    };
    this.trackEvent(event);
  }

  trackTutorialSkipped(currentStep: number, totalSteps: number, page: string): void {
    const event: TutorialEvent = {
      eventType: 'tutorial',
      eventName: 'tutorial_skipped',
      properties: {
        stepIndex: currentStep,
        totalSteps,
        page
      },
      timestamp: new Date().toISOString(),
      sessionId: this.sessionId,
      userId: this.userId
    };
    this.trackEvent(event);
  }

  trackStepCompleted(stepId: string, stepTitle: string, stepIndex: number, totalSteps: number, page: string, timeSpent?: number): void {
    const event: TutorialEvent = {
      eventType: 'tutorial',
      eventName: 'step_completed',
      properties: {
        stepId,
        stepTitle,
        stepIndex,
        totalSteps,
        page,
        timeSpent
      },
      timestamp: new Date().toISOString(),
      sessionId: this.sessionId,
      userId: this.userId
    };
    this.trackEvent(event);
  }

  trackStepSkipped(stepId: string, stepTitle: string, stepIndex: number, page: string): void {
    const event: TutorialEvent = {
      eventType: 'tutorial',
      eventName: 'step_skipped',
      properties: {
        stepId,
        stepTitle,
        stepIndex,
        page
      },
      timestamp: new Date().toISOString(),
      sessionId: this.sessionId,
      userId: this.userId
    };
    this.trackEvent(event);
  }

  // Payment Analytics
  trackPaymentInitiated(paymentMethod: 'paymob_card' | 'paymob_wallet', amount: number, currency: string = 'EGP'): void {
    const event: PaymentEvent = {
      eventType: 'payment',
      eventName: 'payment_initiated',
      properties: {
        paymentMethod,
        amount,
        currency
      },
      timestamp: new Date().toISOString(),
      sessionId: this.sessionId,
      userId: this.userId
    };
    this.trackEvent(event);
  }

  trackPaymentCompleted(paymentMethod: 'paymob_card' | 'paymob_wallet', amount: number, transactionId: string): void {
    const event: PaymentEvent = {
      eventType: 'payment',
      eventName: 'payment_completed',
      properties: {
        paymentMethod,
        amount,
        transactionId
      },
      timestamp: new Date().toISOString(),
      sessionId: this.sessionId,
      userId: this.userId
    };
    this.trackEvent(event);
  }

  trackPaymentFailed(paymentMethod: 'paymob_card' | 'paymob_wallet', amount: number, errorMessage: string): void {
    const event: PaymentEvent = {
      eventType: 'payment',
      eventName: 'payment_failed',
      properties: {
        paymentMethod,
        amount,
        errorMessage
      },
      timestamp: new Date().toISOString(),
      sessionId: this.sessionId,
      userId: this.userId
    };
    this.trackEvent(event);
  }

  trackPaymentMethodSelected(paymentMethod: 'paymob_card' | 'paymob_wallet'): void {
    const event: PaymentEvent = {
      eventType: 'payment',
      eventName: 'payment_method_selected',
      properties: {
        paymentMethod
      },
      timestamp: new Date().toISOString(),
      sessionId: this.sessionId,
      userId: this.userId
    };
    this.trackEvent(event);
  }

  // User Analytics
  trackUserRegistered(userId: string, registrationMethod: string = 'email'): void {
    this.userId = userId;
    const event: UserEvent = {
      eventType: 'user',
      eventName: 'user_registered',
      properties: {
        userId,
        registrationMethod
      },
      timestamp: new Date().toISOString(),
      sessionId: this.sessionId,
      userId: this.userId
    };
    this.trackEvent(event);
  }

  trackUserLoggedIn(userId: string): void {
    this.userId = userId;
    const event: UserEvent = {
      eventType: 'user',
      eventName: 'user_logged_in',
      properties: {
        userId
      },
      timestamp: new Date().toISOString(),
      sessionId: this.sessionId,
      userId: this.userId
    };
    this.trackEvent(event);
  }

  trackUserLoggedOut(): void {
    const event: UserEvent = {
      eventType: 'user',
      eventName: 'user_logged_out',
      properties: {
        userId: this.userId || 'unknown'
      },
      timestamp: new Date().toISOString(),
      sessionId: this.sessionId,
      userId: this.userId
    };
    this.trackEvent(event);
    this.userId = undefined;
  }

  // Analytics Data Retrieval
  getTutorialAnalytics(): TutorialEvent[] {
    return this.events.filter(event => event.eventType === 'tutorial') as TutorialEvent[];
  }

  getPaymentAnalytics(): PaymentEvent[] {
    return this.events.filter(event => event.eventType === 'payment') as PaymentEvent[];
  }

  getUserAnalytics(): UserEvent[] {
    return this.events.filter(event => event.eventType === 'user') as UserEvent[];
  }

  getAllAnalytics(): AnalyticsEventType[] {
    return [...this.events];
  }

  // Analytics Summary
  getTutorialSummary(): {
    totalTutorials: number;
    completedTutorials: number;
    skippedTutorials: number;
    averageTimeSpent: number;
    mostPopularStep: string;
    completionRate: number;
  } {
    const tutorialEvents = this.getTutorialAnalytics();
    const startedTutorials = tutorialEvents.filter(e => e.eventName === 'tutorial_started').length;
    const completedTutorials = tutorialEvents.filter(e => e.eventName === 'tutorial_completed').length;
    const skippedTutorials = tutorialEvents.filter(e => e.eventName === 'tutorial_skipped').length;
    
    const timeSpentEvents = tutorialEvents.filter(e => e.properties.timeSpent);
    const averageTimeSpent = timeSpentEvents.length > 0 
      ? timeSpentEvents.reduce((sum, e) => sum + (e.properties.timeSpent || 0), 0) / timeSpentEvents.length
      : 0;

    const stepEvents = tutorialEvents.filter(e => e.eventName === 'step_completed');
    const stepCounts: Record<string, number> = {};
    stepEvents.forEach(e => {
      const stepId = e.properties.stepId || 'unknown';
      stepCounts[stepId] = (stepCounts[stepId] || 0) + 1;
    });
    const mostPopularStep = Object.keys(stepCounts).reduce((a, b) => 
      stepCounts[a] > stepCounts[b] ? a : b, 'none'
    );

    return {
      totalTutorials: startedTutorials,
      completedTutorials,
      skippedTutorials,
      averageTimeSpent,
      mostPopularStep,
      completionRate: startedTutorials > 0 ? (completedTutorials / startedTutorials) * 100 : 0
    };
  }

  getPaymentSummary(): {
    totalPayments: number;
    successfulPayments: number;
    failedPayments: number;
    totalAmount: number;
    averageAmount: number;
    methodBreakdown: Record<string, number>;
  } {
    const paymentEvents = this.getPaymentAnalytics();
    const initiatedPayments = paymentEvents.filter(e => e.eventName === 'payment_initiated');
    const completedPayments = paymentEvents.filter(e => e.eventName === 'payment_completed');
    const failedPayments = paymentEvents.filter(e => e.eventName === 'payment_failed');
    
    const totalAmount = completedPayments.reduce((sum, e) => sum + (e.properties.amount || 0), 0);
    const averageAmount = completedPayments.length > 0 ? totalAmount / completedPayments.length : 0;

    const methodBreakdown: Record<string, number> = {};
    initiatedPayments.forEach(e => {
      const method = e.properties.paymentMethod || 'unknown';
      methodBreakdown[method] = (methodBreakdown[method] || 0) + 1;
    });

    return {
      totalPayments: initiatedPayments.length,
      successfulPayments: completedPayments.length,
      failedPayments: failedPayments.length,
      totalAmount,
      averageAmount,
      methodBreakdown
    };
  }

  // Export and Clear
  exportAnalytics(): string {
    return JSON.stringify({
      sessionId: this.sessionId,
      userId: this.userId,
      events: this.events,
      summary: {
        tutorial: this.getTutorialSummary(),
        payment: this.getPaymentSummary()
      }
    }, null, 2);
  }

  clearAnalytics(): void {
    this.events = [];
    this.saveEvents();
  }

  // Set user ID
  setUserId(userId: string): void {
    this.userId = userId;
  }
}

// Create singleton instance
export const analytics = new AnalyticsService();
export default analytics;