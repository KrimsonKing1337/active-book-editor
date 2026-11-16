# Аудит покрытия линтеров, этап 6.1

Дата: 16.11.2026 (Europe/Moscow). Исходная точка: `71dffa6`.
Аудит выполнен после слияния core PR #62, без изменения production-кода.
CI отсутствует; это подтверждено владельцем проекта. Новые workflows не добавлены.

## Итог

ESLint: **1 ошибка / 49 предупреждений → 98 / 55**.
Охват отслеживаемых JS/TS-файлов: **351/373 → 374/374**.
Parser errors до/после: **0 / 0**. Диагностики всех ранее проверявшихся исходников совпадают
с исходным запуском; новые результаты относятся к расширению покрытия.
Это инвентаризация существующего кода, а не число регрессий этой задачи.

Штатные команды по-прежнему завершаются ошибкой при нарушениях. Фильтра по baseline нет.
Один новый инфраструктурный тестовый файл объясняет увеличение общего числа файлов на один;
перенос regression-тестов не создаёт копий.

## Покрытие по каталогам и расширениям

В таблице: проверено / всего отслеживаемых файлов. Generated/untracked результаты сборок
не входят в знаменатель. Для ESLint учитывается и CLI glob, и эффективная конфигурация,
а не только `calculateConfigForFile`. TS включает декларации `.d.ts`.

| Каталог | Тип | До | После |
| --- | --- | --- | --- |
| (корень) | .js | 0 / 2 | 2 / 2 |
| (корень) | .ts | 0 / 1 | 1 / 1 |
| apps | .ts | 176 / 176 | 176 / 176 |
| apps | .tsx | 110 / 110 | 110 / 110 |
| config | .js | 0 / 1 | 0 / 0 |
| packages | .ts | 65 / 65 | 65 / 65 |
| scripts | .mjs | 0 / 2 | 2 / 2 |
| tests | .js | 0 / 1 | 3 / 3 |
| tests | .mjs | 0 / 1 | 1 / 1 |
| tests | .ts | 0 / 14 | 14 / 14 |

Stylelint: **29/29 SCSS → 29/29**, **0 → 0 ошибок**.
Команда дополнительно включает `tests/`, поэтому новый SCSS тестового приложения будет проверен.
В текущем checkout вне `apps/` нет отслеживаемых SCSS; расширение не запускает их повторно.
Старые исключения по именам `reset.scss`/`__mixins.scss` удалены; совпадающих файлов здесь нет.

## Причины пробелов и изменения инфраструктуры

| Место | Было / последствие | Исправлено |
| --- | --- | --- |
| `eslint.config.js`, глобальные ignores | Все `**/*.js`, весь `scripts/` исключены независимо от содержания | Исключены только зависимости и генерируемые каталоги |
| `package.json`, ESLint glob | Команды обходили корневые тесты, инструменты и конфигурации | TS/TSX/MTS/CTS и JS/JSX/MJS/CJS проверяются двумя непересекающимися glob по всему репозиторию |
| Общий ESLint preset common | TS recommended применялся также к JS, отключая `no-undef`; CJS наследовал module | TS recommended ограничен TS; JS сохраняет recommended и `no-undef`; CJS имеет commonjs source type |
| `tests/infrastructure/lintCoverage.test.js` | Покрытие не закреплено тестом | Проверяются реальные src/tests/scripts/configs, новые виртуальные JS/MJS/CJS, окружения и generated ignores |
| `package.json`, lint-staged | Существующий hook передавал ESLint только TS/TSX | Включены все поддерживаемые расширения JS/TS; hook не запускается повторно общим runner |

Общий preset не назначает всем файлам Node/Jest globals. Он экспортирует `globals` из
стандартного одноимённого пакета: это единственная добавленная зависимость, принадлежащая
common и используемая обоими потребителями. Версии остальных зависимостей не обновлялись.
Стилистические правила, `max-params`, `max-lines`, React Hooks и type-imports не ослаблены.
Сохранены рекомендованные TS-правила и собственные параметры unused-vars.

