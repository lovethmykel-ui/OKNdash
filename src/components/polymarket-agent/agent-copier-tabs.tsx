'use client';

/**
 * polymarket-agent/agent-copier-tabs.tsx — architectural segmented tab shell
 * for Agent, Copy, and Fund views on /app/polymarket-agent.
 */
import type { ReactNode } from 'react';
import { Bot, Copy, Landmark } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { parseAgentTab, type AgentTab } from './tab-param';

interface AgentCopierTabsProps {
  value: AgentTab;
  onValueChange: (tab: AgentTab) => void;
  agent: ReactNode;
  copy: ReactNode;
  fund: ReactNode;
}

export function AgentCopierTabs({
  value,
  onValueChange,
  agent,
  copy,
  fund,
}: AgentCopierTabsProps) {
  const handleValueChange = (raw: string) => {
    onValueChange(parseAgentTab(raw));
  };

  return (
    <Tabs value={value} onValueChange={handleValueChange}>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <TabsList
          aria-label="Polymarket Agent sections"
          className="h-11 w-full sm:w-auto rounded-xl border border-[var(--line)] bg-[var(--s2)] p-1 grid grid-cols-3 sm:inline-grid"
        >
          <TabsTrigger
            value="agent"
            className="cursor-pointer rounded-lg px-4 sm:px-6 py-1.5 text-xs sm:text-sm font-bold transition-all whitespace-nowrap text-[var(--mut)] data-[state=active]:bg-[var(--s1)] data-[state=active]:text-[var(--tx)] data-[state=active]:shadow-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2E5CFF]/35"
          >
            <Bot className="size-4 mr-1.5 shrink-0 text-[#2E5CFF]" />
            <span>Agent</span>
          </TabsTrigger>
          <TabsTrigger
            value="copy"
            className="cursor-pointer rounded-lg px-4 sm:px-6 py-1.5 text-xs sm:text-sm font-bold transition-all whitespace-nowrap text-[var(--mut)] data-[state=active]:bg-[var(--s1)] data-[state=active]:text-[var(--tx)] data-[state=active]:shadow-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2E5CFF]/35"
          >
            <Copy className="size-4 mr-1.5 shrink-0 text-[#7A12F5] dark:text-[#C084FC]" />
            <span>Copy</span>
          </TabsTrigger>
          <TabsTrigger
            value="fund"
            className="cursor-pointer rounded-lg px-4 sm:px-6 py-1.5 text-xs sm:text-sm font-bold transition-all whitespace-nowrap text-[var(--mut)] data-[state=active]:bg-[var(--s1)] data-[state=active]:text-[var(--tx)] data-[state=active]:shadow-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2E5CFF]/35"
          >
            <Landmark className="size-4 mr-1.5 shrink-0 text-[#10B981]" />
            <span>Fund</span>
          </TabsTrigger>
        </TabsList>
      </div>

      <TabsContent value="agent" className="mt-5 space-y-6">
        {agent}
      </TabsContent>
      <TabsContent value="copy" className="mt-5 space-y-6">
        {copy}
      </TabsContent>
      <TabsContent value="fund" className="mt-5 space-y-6">
        {fund}
      </TabsContent>
    </Tabs>
  );
}
