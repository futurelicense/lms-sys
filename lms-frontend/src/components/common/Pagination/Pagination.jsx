import appConfig from '../../../config/appConfig';
import styles from './Pagination.module.css';

/** Builds a compact page list: 1 ... 4 5 6 ... 20 */
const buildPages = (current, total, span = 1) => {
  const pages = new Set([1, total]);
  for (let i = current - span; i <= current + span; i += 1) {
    if (i > 1 && i < total) pages.add(i);
  }
  const sorted = [...pages].sort((a, b) => a - b);
  return sorted.flatMap((page, index) =>
    index > 0 && page - sorted[index - 1] > 1 ? ['gap', page] : [page],
  );
};

export const Pagination = ({
  page,
  pageSize,
  totalItems,
  totalPages,
  onPageChange,
  onPageSizeChange,
  pageSizeOptions = appConfig.pageSizeOptions,
}) => {
  if (totalItems === 0) return null;
  const from = (page - 1) * pageSize + 1;
  const to = Math.min(page * pageSize, totalItems);

  return (
    <nav className={styles.wrapper} aria-label="Pagination">
      <span className={styles.summary}>
        {from}-{to} of {totalItems}
      </span>
      <div className={styles.pages}>
        <button
          type="button"
          className={styles.page}
          onClick={() => onPageChange(page - 1)}
          disabled={page <= 1}
        >
          &lsaquo;
        </button>
        {buildPages(page, totalPages).map((item, index) =>
          item === 'gap' ? (
            <span key={`gap-${index}`} className={styles.summary}>
              &hellip;
            </span>
          ) : (
            <button
              key={item}
              type="button"
              className={`${styles.page} ${item === page ? styles.active : ''}`}
              onClick={() => onPageChange(item)}
              aria-current={item === page ? 'page' : undefined}
            >
              {item}
            </button>
          ),
        )}
        <button
          type="button"
          className={styles.page}
          onClick={() => onPageChange(page + 1)}
          disabled={page >= totalPages}
        >
          &rsaquo;
        </button>
      </div>
      {onPageSizeChange && (
        <select
          className={styles.sizeSelect}
          value={pageSize}
          onChange={(event) => onPageSizeChange(Number(event.target.value))}
          aria-label="Rows per page"
        >
          {pageSizeOptions.map((size) => (
            <option key={size} value={size}>
              {size} / page
            </option>
          ))}
        </select>
      )}
    </nav>
  );
};

export default Pagination;
