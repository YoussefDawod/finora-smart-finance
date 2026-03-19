import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { FiArrowRight } from 'react-icons/fi';
import styles from './blog/BlogPage.module.scss';

function PostCard({ post, comingBadge, readMore }) {
  const isAvailable = post.available;

  return (
    <article className={`${styles.postCard} ${!isAvailable ? styles.comingOverlay : ''}`}>
      <time className={styles.postDate} dateTime={post.date}>
        {post.date}
      </time>

      <h2 className={styles.postTitle}>{post.title}</h2>
      <p className={styles.postExcerpt}>{post.excerpt}</p>

      <div className={styles.postTags}>
        {post.tags.map(tag => (
          <span key={tag} className={styles.postTag}>
            {tag}
          </span>
        ))}
      </div>

      {isAvailable ? (
        <Link to={`/blog/${post.id}`} className={styles.readLink}>
          {readMore} <FiArrowRight size={14} />
        </Link>
      ) : (
        <span className={styles.comingBadge}>{comingBadge}</span>
      )}
    </article>
  );
}

export default function BlogPage() {
  const { t } = useTranslation();
  const posts = t('blog.posts', { returnObjects: true }) || [];
  const comingBadge = t('blog.comingBadge');
  const readMore = t('blog.readMore');

  return (
    <div className={styles.pageContainer}>
      <div className={styles.pageHeader}>
        <h1 className={styles.title}>{t('blog.title')}</h1>
        <p className={styles.subtitle}>{t('blog.subtitle')}</p>
      </div>

      <div className={styles.blogGrid}>
        {Array.isArray(posts) &&
          posts.map(post => (
            <PostCard key={post.id} post={post} comingBadge={comingBadge} readMore={readMore} />
          ))}
      </div>
    </div>
  );
}
