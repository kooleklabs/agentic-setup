const fs = require('node:fs');
const child_process = require('node:child_process');

jest.mock('node:fs');
jest.mock('node:child_process');

const { extractFromFile, wordCount } = require('../extract.js');

describe('wordCount', () => {
  test('counts words separated by whitespace', () => {
    expect(wordCount('hello world')).toBe(2);
  });
  test('collapses multiple whitespace', () => {
    expect(wordCount('a   b\n\nc\td')).toBe(4);
  });
  test('returns 0 for empty/null/undefined', () => {
    expect(wordCount('')).toBe(0);
    expect(wordCount(null)).toBe(0);
    expect(wordCount(undefined)).toBe(0);
  });
  test('trims leading/trailing whitespace', () => {
    expect(wordCount('  hello  ')).toBe(1);
  });
});

describe('extractFromFile', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    fs.existsSync.mockReturnValue(true);
  });

  test('throws when file does not exist', () => {
    fs.existsSync.mockReturnValue(false);
    expect(() => extractFromFile('/nope.md')).toThrow('File not found: /nope.md');
  });

  test('reads .md as UTF-8', () => {
    fs.readFileSync.mockReturnValue('# hello');
    expect(extractFromFile('/x.md')).toBe('# hello');
    expect(fs.readFileSync).toHaveBeenCalledWith('/x.md', 'utf8');
  });

  test('reads .txt as UTF-8', () => {
    fs.readFileSync.mockReturnValue('plain text');
    expect(extractFromFile('/x.txt')).toBe('plain text');
  });

  test('reads extensionless file as UTF-8', () => {
    fs.readFileSync.mockReturnValue('bare');
    expect(extractFromFile('/README')).toBe('bare');
  });

  test('reads unknown extension as UTF-8 fallback', () => {
    fs.readFileSync.mockReturnValue('mystery');
    expect(extractFromFile('/x.zzz')).toBe('mystery');
  });

  test('.docx throws if pandoc missing', () => {
    child_process.spawnSync.mockReturnValueOnce({ stdout: '' });
    expect(() => extractFromFile('/x.docx')).toThrow(/pandoc is required/);
  });

  test('.docx calls pandoc and returns stdout', () => {
    child_process.spawnSync
      .mockReturnValueOnce({ stdout: '/usr/bin/pandoc\n' })
      .mockReturnValueOnce({ status: 0, stdout: 'docx body', stderr: '' });
    expect(extractFromFile('/spec.docx')).toBe('docx body');
    expect(child_process.spawnSync).toHaveBeenNthCalledWith(
      2, 'pandoc', ['/spec.docx', '-t', 'plain'], { encoding: 'utf8' }
    );
  });

  test('.docx throws on pandoc non-zero exit', () => {
    child_process.spawnSync
      .mockReturnValueOnce({ stdout: '/usr/bin/pandoc\n' })
      .mockReturnValueOnce({ status: 1, stdout: '', stderr: 'boom' });
    expect(() => extractFromFile('/spec.docx')).toThrow('pandoc failed: boom');
  });

  test('.pdf throws if pdftotext missing', () => {
    child_process.spawnSync.mockReturnValueOnce({ stdout: '' });
    expect(() => extractFromFile('/x.pdf')).toThrow(/pdftotext is required/);
  });

  test('.pdf calls pdftotext and returns stdout', () => {
    child_process.spawnSync
      .mockReturnValueOnce({ stdout: '/usr/bin/pdftotext\n' })
      .mockReturnValueOnce({ status: 0, stdout: 'pdf body', stderr: '' });
    expect(extractFromFile('/spec.pdf')).toBe('pdf body');
  });
});
