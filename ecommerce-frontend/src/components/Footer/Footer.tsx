import { useState } from 'react';
import styles from './Footer.module.css';

const Footer = () => {
  const [email, setEmail] = useState('');
  const [subscribed, setSubscribed] = useState(false);

  const handleSubscribe = () => {
    if (!email.trim()) return;
    setSubscribed(true);
  };

  return (
    <footer className={styles.footer}>
      {/* 会员订阅 */}
      <section className={styles.memberSection}>
        <div className={styles.memberInner}>
          <div>
            <h3 className={styles.memberTitle}>加入会员享受尊贵礼遇</h3>
            <p className={styles.memberDesc}>
              注册成为 EasyShop 会员，首单尊享 9.5 折优惠，更有会员专属新品抢购特权。
            </p>
            {subscribed ? (
              <p style={{ color: 'var(--primary)', fontWeight: 600 }}>
                <i className="bi bi-check-circle-fill me-1" /> 感谢订阅！
              </p>
            ) : (
              <div className={styles.subscribeForm}>
                <input className={styles.subscribeInput} placeholder="输入您的电子邮箱" type="email" value={email} onChange={e => setEmail(e.target.value)} />
                <button className={styles.subscribeBtn} onClick={handleSubscribe}>立即订阅</button>
              </div>
            )}
          </div>
          <div className={styles.memberVisual}>
            <img src="https://lh3.googleusercontent.com/aida-public/AB6AXuBTueTQipmREGmgfJRCWvqMXqRkF3DIXcZPoVoYn-tB_r6SwJT7SCQRrta567tru8UXdRnajwZTMNhrKUV9MrQd8ZuIhJTxqh_zJlhUoVirqmehF_NivuVgMydQYCuZ8pvl20fubSYP7hEyq5GfiuHcRcknAA5fxeAymK629YAJlbJA1N_nlueH38Ah22is-VCnQhgTaXu7QKXT8ndJ53LFPr33r6tEgQSWxa1cupwzs3E2Nfi6K_qm2f3BVo98pvbyIvifqAk4YAQ" alt="会员礼遇" />
          </div>
        </div>
      </section>

      {/* 底部 */}
      <div className={styles.footerBottom}>
        <div className={styles.footerGrid}>
          <div>
            <div className={styles.brandName}>EasyShop</div>
            <p className={styles.brandDesc}>我们致力于提供全球最先进、最精致的电子科技产品。从个人娱乐到专业办公，您的每一次点击，都是对美好生活的追求。</p>
            <div className={styles.socials}>
              <i className="bi bi-globe" />
              <i className="bi bi-envelope" />
              <i className="bi bi-telephone" />
            </div>
          </div>
          <div>
            <div className={styles.footerTitle}>购物指南</div>
            <ul className={styles.footerLinks}>
              <li><a href="#">支付方式</a></li>
              <li><a href="#">配送流程</a></li>
              <li><a href="#">积分政策</a></li>
            </ul>
          </div>
          <div>
            <div className={styles.footerTitle}>售后服务</div>
            <ul className={styles.footerLinks}>
              <li><a href="#">退换货政策</a></li>
              <li><a href="#">隐私保护</a></li>
              <li><a href="#">服务协议</a></li>
            </ul>
          </div>
          <div>
            <div className={styles.footerTitle}>关注我们</div>
            <ul className={styles.footerLinks}>
              <li><a href="#">新浪微博</a></li>
              <li><a href="#">微信公众号</a></li>
              <li><a href="#">抖音官方号</a></li>
            </ul>
          </div>
        </div>
        <div className={styles.footerLine}>
          © 2026 EasyShop. All rights reserved.
        </div>
      </div>
    </footer>
  );
};

export default Footer;
