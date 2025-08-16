import React, { useEffect, useRef, useState } from 'react';
import { useTutorial } from '@/contexts/TutorialContext';
import { X, ChevronLeft, ChevronRight, Play, SkipForward } from 'lucide-react';
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
    currentStepIndex 
  } = useTutorial();
  
  const [targetElement, setTargetElement] = useState<HTMLElement | null>(null);
  const [overlayPosition, setOverlayPosition] = useState({ top: 0, left: 0, width: 0, height: 0 });
  const overlayRef = useRef<HTMLDivElement>(null);

  // Find and highlight target element
  useEffect(() => {
    if (!isTutorialActive || !currentStep) return;

    const findTargetElement = () => {
      let element: HTMLElement | null = null;
      
      if (currentStep.target === 'body') {
        element = document.body;
      } else {
        element = document.querySelector(currentStep.target) as HTMLElement;
      }

      if (element) {
        setTargetElement(element);
        updateOverlayPosition(element);
      }
    };

    // Wait for DOM to be ready
    const timer = setTimeout(findTargetElement, 100);
    return () => clearTimeout(timer);
  }, [isTutorialActive, currentStep]);

  // Update overlay position when target element changes
  const updateOverlayPosition = (element: HTMLElement) => {
    if (element === document.body) {
      // For body target, show overlay in center
      setOverlayPosition({
        top: window.innerHeight / 2 - 100,
        left: window.innerWidth / 2 - 200,
        width: 400,
        height: 200,
      });
    } else {
      const rect = element.getBoundingClientRect();
      setOverlayPosition({
        top: rect.top + window.scrollY,
        left: rect.left + window.scrollX,
        width: rect.width,
        height: rect.height,
      });
    }
  };

  // Handle window resize
  useEffect(() => {
    const handleResize = () => {
      if (targetElement) {
        updateOverlayPosition(targetElement);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [targetElement]);

  if (!isTutorialActive || !currentStep) return null;

  const progress = ((currentStepIndex + 1) / tutorialSteps.length) * 100;
  const isFirstStep = currentStepIndex === 0;
  const isLastStep = currentStepIndex === tutorialSteps.length - 1;

  const getTooltipPosition = () => {
    if (currentStep.target === 'body') {
      return 'bottom';
    }
    return currentStep.position;
  };

  const getTooltipStyle = () => {
    const position = getTooltipPosition();
    const baseStyle = {
      position: 'absolute' as const,
      zIndex: 1000,
    };

    switch (position) {
      case 'top':
        return {
          ...baseStyle,
          bottom: overlayPosition.height + 20,
          left: overlayPosition.left + overlayPosition.width / 2 - 150,
        };
      case 'bottom':
        return {
          ...baseStyle,
          top: overlayPosition.top + overlayPosition.height + 20,
          left: overlayPosition.left + overlayPosition.width / 2 - 150,
        };
      case 'left':
        return {
          ...baseStyle,
          top: overlayPosition.top + overlayPosition.height / 2 - 75,
          right: overlayPosition.width + 20,
        };
      case 'right':
        return {
          ...baseStyle,
          top: overlayPosition.top + overlayPosition.height / 2 - 75,
          left: overlayPosition.left + overlayPosition.width + 20,
        };
      default:
        return baseStyle;
    }
  };

  return (
    <>
      {/* Dark overlay */}
      <div 
        className="fixed inset-0 bg-black/50 z-40"
        onClick={nextStep}
      />
      
      {/* Highlighted element overlay */}
      <div
        ref={overlayRef}
        className="fixed border-2 border-brand-orange rounded-lg shadow-lg z-50 transition-all duration-300"
        style={{
          top: overlayPosition.top - 4,
          left: overlayPosition.left - 4,
          width: overlayPosition.width + 8,
          height: overlayPosition.height + 8,
        }}
      >
        {/* Glow effect */}
        <div className="absolute inset-0 bg-brand-orange/20 rounded-lg animate-pulse" />
      </div>

      {/* Tooltip */}
      <div
        className="fixed w-80 z-50"
        style={getTooltipStyle()}
      >
        <Card className="p-4 shadow-xl border-brand-orange">
          {/* Header */}
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-brand-orange rounded-full animate-pulse" />
              <span className="text-sm font-medium text-brand-orange">
                Step {currentStepIndex + 1} of {tutorialSteps.length}
              </span>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={skipTutorial}
              className="h-6 w-6 p-0 hover:bg-gray-100"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          {/* Content */}
          <div className="mb-4">
            <h3 className="font-semibold text-lg mb-2 text-gray-900">
              {currentStep.title}
            </h3>
            <p className="text-gray-600 text-sm leading-relaxed">
              {currentStep.description}
            </p>
          </div>

          {/* Progress bar */}
          <div className="mb-4">
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-gradient-to-r from-brand-red to-brand-orange h-2 rounded-full transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
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
                  className="bg-gradient-to-r from-brand-red to-brand-orange text-white hover:from-brand-orange hover:to-brand-red"
                >
                  <Play className="h-4 w-4 mr-1" />
                  Get Started
                </Button>
              ) : (
                <Button
                  onClick={() => completeStep(currentStep.id)}
                  className="bg-gradient-to-r from-brand-red to-brand-orange text-white hover:from-brand-orange hover:to-brand-red"
                >
                  Next
                  <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              )}
            </div>
          </div>
        </Card>
      </div>
    </>
  );
};

export default TutorialOverlay; 