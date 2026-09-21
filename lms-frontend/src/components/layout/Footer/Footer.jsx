import appConfig from '../../../config/appConfig';
import styles from './Footer.module.css';

export const Footer = () => (
  <footer className={styles.footer}>
    <span>
      &copy; {new Date().getFullYear()} {appConfig.name}
    </span>
    <span>v{__APP_VERSION__}</span>
  </footer>
);

export default Footer;
