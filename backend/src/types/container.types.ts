// Símbolos para la inyección de dependencias con Inversify
export const TYPES = {
  // Database
  knexType: Symbol.for('Knex'),
  
  // Auth
  AuthService: Symbol.for('AuthService'),
  AuthRepository: Symbol.for('AuthRepository'),
  
  // Users
  UserService: Symbol.for('UserService'),
  UserRepository: Symbol.for('UserRepository'),
  
  // Messages
  MessagesService: Symbol.for('MessagesService'),
  MessagesRepository: Symbol.for('MessagesRepository'),
  MessageEventsPublisher: Symbol.for('MessageEventsPublisher'),
  
  // Conversations
  ConversationsService: Symbol.for('ConversationsService'),
  ConversationsRepository: Symbol.for('ConversationsRepository'),
  
  // Settings
  SettingsService: Symbol.for('SettingsService'),
  SettingsRepository: Symbol.for('SettingsRepository'),
  
  // Health
  HealthController: Symbol.for('HealthController'),
  HealthService: Symbol.for('HealthService'),
  HealthRepository: Symbol.for('HealthRepository'),
  
  // File
  FileService: Symbol.for('FileService')
};