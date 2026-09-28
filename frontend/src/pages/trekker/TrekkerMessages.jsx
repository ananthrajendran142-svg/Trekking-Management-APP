import React, { useState, useEffect, useRef } from 'react';
import api from '../../api';
import { useAuth } from '../../context/AuthContext';
import LoadingSpinner from '../../components/LoadingSpinner';
import { MessageSquare, Send, User, Mountain, Compass } from 'lucide-react';
import { io } from 'socket.io-client';

export default function TrekkerMessages() {
  const { user } = useAuth();
  const [channels, setChannels] = useState([]); // List of treks (booked or available)
  const [selectedTrekId, setSelectedTrekId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [inputContent, setInputContent] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [socket, setSocket] = useState(null);
  const chatBottomRef = useRef(null);

  useEffect(() => {
    fetchChannels();
    const newSocket = io();
    setSocket(newSocket);
    return () => newSocket.disconnect();
  }, []);

  const fetchChannels = async () => {
    try {
      // 1. Fetch trekker's bookings
      const bookingResp = await api.get('/bookings');
      let list = bookingResp.data.map(b => ({
        id: b.trek_id,
        name: b.trek_name,
        isBooked: true
      }));

      // 2. If no bookings found, fetch all available treks
      if (list.length === 0) {
        const trekResp = await api.get('/treks');
        list = trekResp.data.map(t => ({
          id: t.id,
          name: t.name,
          isBooked: false
        }));
      }

      setChannels(list);
      if (list.length > 0) {
        const initialId = list[0].id;
        setSelectedTrekId(initialId);
        fetchHistory(initialId);
      }
    } catch (err) {
      console.error("Fetch message channels error:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchHistory = async (trekId) => {
    try {
      const resp = await api.get(`/chat/${trekId}/history`);
      setMessages(resp.data);
      scrollToBottom();
    } catch (err) {
      console.error("Fetch chat history error:", err);
    }
  };

  useEffect(() => {
    if (socket && selectedTrekId) {
      socket.emit('join_room', { room: `trek_${selectedTrekId}`, user_id: user?.id });

      const handleReceiveChat = (newMsg) => {
        if (newMsg.trek_id === selectedTrekId) {
          setMessages(prev => {
            if (prev.some(m => m.id === newMsg.id)) return prev;
            return [...prev, newMsg];
          });
          scrollToBottom();
        }
      };

      socket.on('receive_chat', handleReceiveChat);

      return () => {
        socket.emit('leave_room', { room: `trek_${selectedTrekId}`, user_id: user?.id });
        socket.off('receive_chat', handleReceiveChat);
      };
    }
  }, [socket, selectedTrekId, user]);

  const scrollToBottom = () => {
    setTimeout(() => {
      chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!inputContent.trim() || !selectedTrekId || sending) return;

    const content = inputContent.trim();
    setInputContent('');
    setSending(true);

    try {
      // 1. Post to REST API (ensures DB save & broadcasts to room via Socket.IO)
      const resp = await api.post(`/chat/${selectedTrekId}/send`, {
        content,
        sender_email: user?.email,
        sender_id: user?.id
      });
      const savedMsg = resp.data;

      // 2. Append to local state if not already delivered by socket event
      setMessages(prev => {
        if (prev.some(m => m.id === savedMsg.id)) return prev;
        return [...prev, savedMsg];
      });

      scrollToBottom();
    } catch (err) {
      console.error("Send chat error:", err);
      // Restore input content if error occurred
      setInputContent(content);
    } finally {
      setSending(false);
    }
  };

  if (loading) return <LoadingSpinner message="Opening trek chat room..." />;

  const currentChannel = channels.find(c => c.id === selectedTrekId);

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 space-y-6">
      
      {/* HEADER */}
      <div className="bg-navy-900 text-white rounded-3xl p-6 border border-navy-800 flex justify-between items-center shadow-lg">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-trek-gold">Group Chat</span>
            {currentChannel && !currentChannel.isBooked && (
              <span className="text-[10px] bg-navy-800 text-slate-300 px-2 py-0.5 rounded-full border border-navy-700">Pre-Booking Channel</span>
            )}
          </div>
          <h1 className="text-2xl font-extrabold">{currentChannel?.name || 'Trek Group Chat'}</h1>
        </div>

        {channels.length > 0 && (
          <div className="flex items-center gap-2">
            <Compass className="w-4 h-4 text-trek-gold" />
            <select
              value={selectedTrekId || ''}
              onChange={(e) => {
                const id = parseInt(e.target.value);
                setSelectedTrekId(id);
                fetchHistory(id);
              }}
              className="px-3 py-2 bg-navy-800 border border-navy-700 text-white text-xs font-bold rounded-xl focus:outline-none focus:border-trek-gold"
            >
              {channels.map(c => (
                <option key={c.id} value={c.id}>{c.name} {c.isBooked ? '(Booked)' : ''}</option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* CHAT BOX CONTAINER */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-xl overflow-hidden flex flex-col h-[520px]">
        
        {/* Messages Scroll View */}
        <div className="flex-1 p-6 overflow-y-auto space-y-4 bg-slate-50/50">
          {messages.length > 0 ? (
            messages.map((m, idx) => {
              const isMe = m.sender_id === user?.id || (m.sender_name && user?.name && m.sender_name.toLowerCase() === user.name.toLowerCase());
              return (
                <div key={idx} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                  <div className="flex items-center gap-1.5 text-[10px] text-slate-400 font-semibold mb-1">
                    <span>{m.sender_name || (isMe ? user?.name : 'User')}</span>
                    <span className={`uppercase text-[9px] px-1.5 py-0.5 rounded ${
                      (m.sender_role || (isMe ? user?.role : 'trekker')) === 'guide' ? 'bg-amber-100 text-amber-900 font-bold' :
                      (m.sender_role || (isMe ? user?.role : 'trekker')) === 'admin' ? 'bg-purple-100 text-purple-900 font-bold' :
                      'bg-slate-200 text-slate-700'
                    }`}>
                      {m.sender_role || (isMe ? user?.role : 'trekker')}
                    </span>
                  </div>
                  <div
                    className={`max-w-md p-3.5 rounded-2xl text-xs font-medium leading-relaxed ${
                      isMe
                        ? 'bg-navy-900 text-white rounded-tr-none shadow-md'
                        : 'bg-white text-slate-800 border border-slate-200 rounded-tl-none shadow-sm'
                    }`}
                  >
                    {m.content}
                  </div>
                </div>
              );
            })

          ) : (
            <div className="text-center text-slate-400 text-xs py-24 italic space-y-2">
              <MessageSquare className="w-8 h-8 text-slate-300 mx-auto" />
              <p>No messages exchanged yet in this trek group chat. Be the first to say hello!</p>
            </div>
          )}
          <div ref={chatBottomRef} />
        </div>

        {/* Input Bar */}
        <form onSubmit={handleSendMessage} className="p-4 bg-white border-t border-slate-200 flex gap-3">
          <input
            type="text"
            placeholder="Type message to trek group & guide..."
            value={inputContent}
            onChange={(e) => setInputContent(e.target.value)}
            disabled={sending}
            className="flex-1 px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-navy-900 focus:outline-none focus:border-trek-blue"
          />
          <button
            type="submit"
            disabled={sending || !inputContent.trim()}
            className="px-6 py-3 bg-navy-900 hover:bg-trek-blue disabled:opacity-50 text-white font-bold rounded-xl text-xs shadow transition flex items-center gap-2"
          >
            <span>{sending ? 'Sending...' : 'Send'}</span>
            <Send className="w-4 h-4" />
          </button>
        </form>

      </div>

    </div>
  );
}
