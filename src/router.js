// Hash routing. Accepts "#/ticket/cx-1024/staff" and the artifact-safe "#ticket.cx-1024.staff".
export function parseHash(hash) {
  const raw = (hash || '').replace(/^#\/?/, '');
  const [path, query] = raw.split('?');
  const parts = path.split(/[/.~]/).filter(Boolean);
  const q = Object.fromEntries(new URLSearchParams(query || ''));
  return { parts, q };
}

export const go = (path) => {
  const target = path.startsWith('#') ? path : `#${path}`;
  if (window.location.hash === target) window.dispatchEvent(new HashChangeEvent('hashchange'));
  else window.location.hash = target;
};

export function useRoute() {
  const [hash, setHash] = React.useState(window.location.hash);
  React.useEffect(() => {
    const on = () => setHash(window.location.hash);
    window.addEventListener('hashchange', on);
    return () => window.removeEventListener('hashchange', on);
  }, []);
  return parseHash(hash);
}
