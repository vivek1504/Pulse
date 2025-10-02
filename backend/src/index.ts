import express from 'express';
import { Server, Socket } from 'socket.io';
import bcrypt from 'bcrypt';

const app = express();
app.use(express.json());
const io = new Server(3000, {
  cors: { origin: '*' },
});

const onlineUsers = new Map<string, string>();

interface PrivateMessagePayload {
  toUserId: string;
  fromUserId: string;
  message: string;
}

app.post('/signup', (req, res) => {
  const { email, password } = req.body;
});

io.on('connection', (socket) => {
  console.log('user connected');

  socket.on('register', (userId: string) => {
    onlineUsers.set(userId, socket.id);
    console.log('user registered:', userId);
  });

  socket.on('private_message', (payload: PrivateMessagePayload) => {
    const targetSocketId = onlineUsers.get(payload.toUserId);

    if (targetSocketId) {
      io.to(targetSocketId).emit('private_message', {
        fromUserId: payload.fromUserId,
        message: payload.message,
      });
    } else {
      console.log(`user ${payload.toUserId} is offline`);
    }
  });

  socket.on('disconnect', () => {
    console.log('user disconnecte : ', socket.id);
    for (let [userId, id] of onlineUsers.entries()) {
      if (id === socket.id) {
        onlineUsers.delete(userId);
        break;
      }
    }
  });
});

app.listen(3000, () => {
  console.log('listening');
});
