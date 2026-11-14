import { render } from '@testing-library/react';
import { expect, test } from 'vitest';
import { userEvent } from 'vitest/browser';

import Arrow from '@active-book/core/assets/img/toolbar/i-arrow-right.svg';

import { BookApplicationSurface } from '@active-book/core/components/BookApplicationSurface';

import '../../../../../active-book-common/styles/styles.scss';
import '@active-book/core/styles/styles.scss';
import './styles.scss';

test('common styles preserve icons, native focus and separate editor and story fonts', async () => {
  const { getByRole, getByTestId } = render(
    <>
      <button>Keyboard focus</button>
      <input aria-label='Editable text' defaultValue='Select this text' />
      <div data-testid='icon' style={{ width: 24, height: 28 }}><Arrow /></div>
      <BookApplicationSurface data-testid='book'>Story</BookApplicationSurface>
    </>,
  );
  const button = getByRole('button');
  const input = getByRole('textbox') as HTMLInputElement;
  const icon = getByTestId('icon').querySelector('svg');

  expect(getComputedStyle(document.body).fontFamily).toContain('Inter');
  expect(getComputedStyle(getByTestId('book')).fontFamily).toContain('Roboto');
  expect(getComputedStyle(button).fontFamily).toBe(getComputedStyle(document.body).fontFamily);
  expect(getComputedStyle(input).fontFamily).toBe(getComputedStyle(document.body).fontFamily);
  expect(getComputedStyle(document.body).userSelect).not.toBe('none');
  expect(getComputedStyle(document.documentElement).getPropertyValue('--bg').trim()).not.toBe('');
  expect(getComputedStyle(button, '::before').boxSizing).toBe('border-box');
  expect(icon?.getBoundingClientRect().width).toBe(24);
  expect(icon?.getBoundingClientRect().height).toBe(28);

  await userEvent.keyboard('{Tab}');
  expect(button).toHaveFocus();
  expect(button.matches(':focus-visible')).toBe(true);
  expect(getComputedStyle(button).outlineStyle).not.toBe('none');
  input.focus();
  input.select();
  expect(input.selectionEnd).toBe(input.value.length);
  expect(input.selectionStart).toBe(0);
});
