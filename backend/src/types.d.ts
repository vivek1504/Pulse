import { Socket as BaseSocket } from 'socket.io';

declare module 'socket.io' {
  interface Socket {
    userId?: string;
  }
}
