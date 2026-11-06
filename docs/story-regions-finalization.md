# Финальные CSS-first регионы в editor и builder

Ветка `experiment/story-regions-finalization`, база `experiment/css-first-story-surfaces`. Используется собранный core **0.0.52**, types **0.0.3**. Старые экспериментальные ветки и main не изменены; merge не выполнялся.

[Полный отчёт ядра: DOM, демонстрации, CSS/WAAPI, loader, проверки и оценка готовности](https://github.com/KrimsonKing1337/activeBook-react-core-next/blob/experiment/story-regions-finalization/docs/story-regions-finalization.ru.md).

## Модель

Все девять VisualRegion — настоящие прямоугольники: application, story, storyViewport, storyViewportFrame, narrativeFrame, narrativeViewport, narrativeContent, toolbar, toolbarFrame. Frame alias удалён. storyViewportFrame включает весь viewport и Toolbar; toolbarFrame включает padding панели; toolbar — её содержимое. Внутренняя панель имеет естественную высоту и flex-wrap.

Placement определяет регион, visibility.sides/frameWidth — рамочную маску, depth.plane/order — независимый порядок. frameWidth допускает единую толщину или отдельные значения top/right/bottom/left в px/%. Без sides Frame-регион тоже заполняется полностью. Выбор рамочных presets в UI может включить стороны; маску можно удалить, сохранив область.

VisualLayout передаёт placement/depth/visibility как canonical metadata. У FrameOptions больше нет layer/frameMask; новый эффект сразу получает depth вместо style.zIndex. Builder отклоняет frame и неверную толщину маски, сохраняет opaque custom params и не вводит миграций. Внутренний z-index custom artwork не является порядком surface.

Общая панель Background/Frame содержит девять областей, стороны маски и переключатель единой/раздельной толщины, plane/order, anchor/origin, offsets/size/transform. Кнопка сброса размещения не изменяет маску. Маски клонируются и редактируются независимо после дублирования. LayoutSettings и FrameSideCheckboxes вынесены из FrameSettings в собственные директории отдельным рефакторингом.

## Проверки

- Workspaces/test TypeScript — проходят.
- 61 unit, 4 component, 14 Chromium browser — проходят.
- Linux composition screenshot проверен и обновлён для естественной высоты Toolbar. Windows reference требует повторного снимка/проверки на Windows.
- Реальный native TGZ получает все девять HTMLElement/null handles.
- Browser UI: region → mask preset → width → layer → duplicate → save/reopen → remove mask; копия сохраняет свою маску. Ctrl+S при фокусе в числовом поле сохраняет значение.
- Production runtime: импорт проекта с TGZ, редактирование/сохранение/переоткрытие, reorder/add/delete, экспорт и reader. Созданный toolbarFrame с маской 8px проверяется в готовой книге по host, bounding box и native maskImage.
- build:editor проходит. ESLint/Stylelint затронутого кода без ошибок; max-lines и chunk-size warnings остаются.

Новый TGZ установлен с новой версией и integrity. Для повторной локальной сборки `npm run core:package` намеренно поднимает версию снова; не подменяйте содержимое старого архива. Исходники editor не алиасят установленный пакет ядра.

Результат готов для финального review; main требует согласования всей цепочки экспериментов и ручных платформенных проверок. Аппаратные iOS/Android, video core #30 и lazy TGZ #53 не входят в эту задачу.
