import { Logo, LogoMark } from '@/components/Logo';
import {
  Activity,
  AlertOctagon,
  ChevronLeft,
  ChevronRight,
  ClipboardList,
  Factory,
  LayoutDashboard,
  ShieldCheck,
  History,
  Bookmark,
  Sparkles,
  Database,
  Building2,
  Sliders,
  Truck,
} from 'lucide-react';
import * as React from 'react';
import { NavLink } from '@/lib/router-compat';
import { cn } from '@/lib/cn';
import { ROUTE_PATHS } from '@/lib/constants';
import { OrgSwitcher } from './OrgSwitcher';

interface NavItem {
  to: string;
  label: string;
  icon: React.ComponentType<{ className?: string; 'aria-hidden'?: boolean }>;
}

interface NavGroup {
  title: string;
  items: readonly NavItem[];
}

const NAV_GROUPS: readonly NavGroup[] = [
  {
    title: 'Overview',
    items: [
      { to: ROUTE_PATHS.COMMAND_CENTER, label: 'Command Center', icon: LayoutDashboard },
      { to: ROUTE_PATHS.ASSISTANT, label: 'Copilot', icon: Sparkles },
    ],
  },
  {
    title: 'Planning',
    items: [
      { to: ROUTE_PATHS.SHORTAGES, label: 'Shortages', icon: AlertOctagon },
      { to: ROUTE_PATHS.PROJECTED_BALANCE, label: 'Projected Balance', icon: Activity },
      { to: ROUTE_PATHS.SIMULATOR, label: 'Simulator', icon: Sliders },
      { to: ROUTE_PATHS.SCENARIOS, label: 'Saved Scenarios', icon: Bookmark },
    ],
  },
  {
    title: 'Supply',
    items: [
      { to: ROUTE_PATHS.PURCHASE_ORDERS, label: 'Purchase Orders', icon: ClipboardList },
      { to: ROUTE_PATHS.SUPPLIERS, label: 'Suppliers', icon: Truck },
      { to: ROUTE_PATHS.PRODUCTION_BOM, label: 'Production & BOM', icon: Factory },
    ],
  },
  {
    title: 'Governance',
    items: [
      { to: ROUTE_PATHS.DATA_QUALITY, label: 'Data Quality', icon: ShieldCheck },
      { to: ROUTE_PATHS.ACTIVITY, label: 'Team Activity', icon: History },
      { to: ROUTE_PATHS.DATA_SOURCES, label: 'Data Sources', icon: Database },
      { to: ROUTE_PATHS.ORGANIZATION, label: 'Organization', icon: Building2 },
    ],
  },
];

export interface SidebarProps {
  collapsed: boolean;
  onToggleCollapse: () => void;
}

/**
 * Collapsible primary navigation sidebar grouped into Overview, Planning, Supply, and Governance.
 */
export function Sidebar({ collapsed, onToggleCollapse }: SidebarProps): React.ReactElement {
  return (
    <aside
      aria-label="Primary navigation"
      className={cn(
        'flex shrink-0 flex-col border-r border-[var(--border-default)] bg-[var(--bg-surface)] transition-[width] duration-150',
        collapsed ? 'w-16' : 'w-60',
      )}
    >
      <div className="flex h-13 items-center justify-between border-b border-[var(--border-default)] px-3">
        {!collapsed ? (
          <Logo />
        ) : (
          <span className="mx-auto"><LogoMark className="h-6 w-6" /></span>
        )}
        <button
          type="button"
          onClick={onToggleCollapse}
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          aria-expanded={!collapsed}
          className="inline-flex h-7 w-7 items-center justify-center rounded text-[var(--text-muted)] transition-colors duration-150 hover:bg-[var(--bg-hover)] hover:text-[var(--text-primary)] cursor-pointer"
        >
          {collapsed ? (
            <ChevronRight className="h-4 w-4" aria-hidden={true} />
          ) : (
            <ChevronLeft className="h-4 w-4" aria-hidden={true} />
          )}
        </button>
      </div>

      {!collapsed ? <OrgSwitcher /> : null}
      <nav className="flex-1 space-y-4 overflow-y-auto p-2">
        {NAV_GROUPS.map((group, groupIndex) => (
          <div
            key={group.title}
            className={cn(
              'space-y-1',
              collapsed && groupIndex > 0 && 'border-t border-[var(--border-default)] pt-2',
            )}
          >
            {!collapsed ? (
              <div className="px-2.5 pb-0.5 text-[11px] font-medium text-[var(--text-muted)]">
                {group.title}
              </div>
            ) : null}
            {group.items.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.to === ROUTE_PATHS.COMMAND_CENTER}
                  title={collapsed ? item.label : undefined}
                  className={({ isActive }) =>
                    cn(
                      'flex items-center gap-2.5 rounded-md px-2.5 py-2 text-[13px] font-medium whitespace-nowrap transition-colors duration-150',
                      collapsed && 'justify-center px-0',
                      isActive
                        ? 'bg-[var(--accent-subtle)] text-[var(--accent)]'
                        : 'text-[var(--text-secondary)] hover:bg-[var(--bg-hover)] hover:text-[var(--text-primary)]',
                    )
                  }
                >
                  <Icon className="h-4 w-4 shrink-0" aria-hidden={true} />
                  {!collapsed ? <span className="truncate">{item.label}</span> : null}
                </NavLink>
              );
            })}
          </div>
        ))}
      </nav>
    </aside>
  );
}
