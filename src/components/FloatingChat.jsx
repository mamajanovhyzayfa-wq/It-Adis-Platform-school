import React, { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '../supabaseClient';

export default function FloatingChat({ studentName = 'Ученик', groupName = '9-А' }) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const channelRef = useRef(null);

  const fetchMessages = useCallback(async () => {
    const { data, error } = await supabase
      .from('messages')
      .select('*')
      .eq('group_name', groupName)
      .order('created_at', { ascending: true })
      .limit(50);

    if (!error && data) setMessages(data);
  }, [groupName]);

  useEffect(() => {
    if (!isOpen) return;

    fetchMessages();

    const channel = supabase
      .channel(`public:messages:${groupName}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'messages' },
        (payload) => {
          if (payload.new && payload.new.group_name === groupName) {
            setMessages((prev) => [...prev, payload.new]);
          }
        }
      )
      .subscribe();

    channelRef.current = channel;

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, [isOpen, groupName, fetchMessages]);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    const textToSend = newMessage.trim();
    if (!textToSend) return;

    setNewMessage('');

    const { error } = await supabase.from('messages').insert([
      {
        sender: studentName,
        group_name: groupName,
        text: textToSend,
      },
    ]);

    if (error) {
      console.error('Ошибка отправки сообщения:', error);
      setNewMessage(textToSend);
    }
  };

  return (
    <div style={styles.chatWrapper}>
      {isOpen && (
        <div style={styles.chatWindow}>
          <div style={styles.chatHeader}>
            <span style={styles.chatTitle}>💬 Чат группы ({groupName})</span>
            <button onClick={() => setIsOpen(false)} style={styles.closeBtn}>
              ✖
            </button>
          </div>

          <div style={styles.messagesList}>
            {messages.length === 0 ? (
              <p style={styles.emptyText}>Сообщений пока нет. Напишите первым!</p>
            ) : (
              messages.map((msg, idx) => {
                const isMe = msg.sender === studentName;
                return (
                  <div
                    key={msg.id ?? `msg-${idx}`}
                    style={{
                      ...styles.messageItem,
                      alignSelf: isMe ? 'flex-end' : 'flex-start',
                      backgroundColor: isMe ? '#0284C7' : '#334155',
                    }}
                  >
                    <div style={styles.senderName}>{msg.sender}</div>
                    <div style={styles.messageText}>{msg.text}</div>
                  </div>
                );
              })
            )}
          </div>

          <form onSubmit={handleSendMessage} style={styles.inputArea}>
            <input
              type="text"
              placeholder="Напишите сообщение..."
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              style={styles.input}
            />
            <button type="submit" style={styles.sendBtn}>
              🚀
            </button>
          </form>
        </div>
      )}

      <button onClick={() => setIsOpen((v) => !v)} style={styles.toggleBtn}>
        💬 {isOpen ? 'Свернуть' : 'Чат урока'}
      </button>
    </div>
  );
}

const styles = {
  chatWrapper: {
    position: 'fixed',
    bottom: '20px',
    right: '20px',
    zIndex: 9999,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-end',
  },
  toggleBtn: {
    backgroundColor: '#38BDF8',
    color: '#0F172A',
    border: 'none',
    padding: '12px 20px',
    borderRadius: '24px',
    fontWeight: 'bold',
    cursor: 'pointer',
    boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
    fontSize: '14px',
  },
  chatWindow: {
    width: '320px',
    height: '420px',
    backgroundColor: '#0F172A',
    border: '1px solid #334155',
    borderRadius: '16px',
    marginBottom: '10px',
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
    boxShadow: '0 8px 24px rgba(0,0,0,0.5)',
  },
  chatHeader: {
    backgroundColor: '#1E293B',
    padding: '12px 16px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottom: '1px solid #334155',
  },
  chatTitle: {
    color: '#FFF',
    fontSize: '14px',
    fontWeight: 'bold',
  },
  closeBtn: {
    background: 'none',
    border: 'none',
    color: '#94A3B8',
    cursor: 'pointer',
    fontSize: '14px',
  },
  messagesList: {
    flex: 1,
    padding: '12px',
    overflowY: 'auto',
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  messageItem: {
    maxWidth: '80%',
    padding: '8px 12px',
    borderRadius: '12px',
    color: '#FFF',
  },
  senderName: {
    fontSize: '10px',
    color: '#E2E8F0',
    opacity: 0.8,
    marginBottom: '2px',
  },
  messageText: {
    fontSize: '13px',
    wordBreak: 'break-word',
  },
  inputArea: {
    display: 'flex',
    padding: '8px',
    backgroundColor: '#1E293B',
    borderTop: '1px solid #334155',
  },
  input: {
    flex: 1,
    backgroundColor: '#0F172A',
    border: '1px solid #334155',
    borderRadius: '8px',
    padding: '8px 12px',
    color: '#FFF',
    outline: 'none',
    fontSize: '13px',
  },
  sendBtn: {
    backgroundColor: '#38BDF8',
    border: 'none',
    borderRadius: '8px',
    marginLeft: '6px',
    padding: '0 12px',
    cursor: 'pointer',
  },
  emptyText: {
    color: '#64748B',
    fontSize: '12px',
    textAlign: 'center',
    marginTop: 'auto',
    marginBottom: 'auto',
  },
};