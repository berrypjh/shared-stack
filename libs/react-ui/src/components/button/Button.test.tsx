import { screen, within } from '@testing-library/react';
import { spy } from 'sinon';
import { describe, expect, it } from 'vitest';

import { createRenderer, describeConformance } from '../../../test';

import { Button } from './Button';
import { buttonClasses } from './Button.constants';

describe('<Button />', () => {
  const { render } = createRenderer();

  describeConformance(<Button>hello</Button>, () => ({
    render,
    classes: buttonClasses,
    refInstanceof: HTMLButtonElement,
    polymorphicPropName: 'component',
    testPolymorphicPropWith: 'a',
  }));

  describe('root', () => {
    it('children을 label 슬롯 내부에 렌더링해야 한다', () => {
      render(<Button>Hello</Button>);

      const button = screen.getByRole('button', { name: 'Hello' });
      const label = button.querySelector(`.${buttonClasses.label}`);

      expect(button).toHaveClass(buttonClasses.root);
      expect(label).toBeInTheDocument();
      expect(label).toHaveTextContent('Hello');
    });

    it('href가 제공되면 링크로 렌더링해야 한다', () => {
      render(<Button href="/docs">Docs</Button>);

      expect(screen.getByRole('link', { name: 'Docs' })).toHaveAttribute('href', '/docs');
    });
  });

  /**
   * Button은 자체 prop만 구조분해하고 나머지를 ButtonBase로 흘린다. 시맨틱 어휘가 그 목록에
   * 잘못 들어가면 ButtonBase 테스트는 그대로 통과하고 Button만 조용히 prop을 삼킨다.
   * conformance `propsSpread`는 임의의 `data-*` 하나만 보므로 이 경로를 덮지 않는다.
   */
  describe('시맨틱 prop 전달', () => {
    it('variant·size·color·fullWidth를 ButtonBase 루트까지 전달한다', () => {
      render(
        <Button variant="outlined" size="lg" color="secondary" fullWidth>
          Hello
        </Button>,
      );

      const button = screen.getByRole('button');

      expect(button).toHaveClass('ui-button--variant-outlined');
      expect(button).toHaveClass('ui-button--size-lg');
      expect(button).toHaveClass('ui-button--color-secondary');
      expect(button).toHaveClass('ui-button--fullWidth');
    });

    it('Button 자체 class와 ButtonBase class가 함께 적용된다', () => {
      render(<Button>Hello</Button>);

      const button = screen.getByRole('button');

      expect(button).toHaveClass(buttonClasses.root);
      expect(button).toHaveClass('ui-button');
    });
  });

  describe('prop: disabled', () => {
    it('네이티브 button을 비활성화해야 한다', () => {
      render(<Button disabled>Hello</Button>);

      expect(screen.getByRole('button')).toBeDisabled();
    });

    it('disabled면 onClick이 호출되지 않아야 한다', async () => {
      const onClick = spy();
      const { user } = render(
        <Button disabled onClick={onClick}>
          Hello
        </Button>,
      );

      await user.click(screen.getByRole('button'));

      expect(onClick.callCount).toBe(0);
    });

    it('링크 host에는 aria-disabled를 설정해야 한다', () => {
      render(
        <Button href="/docs" disabled>
          Docs
        </Button>,
      );

      expect(screen.getByRole('link')).toHaveAttribute('aria-disabled', 'true');
    });
  });

  describe('loading이 활성화를 막는다', () => {
    it('loading이면 네이티브 button의 onClick이 호출되지 않아야 한다', async () => {
      const onClick = spy();
      const { user } = render(
        <Button loading onClick={onClick}>
          Hello
        </Button>,
      );

      await user.click(screen.getByRole('button'));

      expect(onClick.callCount).toBe(0);
    });

    it('loading이면 링크 host의 onClick도 호출되지 않아야 한다', async () => {
      // 링크는 native disabled가 없다 — ButtonBase의 핸들러 억제가 유일한 방어선이라 따로 본다.
      const onClick = spy();
      const { user } = render(
        <Button href="/docs" loading onClick={onClick}>
          Docs
        </Button>,
      );

      await user.click(screen.getByRole('link'));

      expect(onClick.callCount).toBe(0);
    });
  });

  describe('icons', () => {
    it('startIcon을 렌더링해야 한다', () => {
      render(<Button startIcon={<span>start icon</span>}>Hello</Button>);

      const button = screen.getByRole('button', { name: 'Hello' });
      const startIcon = button.querySelector(`.${buttonClasses.startIcon}`);

      expect(startIcon).toBeInTheDocument();
      expect(startIcon).toHaveTextContent('start icon');
    });

    it('endIcon을 렌더링해야 한다', () => {
      render(<Button endIcon={<span>end icon</span>}>Hello</Button>);

      const button = screen.getByRole('button', { name: 'Hello' });
      const endIcon = button.querySelector(`.${buttonClasses.endIcon}`);

      expect(endIcon).toBeInTheDocument();
      expect(endIcon).toHaveTextContent('end icon');
    });

    it('startIcon은 label 앞에, endIcon은 label 뒤에 렌더링되어야 한다', () => {
      render(
        <Button startIcon={<span>start</span>} endIcon={<span>end</span>}>
          Hello
        </Button>,
      );

      const button = screen.getByRole('button', { name: 'Hello' });
      const elements = Array.from(button.children) as HTMLElement[];

      expect(elements[0]).toHaveClass(buttonClasses.startIcon);
      expect(elements[1]).toHaveClass(buttonClasses.label);
      expect(elements[2]).toHaveClass(buttonClasses.endIcon);
    });
  });

  describe('loading', () => {
    it('기본적으로 progressbar를 렌더링하지 않아야 한다', () => {
      render(<Button>Save</Button>);

      expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
    });

    it('loading 상태일 때 기본 spinner를 렌더링해야 한다', () => {
      render(<Button loading>Save</Button>);

      const button = screen.getByRole('button', { name: 'Save' });
      const progressbar = within(button).getByRole('progressbar');
      const spinner = button.querySelector(`.${buttonClasses.spinner}`);

      expect(button).toHaveClass(buttonClasses.loading);
      expect(progressbar).toBeInTheDocument();
      expect(spinner).toBeInTheDocument();
    });

    it('커스텀 loading indicator를 렌더링해야 한다', () => {
      render(
        <Button loading loadingIndicator={<span>loading…</span>}>
          Save
        </Button>,
      );

      const button = screen.getByRole('button', { name: 'Save' });
      const progressbar = within(button).getByRole('progressbar');

      expect(progressbar).toHaveTextContent('loading…');
    });

    it('progressbar의 이름은 버튼 label로 연결되어야 한다', () => {
      render(<Button loading>Submit</Button>);

      const button = screen.getByRole('button', { name: 'Submit' });
      const progressbar = within(button).getByRole('progressbar', { name: 'Submit' });

      expect(button).toBeInTheDocument();
      expect(progressbar).toBeInTheDocument();
    });

    /**
     * center loading 은 라벨을 `opacity: 0` 으로 가립니다 — `display: none` 이 아니라서
     * 접근성 트리에 남습니다. 세 위치를 모두 도는 이유는 위치마다 loader 가 라벨 앞뒤로
     * 옮겨 다니기 때문입니다: 어느 배치에서도 이름이 사라지거나 두 번 읽히면 안 됩니다.
     */
    it.each([['start'], ['center'], ['end']] as const)(
      'loadingPosition=%s 에서도 접근 가능한 이름이 정확히 라벨 하나다',
      (loadingPosition) => {
        render(
          <Button loading loadingPosition={loadingPosition}>
            Submit
          </Button>,
        );

        // 이름이 "Submit Submit" 이 되면 exact 매치가 실패한다.
        expect(screen.getByRole('button', { name: 'Submit' })).toBeInTheDocument();
      },
    );

    it('loading 상태일 때 네이티브 button은 비활성화되어야 한다', () => {
      render(<Button loading>Submit</Button>);

      expect(screen.getByRole('button', { name: 'Submit' })).toBeDisabled();
    });

    it('loading 상태일 때 링크에는 aria-disabled가 설정되어야 한다', () => {
      render(
        <Button href="/docs" loading>
          Docs
        </Button>,
      );

      expect(screen.getByRole('link', { name: 'Docs' })).toHaveAttribute('aria-disabled', 'true');
    });

    it('기본(center) loading에서는 loader가 label 앞에 렌더링되어야 한다', () => {
      render(<Button loading>Save</Button>);

      const button = screen.getByRole('button', { name: 'Save' });
      const elements = Array.from(button.children) as HTMLElement[];

      expect(button).toHaveClass(buttonClasses.loadingPositionCenter);
      expect(elements[0]).toHaveClass(buttonClasses.loadingWrapper);
      expect(elements[1]).toHaveClass(buttonClasses.label);
    });

    it('loadingPosition="start"이면 start placeholder와 loader를 렌더링해야 한다', () => {
      render(
        <Button loading loadingPosition="start">
          Save
        </Button>,
      );

      const button = screen.getByRole('button', { name: 'Save' });
      const elements = Array.from(button.children) as HTMLElement[];
      const startIcon = button.querySelector(`.${buttonClasses.startIcon}`);
      const placeholder = button.querySelector(`.${buttonClasses.loadingIconPlaceholder}`);

      expect(button).toHaveClass(buttonClasses.loadingPositionStart);
      expect(elements[0]).toHaveClass(buttonClasses.startIcon);
      expect(elements[1]).toHaveClass(buttonClasses.loadingWrapper);
      expect(elements[2]).toHaveClass(buttonClasses.label);
      expect(startIcon).toBeInTheDocument();
      expect(placeholder).toBeInTheDocument();
    });

    it('loadingPosition="end"이면 end placeholder와 loader를 렌더링해야 한다', () => {
      render(
        <Button loading loadingPosition="end">
          Save
        </Button>,
      );

      const button = screen.getByRole('button', { name: 'Save' });
      const elements = Array.from(button.children) as HTMLElement[];
      const endIcon = button.querySelector(`.${buttonClasses.endIcon}`);
      const placeholder = button.querySelector(`.${buttonClasses.loadingIconPlaceholder}`);

      expect(button).toHaveClass(buttonClasses.loadingPositionEnd);
      expect(elements[0]).toHaveClass(buttonClasses.label);
      expect(elements[1]).toHaveClass(buttonClasses.loadingWrapper);
      expect(elements[2]).toHaveClass(buttonClasses.endIcon);
      expect(endIcon).toBeInTheDocument();
      expect(placeholder).toBeInTheDocument();
    });

    it('loading 위치와 같은 아이콘 슬롯이 제공되면 해당 슬롯을 유지해야 한다', () => {
      render(
        <Button loading loadingPosition="start" startIcon={<span>icon</span>}>
          Save
        </Button>,
      );

      const button = screen.getByRole('button', { name: 'Save' });
      const startIcon = button.querySelector(`.${buttonClasses.startIcon}`);

      expect(startIcon).toBeInTheDocument();
      expect(startIcon).toHaveTextContent('icon');
      expect(within(button).getByRole('progressbar')).toBeInTheDocument();
    });
  });
});
