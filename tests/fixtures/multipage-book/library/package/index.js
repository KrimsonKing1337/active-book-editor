if (globalThis.__fixtureLibraryGate) await globalThis.__fixtureLibraryGate;

const React = globalThis.__ACTIVE_BOOK_HOST__.react;

export const Badge = ({ book }) => {
  const [count, setCount] = React.useState(0);
  const { audio: first } = book.hooks.useAudioController('audio-alpha');
  const { audio: second } = book.hooks.useAudioController('audio-beta');
  const [ready, setReady] = React.useState({ alpha: false, beta: false });

  React.useEffect(() => {
    const sample = () => setReady({
      alpha: first?.state() === 'loaded',
      beta: second?.state() === 'loaded',
    });
    sample();
    const timer = setInterval(() => {
      sample();
      if (![first, second].some((audio) => audio?.state() === 'loading')) clearInterval(timer);
    }, 20);
    return () => clearInterval(timer);
  }, [first, second]);

  return React.createElement('button', {
    'data-testid': 'custom-badge',
    'data-audio-alpha': String(ready.alpha),
    'data-audio-beta': String(ready.beta),
    onClick: () => setCount((previous) => previous + 1),
  }, `Кастомная вставка: ${count}`);
};

export const Overlay = () => React.createElement('div', {
  'data-testid': 'custom-effect',
  style: { position: 'absolute', inset: 0, border: '2px dotted white' },
});

export const Native = ({ id, params, ref }) => {
  const [token] = React.useState(() => globalThis.crypto.randomUUID());
  const [count, setCount] = React.useState(0);
  React.useImperativeHandle(ref, () => ({
    play: () => setCount((previous) => previous + 1),
    pause: () => {},
    stop: () => setCount(0),
  }), []);
  React.useEffect(() => {
    const increment = () => setCount((previous) => previous + 1);
    window.addEventListener('increment-native', increment);
    return () => window.removeEventListener('increment-native', increment);
  }, []);
  return React.createElement('output', {
    'data-testid': 'native-visual',
    'data-instance': token,
    'data-effect': id,
    'data-params': JSON.stringify(params),
    style: { color: params.custom?.color },
  }, String(count));
};
