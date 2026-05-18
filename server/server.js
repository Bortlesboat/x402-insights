/**
 * x402-insights backend - POST /events ingestion + dashboard API + static UI.
 * v1: single file, SQLite, one API key.
 */
const express = require("express");
const path = require("path");
const Database = require("better-sqlite3");

const PORT = process.env.PORT || 4000;
const API_KEY = process.env.INSIGHTS_API_KEY || "dev-key";
const DB_PATH = process.env.INSIGHTS_DB || path.join(__dirname, "insights.db");

const db = new Database(DB_PATH);
db.pragma("journal_mode = WAL");
db.exec(`
  CREATE TABLE IF NOT EXISTS events (
    id           INTEGER PRIMARY KEY AUTOINCREMENT,
    timestamp    TEXT NOT NULL,
    agent        TEXT NOT NULL,
    workflow     TEXT NOT NULL,
    endpoint     TEXT NOT NULL,
    provider     TEXT,
    request_id   TEXT,
    status_code  INTEGER,
    retry_count  INTEGER NOT NULL DEFAULT 0,
    is_retry     INTEGER NOT NULL DEFAULT 0,
    environment  TEXT NOT NULL DEFAULT 'dev',
    source       TEXT NOT NULL DEFAULT 'unknown',
    cost         REAL NOT NULL,
    currency     TEXT NOT NULL,
    latency_ms   INTEGER NOT NULL,
    status       TEXT NOT NULL,
    error        TEXT,
    run_id       TEXT,
    event_type   TEXT DEFAULT 'payment',
    step_name    TEXT,
    tool_name    TEXT,
    approval_status TEXT,
    metadata_json TEXT
  );

  CREATE TABLE IF NOT EXISTS runs (
    run_id       TEXT PRIMARY KEY,
    agent        TEXT NOT NULL,
    workflow     TEXT NOT NULL,
    environment  TEXT NOT NULL DEFAULT 'dev',
    source       TEXT NOT NULL DEFAULT 'unknown',
    started_at   TEXT NOT NULL,
    finished_at  TEXT,
    status       TEXT NOT NULL DEFAULT 'running',
    summary      TEXT
  );
`);

// Migrate existing DBs (pre-schema-v2) BEFORE creating indexes
const existingCols = db.prepare(`PRAGMA table_info(events)`).all().map(c => c.name);
const addCol = (name, ddl) => {
  if (!existingCols.includes(name)) db.exec(`ALTER TABLE events ADD COLUMN ${ddl}`);
};
// NOTE: SQLite ALTER TABLE ADD COLUMN can't use non-constant DEFAULT, so no NOT NULL w/ default here.
addCol("provider",    "provider TEXT");
addCol("request_id",  "request_id TEXT");
addCol("status_code", "status_code INTEGER");
addCol("retry_count", "retry_count INTEGER DEFAULT 0");
addCol("is_retry",    "is_retry INTEGER DEFAULT 0");
addCol("environment", "environment TEXT DEFAULT 'dev'");
addCol("source",      "source TEXT DEFAULT 'unknown'");
addCol("phase",        "phase TEXT");
addCol("run_id",       "run_id TEXT");
addCol("event_type",   "event_type TEXT DEFAULT 'payment'");
addCol("step_name",    "step_name TEXT");
addCol("tool_name",    "tool_name TEXT");
addCol("approval_status", "approval_status TEXT");
addCol("metadata_json", "metadata_json TEXT");

db.exec(`
  CREATE INDEX IF NOT EXISTS idx_events_timestamp ON events(timestamp);
  CREATE INDEX IF NOT EXISTS idx_events_agent ON events(agent);
  CREATE INDEX IF NOT EXISTS idx_events_endpoint ON events(endpoint);
  CREATE INDEX IF NOT EXISTS idx_events_source ON events(source);
  CREATE INDEX IF NOT EXISTS idx_events_environment ON events(environment);
  CREATE INDEX IF NOT EXISTS idx_events_run_id ON events(run_id);
  CREATE INDEX IF NOT EXISTS idx_events_event_type ON events(event_type);
`);

