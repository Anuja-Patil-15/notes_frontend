import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { ArrowLeft, Sparkles, FileText, BookOpen, BrainCircuit, GitBranch, StickyNote, Loader2, CheckCircle, Award, RotateCcw } from 'lucide-react';
import toast from 'react-hot-toast';
import Navbar from '../components/shared/Navbar';
import api from '../utils/api';
import styles from './PDFWorkspace.module.css';

const FEATURES = [
  { key: 'summary', label: 'Summary', icon: <BookOpen size={20} />, desc: 'Concise overview of key concepts', color: '#a78bfa' },
  { key: 'mcq', label: 'MCQ Quiz', icon: <BrainCircuit size={20} />, desc: 'Test your understanding with questions', color: '#34d399' },
  { key: 'flowchart', label: 'Flow Diagram', icon: <GitBranch size={20} />, desc: 'Visual process & concept map', color: '#fbbf24' },
  { key: 'short_notes', label: 'Short Notes', icon: <StickyNote size={20} />, desc: 'Bullet-point revision notes', color: '#f87171' },
];

export default function PDFWorkspace() {
  const { pdfId } = useParams();
  const navigate = useNavigate();
  const [pdf, setPdf] = useState(null);
  const [results, setResults] = useState({});
  const [activeFeature, setActiveFeature] = useState(null);
  const [generating, setGenerating] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get('/pdf/my-pdfs'),
      api.get(`/pdf/${pdfId}/results`),
    ]).then(([pdfsRes, resultsRes]) => {
      const found = pdfsRes.data.find(p => p.id === pdfId);
      setPdf(found);
      const map = {};
      resultsRes.data.forEach(r => { map[r.feature] = r; });
      setResults(map);
    }).catch(() => toast.error('Failed to load workspace'))
      .finally(() => setLoading(false));
  }, [pdfId]);

  const generate = async (feature) => {
    if (generating[feature]) return;
    setGenerating(g => ({ ...g, [feature]: true }));
    setActiveFeature(feature);
    try {
      const res = await api.post('/pdf/generate', { pdfId, feature });
      setResults(r => ({ ...r, [feature]: res.data }));
      toast.success(`${FEATURES.find(f => f.key === feature)?.label} generated!`);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Generation failed');
    } finally {
      setGenerating(g => ({ ...g, [feature]: false }));
    }
  };

  if (loading) return (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'center', height:'100vh' }}>
      <div className="spinner" style={{ width:40, height:40 }} />
    </div>
  );

  const activeResult = activeFeature && results[activeFeature];
  const activeFeat = FEATURES.find(f => f.key === activeFeature);

  return (
    <div className={styles.page}>
      <Navbar />
      <div className={styles.workspace}>
        {/* Sidebar */}
        <aside className={styles.sidebar}>
          <button className="btn btn-ghost" onClick={() => navigate('/dashboard')} style={{ marginBottom:24 }}>
            <ArrowLeft size={16} /> Back
          </button>

          {pdf && (
            <div className={styles.pdfInfo}>
              <div className={styles.pdfIcon}><FileText size={20} /></div>
              <div>
                <div className={styles.pdfName}>{pdf.originalName}</div>
                <div className={styles.pdfMeta}>
                  {new Date(pdf.createdAt).toLocaleDateString('en-IN', { day:'numeric', month:'short', year:'numeric' })}
                </div>
              </div>
            </div>
          )}

          <div className={styles.divider} />

          <p className={styles.sidebarLabel}>AI Features</p>
          <div className={styles.featureList}>
            {FEATURES.map(feat => {
              const done = !!results[feat.key];
              const isGenerating = generating[feat.key];
              const isActive = activeFeature === feat.key;

              return (
                <button
                  key={feat.key}
                  className={`${styles.featureBtn} ${isActive ? styles.active : ''}`}
                  onClick={() => {
                    setActiveFeature(feat.key);
                    if (!done) generate(feat.key);
                  }}
                  style={{ '--feat-color': feat.color }}
                >
                  <div className={styles.featIcon} style={{ color: feat.color }}>
                    {isGenerating ? <Loader2 size={20} className={styles.spin} /> : feat.icon}
                  </div>
                  <div className={styles.featText}>
                    <div className={styles.featLabel}>
                      {feat.label}
                      {done && <CheckCircle size={13} style={{ color: '#34d399' }} />}
                    </div>
                    <div className={styles.featDesc}>{feat.desc}</div>
                  </div>
                </button>
              );
            })}
          </div>
        </aside>

        {/* Main content */}
        <main className={styles.content}>
          {!activeFeature ? (
            <div className={styles.empty}>
              <div className={styles.emptyIcon}><Sparkles size={48} /></div>
              <h2>Choose an AI Feature</h2>
              <p>Select a feature from the sidebar to generate AI-powered content from your PDF.</p>
              <div className={styles.featureCards}>
                {FEATURES.map(feat => (
                  <button key={feat.key} className={styles.featureCard}
                    onClick={() => { setActiveFeature(feat.key); if (!results[feat.key]) generate(feat.key); }}>
                    <div style={{ color: feat.color, marginBottom:10 }}>{feat.icon}</div>
                    <div className={styles.featCardLabel}>{feat.label}</div>
                    <div className={styles.featCardDesc}>{feat.desc}</div>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className={styles.resultArea} key={activeFeature}>
              <div className={styles.resultHeader}>
                <div className={styles.resultTitle} style={{ color: activeFeat?.color }}>
                  {activeFeat?.icon}
                  <span>{activeFeat?.label}</span>
                </div>
                {results[activeFeature] && (
                  <button className="btn btn-ghost" onClick={() => generate(activeFeature)} disabled={generating[activeFeature]}>
                    {generating[activeFeature] ? <Loader2 size={16} className={styles.spin} /> : <><Sparkles size={16} /> Regenerate</>}
                  </button>
                )}
              </div>

              {generating[activeFeature] && !results[activeFeature] ? (
                <div className={styles.generating}>
                  <div className={styles.genAnim}>
                    <div className={styles.pulse} style={{ background: activeFeat?.color }} />
                  </div>
                  <p>AI is processing your document...</p>
                  <p className={styles.genSub}>This may take 15–30 seconds</p>
                </div>
              ) : activeResult ? (
                <div className={`${styles.result} fade-in`}>
                  {activeFeature === 'mcq' ? (
                    <InteractiveQuiz rawJsonData={activeResult.result} />
                  ) : (
                    <div className="markdown-content">
                      <ReactMarkdown remarkPlugins={[remarkGfm]}>
                        {activeResult.result}
                      </ReactMarkdown>
                    </div>
                  )}
                </div>
              ) : (
                <div className={styles.noResult}>
                  <p>Click <strong>Generate</strong> to create {activeFeat?.label} for this PDF.</p>
                  <button className="btn btn-primary" onClick={() => generate(activeFeature)} disabled={generating[activeFeature]} style={{ marginTop: 16 }}>
                    {generating[activeFeature] ? <Loader2 size={16} className={styles.spin} /> : <><Sparkles size={16} /> Generate</>}
                  </button>
                </div>
              )}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

/* --- Interactive Quiz Component --- */
function InteractiveQuiz({ rawJsonData }) {
  const [questions, setQuestions] = useState([]);
  const [selectedAnswers, setSelectedAnswers] = useState({});
  const [submitted, setSubmitted] = useState(false);
  const [score, setScore] = useState(0);
  const [parseError, setParseError] = useState(false);

  useEffect(() => {
    try {
      // Clean up the JSON if the model returns wrapped markdown code blocks
      let cleanData = rawJsonData.trim();
      if (cleanData.startsWith('```json')) {
        cleanData = cleanData.replace(/^```json/, '').replace(/```$/, '').trim();
      } else if (cleanData.startsWith('```')) {
        cleanData = cleanData.replace(/^```/, '').replace(/```$/, '').trim();
      }
      
      const parsed = JSON.parse(cleanData);
      setQuestions(Array.isArray(parsed) ? parsed : []);
      setParseError(false);
    } catch (e) {
      console.error("Failed parsing MCQ output data:", e);
      setParseError(true);
    }
    // Reset status on content update/regeneration
    setSelectedAnswers({});
    setSubmitted(false);
    setScore(0);
  }, [rawJsonData]);

  const handleSelect = (qId, optionIdx) => {
    if (submitted) return;
    const optionLetter = String.fromCharCode(65 + optionIdx); // Converts 0->A, 1->B, etc.
    setSelectedAnswers(prev => ({ ...prev, [qId]: optionLetter }));
  };

  const handleSubmit = () => {
    if (Object.keys(selectedAnswers).length < questions.length) {
      if (!window.confirm("You have skipped some questions. Do you want to submit anyway?")) {
        return;
      }
    }

    let currentScore = 0;
    questions.forEach(q => {
      if (selectedAnswers[q.id] === q.correctAnswer) {
        currentScore++;
      }
    });

    setScore(currentScore);
    setSubmitted(true);
    toast.success(`Quiz Completed! You scored ${currentScore}/${questions.length}`);
  };

  if (parseError) {
    return (
      <div style={{ padding: 24, textAlign: 'center', color: '#f87171' }}>
        <p>⚠️ Failed to structuralize quiz format automatically. Try hitting <strong>Regenerate</strong> above.</p>
      </div>
    );
  }

  return (
    <div style={{ color: '#f1f5f9', display: 'flex', flexDirection: 'column', gap: '24px', maxWidth: '800px', margin: '0 auto' }}>
      {questions.map((q, qIdx) => {
        const letters = ['A', 'B', 'C', 'D'];
        const userAnswer = selectedAnswers[q.id];

        return (
          <div key={q.id || qIdx} style={{ background: '#1e293b', border: '1px solid #334155', borderRadius: '12px', padding: '20px' }}>
            <h4 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '16px', color: '#ffffff' }}>
              Q{qIdx + 1}. {q.question}
            </h4>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {q.options.map((option, oIdx) => {
                const currentLetter = letters[oIdx];
                const isSelected = userAnswer === currentLetter;
                const isCorrectAnswer = q.correctAnswer === currentLetter;

                // Base style variables
                let bg = '#111827';
                let border = '1px solid #475569';
                let cursor = 'pointer';

                if (!submitted) {
                  if (isSelected) {
                    bg = '#1e1b4b'; 
                    border = '2px solid #6366f1';
                  }
                } else {
                  cursor = 'default';
                  if (isCorrectAnswer) {
                    bg = '#064e3b';
                    border = '2px solid #10b981';
                  } else if (isSelected && !isCorrectAnswer) {
                    bg = '#7f1d1d';
                    border = '2px solid #ef4444';
                  } else {
                    bg = '#111827';
                    border = '1px solid #1f2937';
                  }
                }

                return (
                  <button
                    key={oIdx}
                    disabled={submitted}
                    onClick={() => handleSelect(q.id, oIdx)}
                    style={{
                      background: bg,
                      border: border,
                      borderRadius: '8px',
                      padding: '12px 16px',
                      textAlign: 'left',
                      color: '#e2e8f0',
                      cursor: cursor,
                      fontSize: '0.95rem',
                      display: 'flex',
                      gap: '10px',
                      alignItems: 'center',
                      transition: 'all 0.2s ease'
                    }}
                  >
                    <span style={{ fontWeight: 700, color: isSelected ? '#a5b4fc' : '#94a3b8' }}>
                      {currentLetter})
                    </span>
                    <span>{option}</span>
                  </button>
                );
              })}
            </div>

            {submitted && (
              <div style={{ marginTop: '16px', padding: '12px', background: '#0f172a', borderLeft: '4px solid #3b82f6', borderRadius: '4px', fontSize: '0.9rem' }}>
                <p style={{ margin: 0, color: '#93c5fd' }}>
                  <strong>Correct Answer: {q.correctAnswer}</strong>
                </p>
                <p style={{ margin: '6px 0 0 0', color: '#cbd5e1', lineHeight: '1.4' }}>
                  {q.explanation}
                </p>
              </div>
            )}
          </div>
        );
      })}

      {/* Dynamic Action Bar */}
      {!submitted ? (
        <button
          onClick={handleSubmit}
          className="btn btn-primary"
          style={{ width: '100%', padding: '14px', fontSize: '1rem', background: '#10b981', borderColor: '#10b981', color: '#fff', fontWeight: 'bold' }}
        >
          Submit Quiz Evaluation
        </button>
      ) : (
        <div style={{ background: 'linear-gradient(135deg, #1e1b4b 0%, #311042 100%)', border: '1px solid #818cf8', borderRadius: '12px', padding: '24px', textAlign: 'center', marginTop: '12px' }}>
          <Award size={40} style={{ color: '#fcd34d', marginBottom: '8px' }} />
          <h3 style={{ fontSize: '1.5rem', fontWeight: 700, margin: '0 0 4px 0' }}>Quiz Evaluated!</h3>
          <p style={{ fontSize: '2rem', fontWeight: 900, color: '#34d399', margin: '8px 0' }}>
            {score} / {questions.length}
          </p>
          <p style={{ fontSize: '0.9rem', color: '#94a3b8', margin: 0 }}>
            {Math.round((score / questions.length) * 100)}% Conceptual Clarity Rating
          </p>
        </div>
      )}
    </div>
  );
}