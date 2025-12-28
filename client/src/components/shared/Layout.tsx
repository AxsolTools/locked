import React from 'react';

interface LayoutProps {
  children: React.ReactNode;
}

export function Layout({ children }: LayoutProps) {
  return (
    <div className="flex flex-col min-h-screen bg-[#0f172a] text-foreground overflow-x-hidden">
      <main className="flex-grow w-full mx-auto">
        {children}
      </main>
    </div>
  );
} 