import { Fab } from '@berrypjh/react-ui';

import { Page, Preview, Section } from '../shell/ui';

const PlusIcon = () => (
  <svg
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.5"
    strokeLinecap="round"
  >
    <line x1="12" y1="5" x2="12" y2="19" />
    <line x1="5" y1="12" x2="19" y2="12" />
  </svg>
);

const EditIcon = () => (
  <svg
    width="18"
    height="18"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
  </svg>
);

export const FabPage = () => (
  <Page title="FAB" lead="화면의 주된 액션을 표현하는 버튼">
    <Section title="Shapes" note="원형과 확장형">
      <Preview>
        <Fab shape="circular" icon={<PlusIcon />} aria-label="추가 (circular)" />
        <Fab shape="extended" icon={<PlusIcon />}>
          Create New
        </Fab>
      </Preview>
    </Section>

    <Section title="Sizes" note="Small, Medium, Large">
      <Preview>
        <Fab size="sm" shape="circular" icon={<PlusIcon />} aria-label="추가 (small)" />
        <Fab size="md" shape="circular" icon={<PlusIcon />} aria-label="추가 (medium)" />
        <Fab size="lg" shape="circular" icon={<PlusIcon />} aria-label="추가 (large)" />
      </Preview>
    </Section>

    <Section title="Colors" note="Primary와 Secondary 컬러">
      <Preview>
        <Fab color="primary" icon={<PlusIcon />} aria-label="추가 (primary)" />
        <Fab color="secondary" icon={<PlusIcon />} aria-label="추가 (secondary)" />
        <Fab color="primary" shape="extended" icon={<EditIcon />}>
          Edit
        </Fab>
        <Fab color="secondary" shape="extended" icon={<EditIcon />}>
          Edit
        </Fab>
      </Preview>
    </Section>

    <Section title="Disabled">
      <Preview>
        <Fab disabled icon={<PlusIcon />} aria-label="추가 (비활성)" />
        <Fab disabled shape="extended" icon={<PlusIcon />}>
          Disabled
        </Fab>
      </Preview>
    </Section>
  </Page>
);
