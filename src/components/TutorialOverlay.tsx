import React, { useEffect, useState, useRef } from 'react';
import { useTutorial } from '@/contexts/TutorialContext';
import { X, ChevronLeft, ChevronRight, Play, Target, Lightbulb } from 'lucide-react';
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
  const [spotlightPosition, setSpotlightPosition] = useState({ x: 0, y: 0, radius: 0 });
  const [showSpotlight, setShowSpotlight] = useState(false);
  const overlayRef = useRef<HTMLDivElement>(null);

  // Calculate overlay position based on current step
  useEffect(() => {
    if (isTutorialActive && currentStep) {
      if (currentStep.position === 'center') {
        // Center the overlay
        setOverlayPosition({
          top: window.innerHeight / 2 - 150,
          left: window.innerWidth / 2 - 200,
          width: 400,
          height: 300,
        });
        setShowSpotlight(false);
      } else {
        // Position relative to target element
        const targetElement = document.querySelector(currentStep.target);
        if (targetElement && currentStep.highlightElement) {
          const rect = targetElement.getBoundingClientRect();
          const spotlightRadius = currentStep.spotlightRadius || 60;
          
          setSpotlightPosition({
            x: rect.left + rect.width / 2,
            y: rect.top + rect.height / 2,
            radius: spotlightRadius
          });
          setShowSpotlight(true);
          
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
          setShowSpotlight(false);
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
          setSpotlightPosition({
            x: rect.left + rect.width / 2,
            y: rect.top + rect.height / 2,
            radius: currentStep.spotlightRadius || 60
          });
        }
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [isTutorialActive, currentStep]);

  if (!isTutorialActive || !currentStep) return null;

  const progress = ((currentStepIndex + 1) / tutorialSteps.length) * 100;
  const isFirstStep = currentStepIndex === 0;
  const isLastStep = currentStepIndex === tutorialSteps.length - 1;

  return (
    <>
      {/* Dark overlay with spotlight effect */}
      <div className="fixed inset-0 z-40">
        {showSpotlight ? (
          <svg className="w-full h-full">
            <defs>
              <mask id="spotlight-mask">
                <rect width="100%" height="100%" fill="white" />
                <circle
                  cx={spotlightPosition.x}
                  cy={spotlightPosition.y}
                  r={spotlightPosition.radius}
                  fill="black"
                />
              </mask>
            </defs>
            <rect
              width="100%"
              height="100%"
              fill="rgba(0, 0, 0, 0.8)"
              mask="url(#spotlight-mask)"
            />
          </svg>
        ) : (
          <div className="w-full h-full bg-black/60" />
        )}
      </div>

      {/* Tutorial overlay */}
      <div
        ref={overlayRef}
        className="fixed z-50 w-96 max-w-[90vw] transition-all duration-300 ease-out"
        style={{
          top: overlayPosition.top,
          left: overlayPosition.left,
        }}
      >
        <Card className="p-6 shadow-2xl border-brand-orange bg-white relative overflow-hidden">
          {/* Animated background */}
          <div className={`absolute inset-0 opacity-10 ${
            currentStep.animation === 'pulse' ? 'animate-pulse' :
            currentStep.animation === 'bounce' ? 'animate-bounce' :
            currentStep.animation === 'shake' ? 'animate-pulse' :
            currentStep.animation === 'glow' ? 'animate-pulse' : ''
          }`}>
            <div className="w-full h-full bg-gradient-to-br from-brand-red to-brand-orange rounded-lg" />
          </div>

          {/* Header */}
          <div className="relative z-10">
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
            <div className="mb-6">
              <h3 className="font-bold text-xl mb-3 text-gray-900">
                {currentStep.title}
              </h3>
              <div className="text-gray-700 text-sm leading-relaxed whitespace-pre-line">
                {currentStep.description}
              </div>
              
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

      {/* Directional arrow */}
      {currentStep.showArrow && showSpotlight && (
        <div 
          className="fixed z-45 text-brand-orange animate-bounce"
          style={{
            left: spotlightPosition.x - 12,
            top: currentStep.arrowDirection === 'up' ? spotlightPosition.y - 40 : 
                 currentStep.arrowDirection === 'down' ? spotlightPosition.y + 40 :
                 currentStep.arrowDirection === 'left' ? spotlightPosition.x - 40 :
                 spotlightPosition.x + 40,
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