import { screen } from '@testing-library/react';
import type { ReactNode, Ref } from 'react';
import { describe, expect, it } from 'vitest';

import { createRenderer, describeConformance } from '../../../test';

import { Fab } from './Fab';
import { fabClasses } from './Fab.constants';
import type { FabRenderableProps } from './Fab.types';

describe('<Fab />', () => {
  const { render } = createRenderer();

  describeConformance(<Fab aria-label="add" icon={<span aria-hidden="true">+</span>} />, () => ({
    render,
    classes: fabClasses,
    refInstanceof: HTMLButtonElement,
    polymorphicPropName: 'component',
    testPolymorphicPropWith: 'a',
  }));

  describe('root', () => {
    it('기본적으로 button으로 렌더링되어야 한다', () => {
      render(<Fab aria-label="add" icon={<span aria-hidden="true">+</span>} />);

      expect(screen.getByRole('button', { name: 'add' })).toHaveClass(fabClasses.root);
    });

    it('href가 제공되면 링크로 렌더링되어야 한다', () => {
      render(<Fab href="/create" aria-label="create" icon={<span aria-hidden="true">+</span>} />);

      expect(screen.getByRole('link', { name: 'create' })).toHaveAttribute('href', '/create');
    });

    it('icon 콘텐츠를 렌더링해야 한다', () => {
      render(<Fab aria-label="add" icon={<span data-testid="fab-icon">+</span>} />);

      const button = screen.getByRole('button', { name: 'add' });
      const icon = button.querySelector(`.${fabClasses.icon}`);

      expect(icon).toBeInTheDocument();
      expect(screen.getByTestId('fab-icon')).toBeInTheDocument();
    });

    it('label 콘텐츠를 렌더링해야 한다', () => {
      render(
        <Fab shape="extended" icon={<span aria-hidden="true">+</span>}>
          Create
        </Fab>,
      );

      const button = screen.getByRole('button', { name: 'Create' });
      const label = button.querySelector(`.${fabClasses.label}`);

      expect(label).toBeInTheDocument();
      expect(label).toHaveTextContent('Create');
    });
  });

  describe('접근 가능한 이름', () => {
    it('circular은 aria-label로 이름을 갖는다', () => {
      render(<Fab aria-label="새 항목 추가" icon={<span aria-hidden="true">+</span>} />);

      expect(screen.getByRole('button', { name: '새 항목 추가' })).toBeInTheDocument();
    });

    it('circular은 aria-labelledby가 참조하는 텍스트로도 이름을 갖는다', () => {
      render(
        <>
          <span id="fab-label">새 항목 추가</span>
          <Fab aria-labelledby="fab-label" icon={<span aria-hidden="true">+</span>} />
        </>,
      );

      expect(screen.getByRole('button', { name: '새 항목 추가' })).toBeInTheDocument();
    });

    it('extended는 보이는 라벨이 이름이 된다 — 명시 aria가 필요 없다', () => {
      render(
        <Fab shape="extended" icon={<span aria-hidden="true">+</span>}>
          만들기
        </Fab>,
      );

      expect(screen.getByRole('button', { name: '만들기' })).toBeInTheDocument();
    });

    it('extended에 명시 aria-label을 주면 보이는 라벨을 덮는다', () => {
      render(
        <Fab shape="extended" aria-label="새 문서 만들기">
          만들기
        </Fab>,
      );

      expect(screen.getByRole('button', { name: '새 문서 만들기' })).toBeInTheDocument();
      expect(screen.getByText('만들기')).toBeInTheDocument();
    });

    it('아이콘 래퍼는 접근성 트리에서 숨겨진 채로 남는다', () => {
      render(<Fab aria-label="추가" icon={<span data-testid="glyph">+</span>} />);

      const wrapper = screen.getByTestId('glyph').parentElement;

      expect(wrapper).toHaveClass(fabClasses.icon);
      expect(wrapper).toHaveAttribute('aria-hidden', 'true');
    });
  });

  describe('prop: shape', () => {
    it('기본적으로 circular shape를 사용해야 한다', () => {
      render(<Fab aria-label="add" icon={<span aria-hidden="true">+</span>} />);

      expect(screen.getByRole('button', { name: 'add' })).toHaveClass(fabClasses.circular);
    });

    it('extended class를 적용해야 한다', () => {
      render(
        <Fab shape="extended" icon={<span aria-hidden="true">+</span>}>
          Create
        </Fab>,
      );

      expect(screen.getByRole('button', { name: 'Create' })).toHaveClass(fabClasses.extended);
    });
  });

  describe('prop: size', () => {
    it('sm size class를 적용해야 한다', () => {
      render(<Fab size="sm" aria-label="small" icon={<span aria-hidden="true">+</span>} />);

      expect(screen.getByRole('button', { name: 'small' })).toHaveClass(fabClasses.sizeSm);
    });

    it('md size class를 적용해야 한다', () => {
      render(<Fab size="md" aria-label="medium" icon={<span aria-hidden="true">+</span>} />);

      expect(screen.getByRole('button', { name: 'medium' })).toHaveClass(fabClasses.sizeMd);
    });

    it('기본적으로 lg size class를 적용해야 한다', () => {
      render(<Fab aria-label="large" icon={<span aria-hidden="true">+</span>} />);

      expect(screen.getByRole('button', { name: 'large' })).toHaveClass(fabClasses.sizeLg);
    });
  });

  describe('prop: color', () => {
    it('기본적으로 primary color class를 적용해야 한다', () => {
      render(<Fab aria-label="primary-default" icon={<span aria-hidden="true">+</span>} />);

      expect(screen.getByRole('button', { name: 'primary-default' })).toHaveClass(
        fabClasses.colorPrimary,
      );
    });

    it('primary/secondary color class를 적용해야 한다', () => {
      const view = render(
        <Fab color="primary" aria-label="primary" icon={<span aria-hidden="true">+</span>} />,
      );

      expect(screen.getByRole('button', { name: 'primary' })).toHaveClass(fabClasses.colorPrimary);

      view.setProps({
        color: 'secondary',
        'aria-label': 'secondary',
        icon: <span aria-hidden="true">+</span>,
      });

      expect(screen.getByRole('button', { name: 'secondary' })).toHaveClass(
        fabClasses.colorSecondary,
      );
    });
  });

  describe('prop: disabled', () => {
    it('네이티브 button을 비활성화해야 한다', () => {
      render(<Fab disabled aria-label="disabled" icon={<span aria-hidden="true">+</span>} />);

      expect(screen.getByRole('button', { name: 'disabled' })).toBeDisabled();
    });

    it('링크 host에는 aria-disabled를 설정해야 한다', () => {
      render(
        <Fab
          href="/create"
          disabled
          aria-label="create"
          icon={<span aria-hidden="true">+</span>}
        />,
      );

      const link = screen.getByRole('link', { name: 'create' });

      expect(link).toHaveAttribute('aria-disabled', 'true');
      expect(link).toHaveAttribute('tabindex', '-1');
    });
  });
});

