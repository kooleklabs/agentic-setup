/**
 * Extract plain-text requirement content from a file.
 * Supports: .md, .txt, .docx (pandoc), .pdf (pdftotext).
 */

const fs = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

function which(cmd) {
  const r = spawnSync('bash', ['-lc', `command -v ${cmd} || true`], { encoding: 'utf8' });
  return (r.stdout || '').trim();
}

function extractFromFile(filePath) {
  if (!fs.existsSync(filePath)) {
    throw new Error(`File not found: ${filePath}`);
  }

  const ext = path.extname(filePath).toLowerCase();

  switch (ext) {
    case '.md':
    case '.txt':
    case '':
      return fs.readFileSync(filePath, 'utf8');

    case '.docx': {
      if (!which('pandoc')) {
        throw new Error(
          'pandoc is required to read .docx files but was not found on PATH.\n' +
            'Install: brew install pandoc   (macOS)\n' +
            '         apt-get install pandoc (Debian/Ubuntu)'
        );
      }
      const r = spawnSync('pandoc', [filePath, '-t', 'plain'], { encoding: 'utf8' });
      if (r.status !== 0) throw new Error(`pandoc failed: ${r.stderr}`);
      return r.stdout;
    }

    case '.pdf': {
      if (!which('pdftotext')) {
        throw new Error(
          'pdftotext is required to read .pdf files but was not found on PATH.\n' +
            'Install: brew install poppler   (macOS)\n' +
            '         apt-get install poppler-utils (Debian/Ubuntu)'
        );
      }
      const r = spawnSync('pdftotext', [filePath, '-'], { encoding: 'utf8' });
      if (r.status !== 0) throw new Error(`pdftotext failed: ${r.stderr}`);
      return r.stdout;
    }

    default:
      // Unknown extension — try reading as text.
      return fs.readFileSync(filePath, 'utf8');
  }
}

function wordCount(str) {
  return (str || '').trim().split(/\s+/).filter(Boolean).length;
}

module.exports = { extractFromFile, wordCount };
