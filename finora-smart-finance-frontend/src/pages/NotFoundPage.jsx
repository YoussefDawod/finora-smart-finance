import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import styles from './NotFoundPage.module.scss';

const NotFoundPage = () => {
  const { t } = useTranslation();
  return (
    <div className={styles.page}>
      <div className={styles.content}>
        <h1 className={styles.errorCode}>404</h1>
        <h2>{t('errorPages.notFoundTitle')}</h2>
        <p>{t('errorPages.notFoundSubtitle')}</p>
        <Link to="/dashboard" className={styles.btn}>
          {t('errorPages.backToDashboard')}
        </Link>
      </div>
    </div>
  );
};

export default NotFoundPage;
