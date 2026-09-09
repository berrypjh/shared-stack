import { screen, within } from '@testing-library/react';
import type { ReactNode, Ref } from 'react';
import { describe, expect, it } from 'vitest';

import { createRenderer, describeConformance } from '../../../test';

import { IconButton } from './IconButton';
import { iconButtonClasses } from './IconButton.constants';
import type { IconButtonRenderableProps } from './IconButton.types';

describe('<IconButton />', () => {
  const { render } = createRenderer();

  describeConformance(
    <IconButton aria-label="bookmark">
      <span aria-hidden="true">★</span>
    </IconButton>,
    () => ({
      render,
      classes: iconButtonClasses,
      refInstanceof: HTMLButtonElement,
      polymorphicPropName: 'component',
      testPolymorphicPropWith: 'a',
    }),
  );

  describe('root', () => {
    it('children을 렌더링해야 한다', () => {
      render(
        <IconButton aria-label="bookmark">
          <span data-testid="icon">★</span>
        </IconButton>,
      );

      const button = screen.getByRole('button', { name: 'bookmark' });

      expect(button).toHaveClass(iconButtonClasses.root);
      expect(screen.getByTestId('icon')).toBeInTheDocument();
    });

    it('href가 제공되면 링크로 렌더링해야 한다', () => {
      render(
        <IconButton href="/docs" aria-label="docs">
          <span aria-hidden="true">D</span>
        </IconButton>,
      );

      expect(screen.getByRole('link', { name: 'docs' })).toHaveAttribute('href', '/docs');
    });
  });

  describe('접근 가능한 이름', () => {
    it('aria-label이 접근 가능한 이름이 되어야 한다', () => {
      render(
        <IconButton aria-label="즐겨찾기에 추가">
          <span aria-hidden="true">★</span>
        </IconButton>,
      );

      expect(screen.getByRole('button', { name: '즐겨찾기에 추가' })).toBeInTheDocument();
    });

    it('aria-labelledby가 참조하는 텍스트가 접근 가능한 이름이 되어야 한다', () => {
      render(
        <>
          <span id="fav-label">즐겨찾기에 추가</span>
          <IconButton aria-labelledby="fav-label">
            <span aria-hidden="true">★</span>
          </IconButton>
        </>,
      );

      expect(screen.getByRole('button', { name: '즐겨찾기에 추가' })).toBeInTheDocument();
    });

    it('보이지 않는 요소를 참조해도 이름이 만들어져야 한다', () => {
      render(
        <>
          <span id="hidden-label" hidden>
            공유
          </span>
          <IconButton aria-labelledby="hidden-label">
            <span aria-hidden="true">↗</span>
          </IconButton>
        </>,
      );

      expect(screen.getByRole('button', { name: '공유' })).toBeInTheDocument();
    });

    it('loading 중에도 aria-labelledby로 만든 이름이 유지되어야 한다', () => {
      render(
        <>
          <span id="save-label">저장</span>
          <IconButton aria-labelledby="save-label" loading>
            <span aria-hidden="true">⚙</span>
          </IconButton>
        </>,
      );

      const button = screen.getByRole('button', { name: '저장' });

      expect(button).toBeDisabled();
      expect(within(button).getByRole('progressbar')).toBeInTheDocument();
    });
  });

  describe('prop: size', () => {
    it('sm size class를 적용해야 한다', () => {
      render(
        <IconButton size="sm" aria-label="small">
          <span aria-hidden="true">S</span>
        </IconButton>,
      );

      expect(screen.getByRole('button', { name: 'small' })).toHaveClass(iconButtonClasses.sizeSm);
    });

    it('기본적으로 md size class를 적용해야 한다', () => {
      render(
        <IconButton aria-label="medium">
          <span aria-hidden="true">M</span>
        </IconButton>,
      );

      expect(screen.getByRole('button', { name: 'medium' })).toHaveClass(iconButtonClasses.sizeMd);
    });

    it('lg size class를 적용해야 한다', () => {
      render(
        <IconButton size="lg" aria-label="large">
          <span aria-hidden="true">L</span>
        </IconButton>,
      );

      expect(screen.getByRole('button', { name: 'large' })).toHaveClass(iconButtonClasses.sizeLg);
    });
  });

  describe('prop: edge', () => {
    it('edge="start" class를 적용해야 한다', () => {
      render(
        <IconButton edge="start" aria-label="back">
          <span aria-hidden="true">←</span>
        </IconButton>,
      );

      expect(screen.getByRole('button', { name: 'back' })).toHaveClass(iconButtonClasses.edgeStart);
    });

    it('edge="end" class를 적용해야 한다', () => {
      render(
        <IconButton edge="end" aria-label="next">
          <span aria-hidden="true">→</span>
        </IconButton>,
      );

      expect(screen.getByRole('button', { name: 'next' })).toHaveClass(iconButtonClasses.edgeEnd);
    });

    it('기본적으로 edge class를 적용하지 않아야 한다', () => {
      render(
        <IconButton aria-label="plain">
          <span aria-hidden="true">P</span>
        </IconButton>,
      );

      const button = screen.getByRole('button', { name: 'plain' });

      expect(button).not.toHaveClass(iconButtonClasses.edgeStart);
      expect(button).not.toHaveClass(iconButtonClasses.edgeEnd);
    });
  });

  describe('prop: color', () => {
    it('기본적으로 primary color class를 적용해야 한다', () => {
      render(
        <IconButton aria-label="primary-default">
          <span aria-hidden="true">P</span>
        </IconButton>,
      );

      expect(screen.getByRole('button', { name: 'primary-default' })).toHaveClass(
        iconButtonClasses.colorPrimary,
      );
    });

    it('primary/secondary color class를 적용해야 한다', () => {
      const view = render(
        <IconButton color="primary" aria-label="primary">
          <span aria-hidden="true">P</span>
        </IconButton>,
      );

      expect(screen.getByRole('button', { name: 'primary' })).toHaveClass(
        iconButtonClasses.colorPrimary,
      );

      view.setProps({
        color: 'secondary',
        'aria-label': 'secondary',
        children: <span aria-hidden="true">S</span>,
      });

      expect(screen.getByRole('button', { name: 'secondary' })).toHaveClass(
        iconButtonClasses.colorSecondary,
      );
    });
  });

  describe('prop: disabled', () => {
    it('네이티브 button을 비활성화해야 한다', () => {
      render(
        <IconButton disabled aria-label="disabled">
          <span aria-hidden="true">X</span>
        </IconButton>,
      );

      const button = screen.getByRole('button', { name: 'disabled' });

      expect(button).toBeDisabled();
      expect(button).toHaveClass(iconButtonClasses.disabled);
    });
  });

  describe('prop: loading', () => {
    it('기본적으로 loading wrapper를 렌더링하지 않아야 한다', () => {
      render(
        <IconButton aria-label="bookmark">
          <span aria-hidden="true">★</span>
        </IconButton>,
      );

      const button = screen.getByRole('button', { name: 'bookmark' });

      expect(button.querySelector(`.${iconButtonClasses.loadingWrapper}`)).toBeNull();
      expect(button).not.toBeDisabled();
    });

    it('loading이 false이면 비어 있는 loading wrapper를 렌더링해야 한다', () => {
      render(
        <IconButton loading={false} aria-label="bookmark">
          <span aria-hidden="true">★</span>
        </IconButton>,
      );

      const button = screen.getByRole('button', { name: 'bookmark' });
      const wrapper = button.querySelector(`.${iconButtonClasses.loadingWrapper}`);

      expect(wrapper).toBeInTheDocument();
      expect(within(wrapper as HTMLElement).queryByRole('progressbar')).not.toBeInTheDocument();
      expect(button).not.toBeDisabled();
      expect(button).not.toHaveAttribute('id');
    });

    it('loading 중에는 버튼을 비활성화해야 한다', () => {
      render(
        <IconButton loading aria-label="save">
          <span aria-hidden="true">⚙</span>
        </IconButton>,
      );

      const button = screen.getByRole('button', { name: 'save' });

      expect(button).toBeDisabled();
      expect(button).toHaveClass(iconButtonClasses.loading);
      expect(button).toHaveClass(iconButtonClasses.disabled);
    });

    it('버튼을 이름으로 참조하는 progressbar를 렌더링해야 한다', () => {
      render(
        <IconButton loading aria-label="save">
          <span aria-hidden="true">⚙</span>
        </IconButton>,
      );

      const button = screen.getByRole('button', { name: 'save' });
      const progressbar = within(button).getByRole('progressbar', { name: 'save' });

      expect(progressbar).toBeInTheDocument();
    });

    it('커스텀 loading indicator를 렌더링해야 한다', () => {
      render(
        <IconButton loading aria-label="save" loadingIndicator={<span>loading…</span>}>
          <span aria-hidden="true">⚙</span>
        </IconButton>,
      );

      const button = screen.getByRole('button', { name: 'save' });
      const progressbar = within(button).getByRole('progressbar', { name: 'save' });

      expect(progressbar).toHaveTextContent('loading…');
    });

    it('loading 중에도 제공된 id를 유지해야 한다', () => {
      render(
        <IconButton id="save-button" loading aria-label="save">
          <span aria-hidden="true">⚙</span>
        </IconButton>,
      );

      expect(screen.getByRole('button', { name: 'save' })).toHaveAttribute('id', 'save-button');
    });

    it('loading 중인 링크에는 aria-disabled를 설정해야 한다', () => {
      render(
        <IconButton href="/save" loading aria-label="save link">
          <span aria-hidden="true">⚙</span>
        </IconButton>,
      );

      const link = screen.getByRole('link', { name: 'save link' });

      expect(link).toHaveAttribute('aria-disabled', 'true');
      expect(link).toHaveAttribute('tabindex', '-1');
    });
  });
});

