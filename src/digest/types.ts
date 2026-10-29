// Plan morning-digest § 1. The reader is `readNight` in `src/digest/read.ts`; import it from there.

export type RunStatus = 'ok' | 'retry' | 'fail';

export type DigestRow = {
  job: string;
  owner: string | null;
  /** Lines for this job in the night, whatever their status. */
  runs: number;
  /** Lines for this job with status `retry`. */
  retries: number;
  /** Status of the job's latest line. */
  lastStatus: RunStatus;
  /** Error of the latest line for this job that has one, else null. */
  lastError: string | null;
  /** `at` of the job's first and latest line, exactly as in the log (offset kept). */
  firstAt: string;
  lastAt: string;
};

export type Night = {
  night: string;
  /** One row per job, sorted by job. The page and the JSON both use this order. */
  rows: DigestRow[];
  /** Lines that could not be read (bad JSON or missing fields). Never thrown. */
  badLines: number;
  /** Runs (lines) of the night by status. */
  counts: Record<RunStatus, number>;
};

/** `night` is `YYYY-MM-DD`. Returns null when `<runsDir>/<night>.jsonl` does not exist; an empty file gives a Night with no rows. */
export type ReadNight = (runsDir: string, night: string) => Night | null;
