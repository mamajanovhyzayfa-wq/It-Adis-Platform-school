import React, { useState } from 'react';
import { supabase } from '../supabaseClient';

export default function PinScanner({ onSuccess }) {
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleVerify = async (e) => {
    e.preventDefault();
    const cleanPin = pin.trim();
    if (!cleanPin) return;

    setLoading(true);
    setError('');

    try {
      const { data: lessons, error: dbError } = await supabase
        .from('lessons')
        .select('*')
        .eq('pin_code', cleanPin)
        .eq('is_active', true);

      if (dbError) {
        console.error('Ошибка Supabase:', dbError);
        setError('Ошибка базы данных');
        return;
      }

      if (!lessons || lessons.length === 0) {
        setError('Неверный или истекший PIN-код!');
        return;
      }

      onSuccess(lessons[0]);
    } catch (err) {
      console.error(err);
      setError('Ошибка подключения');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleVerify} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
      {error && (
        <div style={{ color: '#F87171', fontSize: '14px', textAlign: 'center' }}>{error}</div>
      )}
      <input
        type="text"
        inputMode="numeric"
        autoComplete="one-time-code"
        maxLength={4}
        placeholder="0000"
        value={pin}
        onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))}
        style={{
          backgroundColor: '#0F172A',
          border: '1px solid #38BDF8',
          padding: '12px',
          borderRadius: '8px',
          color: '#38BDF8',
          fontSize: '24px',
          letterSpacing: '6px',
          textAlign: 'center',
          outline: 'none',
          fontWeight: 'bold',
        }}
      />
      <button
        type="submit"
        disabled={loading}
        style={{
          backgroundColor: '#8B5CF6',
          color: '#FFF',
          border: 'none',
          padding: '12px',
          borderRadius: '8px',
          fontWeight: 'bold',
          cursor: loading ? 'not-allowed' : 'pointer',
          opacity: loading ? 0.7 : 1,
        }}
      >
        {loading ? 'Проверка...' : 'Войти по PIN'}
      </button>
    </form>
  );
}