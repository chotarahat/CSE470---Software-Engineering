import React, { useState, useEffect, useRef } from 'react';
import { getMessages, sendMessage, sendAnonymousMessage } from '../services/api';
import { useAuth } from '../context/AuthContext';
import './TicketChat.css';
import QUICK_REPLIES from '../utils/quickReplies';

export default function TicketChat({ ticket, anonymousToken }) {
  const { user } = useAuth();
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const [newPriority, setNewPriority] = useState("");
  const bottomRef = useRef(null);

  const ticketMongoId = ticket._id;

  const handleTemplateSelect = (e) => {
    const selected = QUICK_REPLIES.find(r => r.id === parseInt(e.target.value));
    if (selected) {
      setText(selected.text);
    }
  };

  // FIXED PRIORITY UPDATE FUNCTION
  const updatePriority = async () => {
    try {
      const res = await fetch(`/api/tickets/${ticketMongoId}/priority`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          newPriority,
          anonymousToken,
        }),
      });

      const data = await res.json();

      if (!res.ok) throw new Error(data.message);

      alert("Priority updated successfully");
      setNewPriority(""); // reset dropdown

    } catch (err) {
      alert(err.message);
    }
  };

  const fetchMessages = async () => {
    try {
      const res = await getMessages(ticketMongoId, anonymousToken);
      setMessages(res.data);
    } catch {
      setError('Could not load messages.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMessages();
    const interval = setInterval(fetchMessages, 8000);
    return () => clearInterval(interval);
  }, [ticketMongoId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!text.trim()) return;

    setSending(true);
    setError('');

    try {
      if (anonymousToken) {
        await sendAnonymousMessage({
          ticketId: ticketMongoId,
          messageText: text,
          anonymousToken
        });
      } else {
        await sendMessage({
          ticketId: ticketMongoId,
          messageText: text
        });
      }

      setText('');
      fetchMessages();

    } catch (err) {
      setError(err.response?.data?.message || 'Failed to send message.');
    } finally {
      setSending(false);
    }
  };

  const getRole = (msg) => {
    if (anonymousToken) {
      return msg.senderRole === 'student' ? 'me' : 'them';
    }
    return msg.sender?._id === user?._id ? 'me' : 'them';
  };

  if (loading) return <div className="loading-center"><div className="spinner" /></div>;

  return (
    <div className="chat-container">
      <div className="chat-messages">
        {messages.length === 0 && (
          <div className="chat-empty">
            <p>No messages yet. Start the conversation.</p>
          </div>
        )}

        {messages.map((msg) => {
          const side = getRole(msg);
          return (
            <div key={msg._id} className={`chat-bubble-wrap ${side}`}>
              <div className={`chat-bubble ${side}`}>
                <p>{msg.messageText}</p>
                <span className="chat-meta">
                  {msg.senderRole === 'student'
                    ? 'Anonymous Student'
                    : msg.sender?.name || msg.senderRole}
                  {' · '}
                  {new Date(msg.createdAt).toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </span>
              </div>
            </div>
          );
        })}

        <div ref={bottomRef} />
      </div>

      {error && (
        <div className="alert alert-error" style={{ margin: '0.5rem 1rem' }}>
          {error}
        </div>
      )}

      {ticket.status !== 'closed' && (
        <div className='chat-input-container'>

          {/*  PRIORITY UPDATE UI */}
          <div style={{ padding: '0.5rem', borderBottom: '1px solid var(--border)' }}>
            <label style={{ marginRight: '10px' }}>Priority:</label>

            <select
              value={newPriority}
              onChange={(e) => setNewPriority(e.target.value)}
            >
              <option value="">Select</option>
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
              <option value="urgent">Urgent</option>
            </select>

            <button
              onClick={updatePriority}
              style={{ marginLeft: '10px' }}
              disabled={!newPriority}
            >
              Update
            </button>
          </div>

          {!anonymousToken && (
            <div
              className='quick-reply-wrapper'
              style={{ padding: '0.5rem', borderBottom: '1px solid var(--border)' }}
            >
              <select onChange={handleTemplateSelect} className='btn-secondary'>
                {QUICK_REPLIES.map(r => (
                  <option key={r.id} value={r.id}>
                    {r.title}
                  </option>
                ))}
              </select>
            </div>
          )}

          <form className="chat-input-row" onSubmit={handleSend}>
            <input
              type="text"
              placeholder="Type a message..."
              value={text}
              onChange={(e) => setText(e.target.value)}
            />
            <button
              type="submit"
              className="btn btn-primary"
              disabled={sending || !text.trim()}
            >
              {sending ? '...' : 'Send'}
            </button>
          </form>
        </div>
      )}

      {ticket.status === 'closed' && (
        <p
          style={{
            textAlign: 'center',
            color: 'var(--text-muted)',
            padding: '1rem',
            fontSize: '0.85rem'
          }}
        >
          This ticket is closed. No further messages can be sent.
        </p>
      )}
    </div>
  );
}