### Окружения и parser

- Browser globals: исходники приложений, пользовательские browser-модули builder и
  исполняемая JS-фикстура библиотеки. Node globals им не предоставлены.
- Node globals: scripts, корневые/Vite/Vitest конфиги, build/server/bookPreparation/CLI
  builder, Node unit-тесты builder, infrastructure/package-core/ESLint тесты.
- Playwright-тесты и помощники `tests/book-runtime`/`tests/media` используют Node для
  запуска и browser globals для сериализованных callbacks страницы.
- Vitest APIs импортируются из `vitest`; глобальные Jest/expect не добавляются.
  Browser и jsdom component suites используют DOM; ESLint не меняет их runtime-окружение.
- JS/MJS/CJS явно получают `project: null`. Editor сохраняет синтаксический TS lint
  без TypeScript project; проверка типов выполняется отдельными tsc-командами.
  Расширение coverage не требует включать JS в TS compilation.

### Намеренно исключённые файлы

`**/node_modules/**`, выходные `lib`, `dist`, `dist-book`, `coverage`, `test-results`,
а также `.active-book-temp`, `.active-book-build`, `.vitest-attachments` на любой глубине.
Ранее исключения вроде `.active-book-temp` защищали только корневой каталог;
теперь исключены и вложенные workspace-копии. Архив тестовой библиотеки `.tgz`,
медиа и снимки не являются ESLint-входами, но её исходный `library/package/index.js` проверяется.
Новых исключений для подавления ошибок исходников нет.

### Восстановленный ESLint-regression suite

`config/eslint.test.js` перенесён в `tests/eslint/eslint.test.js`, включён в `test:scripts`.
До переноса прямой запуск обнаруживал три неработающих ожидания старого
`newline-destructuring/newline`; теперь проверяется `object-newline/object-newline`,
развёрнутая пара разрешена, тройка/rest проверяются. React Hooks checks сохранены.
CWD закреплён по `import.meta.url`. Vitest не запускает эти Node-тесты повторно.

## Команды и общий runner

```sh
npm run lint:ts:check
npm run lint:js:check
npm run lint:css:check
npm run test:scripts
# из ../active-book-common:
npm run lint -- --repo active-book-core,active-book-editor
npm run lint:js -- --repo active-book-core,active-book-editor
```

Существующие имена сохранены. `lint:ts`/`lint:js`/`lint:css` — явные команды с `--fix`,
версии `:check` ничего не исправляют. Общий runner вызывает только три `:check`-команды,
каждую ровно один раз, продолжает после ошибок и возвращает ненулевой exit code.
`test:scripts` добавлен в группу unit-инфраструктуры ранее; новые проверки подключены к нему,
отдельной второй команды в общем наборе нет. Browser runner и runtime не изменены.
В editor локальный `check` также включает JS. CI отсутствует, автоматические CI-запуски
не заявляются: сейчас контроль выполняется npm-командами и существующим Git hook.

## Распределение ESLint по правилам

| Правило | Ошибки до | Предупр. до | Ошибки после | Предупр. после |
| --- | --- | --- | --- | --- |
| `max-lines` | 0 | 41 | 0 | 44 |
| `@stylistic/array-element-newline` | 0 | 0 | 25 | 0 |
| `@stylistic/array-bracket-newline` | 0 | 0 | 22 | 0 |
| `@stylistic/max-len` | 0 | 0 | 19 | 0 |
| `object-newline/object-newline` | 0 | 0 | 10 | 0 |
| `@stylistic/padding-line-between-statements` | 0 | 0 | 8 | 0 |
| `curly` | 0 | 0 | 8 | 0 |
| `@typescript-eslint/no-explicit-any` | 0 | 4 | 0 | 4 |
| `import-x/no-default-export` | 0 | 1 | 0 | 4 |
| `import-x/order` | 0 | 0 | 3 | 0 |
| `react-hooks/exhaustive-deps` | 0 | 3 | 0 | 3 |
| `@stylistic/curly-newline` | 0 | 0 | 2 | 0 |
| `@stylistic/jsx-newline` | 1 | 0 | 1 | 0 |

