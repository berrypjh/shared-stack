import '@berrypjh/ui-core/css';
import '../src/styles';

import { createElement } from 'react';

import { themes } from '@berrypjh/ui-core';

import type { Preview } from '@storybook/react';
import { INITIAL_VIEWPORTS } from 'storybook/viewport';

import { ThemeProvider } from '../src/theme/ThemeProvider';

const dsViewports = {
  mobile: { name: 'Mobile', styles: { width: '375px', height: '812px' }, type: 'mobile' },
  tablet: { name: 'Tablet', styles: { width: '768px', height: '1024px' }, type: 'tablet' },
  desktop: { name: 'Desktop', styles: { width: '1440px', height: '900px' }, type: 'desktop' },
} as const;

/** `deepSea` 같은 합성어도 읽히도록 띄어 쓴다. demo-web 의 테마 셀렉터와 같은 규칙. */
const themeLabel = (name: string) =>
  name.replace(/([a-z0-9])([A-Z])/g, '$1 $2').replace(/^./, (c) => c.toUpperCase());

/**
 * 토글 목록은 테마 레지스트리에서 만든다. 하드코딩하면 design-tokens 에 테마가 늘어도
 * Storybook 만 조용히 낡는다 — 실제로 7개 중 3개만 보이고 있었다.
 */
const themeItems = themes.map(({ name }) => ({ value: name, title: themeLabel(name) }));

const preview: Preview = {
  parameters: {
    options: {
      // 사이드바 순서. 적지 않으면 알파벳순이라 `Buttons` 가 `Layout` 앞에 온다.
      // Storybook 이 이 파일을 **정적 파싱**해 읽으므로 배열은 반드시 리터럴이어야 한다 —
      // 변수로 빼면 `Unexpected 'sidebarOrder'` 로 빌드가 멈춘다. 목록에 없는 그룹은 뒤에 붙는다.
      storySort: {
        order: [
          'Theme',
          'Components',
          [
            'Layout',
            'Buttons',
            'Inputs',
            'Selection',
            'Form',
            'Data Display',
            'Overlay',
            'Navigation',
          ],
        ],
      },
    },
    controls: {
      expanded: true,
      matchers: {
        color: /(background|color|fill|stroke|shadow)$/i,
        date: /Date$/i,
      },
    },
    viewport: {
      options: { ...dsViewports, ...INITIAL_VIEWPORTS },
    },
  },
  initialGlobals: {
    viewport: { value: 'responsive' },
  },
  tags: ['autodocs'],
  globalTypes: {
    themeMode: {
      name: 'Theme',
      description: 'Theme mode',
      defaultValue: 'light',
      toolbar: {
        icon: 'mirror',
        items: themeItems,
        dynamicTitle: true,
      },
    },
  },
  decorators: [
    (Story, context) => {
      const story = createElement(Story);
      // 시맨틱 토큰이 테마마다 이미 올바른 짝을 갖는다 — dark 만 분기하면 나머지 5개가 틀어진다.
      const content = createElement(
        'div',
        {
          style: {
            padding: '24px',
            boxSizing: 'border-box',
            background: 'var(--ds-background-default)',
            color: 'var(--ds-text-default)',
          },
        },
        story,
      );

      if (context.parameters.disableThemeDecorator === true) {
        return content;
      }

      const mode = context.globals.themeMode;

      return createElement(ThemeProvider, { mode, children: content });
    },
  ],
};

export default preview;
