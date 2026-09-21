import { useState } from 'react';
import { initials } from '../../../utils/formatUtils';
import styles from './Avatar.module.css';

export const Avatar = ({ src, name = '', size = 'md', className = '' }) => {
  const [failed, setFailed] = useState(false);
  const showImage = src && !failed;

  return (
    <span className={`${styles.avatar} ${styles[size]} ${className}`} title={name}>
      {showImage ? (
        <img className={styles.image} src={src} alt={name} onError={() => setFailed(true)} />
      ) : (
        initials(name) || '?'
      )}
    </span>
  );
};

export default Avatar;
