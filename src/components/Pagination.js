import React from 'react';
import styles from './Pagination.module.css';

export default function Pagination({ page, pages, total, limit = 25, onPageChange }) {
  if (!pages || pages <= 1) return null;

  const start = Math.min((page - 1) * limit + 1, total);
  const end   = Math.min(page * limit, total);

  const getPageNums = () => {
    if (pages <= 7) return Array.from({ length: pages }, (_, i) => i + 1);
    if (page <= 4)       return [1, 2, 3, 4, 5, '…', pages];
    if (page >= pages - 3) return [1, '…', pages - 4, pages - 3, pages - 2, pages - 1, pages];
    return [1, '…', page - 1, page, page + 1, '…', pages];
  };

  return (
    <div className={styles.pagination}>
      <span className={styles.paginationInfo}>
        Showing {start}–{end} of {total}
      </span>
      <div className={styles.paginationControls}>
        <button
          className={styles.paginationBtn}
          onClick={() => onPageChange(page - 1)}
          disabled={page === 1}
        >
          ‹ Prev
        </button>
        {getPageNums().map((n, i) =>
          n === '…' ? (
            <span key={`e${i}`} className={styles.paginationEllipsis}>…</span>
          ) : (
            <button
              key={n}
              className={`${styles.paginationBtn} ${n === page ? styles.paginationActive : ''}`}
              onClick={() => onPageChange(n)}
            >
              {n}
            </button>
          )
        )}
        <button
          className={styles.paginationBtn}
          onClick={() => onPageChange(page + 1)}
          disabled={page === pages}
        >
          Next ›
        </button>
      </div>
    </div>
  );
}
