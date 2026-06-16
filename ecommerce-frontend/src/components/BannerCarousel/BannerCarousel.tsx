import styles from './BannerCarousel.module.css';

const banners = [
  { image: 'https://picsum.photos/id/10/1200/400', title: '春季新品上市', desc: '满199减50' },
  { image: 'https://picsum.photos/id/20/1200/400', title: '数码家电狂欢', desc: '爆款直降' },
];

const BannerCarousel = () => {
  return (
    <div id="mainCarousel" className={`carousel slide ${styles.carousel}`} data-bs-ride="carousel">
      <div className="carousel-indicators">
        {banners.map((_, index) => (
          <button key={index} type="button" data-bs-target="#mainCarousel" data-bs-slide-to={index} className={index === 0 ? 'active' : ''} aria-label={`Slide ${index + 1}`}></button>
        ))}
      </div>
      <div className="carousel-inner">
        {banners.map((banner, index) => (
          <div key={index} className={`carousel-item ${index === 0 ? 'active' : ''}`}>
            <img src={banner.image} className="d-block w-110" alt={banner.title} />
            <div className={`carousel-caption d-none d-md-block ${styles.caption}`}>
              <h3>{banner.title}</h3>
              <p>{banner.desc}</p>
            </div>
          </div>
        ))}
      </div>
      <button className="carousel-control-prev" type="button" data-bs-target="#mainCarousel" data-bs-slide="prev">
        <span className="carousel-control-prev-icon"></span>
      </button>
      <button className="carousel-control-next" type="button" data-bs-target="#mainCarousel" data-bs-slide="next">
        <span className="carousel-control-next-icon"></span>
      </button>
    </div>
  );
};

export default BannerCarousel;