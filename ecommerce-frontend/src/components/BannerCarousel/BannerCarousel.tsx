import styles from './BannerCarousel.module.css';

const BannerCarousel = () => {
  const scrollToProducts = () => {
    document.getElementById('products-section')?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <section className={styles.hero}>
      <img
        className={styles.heroImg}
        src="https://lh3.googleusercontent.com/aida-public/AB6AXuBU8MFMPHKYJo0s-lEnQdY3T3lSyF6Jb92jILcRsX9KYi6SSw90hJ287vRUki_dd-UUalbF7BjNx0xkjchdLyZMZ3A9zFloVryE0u2RtGndE8GnLtls_7Cpib5pfKxCEYMb0I_MGc-V8F_vP8og0pNImFDNCUY3795ks2WtPIN31-rWqVveflVbCzYku3Ha48uWY_c8-UrieoB393JMOp4oElsr-r5r3pYhIwhTHmJfJNQSmAbbagmlYc8mXtL2W41ZJulLvuvyNoU"
        alt="春季新品"
      />
      <div className={styles.overlay}>
        <div className={styles.content}>
          <span className={styles.tag}>NEW COLLECTION 2024</span>
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
