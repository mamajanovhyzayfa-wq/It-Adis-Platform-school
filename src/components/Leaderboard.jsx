import React, { useEffect, useState, useCallback } from 'react';
import { supabase } from '../supabaseClient';

export default function Leaderboard() {
  const [topStudents, setTopStudents] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchLeaderboard = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('students')
        .select('*')
        .order('xp', { ascending: false })
        .limit(10);

      if (error) {
        console.error(error);
      } else {
        setTopStudents(Array.isArray(data) ? data : []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchLeaderboard();

    const channel = supabase
      .channel('realtime-leaderboard')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'students' },
        () => fetchLeaderboard()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchLeaderboard]);

  const getRankBadge = (index) => {
    if (index === 0) return '🥇';
    if (index === 1) return '🥈';
    if (index === 2) return '🥉';
    return `#${index + 1}`;
  };

  const formatBadges = (badges) => {
    if (Array.isArray(badges) && badges.length > 0) return badges.join(' ');
    return '🚀 Новичок';
  };

  return (
    <div style={styles.card}>
      <h3 style={{ margin: '0 0 16px 0', color: '#FACC15', textAlign: 'center' }}>
        🏆 Зал Славы (Топ Учеников)
      </h3>

      {loading ? (
        <p style={{ color: '#94A3B8', textAlign: 'center' }}>Загрузка топа...</p>
      ) : topStudents.length === 0 ? (
        <p style={{ color: '#94A3B8', textAlign: 'center' }}>Пока нет данных.</p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {topStudents.map((student, index) => (
            <div key={student.id ?? student.name ?? index} style={styles.row}>
              <div style={styles.rank}>{getRankBadge(index)}</div>

              <div style={styles.info}>
                <div style={{ fontWeight: 'bold', color: '#FFF' }}>{student.name}</div>
                <div style={{ fontSize: '12px', color: '#94A3B8' }}>
                  Уровень {student.level || 1} • {formatBadges(student.badges)}
                </div>
              </div>

              <div style={styles.xpBox}>⚡ {student.xp || 0} XP</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

const styles = {
  card: {
    backgroundColor: '#1E293B',
    padding: '24px',
    borderRadius: '16px',
    border: '1px solid #334155',
    maxWidth: '480px',
    margin: '20px auto 0 auto',
  },
  row: {
    display: 'flex',
    alignItems: 'center',
    backgroundColor: '#0F172A',
    padding: '12px',
    borderRadius: '10px',
    border: '1px solid #334155',
    gap: '12px',
  },
  rank: {
    fontSize: '20px',
    fontWeight: 'bold',
    width: '36px',
    textAlign: 'center',
    color: '#38BDF8',
  },
  info: { flex: 1 },
  xpBox: {
    backgroundColor: 'rgba(245, 158, 11, 0.2)',
    color: '#FACC15',
    border: '1px solid #F59E0B',
    padding: '6px 12px',
    borderRadius: '8px',
    fontWeight: 'bold',
    fontSize: '14px',
  },
};