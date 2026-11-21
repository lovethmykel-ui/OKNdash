'use client';

/**
 * polymarket-agent/agent-copier-tabs.tsx — deterministic, hydration-safe
 * segmented tab shell (Agent / Copy / Fund) with static ARIA IDs.
 */
import type { ReactNode } from 'react';
import { Bot, Copy, Landmark } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { AgentTab } from './tab-param';

interface AgentCopierTabsProps {
  value: AgentTab;
  onValueChange: (tab: AgentTab) => void;
  agent: ReactNode;
  copy: ReactNode;
  fund: ReactNode;
}

const TAB_ITEMS: {
  id: AgentTab;
  label: string;
  icon: typeof Bot;
  activeIconClass: string;
}[] = [
  { id: 'agent', label: 'Agent', icon: Bot, activeIconClass: 'text-[#2E5CFF]' },
  { id: 'copy', label: 'Copy', icon: Copy, activeIconClass: 'text-[#7A12F5] dark:text-[#C084FC]' },
  { id: 'fund', label: 'Fund', icon: Landmark, activeIconClass: 'text-[#10B981]' },
];

export function AgentCopierTabs({
  value,
  onValueChange,
  agent,
  copy,
  fund,
}: AgentCopierTabsProps) {
  return (
    <div className="space-y-5">
      <div
        role="tablist"
        aria-label="Polymarket Agent sections"
        className="grid grid-cols-3 sm:inline-grid h-10 w-full sm:w-auto rounded-xl border border-[var(--line)] bg-[var(--s2)] p-1"
      >
        {TAB_ITEMS.map((item) => {
          const Icon = item.icon;
          const active = value === item.id;
          return (
            <button
              key={item.id}
              id={`polymarket-tab-${item.id}`}
              type="button"
              role="tab"
              aria-selected={active}
              aria-controls={`polymarket-panel-${item.id}`}
              onClick={() => onValueChange(item.id)}
              className={cn(
                'inline-flex items-center justify-center gap-1.5 rounded-lg px-4 sm:px-5 text-xs sm:text-sm font-bold transition-colors cursor-pointer whitespace-nowrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#7A12F5]/35',
                active
                  ? 'bg-[var(--s1)] text-[var(--tx)] shadow-xs'
                  : 'text-[var(--mut)] hover:text-[var(--tx)]',
              )}
            >
              <Icon
                className={cn('size-3.5 shrink-0', active ? item.activeIconClass : 'opacity-70')}
                aria-hidden="true"
              />
              <span>{item.label}</span>
            </button>
          );
        })}
      </div>

      <div
        id={`polymarket-panel-${value}`}
        role="tabpanel"
        aria-labelledby={`polymarket-tab-${value}`}
      >
        {value === 'agent' ? agent : value === 'copy' ? copy : fund}
      </div>
    </div>
  );
}
