import { Outlet } from 'react-router-dom';
import Header from '../components/Header/Header';
import AdminSidebar from '../components/AdminSidebar/AdminSidebar';
import Footer from '../components/Footer/Footer';
import styles from './AdminLayout.module.css';

const AdminLayout = () => {
  return (
    <div className={styles.adminLayout}>
      <Header />
      <div className="d-flex">
        <AdminSidebar />
        <main className={`container-fluid ${styles.content}`}>
          <Outlet />
        </main>
      </div>
      <Footer />
    </div>
  );
};

export default AdminLayout;