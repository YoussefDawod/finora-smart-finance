/**
 * @fileoverview Accessibility Demo Page
 * @description Demonstrates all focus states and keyboard navigation features
 * for testing and documentation purposes.
 * 
 * @module pages/AccessibilityDemoPage
 */

import { useState } from 'react';
import styles from './AccessibilityDemoPage.module.scss';

export default function AccessibilityDemoPage() {
  const [count, setCount] = useState(0);
  const [checked, setChecked] = useState(false);

  return (
    <div className={styles.demoPage}>
      <header className={styles.header}>
        <h1>Accessibility & Focus States Demo</h1>
        <p className={styles.subtitle}>
          Drücken Sie <kbd>Tab</kbd>, um die Focus-Indikatoren zu sehen
        </p>
      </header>

      <main className={styles.content}>
        {/* Skip Link Demo */}
        <section className={styles.section}>
          <h2>Skip to Content Link</h2>
          <p>
            Laden Sie die Seite neu und drücken Sie sofort <kbd>Tab</kbd> - 
            der Skip-Link erscheint oben links.
          </p>
        </section>

        {/* Buttons */}
        <section className={styles.section}>
          <h2>Buttons</h2>
          <div className={styles.grid}>
            <button className={styles.primaryButton}>
              Primary Button
            </button>
            <button className={styles.secondaryButton}>
              Secondary Button
            </button>
            <button className={styles.dangerButton}>
              Danger Button
            </button>
            <button className={styles.ghostButton}>
              Ghost Button
            </button>
            <button disabled className={styles.primaryButton}>
              Disabled Button
            </button>
          </div>
        </section>

        {/* Links */}
        <section className={styles.section}>
          <h2>Links</h2>
          <p>
            Dies ist ein Absatz mit einem{' '}
            <a href="#demo" onClick={(e) => e.preventDefault()}>
              fokussierbaren Link
            </a>{' '}
            im Text. Beachten Sie das Background-Highlight beim Focus.
          </p>
          <div className={styles.grid}>
            <a href="#link1" onClick={(e) => e.preventDefault()}>
              Standalone Link
            </a>
            <a 
              href="#link2" 
              className={styles.buttonLink}
              onClick={(e) => e.preventDefault()}
            >
              Button-Style Link
            </a>
          </div>
        </section>

        {/* Form Inputs */}
        <section className={styles.section}>
          <h2>Form Inputs</h2>
          <div className={styles.formGrid}>
            <div className={styles.formGroup}>
              <label htmlFor="text-input">Text Input</label>
              <input
                id="text-input"
                type="text"
                placeholder="Fokussieren Sie mich..."
                className={styles.input}
              />
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="email-input">Email Input</label>
              <input
                id="email-input"
                type="email"
                placeholder="email@example.com"
                className={styles.input}
              />
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="textarea">Textarea</label>
              <textarea
                id="textarea"
                rows={3}
                placeholder="Mehrzeiliger Text..."
                className={styles.textarea}
              />
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="select">Select</label>
              <select id="select" className={styles.select}>
                <option>Option 1</option>
                <option>Option 2</option>
                <option>Option 3</option>
              </select>
            </div>
          </div>
        </section>

        {/* Checkboxes & Radio */}
        <section className={styles.section}>
          <h2>Checkboxes & Radio Buttons</h2>
          <div className={styles.formGrid}>
            <div className={styles.checkboxGroup}>
              <input
                type="checkbox"
                id="checkbox1"
                checked={checked}
                onChange={(e) => setChecked(e.target.checked)}
              />
              <label htmlFor="checkbox1">
                Checkbox Option
              </label>
            </div>

            <div className={styles.radioGroup}>
              <input type="radio" id="radio1" name="demo-radio" />
              <label htmlFor="radio1">Radio Option 1</label>
            </div>

            <div className={styles.radioGroup}>
              <input type="radio" id="radio2" name="demo-radio" />
              <label htmlFor="radio2">Radio Option 2</label>
            </div>
          </div>
        </section>

        {/* Interactive Cards */}
        <section className={styles.section}>
          <h2>Interactive Cards</h2>
          <div className={styles.cardGrid}>
            <button className={`${styles.card} card-interactive`}>
              <h3>Clickable Card</h3>
              <p>Dieser Card ist fokussierbar und klickbar</p>
            </button>
            <button className={`${styles.card} card-interactive`}>
              <h3>Another Card</h3>
              <p>Mit Transform-Effekt beim Focus</p>
            </button>
          </div>
        </section>

        {/* Icon Buttons */}
        <section className={styles.section}>
          <h2>Icon Buttons</h2>
          <div className={styles.iconButtons}>
            <button
              aria-label="Menü öffnen"
              className={styles.iconButton}
            >
              ☰
            </button>
            <button
              aria-label="Suchen"
              className={styles.iconButton}
            >
              🔍
            </button>
            <button
              aria-label="Einstellungen"
              className={styles.iconButton}
            >
              ⚙️
            </button>
            <button
              aria-label="Schließen"
              className={styles.iconButton}
            >
              ✕
            </button>
          </div>
        </section>

        {/* Navigation */}
        <section className={styles.section}>
          <h2>Navigation Items</h2>
          <nav className={styles.nav}>
            <a href="#nav1" onClick={(e) => e.preventDefault()}>
              Dashboard
            </a>
            <a href="#nav2" onClick={(e) => e.preventDefault()}>
              Transactions
            </a>
            <a href="#nav3" onClick={(e) => e.preventDefault()}>
              Settings
            </a>
          </nav>
        </section>

        {/* Counter Demo */}
        <section className={styles.section}>
          <h2>Interactive Counter</h2>
          <div className={styles.counter}>
            <button onClick={() => setCount(count - 1)}>−</button>
            <span className={styles.counterValue}>{count}</span>
            <button onClick={() => setCount(count + 1)}>+</button>
          </div>
        </section>

        {/* Screen Reader Only */}
        <section className={styles.section}>
          <h2>Screen Reader Only Content</h2>
          <div className={styles.srDemo}>
            <span className="sr-only">
              Dieser Text ist nur für Screenreader sichtbar
            </span>
            <p>
              Öffnen Sie einen Screenreader, um den versteckten Text zu hören.
            </p>
          </div>
        </section>

        {/* Focus Within */}
        <section className={styles.section}>
          <h2>Focus Within Container</h2>
          <div className={`${styles.focusWithinDemo} focus-within-highlight`}>
            <input
              type="text"
              placeholder="Fokussieren Sie mich - der Container leuchtet auf"
              className={styles.input}
            />
          </div>
        </section>
      </main>

      <footer className={styles.footer}>
        <p>
          💡 Tipp: Nutzen Sie <kbd>Tab</kbd> und <kbd>Shift + Tab</kbd> zur Navigation
        </p>
      </footer>
    </div>
  );
}
