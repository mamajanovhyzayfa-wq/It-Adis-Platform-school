import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import confetti from 'canvas-confetti';

export default function StudentForm({ onLogin }) {
  const [studentCode, setStudentCode] = useState(''); 
  const [name, setName] = useState('');
  const [pin, setPin] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);
  const [studentStats, setStudentStats] = useState(null);
  const [isRegistered, setIsRegistered] = useState(false);

  useEffect(() => {
    const savedDate = localStorage.getItem('app_checkin_date');
    const today = new Date().toDateString();

    if (savedDate === today) {
      const savedStats = localStorage.getItem('app_student');
      if (savedStats) {
        try {
          const parsed = JSON.parse(savedStats);
          setStudentStats(parsed);
          setIsRegistered(true);
          if (onLogin) onLogin(parsed);
          
          const codeToFetch = parsed.code || parsed.student_code;
          if (codeToFetch) {
            supabase
              .from('students')
              .select('xp, level')
              .eq('student_code', codeToFetch)
              .maybeSingle()
              .then(({ data }) => {
                if (data) {
                  setStudentStats(prev => {
                    const updated = {
                      ...prev,
                      totalXp: data.xp,
                      xp: data.xp,
                      level: data.level
                    };
                    localStorage.setItem('app_student', JSON.stringify(updated));
                    if (onLogin) onLogin(updated);
                    return updated;
                  });
                }
              });
          }
        } catch (e) {
          console.error('Ошибка чтения статистики из локального хранилища:', e);
        }
      }
    }
  }, []);

  const generateUnique6DigitCode = async () => {
    for (let i = 0; i < 10; i++) {
      const code = Math.floor(100000 + Math.random() * 900000).toString();
      const { data: check } = await supabase
        .from('students')
        .select('id')
        .eq('student_code', code)
        .maybeSingle();

      if (!check) return code;
    }
    return Date.now().toString().slice(-6);
  };

  const handleCheckIn = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);  

    const trimmedCode = studentCode.trim();
    const trimmedName = name.trim();
    const trimmedPin = pin.trim();

    if (!trimmedName || !trimmedPin) {
      setMessage({ text: 'Пожалуйста, введите имя и PIN-код урока!', type: 'error' });
      setLoading(false);
      return;
    }

    try {
      const { data: lessons, error: lessonError } = await supabase
        .from('lessons')
        .select('*')
        .eq('pin_code', trimmedPin)
        .eq('is_active', true);

      if (lessonError || !lessons || lessons.length === 0) {
        setMessage({ text: 'Неверный или истекший PIN-код урока!', type: 'error' });
        setLoading(false);
        return;
      }

      const activeLesson = lessons[0];
      let student = null;
      let finalCode = trimmedCode;

      if (trimmedCode) {
        const { data: byCode } = await supabase
          .from('students')
          .select('*')
          .eq('student_code', trimmedCode)
          .maybeSingle();
        student = byCode;
      }

      if (!student) {
        const { data: byName } = await supabase
          .from('students')
          .select('*')
          .ilike('name', trimmedName)
          .maybeSingle();
        student = byName;
      }

      const earnedXp = 50;
      let newTotalXp = earnedXp;
      let newLevel = 1;

      if (student) {
        finalCode = student.student_code || (await generateUnique6DigitCode());
        newTotalXp = (student.xp || 0) + earnedXp;
        newLevel = Math.floor(newTotalXp / 100) + 1;

        await supabase
          .from('students')
          .update({ name: trimmedName, student_code: finalCode, xp: newTotalXp, level: newLevel })
          .eq('id', student.id);
      } else {
        finalCode = await generateUnique6DigitCode();
        const { data: newStudent } = await supabase
          .from('students')
          .insert([{ student_code: finalCode, name: trimmedName, xp: newTotalXp, level: newLevel }])
          .select()
          .single();
        if (newStudent) student = newStudent;
      }

      await supabase.from('attendance').insert([
        {
          student_name: trimmedName,
          student_code: finalCode,
          status: 'Присутствует',
          group_name: activeLesson.group_name || 'Общая',
          xp_earned: earnedXp,
          created_at: new Date().toISOString()
        }
      ]);

      confetti({ particleCount: 120, spread: 80, origin: { y: 0.6 } });

      const studentData = {
        code: finalCode,
        student_code: finalCode,
        name: trimmedName,
        xpEarned: earnedXp,
        totalXp: newTotalXp,
        xp: newTotalXp,
        level: newLevel,
        group_name: activeLesson.group_name || 'Общая',
        avatar: student?.avatar || '🌱'
      };

      localStorage.setItem('app_checkin_date', new Date().toDateString());
      localStorage.setItem('app_student', JSON.stringify(studentData));

      setStudentStats(studentData);
      setIsRegistered(true);
      if (onLogin) onLogin(studentData);

    } catch (err) {
      console.error(err);
      setMessage({ text: 'Ошибка при подключении к серверу', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  if (isRegistered) {
    return (
      <div style={styles.cardSuccess}>
        <div style={{ fontSize: '20px', fontWeight: 'bold', marginBottom: '8px', color: '#4ADE80' }}>
          ✅ Вы успешно вошли на урок!
        </div>
        {studentStats && (
          <div style={{ color: '#CBD5E1', fontSize: '14px', display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '10px' }}>
            <div>
              Имя: <b style={{ color: '#FFF' }}>{studentStats.name}</b>
            </div>
            <div>
              Ваш логин: <b style={{ color: '#FACC15' }}>{studentStats.code || studentStats.student_code}</b>
            </div>
            <div style={{ display: 'flex', justifyContent: 'center', gap: '15px', marginTop: '6px' }}>
              <span style={{ backgroundColor: '#1E293B', padding: '6px 12px', borderRadius: '8px', border: '1px solid #334155' }}>
                ⭐ Уровень: <b style={{ color: '#A78BFA' }}>{studentStats.level || 1}</b>
              </span>
              <span style={{ backgroundColor: '#1E293B', padding: '6px 12px', borderRadius: '8px', border: '1px solid #334155' }}>
                🔥 Всего XP: <b style={{ color: '#10B981' }}>{studentStats.totalXp ?? studentStats.xp ?? 0}</b>
              </span>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div style={styles.card}>
      <h2 style={{ color: '#FFF', margin: '0 0 8px 0', textAlign: 'center' }}>👋 Вход на урок</h2>
      <p style={{ color: '#94A3B8', fontSize: '13px', textAlign: 'center', marginBottom: '20px' }}>
        Введите ваш 6-значный логин (если есть), имя и PIN-код с экрана
      </p>

      <form onSubmit={handleCheckIn} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
        <div>
          <label style={styles.label}>🔑 Ваш 6-значный логин:</label>
          <input
            type="text"
            placeholder="Например: 482910"
            maxLength={6}
            value={studentCode}
            onChange={(e) => setStudentCode(e.target.value)}
            style={{ ...styles.input, textAlign: 'center', letterSpacing: '3px', fontWeight: 'bold' }}
          />
        </div>

        <div>
          <label style={styles.label}>👤 Ваше Имя и Фамилия:</label>
          <input
            type="text"
            placeholder="Например: Иванов Сергей"
            value={name}
            onChange={(e) => setName(e.target.value)}
            style={styles.input}
          />
        </div>

        <div>
          <label style={styles.label}>📌 PIN-код урока:</label>
          <input
            type="text"
            placeholder="1234"
            maxLength={4}
            value={pin}
            onChange={(e) => setPin(e.target.value)}
            style={{ ...styles.input, textAlign: 'center', fontSize: '22px', letterSpacing: '6px' }}
          />
        </div>

        {message && message.type === 'error' && (
          <div style={styles.msgError}>{message.text}</div>
        )}

        <button type="submit" disabled={loading} style={styles.submitBtn}>
          {loading ? 'Проверяем...' : 'Войти и отметиться 🚀'}
        </button>
      </form>
    </div>
  );
}

const styles = {
  card: { backgroundColor: '#1E293B', padding: '28px', borderRadius: '16px', border: '1px solid #334155', maxWidth: '480px', margin: '0 auto', fontFamily: 'sans-serif' },
  cardSuccess: { backgroundColor: '#1E293B', padding: '28px', borderRadius: '16px', border: '1px solid #22C55E', maxWidth: '480px', margin: '0 auto', textAlign: 'center', color: '#FFF', fontFamily: 'sans-serif' },
  label: { fontSize: '12px', color: '#94A3B8', display: 'block', marginBottom: '4px' },
  input: { width: '100%', backgroundColor: '#0F172A', border: '1px solid #334155', padding: '10px 12px', borderRadius: '8px', color: '#FFF', fontSize: '14px', boxSizing: 'border-box' },
  submitBtn: { backgroundColor: '#8B5CF6', color: '#FFF', border: 'none', padding: '12px', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', fontSize: '15px' },
  msgError: { padding: '10px', backgroundColor: 'rgba(239, 68, 68, 0.15)', color: '#F87171', borderRadius: '8px', fontSize: '13px', textAlign: 'center', border: '1px solid #EF4444' }
};