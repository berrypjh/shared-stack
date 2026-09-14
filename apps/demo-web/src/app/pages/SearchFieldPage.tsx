import { searchFieldPresentation } from '../presentation/components/searchField';
import { DeveloperComponentPage } from '../presentation/DeveloperComponentPage';

/**
 * example 목록은 이 파일에 없다 — `presentation/components/searchField` 가 유일한 source 다. */
export const SearchFieldPage = () => (
  <DeveloperComponentPage presentation={searchFieldPresentation} />
);
