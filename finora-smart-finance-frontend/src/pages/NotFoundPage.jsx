import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import './NotFoundPage.scss';

const NotFoundPage = () => {
  const { t } = useTranslation();
  return (
    <div className="not-found-page">
      <div className="not-found-content">
        <h1 className="error-code">404</h1>
        <h2>{t('errors.notFoundTitle')}</h2>
        <p>{t('errors.notFoundSubtitle')}</p>
        <Link to="/dashboard" className="btn btn-primary">
          {t('errors.backToDashboard')}
        </Link>
      </div>
    </div>
  );
};

export default NotFoundPage;
