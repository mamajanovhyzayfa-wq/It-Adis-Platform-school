import React, { useEffect, useRef } from 'react';
import { ZoomMtg } from '@zoom/meetingsdk';

// ИСПРАВЛЕНО: единая версия SDK для всего проекта
const ZOOM_SDK_VERSION = '2.18.2';

const ZoomMeeting = ({ meetingNumber, passWord, userName, signature, sdkKey }) => {
  const initializedRef = useRef(false);

  useEffect(() => {
    if (!meetingNumber || !signature || !sdkKey) {
      console.error('ZoomMeeting: отсутствуют meetingNumber, signature или sdkKey');
      return;
    }
    if (initializedRef.current) return;
    initializedRef.current = true;

    // Подключаем CDN Zoom SDK (Web)
    ZoomMtg.setZoomJSLib(`https://source.zoom.us/${ZOOM_SDK_VERSION}/lib`, '/av');
    ZoomMtg.preLoadWasm();
    ZoomMtg.prepareWebSDK();

    const zoomRoot = document.getElementById('zmmtg-root');
    if (zoomRoot) {
      zoomRoot.style.display = 'block';
    }

    ZoomMtg.init({
      leaveUrl: window.location.origin,
      patchJsMedia: true,
      success: () => {
        console.log('Zoom SDK initialized successfully.');

        ZoomMtg.join({
          meetingNumber: String(meetingNumber),
          userName: userName || 'Ученик',
          signature: signature,
          sdkKey: sdkKey,
          passWord: passWord || '',
          userEmail: '',
          success: (res) => {
            console.log('Successfully joined the meeting', res);
          },
          error: (err) => {
            console.error('Error joining meeting detailed:', err);
          },
        });
      },
      error: (err) => {
        console.error('Failed to initialize Zoom SDK:', err);
      },
    });

    // ИСПРАВЛЕНО: корректный выход из встречи при размонтировании компонента
    return () => {
      try {
        if (ZoomMtg && typeof ZoomMtg.leaveMeeting === 'function') {
          ZoomMtg.leaveMeeting({});
        }
      } catch (e) {
        console.warn('Ошибка при выходе из Zoom:', e);
      }
      if (zoomRoot) {
        zoomRoot.style.display = 'none';
        zoomRoot.innerHTML = '';
      }
      initializedRef.current = false;
    };
  }, [meetingNumber, passWord, userName, signature, sdkKey]);

  return (
    <div
      className="zoom-meeting-container"
      style={{ width: '100%', height: '100%' }}
    />
  );
};

export default ZoomMeeting;