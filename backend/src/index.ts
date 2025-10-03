import express from 'express';
import { Server, Socket } from 'socket.io';
import bcrypt from 'bcrypt';
import { clerkClient, clerkMiddleware, getAuth } from '@clerk/express';
import cookie from 'cookie';
import { PrismaClient } from '@prisma/client';

const app = express();
const prisma = new PrismaClient();

app.use(express.json());
app.use(clerkMiddleware());

const io = new Server(3000, {
  cors: {
    origin: '*',
    credentials: true,
  },
});

const onlineUsers = new Map<string, string>();

interface PrivateMessagePayload {
  toUserId: string;
  fromUserId: string;
  message: string;
}

async function getOrCreateUser(clerkUserId: string) {
  let user = await prisma.user.findUnique({ where: { clerkId: clerkUserId } });

  if (!user) {
    const clerkUser = await clerkClient.users.getUser(clerkUserId);
    user = await prisma.user.create({
      data: {
        clerkId: clerkUser.id,
        email: clerkUser.emailAddresses[0]?.emailAddress || 'default@gmail.com',
      },
    });
  }
  return user;
}

io.use(async (socket, next) => {
  try {
    const cookieHeader = socket.handshake.headers.cookie;
    if (!cookieHeader) return next(new Error('Authentication Error'));

    const cookies = cookie.parse(cookieHeader);
    const fakeReq = { cookies } as any;
    const auth = getAuth(fakeReq);

    if (!auth.userId) return next(new Error('Authentication error'));
    socket.userId = auth.userId;
    next();
  } catch (e) {
    next(new Error('Authentication error'));
  }
});

io.on('connection', (socket) => {
  console.log('user connected');

  socket.on('register', (userId: string) => {
    if (!socket.userId) return;
    onlineUsers.set(userId, socket.id);
    console.log('user registered:', userId);
  });

  socket.on('private_message', async (payload: PrivateMessagePayload) => {
    if (!socket.userId) return;

    const targetSocketId = onlineUsers.get(payload.toUserId);
    const sender = await getOrCreateUser(socket.userId);
    const recipient = await getOrCreateUser(payload.toUserId);

    let existingChat = await prisma.chat.findFirst({
      where: {
        type: 'PRIVATE',
        members: {
          some: { id: sender.id },
        },
        AND: {
          members: {
            some: { id: recipient.id },
          },
        },
      },
      include: { members: true },
    });

    if (!existingChat) {
      existingChat = await prisma.chat.create({
        data: {
          type: 'PRIVATE',
          members: {
            connect: [{ id: sender.id }, { id: recipient.id }],
          },
        },
        include: { members: true },
      });
    }

    const message = await prisma.message.create({
      data: {
        text: payload.message,
        chatId: existingChat.id,
        senderId: sender.id,
      },
      include: { user: true },
    });

    if (targetSocketId) {
      io.to(targetSocketId).emit('private_message', {
        fromUserId: sender.id,
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
