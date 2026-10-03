import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import confetti from 'canvas-confetti';

export default function StudentAssignmentsPage({ studentName = 'Ученик', groupName = '9-А' }) {
  const [activeTab, setActiveTab] = useState('homework');

  const [hwTitle, setHwTitle] = useState('');
  const [projectUrl, setProjectUrl] = useState('');
  const [hwComment, setHwComment] = useState('');
  const [isSubmittingHw, setIsSubmittingHw] = useState(false);
  const [hwStatusMsg, setHwStatusMsg] = useState({ type: '', text: '' });

  const [myHomeworks, setMyHomeworks] = useState([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);

  const [activeQuiz, setActiveQuiz] = useState(null);
  const [selectedOption, setSelectedOption] = useState(null);
  const [quizAnswered, setQuizAnswered] = useState(false);
  const [quizFeedback, setQuizFeedback] = useState('');
  const [isLoadingQuiz, setIsLoadingQuiz] = useState(false);

  useEffect(() => {
    fetchMyHomeworks();
    fetchActiveQuiz();
  }, [studentName]);

  const fetchMyHomeworks = async () => {
    setIsLoadingHistory(true);
    const { data, error } = await supabase
      .from('homeworks')
      .select('*')
      .eq('student_name', studentName)
      .order('created_at', { ascending: false });

    if (!error && data) {
      setMyHomeworks(data);
    }
    setIsLoadingHistory(false);
  };

  const handleSubmitHomework = async (e) => {
    e.preventDefault();
    if (!hwTitle.trim() || !projectUrl.trim()) {
      setHwStatusMsg({ type: 'error', text: '⚠️ Пожалуйста, укажите тему и ссылку на проект!' });
      return;
    }

    setIsSubmittingHw(true);
    setHwStatusMsg({ type: '', text: '' });

    const { error } = await supabase.from('homeworks').insert([
      {
        student_name: studentName,
        group_name: groupName,
        title: hwTitle.trim(),
        project_url: projectUrl.trim(),
        comment: hwComment.trim(),
        status: 'На проверке'
      }
    ]);

    setIsSubmittingHw(false);

    if (error) {
      setHwStatusMsg({ type: 'error', text: '❌ Не удалось отправить работу. Попробуйте снова.' });
    } else {
      setHwStatusMsg({ type: 'success', text: '✅ Домашнее задание успешно отправлено на проверку!' });
      setHwTitle('');
      setProjectUrl('');
      setHwComment('');
      fetchMyHomeworks();
      setActiveTab('history');
    }
  };

  const fetchActiveQuiz = async () => {
    setIsLoadingQuiz(true);
    const { data, error } = await supabase
      .from('quizzes')
      .select('*')
      .eq('is_active', true)
      .order('created_at', { ascending: false })
      .limit(1);

    if (!error && data && data.length > 0) {
      setActiveQuiz(data[0]);
      setSelectedOption(null);
      setQuizAnswered(false);
      setQuizFeedback('');
    } else {
      setActiveQuiz(null);
    }
    setIsLoadingQuiz(false);
  };

  const handleAnswerQuiz = async (optionIdx) => {
    if (quizAnswered || !activeQuiz) return;

    setSelectedOption(optionIdx);
    setQuizAnswered(true);

    if (optionIdx === activeQuiz.correct_option) {
      setQuizFeedback('🎉 Отлично! Верный ответ. Вам зачислено +10 XP!');
      confetti({ particleCount: 90, spread: 70, origin: { y: 0.6 } });

      const { data: stData } = await supabase
        .from('students')
        .select('xp')
        .eq('name', studentName)
        .single();

      if (stData) {
        await supabase
          .from('students')
          .update({ xp: (stData.xp || 0) + 10 })
          .eq('name', studentName);
      }
    } else {
      setQuizFeedback('❌ Ответ неверный. Ознакомьтесь с материалом урока еще раз!');
    }
  };

  const getStatusStyle = (status) => {
    switch (status) {
      case 'Принято':
        return { bg: '#166534', color: '#4ADE80', label: '✅ Принято' };
      case 'На доработку':
        return { bg: '#991B1B', color: '#FCA5A5', label: '🔄 На доработку' };
      default:
        return { bg: '#854D0E', color: '#FEF08A', label: '⏳ На проверке' };
    }
  };

  return (
    <div style={styles.pageContainer}>
      <div style={styles.header}>
        <h1 style={styles.title}>🎓 Учебный Центр Ученика</h1>
        <p style={styles.subtitle}>Сдавайте практические работы, проходите квизы и отслеживайте проверки учителя.</p>
      </div>

      <div style={styles.tabsContainer}>
        <button
          onClick={() => setActiveTab('homework')}
          style={{
            ...styles.tabBtn,
            ...(activeTab === 'homework' ? styles.activeTabBtn : {})
          }}
        >
          📤 Сдать Д/З
        </button>
        <button
          onClick={() => setActiveTab('quiz')}
          style={{
            ...styles.tabBtn,
            ...(activeTab === 'quiz' ? styles.activeTabBtn : {})
          }}
        >
          🧠 Викторины & Тесты
        </button>
        <button
          onClick={() => setActiveTab('history')}
          style={{
            ...styles.tabBtn,
            ...(activeTab === 'history' ? styles.activeTabBtn : {})
          }}
        >
          📜 Трекинг статусов ({myHomeworks.length})
        </button>
      </div>

      {activeTab === 'homework' && (
        <div style={styles.card}>
          <h2 style={styles.sectionTitle}>🚀 Отправка Домашнего Задания</h2>
          <form onSubmit={handleSubmitHomework} style={styles.form}>
            <div style={styles.fieldGroup}>
              <label style={styles.label}>Тема урока / Задание <span style={{ color: '#EF4444' }}>*</span></label>
              <input
                type="text"
                placeholder="Например: Урок 5 - Подключение Supabase и авторизация"
                value={hwTitle}
                onChange={(e) => setHwTitle(e.target.value)}
                style={styles.input}
              />
            </div>

            <div style={styles.fieldGroup}>
              <label style={styles.label}>Ссылка на выполненный проект (GitHub / Vercel / Figma) <span style={{ color: '#EF4444' }}>*</span></label>
              <input
                type="url"
                placeholder="https://github.com/username/project"
                value={projectUrl}
                onChange={(e) => setProjectUrl(e.target.value)}
                style={styles.input}
              />
            </div>

            <div style={styles.fieldGroup}>
              <label style={styles.label}>Комментарий для учителя (необязательно):</label>
              <textarea
                placeholder="Опишите, какие сложности возникли при выполнении или что удалось сделать..."
                value={hwComment}
                onChange={(e) => setHwComment(e.target.value)}
                rows={3}
                style={styles.textarea}
              />
            </div>

            <button type="submit" disabled={isSubmittingHw} style={styles.submitBtn}>
              {isSubmittingHw ? 'Отправка...' : '📩 Отправить на проверку'}
            </button>
          </form>

          {hwStatusMsg.text && (
            <div style={{
              ...styles.msgBox,
              backgroundColor: hwStatusMsg.type === 'error' ? 'rgba(239, 68, 68, 0.15)' : 'rgba(34, 197, 94, 0.15)',
              borderColor: hwStatusMsg.type === 'error' ? '#EF4444' : '#22C55E'
            }}>
              <p style={{ margin: 0, color: hwStatusMsg.type === 'error' ? '#FCA5A5' : '#86EFAC', fontWeight: '500' }}>
                {hwStatusMsg.text}
              </p>
            </div>
          )}
        </div>
      )}

      {activeTab === 'quiz' && (
        <div style={styles.card}>
          <div style={styles.quizHeader}>
            <h2 style={styles.sectionTitle}>🧠 Вопрос на закрепление знаний</h2>
            <button onClick={fetchActiveQuiz} style={styles.secondaryBtn}>🔄 Обновить</button>
          </div>

          {isLoadingQuiz ? (
            <p style={styles.loadingText}>Загрузка вопроса...</p>
          ) : activeQuiz ? (
            <div style={styles.quizBox}>
              <p style={styles.quizQuestion}>{activeQuiz.question}</p>
              
              <div style={styles.optionsGrid}>
                {activeQuiz.options.map((optionText, idx) => {
                  let optionBg = '#1E293B';
                  if (quizAnswered) {
                    if (idx === activeQuiz.correct_option) optionBg = '#15803D';
                    else if (idx === selectedOption) optionBg = '#991B1B';
                  }

                  return (
                    <button
                      key={idx}
                      disabled={quizAnswered}
                      onClick={() => handleAnswerQuiz(idx)}
                      style={{
                        ...styles.optionBtn,
                        backgroundColor: optionBg,
                        borderColor: selectedOption === idx ? '#38BDF8' : '#334155'
                      }}
                    >
                      <span style={styles.optionLetter}>{String.fromCharCode(65 + idx)}</span>
                      <span>{optionText}</span>
                    </button>
                  );
                })}
              </div>

              {quizFeedback && (
                <div style={styles.feedbackBox}>
                  {quizFeedback}
                </div>
              )}
            </div>
          ) : (
            <div style={styles.emptyBox}>
              <span style={{ fontSize: '36px', display: 'block', marginBottom: '8px' }}>💬</span>
              <p style={{ margin: 0, color: '#94A3B8' }}>Учитель пока не затестил или не активировал активную викторину.</p>
            </div>
          )}
        </div>
      )}

      {activeTab === 'history' && (
        <div style={styles.card}>
          <div style={styles.quizHeader}>
            <h2 style={styles.sectionTitle}>📜 Статусы ваших работ</h2>
            <button onClick={fetchMyHomeworks} style={styles.secondaryBtn}>🔄 Обновить список</button>
          </div>

          {isLoadingHistory ? (
            <p style={styles.loadingText}>Загрузка ваших работ...</p>
          ) : myHomeworks.length === 0 ? (
            <div style={styles.emptyBox}>
              <span style={{ fontSize: '36px', display: 'block', marginBottom: '8px' }}>📂</span>
              <p style={{ margin: 0, color: '#94A3B8' }}>Вы еще не сдавали домашние работы.</p>
            </div>
          ) : (
            <div style={styles.historyList}>
              {myHomeworks.map((hw) => {
                const statusInfo = getStatusStyle(hw.status);
                return (
                  <div key={hw.id} style={styles.historyItem}>
                    <div style={styles.hwInfo}>
                      <h4 style={styles.hwTitleText}>{hw.title}</h4>
                      <a href={hw.project_url} target="_blank" rel="noreferrer" style={styles.linkText}>
                        🔗 Открыть отправленный проект
                      </a>
                      
                      {hw.comment && (
                        <p style={styles.commentText}>
                          <b>Ваш комментарий:</b> {hw.comment}
                        </p>
                      )}

                      {hw.teacher_feedback && (
                        <div style={styles.feedbackNotice}>
                          💬 <b>Ответ учителя:</b> {hw.teacher_feedback}
                        </div>
                      )}

                      <span style={styles.dateText}>
                        Отправлено: {new Date(hw.created_at).toLocaleDateString('ru-RU')}
                      </span>
                    </div>

                    <div style={{
                      ...styles.statusBadge,
                      backgroundColor: statusInfo.bg,
                      color: statusInfo.color
                    }}>
                      {statusInfo.label}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

const styles = {
  pageContainer: {
    maxWidth: '900px',
    margin: '0 auto',
    padding: '24px 16px',
    color: '#F8FAFC'
  },
  header: {
    marginBottom: '24px'
  },
  title: {
    fontSize: '24px',
    fontWeight: 'bold',
    color: '#FFF',
    margin: '0 0 6px 0'
  },
  subtitle: {
    fontSize: '14px',
    color: '#94A3B8',
    margin: 0
  },
  tabsContainer: {
    display: 'flex',
    gap: '8px',
    marginBottom: '20px',
    borderBottom: '1px solid #334155',
    paddingBottom: '12px'
  },
  tabBtn: {
    backgroundColor: 'transparent',
    color: '#94A3B8',
    border: 'none',
    padding: '10px 18px',
    borderRadius: '8px',
    fontSize: '14px',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'all 0.2s'
  },
  activeTabBtn: {
    backgroundColor: '#38BDF8',
    color: '#0F172A'
  },
  card: {
    backgroundColor: '#0F172A',
    borderRadius: '16px',
    padding: '24px',
    border: '1px solid #334155',
    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.2)'
  },
  sectionTitle: {
    fontSize: '18px',
    fontWeight: 'bold',
    color: '#38BDF8',
    margin: '0 0 16px 0'
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px'
  },
  fieldGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px'
  },
  label: {
    fontSize: '13px',
    color: '#CBD5E1',
    fontWeight: '500'
  },
  input: {
    backgroundColor: '#1E293B',
    border: '1px solid #334155',
    borderRadius: '8px',
    padding: '12px 14px',
    color: '#FFF',
    fontSize: '14px',
    outline: 'none'
  },
  textarea: {
    backgroundColor: '#1E293B',
    border: '1px solid #334155',
    borderRadius: '8px',
    padding: '12px 14px',
    color: '#FFF',
    fontSize: '14px',
    outline: 'none',
    resize: 'vertical'
  },
  submitBtn: {
    backgroundColor: '#22C55E',
    color: '#FFF',
    border: 'none',
    padding: '12px 20px',
    borderRadius: '8px',
    fontSize: '15px',
    fontWeight: 'bold',
    cursor: 'pointer',
    marginTop: '8px',
    transition: 'background-color 0.2s'
  },
  msgBox: {
    marginTop: '16px',
    padding: '12px 16px',
    borderRadius: '8px',
    border: '1px solid'
  },
  quizHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '16px'
  },
  secondaryBtn: {
    backgroundColor: '#1E293B',
    color: '#94A3B8',
    border: '1px solid #334155',
    padding: '6px 12px',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '12px'
  },
  quizBox: {
    backgroundColor: '#1E293B',
    padding: '20px',
    borderRadius: '12px',
    border: '1px solid #334155'
  },
  quizQuestion: {
    fontSize: '16px',
    fontWeight: 'bold',
    color: '#FFF',
    margin: '0 0 16px 0'
  },
  optionsGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '12px'
  },
  optionBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    padding: '12px 16px',
    borderRadius: '8px',
    border: '1px solid',
    color: '#FFF',
    cursor: 'pointer',
    fontSize: '14px',
    textAlign: 'left'
  },
  optionLetter: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    padding: '2px 8px',
    borderRadius: '4px',
    fontWeight: 'bold',
    fontSize: '12px'
  },
  feedbackBox: {
    marginTop: '16px',
    backgroundColor: '#0F172A',
    padding: '12px',
    borderRadius: '8px',
    color: '#FACC15',
    fontWeight: 'bold',
    textAlign: 'center'
  },
  historyList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px'
  },
  historyItem: {
    backgroundColor: '#1E293B',
    borderRadius: '12px',
    padding: '16px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    border: '1px solid #334155',
    gap: '16px'
  },
  hwInfo: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px'
  },
  hwTitleText: {
    margin: 0,
    color: '#FFF',
    fontSize: '16px'
  },
  linkText: {
    color: '#38BDF8',
    fontSize: '13px',
    textDecoration: 'none'
  },
  commentText: {
    margin: '4px 0 0 0',
    fontSize: '12px',
    color: '#94A3B8'
  },
  feedbackNotice: {
    marginTop: '6px',
    backgroundColor: '#0F172A',
    padding: '8px 12px',
    borderRadius: '6px',
    fontSize: '13px',
    color: '#FACC15',
    border: '1px solid #334155'
  },
  dateText: {
    fontSize: '11px',
    color: '#64748B',
    marginTop: '4px'
  },
  statusBadge: {
    padding: '6px 12px',
    borderRadius: '8px',
    fontSize: '12px',
    fontWeight: 'bold',
    whiteSpace: 'nowrap'
  },
  emptyBox: {
    textAlign: 'center',
    padding: '32px 16px',
    backgroundColor: '#1E293B',
    borderRadius: '12px',
    border: '1px dashed #334155'
  },
  loadingText: {
    color: '#94A3B8',
    fontSize: '14px',
    textAlign: 'center'
  }
};