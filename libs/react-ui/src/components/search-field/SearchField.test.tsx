import { fireEvent, screen, within } from '@testing-library/react';
import type { ComponentProps } from 'react';
import { describe, expect, it, vi } from 'vitest';

import { createRenderer } from '../../../test';
import { boxedInputClasses } from '../boxed-input';
import { filledInputClasses } from '../filled-input';
import { FormControl } from '../form-control';
import { inputBaseClasses } from '../input-base';
import { plainInputClasses } from '../plain-input';

import { SearchField } from './SearchField';
import { searchFieldClasses } from './SearchField.constants';
import type { SearchFieldSuggestion } from './SearchField.types';

const suggestions: SearchFieldSuggestion[] = [
  {
    id: 'apple',
    label: 'Apple',
    value: 'apple',
    description: 'Fruit',
  },
  {
    id: 'banana',
    label: 'Banana',
    value: 'banana',
    disabled: true,
  },
];

describe('<SearchField />', () => {
  const { render } = createRenderer();

  describe('rendering', () => {
    it('기본적으로 wrapper, input root, native input을 렌더링해야 한다', () => {
      const { container } = render(
        <SearchField data-testid="root" inputProps={{ 'data-testid': 'input' } as never} />,
      );

      const wrapper = container.firstElementChild as HTMLElement;
      const root = screen.getByTestId('root');
      const input = screen.getByTestId('input');

      expect(wrapper).toBeInTheDocument();
      expect(wrapper).toHaveClass(searchFieldClasses.root);

      expect(root).toBeInTheDocument();
      expect(root).toHaveClass(searchFieldClasses.input);
      expect(root).toHaveClass(boxedInputClasses.root);
      expect(root).toHaveClass(inputBaseClasses.root);

      expect(input).toBeInTheDocument();
      expect(input).toHaveAttribute('type', 'search');
      expect(input).toHaveAttribute('placeholder', 'Search');
    });

    it('기본 variant는 boxed여야 한다', () => {
      render(<SearchField data-testid="root" />);

      const root = screen.getByTestId('root');

      expect(root).toHaveClass(boxedInputClasses.root);
      expect(root).not.toHaveClass(plainInputClasses.root);
      expect(root).not.toHaveClass(filledInputClasses.root);
    });

    it('variant에 따라 plain, filled, boxed input을 전환해야 한다', () => {
      const VariantField = (props: ComponentProps<typeof SearchField>) => (
        <SearchField
          data-testid="root"
          inputProps={{ 'data-testid': 'input' } as never}
          {...props}
        />
      );

      const { setProps } = render(<VariantField variant="plain" />);

      let root = screen.getByTestId('root');

      expect(root).toHaveClass(plainInputClasses.root);
      expect(root).not.toHaveClass(filledInputClasses.root);
      expect(root).not.toHaveClass(boxedInputClasses.root);

      setProps({ variant: 'filled' });

      root = screen.getByTestId('root');

      expect(root).toHaveClass(filledInputClasses.root);
      expect(root).not.toHaveClass(plainInputClasses.root);
      expect(root).not.toHaveClass(boxedInputClasses.root);

      setProps({ variant: 'boxed' });

      root = screen.getByTestId('root');

      expect(root).toHaveClass(boxedInputClasses.root);
      expect(root).not.toHaveClass(plainInputClasses.root);
      expect(root).not.toHaveClass(filledInputClasses.root);
    });

    it('className을 내부 input root에 병합해야 한다', () => {
      render(<SearchField data-testid="root" className="custom-root" />);

      const root = screen.getByTestId('root');

      expect(root).toHaveClass(searchFieldClasses.input);
      expect(root).toHaveClass('custom-root');
    });

    it('root props를 내부 input root에 전달해야 한다', () => {
      render(<SearchField data-testid="root" data-test="test" />);

      expect(screen.getByTestId('root')).toHaveAttribute('data-test', 'test');
    });

    it('inputProps를 native input에 전달해야 한다', () => {
      render(
        <SearchField
          inputProps={
            {
              'data-testid': 'input',
              maxLength: 10,
            } as never
          }
        />,
      );

      const input = screen.getByTestId('input');

      expect(input).toHaveProperty('maxLength', 10);
    });

    it('inputRef에 native input element를 연결해야 한다', () => {
      const inputRef = vi.fn();

      render(<SearchField inputRef={inputRef} />);

      const input = screen.getByRole('searchbox');

      expect(inputRef).toHaveBeenCalled();
      expect(inputRef).toHaveBeenCalledWith(input);
    });

    it('검색 아이콘 adornment를 렌더링해야 한다', () => {
      const { container } = render(<SearchField />);

      const icon = container.querySelector(`.${searchFieldClasses.icon}`);

      expect(icon).toBeInTheDocument();
    });
  });

  describe('value handling', () => {
    it('uncontrolled mode에서 defaultValue를 초기값으로 사용하고 변경값을 반영해야 한다', () => {
      const onChange = vi.fn();
      const onValueChange = vi.fn();

      render(
        <SearchField
          defaultValue="apple"
          onChange={onChange}
          onValueChange={onValueChange}
          inputProps={{ 'data-testid': 'input' } as never}
        />,
      );

      const input = screen.getByTestId('input');

      expect(input).toHaveValue('apple');

      fireEvent.change(input, { target: { value: 'banana' } });

      expect(input).toHaveValue('banana');
      expect(onChange).toHaveBeenCalledTimes(1);
      expect(onValueChange).toHaveBeenCalledWith('banana');
    });

    it('controlled mode에서는 값 변경 요청만 전달하고 실제 값은 props를 따라야 한다', () => {
      const onValueChange = vi.fn();

      const ControlledSearchField = (props: ComponentProps<typeof SearchField>) => (
        <SearchField value="apple" inputProps={{ 'data-testid': 'input' } as never} {...props} />
      );

      const { setProps } = render(<ControlledSearchField onValueChange={onValueChange} />);

      let input = screen.getByTestId('input');

      expect(input).toHaveValue('apple');

      fireEvent.change(input, { target: { value: 'banana' } });

      input = screen.getByTestId('input');

      expect(onValueChange).toHaveBeenCalledWith('banana');
      expect(input).toHaveValue('apple');

      setProps({ value: 'banana' });

      input = screen.getByTestId('input');

      expect(input).toHaveValue('banana');
    });
  });

  describe('suggestions', () => {
    it('focus 시 suggestion이 있으면 listbox를 열어야 한다', () => {
      render(
        <SearchField suggestions={suggestions} inputProps={{ 'data-testid': 'input' } as never} />,
      );

      const input = screen.getByTestId('input');

      expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
      expect(input).toHaveAttribute('aria-expanded', 'false');

      fireEvent.focus(input);

      const listbox = screen.getByRole('listbox');
      const options = screen.getAllByRole('option');

      expect(listbox).toBeInTheDocument();
      expect(listbox).toHaveClass(searchFieldClasses.suggestions);
      expect(listbox).toHaveClass(searchFieldClasses.suggestionsOpen);
      expect(options).toHaveLength(2);
      expect(input).toHaveAttribute('aria-expanded', 'true');
      expect(input).toHaveAttribute('aria-controls', listbox.id);
    });

    it('suggestion을 선택하면 값이 반영되고 onSuggestionSelect를 호출해야 한다', () => {
      const onSuggestionSelect = vi.fn();

      render(
        <SearchField
          suggestions={suggestions}
          onSuggestionSelect={onSuggestionSelect}
          inputProps={{ 'data-testid': 'input' } as never}
        />,
      );

      const input = screen.getByTestId('input');

      fireEvent.focus(input);

      const option = screen.getByRole('option', { name: /Apple/ });

      fireEvent.mouseDown(option);
      fireEvent.click(option);

      expect(input).toHaveValue('apple');
      expect(onSuggestionSelect).toHaveBeenCalledWith(suggestions[0]);
    });

    it('disabled suggestion은 선택되면 안 된다', () => {
      const onSuggestionSelect = vi.fn();

      render(
        <SearchField
          suggestions={suggestions}
          onSuggestionSelect={onSuggestionSelect}
          inputProps={{ 'data-testid': 'input' } as never}
        />,
      );

      const input = screen.getByTestId('input');

      fireEvent.focus(input);

      const disabledOption = screen.getAllByRole('option')[1];

      expect(disabledOption).toHaveAttribute('aria-disabled', 'true');
      expect(disabledOption).toHaveClass(searchFieldClasses.suggestionDisabled);

      fireEvent.click(disabledOption);

      expect(onSuggestionSelect).not.toHaveBeenCalled();
      expect(input).toHaveValue('');
      expect(screen.getByRole('listbox')).toBeInTheDocument();
    });

    it('suggestion이 없고 noSuggestionsText가 있으면 option 이 아닌 status 로 보여줘야 한다', () => {
      render(
        <SearchField
          suggestions={[]}
          noSuggestionsText="No results"
          inputProps={{ 'data-testid': 'input' } as never}
        />,
      );

      const input = screen.getByTestId('input');

      fireEvent.focus(input);

      expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
      expect(screen.getByRole('status')).toHaveTextContent('No results');
      expect(input).toHaveAttribute('aria-expanded', 'false');
      expect(input).not.toHaveAttribute('aria-controls');
    });
  });

  describe('clear', () => {
    const CLEAR = 'Clear search';

    it('clearable 이 없으면 값이 있어도 지우기 버튼을 그리지 않는다', () => {
      render(<SearchField aria-label="Search" defaultValue="apple" />);

      expect(screen.queryByRole('button')).not.toBeInTheDocument();
    });

    it('clearable 이고 값이 있으면 이름 있는 지우기 버튼을 그린다', () => {
      render(
        <SearchField aria-label="Search" clearable clearAriaLabel={CLEAR} defaultValue="apple" />,
      );

      expect(screen.getByRole('button', { name: CLEAR })).toBeInTheDocument();
    });

    it('값이 비어 있으면 지우기 버튼을 그리지 않는다', () => {
      render(<SearchField aria-label="Search" clearable clearAriaLabel={CLEAR} />);

      expect(screen.queryByRole('button', { name: CLEAR })).not.toBeInTheDocument();
    });

    it.each([
      ['disabled', { disabled: true }],
      ['readOnly', { readOnly: true }],
    ])('%s 이면 지우기 버튼을 그리지 않는다', (_label, props) => {
      render(
        <SearchField
          aria-label="Search"
          clearable
          clearAriaLabel={CLEAR}
          defaultValue="apple"
          {...props}
        />,
      );

      expect(screen.queryByRole('button', { name: CLEAR })).not.toBeInTheDocument();
    });

    it('uncontrolled 에서 누르면 값을 비우고 onValueChange("") 다음 onClear 를 부르며 입력에 포커스를 둔다', async () => {
      const calls: string[] = [];
      const { user } = render(
        <SearchField
          aria-label="Search"
          clearable
          clearAriaLabel={CLEAR}
          defaultValue="apple"
          onValueChange={(value) => calls.push(`value:${value}`)}
          onClear={() => calls.push('clear')}
        />,
      );

      await user.click(screen.getByRole('button', { name: CLEAR }));

      const input = screen.getByRole('searchbox');

      expect(input).toHaveValue('');
      expect(input).toHaveFocus();
      expect(calls).toEqual(['value:', 'clear']);
    });

    it('controlled 에서는 onValueChange("") 로 요청만 하고 값은 소비자가 바꿀 때까지 유지한다', async () => {
      const onValueChange = vi.fn();
      const { user } = render(
        <SearchField
          aria-label="Search"
          clearable
          clearAriaLabel={CLEAR}
          value="apple"
          onValueChange={onValueChange}
        />,
      );

      await user.click(screen.getByRole('button', { name: CLEAR }));

      expect(onValueChange).toHaveBeenCalledWith('');
      expect(screen.getByRole('searchbox')).toHaveValue('apple');
    });

    it('clear 관련 prop 은 DOM 으로 새지 않는다', () => {
      const error = vi.spyOn(console, 'error').mockImplementation(() => undefined);

      render(<SearchField aria-label="Search" clearable clearAriaLabel={CLEAR} />);

      expect(error).not.toHaveBeenCalled();
      error.mockRestore();
    });
  });

  describe('combobox semantics', () => {
    const fruits: SearchFieldSuggestion[] = [
      { id: 'apple', label: 'Apple', value: 'apple' },
      { id: 'banana', label: 'Banana', value: 'banana', disabled: true },
      { id: 'cherry', label: 'Cherry', value: 'cherry' },
    ];

    it('suggestions 가 없으면 combobox 가 아니라 native searchbox 다', () => {
      render(<SearchField aria-label="Search" />);

      expect(screen.getByRole('searchbox')).not.toHaveAttribute('aria-expanded');
      expect(screen.queryByRole('combobox')).not.toBeInTheDocument();
    });

    it('option 안에 상호작용 요소가 없고 option 은 탭 순서에 없다', async () => {
      const { user } = render(<SearchField aria-label="Search" suggestions={fruits} />);

      await user.click(screen.getByRole('combobox'));

      screen.getAllByRole('option').forEach((option) => {
        expect(within(option).queryByRole('button')).toBeNull();
        expect(option.id).not.toBe('');
        expect(option).not.toHaveAttribute('tabindex');
      });
    });

    it('ArrowDown 은 입력 포커스를 유지한 채 활성 option 을 aria-activedescendant 로 알린다', async () => {
      const { user } = render(<SearchField aria-label="Search" suggestions={fruits} />);
      const input = screen.getByRole('combobox');

      await user.click(input);
      await user.keyboard('{ArrowDown}');

      const [apple] = screen.getAllByRole('option');

      expect(input).toHaveFocus();
      expect(input).toHaveAttribute('aria-activedescendant', apple.id);
      expect(apple).toHaveAttribute('aria-selected', 'true');
    });

    it('화살표 이동은 disabled option 을 건너뛴다', async () => {
      const { user } = render(<SearchField aria-label="Search" suggestions={fruits} />);
      const input = screen.getByRole('combobox');

      await user.click(input);
      await user.keyboard('{ArrowDown}{ArrowDown}');

      const [apple, , cherry] = screen.getAllByRole('option');

      expect(input).toHaveAttribute('aria-activedescendant', cherry.id);

      await user.keyboard('{ArrowUp}');

      expect(input).toHaveAttribute('aria-activedescendant', apple.id);
    });

    it('Enter 는 활성 option 을 선택하고 목록을 닫으며 포커스는 입력에 남는다', async () => {
      const onSuggestionSelect = vi.fn();
      const { user } = render(
        <SearchField
          aria-label="Search"
          suggestions={fruits}
          onSuggestionSelect={onSuggestionSelect}
        />,
      );
      const input = screen.getByRole('combobox');

      await user.click(input);
      await user.keyboard('{ArrowDown}{Enter}');

      expect(input).toHaveValue('apple');
      expect(onSuggestionSelect).toHaveBeenCalledWith(fruits[0]);
      expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
      expect(input).toHaveFocus();
      expect(input).not.toHaveAttribute('aria-activedescendant');
    });

    it('활성 option 이 없으면 Enter 를 가로채지 않는다 (폼 제출이 살아 있다)', () => {
      render(<SearchField aria-label="Search" suggestions={fruits} />);
      const input = screen.getByRole('combobox');

      fireEvent.focus(input);

      expect(fireEvent.keyDown(input, { key: 'Enter' })).toBe(true);
    });

    it('Escape 는 열린 목록을 닫고 입력 포커스를 유지한다', async () => {
      const { user } = render(<SearchField aria-label="Search" suggestions={fruits} />);
      const input = screen.getByRole('combobox');

      await user.click(input);
      await user.keyboard('{ArrowDown}');

      expect(fireEvent.keyDown(input, { key: 'Escape' })).toBe(false);
      expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
      expect(input).toHaveFocus();
      expect(input).not.toHaveAttribute('aria-activedescendant');
    });

    it('option 을 클릭하면 선택하고 목록이 다시 열리지 않으며 입력 포커스를 유지한다', async () => {
      const { user } = render(<SearchField aria-label="Search" suggestions={fruits} />);
      const input = screen.getByRole('combobox');

      await user.click(input);
      await user.click(screen.getByRole('option', { name: 'Apple' }));

      expect(input).toHaveValue('apple');
      expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
      expect(input).toHaveFocus();
    });

    it('disabled option 은 클릭해도 선택되지 않는다', async () => {
      const onSuggestionSelect = vi.fn();
      const { user } = render(
        <SearchField
          aria-label="Search"
          suggestions={fruits}
          onSuggestionSelect={onSuggestionSelect}
        />,
      );

      await user.click(screen.getByRole('combobox'));
      await user.click(screen.getByRole('option', { name: 'Banana' }));

      expect(onSuggestionSelect).not.toHaveBeenCalled();
      expect(screen.getByRole('combobox')).toHaveValue('');
    });
  });

  describe('keyboard and focus handling', () => {
    it('focus/blur 이벤트를 전달하고 blur 시 listbox를 닫아야 한다', () => {
      const onFocus = vi.fn();
      const onBlur = vi.fn();

      render(
        <SearchField
          suggestions={suggestions}
          onFocus={onFocus}
          onBlur={onBlur}
          inputProps={{ 'data-testid': 'input' } as never}
        />,
      );

      const input = screen.getByTestId('input');

      fireEvent.focus(input);

      expect(onFocus).toHaveBeenCalledTimes(1);
      expect(screen.getByRole('listbox')).toBeInTheDocument();

      fireEvent.blur(input);

      expect(onBlur).toHaveBeenCalledTimes(1);
      expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
    });

    it('Escape 키를 누르면 suggestion 목록을 닫아야 한다', () => {
      render(
        <SearchField suggestions={suggestions} inputProps={{ 'data-testid': 'input' } as never} />,
      );

      const input = screen.getByTestId('input');

      fireEvent.focus(input);

      expect(screen.getByRole('listbox')).toBeInTheDocument();

      fireEvent.keyDown(input, { key: 'Escape' });

      expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
      expect(input).toHaveAttribute('aria-expanded', 'false');
    });

    it('ArrowDown 키를 누르면 suggestion 목록을 열어야 한다', () => {
      render(
        <SearchField suggestions={suggestions} inputProps={{ 'data-testid': 'input' } as never} />,
      );

      const input = screen.getByTestId('input');

      expect(screen.queryByRole('listbox')).not.toBeInTheDocument();

      fireEvent.keyDown(input, { key: 'ArrowDown' });

      expect(screen.getByRole('listbox')).toBeInTheDocument();
      expect(input).toHaveAttribute('aria-expanded', 'true');
    });

    it('inputProps.onKeyDown에서 preventDefault되면 내부 키다운 동작을 실행하지 않아야 한다', () => {
      const onKeyDown = vi.fn((event: KeyboardEvent) => {
        event.preventDefault();
      });

      render(
        <SearchField
          suggestions={suggestions}
          inputProps={
            {
              'data-testid': 'input',
              onKeyDown,
            } as never
          }
        />,
      );

      const input = screen.getByTestId('input');

      fireEvent.keyDown(input, { key: 'ArrowDown' });

      expect(onKeyDown).toHaveBeenCalledTimes(1);
      expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
    });
  });

  describe('with FormControl', () => {
    it('FormControl error, size, hiddenLabel 상태를 받아와야 한다', () => {
      render(
        <FormControl error size="sm" hiddenLabel>
          <SearchField data-testid="root" inputProps={{ 'data-testid': 'input' } as never} />
        </FormControl>,
      );

      const root = screen.getByTestId('root');
      const input = screen.getByTestId('input');

      expect(root).toHaveClass(inputBaseClasses.error);
      expect(root).toHaveClass(inputBaseClasses.sizeSm);
      expect(input).toHaveClass(inputBaseClasses.inputSizeSm);
      expect(input).toHaveClass(inputBaseClasses.inputHiddenLabel);
    });

    it('FormControl 상태는 props로 override할 수 있어야 한다', () => {
      const SearchFieldInForm = (props: ComponentProps<typeof SearchField>) => (
        <FormControl error size="md" hiddenLabel>
          <SearchField
            data-testid="root"
            inputProps={{ 'data-testid': 'input' } as never}
            {...props}
          />
        </FormControl>
      );

      const { setProps } = render(<SearchFieldInForm />);

      let root = screen.getByTestId('root');
      let input = screen.getByTestId('input');

      expect(root).toHaveClass(inputBaseClasses.error);
      expect(root).not.toHaveClass(inputBaseClasses.sizeSm);
      expect(input).toHaveClass(inputBaseClasses.inputHiddenLabel);

      setProps({
        error: false,
        size: 'sm',
      });

      root = screen.getByTestId('root');
      input = screen.getByTestId('input');

      expect(root).not.toHaveClass(inputBaseClasses.error);
      expect(root).toHaveClass(inputBaseClasses.sizeSm);
      expect(input).toHaveClass(inputBaseClasses.inputSizeSm);
      expect(input).toHaveClass(inputBaseClasses.inputHiddenLabel);
    });
  });
});
