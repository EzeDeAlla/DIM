import { ContainerModule } from 'inversify';
import { SocketServer } from './socket.server';

// Símbolo para el tipo SocketServer
export const SocketServerType = Symbol.for('SocketServer');

// Módulo de realtime para Inversify
export const realtimeModule = new ContainerModule((bind) => {
  // SocketServer se registrará manualmente en index.ts usando la factory estática
  // Este módulo solo define el símbolo para referencia
});

// Helper para registrar la instancia de SocketServer en el contenedor
export const registerSocketServer = (container: any, socketServer: SocketServer) => {
  container.bind(SocketServerType).toConstantValue(socketServer);
};