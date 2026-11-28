# ActiveBook: редактор и сборщик историй

Редактор иммерсивных историй с предпросмотром на настоящем
`@active-book/core`. Здесь же находятся сборщик проектов и production reader.
React 19 и TipTap отвечают за интерфейс и редактирование; Vite собирает приложения.

Проект находится **до первого релиза**. На новом движке ещё нет выпущенных книг.
Демонстрационные проекты и browser-тесты показывают текущую реализацию, но не заменяют
готовый продукт. API и формат проекта ещё могут меняться.

## Что уже реализовано

- Несколько упорядоченных страниц с постоянными ID, переключением и перестановкой.
- Редактирование текста, заголовков, форматирования, изображений, видео и каруселей.
- Настройки визуальных эффектов и их размещения, фонового аудио и других эффектов книги.
- Предпросмотр через core, выбранные эффекты и параметры их отображения.
- Локальные проекты в папках: сохранение, автосохранение и восстановление последнего проекта.
- Импорт пользовательских библиотек компонентов/визуальных renderer из TGZ.
- Сборка проекта в статический production reader.

Сохранение папок требует **File System Access API**. Для полного рабочего процесса
используйте современный Chromium/Chrome на `localhost` или HTTPS. В другом браузере
поддержка файловых разрешений и отдельных медиа/эффектов может отличаться.
Нет заявленной поддержки ветвящегося сюжета, облачного сервера проектов или совместного редактирования.

## Установка с нуля

