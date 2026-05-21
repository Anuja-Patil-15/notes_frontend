import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Upload, FileText, Clock, ChevronRight, AlertCircle, BookOpen, Zap, Layers } from 'lucide-react';
import toast from 'react-hot-toast';
import Navbar from '../components/shared/Navbar';
import api from '../utils/api';
import styles from './UserDashboard.module.css';

const formatDate = (d) => new Date(d).toLocaleDateString('en-IN', { day:'numeric', month:'short', year:'numeric' });
const formatSize = (b) => b ? `${(b/1024).toFixed(1)} KB` : '—';

const FEATURE_LABELS = {
  summary: { label: 'Summary', color: 'badge-purple' },
  mcq: { label: 'MCQ Quiz', color: 'badge-green' },
  flowchart: { label: 'Flow Diagram', color: 'badge-yellow' },
  short_notes: { label: 'Short Notes', color: 'badge-red' },
};

export default function UserDashboard() {
  const [pdfs, setPdfs] = useState([]);
  const [history, setHistory] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(true);
  const fileRef = useRef();
  const navigate = useNavigate();

  useEffect(() => {
    Promise.all([
      api.get('/pdf/my-pdfs'),
      api.get('/pdf/history/all'),
    ]).then(([p, h]) => {
      setPdfs(p.data);
      setHistory(h.data);
    }).catch(() => toast.error('Failed to load data'))
      .finally(() => setLoading(false));
  }, []);

  const handleUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.type !== 'application/pdf') { toast.error('Only PDF files allowed'); return; }

    const fd = new FormData();
    fd.append('pdf', file);
    setUploading(true);
    try {
      const res = await api.post('/pdf/upload', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      toast.success('PDF uploaded! Opening workspace...');
      setPdfs(p => [res.data, ...p]);
      navigate(`/workspace/${res.data.id}`);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Upload failed');
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  if (loading) return (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'center', height:'100vh' }}>
      <div className="spinner" style={{ width:40, height:40 }} />
    </div>
  );

  return (
    <div className={styles.page}>
      <Navbar />
      <main className={styles.main}>
        {/* Hero upload */}
        <section className={styles.hero}>
          <div className={styles.heroText}>
            <div className="badge badge-purple" style={{ marginBottom:16 }}>
              <Zap size={12} /> AI-Powered Notes
            </div>
            <h1>Upload your PDF notes,<br />let AI do the rest</h1>
            <p>Get summaries, MCQs, flow diagrams, and concise study notes powered by Claude AI.</p>
          </div>
          <div className={styles.uploadBox} onClick={() => !uploading && fileRef.current?.click()}>
            <input ref={fileRef} type="file" accept=".pdf" style={{ display:'none' }} onChange={handleUpload} />
            {uploading ? (
              <>
                <div className="spinner" style={{ width:40, height:40, margin:'0 auto 16px' }} />
                <p>Uploading & extracting text...</p>
              </>
            ) : (
              <>
                <div className={styles.uploadIcon}><Upload size={32} /></div>
                <p className={styles.uploadTitle}>Drop PDF here or click to upload</p>
                <p className={styles.uploadSub}>Max 10MB • PDF only</p>
              </>
            )}
          </div>
        </section>

        {/* Stats row */}
        <section className={styles.stats}>
          {[
            { icon: <FileText size={20} />, label: 'PDFs Uploaded', value: pdfs.length },
            { icon: <Layers size={20} />, label: 'AI Results', value: history.length },
            { icon: <Clock size={20} />, label: 'Last Upload', value: pdfs[0] ? formatDate(pdfs[0].createdAt) : '—' },
          ].map((s, i) => (
            <div key={i} className={`card ${styles.statCard}`}>
              <div className={styles.statIcon}>{s.icon}</div>
              <div>
                <div className={styles.statValue}>{s.value}</div>
                <div className={styles.statLabel}>{s.label}</div>
              </div>
            </div>
          ))}
        </section>

        <div className={styles.grid}>
          {/* PDFs list */}
          <section>
            <h2 className={styles.sectionTitle}>Your PDFs</h2>
            {pdfs.length === 0 ? (
              <div className={`card ${styles.empty}`}>
                <FileText size={40} color="var(--text-3)" />
                <p>No PDFs yet. Upload your first one above!</p>
              </div>
            ) : (
              <div className={styles.pdfList}>
                {pdfs.map(pdf => (
                  <div key={pdf.id} className={`card ${styles.pdfCard}`} onClick={() => navigate(`/workspace/${pdf.id}`)}>
                    <div className={styles.pdfIcon}><FileText size={22} /></div>
                    <div className={styles.pdfInfo}>
                      <div className={styles.pdfName}>{pdf.originalName}</div>
                      <div className={styles.pdfMeta}>{formatDate(pdf.createdAt)} • {formatSize(pdf.fileSize)}</div>
                    </div>
                    <ChevronRight size={18} color="var(--text-3)" />
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* History */}
          <section>
            <h2 className={styles.sectionTitle}>Recent AI Results</h2>
            {history.length === 0 ? (
              <div className={`card ${styles.empty}`}>
                <AlertCircle size={40} color="var(--text-3)" />
                <p>No AI results yet. Open a PDF workspace and generate content.</p>
              </div>
            ) : (
              <div className={styles.historyList}>
                {history.slice(0, 10).map(item => {
                  const feat = FEATURE_LABELS[item.feature] || { label: item.feature, color: 'badge-purple' };
                  return (
                    <div key={item.id} className={`card ${styles.historyCard}`}
                      onClick={() => navigate(`/workspace/${item.pdfId}`)}>
                      <div className={styles.historyTop}>
                        <span className={`badge ${feat.color}`}>{feat.label}</span>
                        <span className={styles.historyDate}>{formatDate(item.createdAt)}</span>
                      </div>
                      <div className={styles.historyFile}>
                        <FileText size={13} /> {item.originalName}
                      </div>
                      <p className={styles.historyPreview}>{item.result?.substring(0, 120)}...</p>
                    </div>
                  );
                })}
              </div>
            )}
          </section>
        </div>
      </main>
    </div>
  );
}
