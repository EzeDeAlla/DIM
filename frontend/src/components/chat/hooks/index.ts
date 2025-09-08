// Hooks para Socket.IO y chat en tiempo real
export { useChatSocket } from './useChatSocket';
export { 
  useRealtimeUpdates, 
  useChatRealtimeUpdates, 
  useUserStatusUpdates 
} from './useRealtimeUpdates';

// Hooks para composición de mensajes y scroll
export { useAutoScroll, useSimpleAutoScroll } from './useAutoScroll';
export { useComposeMessage, useSimpleComposeMessage } from './useComposeMessage';

// Tipos para TypeScript
export type {
  // Agregar aquí tipos específicos si es necesario
} from './useChatSocket';