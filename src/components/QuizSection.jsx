import React, { useState } from 'react';
import { supabase } from '../supabaseClient';
import confetti from 'canvas-confetti';

export default function QuizSection({ studentName, studentCode }) {
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);

  const quizData = {
    id: "html_links_q1", 
    question: "Какой тег в HTML используется для создания ссылки?",
    options: ["<p>", "<a>", "<div>", "<img>"],
    correctIndex: 1,
    rewardXp: 30
  };

  const handleSubmitQuiz = async () => {
    if (selectedAnswer === null) {
      setMessage({ text: "Выберите вариант ответа!", type: "error" });
      return;
    }

    if (!studentCode) {
      setMessage({ text: "Ошибка: Код ученика не найден!", type: "error" });
      return;
    }

    setLoading(true);
    setMessage(null);

    try {
     
      const { data, error } = await supabase.rpc('submit_quiz_answer', {
        p_student_code: studentCode,
        p_question_id: quizData.id,
        p_selected_index: selectedAnswer,
        p_correct_index: quizData.correctIndex,
        p_reward_xp: quizData.rewardXp
      });

      if (error) throw error;

      if (data.success) {
        confetti({ particleCount: 80, spread: 60, origin: { y: 0.7 } });
        setMessage({ text: data.message, type: "success" });
      } else {
        setMessage({ text: data.message, type: "error" });
      }
    } catch (err) {
      console.error("Ошибка при отправке теста:", err);
      setMessage({ text: "Ошибка при обработке ответа на сервере", type: "error" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.card}>
      <h3 style={styles.title}>🧠 Экспресс-викторина</h3>
      <p style={styles.question}>{quizData.question}</p>

      <div style={styles.optionsList}>
        {quizData.options.map((option, index) => (
          <button
            key={index}
            onClick={() => setSelectedAnswer(index)}
            style={{
              ...styles.optionBtn,
              backgroundColor: selectedAnswer === index ? '#8B5CF6' : '#0F172A',
              borderColor: selectedAnswer === index ? '#A78BFA' : '#334155'
            }}
          >
            {option}
          </button>
        ))}
      </div>

      {message && (
        <div style={message.type === 'success' ? styles.msgSuccess : styles.msgError}>
          {message.text}
        </div>
      )}

      <button
        onClick={handleSubmitQuiz}
        disabled={loading}
        style={{ ...styles.submitBtn, opacity: loading ? 0.6 : 1 }}
      >
        {loading ? 'Проверяем...' : 'Отправить ответ 🚀'}
      </button>
    </div>
  );
}

const styles = {
  card: { backgroundColor: '#1E293B', padding: '24px', borderRadius: '16px', border: '1px solid #334155', fontFamily: 'sans-serif' },
  title: { color: '#FFF', margin: '0 0 12px 0', fontSize: '18px' },
  question: { color: '#CBD5E1', fontSize: '15px', marginBottom: '16px' },
  optionsList: { display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '16px' },
  optionBtn: { padding: '12px', borderRadius: '8px', border: '1px solid', color: '#FFF', fontSize: '14px', textAlign: 'left', cursor: 'pointer' },
  submitBtn: { width: '100%', padding: '12px', borderRadius: '8px', backgroundColor: '#10B981', color: '#FFF', border: 'none', fontWeight: 'bold', cursor: 'pointer', fontSize: '15px' },
  msgError: { padding: '10px', backgroundColor: 'rgba(239, 68, 68, 0.15)', color: '#F87171', borderRadius: '8px', fontSize: '13px', textAlign: 'center', marginBottom: '12px', border: '1px solid #EF4444' },
  msgSuccess: { padding: '10px', backgroundColor: 'rgba(74, 222, 128, 0.15)', color: '#4ADE80', borderRadius: '8px', fontSize: '13px', textAlign: 'center', marginBottom: '12px', border: '1px solid #22C55E' }
};