#!/usr/bin/env python3
"""
x402scan Leaderboard Tracker
Fetches the x402scan bazaar leaderboard daily, stores snapshots in SQLite,
and reports changes (new entrants, dropoffs, volume movers, rank changes).

Usage:
    python x402_leaderboard_tracker.py            # Fetch new data + print report
    python x402_leaderboard_tracker.py --report    # Show latest snapshot without fetching
"""

import argparse
import json
import sqlite3
import sys
import urllib.parse
from datetime import datetime, date

import requests

DB_PATH = "x402_leaderboard.db"
BASE_URL = "https://www.x402scan.com/api/trpc/public.sellers.bazaar.list"
TIMEFRAMES = {1: "24h", 30: "30d"}
VOLUME_CHANGE_THRESHOLD = 0.20  # 20%


def init_db(conn: sqlite3.Connection):
    conn.execute("""
        CREATE TABLE IF NOT EXISTS snapshots (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            snapshot_date TEXT NOT NULL,
            snapshot_ts TEXT NOT NULL,
            timeframe INTEGER NOT NULL,
            rank INTEGER NOT NULL,
            merchant_address TEXT NOT NULL,
            origin TEXT,
            origin_title TEXT,
            facilitator TEXT,
            txn_count INTEGER,
            volume_usdc REAL,
            unique_buyers INTEGER,
            chain TEXT
        )
    """)
    conn.execute("""
        CREATE INDEX IF NOT EXISTS idx_snap_date_tf
        ON snapshots (snapshot_date, timeframe)
    """)
    conn.commit()


def fetch_leaderboard(timeframe: int, page_size: int = 50) -> list[dict]:
    params = json.dumps({"json": {"timeframe": timeframe, "pagination": {"page_size": page_size}}})
    url = f"{BASE_URL}?input={urllib.parse.quote(params)}"
    resp = requests.get(url, timeout=20)
    resp.raise_for_status()
    data = resp.json()
    return data["result"]["data"]["json"]["items"]


def parse_items(items: list[dict], timeframe: int, snap_date: str, snap_ts: str) -> list[dict]:
    rows = []
    for rank, item in enumerate(items, 1):
        address = item["recipients"][0] if item.get("recipients") else "unknown"
        origins = item.get("origins", [])
        origin_url = origins[0]["origin"] if origins else None
        origin_title = origins[0].get("title") if origins else None
        facilitators = item.get("facilitators", [])
        chains = item.get("chains", [])
        # total_amount is in micro-USDC (6 decimals)
        volume_usdc = item.get("total_amount", 0) / 1_000_000

        rows.append({
            "snapshot_date": snap_date,
            "snapshot_ts": snap_ts,
            "timeframe": timeframe,
            "rank": rank,
            "merchant_address": address,
            "origin": origin_url,
            "origin_title": origin_title,
            "facilitator": ",".join(facilitators),
            "txn_count": item.get("tx_count", 0),
            "volume_usdc": volume_usdc,
            "unique_buyers": item.get("unique_buyers", 0),
            "chain": ",".join(chains),
        })
    return rows


def store_snapshot(conn: sqlite3.Connection, rows: list[dict]):
    conn.executemany("""
        INSERT INTO snapshots
        (snapshot_date, snapshot_ts, timeframe, rank, merchant_address,
         origin, origin_title, facilitator, txn_count, volume_usdc, unique_buyers, chain)
        VALUES
        (:snapshot_date, :snapshot_ts, :timeframe, :rank, :merchant_address,
         :origin, :origin_title, :facilitator, :txn_count, :volume_usdc, :unique_buyers, :chain)
    """, rows)
    conn.commit()


