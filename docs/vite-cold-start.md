# Проверка Vite со связанным core

Проверено 17 ноября 2026 года на Node.js **24.19.0**, npm **11.9.0**, Vite **8.3.6**,
Vitest **4.1.12** и настоящем Chromium **154.0.8037.57** через Playwright.

## Условия эксперимента

Четыре репозитория клонированы с GitHub в новый каталог рядом друг с другом:

| Репозиторий | Исходный коммит |
| --- | --- |
| common | `23cac7cbf6da8271cec3dabefb535a9609972e78` |
| types | `f8c7bdf0c49b6d67833686b8dad2cbb8e0e90241` |
| core | `cd15c3452ba269008f8b08d91bfe10a946d7f5d7` |
| editor | `c6cefd2a4c4ca368a523b50e162950754e4ccca3` — ветка PR #76 |

Выполнены `npm ci` в common, types и core, `npm run build` в core, затем `npm ci` в editor.
Использован новый npm cache. Существующие `node_modules`, `lib` и Vite-кэши исходных
рабочих каталогов не переносились. `@active-book/core` разрешался в соседний каталог.
Между вариантами менялась только конфигурация Vite; сборка core оставалась неизменной.

Перед **каждым** запуском dev-сервера, выбранных browser-тестов и полного browser-набора
удалялись `node_modules/.vite`, `apps/editor/node_modules/.vite` и `node_modules/.vite-temp`.
Dev-сервер запускался с `--force`; Chromium открывался в новом процессе и контексте.
Результаты повторных запусков с прогретым кэшем не использовались.

Проверка dev включала открытие редактора и `example-book` через настоящий OPFS
(подменён только системный выбор каталога), отрисовку книги и нажатие кнопки custom-компонента.
Записывались navigation requests, переходы главного frame, сообщения Vite WebSocket,
ошибки консоли, страницы и HTTP. Для каждого варианта отдельно проверены динамические
импорты `components`, `Video`, `Carousel`, `StoryDialog`, `BookApplicationSurface`,
`controllers/visualEffects` и `store`. Экспорты barrel и прямых подмодулей идентичны.

## Три варианта optimizeDeps

При сравнении сохранён исходный `server.fs.allow` на `lib/src`.

| Вариант | Холодный dev / динамические импорты | Дополнительные reload в dev | Выбранные browser-тесты | Полный browser-набор | Production reader |
| --- | --- | --- | --- | --- | --- |
| Исходный exclude + 16 include | Успешно, без ошибок | 0 | 2 passed | 120 passed, 1 skipped, 1 известная ошибка геометрии | Build и Chromium успешно |
| Только exclude core | Успешно, без ошибок | 0 | 1 passed, 1 suite не импортирован | 114 passed, 1 skipped, ошибка импорта suite и известная геометрия | Build и Chromium успешно |
| Без optimizeDeps | Успешно, без ошибок | 0 | 2 passed | 120 passed, 1 skipped, 1 известная ошибка геометрии | Build и Chromium успешно |

При exclude-only в каждом холодном запуске Vitest зарегистрирована одна оптимизаторная
перезагрузка: `optimized dependencies changed. reloading`, затем предупреждение
`Vite unexpectedly reloaded a test` и `Failed to fetch dynamically imported module`.
В выбранном наборе не импортировался `VisualIntegration.browser.test.tsx`, в полном —
`EditorPages.browser.test.tsx` (шесть тестов не зарегистрированы). Это дополнительные
ошибки exclude-only, хотя обычный dev-сервер успел обработать позднее обнаружение зависимостей.

Ошибок CommonJS/ESM и дублирования React-контекстов у исходного и выбранного вариантов
не обнаружено. Известная геометрия одинакова во всех полных запусках:
`EditorScreen.browser.test.tsx`, `y = 241.984375` вместо `242`,
`height = 622.171875` вместо `622`.

Production reader собран командой `npm run build:book` для каждого варианта и открыт
через `npm run preview` в Chromium. Проверены старт чтения, custom-компонент и байты WASM.
SHA-256 всех выходных JS, CSS и WASM совпадают между тремя вариантами.

Причина: scanner Vite прекращает обход явно исключённого core. Без `exclude` Vite
проходит по связанному ESM-пакету за пределами `node_modules` и автоматически обнаруживает
его зависимости. Ручные include компенсировали исключение. Поэтому удалён весь `optimizeDeps`.
`resolve.dedupe` для React сохранён; отдельная оптимизация подмодулей core не добавлена.

## Минимальное разрешение файлов

Дополнительные эксперименты выполнены без `optimizeDeps`, также на холодном кэше:

| server.fs.allow | Результат |
| --- | --- |
| Отсутствует | JS и динамические импорты работают, но шесть запросов WOFF/TTF получают 403; прямой запрос poster также 403. HTTP resource test падает |
| repoRoot + core/lib/src/assets | Dev и оба выбранных теста проходят; полный набор: 120 passed, 1 skipped, только известная геометрия. Reader build и Chromium проходят |

Оставлено второе разрешение: SCSS использует относительные URL шрифтов core,
а их HTTP-запросы не получают автоматическое разрешение как импортированные JS-модули.
Для SVG, poster и шрифтов проверены HTTP 200 и содержимое; WASM отдаёт плагин `coreWasm`
по `/vendors/dotlottie-player.wasm`, разрешать каталог vendors через fs.allow не требуется.
Произвольные запросы к `core/src/@types.ts` и `core/lib/src/@types.d.ts` получают 403.
`fs.strict` остаётся включён; родительский каталог и весь core не открываются.
Эти границы проверяет существующий HTTP-тест `tests/package-core/coreResources.test.mjs`.

## Повторение проверок

После установки по README остановите сервер. Перед **каждым отдельным** dev/browser-запуском
из корня editor очистите кэши (затем повторите это действие для следующего варианта):

```sh
node --input-type=module <<'JS'
import { rmSync } from 'node:fs';

const caches = [
  'node_modules/.vite',
  'apps/editor/node_modules/.vite',
  'node_modules/.vite-temp',
];

for (const cacheCur of caches) {
  rmSync(cacheCur, { recursive: true, force: true });
}
JS
```

Команды, запускавшиеся для каждого варианта:

```sh
npm run dev -w active-book-editor -- --host 127.0.0.1 --port 5187 --strictPort --force
npm run test:browser -- apps/editor/src/tests/VisualIntegration.browser.test.tsx apps/book-runtime/src/components/ContentMedia/tests/RuntimeMedia.browser.test.tsx
npm run test:browser
node --test tests/package-core/coreResources.test.mjs
npm run build:book
npm run preview -- --host 127.0.0.1 --port 5187 --strictPort
```

Системный Chromium выбран переменной `PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH=/usr/bin/chromium`
для browser-тестов. Обычные dev и preview проверялись отдельно Playwright с тем же Chromium.
В dev открывались проект и перечисленные динамические подмодули; в preview — собранная книга.
Не следует считать успешный второй запуск подтверждением холодного старта.

## Проверки окончательного изменения

`typecheck`, `typecheck:test`, 240 unit-тестов, 17 component-тестов, два `test:scripts`,
`build:editor`, Stylelint и `test:runtime` (один Chromium-сценарий editor → production reader)
проходят. Холодные browser-проверки итоговой конфигурации приведены в таблице fs.allow выше.
ESLint изменённых файлов с Node globals для MJS: ошибок нет, сохранено предупреждение
`import-x/no-default-export` конфигурации Vite. Штатный `lint:ts:check` сохраняет прежние
1 error и 49 warnings, включая `EffectsModal.tsx:218`; их исправление не входит в эту задачу.
