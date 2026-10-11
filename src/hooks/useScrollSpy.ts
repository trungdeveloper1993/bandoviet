import { useEffect, useState } from 'react';

/**
 * Returns the id of the section the user is currently reading: the last
 * section whose top has scrolled above `lineRatio` of the viewport height.
 */
export function useScrollSpy(ids: string[], lineRatio = 0.4): string {
  const [active, setActive] = useState(ids[0] ?? '');
  const key = ids.join(',');

  useEffect(() => {
    const list = key.split(',').filter(Boolean);
    if (!list.length) return;

    let frame = 0;
    const update = () => {
      const line = window.innerHeight * lineRatio;
      let current = list[0];
      for (const id of list) {
        const el = document.getElementById(id);
        if (el && el.getBoundingClientRect().top <= line) current = id;
      }
      setActive(current);
    };
    const onScroll = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(update);
    };

    update();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
    };
  }, [key, lineRatio]);

  return active;
}
