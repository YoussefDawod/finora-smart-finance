/**
 * Placeholder für ServerErrorPage
 */

import { useTranslation } from 'react-i18next';

const ServerErrorPage = () => {
  const { t } = useTranslation();
  return (
    <div className="server-error-page">
      <h1>{t('errors.statusTitle', { code: 500, title: t('errors.serverErrorTitle') })}</h1>
      <p>{t('errors.serverErrorSubtitle')}</p>
    </div>
  );
};

export default ServerErrorPage;
