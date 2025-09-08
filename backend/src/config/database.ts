import { Knex } from 'knex';
import knex from 'knex';
import dotenv from 'dotenv';

// Cargar variables de entorno
dotenv.config();

// Función para crear instancia de Knex
export const createKnex = (): Knex => {
  // Configuración usando DB_URL o variables individuales
  const databaseConfig: Knex.Config = {
    client: 'pg',
    connection: process.env.DB_URL || {
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '5432'),
      database: process.env.DB_NAME || 'medical_chat',
      user: process.env.DB_USER || 'ezequiel',
      password: process.env.DB_PASSWORD || '',
      ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false,
    },
    pool: {
      min: 2,
      max: 10,
      acquireTimeoutMillis: 30000,
      createTimeoutMillis: 30000,
      destroyTimeoutMillis: 5000,
      idleTimeoutMillis: 30000,
      reapIntervalMillis: 1000,
      createRetryIntervalMillis: 100,
    },
    migrations: {
      directory: './src/database/migrations',
      extension: 'ts',
      tableName: 'knex_migrations',
    },
    seeds: {
      directory: './src/database/seeds',
      extension: 'ts',
    },
    debug: process.env.NODE_ENV === 'development',
  };

  return knex(databaseConfig);
};

// Instancia por defecto para compatibilidad
const db = createKnex();

// Función para probar la conexión
export const testConnection = async (): Promise<boolean> => {
  try {
    await db.raw('SELECT 1');
    console.log('✅ Conexión a PostgreSQL establecida correctamente');
    return true;
  } catch (error) {
    console.error('❌ Error al conectar con PostgreSQL:', error);
    return false;
  }
};

// Función para cerrar la conexión
export const closeConnection = async (): Promise<void> => {
  try {
    await db.destroy();
    console.log('🔌 Conexión a PostgreSQL cerrada');
  } catch (error) {
    console.error('❌ Error al cerrar conexión:', error);
  }
};

// Función para ejecutar migraciones
export const runMigrations = async (): Promise<void> => {
  try {
    const [batchNo, log] = await db.migrate.latest();
    if (log.length === 0) {
      console.log('📊 Base de datos ya está actualizada');
    } else {
      console.log(`📊 Migraciones ejecutadas - Batch ${batchNo}:`, log);
    }
  } catch (error) {
    console.error('❌ Error ejecutando migraciones:', error);
    throw error;
  }
};

// Función para ejecutar seeds
export const runSeeds = async (): Promise<void> => {
  try {
    await db.seed.run();
    console.log('🌱 Seeds ejecutados correctamente');
  } catch (error) {
    console.error('❌ Error ejecutando seeds:', error);
    throw error;
  }
};

export default db;