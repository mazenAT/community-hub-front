import React from 'react';

interface EmptyStateProps {
  icon?: React.ReactNode;
  message: string;
  action?: React.ReactNode;
}

const EmptyState: React.FC<EmptyStateProps> = ({ icon, message, action }) => (
  <div className="flex flex-col items-center justify-center py-12 text-center text-gray-500">
    {icon && <div className="mb-4 text-5xl">{icon}</div>}
    <div className="mb-2 text-lg font-medium">{message}</div>
    {action && <div className="mt-4">{action}</div>}
  </div>
);

export default EmptyState; 