/**
 * Renders Claude Agent SDK messages as live progress lines.
 * Keeps the [mm:ss] timestamp + tool icon aesthetic from the old
 * bash-based stream formatter.
 */

const CYAN = '\x1b[0;36m';
const GREEN = '\x1b[0;32m';
const YELLOW = '\x1b[1;33m';
const DIM = '\x1b[2m';
const BOLD = '\x1b[1m';
const NC = '\x1b[0m';

// Claude pricing (USD per million tokens). Sonnet 4.6 default.
// Override via CLAUDE_PRICE_INPUT / CLAUDE_PRICE_OUTPUT env vars if you
// run on a different model / plan.
const DEFAULT_PRICES = {
  // {input, output, cache_write, cache_read} — all USD per MTok.
  'claude-sonnet-4-6': { input: 3, output: 15, cache_write: 3.75, cache_read: 0.3 },
  'claude-opus-4-6':   { input: 15, output: 75, cache_write: 18.75, cache_read: 1.5 },
  'claude-haiku-4-5':  { input: 0.8, output: 4, cache_write: 1, cache_read: 0.08 },
  default:             { input: 3, output: 15, cache_write: 3.75, cache_read: 0.3 },
};

function resolvePrices(model) {
  const envIn = Number(process.env.CLAUDE_PRICE_INPUT);
  const envOut = Number(process.env.CLAUDE_PRICE_OUTPUT);
  if (Number.isFinite(envIn) && Number.isFinite(envOut)) {
    return { input: envIn, output: envOut, cache_write: envIn * 1.25, cache_read: envIn * 0.1 };
  }
  const key = (model || '').toLowerCase();
  for (const [k, v] of Object.entries(DEFAULT_PRICES)) {
    if (k !== 'default' && key.includes(k.replace('claude-', '').replace(/-/g, ''))) return v;
    if (key.includes(k)) return v;
  }
  return DEFAULT_PRICES.default;
}

class ProgressRenderer {
  constructor() {
    this.start = Date.now();
    this.cwd = process.cwd();
    this.counts = { write: 0, edit: 0, read: 0, bash: 0, other: 0 };
    this.usage = {
      input: 0,
      output: 0,
      cache_write: 0,
      cache_read: 0,
      model: null,
    };
  }

  trackUsage(message) {
    const u = message?.message?.usage;
    if (!u || typeof u !== 'object') return;
    this.usage.input += u.input_tokens || 0;
    this.usage.output += u.output_tokens || 0;
    this.usage.cache_write += u.cache_creation_input_tokens || 0;
    this.usage.cache_read += u.cache_read_input_tokens || 0;
    if (!this.usage.model && message.message?.model) {
      this.usage.model = message.message.model;
    }
  }

  computeCost() {
    const p = resolvePrices(this.usage.model);
    const cost =
      (this.usage.input * p.input +
        this.usage.output * p.output +
        this.usage.cache_write * p.cache_write +
        this.usage.cache_read * p.cache_read) /
      1_000_000;
    return { cost, prices: p };
  }

  formatTokens(n) {
    if (n >= 1_000_000) return (n / 1_000_000).toFixed(2) + 'M';
    if (n >= 1_000) return (n / 1_000).toFixed(1) + 'K';
    return String(n);
  }

  formatUsd(n) {
    if (n < 0.01) return '<$0.01';
    if (n < 1) return `$${n.toFixed(3)}`;
    return `$${n.toFixed(2)}`;
  }

  elapsed() {
    const s = Math.floor((Date.now() - this.start) / 1000);
    const m = Math.floor(s / 60);
    return `${String(m).padStart(2, ' ')}:${String(s % 60).padStart(2, '0')}`;
  }

  tag() {
    return `${DIM}[${this.elapsed()}]${NC}`;
  }

  rel(p) {
    if (!p) return '';
    if (typeof p !== 'string') return String(p);
    if (p.startsWith(this.cwd + '/')) return p.slice(this.cwd.length + 1);
    if (p === this.cwd) return '.';
    return p;
  }

