#!/bin/bash

echo "🚀 Iniciando setup de la aplicación..."

# Levantar solo la base de datos primero
echo "📊 Levantando base de datos..."
docker-compose up -d database

# Esperar a que la base de datos esté lista
echo "⏳ Esperando a que la base de datos esté lista..."
sleep 10

# Verificar que la base de datos esté funcionando
echo "🔍 Verificando conexión a la base de datos..."
until docker-compose exec database pg_isready -U user -d medical_chat_db; do
  echo "Esperando a que la base de datos esté lista..."
  sleep 2
done

echo "✅ Base de datos lista!"

# Levantar el backend
echo "🔧 Levantando backend..."
docker-compose up -d api-service

# Esperar un momento para que el backend se inicie
sleep 5

# Ejecutar migraciones usando ts-node
echo "📊 Ejecutando migraciones..."
docker-compose exec api-service sh -c "cd /app && npx ts-node -r tsconfig-paths/register ./node_modules/.bin/knex migrate:latest --knexfile knexfile.ts"

# Ejecutar semillas
echo "🌱 Ejecutando semillas..."
docker-compose exec api-service sh -c "cd /app && npx ts-node -r tsconfig-paths/register ./node_modules/.bin/knex seed:run --knexfile knexfile.ts"

# Levantar el frontend
echo "🎨 Levantando frontend..."
docker-compose up -d web-client

echo "✅ ¡Setup completado!"
echo "🌐 Frontend: http://localhost:8080"
echo "🔧 Backend API: http://localhost:3001"
echo "📚 Swagger docs: http://localhost:3001/api-docs"
