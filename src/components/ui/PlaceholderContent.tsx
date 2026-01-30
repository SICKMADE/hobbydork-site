import * as React from "react";

interface PlaceholderContentProps {
  title: string;
  description?: string;
  children?: React.ReactNode;
}

const PlaceholderContent: React.FC<PlaceholderContentProps> = ({ title, description, children }) => (
  <div className="flex flex-col items-center justify-center py-12 text-center">
    <h2 className="text-2xl font-semibold mb-2">{title}</h2>
    {description && <p className="text-gray-500 mb-4">{description}</p>}
    {children}
  </div>
);

export default PlaceholderContent;
