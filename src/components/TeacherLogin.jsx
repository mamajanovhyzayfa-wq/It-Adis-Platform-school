import React, { useState } from 'react';

export default function TeacherLogin({ onLoginSuccess }) {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const TEACHER_PASSWORD_HASH = "0b28481d68378d3810ec5e3260c6d59850125d742637a281e82845341c304db9";

  const hashPassword = async (text) => {
    const msgUint8 = new TextEncoder().encode(text);
    const hashBuffer = await crypto.subtle.digest('SHA-256', msgUint8);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const inputHash = await hashPassword(password);

    if (inputHash === TEACHER_PASSWORD_HASH) {
      onLoginSuccess();
    } else {
      setError('Неверный пароль учителя!');
    }
  };

  return (
    <div style={styles.card}>
      <h2 style={{ color: '#FFF', marginBottom: '8px' }}>🔐 Вход для Учителя</h2>
      <p style={{ color: '#94A3B8', fontSize: '14px', marginBottom: '20px' }}>
        Введите пароль преподавателя
      </p>

      <form onSubmit={handleSubmit}>
        <input
          type="password"
          placeholder="Пароль учителя"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          style={styles.input}
        />
        {error && <p style={styles.error}>{error}</p>}
        <button type="submit" style={styles.btn}>
          Войти как Учитель 👨‍🏫
        </button>
      </form>
    </div>
  );
}

const styles = {
  card: { backgroundColor: '#1E293B', border: '1px solid #334155', borderRadius: '16px', padding: '30px', maxWidth: '380px', margin: '40px auto', textAlign: 'center' },
  input: { width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #475569', backgroundColor: '#0F172A', color: '#FFF', marginBottom: '15px', outline: 'none', boxSizing: 'border-box' },
  btn: { width: '100%', padding: '14px', borderRadius: '8px', backgroundColor: '#7C3AED', color: '#FFF', border: 'none', fontWeight: 'bold', cursor: 'pointer' },
  error: { color: '#F87171', fontSize: '14px', marginBottom: '15px' }
};