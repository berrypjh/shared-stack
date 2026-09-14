/** 브라우저 API 는 없거나, getter 가 던지거나, promise 가 거절될 수 있다. 모든 읽기를 여기로 감싼다. */

export type Attempt<T> = { ok: true; value: T } | { ok: false; error: string; name: string | null };

const MAX_ERROR = 200;

const failure = (error: unknown): { ok: false; error: string; name: string | null } => {
  const name =
    typeof error === 'object' &&
    error !== null &&
    typeof (error as { name?: unknown }).name === 'string'
      ? (error as { name: string }).name
      : null;
  const text = error instanceof Error ? `${error.name}: ${error.message}` : (name ?? String(error));
  return { ok: false, error: text.slice(0, MAX_ERROR), name };
};

export const attempt = <T>(read: () => T): Attempt<T> => {
  try {
    return { ok: true, value: read() };
  } catch (error) {
    return failure(error);
  }
};

export const attemptAsync = async <T>(read: () => Promise<T>): Promise<Attempt<T>> => {
  try {
    return { ok: true, value: await read() };
  } catch (error) {
    return failure(error);
  }
};

/** 읽기 결과만 필요할 때. 던지면 undefined 다. */
export const peek = <T>(read: () => T): T | undefined => {
  const result = attempt(read);
  return result.ok ? result.value : undefined;
};

/** 사용자·정책이 거절한 오류 이름. 다른 오류와 달리 권한 필요로 보여준다. */
export const isPermissionName = (name: string | null) =>
  name === 'NotAllowedError' || name === 'SecurityError';