/**
 * 타입 수준 계약. `tsc -p tsconfig.spec.json` 이 검증합니다.
 *
 * shape 이 곧 의미다 — circular 은 보이는 글자가 없는 아이콘 전용 액션이고, extended 는
 * 보이는 라벨이 이름을 만든다. RN 은 같은 의미를 discriminated union 으로 이미 강제한다.
 * 여기서는 같은 **의미**를 web 의 이름 통로(`aria-label`/`aria-labelledby`)로 표현한다.
 */
type Expect<T extends true> = T;
type Accepts<T> = T extends FabRenderableProps ? true : false;
type HasProp<K extends string> = K extends keyof FabRenderableProps ? true : false;
type IsAny<T> = 0 extends 1 & T ? true : false;

export type CircularRequiresIconAndName = [
  Expect<Accepts<{ icon: ReactNode; 'aria-label': 'Add new item' }>>,
  Expect<Accepts<{ icon: ReactNode; 'aria-labelledby': 'fab-hint' }>>,
  Expect<Accepts<{ shape: 'circular'; icon: ReactNode; 'aria-label': 'Add' }>>,

  // 아이콘이 없으면 원판 안에 아무것도 남지 않는다.
  Expect<Accepts<{ 'aria-label': 'Add' }> extends false ? true : false>,
  // 이름 없는 아이콘 전용 컨트롤은 스크린리더에서 정체불명이 된다.
  Expect<Accepts<{ icon: ReactNode }> extends false ? true : false>,
  // 원형 Fab 에 보이는 라벨을 넣으면 원판 밖으로 새거나 잘린다 — extended 를 써야 한다.
  Expect<
    Accepts<{ icon: ReactNode; 'aria-label': 'Add'; children: 'Create' }> extends false
      ? true
      : false
  >,
];

export type ExtendedRequiresVisibleLabel = [
  Expect<Accepts<{ shape: 'extended'; children: 'Create' }>>,
  Expect<Accepts<{ shape: 'extended'; children: 'Create'; icon: ReactNode }>>,
  // 보이는 라벨이 이름이 되므로 명시 aria 는 선택이다.
  Expect<Accepts<{ shape: 'extended'; children: 'Create'; 'aria-label': 'Create project' }>>,
  Expect<Accepts<{ shape: 'extended' }> extends false ? true : false>,
];

/** 이름·shape 요구가 기존 다형성·auto-anchor·ref·web prop 을 깨뜨리지 않는다. */
export type KeepsExistingWebContract = [
  Expect<Accepts<{ icon: ReactNode; 'aria-label': 'Docs'; href: '/docs' }>>,
  Expect<Accepts<{ icon: ReactNode; 'aria-label': 'Docs'; component: 'a'; href: '/docs' }>>,
  Expect<Accepts<{ icon: ReactNode; 'aria-label': 'Add'; ref: Ref<HTMLButtonElement> }>>,
  Expect<Accepts<{ shape: 'extended'; children: 'Create'; className: 'x'; disabled: true }>>,
  // union 이 any 로 뭉개져 공허하게 통과하지 않는다.
  Expect<IsAny<FabRenderableProps> extends false ? true : false>,
];

export type RejectsUnknownVocabulary = [
  Expect<
    Accepts<{ icon: ReactNode; 'aria-label': 'A'; shape: 'square' }> extends false ? true : false
  >,
  Expect<Accepts<{ icon: ReactNode; 'aria-label': 'A'; size: 'xl' }> extends false ? true : false>,
  Expect<
    Accepts<{ icon: ReactNode; 'aria-label': 'A'; color: 'error' }> extends false ? true : false
  >,
  // Fab 은 항상 contained 다 — variant·fullWidth 는 공개 표면이 아니다.
  Expect<HasProp<'variant'> extends false ? true : false>,
  Expect<HasProp<'fullWidth'> extends false ? true : false>,
];
