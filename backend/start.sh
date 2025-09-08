#!/bin/sh

echo "🚀 Iniciando aplicación..."

# Esperar a que la base de datos esté lista
echo "⏳ Esperando a que la base de datos esté lista..."
until pg_isready -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME; do
  echo "Esperando a que la base de datos esté lista..."
  sleep 2
done

echo "✅ Base de datos lista!"

# Ejecutar migraciones
echo "📊 Ejecutando migraciones..."
npx ts-node -r tsconfig-paths/register ./node_modules/.bin/knex migrate:latest --knexfile knexfile.ts

if [ $? -eq 0 ]; then
  echo "✅ Migraciones ejecutadas correctamente"
else
  echo "❌ Error ejecutando migraciones"
  exit 1
fi

# Ejecutar semillas
echo "🌱 Ejecutando semillas..."
npx ts-node -r tsconfig-paths/register ./node_modules/.bin/knex seed:run --knexfile knexfile.ts

if [ $? -eq 0 ]; then
  echo "✅ Semillas ejecutadas correctamente"
else
  echo "❌ Error ejecutando semillas"
  exit 1
fi

# Iniciar la aplicación
echo "🚀 Iniciando servidor..."
exec npm run start