  truncate(str, max) {
    if (!str) return '';
    const oneLine = String(str).split('\n')[0].replace(/\s+/g, ' ').trim();
    return oneLine.length > max ? oneLine.slice(0, max - 1) + '…' : oneLine;
  }

  handleToolUse(block) {
    const name = block.name;
    const input = block.input || {};
    switch (name) {
      case 'Write':
        this.counts.write++;
        console.log(`${this.tag()} ${GREEN}→ Write${NC} ${this.rel(input.file_path)}`);
        break;
      case 'Edit':
      case 'MultiEdit':
        this.counts.edit++;
        console.log(`${this.tag()} ${GREEN}→ Edit${NC}  ${this.rel(input.file_path)}`);
        break;
      case 'Read':
        this.counts.read++;
        console.log(`${this.tag()} ${DIM}→ Read  ${this.rel(input.file_path)}${NC}`);
        break;
      case 'Bash':
        this.counts.bash++;
        console.log(`${this.tag()} ${YELLOW}→ Bash${NC}  ${this.truncate(input.command, 70)}`);
        break;
      case 'Glob':
        console.log(`${this.tag()} ${DIM}→ Glob  ${input.pattern || ''}${NC}`);
        break;
      case 'Grep':
        console.log(`${this.tag()} ${DIM}→ Grep  ${input.pattern || ''}${NC}`);
        break;
      case 'TodoWrite':
        // Internal planning noise — suppressed.
        break;
      default:
        this.counts.other++;
        console.log(`${this.tag()} ${DIM}→ ${name}${NC}`);
    }
  }

  handleAssistant(message) {
    const blocks = message?.content;
    if (!Array.isArray(blocks)) return;
    for (const block of blocks) {
      if (!block || typeof block !== 'object') continue;
      if (block.type === 'tool_use') {
        this.handleToolUse(block);
      } else if (block.type === 'text' && block.text) {
        const line = this.truncate(block.text, 90);
        if (line) console.log(`${this.tag()} ${CYAN}${line}${NC}`);
      }
    }
  }

  handleResult(ev) {
    const durS = Math.round((ev.duration_ms ?? Date.now() - this.start) / 1000);
    const m = Math.floor(durS / 60);
    const s = durS % 60;
    const human = m > 0 ? `${m}m ${s}s` : `${s}s`;
    const ok = ev.subtype === 'success';
    const c = this.counts;
    const summary = [
      c.write && `${c.write} written`,
      c.edit && `${c.edit} edited`,
      c.read && `${c.read} read`,
      c.bash && `${c.bash} bash`,
    ]
      .filter(Boolean)
      .join(', ');

    console.log('');
    if (ok) {
      console.log(
        `  ${GREEN}${BOLD}✓ Generation complete${NC} — ${summary || 'no file changes'} in ${human}`
      );
    } else {
      console.log(
        `  ${YELLOW}⚠ Finished with issues${NC} (${ev.subtype || 'unknown'}) — ${summary || 'no file changes'} in ${human}`
      );
    }
    this.renderUsage();
  }

  renderUsage() {
    const u = this.usage;
    const total = u.input + u.output + u.cache_write + u.cache_read;
    if (total === 0) return;
    const { cost } = this.computeCost();
    const model = u.model ? u.model.replace(/^claude-/, '') : 'default-pricing';
    const bits = [
      `in ${this.formatTokens(u.input)}`,
      `out ${this.formatTokens(u.output)}`,
    ];
    if (u.cache_write) bits.push(`cache+${this.formatTokens(u.cache_write)}`);
    if (u.cache_read) bits.push(`cache→${this.formatTokens(u.cache_read)}`);
    console.log(
      `  ${DIM}${bits.join('  ')}  ·  ~${this.formatUsd(cost)} (${model})${NC}`
    );
  }

  /**
   * Feed a single message from the Agent SDK's async iterator.
   */
  handleMessage(message) {
    if (!message || typeof message !== 'object') return;
    switch (message.type) {
      case 'assistant':
        this.trackUsage(message);
        this.handleAssistant(message.message || message);
        break;
      case 'result':
        this.handleResult(message);
        break;
      // system / user / partial — intentionally ignored
    }
  }
}

module.exports = { ProgressRenderer };
