import React, { useState, useEffect } from 'react';
import StudentForm from '../components/StudentForm';
import StudentDashboard from '../components/StudentDashboard';
import QuizSection from '../components/QuizSection';
import HomeworkSection from '../components/HomeworkSection';
import TeacherPage from './TeacherPage';

export default function HomePage({ student, setStudent }) {
  const [view, setView] = useState('student');

  useEffect(() => {
    const savedStudent = localStorage.getItem('app_student');
    if (savedStudent && !student) {
      try {
        setStudent(JSON.parse(savedStudent));
      } catch (e) {
        console.error('Ошибка чтения сессии:', e);
      }
    }
  }, [setStudent, student]);

  const handleStudentLogin = (studentData) => {
    setStudent(studentData);
    localStorage.setItem('app_student', JSON.stringify(studentData));
  };

  const handleLogout = () => {
    setStudent(null);
    localStorage.removeItem('app_student');
  };

  return (
    <div style={{ maxWidth: '600px', margin: '0 auto', padding: '20px', fontFamily: 'sans-serif' }}>
      <div style={{ display: 'flex', justifyContent: 'center', gap: '10px', marginBottom: '20px' }}>
        <button 
          onClick={() => setView('student')} 
          style={{
            padding: '8px 16px',
            borderRadius: '8px',
            border: 'none',
            backgroundColor: view === 'student' ? '#8B5CF6' : '#334155',
            color: '#FFF',
            fontWeight: 'bold',
            cursor: 'pointer'
          }}
        >
          👨‍🎓 Вход для ученика
        </button>
        <button 
          onClick={() => setView('teacher')} 
          style={{
            padding: '8px 16px',
            borderRadius: '8px',
            border: 'none',
            backgroundColor: view === 'teacher' ? '#8B5CF6' : '#334155',
            color: '#FFF',
            fontWeight: 'bold',
            cursor: 'pointer'
          }}
        >
          👨‍🏫 Кабинет учителя
        </button>
      </div>

      {view === 'student' ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {student && (
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#1E293B', padding: '12px 20px', borderRadius: '12px', border: '1px solid #334155' }}>
              <span style={{ color: '#FFF' }}>👤 Ученик: <b>{student.name}</b></span>
              <button onClick={handleLogout} style={{ backgroundColor: '#EF4444', color: '#FFF', border: 'none', padding: '6px 12px', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}>
                Выйти
              </button>
            </div>
          )}

          <StudentForm onLogin={handleStudentLogin} />

          {student && (
            <>
              <StudentDashboard studentCode={student.code || student.student_code} />
              <QuizSection 
                studentName={student.name} 
                studentCode={student.code || student.student_code} 
              />
              <HomeworkSection 
                studentName={student.name} 
                studentCode={student.code || student.student_code} 
              />
            </>
          )}
        </div>
      ) : (
        <TeacherPage />
      )}
    </div>
  );
}