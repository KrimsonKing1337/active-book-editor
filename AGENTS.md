# active-book-editor — инструкции для ИИ-агентов

Перед работой обязательно прочитайте:

1. `../active-book-common/AGENTS.md` — общий порядок работы агента.
2. `../active-book-common/CODING_CONVENTIONS.md` — соглашения для разработчиков по коду, структуре каталогов и тестам.
3. Локальные разделы ниже — технические ограничения этого репозитория.

Не дублируйте общие правила написания кода в `AGENTS.md`: их источник истины — `active-book-common/CODING_CONVENTIONS.md`.
Сохраняйте корректность локальных контрактов и объясняйте любые необходимые исключения.

## Проверки и локальная разработка

Быстрые проверки: `npm run typecheck`, `npm run typecheck:test`, `npm run lint:ts:check`, `npm run lint:css:check`, `npm run test:unit`, `npm run test:component`, `npm run test:scripts`.
Браузерные проверки запускайте отдельно через `npm run test:browser`.
Конфигурации сборки, тестов, алиасы и workspaces относятся к этому репозиторию.
Редактор использует `@active-book/core: file:../active-book-core`. После установки common/types/core соберите core до `npm ci` в editor. `npm run core:build` пересобирает связанное ядро; перезапустите dev-сервер после сборки. `npm run core:package` выполняет build и packaging в core для проверки архива, не устанавливает его и не меняет зависимость редактора или версии.
