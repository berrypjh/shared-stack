import { DesignerWorkspace } from '../designer/DesignerWorkspace';
import { Page } from '../shell/ui';

import type { WebPresentation } from './registry';

/** 컴포넌트 페이지. 제목 아래에 Designer 영역(Canvas · Matrix · Inspector)만 그린다. */
export const DeveloperComponentPage = ({ presentation }: { presentation: WebPresentation }) => (
  <Page title={presentation.data.label} lead={presentation.data.lead}>
    <DesignerWorkspace presentation={presentation} />
  </Page>
);
