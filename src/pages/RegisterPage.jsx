import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { BookOpen, Mail, Lock, User, ArrowRight } from 'lucide-react';
import styles from './AuthPage.module.css';

export default function RegisterPage() {
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  const handle = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await register(form.name, form.email, form.password);
      toast.success('Account created!');
      navigate('/dashboard');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.page}>
      <div className={styles.bg} />
      <div className={styles.card}>
        <div className={styles.logo}>
          <BookOpen size={28} color="var(--accent-2)" />
          <span>NoteAI</span>
        </div>
        <h1 className={styles.title}>Get started</h1>
        <p className={styles.sub}>Create your free account</p>
        <form onSubmit={handle} className={styles.form}>
          <div>
            <label>Full Name</label>
            <div className={styles.inputWrap}>
              <User size={16} className={styles.icon} />
              <input className={`input-field ${styles.withIcon}`}
                type="text" placeholder="John Doe"
                value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} required />
            </div>
          </div>
          <div>
            <label>Email</label>
            <div className={styles.inputWrap}>
              <Mail size={16} className={styles.icon} />
              <input className={`input-field ${styles.withIcon}`}
                type="email" placeholder="you@example.com"
                value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))} required />
            </div>
          </div>
          <div>
            <label>Password</label>
            <div className={styles.inputWrap}>
              <Lock size={16} className={styles.icon} />
              <input className={`input-field ${styles.withIcon}`}
                type="password" placeholder="Min 8 characters"
                value={form.password} onChange={e => setForm(p => ({ ...p, password: e.target.value }))} required minLength={6} />
            </div>
          </div>
          <button className="btn btn-primary" style={{ width:'100%', justifyContent:'center', padding:'13px' }} disabled={loading}>
            {loading ? <div className="spinner" /> : <><span>Create Account</span><ArrowRight size={16} /></>}
          </button>
        </form>
        <p className={styles.switch}>
          Already have an account? <Link to="/login">Sign in</Link>
        </p>
      </div>
    </div>
  );
}
