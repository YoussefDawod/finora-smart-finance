/**
 * Placeholder für UnauthorizedPage
 */

import { useTranslation } from 'react-i18next';

const UnauthorizedPage = () => {
  const { t } = useTranslation();
  return (
    <div className="unauthorized-page">
      <h1>{t('errors.statusTitle', { code: 401, title: t('errors.unauthorizedTitle') })}</h1>
      <p>{t('errors.unauthorizedSubtitle')}</p>
    </div>
  );
};

export default UnauthorizedPage;
