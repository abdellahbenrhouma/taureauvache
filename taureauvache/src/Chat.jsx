import { useState, useEffect } from 'react';

export default function Chat({ socket }) {
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState([]);

  useEffect(() => {
    // Listen for incoming chat messages
    socket.on('chatMessage', (msg) => {
      setMessages((prevMessages) => [...prevMessages, msg]);
    });

    return () => {
      socket.off('chatMessage');
    };
  }, [socket]);

  const sendMessage = () => {
    if (message.trim()) {
      socket.emit('chatMessage', message); // Emit chat message to server
      setMessage(''); // Clear input
    }
  };

  return (
    <div className="chat-box">
      <div className="messages">
        {messages.map((msg, index) => (
          <p key={index}>{msg}</p>
        ))}
      </div>
      <input
        type="text"
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        placeholder="Type a message"
        className="chat-input"
      />
      <button onClick={sendMessage} className="chat-send-button">
        Send
      </button>
    </div>
  );
}
