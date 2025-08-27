import React from 'react';
import { Button } from '@/components/ui/button';
import { Play, BookOpen, Star } from 'lucide-react';
import { useTutorial } from '@/contexts/TutorialContext';

interface TutorialTriggerProps {
  variant?: 'default' | 'floating' | 'inline';
  className?: string;
}

const TutorialTrigger: React.FC<TutorialTriggerProps> = ({ 
  variant = 'default',
  className = ''
}) => {
  const { startTutorial, isTutorialActive, tutorialProgress, earnedPoints, totalPoints } = useTutorial();

  if (isTutorialActive) return null;

  const renderContent = () => {
    switch (variant) {
      case 'floating':
        return (
          <div className="fixed bottom-24 right-4 z-30">
            <Button
              onClick={startTutorial}
              className="bg-gradient-to-r from-brand-red to-brand-orange text-white rounded-full w-14 h-14 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-110"
              title="Start Tutorial"
            >
              <Play className="w-6 h-6" />
            </Button>
          </div>
        );
      
      case 'inline':
        return (
          <Button
            onClick={startTutorial}
            variant="outline"
            className="border-brand-orange text-brand-orange hover:bg-brand-orange hover:text-white transition-colors duration-200"
          >
            <BookOpen className="w-4 h-4 mr-2" />
            Take Tour
          </Button>
        );
      
      default:
        return (
          <Button
            onClick={startTutorial}
            className="bg-gradient-to-r from-brand-red to-brand-orange text-white hover:from-brand-orange hover:to-brand-red transition-all duration-200"
          >
            <Play className="w-4 h-4 mr-2" />
            Start Interactive Tour
          </Button>
        );
    }
  };

  return (
    <div className={className}>
      {renderContent()}
      
      {/* Progress indicator for floating variant */}
      {variant === 'floating' && tutorialProgress > 0 && (
        <div className="fixed bottom-24 right-20 z-30 bg-white rounded-lg p-3 shadow-lg border border-gray-200">
          <div className="text-center">
            <div className="flex items-center justify-center space-x-1 mb-2">
              <Star className="w-4 h-4 text-yellow-500 fill-current" />
              <span className="text-sm font-medium text-gray-700">
                {earnedPoints} / {totalPoints}
              </span>
            </div>
            <div className="w-20 bg-gray-200 rounded-full h-2">
              <div 
                className="bg-gradient-to-r from-brand-red to-brand-orange h-2 rounded-full transition-all duration-300"
                style={{ width: `${tutorialProgress * 100}%` }}
              />
            </div>
            <div className="text-xs text-gray-500 mt-1">
              {Math.round(tutorialProgress * 100)}% complete
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TutorialTrigger; 