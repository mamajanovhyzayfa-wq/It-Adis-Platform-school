import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';

export default function TeacherPanel({ groupName = '9-А' }) {
  const [currentPin, setCurrentPin] = useState('----');
  const [timeLeft, setTimeLeft] = useState(60);

  const generateNewPin = async () => {
    const newPin = Math.floor(1000 + Math.random() * 9000).toString();
    setCurrentPin(newPin);
    setTimeLeft(60);

    
    // Обновляем PIN только у активного урока конкретной группы,
    // иначе PIN менялся у ВСЕХ активных уроков всех групп сразу.
    await supabase
      .from('lessons')
      .update({ pin_code: newPin })
      .eq('is_active', true)
      .eq('group_name', groupName);
  };

  useEffect(() => {
    generateNewPin();

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          generateNewPin();
          return 60;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  return (
    <div style={styles.card}>
      <h3 style={{ color: '#94A3B8', margin: 0 }}>🔑 Панель Учителя</h3>
      <div style={styles.pinDisplay}>{currentPin}</div>
      <p style={{ color: '#38BDF8', fontSize: '14px' }}>
        Обновление через: <b>{timeLeft} сек.</b>
      </p>
      <button onClick={generateNewPin} style={styles.btn}>
        🔄 Обновить PIN вручную
      </button>
    </div>
  );
}

const styles = {
  card: { backgroundColor: '#1E293B', border: '1px solid #334155', borderRadius: '16px', padding: '25px', textAlign: 'center', maxWidth: '350px', margin: '20px auto' },
  pinDisplay: { fontSize: '56px', fontWeight: 'bold', color: '#4ADE80', letterSpacing: '10px', margin: '15px 0' },
  btn: { backgroundColor: '#334155', color: '#FFF', border: 'none', padding: '10px 16px', borderRadius: '8px', cursor: 'pointer', marginTop: '10px' }
};