/**
 * 타입 수준 계약. `tsc -p tsconfig.spec.json` 이 검증합니다.
 *
 * `@ts-expect-error` 대신 조건부 `Expect<>` 를 쓰는 것은 RN 쪽 컴포넌트 테스트와 같은 규약입니다 —
 * `@ts-expect-error` 는 엉뚱한 이유로도 만족되지만 이 방식은 **왜** 거부되는지를 고정합니다.
 */
type Expect<T extends true> = T;
type Accepts<T> = T extends IconButtonRenderableProps ? true : false;

/**
 * 아이콘만 있는 컨트롤이라 보이는 글자가 없다. DOM 이 주는 접근 가능한 이름 통로는
 * `aria-label` 과 `aria-labelledby` 둘뿐이고, 둘 다 없으면 스크린리더에서 정체불명이 된다.
 * RN 은 `accessibilityLabel: string` 으로 같은 불변식을 이미 타입에서 강제한다.
 */
export type AccessibleNameIsRequired = [
  Expect<Accepts<{ 'aria-label': 'Add to favorites' }>>,
  Expect<Accepts<{ 'aria-labelledby': 'profile-heading' }>>,
  // 둘을 함께 주는 것도 유효하다 — 배타적 union 이 아니다.
  Expect<Accepts<{ 'aria-label': 'Share'; 'aria-labelledby': 'share-hint' }>>,

  // 이름이 없으면 거부된다.
  Expect<Accepts<{ children: ReactNode }> extends false ? true : false>,
  Expect<Accepts<Record<string, never>> extends false ? true : false>,
  Expect<Accepts<{ edge: 'start'; loading: true }> extends false ? true : false>,
];

/** 이름 요구가 기존 다형성·auto-anchor·ref·web 전용 prop 을 깨뜨리지 않는다. */
export type KeepsExistingWebContract = [
  Expect<Accepts<{ 'aria-label': 'Docs'; href: '/docs' }>>,
  Expect<Accepts<{ 'aria-label': 'Docs'; component: 'a'; href: '/docs' }>>,
  Expect<Accepts<{ 'aria-label': 'Save'; ref: Ref<HTMLButtonElement> }>>,
  Expect<Accepts<{ 'aria-label': 'Back'; edge: 'start' }>>,
  Expect<Accepts<{ 'aria-label': 'Save'; loading: null }>>,
  Expect<Accepts<{ 'aria-label': 'Save'; loading: false }>>,
  Expect<Accepts<{ 'aria-label': 'Menu'; children: ReactNode; className: 'x'; disabled: true }>>,
];

/** RN 의 `accessibilityLabel` 은 DOM 이름 통로가 아니라 web 요구를 만족시키지 못한다. */
export type RnNamingPropDoesNotSatisfyWebContract = [
  Expect<Accepts<{ accessibilityLabel: 'star' }> extends false ? true : false>,
];
