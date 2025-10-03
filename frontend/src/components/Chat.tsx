import { useEffect } from 'react';
import {
  ClerkProvider,
  SignedIn,
  SignedOut,
  SignIn,
  UserButton,
  useAuth,
} from '@clerk/clerk-react';
import { io } from 'socket.io-client';

const clerkPubKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;

function ChatApp() {
  const { getToken, userId } = useAuth();

  useEffect(() => {
    async function connectSocket() {
      const token = await getToken({ template: 'default' });
      const socket = io('http://localhost:3000', {
        withCredentials: true,
        extraHeaders: {
          Authorization: `Bearer ${token}`,
        },
      });

      socket.on('connect', () => {
        console.log('✅ Connected to server');
      });

      socket.on('private_message', (data) => {
        console.log('📩 Message:', data);
      });

      // Example: register yourself
      socket.emit('register', userId);

      // Example: send a test msg
      setTimeout(() => {
        socket.emit('private_message', {
          toUserId: 'target_clerk_userId',
          fromUserId: userId,
          message: 'Hello from Clerk user!',
        });
      }, 3000);
    }

    connectSocket();
  }, [getToken, userId]);

  return (
    <div>
      <h1>Chat with Clerk</h1>
      <UserButton afterSignOutUrl="/" />
    </div>
  );
}

export default function App() {
  return (
    <ClerkProvider publishableKey={clerkPubKey}>
      <SignedIn>
        <ChatApp />
      </SignedIn>
      <SignedOut>
        <SignIn />
      </SignedOut>
    </ClerkProvider>
  );
}
