import { Link } from 'react-router-dom';
import './NotFoundPage.scss';

const NotFoundPage = () => {
  return (
    <div className="not-found-page">
      <div className="not-found-content">
        <h1 className="error-code">404</h1>
        <h2>Seite nicht gefunden</h2>
        <p>Die von Ihnen gesuchte Seite existiert nicht.</p>
        <Link to="/dashboard" className="btn btn-primary">
          Zurück zum Dashboard
        </Link>
      </div>
    </div>
  );
};

export default NotFoundPage;
