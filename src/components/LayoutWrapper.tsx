'use client';

import { usePathname } from 'next/navigation';
import Navigation from './Navigation';

interface LayoutWrapperProps {
  children: React.ReactNode;
}

export default function LayoutWrapper({ children }: LayoutWrapperProps) {
  const pathname = usePathname();

  // Pages that should not have the navigation sidebar
  const noNavPages = ['/login', '/signup', '/portal'];
  const shouldShowNav = !noNavPages.some(page => pathname.startsWith(page));

  if (!shouldShowNav) {
    return <>{children}</>;
  }

  return (
    <>
      <Navigation />
      <main className="ml-64 min-h-screen p-8">
        {children}
      </main>
    </>
  );
}
