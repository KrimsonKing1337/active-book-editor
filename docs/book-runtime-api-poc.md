# BookRuntime API — POC

## Контракт

Общий TypeScript-only контракт находится в отдельном репозитории `activeBook-types`,
в пакете `@active-book/types`. Редактор и читатель используют его через
`import type`; реальные объекты доступны при рендеринге через проп `book`.

Реализация `createBookRuntime(mode)` находится в
`packages/book-builder/src/components/custom/runtime.ts`. Сейчас она выдаёт:

- `book.mode`: `editor` или `reader`.
- `book.components.P`, `H1`, `H2`: реальные компоненты ядра.
- `book.hooks.useAudioController(id)`: реальный React-хук ядра, читающий
  `state.audioEffects.audioInstances` через `audioEffectsSelectors.audioInstances`,
  с методами `play`, `pause`, `stop`, `remove`.

Структура `book.json` не меняется: там хранятся только имена компонентов и пакетов.
Объект передаётся через `CoreComponentNode` редактора и `renderNode` читателя.
`BookRuntime` предоставляется хостом и не включается в ESM кастомной библиотеки.
`sharedReactPlugin` по-прежнему нужен, чтобы не дублировать React.

## Локальные зависимости

При локальной разработке папки `activeBook-editor`, `activeBook-types`
и `activeBook-custom-test` должны располагаться рядом: редактор и тестовая библиотека
указывают `@active-book/types` как `file:../activeBook-types`.

## Проверка

1. Собрать `activeBook-custom-test` из ветки `feature/book-runtime-consumer` (`npm run make`).
2. Запустить редактор из ветки `feature/book-runtime-api`.
3. Импортировать `activebook-custom-test-0.0.8.tgz` и вставить `RuntimeExample`.
4. Проверить рендеринг настоящих `P`, `H2`, работу счётчика и режим `editor`.
5. Создать аудиоэффект с ID `test-audio-id`, привязать существующий аудиофайл.
6. Вставить `AudioControl`, собрать книгу, пройти начальный экран разблокировки аудио.
7. Проверить доступность аудио по ID и работу кнопок `play`, `pause`, `stop`
   в собранной книге. Там `RuntimeExample` должен показывать режим `reader`.

В редакторе все аудиоэффекты страницы монтируются через `AudioInstances`
внутри `App` (под общим Redux Provider), независимо от того, открыта ли модалка.
Источник эффектов — атрибут `pageEffects` документа TipTap; `PageEffectsContext`
отдаёт настройки и статусы загрузки всем вложенным компонентам.

Для загрузки локального аудиофайла используются `project.storage.getAssetFile()`
и Blob URL с освобождением ресурсов при замене/удалении. Каждый эффект получает
свой ID из настроек, `page=0`, `playOnLoad=false` и `lifecycle="auto"`.
При размонтировании ядро удаляет экземпляр из Redux и вызывает выгрузку через сагу.

Окно настроек больше не создаёт собственный экземпляр `Audio` и не удаляет его
при закрытии: `AudioPreview` только обращается к `useAudioController(effect.id)`.
Теперь `AudioControl` может управлять `test-audio-id` в самом редакторе,
включая момент, когда модальное окно закрыто.

Сборка, `npm ci` и браузерные тесты должны быть выполнены перед слиянием веток.
