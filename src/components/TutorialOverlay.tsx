import React, { useEffect, useState } from 'react';
import { useTutorial } from '@/contexts/TutorialContext';
import { X, ChevronLeft, ChevronRight, Play } from 'lucide-react';
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
  
  const [overlayPosition, setOverlayPosition] = useState({ top: 0, left: 0, width: 400, height: 300 });

  // Center the overlay on screen
  useEffect(() => {
    if (isTutorialActive) {
      setOverlayPosition({
        top: window.innerHeight / 2 - 150,
        left: window.innerWidth / 2 - 200,
        width: 400,
        height: 300,
      });
    }
  }, [isTutorialActive]);

  // Handle window resize
  useEffect(() => {
    const handleResize = () => {
      if (isTutorialActive) {
        setOverlayPosition({
          top: window.innerHeight / 2 - 150,
          left: window.innerWidth / 2 - 200,
          width: 400,
          height: 300,
        });
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [isTutorialActive]);

  if (!isTutorialActive || !currentStep) return null;

  const progress = ((currentStepIndex + 1) / tutorialSteps.length) * 100;
  const isFirstStep = currentStepIndex === 0;
  const isLastStep = currentStepIndex === tutorialSteps.length - 1;

  return (
    <>
      {/* Dark overlay */}
      <div 
        className="fixed inset-0 bg-black/60 z-40"
        onClick={nextStep}
      />
      
      {/* Centered tutorial card */}
      <div
        className="fixed z-50 w-96 max-w-[90vw]"
        style={{
          top: overlayPosition.top,
          left: overlayPosition.left,
        }}
      >
        <Card className="p-6 shadow-2xl border-brand-orange bg-white">
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
          <div className="mb-6">
            <h3 className="font-bold text-xl mb-3 text-gray-900">
              {currentStep.title}
            </h3>
            <div className="text-gray-700 text-sm leading-relaxed whitespace-pre-line">
              {currentStep.description}
            </div>
          </div>

          {/* Progress bar */}
          <div className="mb-6">
            <div className="w-full bg-gray-200 rounded-full h-3">
              <div 
                className="bg-gradient-to-r from-brand-red to-brand-orange h-3 rounded-full transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
            <div className="text-xs text-gray-500 mt-2 text-center">
              {currentStepIndex + 1} of {tutorialSteps.length} steps
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
        </Card>
      </div>
    </>
  );
};

export default TutorialOverlay; 