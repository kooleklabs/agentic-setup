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

class ProgressRenderer {
  constructor() {
    this.start = Date.now();
    this.cwd = process.cwd();
    this.counts = { write: 0, edit: 0, read: 0, bash: 0, other: 0 };
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
  }

  /**
   * Feed a single message from the Agent SDK's async iterator.
   */
  handleMessage(message) {
    if (!message || typeof message !== 'object') return;
    switch (message.type) {
      case 'assistant':
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
