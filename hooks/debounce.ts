import { useEffect, useState } from "react";

type UseDebouncer = (
  v: string,
  t?: number,
) => [string, (v: string) => void, string];

export const useDebouncer: UseDebouncer = (initialValue = "", time = 500) => {
  const [value, setValue] = useState(initialValue);
  const [debounced, setDebounced] = useState(initialValue);

  useEffect(() => {
    const handler = setTimeout(() => setDebounced(value), time);
    return () => clearTimeout(handler);
  }, [value, time]);

  return [value, setValue, debounced];
};
