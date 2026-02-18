import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import './NotFoundPage.scss';

const NotFoundPage = () => {
  const { t } = useTranslation();
  return (
    <div className="not-found-page">
      <div className="not-found-content">
        <h1 className="error-code">404</h1>
        <h2>{t('errorPages.notFoundTitle')}</h2>
        <p>{t('errorPages.notFoundSubtitle')}</p>
        <Link to="/dashboard" className="btn btn-primary">
          {t('errorPages.backToDashboard')}
        </Link>
      </div>
    </div>
  );
};

export default NotFoundPage;
