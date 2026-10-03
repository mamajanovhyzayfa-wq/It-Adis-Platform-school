import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient'; 
import StudentDashboard from './StudentDashboard';

export default function TeacherPanel() {

  const [question, setQuestion] = useState('');
  const [options, setOptions] = useState(['', '', '', '']);
  const [correctOption, setCorrectOption] = useState(0);
  const [quizMsg, setQuizMsg] = useState('');


  const [homeworks, setHomeworks] = useState([]);
  const [loadingHw, setLoadingHw] = useState(true);

  useEffect(() => {
    fetchHomeworks();
  }, []);

  const fetchHomeworks = async () => {
    setLoadingHw(true);
    const { data, error } = await supabase
      .from('homeworks')
      .select('*')
      .order('created_at', { ascending: false });

    if (!error) setHomeworks(data || []);
    setLoadingHw(false);
  };


  const handleUpdateStatus = async (id, status, comment = '') => {
    await supabase
      .from('homeworks')
      .update({ status, teacher_comment: comment })
      .eq('id', id);

    fetchHomeworks();
  };


  const handleCreateQuiz = async (e) => {
    e.preventDefault();
    if (!question || options.some((opt) => !opt.trim())) {
      setQuizMsg('Заполните вопрос и все 4 варианта ответа!');
      return;
    }

    await supabase.from('quizzes').update({ is_active: false }).neq('id', '00000000-0000-0000-0000-000000000000');
    const { error } = await supabase.from('quizzes').insert([
      {
        question: question.trim(),
        options: options.map((o) => o.trim()),
        correct_option: Number(correctOption),
        is_active: true,
      },
    ]);

    if (error) {
      setQuizMsg('Ошибка при создании вопроса');
    } else {
      setQuizMsg('🎉 Вопрос для закрепления успешно запущен!');
      setQuestion('');
      setOptions(['', '', '', '']);
    }
  };

  return (
    <div style={styles.container}>
      <h2 style={{ color: '#FACC15', textAlign: 'center', marginBottom: '24px' }}>
        👨‍🏫 Панель Управления Учителя
      </h2>

      <section style={styles.card}>
        <h3 style={{ color: '#A78BFA', marginTop: 0 }}>🧠 Запустить вопрос на закрепление</h3>
        <form onSubmit={handleCreateQuiz} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <input
            type="text"
            placeholder="Текст вопроса (например: Что делает функция print()?)"
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            style={styles.input}
          />

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
            {options.map((opt, idx) => (
              <input
                key={idx}
                type="text"
                placeholder={`Вариант ${String.fromCharCode(65 + idx)}`}
                value={opt}
                onChange={(e) => {
                  const newOpts = [...options];
                  newOpts[idx] = e.target.value;
                  setOptions(newOpts);
                }}
                style={styles.input}
              />
            ))}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <label style={{ color: '#94A3B8', fontSize: '14px' }}>Правильный ответ:</label>
            <select
              value={correctOption}
              onChange={(e) => setCorrectOption(e.target.value)}
              style={styles.select}
            >
              {options.map((_, idx) => (
                <option key={idx} value={idx}>
                  Вариант {String.fromCharCode(65 + idx)}
                </option>
              ))}
            </select>
          </div>

          <button type="submit" style={styles.btnPrimary}>
            Опубликовать вопрос для учеников 🚀
          </button>
        </form>
        {quizMsg && <p style={{ color: '#4ADE80', fontSize: '14px', marginTop: '8px' }}>{quizMsg}</p>}
      </section>

      <section style={styles.card}>
        <h3 style={{ color: '#38BDF8', marginTop: 0 }}>📂 Проверка Домашних Работ</h3>
        
        {loadingHw ? (
          <p style={{ color: '#94A3B8' }}>Загрузка работ...</p>
        ) : homeworks.length === 0 ? (
          <p style={{ color: '#94A3B8' }}>Пока никто не сдал домашку.</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {homeworks.map((hw) => (
              <div key={hw.id} style={styles.hwCard}>
                <div>
                  <div style={{ fontWeight: 'bold', color: '#FFF' }}>{hw.student_name}</div>
                  <div style={{ color: '#94A3B8', fontSize: '14px' }}>{hw.title}</div>
                  <a href={hw.project_url} target="_blank" rel="noreferrer" style={styles.link}>
                    Открыть проект 🔗
                  </a>
                </div>

                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                  <button
                    onClick={() => handleUpdateStatus(hw.id, 'Принято', 'Отличная работа!')}
                    style={{ ...styles.statusBtn, backgroundColor: '#22C55E' }}
                  >
                    Принять ✅
                  </button>
                  <button
                    onClick={() => handleUpdateStatus(hw.id, 'На доработку', 'Исправь ошибки')}
                    style={{ ...styles.statusBtn, backgroundColor: '#EF4444' }}
                  >
                    На доработку ❌
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

const styles = {
  container: { display: 'flex', flexDirection: 'column', gap: '20px', maxWidth: '650px', margin: '0 auto', padding: '16px' },
  card: { backgroundColor: '#1E293B', padding: '20px', borderRadius: '16px', border: '1px solid #334155' },
  input: { backgroundColor: '#0F172A', border: '1px solid #334155', padding: '10px', borderRadius: '8px', color: '#FFF', fontSize: '14px', width: '100%', boxSizing: 'border-box' },
  select: { backgroundColor: '#0F172A', border: '1px solid #334155', color: '#FFF', padding: '8px', borderRadius: '8px' },
  btnPrimary: { backgroundColor: '#8B5CF6', color: '#FFF', border: 'none', padding: '12px', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', marginTop: '8px' },
  hwCard: { backgroundColor: '#0F172A', padding: '12px', borderRadius: '10px', border: '1px solid #334155', display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  link: { color: '#38BDF8', fontSize: '13px', textDecoration: 'none' },
  statusBtn: { color: '#FFF', border: 'none', padding: '6px 12px', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', fontSize: '12px' }
};