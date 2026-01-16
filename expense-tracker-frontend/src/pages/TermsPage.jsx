import styles from './TermsPage.module.scss';

export default function TermsPage() {
  return (
    <div className={styles.termsContainer}>
      <div className={styles.termsContent}>
        <h1 className={styles.title}>Nutzungsbedingungen</h1>
        
        <section className={styles.section}>
          <h2>1. Geltungsbereich</h2>
          <p>
            Diese Nutzungsbedingungen gelten für die Nutzung des Expense Tracker 
            (nachfolgend &ldquo;Dienst&rdquo; genannt). Durch die Registrierung und Nutzung 
            des Dienstes akzeptieren Sie diese Bedingungen.
          </p>
        </section>

        <section className={styles.section}>
          <h2>2. Registrierung und Konto</h2>
          <p>
            Um den Dienst nutzen zu können, müssen Sie ein Konto erstellen. 
            Sie verpflichten sich:
          </p>
          <ul>
            <li>Wahrheitsgemäße und vollständige Informationen anzugeben</li>
            <li>Ihre Zugangsdaten vertraulich zu behandeln</li>
            <li>Uns unverzüglich über unbefugte Nutzung zu informieren</li>
            <li>Nur ein Konto pro Person zu erstellen</li>
          </ul>
        </section>

        <section className={styles.section}>
          <h2>3. Nutzung des Dienstes</h2>
          <p>
            Der Dienst ermöglicht es Ihnen, Ihre Ausgaben und Einnahmen zu 
            verwalten. Sie dürfen den Dienst nur für rechtmäßige Zwecke nutzen.
          </p>
          <p>Untersagt ist insbesondere:</p>
          <ul>
            <li>Die Nutzung für illegale Aktivitäten</li>
            <li>Das Hochladen von Schadsoftware oder schädlichem Code</li>
            <li>Versuche, unbefugten Zugriff auf den Dienst zu erlangen</li>
            <li>Die Beeinträchtigung der Funktionalität des Dienstes</li>
          </ul>
        </section>

        <section className={styles.section}>
          <h2>4. Datenschutz</h2>
          <p>
            Der Schutz Ihrer Daten ist uns wichtig. Wir verarbeiten Ihre 
            personenbezogenen Daten gemäß den geltenden Datenschutzbestimmungen. 
            Weitere Informationen finden Sie in unserer Datenschutzerklärung.
          </p>
        </section>

        <section className={styles.section}>
          <h2>5. Geistiges Eigentum</h2>
          <p>
            Alle Rechte am Dienst, einschließlich Design, Code und Inhalte, 
            liegen beim Betreiber. Die Nutzung berechtigt Sie nicht zur 
            Verwendung von Marken, Logos oder anderen geschützten Elementen.
          </p>
        </section>

        <section className={styles.section}>
          <h2>6. Haftungsausschluss</h2>
          <p>
            Der Dienst wird &ldquo;wie besehen&rdquo; bereitgestellt. Wir übernehmen keine 
            Gewährleistung für:
          </p>
          <ul>
            <li>Die ununterbrochene Verfügbarkeit des Dienstes</li>
            <li>Die Fehlerfreiheit der Software</li>
            <li>Die Richtigkeit der von Ihnen eingegebenen Daten</li>
          </ul>
          <p>
            Die Haftung für Schäden ist auf Vorsatz und grobe Fahrlässigkeit 
            beschränkt.
          </p>
        </section>

        <section className={styles.section}>
          <h2>7. Kündigung</h2>
          <p>
            Sie können Ihr Konto jederzeit in den Einstellungen löschen. 
            Wir behalten uns das Recht vor, Konten bei Verstößen gegen diese 
            Bedingungen zu sperren oder zu löschen.
          </p>
        </section>

        <section className={styles.section}>
          <h2>8. Änderungen der Nutzungsbedingungen</h2>
          <p>
            Wir behalten uns vor, diese Nutzungsbedingungen anzupassen. 
            Wesentliche Änderungen werden wir Ihnen rechtzeitig mitteilen.
          </p>
        </section>

        <section className={styles.section}>
          <h2>9. Schlussbestimmungen</h2>
          <p>
            Es gilt das Recht der Bundesrepublik Deutschland. Sollten einzelne 
            Bestimmungen unwirksam sein, berührt dies die Wirksamkeit der 
            übrigen Bestimmungen nicht.
          </p>
        </section>

        <div className={styles.footer}>
          <p className={styles.lastUpdated}>
            Stand: Januar 2026
          </p>
        </div>
      </div>
    </div>
  );
}
