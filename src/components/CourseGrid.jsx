import React from 'react';

export default function CourseGrid() {
  const courses = [
    {
      id: 1,
      title: 'Python Разработка',
      level: '10-17 лет',
      badge: '🔥 Популярное',
      color: '#6A1B9A',
    },
    {
      id: 2,
      title: 'Создание игр в Roblox',
      level: '8-13 лет',
      badge: '🎮 Геймдев',
      color: '#1565C0',
    },
    {
      id: 3,
      title: 'Frontend (HTML/CSS/JS)',
      level: '12-17 лет',
      badge: '⚡ Веб',
      color: '#2E7D32',
    },
    {
      id: 4,
      title: '3D-моделирование в Blender',
      level: '10-16 лет',
      badge: '🎨 Дизайн',
      color: '#D84315',
    },
  ];

  return (
    <div>
      <h2 style={{ color: '#FFF', marginBottom: '20px' }}>Мои учебные треки</h2>
      <div style={styles.courseGrid}>
        {courses.map((c) => (
          <div key={c.id} style={styles.courseCard}>
            <span style={{ ...styles.courseTag, backgroundColor: c.color }}>{c.badge}</span>
            <h3 style={{ color: '#FFF', margin: '15px 0 10px' }}>{c.title}</h3>
            <p style={{ color: '#A0AABC', fontSize: '14px' }}>Возраст: {c.level}</p>
            <button style={styles.cardBtn}>Открыть материалы →</button>
          </div>
        ))}
      </div>
    </div>
  );
}

const styles = {
  courseGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
    gap: '20px',
  },
  courseCard: {
    backgroundColor: '#1E293B',
    border: '1px solid #334155',
    borderRadius: '14px',
    padding: '20px',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-between',
  },
  courseTag: {
    alignSelf: 'flex-start',
    padding: '4px 10px',
    borderRadius: '6px',
    fontSize: '12px',
    fontWeight: 'bold',
    color: '#FFF',
  },
  cardBtn: {
    marginTop: '15px',
    backgroundColor: '#334155',
    color: '#38BDF8',
    border: 'none',
    padding: '10px',
    borderRadius: '8px',
    cursor: 'pointer',
    fontWeight: 'bold',
  },
};