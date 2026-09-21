import { useEffect, useState } from 'react';
import appConfig from '../config/appConfig';

/** Returns `value` only after it has stopped changing for `delay` ms. */
export const useDebounce = (value, delay = appConfig.debounceMs) => {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);

  return debounced;
};

export default useDebounce;
