import { Outlet } from 'react-router-dom';
import AdminSidebar from '../components/AdminSidebar/AdminSidebar';
import styles from './AdminLayout.module.css';

const AdminLayout = () => {
  return (
    <div className={styles.adminLayout}>
      <div className={styles.mainArea}>
        <AdminSidebar />
        <main className={styles.content}>
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;