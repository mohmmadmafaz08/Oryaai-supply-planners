import { type ZodType } from 'zod';
import { DATA_BASE_PATH } from '@/lib/constants';

export class DataFetchError extends Error {
  public readonly fileName: string;

  constructor(fileName: string, message: string) {
    super(message);
    this.name = 'DataFetchError';
    this.fileName = fileName;
  }
}

/**
 * Fetches a JSON dataset file and validates it against a zod schema at the boundary.
 */
export async function fetchValidatedJson<T>(fileName: string, schema: ZodType<T>): Promise<T> {
  const url = `${DATA_BASE_PATH}/${fileName}`;
  const response = await fetch(url, {
    headers: {
      Accept: 'application/json',
    },
  });

  if (!response.ok) {
    throw new DataFetchError(
      fileName,
      `Failed to load ${fileName}: HTTP ${String(response.status)} ${response.statusText}`,
    );
  }

  let rawJson: unknown;
  try {
    rawJson = await response.json();
  } catch (err) {
    const detail = err instanceof Error ? err.message : 'Invalid JSON payload';
    throw new DataFetchError(fileName, `Failed to parse ${fileName}: ${detail}`);
  }

  const parsed = schema.safeParse(rawJson);
  if (!parsed.success) {
    const firstIssue = parsed.error.issues[0];
    const pathLabel = firstIssue ? firstIssue.path.join('.') : 'root';
    const message = firstIssue ? firstIssue.message : 'Schema validation failed';
    throw new DataFetchError(
      fileName,
      `Schema mismatch in ${fileName} at "${pathLabel}": ${message}`,
    );
  }

  return parsed.data;
}
