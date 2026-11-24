import * as React from 'react';
import { Outlet } from '@/lib/router-compat';
import { LayoutErrorBoundary } from './LayoutErrorBoundary';
import { Sidebar } from './Sidebar';
import { TopBar } from './TopBar';

/**
 * Main application shell combining error boundary, collapsible sidebar, top bar, and route viewport.
 */
export function AppShell(): React.ReactElement {
  const [sidebarCollapsed, setSidebarCollapsed] = React.useState(false);

  return (
    <LayoutErrorBoundary>
      <div className="flex min-h-screen bg-[var(--bg-canvas)] text-[var(--text-primary)]">
        <Sidebar
          collapsed={sidebarCollapsed}
          onToggleCollapse={() => {
            setSidebarCollapsed((prev) => !prev);
          }}
        />
        <div className="flex min-w-0 flex-1 flex-col">
          <TopBar />
          <main className="mx-auto w-full max-w-[1440px] flex-1 p-5">
            <Outlet />
          </main>
        </div>
      </div>
    </LayoutErrorBoundary>
  );
}
