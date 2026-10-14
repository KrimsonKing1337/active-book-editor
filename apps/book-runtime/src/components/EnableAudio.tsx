import { useDispatch, useSelector } from 'activeBook-core/store';

import { mainActions, mainSelectors } from 'activeBook-core/store/main';

export const EnableAudio = () => {
  const dispatch = useDispatch();
  const isAudioUnlocked = useSelector(mainSelectors.isAudioUnlocked);

  const handleEnableAudio = () => {
    dispatch(mainActions.setIsAudioUnlocked(true));
  };

  if (isAudioUnlocked) {
    return null;
  }

  return (
    <button type="button" onClick={handleEnableAudio}>
      Включить звук
    </button>
  );
};
