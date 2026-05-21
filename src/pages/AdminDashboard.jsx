import { useState, useEffect } from 'react';
import { Users, FileText, Zap, Trash2, Shield, TrendingUp } from 'lucide-react';
import toast from 'react-hot-toast';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import Navbar from '../components/shared/Navbar';
import api from '../utils/api';
import styles from './AdminDashboard.module.css';

const formatDate = (d) => new Date(d).toLocaleDateString('en-IN', { day:'numeric', month:'short', year:'numeric' });

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(null);

  const fetchData = async () => {
    try {
      const [s, u] = await Promise.all([api.get('/admin/stats'), api.get('/admin/users')]);
      setStats(s.data);
      setUsers(u.data);
    } catch {
      toast.error('Failed to load admin data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const deleteUser = async (id, name) => {
    if (!confirm(`Delete user "${name}"? This will remove all their data.`)) return;
    setDeleting(id);
    try {
      await api.delete(`/admin/users/${id}`);
      setUsers(u => u.filter(x => x.id !== id));
      setStats(s => s ? { ...s, totalUsers: s.totalUsers - 1 } : s);
      toast.success('User deleted');
    } catch {
      toast.error('Failed to delete user');
    } finally {
      setDeleting(null);
    }
  };

  // Chart data from users registration dates
  const chartData = (() => {
    const months = {};
    users.forEach(u => {
      const m = new Date(u.createdAt).toLocaleString('en-IN', { month:'short' });
      months[m] = (months[m] || 0) + 1;
    });
    return Object.entries(months).slice(-6).map(([name, users]) => ({ name, users }));
  })();

  if (loading) return (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'center', height:'100vh' }}>
      <div className="spinner" style={{ width:40, height:40 }} />
    </div>
  );

  return (
    <div className={styles.page}>
      <Navbar />
      <main className={styles.main}>
        <div className={styles.header}>
          <div>
            <div className="badge badge-purple" style={{ marginBottom:8 }}>
              <Shield size={12} /> Admin Panel
            </div>
            <h1>Dashboard Overview</h1>
          </div>
        </div>

        {/* Stats */}
        <section className={styles.stats}>
          {[
            { icon: <Users size={22} />, label: 'Total Users', value: stats?.totalUsers ?? 0, color: '#a78bfa' },
            { icon: <FileText size={22} />, label: 'PDFs Uploaded', value: stats?.totalPDFs ?? 0, color: '#34d399' },
            { icon: <Zap size={22} />, label: 'AI Generations', value: stats?.totalAIResults ?? 0, color: '#fbbf24' },
          ].map((s, i) => (
            <div key={i} className={`card ${styles.statCard}`}>
              <div className={styles.statIcon} style={{ '--c': s.color }}>
                <div className={styles.iconInner} style={{ color: s.color }}>{s.icon}</div>
              </div>
              <div>
                <div className={styles.statValue}>{s.value.toLocaleString()}</div>
                <div className={styles.statLabel}>{s.label}</div>
              </div>
            </div>
          ))}
        </section>

        <div className={styles.grid}>
          {/* Chart */}
          <div className={`card ${styles.chartCard}`}>
            <div className={styles.cardHeader}>
              <TrendingUp size={18} color="var(--accent-2)" />
              <h2>User Growth</h2>
            </div>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={chartData} margin={{ top:5, right:5, bottom:5, left:-20 }}>
                <XAxis dataKey="name" tick={{ fill:'var(--text-3)', fontSize:12 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill:'var(--text-3)', fontSize:12 }} axisLine={false} tickLine={false} allowDecimals={false} />
                <Tooltip
                  contentStyle={{ background:'var(--bg-3)', border:'1px solid var(--border)', borderRadius:8, color:'var(--text)' }}
                  cursor={{ fill:'rgba(124,111,205,0.08)' }}
                />
                <Bar dataKey="users" fill="var(--accent)" radius={[4,4,0,0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Quick stats */}
          <div className={`card ${styles.quickStats}`}>
            <div className={styles.cardHeader}>
              <Shield size={18} color="var(--accent-2)" />
              <h2>Role Breakdown</h2>
            </div>
            <div className={styles.roleStats}>
              {[
                { role: 'Admin', count: users.filter(u => u.role === 'admin').length, color: 'var(--accent-2)' },
                { role: 'User', count: users.filter(u => u.role === 'user').length, color: 'var(--green)' },
              ].map(r => (
                <div key={r.role} className={styles.roleStat}>
                  <div className={styles.roleLabel} style={{ color: r.color }}>{r.role}</div>
                  <div className={styles.roleCount}>{r.count}</div>
                  <div className={styles.roleBar}>
                    <div className={styles.roleBarFill}
                      style={{ width: `${users.length ? (r.count/users.length)*100 : 0}%`, background: r.color }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Users table */}
        <div className={`card ${styles.tableCard}`}>
          <div className={styles.cardHeader}>
            <Users size={18} color="var(--accent-2)" />
            <h2>All Users ({users.length})</h2>
          </div>
          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>User</th>
                  <th>Email</th>
                  <th>Role</th>
                  <th>PDFs</th>
                  <th>Joined</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {users.map(user => (
                  <tr key={user.id}>
                    <td>
                      <div className={styles.userCell}>
                        <div className={styles.userAvatar}>{user.name[0].toUpperCase()}</div>
                        <span>{user.name}</span>
                      </div>
                    </td>
                    <td className={styles.email}>{user.email}</td>
                    <td>
                      <span className={`badge ${user.role === 'admin' ? 'badge-purple' : 'badge-green'}`}>
                        {user.role}
                      </span>
                    </td>
                    <td className={styles.count}>{user.pdfCount}</td>
                    <td className={styles.date}>{formatDate(user.createdAt)}</td>
                    <td>
                      {user.role !== 'admin' && (
                        <button className="btn btn-danger"
                          style={{ padding:'6px 12px', fontSize:'0.78rem' }}
                          disabled={deleting === user.id}
                          onClick={() => deleteUser(user.id, user.name)}>
                          {deleting === user.id ? <div className="spinner" style={{ width:14, height:14 }} /> : <Trash2 size={14} />}
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
}
