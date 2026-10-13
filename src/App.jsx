import React, { useState, useEffect, lazy, Suspense } from 'react';
import StudentForm from './components/StudentForm';
import StudentDashboard from './components/StudentDashboard';
import XpShop from './components/XpShop';
import TeacherPage from './pages/TeacherPage';
import LeaderboardPage from './pages/LeaderboardPage';
import StudentAssignmentsPage from './pages/StudentAssignmentsPage';
import FloatingChat from './components/FloatingChat';
import NotificationBell from './components/NotificationBell';
import { supabase } from './supabaseClient';

// Lazy-load VideoPage → Zoom SDK грузится ТОЛЬКО когда открыта вкладка «Видео»
const VideoPage = lazy(() => import('./pages/VideoPage'));

// ЕДИНЫЙ ключ хранения сессии (ИСПРАВЛЕНО: раньше App читал 'current_student',
// а StudentForm писал 'app_student' — ученик терялся после перезагрузки)
export const STORAGE_KEY = 'app_student';

export default function App() {
  const [activeTab, setActiveTab] = useState('lesson');
  const [currentStudent, setCurrentStudent] = useState(null);
  const [handRaised, setHandRaised] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed && parsed.name) setCurrentStudent(parsed);
        else localStorage.removeItem(STORAGE_KEY);
      } catch (e) {
        console.error('Ошибка чтения student из localStorage:', e);
        localStorage.removeItem(STORAGE_KEY);
      }
    }
  }, []);

  const handleStudentLoginOrUpdate = (studentData) => {
    if (!studentData) return handleLogout();
    setCurrentStudent(studentData);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(studentData));
  };

  const handleLogout = () => {
    setCurrentStudent(null);
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem('app_checkin_date');
  };

  const toggleHandRaise = async () => {
    const newState = !handRaised;
    setHandRaised(newState);

    if (currentStudent && supabase) {
      try {
        await supabase.from('hand_raises').insert([
          {
            student_name: currentStudent.name || 'Ученик',
            group_name: currentStudent.group_name || '9-А',
            is_raised: newState,
            created_at: new Date().toISOString(),
          },
        ]);
      } catch (error) {
        console.error('Ошибка при отправке сигнала поднятой руки:', error);
      }
    }
  };

  return (
    <div
      style={{
        backgroundColor: '#0F172A',
        minHeight: '100vh',
        color: '#FFF',
        fontFamily: 'sans-serif',
      }}
    >
      <header style={styles.header}>
        <div style={styles.logo}>⚡ IT ADIS</div>
        <nav style={styles.nav}>
          <button
            onClick={() => setActiveTab('lesson')}
            style={activeTab === 'lesson' ? styles.activeTabBtn : styles.tabBtn}
          >
            🏠 Урок
          </button>

          <button
            onClick={() => setActiveTab('assignments')}
            style={activeTab === 'assignments' ? styles.activeTabBtn : styles.tabBtn}
          >
            📝 Задания & Квизы
          </button>

          <button
            onClick={() => setActiveTab('top')}
            style={activeTab === 'top' ? styles.activeTabBtn : styles.tabBtn}
          >
            🏆 Топ
          </button>

          <button
            onClick={() => setActiveTab('shop')}
            style={activeTab === 'shop' ? styles.activeTabBtn : styles.tabBtn}
          >
            🛒 Магазин
          </button>

          <button
            onClick={() => setActiveTab('video')}
            style={activeTab === 'video' ? styles.activeTabBtn : styles.tabBtn}
          >
            🎬 Видео
          </button>

          <button
            onClick={() => setActiveTab('teacher')}
            style={activeTab === 'teacher' ? styles.activeTabBtn : styles.tabBtn}
          >
            👨‍🏫 Учитель
          </button>

          {currentStudent && (
            <>
              <NotificationBell studentName={currentStudent.name} />
              <button onClick={handleLogout} style={styles.logoutBtn} title="Выйти из аккаунта">
                🚪 Выйти
              </button>
            </>
          )}

          <button
            onClick={toggleHandRaise}
            style={handRaised ? styles.handRaisedBtn : styles.handBtn}
            title="Нажмите, чтобы привлечь внимание учителя"
          >
            {handRaised ? '✋ Рука поднята' : '🖐️ Поднять руку'}
          </button>
        </nav>
      </header>

      <main style={{ padding: '20px' }}>
        {activeTab === 'lesson' &&
          (currentStudent ? (
            <StudentDashboard student={currentStudent} />
          ) : (
            <StudentForm onLogin={handleStudentLoginOrUpdate} />
          ))}

        {activeTab === 'assignments' && (
          <StudentAssignmentsPage student={currentStudent} />
        )}

        {activeTab === 'top' && <LeaderboardPage student={currentStudent} />}

        {activeTab === 'shop' && (
          <XpShop student={currentStudent} onUpdateStudent={handleStudentLoginOrUpdate} />
        )}

        {activeTab === 'video' && (
          <Suspense
            fallback={
              <div style={{ color: '#94A3B8', textAlign: 'center', padding: '40px' }}>
                Загрузка видеокабинета...
              </div>
            }
          >
            <VideoPage student={currentStudent} role={0} />
          </Suspense>
        )}

        {activeTab === 'teacher' && <TeacherPage />}
      </main>

      <FloatingChat
        studentName={currentStudent ? currentStudent.name : 'Ученик'}
        groupName={currentStudent ? currentStudent.group_name || '9-А' : '9-А'}
      />
    </div>
  );
}

const styles = {
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '12px 24px',
    backgroundColor: '#1E293B',
    borderBottom: '1px solid #334155',
    flexWrap: 'wrap',
    gap: '10px',
  },
  logo: { fontWeight: 'bold', fontSize: '18px', color: '#FACC15' },
  nav: { display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' },
  tabBtn: {
    background: 'none',
    border: 'none',
    color: '#94A3B8',
    padding: '8px 12px',
    cursor: 'pointer',
    fontSize: '14px',
    borderRadius: '8px',
  },
  activeTabBtn: {
    backgroundColor: '#334155',
    border: 'none',
    color: '#FACC15',
    padding: '8px 12px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: 'bold',
    borderRadius: '8px',
  },
  logoutBtn: {
    backgroundColor: '#334155',
    color: '#EF4444',
    border: 'none',
    padding: '8px 12px',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: 'bold',
  },
  handBtn: {
    backgroundColor: '#3B82F6',
    color: '#FFF',
    border: 'none',
    padding: '8px 14px',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '600',
  },
  handRaisedBtn: {
    backgroundColor: '#EF4444',
    color: '#FFF',
    border: 'none',
    padding: '8px 14px',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: 'bold',
  },
};