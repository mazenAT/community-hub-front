import React from 'react';
import { Button } from '@/components/ui/button';
import { BookOpen } from 'lucide-react';
import { useTutorial } from '@/contexts/TutorialContext';

interface TutorialTriggerProps {
  className?: string;
}

const TutorialTrigger: React.FC<TutorialTriggerProps> = ({ 
  className = ''
}) => {
  const { startTutorial, isTutorialActive } = useTutorial();

  if (isTutorialActive) return null;

  return (
    <div className={className}>
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
    </div>
  );
};

export default TutorialTrigger;
