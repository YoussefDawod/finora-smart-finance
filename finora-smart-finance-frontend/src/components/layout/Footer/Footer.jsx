import styles from './Footer.module.scss';

const Footer = ({ isCollapsed, isMobile }) => {
  // Determine footer class based on sidebar state (only on desktop)
  const getFooterClass = () => {
    if (isMobile) return styles.footer;
    return `${styles.footer} ${isCollapsed ? styles.sidebarCollapsed : styles.sidebarExpanded}`;
  };

  return (
    <footer className={getFooterClass()}>
      <div className={styles.footerContent}>
        {/* Footer content will be added later */}
      </div>
    </footer>
  );
};

export default Footer;
