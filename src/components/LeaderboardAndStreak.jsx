import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../supabaseClient';

export default function LeaderboardAndStreak({ studentName = 'Ученик' }) {
  const [leaderboard, setLeaderboard] = useState([]);
  const [streakDays, setStreakDays] = useState(3);
  const [loading, setLoading] = useState(true);

  const fetchLeaderboard = useCallback(async () => {
    setLoading(true);

    const { data, error } = await supabase
      .from('student_xp')
      .select('student_name, xp_gained');

    if (!error && data) {
      const xpMap = {};
      data.forEach((row) => {
        if (!row || !row.student_name) return;
        const gained = Number(row.xp_gained) || 0;
        xpMap[row.student_name] = (xpMap[row.student_name] || 0) + gained;
      });

      const sortedList = Object.keys(xpMap)
        .map((name) => ({ name, xp: xpMap[name] }))
        .sort((a, b) => b.xp - a.xp);

      setLeaderboard(sortedList);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchLeaderboard();
  }, [fetchLeaderboard]);

  return (
    <div style={styles.grid}>
      <div style={styles.streakCard}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={styles.fireIcon}>🔥</div>
          <div>
            <div style={styles.streakTitle}>{streakDays} Дня подряд!</div>
            <div style={styles.streakSub}>
              Не пропусти завтрашний урок, чтобы не сбросить ударный режим.
            </div>
          </div>
        </div>

        <div style={styles.daysRow}>
          {['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'].map((day, idx) => (
            <div
              key={day}
              style={{
                ...styles.dayCircle,
                backgroundColor: idx < streakDays ? '#F59E0B' : '#0F172A',
                color: idx < streakDays ? '#0F172A' : '#64748B',
                border: idx < streakDays ? '2px solid #FCD34D' : '1px solid #334155',
              }}
            >
              {day}
            </div>
          ))}
        </div>
      </div>

      <div style={styles.card}>
        <h3
          style={{
            color: '#FACC15',
            margin: '0 0 12px 0',
            fontSize: '16px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          🏆 Зал Славы (Топ учеников)
        </h3>

        {loading ? (
          <p style={{ color: '#94A3B8', fontSize: '13px' }}>Загрузка рейтинга...</p>
        ) : leaderboard.length === 0 ? (
          <p style={{ color: '#94A3B8', fontSize: '13px' }}>
            Пока никто не заработал XP. Будь первым!
          </p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {leaderboard.slice(0, 5).map((item, index) => (
              <div
                key={item.name}
                style={{
                  ...styles.rankRow,
                  border: item.name === studentName ? '1px solid #FACC15' : '1px solid #334155',
                  backgroundColor: item.name === studentName ? '#1E1B4B' : '#0F172A',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span
                    style={{
                      fontWeight: 'bold',
                      fontSize: '14px',
                      color:
                        index === 0
                          ? '#FACC15'
                          : index === 1
                          ? '#94A3B8'
                          : index === 2
                          ? '#B45309'
                          : '#64748B',
                    }}
                  >
                    #{index + 1}
                  </span>
                  <span
                    style={{
                      color: '#FFF',
                      fontSize: '14px',
                      fontWeight: item.name === studentName ? 'bold' : 'normal',
                    }}
                  >
                    {item.name} {item.name === studentName && ' (Вы)'}
                  </span>
                </div>

                <div style={styles.xpPill}>⚡ {item.xp} XP</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

const styles = {
  grid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '16px',
    marginTop: '20px',
  },
  card: {
    backgroundColor: '#1E293B',
    padding: '20px',
    borderRadius: '12px',
    border: '1px solid #334155',
  },
  streakCard: {
    backgroundColor: '#1E293B',
    padding: '20px',
    borderRadius: '12px',
    border: '1px solid #F59E0B',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-between',
  },
  fireIcon: {
    fontSize: '36px',
    backgroundColor: '#0F172A',
    padding: '8px',
    borderRadius: '12px',
    border: '1px solid #F59E0B',
  },
  streakTitle: {
    color: '#FACC15',
    fontSize: '18px',
    fontWeight: 'bold',
  },
  streakSub: {
    color: '#94A3B8',
    fontSize: '12px',
    marginTop: '2px',
  },
  daysRow: {
    display: 'flex',
    justifyContent: 'space-between',
    marginTop: '16px',
  },
  dayCircle: {
    width: '32px',
    height: '32px',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '12px',
    fontWeight: 'bold',
  },
  rankRow: {
    padding: '8px 12px',
    borderRadius: '8px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  xpPill: {
    backgroundColor: '#334155',
    color: '#FACC15',
    padding: '2px 8px',
    borderRadius: '12px',
    fontSize: '12px',
    fontWeight: 'bold',
  },
};