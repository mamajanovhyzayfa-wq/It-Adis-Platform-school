import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import VideoLesson from '../components/VideoLesson';
import LiveChat from '../components/LiveChat';

export default function StudentPage({ studentData }) {
  const [activeLesson, setActiveLesson] = useState(null);
  const [students, setStudents] = useState([]);
  const [loadingStudents, setLoadingStudents] = useState(false);

  useEffect(() => {
    fetchStudents();

    if (!studentData?.group_name) return;

    checkActiveLesson();

    const channel = supabase
      .channel(`lessons_group_${studentData.group_name}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'lessons',
          filter: `group_name=eq.${studentData.group_name}`
        },
        () => {
          checkActiveLesson();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [studentData?.group_name]);

  const checkActiveLesson = async () => {
    const { data } = await supabase
      .from('lessons')
      .select('*')
      .eq('group_name', studentData.group_name)
      .eq('is_active', true)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    setActiveLesson(data);
  };

  const fetchStudents = async () => {
    setLoadingStudents(true);

    const { data, error } = await supabase
      .from('students')
      .select('*');

    console.log('Данные из Supabase:', data);
    if (error) {
      console.error('Ошибка Supabase:', error);
    }

    if (!error && data) {
      setStudents(data);
    }
    setLoadingStudents(false);
  };

  const validStudents = students.filter((s) => {
    const login = s.login !== undefined && s.login !== null ? String(s.login).trim() : '';
    const name = s.name !== undefined && s.name !== null ? String(s.name).trim() : '';
    const studentName = s.student_name !== undefined && s.student_name !== null ? String(s.student_name).trim() : '';

    return login !== '' || name !== '' || studentName !== '';
  });

  const studentName = studentData?.name || 'Ученик';
  const groupName = studentData?.group_name || 'Без группы';
  const roomId = activeLesson ? `lesson_${groupName}_${activeLesson.id}` : '';

  return (
    <div style={styles.container}>
    
      <div style={styles.header}>
        <h2 style={{ margin: 0, color: '#FFF' }}>🎓 Кабинет ученика: {studentName}</h2>
        <span style={styles.groupBadge}>Группа: {groupName}</span>
      </div>

      {activeLesson ? (
        <div style={{ marginTop: '20px' }}>
          <h3 style={{ color: '#4ADE80', marginBottom: '16px' }}>
            🔴 Идет онлайн-урок: {activeLesson.title}
          </h3>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <VideoLesson roomName={roomId} userName={studentName} />
            <LiveChat roomId={roomId} userName={studentName} isTeacher={false} />
          </div>
        </div>
      ) : (
        <div style={styles.noLessonCard}>
          😴 В вашей группе сейчас нет активных онлайн-уроков. Ожидайте запуска от преподавателя.
        </div>
      )}

      <div style={styles.studentsSection}>
        <h3 style={{ color: '#FFF', marginBottom: '12px' }}>
          Список одногруппников ({validStudents.length})
        </h3>

        {loadingStudents ? (
          <p style={{ color: '#94A3B8' }}>Загрузка списка...</p>
        ) : (
          <table style={styles.table}>
            <thead>
              <tr>
                <th style={styles.th}>ID</th>
                <th style={styles.th}>Логин / Имя</th>
              </tr>
            </thead>
            <tbody>
              {validStudents.map((st, index) => {
                const displayName = st.login || st.student_name || st.name || 'Без имени';

                return (
                  <tr key={st.id || index}>
                    <td style={styles.td}>{st.id || index + 1}</td>
                    <td style={styles.td}>{displayName}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

const styles = {
  container: {
    padding: '20px',
    maxWidth: '950px',
    margin: '0 auto',
    fontFamily: 'sans-serif'
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#1E293B',
    padding: '16px 20px',
    borderRadius: '12px',
    borderWidth: '1px',
    borderStyle: 'solid',
    borderColor: '#334155'
  },
  groupBadge: {
    backgroundColor: '#0284C7',
    color: '#FFF',
    padding: '6px 12px',
    borderRadius: '8px',
    fontWeight: 'bold',
    fontSize: '13px'
  },
  noLessonCard: {
    marginTop: '20px',
    padding: '24px',
    backgroundColor: '#1E293B',
    borderRadius: '12px',
    color: '#94A3B8',
    textAlign: 'center',
    borderWidth: '1px',
    borderStyle: 'solid',
    borderColor: '#334155'
  },
  studentsSection: {
    marginTop: '30px',
    backgroundColor: '#1E293B',
    padding: '20px',
    borderRadius: '12px',
    borderWidth: '1px',
    borderStyle: 'solid',
    borderColor: '#334155'
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
    color: '#F8FAFC'
  },
  th: {
    textAlign: 'left',
    padding: '10px',
    borderBottom: '1px solid #334155',
    color: '#94A3B8'
  },
  td: {
    padding: '10px',
    borderBottom: '1px solid #334155'
  }
};