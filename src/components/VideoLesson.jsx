import React, { useState, useEffect } from 'react';
import ZoomMeeting from './ZoomMeeting';
import { supabase } from '../supabaseClient'; 
export default function VideoLesson({
  roomName = 'General',
  userName = 'Участник',
  isTeacher = false,
  meetingNumber: meetingNumberProp = ''
}) {
  const [meetingData, setMeetingData] = useState({
    signature: '',
    sdkKey: '',
    loading: true,
    error: null
  });

  const meetingNumber = String(meetingNumberProp).trim();
  const passWord = '';
  const role = isTeacher ? 1 : 0;

  useEffect(() => {
    if (!meetingNumber) {
      setMeetingData(prev => ({
        ...prev,
        loading: false,
        error: 'Не передан meetingNumber (Meeting ID) конференции'
      }));
      return;
    }

    async function fetchZoomSignature() {
      try {
        const { data, error } = await supabase.functions.invoke('generate-zoom-signature', {
          body: { meetingNumber, role }
        });

        if (error) throw error;
        if (!data || !data.signature || !data.sdkKey) {
          throw new Error('Edge-функция вернула данные без signature/sdkKey');
        }

        setMeetingData({
          signature: data.signature,
          sdkKey: data.sdkKey,
          loading: false,
          error: null
        });
      } catch (err) {
        console.error('Failed to fetch Zoom signature:', err);
        setMeetingData(prev => ({ ...prev, loading: false, error: err.message }));
      }
    }

    fetchZoomSignature();
  }, [meetingNumber, role]);

  if (meetingData.loading) {
    return <div style={styles.centerText}>Подготовка безопасного подключения Zoom SDK...</div>;
  }

  if (meetingData.error) {
    return <div style={styles.errorText}>Ошибка подключения к Zoom: {meetingData.error}</div>;
  }

  return (
    <div style={styles.wrapper}>
      <div style={styles.header}>
        <span style={styles.liveBadge}>🔴 ZOOM LIVE</span>
        <span style={styles.roomBadge}>Комната: {roomName} | Роль: {role === 1 ? 'Преподаватель' : 'Ученик'}</span>
      </div>
      <div style={styles.zoomContainer}>
        <ZoomMeeting 
          meetingNumber={meetingNumber}
          passWord={passWord}
          userName={userName}
          signature={meetingData.signature}
          sdkKey={meetingData.sdkKey}
        />
      </div>
    </div>
  );
}

const styles = {
  wrapper: {
    display: 'flex',
    flexDirection: 'column',
    width: '100%',
    height: '600px',
    backgroundColor: '#0F172A',
    borderRadius: '12px',
    overflow: 'hidden',
    border: '1px solid #334155'
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '8px 12px',
    backgroundColor: '#1E293B',
    borderBottom: '1px solid #334155'
  },
  liveBadge: {
    backgroundColor: '#3B82F6',
    color: '#FFF',
    padding: '2px 8px',
    borderRadius: '6px',
    fontSize: '11px',
    fontWeight: 'bold'
  },
  roomBadge: {
    color: '#94A3B8',
    fontSize: '12px',
    fontWeight: '500'
  },
  zoomContainer: {
    width: '100%',
    height: 'calc(100% - 40px)',
    position: 'relative'
  },
  centerText: {
    color: '#FFF',
    textAlign: 'center',
    padding: '40px',
    background: '#0F172A',
    borderRadius: '12px'
  },
  errorText: {
    color: '#EF4444',
    textAlign: 'center',
    padding: '40px',
    background: '#0F172A',
    borderRadius: '12px'
  }
};