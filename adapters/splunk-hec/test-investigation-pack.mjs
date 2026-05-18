import { readFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const packDir = path.join(here, 'investigation-pack');
const searchesPath = path.join(packDir, 'searches.json');
const readmePath = path.join(packDir, 'README.md');
const promptsPath = path.join(packDir, 'agentops-ai-prompts.md');

for (const filePath of [searchesPath, readmePath, promptsPath]) {
  assert.ok(existsSync(filePath), `missing investigation pack file: ${path.basename(filePath)}`);
}

const searches = JSON.parse(await readFile(searchesPath, 'utf8'));
assert.ok(Array.isArray(searches), 'searches.json should contain an array');
assert.ok(searches.length >= 5, 'expected at least five investigation searches');

const requiredIds = new Set([
  'run-timeline-by-run-id',
  'rejected-approval-gates',
  'failed-tool-calls-by-tool',
  'payment-risk-events',
  'agent-run-error-and-retry-summary',
]);

const ids = new Set(searches.map((search) => search.id));
for (const requiredId of requiredIds) {
  assert.ok(ids.has(requiredId), `missing search id: ${requiredId}`);
}

for (const search of searches) {
  assert.equal(typeof search.id, 'string', 'search id should be a string');
  assert.equal(typeof search.title, 'string', `title missing for ${search.id}`);
  assert.equal(typeof search.purpose, 'string', `purpose missing for ${search.id}`);
  assert.equal(typeof search.spl, 'string', `spl missing for ${search.id}`);
  assert.equal(typeof search.ai_assistant_prompt, 'string', `AI Assistant prompt missing for ${search.id}`);
  assert.equal(typeof search.mcp_prompt, 'string', `MCP prompt missing for ${search.id}`);
  assert.ok(Array.isArray(search.expected_fields), `expected_fields missing for ${search.id}`);

  assert.match(search.spl, /sourcetype=agentops:run_event/, `${search.id} should target the AgentOps sourcetype`);
  assert.match(search.spl, /source=agentops-ledger/, `${search.id} should target the AgentOps source`);
  assert.match(search.ai_assistant_prompt, /agentops:run_event/i, `${search.id} AI prompt should name the event type`);
  assert.match(search.mcp_prompt, /agentops:run_event/i, `${search.id} MCP prompt should name the event type`);
}

const timeline = searches.find((search) => search.id === 'run-timeline-by-run-id');
assert.match(timeline.spl, /\$run_id\$/, 'timeline search should be parameterized by run_id');

const rejectedApprovals = searches.find((search) => search.id === 'rejected-approval-gates');
assert.match(rejectedApprovals.spl, /approval/i, 'rejected approval search should filter approval events');
assert.match(rejectedApprovals.spl, /rejected|blocked/i, 'rejected approval search should cover blocked/rejected decisions');

const readme = await readFile(readmePath, 'utf8');
for (const term of [
  'Splunk AI Assistant',
  'Splunk MCP Server',
  'HTTP Event Collector',
  'agentops:run_event',
  'run_demo_vendor_blocked',
  'human-in-the-loop',
]) {
  assert.match(readme, new RegExp(term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i'), `README missing ${term}`);
}

const prompts = await readFile(promptsPath, 'utf8');
for (const term of ['failed agent runs', 'rejected approvals', 'blocked payments', 'run_demo_vendor_blocked']) {
  assert.match(prompts, new RegExp(term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i'), `prompts missing ${term}`);
}

console.log('splunk investigation pack test passed');
