import { createElement } from 'react';

import type { Preview } from '@storybook/react';
import { INITIAL_VIEWPORTS } from 'storybook/viewport';

import type { ThemeMode } from '../src/theme/theme';

import { StoryRouter } from './StoryRouter';
import { DS_VIEWPORTS } from './viewports';

import './preview.css';
import '@berrypjh/react-ui/styles.css';

const preview: Preview = {
  parameters: {
    options: {
      storySort: {
        order: [
          'Theme',
          'Shell',
          'Navigation',
          'Canvas',
          'Chart',
          'Data Display',
          'Doc',
          'Entity',
          'Icon',
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
      options: { ...DS_VIEWPORTS, ...INITIAL_VIEWPORTS },
    },
  },
  initialGlobals: {
    viewport: { value: 'responsive' },
  },
  tags: ['autodocs'],
  globalTypes: {
    themeMode: {
      name: 'Theme',
      description: 'light / dark (devhub-ui 는 이 둘만 쓴다)',
      defaultValue: 'light',
      toolbar: {
        icon: 'mirror',
        items: [
          { value: 'light', title: 'Light' },
          { value: 'dark', title: 'Dark' },
        ],
        dynamicTitle: true,
      },
    },
  },
  decorators: [
    (Story, context) => {
      // ThemeSwitch 가 읽고 쓰는 것과 같은 자리(`<html data-theme>`)를 이야기가 직접 맞춘다.
      const mode = context.globals.themeMode as ThemeMode;
      document.documentElement.dataset.theme = mode;

      const story = createElement(
        'div',
        {
          style: {
            padding: '24px',
            boxSizing: 'border-box',
            background: 'var(--ds-background-default)',
            color: 'var(--ds-text-default)',
          },
        },
        createElement(Story),
      );

      // DevHubProvider 없이 셸 조각을 보일 때만(예: 순수 함수 결과) 끈다.
      if (context.parameters.disableRouterDecorator === true) return story;
      const routerProps = (context.parameters.router ?? {}) as Omit<
        Parameters<typeof StoryRouter>[0],
        'children'
      >;
      return createElement(StoryRouter, { ...routerProps, children: story });
    },
  ],
};

export default preview;
