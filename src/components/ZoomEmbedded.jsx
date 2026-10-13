import React, { useEffect, useState } from 'react';
import { ZoomMtg } from '@zoom/meetingsdk';

const SIGNATURE_SERVER = import.meta.env.VITE_ZOOM_SIGNATURE_SERVER || 'http://localhost:5000';

export default function ZoomEmbedded({ student, sdkKey: sdkKeyProp = '' }) {
  const [meetingConfig, setMeetingConfig] = useState({
    meetingNumber: '',
    passWord: '',
    userName: student ? student.name : 'Ученик IT ADIS',
    userEmail: '',
    role: 0
  });

  const [isInMeeting, setIsInMeeting] = useState(false);

  const startMeeting = async (e) => {
    e.preventDefault();

    const sdkKey = sdkKeyProp || import.meta.env.VITE_ZOOM_SDK_KEY;
    if (!sdkKey) {
      alert('Не задан Zoom SDK Key (проп sdkKey или VITE_ZOOM_SDK_KEY в .env)');
      return;
    }

    try {
      const response = await fetch(`${SIGNATURE_SERVER}/api/zoom-signature`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          meetingNumber: String(meetingConfig.meetingNumber),
          role: meetingConfig.role
        })
      });

      if (!response.ok) {
        throw new Error(`Сервер подписи ответил ${response.status}`);
      }

      const data = await response.json();
      if (!data.signature) {
        alert('Не удалось получить цифровую подпись от сервера');
        return;
      }

      const zoomRoot = document.getElementById('zmmtg-root');
      if (zoomRoot) zoomRoot.style.display = 'block';
      setIsInMeeting(true);

      ZoomMtg.setZoomJSLib('https://source.zoom.us/2.18.2/lib', '/av');
      ZoomMtg.preLoadWasm();
      ZoomMtg.prepareWebSDK();

      ZoomMtg.init({
        leaveUrl: window.location.origin,
        patchJsMedia: true,
        success: () => {
          ZoomMtg.join({
            signature: data.signature,
            sdkKey: sdkKey,
            meetingNumber: String(meetingConfig.meetingNumber),
            passWord: meetingConfig.passWord,
            userName: meetingConfig.userName,
            userEmail: meetingConfig.userEmail,
            success: (success) => {
              console.log('Успешный вход в конференцию:', success);
            },
            error: (error) => {
              console.error('Ошибка входа:', error);
            }
          });
        },
        error: (error) => {
          console.error('Ошибка инициализации Zoom SDK:', error);
        }
      });

    } catch (err) {
      console.error('Ошибка соединения с сервером подписи:', err);
      alert(`Ошибка: ${err.message}`);
    }
  };

  return (
    <div style={styles.container}>
      <h2 style={{ color: '#FACC15', marginBottom: '10px' }}>🧩 Встроенный видеоурок Zoom (Component View)</h2>
      <p style={{ color: '#94A3B8', marginBottom: '20px' }}>
        Урок отображается прямо на платформе IT ADIS без перенаправления на сторонние сайты.
      </p>

      {!isInMeeting ? (
        <div style={styles.card}>
          <form onSubmit={startMeeting} style={styles.form}>
            <input
              type="text"
              placeholder="Номер конференции (Meeting ID)"
              value={meetingConfig.meetingNumber}
              onChange={(e) => setMeetingConfig({...meetingConfig, meetingNumber: e.target.value})}
              style={styles.input}
              required
            />
            <input
              type="text"
              placeholder="Пароль конференции (если есть)"
              value={meetingConfig.passWord}
              onChange={(e) => setMeetingConfig({...meetingConfig, passWord: e.target.value})}
              style={styles.input}
            />
            <input
              type="text"
              placeholder="Ваше имя"
              value={meetingConfig.userName}
              onChange={(e) => setMeetingConfig({...meetingConfig, userName: e.target.value})}
              style={styles.input}
              required
            />
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <label style={{ color: '#FFF', fontSize: '14px' }}>Роль:</label>
              <select
                value={meetingConfig.role}
                onChange={(e) => setMeetingConfig({...meetingConfig, role: Number(e.target.value)})}
                style={styles.input}
              >
                <option value={0}>Ученик (Участник)</option>
                <option value={1}>Учитель (Организатор)</option>
              </select>
            </div>
            <button type="submit" style={styles.btn}>🚀 Подключиться к уроку</button>
          </form>
        </div>
      ) : null}

      <div id="zmmtg-root" style={styles.zoomContainer}></div>
    </div>
  );
}

const styles = {
  container: { maxWidth: '900px', margin: '0 auto', padding: '10px' },
  card: { backgroundColor: '#1E293B', border: '1px solid #334155', borderRadius: '12px', padding: '20px' },
  form: { display: 'flex', flexDirection: 'column', gap: '15px' },
  input: { padding: '10px 14px', borderRadius: '8px', border: '1px solid #475569', backgroundColor: '#0F172A', color: '#FFF', fontSize: '14px' },
  btn: { backgroundColor: '#2563EB', color: '#FFF', border: 'none', padding: '12px', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', fontSize: '16px' },
  zoomContainer: { display: 'none', width: '100%', height: '600px', marginTop: '20px', borderRadius: '12px', overflow: 'hidden', border: '1px solid #334155' }
};