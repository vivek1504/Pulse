import { useEffect, useState } from 'react';
import socket from '../socket';
import { useUser } from '@clerk/clerk-react';
import axios from 'axios';

interface messageType {
  from: any;
  text: string;
}

const Chat = () => {
  const { user } = useUser();
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState<messageType[]>([]);
  const [toUserId, setToUserId] = useState('');
  const [users, setUsers] = useState([]);

  useEffect(() => {
    socket.on('connect', () => {
      socket.emit('register');
    });

    socket.on('private_message', ({ fromUserId, message }) => {
      //@ts-ignore
      setMessages((prev) => [...prev, { from: fromUserId, text: message }]);
    });

    return () => {
      socket.off('private_message');
    };
  }, []);

  useEffect(() => {
    (async () => {
      const response = await axios.get('http://localhost:3000/users');
      setUsers(response.data);
    })();
  }, []);

  const sendMessage = () => {
    if (!toUserId || !message.trim() || !user?.id) return;

    socket.emit('private_message', {
      toUserId,
      fromUserId: user.id,
      message,
    });

    //@ts-ignore
    setMessages((prev) => [...prev, { from: 'me', text: message }]);
    setMessage('');
  };

  return (
    <div style={{ padding: '20px' }}>
      <h2>Private Chat</h2>

      {users &&
        users.map((u) => {
          return (
            <button
              onClick={() => {
                setToUserId(u);
              }}
            >
              {u}
            </button>
          );
        })}
      <div style={{ margin: '20px 0' }}>
        {messages &&
          messages.map((m, i) => (
            <div key={i}>
              <b>{m.from}:</b> {m.text}
            </div>
          ))}
      </div>

      <input
        type="text"
        placeholder="Type a message..."
        value={message}
        onChange={(e) => setMessage(e.target.value)}
      />
      <button onClick={sendMessage}>Send</button>
    </div>
  );
};

export default Chat;
