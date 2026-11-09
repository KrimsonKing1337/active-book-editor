# Исправление регрессий регионов

База `experiment/story-regions-finalization` (`b926bb5`), новая ветка `fix/story-regions-test-regressions`. Main и прежние ветки не менялись, merge не выполнялся.

Смена региона теперь обновляет только placement. VisualRegionSettings больше не включает автоматически все стороны при выборе storyViewportFrame/toolbarFrame: сохраняются выбранные стороны, четыре авторские толщины, depth, отключённая и явно пустая маска. Создание новых Frame/Background сохраняет исходные defaults; маска включается отдельным control.

Добавлен отсутствовавший в удалённой ветке тест `switching frame regions preserves custom side widths and the selected sides`, а также отключённая/пустая маска. Все три воспроизводили потерю состояния до исправления. Browser проверяет переключения регионов, дублирование, сохранение/переоткрытие и независимость копии. В старом сценарии `shared placement controls save transforms, layer and mixed units while focused` locator искал переименованную кнопку «Заполнить область»; теперь ищет «Сбросить размещение» и по-прежнему проверяет результат reset.

Установлен новый настоящий **core 0.0.53 TGZ** с новой integrity; types остаются **0.0.3**. Сравнение байтов установленных и собранных VisualSurface, FrameEffects/utils, StoryRoot и AppWrapper SCSS подтвердило актуальность пакета. Не относящиеся к обновлению изменения libc metadata в lockfile не включены.

Production runtime явно включает маску, задаёт 8px/16px/11px/4%, отключает низ, сохраняет проект и проверяет готовый reader после export/build. Проверяются host/bounds, native maskImage с индивидуальными значениями и отсутствие градиента отключённой стороны. Поиск «Снизу» ограничен группой «Маска сторон», отдельно от сторон художественного FrameShadow.

Проверки:

- TypeScript всех workspaces/tests, включая runtime script — проходит.
- Полный npm test: **83 passed** — 62 unit, 7 component, 14 browser.
- build:editor с core 0.0.53 — проходит.
- Production reader runtime — **1 passed**.
- ESLint изменённых TS/TSX: 0 errors, 2 max-lines warnings; JS/scripts исключены конфигурацией.
- Полный Stylelint — проходит.
- Полный ESLint выполнен, но остаётся **8 прежних errors / 36 warnings** в неизменённых файлах: CustomComponentsWarningModal, FrameMaskSettings, resolveBackgroundPreview, visualEffects.test.ts. Правила не отключались, массовое форматирование не выполнялось.

Коммиты: `0491494` — production fix и регрессии масок; `fe15449` — reset locator; `6eca355` — новый TGZ; `b93e469` — форматирование новых assertions; `a492ec4` — проверка асимметричной маски в готовом reader. Документация отдельным коммитом.

[Полный русский отчёт: все восемь записей о падении, первопричины, исходные ошибки, проверки core и ограничения](https://github.com/KrimsonKing1337/active-book-core/blob/fix/story-regions-test-regressions/docs/story-regions-test-regressions.ru.md).

Прогоны выполнены в Linux/Chromium. Windows runner, его screenshots и аппаратные iOS/Android здесь не проверены. Перед main требуется Windows-прогон и отдельное решение по существующим общим lint errors. Vite chunk-size warning сохранён. Types не менялись, их три проверки проходят; отдельный types PR не требуется.
