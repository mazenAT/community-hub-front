import React from 'react';
import { useTutorial } from '@/contexts/TutorialContext';
import { Button } from '@/components/ui/button';
import { HelpCircle, Play } from 'lucide-react';

interface TutorialTriggerProps {
  variant?: 'default' | 'floating' | 'inline';
  className?: string;
}

const TutorialTrigger: React.FC<TutorialTriggerProps> = ({ 
  variant = 'default',
  className = ''
}) => {
  const { startTutorial, resetTutorial } = useTutorial();

  const handleStartTutorial = () => {
    resetTutorial();
    startTutorial();
  };

  if (variant === 'floating') {
    return (
      <Button
        onClick={handleStartTutorial}
        className={`fixed bottom-20 right-4 z-30 rounded-full w-14 h-14 shadow-lg bg-gradient-to-r from-brand-red to-brand-orange text-white hover:from-brand-orange hover:to-brand-red transition-all duration-300 hover:scale-110 ${className}`}
        title="Start Tutorial"
      >
        <HelpCircle className="w-6 h-6" />
      </Button>
    );
  }

  if (variant === 'inline') {
    return (
      <Button
        onClick={handleStartTutorial}
        variant="outline"
        size="sm"
        className={`text-brand-orange border-brand-orange hover:bg-brand-orange hover:text-white transition-colors ${className}`}
      >
        <Play className="w-4 h-4 mr-2" />
        Show Tutorial
      </Button>
    );
  }

  return (
    <Button
      onClick={handleStartTutorial}
      variant="outline"
      className={`text-brand-orange border-brand-orange hover:bg-brand-orange hover:text-white transition-colors ${className}`}
    >
      <HelpCircle className="w-4 h-4 mr-2" />
      Start Tutorial
    </Button>
  );
};

export default TutorialTrigger; 