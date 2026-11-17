# Интеграционные тесты эффектов редактора

`apps/editor/src/components/EditorScreen/tests/EditorScreen.browser.test.tsx`
проверяет настоящий EditorScreen, TipTap, UI эффектов, Redux/renderers core,
проектные сервисы и стили приложения. Используется существующий Vitest-проект browser
с настоящим Chromium; jsdom и подмена логики приложения здесь не применяются.

## Основные сценарии

- Добавление и независимое изменение фона, изображения и тени рамки: цвета, opacity,
  z-index, толщина, brightness. Проверяются сохранённый JSON и computed styles.
- Сохранение, размонтирование и повторное открытие EditorScreen. Сервис восстанавливает
  реальный directory handle из IndexedDB и читает book.json. Композиция сравнивается
  с одним screenshot reference до и после восстановления.
- Удаление выбранной тени, сохранение и настоящие Ctrl+Z / Ctrl+Shift+Z в TipTap.
  Проверяется независимость остальных эффектов; отдельная project-level undo-панель не предполагается.
- Размещение визуальных эффектов и очистка выделения при переходах и удалении.
  Для геометрического сравнения на строке 216 известен отдельный сбой дробных координат.

Каждый сценарий создаёт свежий OPFS-проект. Локальный SVG декодируется браузером,
проверяется ненулевой naturalWidth. Происхождение изображения и лицензия:
[effects-book](../fixtures/effects-book/README.md). Во время тестов сеть для него не нужна.
Маскированные поля используют настоящие keyboard events с синхронизацией animation frame.

## Запуск

Сначала выполните [общую установку](https://github.com/KrimsonKing1337/active-book-common/blob/main/README.md#установка-с-нуля-и-запуск-редактора):
Node.js 24 LTS, npm 11, четыре соседних репозитория, core собран до `npm ci` editor.
Core подключён каталогом; архив, увеличение версии и замена lockfile для запуска не нужны.
Из корня editor:

```sh
npx playwright install chromium
npm run test:browser -- apps/editor/src/components/EditorScreen/tests/EditorScreen.browser.test.tsx
npm run typecheck
npm run build:editor
```

При использовании установленного Chromium задайте `PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH`.
В PowerShell: `$env:PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH = 'C:\path\to\chrome.exe'`.
`DEBUG=pw:browser` позволяет увидеть запускаемый executable и PID.

## Screenshot references

Vitest использует `toMatchScreenshot`. Эталоны находятся в
`tests/screenshots/EditorScreen.browser.test.tsx/`; diff и снимки ошибок игнорируются Git.
Viewport — 1280×900. Эталон содержит реальную композицию core, текст и изображение.
Имя включает ОС и браузер, чтобы различия растеризации шрифтов не считались Linux-регрессией.

Для осознанного создания/обновления reference на нужной ОС:

```sh
npm run test:browser -- apps/editor/src/components/EditorScreen/tests/EditorScreen.browser.test.tsx --update
npm run test:browser -- apps/editor/src/components/EditorScreen/tests/EditorScreen.browser.test.tsx
```

Перед коммитом просмотрите изображение. Обычный прогон не использует `--update`.
Не обновляйте эталоны ради сокрытия geometry failure. Нативный Windows-прогон нужно
выполнить на Windows; Linux не подтверждает корректность Windows rendering.

## Границы сценария

Подменены только native OS directory picker и подтверждение удаления. Picker возвращает
реальную папку Chromium OPFS; LocalProjectStorage пишет файлы, IndexedDB сохраняет
настоящий directory handle. Данные очищаются после теста. Storage, Redux, TipTap,
сериализация эффектов и styles resolver не заменены in-memory реализациями.

Системный UI выбора папки, отказ/повторная выдача разрешения и восстановление после
полного перезапуска browser process требуют отдельной ручной проверки. Здесь проверяется
remount в том же контексте. Аудио/видео, анимации и сборка/экспорт проверяются другими
наборами; исторические количества тестов из прошлых изменений не описывают текущий suite.
