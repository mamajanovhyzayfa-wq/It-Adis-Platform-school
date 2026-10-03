import React, { useState, useEffect } from 'react';
import ZoomMeeting from '../components/ZoomMeeting';

export default function VideoPage({ student }) {
  console.log("VideoPage mounted! Проверяем открытие вкладки видео.");

  const [zoomConfig, setZoomConfig] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    console.log("useEffect в VideoPage запущен, отправляем запрос на бэкенд...");
    const meetingNumber = '89563681827';
    const role = 0;

    fetch('http://localhost:5000/api/zoom-signature', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ meetingNumber, role })
    })
      .then((res) => res.json())
      .then((data) => {
        console.log("Ответ от бэкенда получен:", data);
        setZoomConfig({
          meetingNumber,
          sdkKey: data.sdkKey,
          signature: data.signature,
          userName: student ? student.name : 'Ученик',
          passWord: ''
        });
        setLoading(false);
      })
      .catch((err) => {
        console.error('Ошибка получения подписи Zoom:', err);
        setLoading(false);
      });
  }, [student]);

  if (loading) {
    return <div style={{ color: '#FFF', padding: '20px' }}>Загрузка конференции...</div>;
  }

  if (!zoomConfig) {
    return <div style={{ color: '#EF4444', padding: '20px' }}>Не удалось подключиться к серверу Zoom.</div>;
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