## Распределение по каталогам

| Каталог | Файлов до → после | Ошибок до → после | Предупр. до → после |
| --- | --- | --- | --- |
| (корень) | 0 → 3 | 0 → 0 | 0 → 4 |
| apps/book-runtime | 19 → 19 | 0 → 0 | 0 → 0 |
| apps/editor | 267 → 267 | 1 → 1 | 40 → 40 |
| packages/book-builder | 65 → 65 | 0 → 0 | 9 → 9 |
| scripts/ | 0 → 2 | 0 → 4 | 0 → 0 |
| tests/book-runtime | 0 → 2 | 0 → 84 | 0 → 1 |
| tests/editor-effects | 0 → 2 | 0 → 0 | 0 → 0 |
| tests/eslint | 0 → 1 | 0 → 0 | 0 → 1 |
| tests/fixtures | 0 → 5 | 0 → 9 | 0 → 0 |
| tests/infrastructure | 0 → 1 | 0 → 0 | 0 → 0 |
| tests/media | 0 → 4 | 0 → 0 | 0 → 0 |
| tests/package-core | 0 → 1 | 0 → 0 | 0 → 0 |
| tests/setup-browser.ts | 0 → 1 | 0 → 0 | 0 → 0 |
| tests/setup-component.ts | 0 → 1 | 0 → 0 | 0 → 0 |

## Что можно форматировать и что требует решения

ESLint помечает исправляемыми **79 из 98 ошибок** и
**0 из 55 предупреждений**.
Это возможность fix API, а не разрешение применить все исправления без анализа.
Оставшиеся **19 ошибок** не имеют автоматического исправления ESLint.

- Низкий риск: переносы массивов/объектов/деструктуризации, отступы и пустые строки
  в обычном JS/TS. Делать небольшими предметными наборами; проверять diff и тесты.
- Импорты: type-only imports и группировка обычно механические, но перестановка
  side-effect imports или изменение runtime-import в type-only требуют проверки сборки.
- JSX newline требует просмотра смешанного текста/пробелов; не считать его автоматически
  безопасным форматированием. Длинные строки нельзя разрывать изменением строковых значений.
- `max-params` требует осмысленного options object для собственных функций; нельзя менять
  сигнатуру callback стороннего API ради числа параметров.
- Неиспользуемые значения, ambient declarations, namespace и `no-useless-assignment`
  требуют чтения контракта и поиска использований. Не удалять сохраняемые пресеты/ресурсы.
- `max-lines` — сигнал для оценки ответственности. Не дробить тесты или конечный автомат
  по произвольному числу строк. Конфигам необходим default export по API инструмента;
  предупреждения `import-x/no-default-export` не оправдывают поломку этого API.

Приоритет форматирования — желательно/косметически; контрактов, зависимостей hooks и
скрытых assertion gaps — желательно с отдельными тестами. Критичных подтверждённых
поведенческих дефектов этим этапом не установлено: предупреждение само по себе не доказательство.

## React Hooks: все exhaustive-deps предупреждения

