import type { Catalog } from '../domain/model';

import { applications } from './applications';
import { documents } from './documents';
import { contexts, journeys } from './journeys';
import { packages } from './packages';
import { records } from './records';
import { relations } from './relations';
import { repository } from './repository';
import { tests } from './tests';
import { tools } from './tools';

/** 사람이 쓴 저장소 사실. 화면 코드는 읽기만 한다. */
export const catalog: Catalog = {
  repository,
  applications,
  packages,
  tools,
  relations,
  documents,
  records,
  tests,
  contexts,
  journeys,
};