const insertEvent = db.prepare(`
  INSERT INTO events (
    timestamp, agent, workflow, endpoint, provider, request_id,
    status_code, retry_count, is_retry, environment, source, phase,
    cost, currency, latency_ms, status, error, run_id, event_type,
    step_name, tool_name, approval_status, metadata_json
  ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
`);

const upsertRunStart = db.prepare(`
  INSERT INTO runs (
    run_id, agent, workflow, environment, source, started_at, status, summary
  ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  ON CONFLICT(run_id) DO UPDATE SET
    agent = excluded.agent,
    workflow = excluded.workflow,
    environment = excluded.environment,
    source = excluded.source,
    started_at = excluded.started_at,
    status = excluded.status,
    summary = COALESCE(excluded.summary, runs.summary)
`);

const updateRunFinish = db.prepare(`
  UPDATE runs
  SET finished_at = ?, status = ?, summary = COALESCE(?, summary)
  WHERE run_id = ?
`);

const insertFinishedRun = db.prepare(`
  INSERT INTO runs (
    run_id, agent, workflow, environment, source, started_at, finished_at, status, summary
  ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
`);

const app = express();
app.use(express.json({ limit: "1mb" }));

function parseMetadata(row) {
  if (!row.metadata_json) return null;
  try {
    return JSON.parse(row.metadata_json);
  } catch {
    return null;
  }
}

function normalizeEvent(row) {
  return { ...row, metadata: parseMetadata(row) };
}

function summarizeRun(runId) {
  const events = db.prepare(
    `SELECT * FROM events WHERE run_id = ? ORDER BY timestamp ASC, id ASC`
  ).all(runId).map(normalizeEvent);
  const totals = db.prepare(`
    SELECT
      COUNT(*) as event_count,
      COALESCE(SUM(cost),0) as total_cost,
      COALESCE(SUM(CASE WHEN status='error' THEN 1 ELSE 0 END),0) as error_count,
      COALESCE(SUM(CASE WHEN is_retry=1 THEN 1 ELSE 0 END),0) as retry_count,
      COALESCE(SUM(CASE WHEN event_type='approval' THEN 1 ELSE 0 END),0) as approval_count,
      COALESCE(MAX(latency_ms),0) as max_latency_ms
    FROM events WHERE run_id = ?
  `).get(runId);
  return { events, totals };
}

function riskFlagsFor(run, totals, events) {
  const flags = [];
  if ((totals.error_count || 0) > 0) flags.push("errors_present");
  if ((totals.retry_count || 0) > 0) flags.push("retries_present");
  if (run && run.status === "running") flags.push("unfinished_run");
  const hasApprovalRequest = events.some(
    (event) => event.event_type === "approval" && event.approval_status === "requested"
  );
  const hasApprovalDecision = events.some(
    (event) => event.event_type === "approval" &&
      ["approved", "rejected", "bypassed"].includes(event.approval_status)
  );
  if (hasApprovalRequest && !hasApprovalDecision) flags.push("approval_missing");
  return flags;
}

