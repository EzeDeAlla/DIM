import { Container } from 'inversify';
import { databaseModule } from './database.module';
import { authModule } from '../auth/auth.module';
import { usersModule } from '../users/users.module';
import { conversationsModule } from '../conversations/conversations.module';
import { messagesModule } from '../messages/messages.module';
import { settingsModule } from '../settings/settings.module';
import { healthModule } from '../health/health.module';
import { realtimeModule } from '../realtime/realtime.module';
import { fileModule } from '../services/file.module';

// Crear el contenedor principal
const container = new Container();

// Cargar módulos
databaseModule(container);
authModule(container);
usersModule(container);
conversationsModule(container);
messagesModule(container);
container.load(settingsModule);
healthModule(container);
fileModule(container);
container.load(realtimeModule);

// Exportar el contenedor
export { container };
export default container;