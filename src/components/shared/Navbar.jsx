import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { LogOut, LayoutDashboard, Shield, BookOpen } from 'lucide-react';
import toast from 'react-hot-toast';
import styles from './Navbar.module.css';

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    toast.success('Logged out');
    navigate('/login');
  };

  return (
    <nav className={styles.nav}>
      <div className={styles.brand} onClick={() => navigate('/dashboard')}>
        <BookOpen size={22} color="var(--accent-2)" />
        <span>NoteAI</span>
      </div>
      <div className={styles.actions}>
        {user?.role === 'admin' && (
          <>
            <button className="btn btn-ghost" onClick={() => navigate('/dashboard')}>
              <LayoutDashboard size={16} /> Dashboard
            </button>
            <button className="btn btn-ghost" onClick={() => navigate('/admin')}>
              <Shield size={16} /> Admin
            </button>
          </>
        )}
        <div className={styles.userChip}>
          <div className={styles.avatar}>{user?.name?.[0]?.toUpperCase()}</div>
          <div>
            <div className={styles.userName}>{user?.name}</div>
            <div className={styles.userRole}>{user?.role}</div>
          </div>
        </div>
        <button className="btn btn-ghost" onClick={handleLogout}>
          <LogOut size={16} />
        </button>
      </div>
    </nav>
  );
}
