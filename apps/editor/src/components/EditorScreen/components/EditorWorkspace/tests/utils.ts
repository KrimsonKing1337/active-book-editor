import { Editor } from '@tiptap/core';

export const workspaceEditor = (): Editor => {
  const textbox = document.querySelector('[role="textbox"][aria-label="Текст страницы"]');

  if (!textbox || !('editor' in textbox) || !(textbox.editor instanceof Editor)) {
    throw new Error('Expected the real workspace TipTap editor');
  }

  return textbox.editor;
};

export const headerButtonNames = [
  'Новый проект',
  'Открыть проект',
  'Сохранить',
  'Показать структуру',
  'Скрыть нарратив',
  'Скрыть фон',
  'Скрыть рамочные эффекты',
  'Импортировать .tgz',
  'Добавить параграф',
  'Добавить заголовок 1',
  'Добавить заголовок 2',
  'Добавить карусель',
  'Добавить изображение',
  'Добавить видео',
  'Собрать книгу',
];
