import React, { useEffect } from 'react';
import { ZoomMtg } from '@zoom/meetingsdk';

ZoomMtg.setZoomJSLib(`${window.location.origin}/lib`, '/av');
ZoomMtg.preLoadWasm();
ZoomMtg.prepareWebSDK();

const ZoomMeeting = ({ meetingNumber, passWord, userName, signature, sdkKey }) => {  
  console.log("Zoom Props:", { meetingNumber, userName, signature, sdkKey });
  useEffect(() => {
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
          meetingNumber:89563681827,
          userName: userName,
          signature: signature,
        
          passWord: passWord,
          success: (res) => {
            console.log('Successfully joined the meeting', res);
          },
          error: (err) => {
            console.error('Error joining meeting detailed:', err);
            alert(`Ошибка входа: ${err.errorMessage || JSON.stringify(err)}`);
          },
        });
      },
      error: (err) => {
        console.error('Failed to initialize Zoom SDK:', err);
      },
    });

    return () => {
      if (zoomRoot) {
        zoomRoot.style.display = 'none';
      }
    };
  }, [meetingNumber, passWord, userName, signature, sdkKey]);

  return (
    <div className="zoom-meeting-container" style={{ width: '100%', height: '100%' }}>
    </div>
  );
};

export default ZoomMeeting;