import { Button } from '../../../EffectControls';

import styles from '../../EffectsModal.module.scss';

type HeaderProps = {
  title: string;
  description: string;
  isCollapsed: boolean;
  showBackButton: boolean;

  onBack: () => void;
  onToggleCollapsed: () => void;
  onClose: () => void;
};

export const Header = ({
  title,
  description,
  isCollapsed,
  showBackButton,
  onBack,
  onToggleCollapsed,
  onClose,
}: HeaderProps) => {
  const collapseButtonAriaLabel = isCollapsed ? 'Развернуть окно' : 'Свернуть окно';
  const collapseButtonLabel = isCollapsed ? '▢' : '−';

  return (
    <div className={styles.Header}>
      {showBackButton && (
        <Button className={styles.Back} type="button" onClick={onBack}>
          ← Назад
        </Button>
      )}

      <div className={styles.Title}>
        <h2>
          {title}
        </h2>

        {!isCollapsed && (
          <p>
            {description}
          </p>
        )}
      </div>

      <Button
        className={styles.Close}
        type="button"
        aria-label={collapseButtonAriaLabel}
        onClick={onToggleCollapsed}
      >
        {collapseButtonLabel}
      </Button>

      <Button
        className={styles.Close}
        type="button"
        onClick={onClose}
        aria-label="Закрыть"
      >
        ×
      </Button>
    </div>
  );
};
