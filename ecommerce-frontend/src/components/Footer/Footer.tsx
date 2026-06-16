import styles from './Footer.module.css';

const Footer = () => {
  return (
    <footer className={styles.footer}>
      <div className="container py-4">
        <div className="row">
          <div className="col-md-4">
            <h5>EasyShop</h5>
            <p>优质商品，快速配送</p>
          </div>
          <div className="col-md-4">
            <h5>帮助中心</h5>
            <ul className="list-unstyled">
              <li><a href="#" className="text-light">售后服务</a></li>
              <li><a href="#" className="text-light">配送说明</a></li>
            </ul>
          </div>
          <div className="col-md-4">
            <h5>关注我们</h5>
            <p>微信公众号：EasyShop</p>
          </div>
        </div>
        <div className="text-center mt-3">
          <small>© 2026 EasyShop. All rights reserved.</small>
        </div>
      </div>
    </footer>
  );
};

export default Footer;