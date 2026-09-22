import type { RepositorySnapshot } from '../../domain/model';

/** build · serve 시점에 `vite.config.mts` 가 넣은 스냅샷. 브라우저는 이 값을 읽기만 한다. */
export const SNAPSHOT: RepositorySnapshot = __DEVHUB_SNAPSHOT__;
