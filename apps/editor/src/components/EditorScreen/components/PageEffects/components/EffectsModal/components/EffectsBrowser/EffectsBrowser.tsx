import type { ChangeEvent, KeyboardEvent } from 'react';

import type { AudioOptions, BackgroundEffectKind, SideEffectKind } from '@active-book/book-builder/effects';

import { Select, TextInput } from '../../../EffectControls';

import type { EffectCategory, GroupingMode } from '../../catalog';
import { EFFECT_CATEGORIES, getCategoryDefinition, getEffectPath, getFilteredEffects, getEffectGroup } from '../../catalog';

import type { EffectsModalProps } from '../../@types';

import { EffectTile } from '../EffectTile';

import styles from '../../EffectsModal.module.scss';

type EffectsBrowserProps = Pick<
  EffectsModalProps,
  | 'effects'
  | 'onAddAudio'
  | 'onAddVibration'
  | 'onAddFlashlight'
  | 'onAddBackground'
  | 'onAddSide'
  | 'onSelectEffect'
> & {
  category: EffectCategory | null;
  group: string | null;
  grouping: GroupingMode;
  search: string;
  onCategoryChange: (category: EffectCategory) => void;
  onGroupChange: (group: string) => void;
  onGroupingChange: (grouping: GroupingMode) => void;
  onSearchChange: (query: string) => void;
};

type AddTileProps = {
  label: string;
  onClick: () => void;
};

const AddTile = ({ label, onClick }: AddTileProps) => {
  return (
    <button className={styles.AddTile} type="button" onClick={onClick}>
      <span className={styles.AddIcon} aria-hidden="true">
        +
      </span>

      {label}
    </button>
  );
};

export const EffectsBrowser = ({
  effects,
  category,
  group,
  grouping,
  search,
  onAddAudio,
  onAddVibration,
  onAddFlashlight,
  onAddBackground,
  onAddSide,
  onSelectEffect,
  onCategoryChange,
  onGroupChange,
  onGroupingChange,
  onSearchChange,
}: EffectsBrowserProps) => {
  const categoryDefinition = category ? getCategoryDefinition(category) : null;
  const availableGroups = categoryDefinition?.groups ?? [];

  const filteredEffects = getFilteredEffects(effects, category, group, search);
  const isSearching = search.trim().length > 0;
  const showGroups = category && !group && grouping === 'type' && availableGroups.length > 1 && !isSearching;
  const showCategories = !category && !isSearching;
  const showEffects = !showCategories && !showGroups;

  const handleSearchChange = (event: ChangeEvent<HTMLInputElement>) => {
    onSearchChange(event.target.value);
  };

  const handleSearchKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key !== 'Escape') {
      return;
    }

    if (search) {
      event.preventDefault();
      event.stopPropagation();
      onSearchChange('');

      return;
    }

    event.currentTarget.blur();
  };

  const handleGroupingChange = (event: ChangeEvent<HTMLSelectElement>) => {
    onGroupingChange(event.target.value as GroupingMode);
  };

  const handleSelectEffect = (id: string) => {
    onSearchChange('');
    onSelectEffect(id);
  };

  const addEffect = (effectCategory: EffectCategory, effectGroup: string) => {
    if (effectCategory === 'audio') {
      onAddAudio(effectGroup as AudioOptions['type']);
    } else if (effectCategory === 'background') {
      onAddBackground(effectGroup as BackgroundEffectKind);
    } else if (effectCategory === 'side') {
      onAddSide(effectGroup as SideEffectKind);
    } else if (effectCategory === 'vibration') {
      onAddVibration();
    } else if (effectCategory === 'flashlight') {
      onAddFlashlight();
    }
  };

  const searchPlaceholder = categoryDefinition
    ? `Поиск в ${group ?? categoryDefinition.label}…`
    : 'Поиск по всем эффектам…';

  return (
    <div className={styles.Browser}>
      <div className={styles.BrowserControls}>
        <TextInput
          type="search"
          aria-label="Поиск эффектов"
          placeholder={searchPlaceholder}
          value={search}
          onChange={handleSearchChange}
          onKeyDown={handleSearchKeyDown}
        />

        {categoryDefinition && availableGroups.length > 1 && !group && (
          <label className={styles.GroupingControl}>
            <span>
              Группировка
            </span>

            <Select value={grouping} onChange={handleGroupingChange}>
              <option value="none">
                Без группировки
              </option>

              <option value="type">
                По типу
              </option>
            </Select>
          </label>
        )}
      </div>

      {showCategories && (
        <div className={styles.Tiles}>
          {EFFECT_CATEGORIES.map((current) => {
            const count = effects.filter((effect) => effect.type === current.value).length;

            const handleOpenCategory = () => {
              onCategoryChange(current.value);
            };

            return (
              <button
                key={current.value}
                type="button"
                className={styles.FolderTile}
                onClick={handleOpenCategory}
              >
                <span className={styles.Kind}>
                  Категория
                </span>

                <strong>
                  {current.label}
                </strong>

                <span className={styles.Source}>
                  {current.description}
                </span>

                <span className={styles.FolderCount}>
                  {count} эффектов
                </span>
              </button>
            );
          })}
        </div>
      )}

      {showGroups && (
        <div className={styles.Tiles}>
          {availableGroups.map((current) => {
            const count = effects.filter((effect) => {
              return effect.type === category && getEffectGroup(effect) === current.value;
            }).length;

            const handleOpenGroup = () => {
              onGroupChange(current.value);
            };

            return (
              <button
                key={current.value}
                type="button"
                className={styles.FolderTile}
                onClick={handleOpenGroup}
              >
                <span className={styles.Kind}>
                  Тип эффекта
                </span>

                <strong>
                  {current.label}
                </strong>

                <span className={styles.FolderCount}>
                  {count} эффектов
                </span>
              </button>
            );
          })}
        </div>
      )}

      {showEffects && (
        <>
          {filteredEffects.length === 0 && (
            <div className={styles.Empty}>
              {isSearching ? 'По запросу ничего не найдено' : 'В этом разделе пока нет эффектов'}
            </div>
          )}

          <div className={styles.Tiles}>
            {filteredEffects.map((effect) => {
              const path = !category ? getEffectPath(effect) : undefined;

              return (
                <EffectTile
                  key={effect.id}
                  effect={effect}
                  path={path}
                  onSelect={handleSelectEffect}
                />
              );
            })}

            {!isSearching && categoryDefinition && availableGroups.map((current) => {
              if (group && current.value !== group) {
                return null;
              }

              const handleAdd = () => {
                addEffect(categoryDefinition.value, current.value);
              };

              return (
                <AddTile key={current.value} label={current.addLabel} onClick={handleAdd} />
              );
            })}
          </div>
        </>
      )}

      {showEffects && isSearching && filteredEffects.length > 0 && (
        <p className={styles.ResultCount}>
          Найдено эффектов: {filteredEffects.length}
        </p>
      )}
    </div>
  );
};
