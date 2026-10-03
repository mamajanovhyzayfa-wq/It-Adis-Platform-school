import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import confetti from 'canvas-confetti';

export default function StudentDashboard({ studentName = 'Ученик', groupName = '9-А' }) {
  const [hwTitle, setHwTitle] = useState('');
  const [projectUrl, setProjectUrl] = useState('');
  const [myHomeworks, setMyHomeworks] = useState([]);
  const [isSubmittingHw, setIsSubmittingHw] = useState(false);
  const [hwMsg, setHwMsg] = useState('');

  const [activeQuiz, setActiveQuiz] = useState(null);
  const [selectedOption, setSelectedOption] = useState(null);
  const [quizAnswered, setQuizAnswered] = useState(false);
  const [quizResultMsg, setQuizResultMsg] = useState('');

  useEffect(() => {
    registerStudentInDb();
    fetchMyHomeworks();
    fetchActiveQuiz();
  }, [studentName, groupName]);

  const registerStudentInDb = async () => {
    if (!studentName || studentName === 'Ученик') return;

    try {
      const { data } = await supabase
        .from('students')
        .select('id')
        .eq('name', studentName)
        .maybeSingle();

      if (!data) {
        await supabase.from('students').insert([
          {
            name: studentName,
            group_name: groupName,
            xp: 0
          }
        ]);
      }
    } catch (err) {
      console.error('Ошибка автоматической регистрации ученика:', err);
    }
  };

  const fetchMyHomeworks = async () => {
    const { data, error } = await supabase
      .from('homeworks')
      .select('*')
      .eq('student_name', studentName)
      .order('created_at', { ascending: false });

    if (!error && data) {
      setMyHomeworks(data);
    }
  };

  const handleSubmitHomework = async (e) => {
    e.preventDefault();
    if (!hwTitle.trim() || !projectUrl.trim()) {
      setHwMsg('⚠️ Заполните название и ссылку на проект!');
      return;
    }

    setIsSubmittingHw(true);
    setHwMsg('');

    const { error } = await supabase.from('homeworks').insert([
      {
        student_name: studentName,
        group_name: groupName,
        title: hwTitle.trim(),
        project_url: projectUrl.trim(),
        status: 'На проверке'
      }
    ]);

    setIsSubmittingHw(false);

    if (error) {
      setHwMsg('❌ Ошибка отправки работы.');
    } else {
      setHwMsg('✅ Домашнее задание успешно отправлено!');
      setHwTitle('');
      setProjectUrl('');
      fetchMyHomeworks();
    }
  };

  const fetchActiveQuiz = async () => {
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
      setQuizResultMsg('');
    } else {
      setActiveQuiz(null);
    }
  };

  const handleAnswerQuiz = async (optionIdx) => {
    if (quizAnswered || !activeQuiz) return;

    setSelectedOption(optionIdx);
    setQuizAnswered(true);

    if (optionIdx === activeQuiz.correct_option) {
      setQuizResultMsg('🎉 Правильно! Тебе начислено +10 XP!');
      confetti({ particleCount: 80, spread: 60, origin: { y: 0.6 } });

      try {
        const { data: stData } = await supabase
          .from('students')
          .select('xp, id')
          .eq('name', studentName)
          .maybeSingle();

        if (stData) {
          await supabase
            .from('students')
            .update({ xp: (stData.xp || 0) + 10 })
            .eq('id', stData.id);
        }
      } catch (err) {
        console.error('Ошибка начисления XP:', err);
      }
    } else {
      setQuizResultMsg('❌ Неверно. Попробуй лучше в следующий раз!');
    }
  };

  return (
    <div style={styles.wrapper}>
      <div style={styles.card}>
        <div style={styles.cardHeader}>
          <h3 style={styles.cardTitle}>🧠 Вопрос на закрепление</h3>
          <button onClick={fetchActiveQuiz} style={styles.refreshBtn}>🔄 Обновить</button>
        </div>

        {activeQuiz ? (
          <div style={styles.quizBox}>
            <p style={styles.quizQuestion}>{activeQuiz.question}</p>
            
            <div style={styles.optionsGrid}>
              {activeQuiz.options.map((opt, idx) => {
                let btnColor = '#1E293B';
                if (quizAnswered) {
                  if (idx === activeQuiz.correct_option) btnColor = '#15803D';
                  else if (idx === selectedOption) btnColor = '#B91C1C';
                }

                return (
                  <button
                    key={idx}
                    disabled={quizAnswered}
                    onClick={() => handleAnswerQuiz(idx)}
                    style={{
                      ...styles.optionBtn,
                      backgroundColor: btnColor,
                      borderColor: selectedOption === idx ? '#38BDF8' : '#334155'
                    }}
                  >
                    <b>{String.fromCharCode(65 + idx)}.</b> {opt}
                  </button>
                );
              })}
            </div>

            {quizResultMsg && <div style={styles.resultBadge}>{quizResultMsg}</div>}
          </div>
        ) : (
          <p style={styles.emptyText}>Учитель пока не запустил викторину.</p>
        )}
      </div>

      <div style={styles.card}>
        <h3 style={styles.cardTitle}>📂 Сдать Домашнее Задание</h3>
        
        <form onSubmit={handleSubmitHomework} style={styles.form}>
          <div style={styles.inputBox}>
            <label style={styles.label}>Название темы / задания:</label>
            <input
              type="text"
              placeholder="Например: Урок 3 - Модули и Компоненты"
              value={hwTitle}
              onChange={(e) => setHwTitle(e.target.value)}
              style={styles.input}
            />
          </div>

          <div style={styles.inputBox}>
            <label style={styles.label}>Ссылка на проект (GitHub / CodePen / Vercel):</label>
            <input
              type="url"
              placeholder="https://github.com/username/project"
              value={projectUrl}
              onChange={(e) => setProjectUrl(e.target.value)}
              style={styles.input}
            />
          </div>

          <button type="submit" disabled={isSubmittingHw} style={styles.submitBtn}>
            {isSubmittingHw ? 'Отправка...' : '🚀 Отправить Д/З на проверку'}
          </button>
        </form>

        {hwMsg && <p style={styles.msgText}>{hwMsg}</p>}

        <h4 style={styles.subTitle}>📜 Мои сданные работы ({myHomeworks.length})</h4>
        {myHomeworks.length === 0 ? (
          <p style={styles.emptyText}>Вы еще не сдавали домашние работы.</p>
        ) : (
          <div style={styles.hwList}>
            {myHomeworks.map((hw) => (
              <div key={hw.id} style={styles.hwItem}>
                <div>
                  <div style={styles.hwItemTitle}>{hw.title}</div>
                  <a href={hw.project_url} target="_blank" rel="noreferrer" style={styles.link}>
                    Ссылка на проект 🔗
                  </a>
                </div>
                <div style={{
                  ...styles.statusBadge,
                  backgroundColor: hw.status === 'Принято' ? '#166534' : hw.status === 'На доработку' ? '#991B1B' : '#854D0E'
                }}>
                  {hw.status}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

const styles = {
  wrapper: { display: 'flex', flexDirection: 'column', gap: '20px', maxWidth: '800px', margin: '0 auto' },
  card: { backgroundColor: '#1E293B', padding: '20px', borderRadius: '16px', border: '1px solid #334155' },
  cardHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' },
  cardTitle: { color: '#38BDF8', margin: 0, fontSize: '18px' },
  refreshBtn: { backgroundColor: '#334155', color: '#94A3B8', border: 'none', padding: '6px 10px', borderRadius: '6px', cursor: 'pointer', fontSize: '12px' },
  quizBox: { backgroundColor: '#0F172A', padding: '16px', borderRadius: '12px', border: '1px solid #334155' },
  quizQuestion: { color: '#FFF', fontSize: '16px', fontWeight: 'bold', margin: '0 0 14px 0' },
  optionsGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' },
  optionBtn: { color: '#FFF', padding: '12px', borderRadius: '8px', border: '1px solid', textAlign: 'left', cursor: 'pointer', fontSize: '14px' },
  resultBadge: { marginTop: '14px', padding: '10px', backgroundColor: '#1E293B', borderRadius: '8px', color: '#FACC15', fontWeight: 'bold', textAlign: 'center' },
  form: { display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '12px' },
  inputBox: { display: 'flex', flexDirection: 'column', gap: '6px' },
  label: { color: '#94A3B8', fontSize: '13px' },
  input: { backgroundColor: '#0F172A', border: '1px solid #334155', padding: '10px 14px', borderRadius: '8px', color: '#FFF', outline: 'none' },
  submitBtn: { backgroundColor: '#22C55E', color: '#FFF', border: 'none', padding: '12px', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', marginTop: '6px' },
  msgText: { color: '#E2E8F0', fontSize: '13px', marginTop: '10px' },
  subTitle: { color: '#FFF', marginTop: '24px', marginBottom: '10px', fontSize: '15px' },
  hwList: { display: 'flex', flexDirection: 'column', gap: '8px' },
  hwItem: { backgroundColor: '#0F172A', padding: '10px 14px', borderRadius: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', border: '1px solid #334155' },
  hwItemTitle: { color: '#FFF', fontSize: '14px', fontWeight: 'bold' },
  link: { color: '#38BDF8', fontSize: '12px', textDecoration: 'none' },
  statusBadge: { color: '#FFF', padding: '4px 8px', borderRadius: '6px', fontSize: '12px', fontWeight: 'bold' },
  emptyText: { color: '#94A3B8', fontSize: '13px', margin: 0 }
};