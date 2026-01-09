import React from 'react';
import { Link, useNavigate } from 'react-router-dom';

export default function LandingPage() {
  const navigate = useNavigate();

  return (
    <div className="landing-page">
      <header className="landing__hero">
        <div className="container">
          <h1>Expense Tracker</h1>
          <p className="text-muted">Behalte deine Finanzen im Blick – schnell, modern, übersichtlich.</p>
          <div className="hero__actions">
            <button className="btn btn--primary" onClick={() => navigate('/register')}>Kostenlos starten</button>
            <Link className="btn btn--ghost" to="/login">Ich habe schon ein Konto</Link>
          </div>
        </div>
      </header>

      <main className="landing__content">
        <div className="container">
          <section className="features">
            <h2>Warum Expense Tracker?</h2>
            <div className="features__grid">
              <div className="feature">
                <h3>Realtime & schnell</h3>
                <p>Reaktive UI, optimierte Performance und flüssige Animationen.</p>
              </div>
              <div className="feature">
                <h3>Sicher & zuverlässig</h3>
                <p>Login mit E-Mail-Verifizierung, Refresh-Tokens und Schutzmechanismen.</p>
              </div>
              <div className="feature">
                <h3>Einfach & flexibel</h3>
                <p>Filter, Kategorien, Diagramme und Export – alles was du brauchst.</p>
              </div>
            </div>
          </section>

          <section className="cta">
            <div className="cta__card">
              <h3>Starte jetzt kostenlos</h3>
              <p>Teste die Anwendung und lege deine ersten Transaktionen an.</p>
              <button className="btn btn--primary" onClick={() => navigate('/register')}>Jetzt registrieren</button>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}
