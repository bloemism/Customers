import { useState, useEffect } from 'react';

// デバウンスフック
export const useDebounce = <T>(value: T, delay: number): T => {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
};

// 検索用のデバウンスフック
export const useSearchDebounce = (searchTerm: string, delay: number = 300) => {
  return useDebounce(searchTerm, delay);
};

