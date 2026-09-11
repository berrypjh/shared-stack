import { useState } from 'react';

import { screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { createRenderer, describeConformance } from '../../../test';
import { applyComponentStyles, matchingStateColorRules } from '../../../test/componentStyles';
import { cx } from '../../utils';

import { SegmentControl } from './SegmentControl';
import { segmentControlClasses } from './SegmentControl.constants';
import type { SegmentOption } from './SegmentControl.types';

type View = 'list' | 'grid';

const baseOptions: readonly SegmentOption<View>[] = [
  { value: 'list', label: 'List' },
  { value: 'grid', label: 'Grid' },
];

describe('<SegmentControl />', () => {
  const { render } = createRenderer();

  describeConformance(
    <SegmentControl<View> value="list" onChange={() => undefined} options={baseOptions} />,
    () => ({
      render,
      classes: segmentControlClasses,
      refInstanceof: HTMLDivElement,
      skip: ['polymorphicProp'],
    }),
  );

  describe('root', () => {
    it('role="group"으로 렌더링하고 옵션을 button으로 표시해야 한다', () => {
      render(
        <SegmentControl<View>
          value="list"
          onChange={() => undefined}
          options={baseOptions}
          aria-label="View mode"
        />,
      );

      const group = screen.getByRole('group', { name: 'View mode' });

      expect(group).toHaveClass(segmentControlClasses.root);
      expect(screen.getAllByRole('button')).toHaveLength(2);
    });

    it('선택된 옵션에 aria-pressed=true와 active 클래스를 적용해야 한다', () => {
      render(
        <SegmentControl<View> value="grid" onChange={() => undefined} options={baseOptions} />,
      );

      const list = screen.getByRole('button', { name: 'List' });
      const grid = screen.getByRole('button', { name: 'Grid' });

      expect(list).toHaveAttribute('aria-pressed', 'false');
      expect(grid).toHaveAttribute('aria-pressed', 'true');
      expect(grid).toHaveClass(segmentControlClasses.active);
      expect(list).not.toHaveClass(segmentControlClasses.active);
    });
  });

  describe('interaction', () => {
    it('옵션 클릭 시 onChange가 호출되어야 한다', async () => {
      const onChange = vi.fn();
      const { user } = render(
        <SegmentControl<View> value="list" onChange={onChange} options={baseOptions} />,
      );

      await user.click(screen.getByRole('button', { name: 'Grid' }));

      expect(onChange).toHaveBeenCalledTimes(1);
      expect(onChange).toHaveBeenCalledWith('grid');
    });

    it('controlled value 변경에 따라 active 옵션이 갱신되어야 한다', () => {
      const Controlled = () => {
        const [value, setValue] = useState<View>('list');
        return (
          <>
            <SegmentControl<View> value={value} onChange={setValue} options={baseOptions} />
            <button type="button" onClick={() => setValue('grid')}>
              set-grid
            </button>
          </>
        );
      };

      const { user } = render(<Controlled />);

      expect(screen.getByRole('button', { name: 'List' })).toHaveAttribute('aria-pressed', 'true');

      return user.click(screen.getByRole('button', { name: 'set-grid' })).then(() => {
        expect(screen.getByRole('button', { name: 'Grid' })).toHaveAttribute(
          'aria-pressed',
          'true',
        );
      });
    });
  });

  describe('prop: disabled', () => {
    it('disabled 옵션을 비활성화해야 한다', () => {
      const options: readonly SegmentOption<View>[] = [
        { value: 'list', label: 'List' },
        { value: 'grid', label: 'Grid', disabled: true },
      ];
      render(<SegmentControl<View> value="list" onChange={() => undefined} options={options} />);

      expect(screen.getByRole('button', { name: 'Grid' })).toBeDisabled();
    });
  });

  describe('behavior contract', () => {
    it('이미 선택된 옵션을 다시 눌러도 현재 값으로 onChange를 호출해야 한다', async () => {
      const onChange = vi.fn();
      const { user } = render(
        <SegmentControl<View> value="list" onChange={onChange} options={baseOptions} />,
      );

      await user.click(screen.getByRole('button', { name: 'List' }));

      expect(onChange).toHaveBeenCalledWith('list');
    });

    it('disabled 옵션을 눌러도 onChange를 호출하지 않아야 한다', async () => {
      const onChange = vi.fn();
      const options: readonly SegmentOption<View>[] = [
        { value: 'list', label: 'List' },
        { value: 'grid', label: 'Grid', disabled: true },
      ];
      const { user } = render(
        <SegmentControl<View> value="list" onChange={onChange} options={options} />,
      );

      await user.click(screen.getByRole('button', { name: 'Grid' }));

      expect(onChange).not.toHaveBeenCalled();
    });

    it('native button 키보드(Tab, Enter, Space)로 선택할 수 있어야 한다', async () => {
      const onChange = vi.fn();
      const { user } = render(
        <SegmentControl<View> value="list" onChange={onChange} options={baseOptions} />,
      );

      await user.tab();
      await user.tab();

      expect(screen.getByRole('button', { name: 'Grid' })).toHaveFocus();

      await user.keyboard('{Enter}');
      await user.keyboard(' ');

      expect(onChange).toHaveBeenNthCalledWith(1, 'grid');
      expect(onChange).toHaveBeenNthCalledWith(2, 'grid');
    });

    it('group 이름을 aria-labelledby로 받을 수 있어야 한다', () => {
      render(
        <>
          <span id="view-label">View mode</span>
          <SegmentControl<View>
            value="list"
            onChange={() => undefined}
            options={baseOptions}
            aria-labelledby="view-label"
          />
        </>,
      );

      expect(screen.getByRole('group', { name: 'View mode' })).toBeInTheDocument();
    });
  });

  describe('visual state precedence', () => {
    beforeAll(() => {
      applyComponentStyles('segment-control/segment-control.scss');
    });

    const option = (states: { active?: boolean; disabled?: boolean }) => {
      const button = document.createElement('button');
      button.className = cx(
        segmentControlClasses.option,
        states.active && segmentControlClasses.active,
      );
      button.disabled = states.disabled ?? false;
      return button;
    };

    const STATE_SELECTORS = [segmentControlClasses.active, ':disabled'];

    it.each([
      ['selected', { active: true }, 'var(--ds-text-contrast-text)'],
      ['disabled', { disabled: true }, 'var(--ds-text-disable)'],
      ['selected + disabled', { active: true, disabled: true }, 'var(--ds-text-disable)'],
    ])('%s 는 글자색 상태 규칙 하나만 매칭한다', (_label, states, color) => {
      const matched = matchingStateColorRules(option(states), STATE_SELECTORS);

      expect(matched.map((rule) => rule.color)).toEqual([color]);
    });
  });

  describe('prop: ariaLabel', () => {
    it('아이콘 전용 옵션의 aria-label을 button에 전달해야 한다', () => {
      const options: readonly SegmentOption<View>[] = [
        { value: 'list', label: <span aria-hidden="true">≣</span>, ariaLabel: 'List view' },
        { value: 'grid', label: <span aria-hidden="true">▦</span>, ariaLabel: 'Grid view' },
      ];
      render(<SegmentControl<View> value="list" onChange={() => undefined} options={options} />);

      expect(screen.getByRole('button', { name: 'List view' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Grid view' })).toBeInTheDocument();
    });
  });
});
