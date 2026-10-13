import React, { useState, useEffect } from 'react';
import ZoomMeeting from '../components/ZoomMeeting';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export default function VideoPage({ student, role = 0, meetingNumber: meetingNumberProp }) {
  // ИСПРАВЛЕНО: раньше номер был жёстко зашит ('89563681827').
  // Теперь приоритет: пропс → переменная окружения VITE_ZOOM_MEETING_NUMBER
  const meetingNumber = String(
    meetingNumberProp || import.meta.env.VITE_ZOOM_MEETING_NUMBER || '86568978990'
  ).trim();

  const [zoomConfig, setZoomConfig] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!meetingNumber) {
      setLoading(false);
      setError('Zoom Meeting ID не задан. Укажите VITE_ZOOM_MEETING_NUMBER в .env');
      return;
    }

    fetch(`${API_URL}/api/zoom-signature`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ meetingNumber, role }),
    })
      .then((res) => {
        if (!res.ok) throw new Error(`Сервер ответил ${res.status}`);
        return res.json();
      })
      .then((data) => {
        if (!data.signature || !data.sdkKey) {
          throw new Error('Сервер вернул подпись без signature/sdkKey');
        }
        setZoomConfig({
          meetingNumber,
          sdkKey: data.sdkKey,
          signature: data.signature,
          userName: student ? student.name : 'Ученик',
          passWord: data.passWord || '',
        });
      })
      .catch((err) => {
        console.error('Ошибка получения подписи Zoom:', err);
        setError(err.message);
      })
      .finally(() => setLoading(false));
  }, [meetingNumber, role, student]);

  if (!meetingNumber) {
    return (
      <div style={{ color: '#EF4444', padding: '20px', textAlign: 'center' }}>
        ⚠️ Zoom Meeting ID не настроен. Добавьте VITE_ZOOM_MEETING_NUMBER в файл .env
      </div>
    );
  }

  if (loading) {
    return <div style={{ color: '#FFF', padding: '20px', textAlign: 'center' }}>Загрузка конференции...</div>;
  }

  if (error || !zoomConfig) {
    return (
      <div style={{ color: '#EF4444', padding: '20px', textAlign: 'center' }}>
        Не удалось подключиться к серверу Zoom{error ? `: ${error}` : ''}.
        <br />
        <small style={{ color: '#94A3B8' }}>
          Убедитесь, что сервер подписи запущен (server/zoom-server.js) и VITE_API_URL корректен.
        </small>
      </div>
    );
  }

  return (
    <div style={{ width: '100%', height: '80vh' }}>
      <ZoomMeeting
        meetingNumber={zoomConfig.meetingNumber}
        passWord={zoomConfig.passWord}
        userName={zoomConfig.userName}
        signature={zoomConfig.signature}
        sdkKey={zoomConfig.sdkKey}
      />
    </div>
  );
}