def get_previous_snapshot(conn: sqlite3.Connection, timeframe: int, current_date: str) -> list[dict]:
    """Get the most recent snapshot before current_date for the given timeframe."""
    cur = conn.execute("""
        SELECT DISTINCT snapshot_date FROM snapshots
        WHERE timeframe = ? AND snapshot_date < ?
        ORDER BY snapshot_date DESC LIMIT 1
    """, (timeframe, current_date))
    row = cur.fetchone()
    if not row:
        return []
    prev_date = row[0]
    cur = conn.execute("""
        SELECT rank, merchant_address, origin, origin_title, facilitator,
               txn_count, volume_usdc, unique_buyers, chain
        FROM snapshots
        WHERE timeframe = ? AND snapshot_date = ?
        ORDER BY rank
    """, (timeframe, prev_date))
    cols = [d[0] for d in cur.description]
    return [dict(zip(cols, r)) for r in cur.fetchall()]


def get_latest_snapshot(conn: sqlite3.Connection, timeframe: int) -> list[dict]:
    """Get the most recent snapshot for the given timeframe."""
    cur = conn.execute("""
        SELECT DISTINCT snapshot_date FROM snapshots
        WHERE timeframe = ?
        ORDER BY snapshot_date DESC LIMIT 1
    """, (timeframe,))
    row = cur.fetchone()
    if not row:
        return []
    latest_date = row[0]
    cur = conn.execute("""
        SELECT rank, merchant_address, origin, origin_title, facilitator,
               txn_count, volume_usdc, unique_buyers, chain
        FROM snapshots
        WHERE timeframe = ? AND snapshot_date = ?
        ORDER BY rank
    """, (timeframe, latest_date))
    cols = [d[0] for d in cur.description]
    return [dict(zip(cols, r)) for r in cur.fetchall()]


def get_snapshot_count(conn: sqlite3.Connection) -> int:
    cur = conn.execute("SELECT COUNT(DISTINCT snapshot_date) FROM snapshots")
    return cur.fetchone()[0]


def compare_snapshots(current: list[dict], previous: list[dict], label: str):
    if not previous:
        print(f"\n  [{label}] First snapshot -- no previous data to compare.")
        return

    prev_by_addr = {r["merchant_address"]: r for r in previous}
    curr_by_addr = {r["merchant_address"]: r for r in current}

    prev_addrs = set(prev_by_addr.keys())
    curr_addrs = set(curr_by_addr.keys())

    new_entrants = curr_addrs - prev_addrs
    dropoffs = prev_addrs - curr_addrs
    common = curr_addrs & prev_addrs

    # New entrants
    if new_entrants:
        print(f"\n  [{label}] NEW ENTRANTS ({len(new_entrants)}):")
        for addr in sorted(new_entrants, key=lambda a: curr_by_addr[a]["rank"]):
            r = curr_by_addr[addr]
            name = r.get("origin_title") or r.get("origin") or addr[:16]
            print(f"    #{r['rank']:>3}  {name:<35}  ${r['volume_usdc']:>10.2f}  ({r['txn_count']} txns)")

    # Dropoffs
    if dropoffs:
        print(f"\n  [{label}] DROPOFFS ({len(dropoffs)}):")
        for addr in sorted(dropoffs, key=lambda a: prev_by_addr[a]["rank"]):
            r = prev_by_addr[addr]
            name = r.get("origin_title") or r.get("origin") or addr[:16]
            print(f"    was #{r['rank']:>3}  {name:<35}  ${r['volume_usdc']:>10.2f}")

    # Volume movers & rank changes
    movers = []
    for addr in common:
        c = curr_by_addr[addr]
        p = prev_by_addr[addr]
        vol_prev = p["volume_usdc"]
        vol_curr = c["volume_usdc"]
        rank_delta = p["rank"] - c["rank"]  # positive = moved up
        pct = ((vol_curr - vol_prev) / vol_prev * 100) if vol_prev > 0 else 0
        if abs(pct) > VOLUME_CHANGE_THRESHOLD * 100 or abs(rank_delta) >= 3:
            movers.append((addr, c, p, pct, rank_delta))

    if movers:
        movers.sort(key=lambda x: abs(x[3]), reverse=True)
        print(f"\n  [{label}] MOVERS ({len(movers)}):")
        for addr, c, p, pct, rank_delta in movers:
            name = c.get("origin_title") or c.get("origin") or addr[:16]
            arrow = "+" if pct >= 0 else ""
            rank_str = ""
            if rank_delta > 0:
                rank_str = f"  (up {rank_delta} ranks)"
            elif rank_delta < 0:
                rank_str = f"  (down {abs(rank_delta)} ranks)"
            print(f"    #{c['rank']:>3}  {name:<35}  {arrow}{pct:>7.1f}%  ${c['volume_usdc']:>10.2f}{rank_str}")

    if not new_entrants and not dropoffs and not movers:
        print(f"\n  [{label}] No significant changes from previous snapshot.")


