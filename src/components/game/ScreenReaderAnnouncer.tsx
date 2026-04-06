import { useEffect, useRef, useState, useCallback } from 'react';

/**
 * Invisible live region that announces game events to screen readers.
 * Uses aria-live="assertive" for important events and "polite" for info.
 */
let globalAnnounce: ((msg: string, priority?: 'polite' | 'assertive') => void) | null = null;

export function announce(msg: string, priority: 'polite' | 'assertive' = 'polite') {
  globalAnnounce?.(msg, priority);
}

export default function ScreenReaderAnnouncer() {
  const [politeMsg, setPoliteMsg] = useState('');
  const [assertiveMsg, setAssertiveMsg] = useState('');
  const clearRef = useRef<ReturnType<typeof setTimeout>>();

  const handleAnnounce = useCallback((msg: string, priority: 'polite' | 'assertive' = 'polite') => {
    if (clearRef.current) clearTimeout(clearRef.current);
    if (priority === 'assertive') {
      setAssertiveMsg('');
      // Need a tick to re-announce if same message
      requestAnimationFrame(() => setAssertiveMsg(msg));
    } else {
      setPoliteMsg('');
      requestAnimationFrame(() => setPoliteMsg(msg));
    }
    // Clear after 5s so stale announcements don't linger
    clearRef.current = setTimeout(() => {
      setPoliteMsg('');
      setAssertiveMsg('');
    }, 5000);
  }, []);

  useEffect(() => {
    globalAnnounce = handleAnnounce;
    return () => { globalAnnounce = null; };
  }, [handleAnnounce]);

  const srOnly: React.CSSProperties = {
    position: 'absolute',
    width: 1,
    height: 1,
    padding: 0,
    margin: -1,
    overflow: 'hidden',
    clip: 'rect(0,0,0,0)',
    whiteSpace: 'nowrap',
    border: 0,
  };

  return (
    <>
      <div aria-live="polite" aria-atomic="true" role="status" style={srOnly}>
        {politeMsg}
      </div>
      <div aria-live="assertive" aria-atomic="true" role="alert" style={srOnly}>
        {assertiveMsg}
      </div>
    </>
  );
}
