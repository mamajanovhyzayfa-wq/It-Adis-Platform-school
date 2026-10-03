import React, { useState } from 'react';
import { supabase } from '../supabaseClient';

export default function XpShop({ student, onUpdateStudent }) {
  const currentXP = student?.xp || 0;
  const studentName = student?.name || 'Ученик';

  const studentLevel = Math.max(1, Math.floor(currentXP / 100) + 1);
  const [selectedAvatar, setSelectedAvatar] = useState(student?.avatar || '🌱');

  const avatarData = [
    { lvl: 1, e: '🌱', n: 'Зеленый Росток' },
    { lvl: 2, e: '🐣', n: 'Цыпленок' },
    { lvl: 3, e: '🥚', n: 'Цифровое Яйцо' },
    { lvl: 4, e: '🔍', n: 'Дебаггер-Новичок' },
    { lvl: 5, e: '📜', n: 'Писатель Скриптов' },
    { lvl: 6, e: '✏️', n: 'Текстовый Редактор' },
    { lvl: 7, e: '🐞', n: 'Ловец Багов' },
    { lvl: 8, e: '💡', n: 'Маленькая Лампочка' },
    { lvl: 9, e: '📖', n: 'Студент-Кодер' },
    { lvl: 10, e: '🧢', n: 'Бейсболка Программиста' },
    { lvl: 11, e: '👨‍💻', n: 'Джуниор Кодер' },
    { lvl: 12, e: '⌨️', n: 'Механическая Клавиатура' },
    { lvl: 13, e: '☕', n: 'Любитель Кофе' },
    { lvl: 14, e: '🎧', n: 'Кодер в Наушниках' },
    { lvl: 15, e: '💻', n: 'Мобильный Ноутбук' },
    { lvl: 16, e: '🧮', n: 'Алгоритмист' },
    { lvl: 17, e: '🔧', n: 'Мастер Конфигов' },
    { lvl: 18, e: '📦', n: 'Пакетный Менеджер' },
    { lvl: 19, e: '🚀', n: 'Запуск Кода' },
    { lvl: 20, e: '🏆', n: 'Сертифицированный Джун' },
    { lvl: 21, e: '👨‍🔬', n: 'Мидл-Разработчик' },
    { lvl: 22, e: '⚙️', n: 'Мастер Бэкенда' },
    { lvl: 23, e: '🎨', n: 'Верстальщик Фронтенда' },
    { lvl: 24, e: '🗄️', n: 'Хранитель Баз Данных' },
    { lvl: 25, e: '🛠️', n: 'Инженер Ошибок' },
    { lvl: 26, e: '🛡️', n: 'Защитник Кода' },
    { lvl: 27, e: '📡', n: 'API-Навигатор' },
    { lvl: 28, e: '⚡', n: 'Оптимизатор Скорости' },
    { lvl: 29, e: '🖥️', n: 'Двухмониторный Кодер' },
    { lvl: 30, e: '🎖️', n: 'Опытный Мидл' },
    { lvl: 31, e: '🕶️', n: 'Белый Хакер' },
    { lvl: 32, e: '🕵️', n: 'Кибер-Шпион' },
    { lvl: 33, e: '🔑', n: 'Мастер Ключей' },
    { lvl: 34, e: '📊', n: 'Архитектор Систем' },
    { lvl: 35, e: '🏗️', n: 'Строитель Репозиториев' },
    { lvl: 36, e: '🧪', n: 'Сеньор Тестировщик' },
    { lvl: 37, e: '🌪️', n: 'Мастер Рефакторинга' },
    { lvl: 38, e: '🧘', n: 'Мастер Чистого Кода' },
    { lvl: 39, e: '🧗', n: 'Сеньор Инженер' },
    { lvl: 40, e: '👑', n: 'Тимлид Команды' },
    { lvl: 41, e: '🧠', n: 'Обучатель Нейросетей' },
    { lvl: 42, e: '🤖', n: 'Автоматизатор' },
    { lvl: 43, e: '🔮', n: 'Промпт-Инженер' },
    { lvl: 44, e: '👁️', n: 'Компьютерное Зрение' },
    { lvl: 45, e: '🦾', n: 'Кибер-Инженер' },
    { lvl: 46, e: '🎯', n: 'Аналитик Данных' },
    { lvl: 47, e: '🧬', n: 'Генетический Алгоритм' },
    { lvl: 48, e: '🌐', n: 'Сетевой Инженер' },
    { lvl: 49, e: '🛰️', n: 'Спутниковый Кодер' },
    { lvl: 50, e: '🔮', n: 'ИИ-Ассистент' },
    { lvl: 51, e: '🥷', n: 'Ниндзя Кода' },
    { lvl: 52, e: '🧙‍♂️', n: 'Маг Алгоритмов' },
    { lvl: 53, e: '⚡', n: 'Киберпанк' },
    { lvl: 54, e: '🐉', n: 'Дракон Софта' },
    { lvl: 55, e: '📜', n: 'Хранитель Легенд' },
    { lvl: 56, e: '💎', n: 'Алмазный Кодер' },
    { lvl: 57, e: '🌌', n: 'Межгалактический Инженер' },
    { lvl: 58, e: '🎭', n: 'Маска Анонимуса' },
    { lvl: 59, e: '🛸', n: 'Космический Хакер' },
    { lvl: 60, e: '🔱', n: 'Повелитель Данных' },
    { lvl: 61, e: '⚛️', n: 'Квантовый Кодер' },
    { lvl: 62, e: '🌌', n: 'Архитектор Вселенной' },
    { lvl: 63, e: '👾', n: 'Цифровой Босс' },
    { lvl: 64, e: '⏳', n: 'Повелитель Времени' },
    { lvl: 65, e: '💥', n: 'Разрушитель Багов' },
    { lvl: 66, e: '☄️', n: 'Метеор Продакшна' },
    { lvl: 67, e: '🌟', n: 'Звездный Инженер' },
    { lvl: 68, e: '☯️', n: 'Даос Вычислений' },
    { lvl: 69, e: '👑', n: 'Великий Архитектор' },
    { lvl: 70, e: '👑✨', n: 'Абсолютная Легенда' }
  ];

  const avatars = avatarData.map((item) => ({
    id: `lvl_${item.lvl}`,
    emoji: item.e,
    name: item.n,
    minLevel: item.lvl,
    desc: `Доступно с ${item.lvl} уровня`
  }));

  const handleSelectAvatar = async (avatar) => {
    if (studentLevel < avatar.minLevel) return;

    setSelectedAvatar(avatar.emoji);

    if (onUpdateStudent) {
      onUpdateStudent({ ...student, avatar: avatar.emoji });
    }

    try {
      await supabase
        .from('attendance')
        .update({ avatar: avatar.emoji })
        .eq('student_name', studentName);
    } catch (err) {
      console.error('Ошибка обновления аватара:', err);
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <div>
          <h2 style={styles.title}>🛒 Магазин Аватаров</h2>
          <p style={styles.subtitle}>
            Зарабатывай XP за уроки и открывай новые статусные аватарки!
          </p>
        </div>

        <div style={styles.levelBadge}>
          ⭐ {studentLevel} Уровень ({currentXP} XP)
        </div>
      </div>

      <div style={styles.section}>
        <div style={styles.grid}>
          {avatars.map((item) => {
            const isUnlocked = studentLevel >= item.minLevel;
            const isSelected = selectedAvatar === item.emoji;

            return (
              <div
                key={item.id}
                onClick={() => handleSelectAvatar(item)}
                title={item.desc}
                style={{
                  ...styles.avatarCard,
                  opacity: isUnlocked ? 1 : 0.35,
                  borderColor: isSelected ? '#4ADE80' : isUnlocked ? '#334155' : '#1E293B',
                  cursor: isUnlocked ? 'pointer' : 'not-allowed',
                  backgroundColor: isSelected ? '#064E3B' : '#0F172A'
                }}
              >
                <div style={styles.emojiDisplay}>{item.emoji}</div>
                <div style={styles.avatarName}>{item.name}</div>

                {isUnlocked ? (
                  <span style={{ color: isSelected ? '#4ADE80' : '#38BDF8', fontSize: '10px', marginTop: '4px', fontWeight: 'bold' }}>
                    {isSelected ? '✓ Выбрано' : 'Доступно'}
                  </span>
                ) : (
                  <span style={{ color: '#EF4444', fontSize: '10px', marginTop: '4px', fontWeight: 'bold' }}>
                    🔒 {item.minLevel} ур.
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

const styles = {
  container: {
    backgroundColor: '#1E293B',
    padding: '16px',
    borderRadius: '16px',
    border: '1px solid #334155',
    maxWidth: '1000px',
    margin: '0 auto',
    boxSizing: 'border-box',
    fontFamily: 'sans-serif'
  },
  header: {
    display: 'flex',
    justify: 'space-between',
    alignItems: 'center',
    marginBottom: '16px',
    flexWrap: 'wrap',
    gap: '12px'
  },
  title: {
    color: '#FACC15',
    margin: 0,
    fontSize: 'clamp(18px, 4vw, 22px)'
  },
  subtitle: {
    color: '#94A3B8',
    fontSize: 'clamp(12px, 3vw, 14px)',
    margin: '4px 0 0 0'
  },
  levelBadge: {
    backgroundColor: '#312E81',
    color: '#A5B4FC',
    padding: '6px 12px',
    borderRadius: '20px',
    fontWeight: 'bold',
    fontSize: '13px',
    border: '1px solid #6366F1',
    alignSelf: 'flex-start'
  },
  section: {
    backgroundColor: '#0F172A',
    padding: '12px',
    borderRadius: '12px',
    border: '1px solid #334155',
    maxHeight: '70vh',
    overflowY: 'auto'
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(85px, 1fr))',
    gap: '8px'
  },
  avatarCard: {
    padding: '8px 4px',
    borderRadius: '10px',
    border: '2px solid',
    textAlign: 'center',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    transition: 'all 0.2s ease'
  },
  emojiDisplay: {
    fontSize: '26px',
    marginBottom: '2px'
  },
  avatarName: {
    color: '#FFF',
    fontWeight: 'bold',
    fontSize: '11px',
    wordBreak: 'break-word',
    lineHeight: '1.2'
  }
};