// --- Ingestion ---
app.post("/events", (req, res) => {
  if (req.get("x-api-key") !== API_KEY) {
    return res.status(401).json({ error: "invalid api key" });
  }
  const e = req.body || {};
  const required = ["timestamp", "agent", "workflow", "endpoint", "latency_ms", "status"];
  for (const f of required) {
    if (e[f] === undefined) return res.status(400).json({ error: `missing ${f}` });
  }
  try {
    const eventType = e.event_type || e.phase || "payment";
    const runId = e.run_id || `legacy-${e.request_id || e.timestamp || Date.now()}`;
    const metadataJson = e.metadata
      ? JSON.stringify(e.metadata)
      : e.metadata_json || null;
    insertEvent.run(
      e.timestamp,
      e.agent,
      e.workflow,
      e.endpoint,
      e.provider || null,
      e.request_id || null,
      e.status_code != null ? Number(e.status_code) : null,
      Number(e.retry_count) || 0,
      e.is_retry ? 1 : 0,
      e.environment || "dev",
      e.source || "unknown",
      e.phase || null,
      Number(e.cost) || 0,
      e.currency || "USDC",
      Number(e.latency_ms) || 0,
      e.status,
      e.error || null,
      runId,
      eventType,
      e.step_name || null,
      e.tool_name || null,
      e.approval_status || null,
      metadataJson
    );
    if (eventType === "run_start") {
      upsertRunStart.run(
        runId,
        e.agent,
        e.workflow,
        e.environment || "dev",
        e.source || "unknown",
        e.timestamp,
        e.status === "error" ? "error" : "running",
        e.summary || null
      );
    } else if (eventType === "run_finish") {
      const info = updateRunFinish.run(
        e.timestamp,
        e.status || "success",
        e.summary || null,
        runId
      );
      if (info.changes === 0) {
        insertFinishedRun.run(
          runId,
          e.agent,
          e.workflow,
          e.environment || "dev",
          e.source || "unknown",
          e.timestamp,
          e.timestamp,
          e.status || "success",
          e.summary || null
        );
      }
    }
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- Filters ---
function buildFilters(req) {
  const hours = Number(req.query.hours) || 24;
  const since = new Date(Date.now() - hours * 3600 * 1000).toISOString();
  const mode = req.query.mode || "live"; // 'live' | 'demo' | 'all'
  const env = req.query.env || "all"; // 'testnet' | 'dev' | 'all'
  const params = [since];
  let where = `timestamp >= ?`;
  if (mode === "live") { where += ` AND source != 'demo'`; }
  else if (mode === "demo") { where += ` AND source = 'demo'`; }
  if (env === "testnet") { where += ` AND environment = 'testnet'`; }
  else if (env === "dev") { where += ` AND environment = 'dev'`; }
  return { where, params, hours, mode, env };
}

// --- Dashboard queries ---
app.get("/api/runs", (req, res) => {
  const limit = Math.min(Number(req.query.limit) || 50, 200);
  const rows = db.prepare(`
    SELECT
      r.run_id,
      r.agent,
      r.workflow,
      r.environment,
      r.source,
      r.started_at,
      r.finished_at,
      r.status,
      r.summary,
      COUNT(e.id) as event_count,
      COALESCE(SUM(e.cost),0) as total_cost,
      COALESCE(SUM(CASE WHEN e.status='error' THEN 1 ELSE 0 END),0) as error_count,
      COALESCE(SUM(CASE WHEN e.is_retry=1 THEN 1 ELSE 0 END),0) as retry_count,
      COALESCE(SUM(CASE WHEN e.event_type='approval' THEN 1 ELSE 0 END),0) as approval_count,
      COALESCE(SUM(CASE WHEN e.is_retry=1 THEN e.cost ELSE 0 END),0) as retry_spend
    FROM runs r
    LEFT JOIN events e ON e.run_id = r.run_id
    GROUP BY r.run_id
    ORDER BY r.started_at DESC
    LIMIT ?
  `).all(limit);
  res.json(rows);
});

app.get("/api/runs/:run_id", (req, res) => {
  const run = db.prepare(`SELECT * FROM runs WHERE run_id = ?`).get(req.params.run_id);
  if (!run) return res.status(404).json({ error: "run not found" });
  const { events, totals } = summarizeRun(req.params.run_id);
  res.json({
    run,
    summary: totals,
    risk_flags: riskFlagsFor(run, totals, events),
    events,
  });
});

app.get("/api/runs/:run_id/export", (req, res) => {
  const run = db.prepare(`SELECT * FROM runs WHERE run_id = ?`).get(req.params.run_id);
  if (!run) return res.status(404).json({ error: "run not found" });
  const { events, totals } = summarizeRun(req.params.run_id);
  res.setHeader(
    "Content-Disposition",
    `attachment; filename="${req.params.run_id}-audit.json"`
  );
  res.json({
    exported_at: new Date().toISOString(),
    run,
    summary: totals,
    risk_flags: riskFlagsFor(run, totals, events),
    events,
  });
});

app.get("/api/overview", (req, res) => {
  const { where, params, hours, mode } = buildFilters(req);
  const row = db.prepare(
    `SELECT
       COUNT(*) as requests,
       COALESCE(SUM(cost),0) as total_cost,
       COALESCE(AVG(cost),0) as avg_cost,
       COALESCE(AVG(latency_ms),0) as avg_latency_ms,
       COALESCE(SUM(CASE WHEN status='error' THEN 1 ELSE 0 END)*1.0 / NULLIF(COUNT(*),0), 0) as error_rate,
       COALESCE(SUM(CASE WHEN is_retry=1 THEN cost ELSE 0 END), 0) as retry_spend,
       COALESCE(SUM(CASE WHEN status='success' THEN 1 ELSE 0 END), 0) as successes,
       COALESCE(SUM(CASE WHEN status='error'   THEN cost ELSE 0 END), 0) as error_spend
     FROM events WHERE ${where}`
  ).get(...params);
  const retry_spend_pct = row.total_cost > 0 ? row.retry_spend / row.total_cost : 0;
  const cost_per_success = row.successes > 0 ? row.total_cost / row.successes : 0;
  const top = db.prepare(
    `SELECT endpoint, SUM(cost) as total_cost FROM events WHERE ${where}
     GROUP BY endpoint ORDER BY total_cost DESC LIMIT 1`
  ).get(...params);
  res.json({
    hours, mode,
    ...row,
    retry_spend_pct,
    cost_per_success,
    top_endpoint: top ? top.endpoint : null,
    top_endpoint_cost: top ? top.total_cost : 0,
  });
});

app.get("/api/by-endpoint", (req, res) => {
  const { where, params } = buildFilters(req);
  const rows = db.prepare(
    `SELECT endpoint,
            COUNT(*) as requests,
            SUM(cost) as total_cost,
            AVG(cost) as avg_cost,
            SUM(CASE WHEN is_retry=1 THEN cost ELSE 0 END) as retry_cost
     FROM events WHERE ${where}
     GROUP BY endpoint ORDER BY total_cost DESC`
  ).all(...params);
  res.json(rows);
});

app.get("/api/by-agent", (req, res) => {
  const { where, params } = buildFilters(req);
  const rows = db.prepare(
    `SELECT agent,
            COUNT(*) as requests,
            SUM(cost) as total_cost
     FROM events WHERE ${where}
     GROUP BY agent ORDER BY total_cost DESC`
  ).all(...params);
  res.json(rows);
});

app.get("/api/events", (req, res) => {
  const limit = Math.min(Number(req.query.limit) || 100, 500);
  const mode = req.query.mode || "live";
  const env = req.query.env || "all";
  let where = "1=1";
  if (mode === "live") where = "source != 'demo'";
  else if (mode === "demo") where = "source = 'demo'";
  if (env === "testnet") where += " AND environment = 'testnet'";
  else if (env === "dev") where += " AND environment = 'dev'";
  const rows = db.prepare(
    `SELECT * FROM events WHERE ${where} ORDER BY id DESC LIMIT ?`
  ).all(limit);
  res.json(rows);
});

app.get("/api/environments", (_req, res) => {
  const rows = db.prepare(
    `SELECT environment, COUNT(*) as count FROM events GROUP BY environment ORDER BY count DESC`
  ).all();
  res.json(rows);
});

// --- Static dashboard ---
app.use(express.static(path.join(__dirname, "public")));

app.listen(PORT, () => {
  console.log(`x402-insights listening on http://localhost:${PORT}`);
  console.log(`API key: ${API_KEY === "dev-key" ? "dev-key (set INSIGHTS_API_KEY in prod)" : "[set]"}`);
});
