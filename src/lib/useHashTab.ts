"use client";

import { useCallback, useEffect, useState } from "react";

/**
 * A tab that can be opened from the address: /history/#finals opens the Finals tab. Clicking a tab updates the address
 * too, so the link can be shared. `keys` are the tab keys; unknown hashes are ignored.
 */
export function useHashTab(keys: string[], first: string): [string, (key: string) => void] {
  const [tab, setTab] = useState(first);

  useEffect(() => {
    const read = () => {
      const h = window.location.hash.slice(1);
      if (keys.includes(h)) setTab(h);
    };
    const t = window.setTimeout(read, 0);
    window.addEventListener("hashchange", read);
    return () => {
      window.clearTimeout(t);
      window.removeEventListener("hashchange", read);
    };
    // `keys` is a fixed list per page
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const choose = useCallback((key: string) => {
    setTab(key);
    window.history.replaceState(null, "", `#${key}`);
  }, []);

  return [tab, choose];
}
