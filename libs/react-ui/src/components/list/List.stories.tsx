import type { Meta, StoryObj } from '@storybook/react-vite';
import type { CSSProperties } from 'react';

import { ThemeGallery, themeGalleryParameters } from '../../../.storybook/ThemeGallery';

import { List } from './List';
import { ListItem } from './ListItem';

/**
 * `List`·`ListItem` 은 **semantic HTML helper** 다 — `<ul>`/`<ol>` 과 `<li>` 에 토큰 여백과
 * 마커 정책을 붙이는 것이 전부다.
 *
 * hover·selected 스토리가 없다 — 그런 API 가 없다. 목록 항목이 눌려야 하면 소비자가 `<a>`/
 * `<button>` 을 자식으로 넣고, 그 시각은 그 control 이 소유한다 (`WithInteractiveChildren`).
 */
const meta = {
  title: 'Components/Data Display/List',
  component: List,
  tags: ['autodocs'],
  parameters: {
    layout: 'padded',
  },
  argTypes: {
    ordered: { control: 'boolean' },
    marker: { control: 'boolean' },
    children: { control: false },
    className: { control: false },
    ref: { control: false },
  },
} satisfies Meta<typeof List>;

export default meta;

type Story = StoryObj<typeof meta>;

const FRAME = { maxWidth: '360px' } as const;

/**
 * 간격 훅.
 *
 * `--ui-list-gap` 기본값은 `0` 이다 — 저장소의 실제 목록들이 항목을 테두리로 가르고 간격은
 * 0 이라서, 기본으로 여백을 밀어 넣으면 그것을 되돌려야 한다. 여백이 필요한 쪽이 켠다.
 */
const gapStyle = { '--ui-list-gap': 'var(--ds-spacing-xs)' } as CSSProperties;

const linkStyle = {
  color: 'var(--ds-text-link)',
  textDecoration: 'none',
} as const;

export const Unordered: Story = {
  args: {
    style: gapStyle,
    children: (
      <>
        <ListItem>디자인 토큰</ListItem>
        <ListItem>컴포넌트 라이브러리</ListItem>
        <ListItem>접근성 검증</ListItem>
      </>
    ),
  },
};

/** 순서가 의미를 갖는 목록만 `ordered` 를 켠다. 마커를 함께 보이는 것이 보통이다. */
export const Ordered: Story = {
  args: {
    ordered: true,
    marker: true,
    style: gapStyle,
    children: (
      <>
        <ListItem>토큰을 빌드한다</ListItem>
        <ListItem>컴포넌트를 구현한다</ListItem>
        <ListItem>접근성을 검증한다</ListItem>
      </>
    ),
  },
};

/**
 * 마커 정책은 **시각 결정**이다.
 *
 * 마커를 지워도 목록이라는 시맨틱은 남는다 — `list-style: none` 이 WebKit 에서 목록 역할을
 * 지우기 때문에 그 경우에만 `role="list"` 로 복구한다.
 */
export const WithMarkers: Story = {
  args: {
    marker: true,
    children: (
      <>
        <ListItem>마커가 보인다</ListItem>
        <ListItem>native list-style 을 되살린 것이다</ListItem>
      </>
    ),
  },
};

/** 중첩 목록은 상위 `<li>` 안에 둔다 — 그것이 유효한 HTML 이다. */
export const Nested: Story = {
  args: {
    marker: true,
    style: gapStyle,
    children: (
      <>
        <ListItem>
          Foundation
          <List marker>
            <ListItem>design-tokens</ListItem>
            <ListItem>ui-core</ListItem>
          </List>
        </ListItem>
        <ListItem>
          Renderers
          <List marker>
            <ListItem>react-ui</ListItem>
            <ListItem>
              react-native-ui
              <List marker>
                <ListItem>generic List 없음 (FlatList 사용)</ListItem>
              </List>
            </ListItem>
          </List>
        </ListItem>
      </>
    ),
  },
};

/**
 * 상호작용은 **자식이 가진다.**
 *
 * `ListItem` 에 `onClick` 이 없다 — native control 을 넣으면 키보드·포커스·disabled 를 브라우저가
 * 이미 옳게 한다. 탭 순서도 `<li>` 가 아니라 링크·버튼이 가진다.
 */
export const WithInteractiveChildren: Story = {
  args: {
    style: gapStyle,
    children: (
      <>
        <ListItem>
          <a href="#tokens" style={linkStyle}>
            토큰 보기
          </a>
        </ListItem>
        <ListItem>
          <a href="#components" style={linkStyle}>
            컴포넌트 보기
          </a>
        </ListItem>
        <ListItem>
          <button type="button">다시 빌드</button>
        </ListItem>
      </>
    ),
  },
};

/** 긴 내용은 줄바꿈되고 목록이 컨테이너를 밀어내지 않는다. */
export const LongContent: Story = {
  args: {
    marker: true,
    style: gapStyle,
    children: (
      <>
        <ListItem>
          아주 긴 항목입니다. 바깥 마커를 유지하기 때문에 둘째 줄이 마커 아래로 흐르지 않고 글자
          기준선에 맞춰 정렬됩니다.
        </ListItem>
        <ListItem>짧은 항목</ListItem>
      </>
    ),
  },
  decorators: [
    (Story) => (
      <div style={FRAME}>
        <Story />
      </div>
    ),
  ],
};

export const ThemeMatrix: Story = {
  parameters: themeGalleryParameters,
  render: () => (
    <ThemeGallery>
      {() => (
        <List marker>
          <ListItem>디자인 토큰</ListItem>
          <ListItem>
            컴포넌트
            <List>
              <ListItem>
                <a href="#x" style={linkStyle}>
                  링크 자식
                </a>
              </ListItem>
            </List>
          </ListItem>
        </List>
      )}
    </ThemeGallery>
  ),
};
