import { useCallback, useState } from 'react';

export const useModal = (initialOpen = false) => {
  const [isOpen, setIsOpen] = useState(initialOpen);
  const [payload, setPayload] = useState(null);

  const open = useCallback((data = null) => {
    setPayload(data);
    setIsOpen(true);
  }, []);

  const close = useCallback(() => {
    setIsOpen(false);
    setPayload(null);
  }, []);

  return { isOpen, payload, open, close, toggle: () => setIsOpen((v) => !v) };
};

export default useModal;
