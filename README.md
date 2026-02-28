# Trading Brain

[![npm version](https://img.shields.io/npm/v/@timmeck/trading-brain)](https://www.npmjs.com/package/@timmeck/trading-brain)
[![npm downloads](https://img.shields.io/npm/dm/@timmeck/trading-brain)](https://www.npmjs.com/package/@timmeck/trading-brain)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![GitHub stars](https://img.shields.io/github/stars/timmeck/trading-brain)](https://github.com/timmeck/trading-brain)

**Adaptive Trading Intelligence & Signal Learning System for Claude Code**

Trading Brain is an MCP server that gives Claude Code a persistent trading memory. It learns from every trade outcome — strengthening connections between signals, strategies, and results through a Hebbian synapse network. Over time, it develops confidence in signal combinations, adapts calibration parameters, and surfaces research insights about your trading patterns.

## Why Trading Brain?

Without Trading Brain, every trading decision starts from zero. With Trading Brain:

- **Signals are weighted by experience** — Brain tracks which signal combinations actually lead to winning trades, not just theory
- **Confidence is statistical** — Wilson Score intervals provide conservative confidence bounds, not just raw win rates
- **DCA multipliers adapt** — Brain-recommended position sizes adjust based on regime awareness and historical performance
- **Grid parameters tune themselves** — Volatility-aware grid spacing multipliers based on actual outcomes
- **Patterns emerge automatically** — The learning engine extracts rules from signal fingerprint groupings
- **Streaks are detected** — Chain detection identifies winning and losing streaks per pair
- **Knowledge compounds** — Every trade outcome makes Brain smarter through Hebbian learning
- **Research runs continuously** — Trend analysis, gap detection, synergy mapping, and regime shift detection

## Features

### Core Intelligence
- **Trade Outcome Memory** — Record and query trade outcomes with full signal context
- **Signal Fingerprinting** — RSI, MACD, Trend, and Volatility classification into discrete categories
- **Wilson Score Confidence** — Statistical confidence intervals with adaptive z-scores based on data volume
- **Hebbian Synapse Network** — Weighted graph connecting signals, combos, outcomes, pairs, and regimes
- **Spreading Activation** — Explore related knowledge by activating nodes in the synapse network
- **Adaptive Calibration** — Learning rate, Wilson z-score, and decay half-life auto-calibrate across 4 stages

### Learning Engine
- **Pattern Extraction** — Fingerprint grouping with similarity threshold → rules when confidence exceeds gate
- **Chain Detection** — Identifies 3+ consecutive same-result trades on the same pair
- **Temporal Decay** — Exponential half-life decay keeps recent trades more relevant
- **Recalibration** — Auto-recalibrates every 25 trades based on data volume and synapse density

### Research Engine
- **Trend Detection** — Identifies pairs with consistently improving or declining win rates
- **Gap Detection** — Finds signal combinations with few data points that need more testing
- **Synergy Detection** — Discovers which signal pairs frequently co-occur in winning trades
- **Performance Analysis** — Ranks pairs and strategies by statistical confidence
- **Regime Shift Detection** — Alerts when a pair's recent performance deviates from its baseline

### Strategy Recommendations
- **DCA Multiplier** — Brain-recommended multiplier (0.3x–2.5x) based on regime and RSI context
- **Grid Parameters** — Volatility-aware grid spacing with historical performance adjustment

### Universal Access
- **MCP Server** — Stdio transport for Claude Code integration
- **MCP HTTP/SSE** — Standard MCP protocol over HTTP for Cursor, Windsurf, Cline, Continue
- **REST API** — Full HTTP API on port 7779 with RPC endpoint

## Quick Start

### Installation

```bash
npm install -g @timmeck/trading-brain
```

Or from source:

```bash
git clone https://github.com/timmeck/trading-brain.git
cd trading-brain
npm install
npm run build
```

### Setup with Claude Code

Add Trading Brain's MCP server to your Claude Code configuration (`~/.claude/settings.json`):

```json
{
  "mcpServers": {
    "trading-brain": {
      "command": "trading",
      "args": ["mcp-server"]
    }
  }
}
```

### Setup with Cursor / Windsurf / Cline / Continue

Trading Brain supports MCP over HTTP with SSE transport:

```json
{
  "trading-brain": {
    "url": "http://localhost:7780/sse"
  }
}
```

Make sure the daemon is running (`trading start`).

### Start the Daemon

```bash
trading start
trading status
trading doctor    # verify everything is configured correctly
```

The daemon runs background tasks: learning cycles, research analysis, synapse decay, and recalibration.

## Architecture

```
+------------------+     +------------------+     +------------------+
|   Claude Code    |     |  Cursor/Windsurf |     |  Browser/CI/CD   |
|   (MCP stdio)    |     |  (MCP HTTP/SSE)  |     |  (REST API)      |
+--------+---------+     +--------+---------+     +--------+---------+
         |                        |                        |
         v                        v                        v
+--------+---------+     +--------+---------+     +--------+---------+
|   MCP Server     |     |   MCP HTTP/SSE   |     |    REST API      |
|   (stdio)        |     |   (port 7780)    |     |   (port 7779)    |
+--------+---------+     +--------+---------+     +--------+---------+
         |                        |                        |
         +----------+-------------+------------------------+
                    |
                    v
         +----------+------------+
         |     TradingCore       |
         |  (Daemon / Services)  |
         +----------+------------+
                    |
    +-------+-------+--------+--------+
    |       |       |        |        |
    v       v       v        v        v
+---+--+ +--+---+ +-+-----+ +-+----+ +-+--------+
|Trade | |Signal| |Synapse | |Strat | |Research  |
|Memory| |Brain | |Network | |Brain | |Engine    |
+---+--+ +--+---+ +-+-----+ +-+----+ +-+--------+
    |       |       |        |        |
    v       v       v        v        v
+---+--+ +--+---+ +-+-----+ +-+----+ +-+--------+
|Learn | |Wilson| |Hebbian | |DCA/  | |Trend/Gap |
|Engine| |Score | |Learn   | |Grid  | |Synergy   |
+------+ +------+ +-------+ +------+ +----------+
                    |
                    v
         +----------+-----------+
         |     SQLite (DB)      |
         |  better-sqlite3      |
         +----------------------+
```

### Core Components

| Component | Purpose |
|-----------|---------|
| **Trade Memory** | Stores trade outcomes with signal fingerprints, pairs, bot types, and results |
| **Signal Brain** | Computes weighted signal strengths via direct synapses + spreading activation + similar combo boost |
| **Synapse Network** | Weighted graph connecting signals, combos, outcomes, pairs. Hebbian: "signals that win together wire together" |
| **Strategy Brain** | DCA multiplier and grid parameter recommendations based on regime and volatility awareness |
| **Learning Engine** | Pattern extraction, chain detection, temporal decay, adaptive recalibration |
| **Research Engine** | Automated analysis: trends, gaps, synergies, performance rankings, regime shifts |
| **Calibrator** | 4-stage adaptive calibration: learningRate, wilsonZ, decayHalfLife based on trade count |
| **REST API** | HTTP API exposing all Trading Brain methods as RPC endpoints |
| **MCP HTTP Server** | SSE transport enabling non-Claude MCP clients |

## CLI Commands

```
trading start              Start the Trading Brain daemon
trading stop               Stop the daemon
trading status             Show stats (trades, rules, chains, insights, synapses)
trading doctor             Health check: daemon, DB, IPC, ports
trading query <text>       Search trades by fingerprint, pair, or bot type
trading insights           Show research insights with severity
trading rules              Show learned rules with confidence and win rate
trading network            Explore the synapse network
trading dashboard           Open interactive HTML dashboard in browser
trading peers              Show status of peer brains in the ecosystem
trading config             View and manage configuration
trading export             Export all data as JSON
trading import <file>      Import trades from JSON array
```

## MCP Tools

These tools are available to Claude Code (and other MCP clients) when Trading Brain is configured:

| Tool | Description |
|------|-------------|
| `trading_record_outcome` | Record a trade outcome (main entry point for learning loop) |
| `trading_signal_weights` | Get Brain-weighted signal strengths for a signal combination |
| `trading_signal_confidence` | Wilson Score confidence interval for a signal pattern |
| `trading_dca_multiplier` | Brain-recommended DCA position size multiplier |
| `trading_grid_params` | Brain-recommended grid trading parameters |
| `trading_explore` | Spreading Activation network exploration from a query node |
| `trading_connections` | Find the shortest path between two nodes in the graph |
| `trading_rules` | Get all learned trading rules |
| `trading_insights` | Get research insights (trends, gaps, synergies) |
| `trading_chains` | Get detected winning/losing streaks |
| `trading_query` | Search trades by fingerprint, pair, or bot type |
| `trading_status` | Current Trading Brain stats |
| `trading_calibration` | Current adaptive calibration parameters |
| `trading_learn` | Manually trigger a learning cycle |
| `trading_reset` | Reset all data (use with caution) |
| `trading_ecosystem_status` | Get status of all brains in the ecosystem |
| `trading_query_peer` | Query another brain in the ecosystem (method + params) |
| `trading_error_context` | Query Brain for errors that correlate with trade failures |

## REST API

Trading Brain includes a REST API on port 7779 (default).

### Generic RPC Endpoint

```bash
# Call any Trading Brain method
curl -X POST http://localhost:7779/api/v1/rpc \
  -H "Content-Type: application/json" \
  -d '{"method": "analytics.summary", "params": {}}'

# Batch multiple calls
curl -X POST http://localhost:7779/api/v1/rpc \
  -H "Content-Type: application/json" \
  -d '[
    {"id": 1, "method": "analytics.summary", "params": {}},
    {"id": 2, "method": "synapse.stats", "params": {}}
  ]'
```

### Authentication

Set an API key via environment variable:

```bash
TRADING_BRAIN_API_KEY=your-secret-key trading start
```

Then include it in requests:

```bash
curl -H "X-API-Key: your-secret-key" http://localhost:7779/api/v1/rpc \
  -d '{"method": "analytics.summary", "params": {}}'
```

## Configuration

Trading Brain is configured via `config.json` in the data directory or environment variables:

| Env Variable | Default | Description |
|---|---|---|
| `TRADING_BRAIN_DATA_DIR` | `~/.trading-brain` | Data directory |
| `TRADING_BRAIN_LOG_LEVEL` | `info` | Log level |
| `TRADING_BRAIN_API_PORT` | `7779` | REST API port |
| `TRADING_BRAIN_API_KEY` | — | API authentication key |
| `TRADING_BRAIN_MCP_HTTP_PORT` | `7780` | MCP HTTP/SSE port |
| `TRADING_BRAIN_API_ENABLED` | `true` | Enable REST API |
| `TRADING_BRAIN_MCP_HTTP_ENABLED` | `true` | Enable MCP HTTP |

## How It Learns

1. **Trade Outcome Recorded** — A bot completes a trade and reports the result via `trading_record_outcome`
2. **Signal Fingerprinted** — RSI, MACD, Trend, and Volatility are classified into discrete categories
3. **Synapses Form** — Hebbian connections link signal → combo → outcome → pair. Winners strengthen, losers weaken
4. **Graph Updated** — Nodes and edges are created/strengthened in the weighted graph
5. **Chain Checked** — If 3+ consecutive same-result trades on a pair, a chain is recorded
6. **Confidence Computed** — Wilson Score provides statistical lower bound on true win rate
7. **Patterns Extracted** — Similar fingerprints are grouped; rules generated when confidence exceeds threshold
8. **Calibration Adapts** — Every 25 trades, learning rate, Wilson z, and decay half-life recalibrate
9. **Research Runs** — Background analysis finds trends, gaps, synergies, and regime shifts
10. **Next Trade** — Signal weights, DCA multiplier, and grid params incorporate all learned knowledge

## Algorithms

### Wilson Score Confidence
Conservative statistical confidence interval for win rates. Adaptive z-score: starts at 1.0 (few trades) → reaches 1.96 (500+ trades).

### Hebbian Learning
"Signals that win together wire together." Asymmetric updates:
- **Strengthen** (win): `weight += (1 - weight) * learningRate` (asymptotic approach to 1.0)
- **Weaken** (loss): `weight *= penalty` (multiplicative decay)

### Spreading Activation
BFS-based energy propagation through the weighted graph. Decay factor 0.6, threshold 0.05, max depth 4. Used for signal weight bonuses and network exploration.

### Adaptive Calibration
4 stages based on trade count:
| Stage | Trades | Learning Rate | Wilson Z | Decay Half-Life |
|-------|--------|--------------|----------|-----------------|
| 1 | <20 | 0.3 | 1.0 | 60 days |
| 2 | 20–100 | 0.15 | 1.44 | 45 days |
| 3 | 100–500 | 0.08 | 1.65 | 30 days |
| 4 | >500 | 0.05 | 1.96 | 21 days |

### Signal Fingerprinting
Each signal dimension is classified:
- **RSI**: oversold (<30), neutral (30–70), overbought (>70)
- **MACD**: strong_bull (>0.5), bull (>0), bear (<0), strong_bear (<-0.5)
- **Trend**: strong_up (>0.5), up (>0), down (<0), strong_down (<-0.5)
- **Volatility**: low (<0.3), medium (0.3–0.7), high (>0.7)

## Tech Stack

- **TypeScript** — Full type safety, ES2022 target, ESM modules
- **better-sqlite3** — Fast, embedded, synchronous database with WAL mode
- **MCP SDK** — Model Context Protocol integration (stdio + HTTP/SSE transports)
- **Commander** — CLI framework
- **Chalk** — Colored terminal output
- **Winston** — Structured logging

## Brain Ecosystem

Trading Brain is part of the **Brain Ecosystem** — a family of standalone MCP servers that give Claude Code persistent, self-learning memory.

| Brain | Purpose | Ports |
|-------|---------|-------|
| [Brain](https://github.com/timmeck/brain) v2.2.0 | Error memory, code intelligence & persistent context | 7777 / 7778 |
| **Trading Brain** | Adaptive trading intelligence | **7779** / 7780 |
| [Marketing Brain](https://github.com/timmeck/marketing-brain) | Content strategy & engagement | 7781 / 7782 |
| [Brain Core](https://github.com/timmeck/brain-core) v1.6.0 | Shared infrastructure (IPC, MCP, REST, CLI, math, synapses, memory) | — |
| [Brain Hub](https://timmeck.github.io/brain-hub/) | Ecosystem landing page | — |

Each brain is **fully standalone** — [Brain Core](https://www.npmjs.com/package/@timmeck/brain-core) provides shared infrastructure (IPC, MCP, REST API, CLI, math, synapse algorithms) used by all brains, eliminating ~2,800 lines of duplicated code.

### Cross-Brain Communication

Brains discover and query each other at runtime via IPC named pipes. Use `trading peers` to see online peers, or the `trading_query_peer` / `trading_ecosystem_status` MCP tools to access peer data from Claude Code. Brains push event notifications to peers — when Trading Brain records a trade outcome or calibrates signals, Brain and Marketing Brain are notified automatically.

### Ecosystem Dashboard

The interactive HTML dashboard (`trading dashboard`) includes an Ecosystem Peers section showing the live status of all connected brains.

## License

[MIT](LICENSE)
