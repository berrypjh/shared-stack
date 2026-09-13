import { iconButtonPresentation } from '../presentation/components/iconButton';
import { DeveloperComponentPage } from '../presentation/DeveloperComponentPage';

/**
 * example 목록은 이 파일에 없다 — `presentation/components/iconButton` 가 유일한 source 다.
 * Developer View 와 Designer View 가 같은 scenario 를 읽기 위한 것이다.
 */
export const IconButtonPage = () => (
  <DeveloperComponentPage presentation={iconButtonPresentation} />
);
