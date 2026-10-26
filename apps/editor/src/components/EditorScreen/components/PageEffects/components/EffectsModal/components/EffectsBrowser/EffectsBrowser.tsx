import type { ChangeEvent, KeyboardEvent } from 'react';

import type {
  AudioOptions,
  BackgroundEffectKind,
  SideEffectKind,
} from '@active-book/book-builder/effects';

import type { EffectCategory, GroupingMode } from '../../catalog';

import { Select, TextInput } from '../../../EffectControls';
import {
  EFFECT_CATEGORIES,
  getCategoryDefinition,
  getEffectGroup,
  getEffectPath,
  getFilteredEffects,
} from '../../catalog';

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

  const filteredEffects = getFilteredEffects({
    effects,
    category,
    group,
    query: search,
  });
  const isSearching = search.trim().length > 0;
  const hasAvailableGroups = availableGroups.length > 1;
  const showGroups = Boolean(
    category
    && !group
    && grouping === 'type'
    && hasAvailableGroups
    && !isSearching
  );
  const showCategories = !category && !isSearching;
  const showEffects = !showCategories && !showGroups;

  const handleSearchChange = (e: ChangeEvent<HTMLInputElement>) => {
    onSearchChange(e.target.value);
  };

  const handleSearchKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key !== 'Escape') {
      return;
    }

    if (search) {
      e.preventDefault();
      e.stopPropagation();

      onSearchChange('');

      return;
    }

    e.currentTarget.blur();
  };

  const handleGroupingChange = (e: ChangeEvent<HTMLSelectElement>) => {
    onGroupingChange(e.target.value as GroupingMode);
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

  const selectedGroup = availableGroups.find((cur) => cur.value === group);
  const searchScope = selectedGroup?.label ?? categoryDefinition?.label;

  const searchPlaceholder = searchScope
    ? `Поиск в ${searchScope}…`
    : 'Поиск по всем эффектам…';

  const emptyMessage = isSearching
    ? 'По запросу ничего не найдено'
    : 'В этом разделе пока нет эффектов';

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
          {EFFECT_CATEGORIES.map((categoryCur) => {
            const {
              value,
              label,
              description,
            } = categoryCur;

            const count = effects.filter((cur) => cur.type === value).length;

            const handleOpenCategory = () => {
              onCategoryChange(value);
            };

            return (
              <button
                key={value}
                type="button"
                className={styles.FolderTile}
                onClick={handleOpenCategory}
              >
                <span className={styles.Kind}>
                  Категория
                </span>

                <strong>
                  {label}
                </strong>

                <span className={styles.Source}>
                  {description}
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
          {availableGroups.map((groupCur) => {
            const { value, label } = groupCur;

            const count = effects.filter((effectCur) => {
              return effectCur.type === category && getEffectGroup(effectCur) === value;
            }).length;

            const handleOpenGroup = () => {
              onGroupChange(value);
            };

            return (
              <button
                key={value}
                type="button"
                className={styles.FolderTile}
                onClick={handleOpenGroup}
              >
                <span className={styles.Kind}>
                  Тип эффекта
                </span>

                <strong>
                  {label}
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
              {emptyMessage}
            </div>
          )}

          <div className={styles.Tiles}>
            {filteredEffects.map((effectCur) => {
              const path = !category ? getEffectPath(effectCur) : undefined;

              return (
                <EffectTile
                  key={effectCur.id}
                  effect={effectCur}
                  path={path}
                  onSelect={handleSelectEffect}
                />
              );
            })}

            {!isSearching && categoryDefinition && availableGroups.map((groupCur) => {
              const { value, addLabel } = groupCur;

              if (group && value !== group) {
                return null;
              }

              const handleAdd = () => {
                addEffect(categoryDefinition.value, value);
              };

              return (
                <AddTile key={value} label={addLabel} onClick={handleAdd} />
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
