import { useCallback, useMemo, useState } from 'react';
import appConfig from '../config/appConfig';

export const usePagination = ({
  initialPage = 1,
  initialPageSize = appConfig.defaultPageSize,
} = {}) => {
  const [page, setPage] = useState(initialPage);
  const [pageSize, setPageSize] = useState(initialPageSize);
  const [totalItems, setTotalItems] = useState(0);

  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));

  const goToPage = useCallback(
    (next) => setPage(Math.min(Math.max(1, next), totalPages)),
    [totalPages],
  );

  const changePageSize = useCallback((size) => {
    setPageSize(size);
    setPage(1);
  }, []);

  return useMemo(
    () => ({
      page,
      pageSize,
      totalItems,
      totalPages,
      setTotalItems,
      goToPage,
      changePageSize,
      next: () => goToPage(page + 1),
      previous: () => goToPage(page - 1),
      queryParams: { page: page - 1, size: pageSize },
    }),
    [page, pageSize, totalItems, totalPages, goToPage, changePageSize],
  );
};

export default usePagination;
