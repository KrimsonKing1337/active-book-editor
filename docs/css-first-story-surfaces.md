# CSS-first размещение визуальных эффектов

Ветка `experiment/css-first-story-surfaces`, база `experiment/persistent-story-viewport`. Реализация использует собранный core **0.0.50** и `@active-book/types` **0.0.2**. Исторические отчёты соседних экспериментов не являются описанием текущего контракта.

[Полный отчёт ядра: DOM-схема, удалённые модули, демонстрации, замеры и исключения](https://github.com/KrimsonKing1337/active-book-core/blob/experiment/css-first-story-surfaces/docs/css-first-story-surfaces.ru.md).

## Разделение ревью

1. `c9112f6`: селекторы после переименований StoryShell/StoryRoot, dependency 0.0.48.
2. `484e1fe`: builder, canonical placement/depth, валидация и JSON fixtures. Без новой панели.
3. `2f829f4`: одна общая панель Background/Frame, native TGZ handles, проверки UI; установлен окончательный core 0.0.50.
4. `2f72e49`: только удаление trailing whitespace, добавленного lint-staged.
5. `ec57d98`: отдельный фикс перехода из unmasked draft в frame — четыре стороны видны по умолчанию. Регион frame имеет присущую ему маску, поэтому её включение не отключается отдельным чекбоксом.
6. Документация и результаты проверок.

## Контракт и панель

Обычное заполнение: `placement: { region: 'storyViewport' }`. Все регионы: application, story, storyViewport, narrativeFrame, frame, narrativeViewport, narrativeContent. Регион соответствует настоящему DOM-parent; frame означает стороны narrativeFrame.

Панель переиспользуется для всех визуальных реализаций: region, layer, девять anchors, origin, смешанные px/% offsets/size, scale, rotate, order. «Заполнить область» оставляет только region. Стандартные числа записываются при каждом валидном изменении; Ctrl+S сохраняет значение до blur. Якорь поверхности независим от художественного origin рисунка.

`placement` и `depth` находятся на верхнем уровне временного panel draft и сериализуются в соответствующие поля effect. Непрозрачные custom params и package/name references сохраняются отдельно. Нет дублирующего displayRegion и обратного кодирования порядка в style.zIndex. Предыдущая маска сохраняется при обычных правках, frameMask меняет только native sides. Произвольный clip-path хранится в visibility.mask.

Builder принимает минимальный region, необязательные anchor/origin/offset/size/scale/rotate, необязательную visibility и depth.order. Старые coordinates/anchor-object/visibility.region отклоняются. Runtime-миграция старого экспериментального JSON не добавлена.

Renderer из реального TGZ получает разрешённые `regions: Readonly<Record<VisualRegion, HTMLElement | null>>`; frame алиасит narrativeFrame. Он может владеть своим Canvas/WebGL и измерять конкретные элементы. Общего geometry snapshot и восстановления animation state нет. UI library-specific параметров не добавлен.

## Проверки

- `npm run typecheck`: workspaces и test TS — проходят.
- `npm run test:unit`: 61 tests — проходят. Четыре теста удалённого style-layer helper больше не применимы; round-trip и validation нового контракта проверены.
- `npm run test:component`: 4 tests — проходят.
- `PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH=/usr/bin/chromium npm run test:browser`: 13 tests — проходят. Старые composition screenshot goldens не менялись.
- `npm run test:runtime`: production edit/save/reopen/reorder/add/delete/build + native TGZ + собранный reader — проходит.
- `npm run build:editor` — проходит.
- ESLint/Stylelint затронутого кода: ошибок нет, max-lines warnings сохранены.

Browser tests проверяют реальный размер регионов и выделение, неподвижный viewport, живые DOM handles у TGZ, независимые сессии, lifecycle, редактирование/историю и сохранение mixed units/transform/layer при фокусе в числовом поле. Явное изменение региона переносит portal в другой parent и может перемонтировать renderer; изменение параметров/слоя и навигация внутри активного диапазона сохраняют его.

Core TGZ пересобран через `npm run core:package`, версия и lockfile editor обновлены. SHA256 установленного и собранного VisualSurfaces.js совпадает; старых geometry/layout модулей в пакете нет. Тарболлы остаются локальными ignored build artifacts; для новой сборки используйте этот же helper, который намеренно поднимает версию и меняет dependency/integrity. Не подменяйте содержимое архива под старой версией.

Вне изменений: branching, lazy TGZ (#53), video issue core #30, physical layout engine, аппаратные тесты iOS/Android. Build предупреждает о крупных JS chunks; code splitting не менялся.
