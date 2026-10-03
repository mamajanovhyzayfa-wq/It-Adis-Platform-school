import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import StudentDashboard from './StudentDashboard';

export default function StudentLessonsPage({ studentGroup = '9-А' }) {
  const [lessons, setLessons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLesson, setSelectedLesson] = useState(null);

  useEffect(() => {
    fetchPastLessons();
  }, [studentGroup]);

  const fetchPastLessons = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('lessons')
      .select('*')
      .eq('group_name', studentGroup)
      .order('created_at', { ascending: false });

    if (!error && data) {
      setLessons(data);
      
      if (data.length > 0) {
        setSelectedLesson(data[0]);
      }
    }
    setLoading(false);
  };

  const filteredLessons = lessons.filter((lesson) =>
    lesson.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getEmbedYoutubeUrl = (url) => {
    if (!url) return null;
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    return match && match[2].length === 11
      ? `https://www.youtube.com/embed/${match[2]}`
      : url;
  };

  return (
    <div style={styles.container}>
      {/* Шапка раздела */}
      <div style={styles.header}>
        <div>
          <h2 style={{ margin: 0, color: '#FFF', fontSize: '22px' }}>
            📚 Архив видеоуроков
          </h2>
          <p style={{ margin: '4px 0 0 0', color: '#94A3B8', fontSize: '13px' }}>
            Просмотр пройденных тем и материалов для группы <b style={{ color: '#38BDF8' }}>{studentGroup}</b>
          </p>
        </div>

        <input
          type="text"
          placeholder="🔍 Найти тему урока..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          style={styles.searchInput}
        />
      </div>

      {loading ? (
        <div style={styles.card}>
          <p style={{ color: '#94A3B8', textAlign: 'center' }}>Загрузка видеоуроков...</p>
        </div>
      ) : lessons.length === 0 ? (
        <div style={styles.card}>
          <p style={{ color: '#94A3B8', textAlign: 'center' }}>
            Для вашей группы пока нет записанных уроков.
          </p>
        </div>
      ) : (
        <div style={styles.mainGrid}>
        
          <div style={styles.videoSection}>
            {selectedLesson ? (
              <div style={styles.card}>
                <h3 style={{ margin: '0 0 12px 0', color: '#FACC15', fontSize: '20px' }}>
                  🎬 {selectedLesson.title}
                </h3>
                <p style={{ margin: '0 0 16px 0', color: '#94A3B8', fontSize: '13px' }}>
                  Дата проведения: {new Date(selectedLesson.created_at).toLocaleDateString('ru-RU')}
                </p>

                
                {selectedLesson.video_url ? (
                  <div style={styles.videoWrapper}>
                    {selectedLesson.video_url.includes('youtube') || selectedLesson.video_url.includes('youtu.be') ? (
                      <iframe
                        src={getEmbedYoutubeUrl(selectedLesson.video_url)}
                        title={selectedLesson.title}
                        style={styles.iframe}
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                      />
                    ) : (
                      <video controls style={styles.videoPlayer}>
                        <source src={selectedLesson.video_url} type="video/mp4" />
                        Ваш браузер не поддерживает видеоплеер.
                      </video>
                    )}
                  </div>
                ) : (
                  <div style={styles.noVideoBox}>
                    <p style={{ color: '#94A3B8', margin: 0 }}>
                      ⚠️ Для этого урока запись видео не прикреплена.
                    </p>
                  </div>
                )}
              </div>
            ) : (
              <div style={styles.card}>
                <p style={{ color: '#94A3B8' }}>Выберите урок из списка справа для просмотра.</p>
              </div>
            )}
          </div>

          
          <div style={styles.listSection}>
            <div style={styles.card}>
              <h4 style={{ margin: '0 0 14px 0', color: '#FFF', fontSize: '16px' }}>
                📋 Пройденные темы ({filteredLessons.length})
              </h4>

              <div style={styles.lessonList}>
                {filteredLessons.map((lesson, idx) => {
                  const isSelected = selectedLesson?.id === lesson.id;
                  return (
                    <div
                      key={lesson.id || idx}
                      onClick={() => setSelectedLesson(lesson)}
                      style={{
                        ...styles.lessonItem,
                        ...(isSelected ? styles.selectedItem : {})
                      }}
                    >
                      <div style={{ fontWeight: 'bold', color: isSelected ? '#FFF' : '#E2E8F0', fontSize: '14px' }}>
                        {idx + 1}. {lesson.title}
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '6px', fontSize: '12px', color: '#94A3B8' }}>
                        <span>📅 {new Date(lesson.created_at).toLocaleDateString('ru-RU')}</span>
                        {lesson.video_url ? (
                          <span style={{ color: '#4ADE80' }}>🎥 Видео есть</span>
                        ) : (
                          <span style={{ color: '#64748B' }}>Без видео</span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const styles = {
  container: {
    maxWidth: '1000px',
    margin: '0 auto',
    fontFamily: 'sans-serif'
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#1E293B',
    padding: '20px 24px',
    borderRadius: '16px',
    borderWidth: '1px',
    borderStyle: 'solid',
    borderColor: '#334155',
    marginBottom: '20px',
    flexWrap: 'wrap',
    gap: '12px'
  },
  searchInput: {
    backgroundColor: '#0F172A',
    borderWidth: '1px',
    borderStyle: 'solid',
    borderColor: '#334155',
    padding: '10px 16px',
    borderRadius: '8px',
    color: '#FFF',
    fontSize: '14px',
    outline: 'none',
    width: '240px'
  },
  card: {
    backgroundColor: '#1E293B',
    padding: '20px',
    borderRadius: '16px',
    borderWidth: '1px',
    borderStyle: 'solid',
    borderColor: '#334155',
    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)'
  },
  mainGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 320px',
    gap: '20px'
  },
  videoSection: {
    display: 'flex',
    flexDirection: 'column'
  },
  listSection: {
    display: 'flex',
    flexDirection: 'column'
  },
  videoWrapper: {
    position: 'relative',
    paddingBottom: '56.25%', /* 16:9 Aspect Ratio */
    height: 0,
    overflow: 'hidden',
    borderRadius: '12px',
    backgroundColor: '#0F172A'
  },
  iframe: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    border: 0,
    borderRadius: '12px'
  },
  videoPlayer: {
    width: '100%',
    borderRadius: '12px'
  },
  noVideoBox: {
    backgroundColor: '#0F172A',
    padding: '40px 20px',
    borderRadius: '12px',
    textAlign: 'center',
    borderWidth: '1px',
    borderStyle: 'dashed',
    borderColor: '#334155'
  },
  lessonList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
    maxHeight: '480px',
    overflowY: 'auto',
    paddingRight: '4px'
  },
  lessonItem: {
    backgroundColor: '#0F172A',
    padding: '12px 14px',
    borderRadius: '10px',
    borderWidth: '1px',
    borderStyle: 'solid',
    borderColor: '#334155',
    cursor: 'pointer',
    transition: '0.2s'
  },
  selectedItem: {
    borderColor: '#FACC15',
    backgroundColor: '#1E293B',
    boxShadow: '0 0 10px rgba(250, 204, 21, 0.2)'
  }
};