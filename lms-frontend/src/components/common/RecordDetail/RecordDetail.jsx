import { DASH } from './recordDetailUtils';
import styles from './RecordDetail.module.css';

/**
 * Building blocks for a record detail page — the fact lists and field pairs
 * shared by the learner and instructor pages.
 *
 * Lifted out of the students feature so instructors use the same layout without
 * importing across features.
 */

/** A label/value row inside a <dl>. Renders an em dash rather than a blank gap. */
export const Fact = ({ label, children }) => (
  <>
    <dt>{label}</dt>
    <dd>{children ?? DASH}</dd>
  </>
);

/** A stacked label/value pair, for use outside a definition list. */
export const Field = ({ label, value }) => (
  <div>
    <div className={styles.fieldLabel}>{label}</div>
    <div className={styles.contactMeta}>{value || DASH}</div>
  </div>
);
