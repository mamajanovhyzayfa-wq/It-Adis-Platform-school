import React, { useState, useRef } from 'react';
import Editor from '@monaco-editor/react';
import confetti from 'canvas-confetti';
import { supabase } from '../supabaseClient';

export default function CodeEditor({
  initialCode = '',
  expectedOutput = '',
  taskId = null,
  xpReward = 50,
  studentName = 'Ученик',
}) {
  const [code, setCode] = useState(initialCode);
  const [output, setOutput] = useState('');
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(false);
  const awardedRef = useRef(false);

  const playSuccessSound = () => {
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      const notes = [523.25, 659.25, 783.99, 1046.5];
      notes.forEach((freq, index) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.frequency.value = freq;
        osc.start(ctx.currentTime + index * 0.08);
        gain.gain.exponentialRampToValueAtTime(
          0.0001,
          ctx.currentTime + index * 0.08 + 0.3
        );
        osc.stop(ctx.currentTime + index * 0.08 + 0.3);
      });
    } catch (e) {
      /* ignore */
    }
  };

  const playErrorSound = () => {
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sawtooth';
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.frequency.setValueAtTime(180, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(110, ctx.currentTime + 0.2);
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.25);
      osc.start();
      osc.stop(ctx.currentTime + 0.25);
    } catch (e) {
      /* ignore */
    }
  };

  const runAndCheckCode = async () => {
    setOutput('');
    setStatus(null);

    const currentLogs = [];

    try {
      const customConsole = {
        log: (...args) => {
          const msg = args
            .map((a) => {
              if (typeof a === 'object' && a !== null) {
                try {
                  return JSON.stringify(a);
                } catch {
                  return String(a);
                }
              }
              return String(a);
            })
            .join(' ');
          currentLogs.push(msg);
        },
        error: (...args) => currentLogs.push('❌ Error: ' + args.join(' ')),
        warn: (...args) => currentLogs.push('⚠️ Warn: ' + args.join(' ')),
      };

      // eslint-disable-next-line no-new-func
      const runFn = new Function('console', code);
      runFn(customConsole);

      const resultText = currentLogs.join('\n').trim();
      setOutput(resultText || 'Код выполнен (без вывода в консоль).');

      if (expectedOutput) {
        if (resultText === expectedOutput.trim()) {
          setStatus('success');
          playSuccessSound();
          confetti({ particleCount: 120, spread: 80, origin: { y: 0.6 } });

          if (taskId !== null && taskId !== undefined && !awardedRef.current) {
            awardedRef.current = true;
            setLoading(true);
            try {
              await supabase.from('student_xp').insert([
                {
                  student_name: studentName,
                  xp_gained: xpReward,
                  reason: `Выполнено задание #${taskId}`,
                },
              ]);
            } catch (err) {
              console.error('Не удалось начислить XP:', err);
              awardedRef.current = false;
            } finally {
              setLoading(false);
            }
          }
        } else {
          setStatus('error');
          playErrorSound();
        }
      }
    } catch (err) {
      setOutput(`❌ Ошибка программы:\n${err.message}`);
      setStatus('error');
      playErrorSound();
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ color: '#FFF', fontWeight: 'bold', fontSize: '14px' }}>
            💻 Интерактивный IDE
          </span>
          {expectedOutput && <span style={styles.xpBadge}>+{xpReward} XP</span>}
        </div>

        <button onClick={runAndCheckCode} disabled={loading} style={styles.runBtn}>
          {loading ? 'Проверка...' : '▶ Проверить решение'}
        </button>
      </div>

      <div style={styles.editorGrid}>
        <div style={styles.editorBox}>
          <Editor
            height="320px"
            theme="vs-dark"
            defaultLanguage="javascript"
            value={code}
            onChange={(val) => setCode(val || '')}
            options={{
              fontSize: 14,
              minimap: { enabled: false },
              scrollBeyondLastLine: false,
              automaticLayout: true,
            }}
          />
        </div>

        <div style={styles.consoleBox}>
          <div style={styles.consoleTitle}>🖥️ Результат выполнения:</div>
          <pre style={styles.consoleOutput}>
            {output || 'Нажмите "Проверить решение", чтобы запустить тест...'}
          </pre>

          {status === 'success' && (
            <div style={styles.successAlert}>
              🎉 <b>Отлично!</b> Задание решено правильно. Вам начислено{' '}
              <b>+{xpReward} XP</b>!
            </div>
          )}

          {status === 'error' && expectedOutput && (
            <div style={styles.errorAlert}>
              ❌ <b>Не совсем то!</b>
              <br />
              Ожидалось: <code style={styles.codeBlock}>{expectedOutput}</code>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

const styles = {
  container: {
    backgroundColor: '#1E293B',
    borderRadius: '12px',
    border: '1px solid #334155',
    overflow: 'hidden',
    marginTop: '16px',
  },
  header: {
    backgroundColor: '#0F172A',
    padding: '12px 16px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottom: '1px solid #334155',
  },
  xpBadge: {
    backgroundColor: '#FEF08A',
    color: '#854D0E',
    padding: '2px 8px',
    borderRadius: '12px',
    fontSize: '12px',
    fontWeight: 'bold',
  },
  runBtn: {
    backgroundColor: '#22C55E',
    color: '#FFF',
    border: 'none',
    padding: '8px 18px',
    borderRadius: '6px',
    fontWeight: 'bold',
    cursor: 'pointer',
    fontSize: '13px',
  },
  editorGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '1px',
    backgroundColor: '#334155',
  },
  editorBox: { backgroundColor: '#1E1E1E' },
  consoleBox: {
    backgroundColor: '#0F172A',
    padding: '12px',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-between',
  },
  consoleTitle: {
    color: '#94A3B8',
    fontSize: '12px',
    fontWeight: 'bold',
    marginBottom: '8px',
  },
  consoleOutput: {
    color: '#38BDF8',
    fontFamily: 'monospace',
    fontSize: '13px',
    margin: 0,
    whiteSpace: 'pre-wrap',
    wordBreak: 'break-word',
    flexGrow: 1,
  },
  successAlert: {
    marginTop: '12px',
    padding: '10px 12px',
    backgroundColor: '#14532D',
    color: '#4ADE80',
    borderRadius: '6px',
    fontSize: '13px',
    border: '1px solid #22C55E',
  },
  errorAlert: {
    marginTop: '12px',
    padding: '10px 12px',
    backgroundColor: '#450A0A',
    color: '#FCA5A5',
    borderRadius: '6px',
    fontSize: '13px',
    border: '1px solid #EF4444',
  },
  codeBlock: {
    backgroundColor: '#0F172A',
    padding: '2px 6px',
    borderRadius: '4px',
    color: '#FACC15',
  },
};