Нужны Git, Node.js **24 LTS** (24.15+ в ветке 24.x), npm **11.x**.
В `.nvmrc` — **24.19.0**, проверяемая версия npm — **11.9.0**.
[Клонирование и общая установка четырёх репозиториев](https://github.com/KrimsonKing1337/active-book-common/blob/main/README.md#установка-с-нуля-и-запуск-редактора).

Расположение каталогов:

```text
active-book/
├── active-book-common/
├── active-book-types/
├── active-book-core/
└── active-book-editor/
```

После клонирования, из editor:

```sh
cd ../active-book-common
npm ci
cd ../active-book-types
npm ci
cd ../active-book-core
npm ci
npm run build
cd ../active-book-editor
npm ci
npm run dev
```

Dev-сервер работает до Ctrl+C. Сборки и проверки выполняйте в другом терминале
либо после его остановки. Откройте URL Vite, обычно `http://localhost:5173`. Разрешите выбор папки при создании
или открытии проекта. Для технического просмотра можно открыть `example-book/`
либо создать проект в пустой папке. В репозитории уже есть демонстрационная библиотека,
поэтому дополнительный `active-book-custom-test` для запуска не нужен.

Для явного адреса/порта запускайте workspace-команду с передачей аргументов Vite:

```sh
npm run dev -w active-book-editor -- --host 127.0.0.1 --port 5173 --strictPort
```

## Как подключено ядро

Корневая зависимость — **`@active-book/core: file:../active-book-core`**.
`npm ci` создаёт локальную ссылку, а exports читаются из собранного `lib/src/` core.
Зависимости самого core/common/types должны быть установлены в их собственных каталогах.
Нет скачивания ядра из npm, автоматической сборки при установке или необходимости иметь TGZ.

После изменения ядра остановите dev-сервер, выполните здесь:

```sh
npm run core:build
npm run dev
```

Команда пересобирает соседний core без смены версии. Vite редактора и builder уже
настраивает dedupe `react`/`react-dom`, SCSS, SVG и dotLottie WASM для локального пакета.
Dev-сервер разрешает HTTP-доступ к статическим ресурсам `lib/src/assets/` связанного core;
`fs.strict` сохраняется, весь родительский каталог не открывается. Vite автоматически
сканирует связанный ESM-пакет и обнаруживает его зависимости без ручного `optimizeDeps`.
Результаты холодных запусков и проверки ресурсов описаны в [отчёте](docs/vite-cold-start.md).
Не меняйте `preserveSymlinks` и не используйте `npm link` вместо документированного `file:`.

`npm run core:package` сохраняется для отдельной проверки production-упаковки:
он вызывает `build` и `packaging` в core, оставляя архив в его `tgz/`.
Он **не устанавливает архив**, не меняет зависимость editor и не повышает версии.
Для обычной разработки используйте `core:build`.

## Проекты и сборка reader

`book.json` хранит страницы и объявления эффектов; `assets/` — ресурсы проекта.
Необязательный `package.json` и `dependencies/` описывают TGZ-библиотеки компонентов.
В UI «Собрать книгу» передаёт сохранённые данные проекта внутреннему builder.
Результат находится в `dist-book/`.

Из корня editor:

```sh
npm run build:editor
npm run build:book
npm run preview
```

`build:editor` создаёт `apps/editor/dist/`. `build:book` использует `example-book/`,
включая зафиксированный `dependencies/active-book-custom-test-0.0.8.tgz`.
`preview` обслуживает reader из `dist-book/`, обычно на `http://localhost:4173`.
Это имя демонстрационной библиотеки, а не старое имя `@active-book/core`.
Её пересборка не требуется для установки четырёх основных репозиториев.

Для другого проекта укажите путь относительно `packages/book-builder/`:

```sh
npm run build -w @active-book/book-builder -- ../../tests/fixtures/multipage-book
```

Reader — статическое браузерное приложение: размещайте весь `dist-book/` на HTTP/HTTPS,
включая `app/`, ресурсы и `vendors/dotlottie-player.wasm`. Открытие HTML через `file://`
не поддерживается. Production reader не требует Node.js на стороне читателя.

## Проверки

Сначала установите зависимости и соберите core по инструкции выше.

```sh
npm run typecheck
npm run typecheck:test
npm run test:unit
npm run test:component
npm run test:scripts
npm run build:editor
npm run build:book
```

| Команда | Назначение |
| --- | --- |
| `test:unit` | Vitest, Node.js, unit-тесты в apps/packages |
| `test:component` | React Testing Library и jsdom; без эмуляции настоящей геометрии/медиа |
| `test:browser` | Настоящий Chromium, Vitest Browser Mode |
| `test:scripts` | Реальный npm: локальная ссылка core и отдельная упаковка |
| `test:runtime` | Интеграция редактора, сборщика и production reader в Chromium |
| `test:media:runtime` / `test:media:workflow` | Медиа в reader и полный workflow редактора |
| `test:tgz:workflow` | Импорт TGZ-библиотек и сборка reader |
| `test:all` | Все перечисленные наборы в согласованном порядке |
| `test` / `test:coverage` | Три проекта Vitest / отчёты V8 в coverage; отдельные Node workflows сюда не входят |
| `test:ci` | Те же Vitest-проекты, coverage и JUnit; CI как сервис не настроен |
| `lint:ts:check` / `lint:css:check` | Существующие ESLint/Stylelint без исправлений |

Browser suites требуют установленного Chromium:

```sh
npx playwright install chromium
npm run test:browser
npm run test:runtime
```

Linux: при отсутствии системных библиотек используйте `npx playwright install --with-deps chromium`.
Если браузер уже установлен, можно задать путь (POSIX shell):

```sh
PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH=/usr/bin/chromium npm run test:browser
```

PowerShell:

```powershell
$env:PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH = 'C:\path\to\chrome.exe'
npm run test:browser
Remove-Item Env:PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH
```

При ошибке загрузки браузера не заменяйте browser suite на jsdom.
`test:all` запускает runtime/build workflows последовательно: они могут писать один `dist-book/`.
Не запускайте эти workflows одновременно вручную. Тесты UI-проектов находятся в apps/packages,
их APIs импортируются из `vitest`; Node-инфраструктура находится в корневом `tests/`.

В исходниках есть известный долг ESLint. Также известен geometry failure в
`EditorScreen.browser.test.tsx:216` из-за сравнения дробной геометрии.
Они рассматриваются отдельно от ошибок установки; не используйте массовый autofix
или обновление screenshot references для их сокрытия. Полный `check` включает линтеры
и потому может завершаться ошибкой. `lint:ts`/`lint:css` изменяют файлы, варианты `:check` — нет.

## Структура

- `apps/editor/` — UI редактора, TipTap, проекты, эффекты и предпросмотр.
- `apps/book-runtime/` — исходники production reader.
- `packages/book-builder/` — подготовка документа, CLI, Vite-сборка и dev-server API.
- `example-book/` — небольшой демонстрационный проект и готовая тестовая библиотека.
- `tests/` — интеграционные сценарии, фикстуры и инфраструктура.
- `scripts/` — упаковка core и координация тестов.
- `dist-book/`, `apps/editor/dist/` — генерируемые результаты, не исходники.

В проекте нет нового общего workspace для соседних репозиториев: используются только
существующие workspaces editor и локальные npm-зависимости.

[Модель многостраничной книги](docs/multipage-books.md),
[интеграционные тесты эффектов](tests/editor-effects/README.md),
[DOM-регионы и история решений](docs/story-regions-finalization.md).
Технические отчёты экспериментов сохранены как история реализации; их старые версии
пакетов и результаты прогонов не являются инструкцией актуальной установки.
[Общие соглашения](https://github.com/KrimsonKing1337/active-book-common/blob/main/CODING_CONVENTIONS.md), [инструкции для агентов](AGENTS.md).

### Аудио в проекте и собранной книге

Проект хранит все декларации в `book.json` в корневом массиве `audioEffects`.
Одна декларация может ссылаться на ID страницы или на один или несколько
позиционных диапазонов. Builder проверяет данные и наличие локальных файлов,
кодирует сегменты пути для reader и использует существующую папку `assets/`.
Несколько эффектов могут ссылаться на один упакованный файл. Незавершённый
путь можно сохранить в проекте и дописать после повторного открытия. При сборке
путь должен указывать на поддерживаемый источник.

Текущие настройки аудио в редакторе изменяют декларации выбранной страницы.
Диапазонное аудио поддерживают движок и сборщик. Редактор сохраняет диапазонные
декларации из `book.json`, а полноценное управление диапазонами через интерфейс
отложено до отдельной работы над каталогом эффектов произведения. Удаление
страницы блокируется, если из-за него диапазон выйдет за пределы книги.

Редактор запускает предпрослушивание выбранного файла вручную. Чтобы проверить
авторские задержки, остановку и переходы, соберите и откройте книгу в reader.
Для прямого входа задайте `?page=<ID>`.

[Модель и примеры авторского аудио](https://github.com/KrimsonKing1337/active-book-types/blob/main/docs/audio-effects.md)

[Воспроизведение в reader и примеры в аудиолаборатории](https://github.com/KrimsonKing1337/active-book-core/blob/main/docs/book-audio.md)
