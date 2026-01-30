import * as React from "react";

const AppLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div className="min-h-screen bg-gray-50">
    {/* You can add a header/nav here if needed */}
    <main>{children}</main>
  </div>
);

export default AppLayout;
