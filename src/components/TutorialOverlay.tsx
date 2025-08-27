import React, { useEffect, useState, useRef } from 'react';
import { useTutorial } from '@/contexts/TutorialContext';
import { X, ChevronLeft, ChevronRight, Play, Target, Lightbulb, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

const TutorialOverlay: React.FC = () => {
  const { 
    isTutorialActive, 
    currentStep, 
    completeStep, 
    skipTutorial, 
    nextStep, 
    previousStep,
    tutorialSteps,
    currentStepIndex,
    tutorialProgress,
    getElementPosition
  } = useTutorial();
  
  const [overlayPosition, setOverlayPosition] = useState({ top: 0, left: 0, width: 400, height: 300 });
  const [highlightedElement, setHighlightedElement] = useState<DOMRect | null>(null);
  const [isNavigating, setIsNavigating] = useState(false);
  const overlayRef = useRef<HTMLDivElement>(null);

  // Calculate overlay position and highlight element
  useEffect(() => {
    if (isTutorialActive && currentStep) {
      if (currentStep.position === 'center') {
        // Center the overlay for welcome/completion steps
        setOverlayPosition({
          top: window.innerHeight / 2 - 150,
          left: window.innerWidth / 2 - 200,
          width: 400,
          height: 300,
        });
        setHighlightedElement(null);
      } else {
        // Position relative to target element and highlight it
        const targetElement = document.querySelector(currentStep.target);
        if (targetElement && currentStep.highlightElement) {
          const rect = targetElement.getBoundingClientRect();
          setHighlightedElement(rect);
          
          // Position overlay relative to target
          let overlayTop, overlayLeft;
          switch (currentStep.position) {
            case 'top':
              overlayTop = rect.top - 350;
              overlayLeft = rect.left + rect.width / 2 - 200;
              break;
            case 'bottom':
              overlayTop = rect.bottom + 20;
              overlayLeft = rect.left + rect.width / 2 - 200;
              break;
            case 'left':
              overlayTop = rect.top + rect.height / 2 - 150;
              overlayLeft = rect.left - 420;
              break;
            case 'right':
              overlayTop = rect.top + rect.height / 2 - 150;
              overlayLeft = rect.right + 20;
              break;
            default:
              overlayTop = rect.top + rect.height / 2 - 150;
              overlayLeft = rect.left + rect.width / 2 - 200;
          }
          
          setOverlayPosition({
            top: Math.max(20, Math.min(overlayTop, window.innerHeight - 320)),
            left: Math.max(20, Math.min(overlayLeft, window.innerWidth - 420)),
            width: 400,
            height: 300,
          });
        } else {
          setHighlightedElement(null);
          // Fallback to center
          setOverlayPosition({
            top: window.innerHeight / 2 - 150,
            left: window.innerWidth / 2 - 200,
            width: 400,
            height: 300,
          });
        }
      }
    }
  }, [isTutorialActive, currentStep]);

  // Handle window resize
  useEffect(() => {
    const handleResize = () => {
      if (isTutorialActive && currentStep) {
        // Recalculate positions on resize
        const targetElement = document.querySelector(currentStep.target);
        if (targetElement && currentStep.highlightElement) {
          const rect = targetElement.getBoundingClientRect();
          setHighlightedElement(rect);
        }
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [isTutorialActive, currentStep]);

  // Handle navigation
  useEffect(() => {
    if (currentStep?.route) {
      setIsNavigating(true);
      const timer = setTimeout(() => setIsNavigating(false), 2000);
      return () => clearTimeout(timer);
    }
  }, [currentStep]);

  if (!isTutorialActive || !currentStep) return null;

  const isFirstStep = currentStepIndex === 0;
  const isLastStep = currentStepIndex === tutorialSteps.length - 1;
  const progress = tutorialProgress * 100;

  return (
    <>
      {/* Full-screen overlay with SVG mask for spotlight effect */}
      <div className="fixed inset-0 z-50 pointer-events-none">
        <svg
          width="100%"
          height="100%"
          className="absolute inset-0"
          style={{ filter: 'drop-shadow(0 0 20px rgba(0,0,0,0.3))' }}
        >
          <defs>
            <mask id="tutorial-mask">
              {/* White background (opaque) */}
              <rect width="100%" height="100%" fill="white" />
              
              {/* Cut out the highlighted element (transparent) */}
              {highlightedElement && (
                <rect
                  x={highlightedElement.left}
                  y={highlightedElement.top}
                  width={highlightedElement.width}
                  height={highlightedElement.height}
                  fill="black"
                  rx="8"
                  ry="8"
                />
              )}
            </mask>
          </defs>
          
          {/* Dark overlay with mask */}
          <rect
            width="100%"
            height="100%"
            fill="rgba(0, 0, 0, 0.7)"
            mask="url(#tutorial-mask)"
          />
        </svg>
      </div>

      {/* Loading overlay for navigation */}
      {isNavigating && (
        <div className="fixed inset-0 z-60 bg-black/50 flex items-center justify-center">
          <div className="bg-white rounded-lg p-6 text-center">
            <Loader2 className="w-8 h-8 animate-spin mx-auto mb-3 text-brand-orange" />
            <p className="text-lg font-semibold">Navigating...</p>
            <p className="text-sm text-gray-600">Taking you to the next feature</p>
          </div>
        </div>
      )}

      {/* Tutorial content overlay */}
      <div
        ref={overlayRef}
        className="fixed z-55 pointer-events-auto"
        style={{
          top: overlayPosition.top,
          left: overlayPosition.left,
          width: overlayPosition.width,
          height: overlayPosition.height,
        }}
      >
        <Card className="w-full h-full bg-white shadow-2xl border-0">
          <div className="p-6 h-full flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3">
                <div className="w-3 h-3 bg-brand-orange rounded-full animate-pulse" />
                <span className="text-sm font-semibold text-brand-orange">
                  Step {currentStepIndex + 1} of {tutorialSteps.length}
                </span>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={skipTutorial}
                className="h-8 w-8 p-0 hover:bg-gray-100"
              >
                <X className="h-5 w-5" />
              </Button>
            </div>

            {/* Content */}
            <div className="flex-1 mb-6">
              <h3 className="font-bold text-xl mb-3 text-gray-900">
                {currentStep.title}
              </h3>
              <div className="text-gray-700 text-sm leading-relaxed whitespace-pre-line">
                {currentStep.description}
              </div>
              
              {/* Navigation indicator */}
              {currentStep.route && (
                <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-lg">
                  <div className="flex items-center space-x-2 text-green-700">
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                    <span className="text-sm font-medium">
                      Navigating to {currentStep.route === '/wallet' ? 'Wallet' : 
                                   currentStep.route === '/profile' ? 'Profile' : 
                                   currentStep.route === '/recharge' ? 'Recharge' :
                                   currentStep.route === '/orders' ? 'Orders' : 'Page'}
                    </span>
                  </div>
                </div>
              )}
              
              {/* Hint section */}
              {currentStep.hint && (
                <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="flex items-center space-x-2 text-blue-700">
                    <Lightbulb className="h-4 w-4" />
                    <span className="text-sm font-medium">Hint:</span>
                  </div>
                  <p className="text-sm text-blue-600 mt-1">{currentStep.hint}</p>
                </div>
              )}

              {/* Action required indicator */}
              {currentStep.interactive && currentStep.actionRequired && (
                <div className="mt-3 p-2 bg-orange-50 border border-orange-200 rounded-lg">
                  <div className="flex items-center space-x-2 text-orange-700">
                    <Target className="h-4 w-4" />
                    <span className="text-sm font-medium">
                      Action Required: {currentStep.actionRequired}
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Progress bar */}
            <div className="mb-6">
              <div className="w-full bg-gray-200 rounded-full h-3">
                <div 
                  className="bg-gradient-to-r from-brand-red to-brand-orange h-3 rounded-full transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <div className="flex justify-between text-xs text-gray-500 mt-2">
                <span>{currentStepIndex + 1} of {tutorialSteps.length} steps</span>
                <span>{Math.round(tutorialProgress * 100)}% complete</span>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-between">
              <div className="flex space-x-2">
                {!isFirstStep && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={previousStep}
                    className="text-brand-orange border-brand-orange hover:bg-brand-orange hover:text-white"
                  >
                    <ChevronLeft className="h-4 w-4 mr-1" />
                    Previous
                  </Button>
                )}
              </div>

              <div className="flex space-x-2">
                {isLastStep ? (
                  <Button
                    onClick={() => completeStep(currentStep.id)}
                    className="bg-gradient-to-r from-brand-red to-brand-orange text-white hover:from-brand-orange hover:to-brand-red px-6"
                  >
                    <Play className="h-4 w-4 mr-2" />
                    Get Started!
                  </Button>
                ) : (
                  <Button
                    onClick={() => completeStep(currentStep.id)}
                    className="bg-gradient-to-r from-brand-red to-brand-orange text-white hover:from-brand-orange hover:to-brand-red px-6"
                  >
                    Next
                    <ChevronRight className="h-4 w-4 ml-2" />
                  </Button>
                )}
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* Directional arrow pointing to highlighted element */}
      {currentStep.showArrow && highlightedElement && (
        <div 
          className="fixed z-55 text-brand-orange animate-bounce pointer-events-none"
          style={{
            left: highlightedElement.left + highlightedElement.width / 2 - 12,
            top: currentStep.arrowDirection === 'up' ? highlightedElement.top - 40 : 
                 currentStep.arrowDirection === 'down' ? highlightedElement.bottom + 20 :
                 currentStep.arrowDirection === 'left' ? highlightedElement.left - 40 :
                 highlightedElement.right + 20,
          }}
        >
          {currentStep.arrowDirection === 'up' && <ChevronUp className="h-6 w-6" />}
          {currentStep.arrowDirection === 'down' && <ChevronDown className="h-6 w-6" />}
          {currentStep.arrowDirection === 'left' && <ChevronLeft className="h-6 w-6" />}
          {currentStep.arrowDirection === 'right' && <ChevronRight className="h-6 w-6" />}
        </div>
      )}
    </>
  );
};

// Missing icon components
const ChevronUp = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
  </svg>
);

const ChevronDown = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
  </svg>
);

export default TutorialOverlay; 