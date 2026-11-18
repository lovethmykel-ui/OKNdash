import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { DEFAULT_AGENT_TAB, parseAgentTab } from './tab-param';

describe('parseAgentTab', () => {
  it('parses canonical agent, copy, and fund tabs case-insensitively', () => {
    assert.equal(parseAgentTab('agent'), 'agent');
    assert.equal(parseAgentTab('Copy'), 'copy');
    assert.equal(parseAgentTab('  FUND '), 'fund');
  });

  it('maps legacy copier and funds query values cleanly', () => {
    assert.equal(parseAgentTab('copier'), 'copy');
    assert.equal(parseAgentTab('funds'), 'fund');
  });

  it('falls back to agent tab on empty or invalid values', () => {
    assert.equal(parseAgentTab(undefined), DEFAULT_AGENT_TAB);
    assert.equal(parseAgentTab(null), DEFAULT_AGENT_TAB);
    assert.equal(parseAgentTab('unknown'), DEFAULT_AGENT_TAB);
  });
});
