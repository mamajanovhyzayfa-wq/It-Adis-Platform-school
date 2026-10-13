import React, { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '../supabaseClient';

export default function NotificationBell({ studentName = 'Ученик' }) {
  const [notifications, setNotifications] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const channelsRef = useRef([]);

  const playNotifSound = useCallback(() => {
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.frequency.setValueAtTime(587.33, ctx.currentTime);
      osc.frequency.setValueAtTime(880, ctx.currentTime + 0.1);
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.3);
      osc.start();
      osc.stop(ctx.currentTime + 0.3);
    } catch (e) {
      /* ignore */
    }
  }, []);

  const addNotification = useCallback(
    (text) => {
      const newNotif = {
        id: Date.now() + Math.random(),
        text,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        read: false,
      };
      setNotifications((prev) => [newNotif, ...prev]);
      setUnreadCount((prev) => prev + 1);
      playNotifSound();
    },
    [playNotifSound]
  );

  useEffect(() => {
    const hwChannel = supabase
      .channel('notif_hw')
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'homeworks' },
        (payload) => {
          if (payload.new && payload.new.student_name === studentName) {
            addNotification(
              `📝 Домашка "${payload.new.title}": статус изменен на "${payload.new.status}"!`
            );
          }
        }
      )
      .subscribe();

    const quizChannel = supabase
      .channel('notif_quiz')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'quizzes' },
        (payload) => {
          if (payload.new && payload.new.is_active) {
            addNotification('🧠 Учитель опубликовал новый вопрос на закрепление!');
          }
        }
      )
      .subscribe();

    channelsRef.current = [hwChannel, quizChannel];

    return () => {
      channelsRef.current.forEach((ch) => supabase.removeChannel(ch));
      channelsRef.current = [];
    };
  }, [studentName, addNotification]);

  const toggleOpen = () => {
    setIsOpen((prev) => {
      const next = !prev;
      if (next) setUnreadCount(0);
      return next;
    });
  };

  return (
    <div style={styles.wrapper}>
      <button onClick={toggleOpen} style={styles.bellBtn} aria-label="Уведомления">
        🔔
        {unreadCount > 0 && <span style={styles.badge}>{unreadCount}</span>}
      </button>

      {isOpen && (
        <div style={styles.dropdown}>
          <div style={styles.dropHeader}>
            <span style={{ fontWeight: 'bold', color: '#FFF', fontSize: '14px' }}>
              Уведомления
            </span>
            <span style={{ color: '#94A3B8', fontSize: '12px' }}>
              {notifications.length} всего
            </span>
          </div>

          <div style={styles.list}>
            {notifications.length === 0 ? (
              <div style={styles.empty}>Уведомлений пока нет</div>
            ) : (
              notifications.map((n) => (
                <div key={n.id} style={styles.item}>
                  <div style={styles.itemText}>{n.text}</div>
                  <div style={styles.itemTime}>{n.time}</div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}

const styles = {
  wrapper: { position: 'relative', display: 'inline-block' },
  bellBtn: {
    backgroundColor: '#1E293B',
    border: '1px solid #334155',
    color: '#FFF',
    fontSize: '18px',
    padding: '8px 12px',
    borderRadius: '10px',
    cursor: 'pointer',
    position: 'relative',
  },
  badge: {
    position: 'absolute',
    top: '-4px',
    right: '-4px',
    backgroundColor: '#EF4444',
    color: '#FFF',
    fontSize: '10px',
    fontWeight: 'bold',
    borderRadius: '10px',
    padding: '2px 6px',
    border: '2px solid #0F172A',
  },
  dropdown: {
    position: 'absolute',
    right: 0,
    top: '45px',
    width: '300px',
    backgroundColor: '#1E293B',
    border: '1px solid #334155',
    borderRadius: '12px',
    boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.5)',
    zIndex: 100,
    overflow: 'hidden',
  },
  dropHeader: {
    padding: '12px 16px',
    backgroundColor: '#0F172A',
    borderBottom: '1px solid #334155',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  list: { maxHeight: '260px', overflowY: 'auto' },
  empty: {
    padding: '20px',
    textAlign: 'center',
    color: '#94A3B8',
    fontSize: '13px',
  },
  item: {
    padding: '10px 14px',
    borderBottom: '1px solid #334155',
    fontSize: '13px',
    color: '#E2E8F0',
  },
  itemText: { lineHeight: '1.4' },
  itemTime: { fontSize: '10px', color: '#64748B', marginTop: '4px' },
};