def print_leaderboard(rows: list[dict], label: str, limit: int = 20):
    print(f"\n  {'='*80}")
    print(f"  {label} Leaderboard (Top {min(limit, len(rows))})")
    print(f"  {'='*80}")
    print(f"  {'Rank':>4}  {'Name':<35}  {'Volume':>12}  {'Txns':>7}  {'Buyers':>7}  {'Chain'}")
    print(f"  {'-'*4}  {'-'*35}  {'-'*12}  {'-'*7}  {'-'*7}  {'-'*8}")

    total_vol = 0
    total_txns = 0
    for r in rows[:limit]:
        name = (r.get("origin_title") or r.get("origin") or r["merchant_address"][:16])[:35]
        print(f"  {r['rank']:>4}  {name:<35}  ${r['volume_usdc']:>10.2f}  {r['txn_count']:>7}  {r['unique_buyers']:>7}  {r['chain']}")
        total_vol += r["volume_usdc"]
        total_txns += r["txn_count"]

    print(f"  {'-'*4}  {'-'*35}  {'-'*12}  {'-'*7}")
    print(f"  {'':>4}  {'TOTAL':<35}  ${total_vol:>10.2f}  {total_txns:>7}  ({len(rows)} merchants)")


def main():
    parser = argparse.ArgumentParser(description="x402scan Leaderboard Tracker")
    parser.add_argument("--report", action="store_true", help="Show latest snapshot without fetching")
    parser.add_argument("--db", default=DB_PATH, help="SQLite database path")
    args = parser.parse_args()

    conn = sqlite3.connect(args.db)
    init_db(conn)

    if args.report:
        snap_count = get_snapshot_count(conn)
        print(f"\n  x402scan Leaderboard Report ({snap_count} snapshots in DB)")
        for tf, label in TIMEFRAMES.items():
            rows = get_latest_snapshot(conn, tf)
            if rows:
                print_leaderboard(rows, label)
            else:
                print(f"\n  No data for timeframe={tf} ({label})")
        conn.close()
        return

    # Fetch new data
    snap_date = date.today().isoformat()
    snap_ts = datetime.now(tz=__import__('datetime').timezone.utc).isoformat()

    print(f"\n  x402scan Leaderboard Tracker")
    print(f"  Fetching data at {snap_ts}")

    for tf, label in TIMEFRAMES.items():
        try:
            print(f"\n  Fetching timeframe={tf} ({label})...", end=" ", flush=True)
            items = fetch_leaderboard(tf)
            print(f"got {len(items)} merchants")

            rows = parse_items(items, tf, snap_date, snap_ts)

            # Get previous for comparison before storing new
            previous = get_previous_snapshot(conn, tf, snap_date)

            # Delete any existing snapshot for today+timeframe (idempotent re-runs)
            conn.execute(
                "DELETE FROM snapshots WHERE snapshot_date = ? AND timeframe = ?",
                (snap_date, tf)
            )
            store_snapshot(conn, rows)

            print_leaderboard(rows, label)
            compare_snapshots(rows, previous, label)

        except requests.RequestException as e:
            print(f"FAILED: {e}")
        except (KeyError, IndexError, json.JSONDecodeError) as e:
            print(f"PARSE ERROR: {e}")

    snap_count = get_snapshot_count(conn)
    print(f"\n  Done. {snap_count} unique snapshot dates in DB.")
    conn.close()


if __name__ == "__main__":
    main()