| Файл / строка | Диагностика |
| --- | --- |
| [`apps/editor/src/components/EditorScreen/book/useBookPages.ts`](../apps/editor/src/components/EditorScreen/book/useBookPages.ts#L183) | React Hook useLayoutEffect has a missing dependency: 'book.pages'. Either include it or remove the dependency array. |
| [`apps/editor/src/hooks/useAsyncEffect.ts`](../apps/editor/src/hooks/useAsyncEffect.ts#L20) | React Hook useEffect was passed a dependency list that is not an array literal. This means we can't statically verify whether you've passed the correct dependencies. |
| [`apps/editor/src/hooks/useAsyncEffect.ts`](../apps/editor/src/hooks/useAsyncEffect.ts#L20) | React Hook useEffect has a missing dependency: 'effect'. Either include it or remove the dependency array. If 'effect' changes too often, find the parent component that defines it and wrap that definition in useCallback. |

- `useBookPages` использует `book.pages`, но зависит от `book.pages.length` и других
  значений. Перестановка/замена страниц той же длины потенциально оставляет старые
  данные синхронизации; нужны тесты reorder/replace без изменения количества, очереди
  microtask и отмены устаревшего callback. Добавление всего объекта может изменить lifecycle.
- `useAsyncEffect` передаёт нелитеральный DependencyList и callback без зависимости.
  Правило не может проверить список внутри wrapper. Единственный текущий потребитель —
  `useProjectRestore`; сначала проверить актуальность callback и AbortSignal/cleanup.
  Дополнительная настройка custom hooks, если понадобится, требует отдельного решения;
  в 6.1 правила не подавляются и runtime не изменяется.
- Четыре `any` в `apps/editor/src/components/MediaNode/utils.ts` относятся к границе
  медиа/document API. Проверять доступные контракты и narrowing, не маскировать assertions.

## Все max-lines предупреждения

Указано эффективное число строк ESLint (без пустых строк и комментариев), лимит 150.

| Файл | Строк |
| --- | --- |
| [`apps/editor/src/components/ContentValidation/tests/ContentValidation.ranges.browser.test.tsx`](../apps/editor/src/components/ContentValidation/tests/ContentValidation.ranges.browser.test.tsx) | 178 |
| [`apps/editor/src/components/EditorScreen/book/useBookPages.ts`](../apps/editor/src/components/EditorScreen/book/useBookPages.ts) | 234 |
| [`apps/editor/src/components/EditorScreen/components/EditorWorkspace/EditorWorkspace.tsx`](../apps/editor/src/components/EditorScreen/components/EditorWorkspace/EditorWorkspace.tsx) | 350 |
| [`apps/editor/src/components/EditorScreen/components/PageEffects/PageEffects.tsx`](../apps/editor/src/components/EditorScreen/components/PageEffects/PageEffects.tsx) | 324 |
| [`apps/editor/src/components/EditorScreen/components/PageEffects/components/AudioInstances/AudioInstances.tsx`](../apps/editor/src/components/EditorScreen/components/PageEffects/components/AudioInstances/AudioInstances.tsx) | 189 |
| [`apps/editor/src/components/EditorScreen/components/PageEffects/components/AudioSettings/AudioSettings.tsx`](../apps/editor/src/components/EditorScreen/components/PageEffects/components/AudioSettings/AudioSettings.tsx) | 389 |
| [`apps/editor/src/components/EditorScreen/components/PageEffects/components/BackgroundSettings/BackgroundSettings.tsx`](../apps/editor/src/components/EditorScreen/components/PageEffects/components/BackgroundSettings/BackgroundSettings.tsx) | 281 |
| [`apps/editor/src/components/EditorScreen/components/PageEffects/components/EffectsModal/EffectsModal.tsx`](../apps/editor/src/components/EditorScreen/components/PageEffects/components/EffectsModal/EffectsModal.tsx) | 182 |
| [`apps/editor/src/components/EditorScreen/components/PageEffects/components/EffectsModal/catalog.ts`](../apps/editor/src/components/EditorScreen/components/PageEffects/components/EffectsModal/catalog.ts) | 195 |
| [`apps/editor/src/components/EditorScreen/components/PageEffects/components/EffectsModal/components/EffectsBrowser/EffectsBrowser.tsx`](../apps/editor/src/components/EditorScreen/components/PageEffects/components/EffectsModal/components/EffectsBrowser/EffectsBrowser.tsx) | 275 |
| [`apps/editor/src/components/EditorScreen/components/PageEffects/components/FlashlightSettings/FlashlightSettings.tsx`](../apps/editor/src/components/EditorScreen/components/PageEffects/components/FlashlightSettings/FlashlightSettings.tsx) | 239 |
| [`apps/editor/src/components/EditorScreen/components/PageEffects/components/FrameSettings/FrameSettings.tsx`](../apps/editor/src/components/EditorScreen/components/PageEffects/components/FrameSettings/FrameSettings.tsx) | 500 |
| [`apps/editor/src/components/EditorScreen/components/PageEffects/components/FrameSettings/components/AnimationSettings/AnimationSettings.tsx`](../apps/editor/src/components/EditorScreen/components/PageEffects/components/FrameSettings/components/AnimationSettings/AnimationSettings.tsx) | 162 |
| [`apps/editor/src/components/EditorScreen/components/PageEffects/components/StyleEditor/components/AdvancedStyles/AdvancedStyles.tsx`](../apps/editor/src/components/EditorScreen/components/PageEffects/components/StyleEditor/components/AdvancedStyles/AdvancedStyles.tsx) | 241 |
| [`apps/editor/src/components/EditorScreen/components/PageEffects/components/StyleEditor/components/ColorSettings/ColorSettings.tsx`](../apps/editor/src/components/EditorScreen/components/PageEffects/components/StyleEditor/components/ColorSettings/ColorSettings.tsx) | 314 |
| [`apps/editor/src/components/EditorScreen/components/PageEffects/components/StyleEditor/components/FilterSettings/FilterSettings.tsx`](../apps/editor/src/components/EditorScreen/components/PageEffects/components/StyleEditor/components/FilterSettings/FilterSettings.tsx) | 254 |
| [`apps/editor/src/components/EditorScreen/components/PageEffects/components/VibrationSettings/VibrationSettings.tsx`](../apps/editor/src/components/EditorScreen/components/PageEffects/components/VibrationSettings/VibrationSettings.tsx) | 208 |
| [`apps/editor/src/components/EditorScreen/components/PageEffects/components/VisualRegionSettings/VisualRegionSettings.tsx`](../apps/editor/src/components/EditorScreen/components/PageEffects/components/VisualRegionSettings/VisualRegionSettings.tsx) | 308 |
| [`apps/editor/src/components/EditorScreen/components/PageEffects/components/VisualRegionSettings/components/FrameMaskSettings/FrameMaskSettings.tsx`](../apps/editor/src/components/EditorScreen/components/PageEffects/components/VisualRegionSettings/components/FrameMaskSettings/FrameMaskSettings.tsx) | 208 |
| [`apps/editor/src/components/EditorScreen/components/PageEffects/context/hooks/useStylePreviews.ts`](../apps/editor/src/components/EditorScreen/components/PageEffects/context/hooks/useStylePreviews.ts) | 158 |
| [`apps/editor/src/components/EditorScreen/components/PageEffects/context/utils.ts`](../apps/editor/src/components/EditorScreen/components/PageEffects/context/utils.ts) | 230 |
| [`apps/editor/src/components/EditorScreen/components/PageEffects/utils.ts`](../apps/editor/src/components/EditorScreen/components/PageEffects/utils.ts) | 187 |
| [`apps/editor/src/components/EditorScreen/hooks/useAutosave.ts`](../apps/editor/src/components/EditorScreen/hooks/useAutosave.ts) | 205 |
| [`apps/editor/src/components/EditorScreen/hooks/useProjectActions.ts`](../apps/editor/src/components/EditorScreen/hooks/useProjectActions.ts) | 226 |
| [`apps/editor/src/components/EditorScreen/tests/CarouselContent.browser.test.tsx`](../apps/editor/src/components/EditorScreen/tests/CarouselContent.browser.test.tsx) | 230 |
| [`apps/editor/src/components/EditorScreen/tests/EditorPages.browser.test.tsx`](../apps/editor/src/components/EditorScreen/tests/EditorPages.browser.test.tsx) | 419 |
| [`apps/editor/src/components/EditorScreen/tests/EditorScreen.browser.test.tsx`](../apps/editor/src/components/EditorScreen/tests/EditorScreen.browser.test.tsx) | 393 |
| [`apps/editor/src/components/EditorScreen/tests/TextContent.browser.test.tsx`](../apps/editor/src/components/EditorScreen/tests/TextContent.browser.test.tsx) | 162 |
| [`apps/editor/src/components/EditorScreen/utils.ts`](../apps/editor/src/components/EditorScreen/utils.ts) | 172 |
| [`apps/editor/src/project/projectService.ts`](../apps/editor/src/project/projectService.ts) | 164 |
| [`apps/editor/src/project/storage/LocalProjectStorage.ts`](../apps/editor/src/project/storage/LocalProjectStorage.ts) | 310 |
| [`apps/editor/src/tests/VisualIntegration.browser.test.tsx`](../apps/editor/src/tests/VisualIntegration.browser.test.tsx) | 168 |
| [`eslint.config.js`](../eslint.config.js) | 168 |
| [`packages/book-builder/src/book/book.test.ts`](../packages/book-builder/src/book/book.test.ts) | 156 |
| [`packages/book-builder/src/bookPreparation/compileBookDocument.test.ts`](../packages/book-builder/src/bookPreparation/compileBookDocument.test.ts) | 211 |
| [`packages/book-builder/src/components/custom/browser.ts`](../packages/book-builder/src/components/custom/browser.ts) | 338 |
| [`packages/book-builder/src/content/tests/content.test.ts`](../packages/book-builder/src/content/tests/content.test.ts) | 201 |
| [`packages/book-builder/src/effects/background/background.test.ts`](../packages/book-builder/src/effects/background/background.test.ts) | 164 |
| [`packages/book-builder/src/effects/frame/frame.test.ts`](../packages/book-builder/src/effects/frame/frame.test.ts) | 179 |
| [`packages/book-builder/src/server/plugin.ts`](../packages/book-builder/src/server/plugin.ts) | 234 |
| [`packages/book-builder/src/visualEffects/validation.ts`](../packages/book-builder/src/visualEffects/validation.ts) | 257 |
| [`packages/book-builder/src/visualEffects/visualEffects.test.ts`](../packages/book-builder/src/visualEffects/visualEffects.test.ts) | 368 |
| [`tests/book-runtime/bookRuntime.browser.test.ts`](../tests/book-runtime/bookRuntime.browser.test.ts) | 438 |
| [`tests/eslint/eslint.test.js`](../tests/eslint/eslint.test.js) | 159 |

Наиболее крупные предметные реализации: FrameSettings, AudioSettings, EditorWorkspace,
custom browser loader, LocalProjectStorage. Крупные integration suites (EditorPages,
EditorScreen, bookRuntime) описывают законченные workflows; не дробить их ради лимита.
Settings/editor-state, storage, browser module lifetime следует рассматривать отдельно.

## Подавления правил

- `packages/book-builder/src/build/svg.ts:6`: max-params для контракта SVGR; есть причина
  и тип Plugin. Сигнатуру не менять механически.
- `apps/editor/src/components/EditorScreen/components/PageEffects/components/EffectsModal/hooks.ts:36`:
  max-params для RND resize callback; есть комментарий. Проверять совместимость с RND, не вводить wrapper ради числа аргументов.
- `apps/book-runtime/src/constants.ts:4`: max-len для встроенного audio unlock data URI;
  причина указана. Перенос строки внутрь URI сломает ресурс.

Все три директивы используются, не скрывают hooks diagnostics и не подавляют файл целиком.
Других eslint/stylelint-disable в отслеживаемом коде не найдено. Blank JS/scripts ignores
удалены; новые выключения правил не добавлены.

## Последовательность небольших PR этапа 6.2

1. `tests/book-runtime`: массивы/объекты и длинные строки без изменения сценариев;
   проверять test:runtime/test:tgz:workflow, не делить файлы ради размера.
2. JS `scripts/testAll.mjs` и исполняемая fixture library: форматирование отдельно,
   проверять test:scripts и runtime/custom component workflows. Сохранить порядок batch и callback APIs.
3. Единственная старая TS-ошибка JSX в EffectsModal: проверить пробелы/DOM, component/browser suite области.
4. MediaNode `any`: отдельное narrowing внешних данных с media unit/component/browser cases.
5. useBookPages и useAsyncEffect/useProjectRestore: отдельные regression tests актуальности
   callbacks, reorder/replace страниц и отмены; затем обоснованное исправление deps.
6. Крупные UI/settings, LocalProjectStorage и browser loader: отдельные предметные ревью,
   не переорганизовывать архитектуру ради max-lines и не ломать подписи внешних callbacks.
7. Действующие узкие suppressions пересматривать только при изменении соответствующего
   контракта. Default exports конфигов оставить по API инструментов.

## Воспроизведение измерений

```sh
npm run lint:ts:check -- --format json --output-file /tmp/lint-ts.json
npm run lint:js:check -- --format json --output-file /tmp/lint-js.json
npm run lint:css:check -- --formatter json
```

Сложить severity=2 и severity=1 по двум непересекающимся JSON-отчётам. `fixableErrorCount`
не включает предупреждения. Исходные счётчики получены старой штатной командой на указанном
main; после — ESLint API с теми же конфигами по всем файлам и реальным запуском common runner.
Полные диагностические JSON временные, в пакет и репозиторий не включены.

## Результаты проверок

| Проверка | Результат |
| --- | --- |
| `typecheck`, `typecheck:test` | Оба проходят |
| `test:unit` | 240 тестов / 33 файла проходят |
| `test:component` | 17 тестов / 11 файлов проходят |
| `test:scripts` | 22 теста проходят, в том числе восстановленный regression suite и новый coverage suite |
| `build:editor`, `build:book` | Обе сборки проходят |
| `test:runtime` | 1 интеграционный сценарий production reader проходит |
| `test:browser` | 120 passed, 1 skipped, 1 существующий geometry failure |
| `lint:ts:check` | 87 ошибок, 51 предупреждение: исходный долг плюс корневые TS-тесты |
| `lint:js:check` | 11 ошибок, 4 предупреждения в ранее непроверяемых файлах |
| `lint:css:check` | Все 29 SCSS проходят |
| Изменённые ESLint config/regression/coverage files | 0 ошибок, 3 предупреждения (default export, длина config/regression suite) |
| `git diff --check` | Проходит |

Существующий geometry failure: `apps/editor/src/components/EditorScreen/tests/EditorScreen.browser.test.tsx:216`,
ожидаемый y=242 против 241.984375 и height=622.171875 против 622. Этот тест и исполняемый им
production-код не изменены; сбой известен до этапа 6.1. Исправление вне scope этого PR.
Все остальные browser tests проходят. Массовые media/tgz workflow suites дополнительно
не запускались: изменены только lint/test infrastructure и документация; production reader
проверен отдельным реальным browser workflow. Сборки сохраняют существующее предупреждение
о размере JS chunks; настройка bundling не менялась.

Связанный shared PR: [common #5](https://github.com/KrimsonKing1337/active-book-common/pull/5).
Его нужно объединить первым: локальный consumer использует новый именованный экспорт `globals`.
Общий `test:infra` — 60/60. В common исправлены старые flat-config обращения array-format suite
и ожидание текста deps-sync diagnostic; алгоритм deps-sync не менялся.
