import styles from './BannerCarousel.module.css';

const BannerCarousel = () => {
  const scrollToProducts = () => {
    document.getElementById('products-section')?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <section className={styles.hero}>
      <img
        className={styles.heroImg}
        src="/homepage.jpg"
        alt="春季新品"
      />
      <div className={styles.overlay}>
        <div className={styles.content}>
          <span className={styles.tag}>NEW COLLECTION 2026</span>
          <h1 className={styles.title}>
            春季新品上市<br />
            <span className={styles.titleAccent}>满199减50</span>
          </h1>
          <p className={styles.desc}>
            探索全新数码生活，发现让生活更简单的精致科技产品。今日下单享受限时顺丰包邮。
          </p>
          <button className={styles.cta} onClick={scrollToProducts}>
            立即选购 <i className="bi bi-arrow-right" />
          </button>
        </div>
      </div>
    </section>
  );
};

export default BannerCarousel;
