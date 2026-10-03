import React, { useState } from 'react';
import { supabase } from '../supabaseClient';

export default function HomeworkSection({ studentName, studentCode }) {
  const [taskUrl, setTaskUrl] = useState('');
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);

  const allowedDomains = [
    'github.com',
    'replit.com',
    'figma.com',
    'codepen.io',
    'drive.google.com'
  ];

  const isValidUrl = (urlString) => {
    try {
      const parsedUrl = new URL(urlString);
      return allowedDomains.some(domain => parsedUrl.hostname.includes(domain));
    } catch (e) {
      return false;
    }
  };

  const handleSubmitHomework = async (e) => {
    e.preventDefault();
    const cleanUrl = taskUrl.trim();

    if (!cleanUrl) {
      setMessage({ text: 'Укажите ссылку на выполненную работу!', type: 'error' });
      return;
    }

    if (!isValidUrl(cleanUrl)) {
      setMessage({ 
        text: '❌ Недопустимый адрес! Принимаются только ссылки на GitHub, Replit, Figma, CodePen или Google Drive.', 
        type: 'error' 
      });
      return;
    }

    setLoading(true);
    setMessage(null);

    try {
      const { error } = await supabase.from('homeworks').insert([
        {
          student_name: studentName,
          student_code: studentCode || null,
          url: cleanUrl,
          comment: comment.trim(),
          status: 'На проверке',
          created_at: new Date().toISOString()
        }
      ]);

      if (error) throw error;

      setMessage({ text: '📩 Домашнее задание успешно отправлено учительнице!', type: 'success' });
      setTaskUrl('');
      setComment('');
    } catch (err) {
      console.error('Ошибка отправки ДЗ:', err);
      setMessage({ text: 'Не удалось отправить задание. Попробуйте еще раз.', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.card}>
      <h3 style={styles.title}>📚 Сдать домашнее задание</h3>
      <form onSubmit={handleSubmitHomework} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        <div>
          <label style={styles.label}>Ссылка на проект (GitHub, Replit, Figma, CodePen, Google Drive):</label>
          <input
            type="url"
            placeholder="https://github.com/username/project"
            value={taskUrl}
            onChange={(e) => setTaskUrl(e.target.value)}
            style={styles.input}
            required
          />
        </div>

        <div>
          <label style={styles.label}>Комментарий для учителя (необязательно):</label>
          <textarea
            placeholder="Что было сделано или вызвало трудности..."
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            style={{ ...styles.input, height: '70px', resize: 'vertical' }}
          />
        </div>

        {message && (
          <div style={message.type === 'success' ? styles.msgSuccess : styles.msgError}>
            {message.text}
          </div>
        )}

        <button type="submit" disabled={loading} style={styles.submitBtn}>
          {loading ? 'Отправляем...' : 'Сдать работу 📤'}
        </button>
      </form>
    </div>
  );
}

const styles = {
  card: { backgroundColor: '#1E293B', padding: '24px', borderRadius: '16px', border: '1px solid #334155', fontFamily: 'sans-serif' },
  title: { color: '#FFF', margin: '0 0 16px 0', fontSize: '18px' },
  label: { fontSize: '12px', color: '#94A3B8', display: 'block', marginBottom: '4px' },
  input: { width: '100%', backgroundColor: '#0F172A', border: '1px solid #334155', padding: '10px 12px', borderRadius: '8px', color: '#FFF', fontSize: '14px', boxSizing: 'border-box' },
  submitBtn: { backgroundColor: '#3B82F6', color: '#FFF', border: 'none', padding: '12px', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', fontSize: '15px' },
  msgError: { padding: '10px', backgroundColor: 'rgba(239, 68, 68, 0.15)', color: '#F87171', borderRadius: '8px', fontSize: '13px', textAlign: 'center', border: '1px solid #EF4444' },
  msgSuccess: { padding: '10px', backgroundColor: 'rgba(74, 222, 128, 0.15)', color: '#4ADE80', borderRadius: '8px', fontSize: '13px', textAlign: 'center', border: '1px solid #22C55E' }
};