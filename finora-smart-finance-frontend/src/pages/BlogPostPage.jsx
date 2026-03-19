import { useTranslation } from 'react-i18next';
import { useParams, Link, Navigate } from 'react-router-dom';
import { FiArrowLeft, FiCalendar } from 'react-icons/fi';
import styles from './blog/BlogPostPage.module.scss';

export default function BlogPostPage() {
  const { id } = useParams();
  const { t } = useTranslation();
  const posts = t('blog.posts', { returnObjects: true }) || [];
  const post = posts.find(p => p.id === id);

  if (!post || !post.available) return <Navigate to="/blog" replace />;

  return (
    <article className={styles.pageContainer}>
      <div className={styles.pageContent}>
        <Link to="/blog" className={styles.backLink}>
          <FiArrowLeft size={15} />
          {t('blog.backToBlog')}
        </Link>

        <header className={styles.postHeader}>
          <div className={styles.postMeta}>
            <span className={styles.metaItem}>
              <FiCalendar size={13} />
              <time dateTime={post.date}>{post.date}</time>
            </span>
          </div>

          <h1 className={styles.postTitle}>{post.title}</h1>
          <p className={styles.postExcerpt}>{post.excerpt}</p>

          <div className={styles.postTags}>
            {post.tags.map(tag => (
              <span key={tag} className={styles.postTag}>
                {tag}
              </span>
            ))}
          </div>
        </header>

        <div className={styles.postBody}>
          {post.sections?.map((section, i) => (
            <section key={i} className={styles.postSection}>
              <h2 className={styles.sectionTitle}>{section.title}</h2>
              {section.content.map((paragraph, j) => (
                <p key={j} className={styles.sectionText}>
                  {paragraph}
                </p>
              ))}
            </section>
          ))}
        </div>

        <div className={styles.postFooter}>
          <Link to="/blog" className={styles.backLink}>
            <FiArrowLeft size={15} />
            {t('blog.backToBlog')}
          </Link>
        </div>
      </div>
    </article>
  );
}
