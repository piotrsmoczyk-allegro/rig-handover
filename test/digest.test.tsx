import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { createApp } from '../src/app.js';

const GOOD = '2026-01-01';
const EMPTY = '2026-01-02';
const BAD = '2026-01-03';
const MISSING = '2026-01-04';

const line = (at: string, job: string, status: string, extra: Record<string, unknown> = {}) =>
  JSON.stringify({ at, job, status, owner: 'rook', ...extra });

let runsDir: string;

function app() {
  return createApp({
    adapter: 'shim',
    installed: '2026-10-29T14:06:00+01:00',
    beatEverySeconds: 60,
    runsDir,
  });
}

beforeAll(() => {
  runsDir = fs.mkdtempSync(path.join(os.tmpdir(), 'rig-digest-'));

  fs.writeFileSync(
    path.join(runsDir, `${GOOD}.jsonl`),
    [
      line('2026-01-01T23:00:02+01:00', 'lane/sync', 'ok'),
      line('2026-01-01T23:05:00+01:00', 'lane/heartbeat', 'ok', { owner: null }),
      line('2026-01-01T23:10:00+01:00', 'lane/digest', 'retry', { error: 'timeout' }),
      line('2026-01-01T23:11:00+01:00', 'lane/digest', 'retry', { error: 'timeout' }),
      line('2026-01-01T23:12:00+01:00', 'lane/digest', 'fail', { error: 'disk full' }),
      '',
    ].join('\n'),
  );

  fs.writeFileSync(path.join(runsDir, `${EMPTY}.jsonl`), '');

  fs.writeFileSync(
    path.join(runsDir, `${BAD}.jsonl`),
    [
      line('2026-01-03T23:00:02+01:00', 'lane/sync', 'ok'),
      '{"at":"2026-01-03T23:05:00+01:00","job":"lane/sy',
      line('2026-01-03T23:10:00+01:00', 'lane/digest', 'fail', { error: 'disk full' }),
      '',
    ].join('\n'),
  );
});

afterAll(() => {
  fs.rmSync(runsDir, { recursive: true, force: true });
});

describe('digest page', () => {
  it('renders one row per job for a good night', async () => {
    const res = await app().request(`/digest/${GOOD}`);
    const html = await res.text();
    expect(res.status).toBe(200);
    expect(html).toContain('lane/sync');
    expect(html).toContain('lane/heartbeat');
    expect(html).toContain('lane/digest');
  });

  it('answers 404 for a night with no file', async () => {
    const res = await app().request(`/digest/${MISSING}`);
    expect(res.status).toBe(404);
  });

  it('says nothing ran for the empty night', async () => {
    const res = await app().request(`/digest/${EMPTY}`);
    const html = await res.text();
    expect(res.status).toBe(200);
    expect(html).toContain('nothing ran');
  });

  it('keeps the valid jobs and counts the bad line', async () => {
    const res = await app().request(`/digest/${BAD}`);
    const html = await res.text();
    expect(res.status).toBe(200);
    expect(html).toContain('lane/sync');
    expect(html).toContain('lane/digest');
    expect(html).toContain('1 line could not be read');
  });
});

describe('digest JSON', () => {
  it('returns rows sorted by job for a good night', async () => {
    const res = await app().request(`/api/digest/${GOOD}`);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.night).toBe(GOOD);
    expect(body.rows.map((r: { job: string }) => r.job)).toEqual([
      'lane/digest',
      'lane/heartbeat',
      'lane/sync',
    ]);
    expect(body.badLines).toBe(0);
    expect(body.counts).toEqual({ ok: 2, retry: 2, fail: 1 });
  });

  it('answers 404 for a night with no file', async () => {
    const res = await app().request(`/api/digest/${MISSING}`);
    expect(res.status).toBe(404);
  });

  it('returns no rows and zero bad lines for the empty night', async () => {
    const res = await app().request(`/api/digest/${EMPTY}`);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.rows).toEqual([]);
    expect(body.badLines).toBe(0);
  });

  it('counts the bad line and keeps the valid jobs', async () => {
    const res = await app().request(`/api/digest/${BAD}`);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.badLines).toBe(1);
    expect(body.rows.map((r: { job: string }) => r.job)).toEqual(['lane/digest', 'lane/sync']);
  });
});
