import { IconButton } from '@berrypjh/react-ui';

import { Page, Preview, Section } from '../shell/ui';

const HeartIcon = () => (
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
    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
  </svg>
);

const StarIcon = () => (
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
    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
  </svg>
);

const ShareIcon = () => (
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
    <circle cx="18" cy="5" r="3" />
    <circle cx="6" cy="12" r="3" />
    <circle cx="18" cy="19" r="3" />
    <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
    <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
  </svg>
);

export const IconButtonPage = () => (
  <Page
    title="IconButton"
    lead="아이콘만 포함하는 버튼으로, 일반적이거나 상황에 따른 액션에 사용됩니다."
  >
    <Section title="Size" note="Small, Medium, Large">
      <Preview>
        <IconButton size="sm" aria-label="즐겨찾기 (small)">
          <HeartIcon />
        </IconButton>
        <IconButton size="md" aria-label="즐겨찾기 (medium)">
          <HeartIcon />
        </IconButton>
        <IconButton size="lg" aria-label="즐겨찾기 (large)">
          <HeartIcon />
        </IconButton>
      </Preview>
    </Section>

    <Section title="Colors" note="Primary와 Secondary 컬러">
      <Preview>
        <IconButton color="primary" aria-label="즐겨찾기 (primary)">
          <HeartIcon />
        </IconButton>
        <IconButton color="secondary" aria-label="즐겨찾기 (secondary)">
          <HeartIcon />
        </IconButton>
        <IconButton color="primary" aria-label="별점 주기 (primary)">
          <StarIcon />
        </IconButton>
        <IconButton color="secondary" aria-label="별점 주기 (secondary)">
          <StarIcon />
        </IconButton>
      </Preview>
    </Section>

    <Section title="Loading State">
      <Preview>
        <IconButton loading aria-label="즐겨찾기 저장 중">
          <HeartIcon />
        </IconButton>
        <IconButton loading size="lg" aria-label="별점 저장 중">
          <StarIcon />
        </IconButton>
      </Preview>
    </Section>

    <Section title="Disabled">
      <Preview>
        <IconButton disabled aria-label="즐겨찾기 (비활성)">
          <HeartIcon />
        </IconButton>
        <IconButton disabled aria-label="별점 주기 (비활성)">
          <StarIcon />
        </IconButton>
        <IconButton disabled aria-label="공유 (비활성)">
          <ShareIcon />
        </IconButton>
      </Preview>
    </Section>

    <Section title="Edge Alignment" note="edge='start'와 edge='end'는 각 면의 패딩을 줄입니다">
      <Preview>
        <div style={{ display: 'flex', gap: 4 }}>
          <IconButton edge="start" aria-label="즐겨찾기 (edge start)">
            <HeartIcon />
          </IconButton>
          <IconButton aria-label="별점 주기 (edge 없음)">
            <StarIcon />
          </IconButton>
          <IconButton edge="end" aria-label="공유 (edge end)">
            <ShareIcon />
          </IconButton>
        </div>
      </Preview>
    </Section>
  </Page>
);
