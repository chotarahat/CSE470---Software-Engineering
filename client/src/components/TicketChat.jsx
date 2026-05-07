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
  const [isRecording, setIsRecording] = useState(false);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);

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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ticket?._id, anonymousToken]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async (e, audioData = null) => {
    if (e) e.preventDefault();
    if (!text.trim() && !audioData) return;

    setSending(true);
    setError('');

    try {
      if (anonymousToken) {
        await sendAnonymousMessage({
          ticketId: ticketMongoId,
          messageText: audioData ? '🎤 Voice Message' : text,
          audioData: audioData, // Sent alongside text
          anonymousToken
        });
      } else {
        await sendMessage({
          ticketId: ticketMongoId,
          messageText: audioData ? '🎤 Voice Message' : text,
          audioData: audioData // Sent alongside text
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

const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      // 👇 1. Force Chrome's preferred audio codec
      const mimeType = 'audio/webm;codecs=opus';
      const options = MediaRecorder.isTypeSupported(mimeType) ? { mimeType } : {};
      
      mediaRecorderRef.current = new MediaRecorder(stream, options);
      audioChunksRef.current = [];

      mediaRecorderRef.current.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) {
          audioChunksRef.current.push(e.data);
        }
      };

      mediaRecorderRef.current.onstop = () => {
        // 👇 2. Explicitly tell the Blob it is an audio file!
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        
        if (audioBlob.size < 100) {
          stream.getTracks().forEach(track => track.stop());
          return; 
        }

        const reader = new FileReader();
        reader.readAsDataURL(audioBlob);
        reader.onloadend = () => {
          const base64Audio = reader.result;
          
          // 👇 3. Debugging logs! Press F12 in Chrome to see these!
          console.log("Audio ready to send! Size:", Math.round(base64Audio.length / 1024), "KB");
          console.log("Audio Data Header:", base64Audio.substring(0, 40));
          
          handleSend(null, base64Audio); 
        };
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorderRef.current.start(250); 
      setIsRecording(true);
    } catch (err) {
      alert('Microphone access denied. Please check your browser permissions.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  // 👇 NEW: Toggle function for clicking instead of holding
  const toggleRecording = () => {
    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  };


  // ── NEW: Dummy Voice Playback Effect ──
  const applyDummyVoice = (e) => {
    // Pitch shift to protect anonymity
    e.target.preservesPitch = false; 
    e.target.playbackRate = 0.75; 
  };

  const getRole = (msg) => {
    if (anonymousToken) {
      return msg.senderRole === 'student' ? 'me' : 'them';
    }
    return msg.sender?._id === user?._id ? 'me' : 'them';
  };

  if (loading) return <div className="loading-center"><div className="spinner" /></div>;

  //const getRole = (msg) => {
    //if (anonymousToken) {
      //return msg.senderRole === 'student' ? 'me' : 'them';
    //}
    //return msg.sender?._id === user?._id ? 'me' : 'them';
  //};

  if (loading) return <div className="loading-center"><div className="spinner" /></div>;

  return (
    <div className="chat-container">
      <div className="chat-messages" style={{ overflowY: 'auto' }}>
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
                
                {/* NEW: Audio Player Render */}
                {msg.audioData && (
                  <div style={{ marginTop: '0.5rem' }}>
                    <audio 
                      src={msg.audioData} 
                      controls 
                      onPlay={msg.senderRole === 'student' ? applyDummyVoice : undefined} 
                      style={{ height: '35px', width: '220px', outline: 'none' }}
                    />
                    {msg.senderRole === 'student' && (
                      <div style={{ fontSize: '0.65rem', marginTop: '2px', opacity: 0.8 }}>
                        🔒 Anonymous Filter
                      </div>
                    )}
                  </div>
                )}

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
              className="btn btn-secondary btn-sm"
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

          <form className="chat-input-row" onSubmit={(e) => handleSend(e, null)}>
            <input
              type="text"
              placeholder="Type a message..."
              value={text}
              onChange={(e) => setText(e.target.value)}
              disabled={isRecording}
            />
            
            {/* NEW: Voice Record Button */}
            <button 
              type="button" 
              className={`btn ${isRecording ? 'btn-danger' : 'btn-secondary'}`}
              onClick={toggleRecording}
              title="Click to start/stop recording"
              style={{ minWidth: '80px', fontWeight: 'bold' }}
            >
              {isRecording ? '🛑' : '🎤'}
            </button>

            <button
              type="submit"
              className="btn btn-primary"
              disabled={sending || isRecording || !text.trim()}
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