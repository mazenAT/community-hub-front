import React from 'react';
import { Button } from '@/components/ui/button';
import { Play, BookOpen } from 'lucide-react';
import { useTutorial } from '@/contexts/TutorialContext';

interface TutorialTriggerProps {
  variant?: 'default' | 'floating' | 'inline';
  className?: string;
}

const TutorialTrigger: React.FC<TutorialTriggerProps> = ({ 
  variant = 'default',
  className = ''
}) => {
  const { startTutorial, isTutorialActive } = useTutorial();

  if (isTutorialActive) return null;

  const renderContent = () => {
    switch (variant) {
      case 'inline':
        return (
          <Button
            onClick={startTutorial}
            onTouchStart={(e) => {
              // Prevent double-tap zoom on mobile
              e.preventDefault();
            }}
            variant="outline"
            className="border-brand-orange text-brand-orange hover:bg-brand-orange hover:text-white transition-colors duration-200 touch-manipulation"
          >
            <BookOpen className="h-4 w-4 mr-2" />
            Take Tour
          </Button>
        );

      case 'floating':
        return (
          <Button
            onClick={startTutorial}
            onTouchStart={(e) => {
              // Prevent double-tap zoom on mobile
              e.preventDefault();
            }}
            className="bg-gradient-to-r from-brand-red to-brand-orange hover:from-brand-orange hover:to-brand-red transition-all duration-200 touch-manipulation rounded-full w-auto px-4 py-3 shadow-xl hover:shadow-2xl transform hover:scale-105"
          >
            <BookOpen className="h-5 w-5 mr-2" />
            <span className="font-medium">Take a Tour</span>
          </Button>
        );

      default:
        return (
          <Button
            onClick={startTutorial}
            onTouchStart={(e) => {
              // Prevent double-tap zoom on mobile
              e.preventDefault();
            }}
            className="bg-gradient-to-r from-brand-red to-brand-orange hover:from-brand-orange hover:to-brand-red transition-all duration-200 touch-manipulation"
          >
            <Play className="h-4 w-4 mr-2" />
            Start Tutorial
          </Button>
        );
    }
  };

  return (
    <div className={className}>
      {renderContent()}
    </div>
  );
};

export default TutorialTrigger; 