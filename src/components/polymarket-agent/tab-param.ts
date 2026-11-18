/**
 * polymarket-agent/tab-param.ts — URL <-> tab validation for /app/polymarket-agent.
 *
 * The page keeps its Agent / Copy / Fund tab state in the `?tab=` search param so
 * all surfaces are deep-linkable and shareable. Supports legacy ?tab=copier and
 * ?tab=funds aliases cleanly.
 */

export const AGENT_TABS = ['agent', 'copy', 'fund'] as const;

export type AgentTab = (typeof AGENT_TABS)[number];

/** Default tab when the URL carries no (or an invalid) ?tab= value. */
export const DEFAULT_AGENT_TAB: AgentTab = 'agent';

export function isAgentTab(value: unknown): value is AgentTab {
  return value === 'agent' || value === 'copy' || value === 'fund';
}

/**
 * Normalize a raw ?tab= value to a valid tab id. Case-insensitive, trims
 * surrounding whitespace, maps legacy copier/funds aliases, and falls back to agent.
 */
export function parseAgentTab(value: string | null | undefined): AgentTab {
  const normalized = value?.trim().toLowerCase();
  if (normalized === 'copier') return 'copy';
  if (normalized === 'funds') return 'fund';
  return isAgentTab(normalized) ? normalized : DEFAULT_AGENT_TAB;
}
