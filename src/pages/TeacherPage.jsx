import React, { useState, useEffect, useRef, useCallback } from 'react';
import { supabase } from '../supabaseClient';
import JournalTable from '../components/JournalTable';
import VideoLesson from '../components/VideoLesson';
import confetti from 'canvas-confetti';

export default function TeacherPage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const [authError, setAuthError] = useState('');

  const [activeTab, setActiveTab] = useState('lesson');
  const TEACHER_PASSWORD = 'it adis 2026';

  const [activeLesson, setActiveLesson] = useState(null);
  const [groupName, setGroupName] = useState('9-А');
  const [lessonTitle, setLessonTitle] = useState('Введение в Web-разработку');
  const [videoUrl, setVideoUrl] = useState('');
  const [zoomMeetingNumber, setZoomMeetingNumber] = useState(
    import.meta.env.VITE_ZOOM_MEETING_NUMBER || ''
  );
  const [loading, setLoading] = useState(false);
  const [isAutoRotate, setIsAutoRotate] = useState(true);
  const [timeLeft, setTimeLeft] = useState(60);
  const [isOnlineCallStarted, setIsOnlineCallStarted] = useState(false);

  const [selectedStudent, setSelectedStudent] = useState(null);
  const [isSpinning, setIsSpinning] = useState(false);

  const [question, setQuestion] = useState('');
  const [options, setOptions] = useState(['', '', '', '']);
  const [correctOption, setCorrectOption] = useState(0);
  const [quizMsg, setQuizMsg] = useState('');

  const [homeworks, setHomeworks] = useState([]);
  const [loadingHw, setLoadingHw] = useState(true);

  const [groups, setGroups] = useState([]);
  const [newGroupName, setNewGroupName] = useState('');
  const [selectedGroupFilter, setSelectedGroupFilter] = useState('ALL');
  const [students, setStudents] = useState([]);
  const [loadingStudents, setLoadingStudents] = useState(false);

  const groupNameRef = useRef(groupName);
  groupNameRef.current = groupName;

  const lessonTitleRef = useRef(lessonTitle);
  lessonTitleRef.current = lessonTitle;

  const videoUrlRef = useRef(videoUrl);
  videoUrlRef.current = videoUrl;

  useEffect(() => {
    if (isAuthenticated) {
      fetchHomeworks();
      fetchGroups();
      fetchStudents();
    }
  }, [isAuthenticated]);

  const handleLogin = (e) => {
    e.preventDefault();
    if (password === TEACHER_PASSWORD) {
      setIsAuthenticated(true);
      setAuthError('');
    } else {
      setAuthError('Неверный пароль учителя!');
    }
  };

  const fetchGroups = async () => {
    const { data, error } = await supabase
      .from('groups')
      .select('*')
      .order('created_at', { ascending: true });

    if (!error && data) {
      setGroups(data);
      if (data.length > 0) setGroupName(data[0].name);
    }
  };

  const handleCreateGroup = async (e) => {
    e.preventDefault();
    const trimmed = newGroupName.trim();
    if (!trimmed) return;

    const { data, error } = await supabase
      .from('groups')
      .insert([{ name: trimmed }])
      .select();

    if (error) {
      alert('Ошибка при создании группы: ' + error.message);
    } else if (data) {
      setGroups((prev) => [...prev, ...data]);
      setGroupName(trimmed);
      setNewGroupName('');
      alert(`Группа "${trimmed}" успешно создана!`);
    }
  };

  const fetchStudents = async () => {
    setLoadingStudents(true);
    const { data, error } = await supabase.from('students').select('*');
    if (!error && data) {
      setStudents(data);
    }
    setLoadingStudents(false);
  };

  const handleGroupChange = async (studentId, newGroup) => {
    setStudents((prev) =>
      prev.map((st) => (st.id === studentId ? { ...st, group_name: newGroup } : st))
    );

    const { error } = await supabase
      .from('students')
      .update({ group_name: newGroup })
      .eq('id', studentId);

    if (error) {
      alert('Ошибка при изменении группы: ' + error.message);
      fetchStudents();
    }
  };

  const validStudents = students.filter(
    (s) => s.name || s.student_code || s.id
  );

  const filteredStudents = selectedGroupFilter === 'ALL'
    ? validStudents
    : validStudents.filter(
        (s) => s.group_name?.trim().toLowerCase() === selectedGroupFilter.trim().toLowerCase()
      );

  const generateNewPin = useCallback(async () => {
    setLoading(true);
    const newPin = Math.floor(1000 + Math.random() * 9000).toString();
    const currentGroup = groupNameRef.current;
    const currentTitle = lessonTitleRef.current;
    const currentVideo = videoUrlRef.current;

    try {
      // Деактивируем только уроки ТЕКУЩЕЙ группы (ИСПРАВЛЕНО: раньше гасились все уроки всех групп)
      await supabase
        .from('lessons')
        .update({ is_active: false })
        .eq('group_name', currentGroup);

      const { data, error } = await supabase
        .from('lessons')
        .insert([
          {
            title: currentTitle,
            pin_code: newPin,
            group_name: currentGroup,
            video_url: currentVideo.trim(),
            is_active: true,
          },
        ])
        .select();

      if (!error && data && data.length > 0) {
        setActiveLesson(data[0]);
        setTimeLeft(60);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  const handleStartOnlineCall = async () => {
    if (!zoomMeetingNumber.trim()) {
      alert('Укажите Zoom Meeting ID (номер конференции) для онлайн-урока!');
      return;
    }
    if (!activeLesson) {
      await generateNewPin();
    }
    setIsOnlineCallStarted(true);
  };

  const handleStopOnlineCall = async () => {
    setIsOnlineCallStarted(false);
    if (activeLesson) {
      await supabase
        .from('lessons')
        .update({ is_active: false })
        .eq('id', activeLesson.id);
      setActiveLesson(null);
    }
  };

  useEffect(() => {
    let timer;
    if (activeLesson && isAutoRotate && isAuthenticated) {
      timer = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            generateNewPin();
            return 60;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [activeLesson, isAutoRotate, isAuthenticated, generateNewPin]);

  const pickRandomStudent = async () => {
    setIsSpinning(true);
    setSelectedStudent('Выбираем...');

    let audioCtx = null;
    try {
      audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    } catch (e) {
      console.warn('AudioContext not supported', e);
    }

    const playBeep = (freq, duration) => {
      if (!audioCtx) return;
      try {
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.frequency.value = freq;
        osc.type = 'sine';
        osc.start();
        gain.gain.exponentialRampToValueAtTime(0.00001, audioCtx.currentTime + duration);
        osc.stop(audioCtx.currentTime + duration);
      } catch (err) {
        console.error(err);
      }
    };

    const { data: attendance } = await supabase
      .from('attendance')
      .select('student_name')
      .order('created_at', { ascending: false });

    if (!attendance || attendance.length === 0) {
      setSelectedStudent('Журнал пуст!');
      setIsSpinning(false);
      if (audioCtx) audioCtx.close();
      return;
    }

    let counter = 0;
    const interval = setInterval(() => {
      const randomTemp = attendance[Math.floor(Math.random() * attendance.length)];
      setSelectedStudent(randomTemp.student_name);
      playBeep(400 + counter * 20, 0.05);
      counter++;

      if (counter > 15) {
        clearInterval(interval);
        const finalWinner = attendance[Math.floor(Math.random() * attendance.length)];
        setSelectedStudent(finalWinner.student_name);
        setIsSpinning(false);
        playBeep(800, 0.3);

        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 },
        });

        if (audioCtx) {
          setTimeout(() => audioCtx.close(), 500);
        }
      }
    }, 100);
  };

  const handleCreateQuiz = async (e) => {
    e.preventDefault();
    if (!question || options.some((opt) => !opt.trim())) {
      setQuizMsg('Заполните вопрос и все 4 варианта ответа!');
      return;
    }

    await supabase
      .from('quizzes')
      .update({ is_active: false })
      .eq('is_active', true);

    const { error } = await supabase.from('quizzes').insert([
      {
        question: question.trim(),
        options: options.map((o) => o.trim()),
        correct_option: Number(correctOption),
        is_active: true,
      },
    ]);

    if (error) {
      setQuizMsg('Ошибка создания вопроса.');
    } else {
      setQuizMsg('🎉 Вопрос на закрепление отправлен ученикам!');
      setQuestion('');
      setOptions(['', '', '', '']);
    }
  };

  const fetchHomeworks = async () => {
    setLoadingHw(true);
    const { data, error } = await supabase
      .from('homeworks')
      .select('*')
      .order('created_at', { ascending: false });

    if (!error) setHomeworks(data || []);
    setLoadingHw(false);
  };

  // ИСПРАВЛЕНО: раньше писали в колонку teacher_comment,
  // а ученик читал teacher_feedback — фидбек никогда не доходил.
  const handleUpdateHwStatus = async (id, status, comment = '') => {
    await supabase
      .from('homeworks')
      .update({ status, teacher_feedback: comment })
      .eq('id', id);

    fetchHomeworks();
  };

  if (!isAuthenticated) {
    return (
      <div style={styles.loginCard}>
        <h2 style={{ color: '#FACC15', textAlign: 'center', marginTop: 0, fontSize: '22px' }}>
          🔒 Личный кабинет учителя
        </h2>
        <p style={{ color: '#94A3B8', fontSize: '14px', textAlign: 'center', marginBottom: '20px' }}>
          Введите пароль доступа для входа в кабинет
        </p>
        <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <input
            type="password"
            placeholder="Введите пароль учителя"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            style={styles.input}
          />
          <button type="submit" style={styles.loginBtn}>
            Войти 🔑
          </button>
        </form>
        {authError && <p style={styles.error}>{authError}</p>}
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '950px', margin: '0 auto', fontFamily: 'sans-serif' }}>
      <div style={styles.cabinetHeader}>
        <div>
          <h2 style={{ margin: 0, color: '#FFF', fontSize: '22px' }}>👨‍🏫 Личный кабинет преподавателя</h2>
          <p style={{ margin: '4px 0 0 0', color: '#94A3B8', fontSize: '13px' }}>
            Панель управления уроками, группами и успеваемостью
          </p>
        </div>
        <button onClick={() => setIsAuthenticated(false)} style={styles.logoutBtn}>
          🚪 Выйти
        </button>
      </div>

      <div style={styles.tabsContainer}>
        <button
          onClick={() => setActiveTab('lesson')}
          style={{ ...styles.tabBtn, ...(activeTab === 'lesson' ? styles.activeTab : {}) }}
        >
          📹 Урок & Чат
        </button>
        <button
          onClick={() => setActiveTab('groups')}
          style={{ ...styles.tabBtn, ...(activeTab === 'groups' ? styles.activeTab : {}) }}
        >
          ➕ Группы
        </button>
        <button
          onClick={() => setActiveTab('students')}
          style={{ ...styles.tabBtn, ...(activeTab === 'students' ? styles.activeTab : {}) }}
        >
          👥 Ученики ({validStudents.length})
        </button>
        <button
          onClick={() => setActiveTab('homework')}
          style={{ ...styles.tabBtn, ...(activeTab === 'homework' ? styles.activeTab : {}) }}
        >
          📂 Проверка Д/З ({homeworks.length})
        </button>
        <button
          onClick={() => setActiveTab('journal')}
          style={{ ...styles.tabBtn, ...(activeTab === 'journal' ? styles.activeTab : {}) }}
        >
          📊 Журнал
        </button>
      </div>

      {activeTab === 'lesson' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div style={styles.card}>
            <h3 style={{ margin: '0 0 16px 0', color: '#8B5CF6', fontSize: '18px' }}>
              🎯 Настройки и запуск урока
            </h3>

            <div style={styles.grid}>
              <div style={styles.inputBox}>
                <label style={styles.label}>Группа:</label>
                <select value={groupName} onChange={(e) => setGroupName(e.target.value)} style={styles.select}>
                  {groups.length === 0 && <option value="9-А">Группа 9-А</option>}
                  {groups.map((g) => (
                    <option key={g.id || g.name} value={g.name}>{g.name}</option>
                  ))}
                </select>
              </div>

              <div style={styles.inputBox}>
                <label style={styles.label}>Тема урока:</label>
                <input type="text" value={lessonTitle} onChange={(e) => setLessonTitle(e.target.value)} style={styles.input} />
              </div>
            </div>

            <div style={{ ...styles.inputBox, marginBottom: '16px' }}>
              <label style={styles.label}>🎥 Ссылка на видеоурок (YouTube/MP4):</label>
              <input
                type="text"
                placeholder="https://www.youtube.com/watch?v=..."
                value={videoUrl}
                onChange={(e) => setVideoUrl(e.target.value)}
                style={styles.input}
              />
            </div>

            <div style={{ ...styles.inputBox, marginBottom: '16px' }}>
              <label style={styles.label}>🧩 Zoom Meeting ID (для онлайн-урока):</label>
              <input
                type="text"
                placeholder="89563681827"
                value={zoomMeetingNumber}
                onChange={(e) => setZoomMeetingNumber(e.target.value)}
                style={styles.input}
              />
            </div>

            <div style={{ marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <input
                type="checkbox"
                id="autoRotate"
                checked={isAutoRotate}
                onChange={(e) => setIsAutoRotate(e.target.checked)}
                style={{ accentColor: '#8B5CF6', cursor: 'pointer' }}
              />
              <label htmlFor="autoRotate" style={{ color: '#E2E8F0', fontSize: '14px', cursor: 'pointer' }}>
                🔄 Автоматически менять PIN каждые 60 секунд
              </label>
            </div>

            <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
              <button onClick={generateNewPin} disabled={loading} style={{ ...styles.pinBtn, flex: 1 }}>
                {loading ? 'Публикуем...' : '⚡ Сгенерировать PIN'}
              </button>

              {!isOnlineCallStarted ? (
                <button onClick={handleStartOnlineCall} style={{ ...styles.callBtn, flex: 1 }}>
                  📹 Начать онлайн-урок
                </button>
              ) : (
                <button onClick={handleStopOnlineCall} style={{ ...styles.stopCallBtn, flex: 1 }}>
                  🛑 Завершить онлайн-урок
                </button>
              )}
            </div>

            {activeLesson && (
              <div style={styles.pinBox}>
                <span style={{ fontSize: '14px', color: '#94A3B8' }}>
                  Активный PIN для группы <b style={{ color: '#38BDF8' }}>{activeLesson.group_name}</b>:
                </span>
                <div style={styles.bigPin}>{activeLesson.pin_code}</div>
                {isAutoRotate ? (
                  <div style={styles.timerBadge}>
                    ⏱️ Смена кода через: <b style={{ color: '#FACC15', fontSize: '18px' }}>{timeLeft}</b> сек
                  </div>
                ) : (
                  <span style={{ fontSize: '13px', color: '#4ADE80' }}>🟢 Урок активен</span>
                )}
              </div>
            )}

            {isOnlineCallStarted && zoomMeetingNumber.trim() && (
              <div style={{ marginTop: '20px' }}>
                <VideoLesson
                  roomName={`lesson_${groupName}`}
                  userName="Учитель IT ADIS"
                  isTeacher={true}
                  meetingNumber={zoomMeetingNumber.trim()}
                />
              </div>
            )}
          </div>

          <div style={{ ...styles.card, borderWidth: '1px', borderStyle: 'solid', borderColor: '#8B5CF6' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
              <div>
                <h3 style={{ margin: 0, color: '#FFF', fontSize: '18px' }}>🎯 Кто отвечает у доски?</h3>
                <p style={{ margin: '4px 0 0 0', color: '#94A3B8', fontSize: '13px' }}>Случайный выбор из пришедших на урок</p>
              </div>

              <button onClick={pickRandomStudent} disabled={isSpinning} style={styles.randomBtn}>
                🎲 Выбрать случайного
              </button>
            </div>

            {selectedStudent && (
              <div style={styles.winnerDisplay}>
                {isSpinning ? '🎰 ' : '🎉 Отвечает: '}
                <b style={{ color: '#FACC15', fontSize: '24px' }}>{selectedStudent}</b>
              </div>
            )}
          </div>

          <div style={{ ...styles.card, borderWidth: '1px', borderStyle: 'solid', borderColor: '#A855F7' }}>
            <h3 style={{ color: '#A855F7', margin: '0 0 16px 0', fontSize: '18px' }}>🧠 Вопрос на закрепление</h3>
            <form onSubmit={handleCreateQuiz} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <input
                type="text"
                placeholder="Текст вопроса"
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                style={styles.input}
              />

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                {options.map((opt, idx) => (
                  <input
                    key={idx}
                    type="text"
                    placeholder={`Вариант ${String.fromCharCode(65 + idx)}`}
                    value={opt}
                    onChange={(e) => {
                      const newOpts = [...options];
                      newOpts[idx] = e.target.value;
                      setOptions(newOpts);
                    }}
                    style={styles.input}
                  />
                ))}
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <label style={{ color: '#94A3B8', fontSize: '13px' }}>Правильный вариант:</label>
                <select
                  value={correctOption}
                  onChange={(e) => setCorrectOption(e.target.value)}
                  style={styles.select}
                >
                  {options.map((_, idx) => (
                    <option key={idx} value={idx}>
                      Вариант {String.fromCharCode(65 + idx)}
                    </option>
                  ))}
                </select>
              </div>

              <button type="submit" style={styles.purpleBtn}>
                Опубликовать вопрос 🚀
              </button>
            </form>
            {quizMsg && <p style={{ color: '#4ADE80', fontSize: '13px', marginTop: '8px' }}>{quizMsg}</p>}
          </div>
        </div>
      )}

      {activeTab === 'groups' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div style={{ ...styles.card, borderWidth: '1px', borderStyle: 'solid', borderColor: '#22C55E' }}>
            <h3 style={{ color: '#22C55E', margin: '0 0 12px 0', fontSize: '18px' }}>➕ Создать новую группу</h3>
            <form onSubmit={handleCreateGroup} style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
              <input
                type="text"
                placeholder="Название группы (напр: Python-2026)"
                value={newGroupName}
                onChange={(e) => setNewGroupName(e.target.value)}
                style={{ ...styles.input, flex: 1, minWidth: '200px' }}
              />
              <button type="submit" style={styles.btnGreen}>
                Создать
              </button>
            </form>
          </div>

          <div style={styles.card}>
            <h3 style={{ margin: '0 0 12px 0', color: '#FFF' }}>📋 Список существующих групп:</h3>
            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
              {groups.length === 0 ? (
                <p style={{ color: '#94A3B8', fontSize: '13px' }}>Групп пока нет. Создайте первую!</p>
              ) : (
                groups.map((g) => (
                  <div key={g.id || g.name} style={styles.groupBadge}>
                    📁 {g.name}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'students' && (
        <div style={styles.card}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px', marginBottom: '15px' }}>
            <h3 style={{ margin: 0, color: '#FFF', fontSize: '18px' }}>👥 Зарегистрированные ученики</h3>

            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <label style={{ color: '#94A3B8', fontSize: '13px' }}>Фильтр группы:</label>
              <select
                value={selectedGroupFilter}
                onChange={(e) => setSelectedGroupFilter(e.target.value)}
                style={styles.select}
              >
                <option value="ALL">Все группы</option>
                {groups.map((g) => (
                  <option key={g.id || g.name} value={g.name}>{g.name}</option>
                ))}
              </select>
            </div>
          </div>

          {loadingStudents ? (
            <p style={{ color: '#94A3B8', fontSize: '14px' }}>Загрузка учеников...</p>
          ) : filteredStudents.length === 0 ? (
            <p style={{ color: '#94A3B8', fontSize: '14px' }}>Учеников не найдено.</p>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={styles.table}>
                <thead>
                  <tr>
                    <th style={styles.th}>Код / Студент</th>
                    <th style={styles.th}>Имя</th>
                    <th style={styles.th}>Группа</th>
                    <th style={styles.th}>XP</th>
                    <th style={styles.th}>Уровень</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredStudents.map((st, index) => (
                    <tr key={st.id || index} style={styles.tr}>
                      <td style={styles.tdLog}>{st.student_code || st.id?.slice(0, 6) || '—'}</td>
                      <td style={styles.td}>{st.avatar || '🌱'} {st.name || 'Без имени'}</td>
                      <td style={styles.td}>
                        <select
                          value={st.group_name || ''}
                          onChange={(e) => handleGroupChange(st.id, e.target.value)}
                          style={styles.selectInline}
                        >
                          <option value="" disabled>Не указана</option>
                          {groups.map((g) => (
                            <option key={g.id || g.name} value={g.name}>
                              {g.name}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td style={styles.tdXp}>⚡ {st.xp || 0}</td>
                      <td style={styles.td}>⭐ {st.level || 1}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {activeTab === 'homework' && (
        <div style={{ ...styles.card, borderWidth: '1px', borderStyle: 'solid', borderColor: '#38BDF8' }}>
          <h3 style={{ color: '#38BDF8', margin: '0 0 16px 0', fontSize: '18px' }}>📂 Проверка Домашних Работ</h3>

          {loadingHw ? (
            <p style={{ color: '#94A3B8', fontSize: '14px' }}>Загрузка работ...</p>
          ) : homeworks.length === 0 ? (
            <p style={{ color: '#94A3B8', fontSize: '14px' }}>Сданных работ пока нет.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {homeworks.map((hw) => (
                <div key={hw.id} style={styles.hwCard}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 'bold', color: '#FFF', fontSize: '15px' }}>{hw.student_name}</div>
                    <div style={{ color: '#94A3B8', fontSize: '13px', margin: '2px 0' }}>{hw.title}</div>
                    {hw.comment && (
                      <div style={{ color: '#FACC15', fontSize: '12px', margin: '2px 0' }}>💬 {hw.comment}</div>
                    )}
                    <a href={hw.project_url} target="_blank" rel="noreferrer" style={styles.link}>
                      Открыть проект 🔗
                    </a>
                  </div>

                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
                    <span style={{
                      ...styles.statusLabel,
                      backgroundColor: hw.status === 'Принято' ? '#166534' : hw.status === 'На доработку' ? '#991B1B' : '#854D0E',
                    }}>
                      {hw.status}
                    </span>
                    <button
                      onClick={() => handleUpdateHwStatus(hw.id, 'Принято', 'Молодец! Задание принято.')}
                      style={{ ...styles.statusBtn, backgroundColor: '#22C55E' }}
                    >
                      Принять ✅
                    </button>
                    <button
                      onClick={() => handleUpdateHwStatus(hw.id, 'На доработку', 'Исправь ошибки и отправь снова.')}
                      style={{ ...styles.statusBtn, backgroundColor: '#EF4444' }}
                    >
                      Доработать ❌
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === 'journal' && (
        <div style={styles.card}>
          <JournalTable />
        </div>
      )}
    </div>
  );
}

const styles = {
  loginCard: {
    backgroundColor: '#1E293B',
    padding: '32px',
    borderRadius: '16px',
    borderWidth: '1px',
    borderStyle: 'solid',
    borderColor: '#334155',
    maxWidth: '400px',
    margin: '60px auto',
    boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.3)',
  },
  cabinetHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#1E293B',
    padding: '20px 24px',
    borderRadius: '16px',
    borderWidth: '1px',
    borderStyle: 'solid',
    borderColor: '#334155',
    marginBottom: '16px',
    flexWrap: 'wrap',
    gap: '10px',
  },
  tabsContainer: {
    display: 'flex',
    gap: '8px',
    marginBottom: '20px',
    overflowX: 'auto',
    paddingBottom: '4px',
  },
  tabBtn: {
    backgroundColor: '#1E293B',
    color: '#94A3B8',
    borderWidth: '1px',
    borderStyle: 'solid',
    borderColor: '#334155',
    padding: '10px 16px',
    borderRadius: '10px',
    fontWeight: 'bold',
    fontSize: '14px',
    cursor: 'pointer',
    whiteSpace: 'nowrap',
    transition: '0.2s',
  },
  activeTab: {
    backgroundColor: '#8B5CF6',
    color: '#FFF',
    borderColor: '#8B5CF6',
  },
  loginBtn: {
    backgroundColor: '#FACC15',
    color: '#0F172A',
    borderWidth: '0px',
    padding: '12px',
    borderRadius: '8px',
    fontWeight: 'bold',
    cursor: 'pointer',
    fontSize: '15px',
  },
  logoutBtn: {
    backgroundColor: '#334155',
    color: '#94A3B8',
    borderWidth: '0px',
    padding: '8px 14px',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '13px',
    fontWeight: '600',
  },
  error: { color: '#EF4444', fontSize: '13px', textAlign: 'center', marginTop: '10px' },
  card: {
    backgroundColor: '#1E293B',
    padding: '24px',
    borderRadius: '16px',
    borderWidth: '1px',
    borderStyle: 'solid',
    borderColor: '#334155',
    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
  },
  grid: { display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '16px', marginBottom: '16px' },
  inputBox: { display: 'flex', flexDirection: 'column', gap: '6px' },
  label: { fontSize: '13px', color: '#94A3B8', fontWeight: '500' },
  select: {
    backgroundColor: '#0F172A',
    borderWidth: '1px',
    borderStyle: 'solid',
    borderColor: '#334155',
    padding: '10px 14px',
    borderRadius: '8px',
    color: '#FFF',
    fontSize: '14px',
    outline: 'none',
    cursor: 'pointer',
  },
  selectInline: {
    backgroundColor: '#0F172A',
    borderWidth: '1px',
    borderStyle: 'solid',
    borderColor: '#38BDF8',
    padding: '4px 8px',
    borderRadius: '6px',
    color: '#38BDF8',
    fontSize: '13px',
    outline: 'none',
    cursor: 'pointer',
    fontWeight: 'bold',
  },
  input: {
    backgroundColor: '#0F172A',
    borderWidth: '1px',
    borderStyle: 'solid',
    borderColor: '#334155',
    padding: '10px 14px',
    borderRadius: '8px',
    color: '#FFF',
    fontSize: '14px',
    width: '100%',
    boxSizing: 'border-box',
    outline: 'none',
  },
  btnGreen: {
    backgroundColor: '#22C55E',
    color: '#FFF',
    borderWidth: '0px',
    padding: '10px 18px',
    borderRadius: '8px',
    fontWeight: 'bold',
    cursor: 'pointer',
    fontSize: '14px',
  },
  pinBtn: { backgroundColor: '#8B5CF6', color: '#FFF', borderWidth: '0px', padding: '12px 20px', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', fontSize: '15px' },
  callBtn: { backgroundColor: '#22C55E', color: '#FFF', borderWidth: '0px', padding: '12px 20px', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', fontSize: '15px' },
  stopCallBtn: { backgroundColor: '#EF4444', color: '#FFF', borderWidth: '0px', padding: '12px 20px', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', fontSize: '15px' },
  purpleBtn: { backgroundColor: '#A855F7', color: '#FFF', borderWidth: '0px', padding: '12px 20px', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', fontSize: '14px', marginTop: '6px' },
  pinBox: { marginTop: '20px', padding: '16px', backgroundColor: '#0F172A', borderRadius: '12px', textAlign: 'center', borderWidth: '1px', borderStyle: 'solid', borderColor: '#38BDF8' },
  bigPin: { fontSize: '42px', fontWeight: 'bold', color: '#38BDF8', letterSpacing: '8px', margin: '8px 0' },
  timerBadge: { marginTop: '8px', backgroundColor: '#1E293B', padding: '6px 14px', borderRadius: '20px', display: 'inline-block', fontSize: '14px', color: '#94A3B8', borderWidth: '1px', borderStyle: 'solid', borderColor: '#334155' },
  groupBadge: { backgroundColor: '#0F172A', padding: '10px 16px', borderRadius: '8px', color: '#38BDF8', borderWidth: '1px', borderStyle: 'solid', borderColor: '#334155', fontWeight: 'bold' },
  table: { width: '100%', borderCollapse: 'collapse', textAlign: 'left' },
  th: { padding: '10px', borderWidth: '0px 0px 2px 0px', borderStyle: 'solid', borderColor: '#334155', color: '#94A3B8', fontSize: '13px' },
  tr: { borderWidth: '0px 0px 1px 0px', borderStyle: 'solid', borderColor: '#334155' },
  td: { padding: '10px', fontSize: '14px', color: '#FFF' },
  tdLog: { padding: '10px', fontSize: '14px', fontWeight: 'bold', color: '#38BDF8' },
  tdXp: { padding: '10px', fontSize: '14px', fontWeight: 'bold', color: '#FACC15' },
  randomBtn: { backgroundColor: '#F59E0B', color: '#0F172A', borderWidth: '0px', padding: '10px 18px', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' },
  winnerDisplay: { marginTop: '16px', padding: '16px', backgroundColor: '#0F172A', borderRadius: '8px', textAlign: 'center', fontSize: '20px', borderWidth: '1px', borderStyle: 'solid', borderColor: '#F59E0B' },
  hwCard: { backgroundColor: '#0F172A', padding: '12px 16px', borderRadius: '10px', borderWidth: '1px', borderStyle: 'solid', borderColor: '#334155', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px', flexWrap: 'wrap' },
  link: { color: '#38BDF8', fontSize: '13px', textDecoration: 'none' },
  statusLabel: { color: '#FFF', padding: '4px 10px', borderRadius: '6px', fontSize: '12px', fontWeight: 'bold' },
  statusBtn: { color: '#FFF', borderWidth: '0px', padding: '8px 14px', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', fontSize: '12px' },
};