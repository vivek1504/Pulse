import {
  ClerkProvider,
  SignedIn,
  SignedOut,
  SignIn,
  UserButton,
} from '@clerk/clerk-react';
import Chat from './components/Chat';

const CLERK_PUBLISHABLE_KEY =
  'pk_test_YWxpdmUtc2x1Zy04My5jbGVyay5hY2NvdW50cy5kZXYk';

function App() {
  return (
    <ClerkProvider publishableKey={CLERK_PUBLISHABLE_KEY}>
      <UserButton></UserButton>
      <SignedIn>
        <Chat></Chat>
      </SignedIn>
      <SignedOut>
        <SignIn></SignIn>
      </SignedOut>
    </ClerkProvider>
  );
}

export default App;
