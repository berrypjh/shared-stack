import type { Journey } from '../../domain/model';

import { release } from './release';

export { contexts } from './contexts';

/** 저장소가 증명하는 흐름. */
export const journeys: Journey[] = [release];
