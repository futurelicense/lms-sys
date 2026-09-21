import Spinner from '../Spinner';
import EmptyState from '../EmptyState';
import ErrorState from '../ErrorState';
import styles from './DataTable.module.css';

/**
 * Presentational table. Sorting/pagination state is owned by the caller so the
 * same component works for both server-side and client-side data sets.
 *
 * columns: [{ key, header, render?, sortable?, width? }]
 */
export const DataTable = ({
  columns = [],
  rows = [],
  rowKey = (row) => row.id,
  isLoading = false,
  error = null,
  onRetry,
  onRowClick,
  sort = null,
  onSortChange,
  emptyTitle = 'No records found',
  emptyDescription,
  emptyAction,
}) => {
  const renderState = (content) => (
    <tbody>
      <tr>
        <td className={styles.stateCell} colSpan={columns.length}>
          {content}
        </td>
      </tr>
    </tbody>
  );

  const toggleSort = (key) => {
    if (!onSortChange) return;
    const direction = sort?.key === key && sort.direction === 'asc' ? 'desc' : 'asc';
    onSortChange({ key, direction });
  };

  return (
    <div className={styles.container}>
      <table className={`${styles.table} ${onRowClick ? styles.clickable : ''}`}>
        <thead>
          <tr>
            {columns.map((column) => (
              <th
                key={column.key}
                style={{ width: column.width }}
                scope="col"
                aria-sort={
                  sort?.key === column.key
                    ? sort.direction === 'asc'
                      ? 'ascending'
                      : 'descending'
                    : undefined
                }
              >
                {column.sortable ? (
                  <button
                    type="button"
                    className={styles.sortable}
                    onClick={() => toggleSort(column.key)}
                  >
                    {column.header}
                    <span aria-hidden="true">
                      {sort?.key === column.key ? (sort.direction === 'asc' ? '^' : 'v') : ''}
                    </span>
                  </button>
                ) : (
                  column.header
                )}
              </th>
            ))}
          </tr>
        </thead>

        {isLoading &&
          renderState(
            <div className="u-p-4 u-flex u-justify-center">
              <Spinner />
            </div>,
          )}
        {!isLoading && error && renderState(<ErrorState error={error} onRetry={onRetry} />)}
        {!isLoading &&
          !error &&
          rows.length === 0 &&
          renderState(
            <EmptyState title={emptyTitle} description={emptyDescription} action={emptyAction} />,
          )}

        {!isLoading && !error && rows.length > 0 && (
          <tbody>
            {rows.map((row) => (
              <tr key={rowKey(row)} onClick={onRowClick ? () => onRowClick(row) : undefined}>
                {columns.map((column) => (
                  <td key={column.key}>{column.render ? column.render(row) : row[column.key]}</td>
                ))}
              </tr>
            ))}
          </tbody>
        )}
      </table>
    </div>
  );
};

export default DataTable;
