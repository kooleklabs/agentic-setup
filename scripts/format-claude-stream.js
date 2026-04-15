#!/usr/bin/env node
/**
 * Parses Claude Code's `--output-format stream-json` and prints
 * human-friendly progress in real time.
 *
 * Line-delimited JSON in on stdin → formatted progress out on stdout.
 * Unknown event types are ignored so the stream never breaks.
 */

const CYAN = '\x1b[0;36m';
const GREEN = '\x1b[0;32m';
const YELLOW = '\x1b[1;33m';
const DIM = '\x1b[2m';
const BOLD = '\x1b[1m';
const NC = '\x1b[0m';

const start = Date.now();
const cwd = process.cwd();

let writes = 0;
let edits = 0;
let reads = 0;
let bashCalls = 0;

function elapsed() {
  const s = Math.floor((Date.now() - start) / 1000);
  const m = Math.floor(s / 60);
  return `${String(m).padStart(2, ' ')}:${String(s % 60).padStart(2, '0')}`;
}

function tag() {
  return `${DIM}[${elapsed()}]${NC}`;
}

function rel(p) {
  if (!p) return '';
  if (p.startsWith(cwd + '/')) return p.slice(cwd.length + 1);
  if (p === cwd) return '.';
  return p;
}

function truncate(str, max) {
  if (!str) return '';
  const oneLine = str.split('\n')[0].replace(/\s+/g, ' ').trim();
  return oneLine.length > max ? oneLine.slice(0, max - 1) + '…' : oneLine;
}

function handleToolUse(tu) {
  const name = tu.name;
  const input = tu.input || {};
  switch (name) {
    case 'Write':
      writes++;
      console.log(`${tag()} ${GREEN}→ Write${NC} ${rel(input.file_path)}`);
      break;
    case 'Edit':
    case 'MultiEdit':
      edits++;
      console.log(`${tag()} ${GREEN}→ Edit${NC}  ${rel(input.file_path)}`);
      break;
    case 'Read':
      reads++;
      console.log(`${tag()} ${DIM}→ Read  ${rel(input.file_path)}${NC}`);
      break;
    case 'Bash':
      bashCalls++;
      console.log(`${tag()} ${YELLOW}→ Bash${NC}  ${truncate(input.command, 70)}`);
      break;
    case 'Glob':
      console.log(`${tag()} ${DIM}→ Glob  ${input.pattern || ''}${NC}`);
      break;
    case 'Grep':
      console.log(`${tag()} ${DIM}→ Grep  ${input.pattern || ''}${NC}`);
      break;
    case 'TodoWrite':
      // Skip — internal planning noise.
      break;
    default:
      console.log(`${tag()} ${DIM}→ ${name}${NC}`);
  }
}

function handleEvent(ev) {
  if (ev.type === 'assistant' && ev.message?.content) {
    for (const block of ev.message.content) {
      if (block.type === 'tool_use') {
        handleToolUse(block);
      } else if (block.type === 'text' && block.text) {
        const line = truncate(block.text, 90);
        if (line) console.log(`${tag()} ${CYAN}${line}${NC}`);
      }
    }
    return;
  }

  if (ev.type === 'result') {
    const durS = Math.round((ev.duration_ms || Date.now() - start) / 1000);
    const m = Math.floor(durS / 60);
    const s = durS % 60;
    const human = m > 0 ? `${m}m ${s}s` : `${s}s`;
    const ok = ev.subtype === 'success';
    const summary = [
      writes && `${writes} written`,
      edits && `${edits} edited`,
      reads && `${reads} read`,
      bashCalls && `${bashCalls} bash`,
    ].filter(Boolean).join(', ');

    console.log('');
    if (ok) {
      console.log(`  ${GREEN}${BOLD}✓ Generation complete${NC} — ${summary || 'no file changes'} in ${human}`);
    } else {
      console.log(`  ${YELLOW}⚠ Finished with issues${NC} (${ev.subtype || 'unknown'}) — ${summary || 'no file changes'} in ${human}`);
    }
    return;
  }

  // system, user, rate_limit_event, etc. — intentionally ignored.
}

process.stdin.setEncoding('utf8');
let buf = '';

process.stdin.on('data', (chunk) => {
  buf += chunk;
  let nl;
  while ((nl = buf.indexOf('\n')) !== -1) {
    const line = buf.slice(0, nl).trim();
    buf = buf.slice(nl + 1);
    if (!line) continue;
    try {
      handleEvent(JSON.parse(line));
    } catch {
      // Not JSON — skip. Sometimes claude prints a plain line on error.
    }
  }
});

process.stdin.on('end', () => {
  // Flush any final buffered content that lacked a trailing newline.
  const tail = buf.trim();
  if (tail) {
    try { handleEvent(JSON.parse(tail)); } catch {}
  }
});
