# 📋 Guidelines de Desarrollo

> **Objetivo**: Documentar cómo codeamos en este repo. Corto, claro y accionable.  
> **Tech stack**: React + TS + TanStack Query (FE) · Node + TS + Inversify + Knex (BE) · Esquemas compartidos con Zod en `/shared`.

---

## 1️⃣ Fetching

### Frontend

- Usamos **TanStack Query** con `useAxiosQuery` / `useAxiosMutation`
- Para las peticiones usamos una función wrapper de `useQuery` que transforma la respuesta de Axios para que sea más straightforward de consumir

**Reglas importantes:**
- ❌ **No repetir baseURL** (Axios lo inyecta)
- ❌ **No agregar token de auth** (Axios lo inyecta)  
- ✅ **Cada endpoint va en `/api`** dentro de un archivo por recurso (TypeScript, no TSX)
  - Ej: `leads.api.ts`

### Backend

- Usamos Inversify para inyección de dependencias (DI).
  → Desacoplar controllers/services/repositories, facilitar testing (mocks) y permitir reemplazar implementaciones sin tocar consumidores.
- Usamos Knex como query builder y acceso a Base de Datos.
  → Migrations, seeds, transacciones y SQL tipado desde los repositories.
- Usamos **Axios a secas**
- Si hace falta, `axiosRetry`

---

## 2️⃣ Parámetros de funciones

### Funciones chicas (≤ 4 params)
Usar parámetros individuales. Son simples y directos.

```typescript
function isAvailable(name: string, isAdmin: boolean, hasPastContent: boolean) {
  // ...
}
```

### Funciones grandes o que pueden crecer
Usar un objeto (legibilidad y opcionales a futuro).

```typescript
function createUser({ name, age, id, isAdmin, password }: UserDetails) {
  // ...
}
```

---

## 3️⃣ Tipos y validación

- **Compartir tipos** entre frontend y backend usando `/shared`
- **Definir esquemas Zod** y exportar tipos con `z.infer` desde ese archivo
- **Usar composiciones de tipos** (`Pick`, `Omit`, `Partial`) para no repetir atributos

---

## 4️⃣ Estructura de archivos

### Frontend

```
/components
  /<feature>
    /hooks        
    /types
    /utils
    schema.ts
    <Componente-específico>.tsx
    index.tsx     
/api
  <recurso>.api.ts
```

### Backend (por dominio, no por capa)

Mantener juntos controller/service/repository/types de cada feature (más fácil de encontrar y mantener).

```
/<domain>
  <domain>.controller.ts
  <domain>.service.ts
  <domain>.repository.ts
  <domain>.types.ts
```

---

## 5️⃣ Inyección de dependencias e instanciación

### Inversify

- **Desde los controllers** se hace `container.get()`
- **Los services** son `@injectable()` y usan sus dependencias por `@inject`

### Clases con métodos estáticos (fábricas)

Crear métodos estáticos que llaman internamente al constructor.  
→ Mayor expresividad y validación interna antes de instanciar.

```typescript
class Conversation {
  private constructor(/* ... */) {}
  static create(input: CreateConversationInput) {
    // validar invariantes
    return new Conversation(/* ... */);
  }
}
```

### How to use Inversify

**1. Crear el type:**
```typescript
export const knexType = Symbol.for("Knex");
```

**2. Bindear en un module (ej: `database.module.ts`):**
```typescript
const databaseModule = new ContainerModule((bind) => {
  bind.bind(knexType).toConstantValue(knexInstance());
});
```

**3. Agregar el módulo al container en `inversify.config.ts`:**
```typescript
container.load(
  // otros módulos
  unipileModule,
  databaseModule
);
```

---

## 6️⃣ Notas rápidas

- **Controllers**: orquestan. No DB ni lógica de negocio
- **Services**: reglas de negocio
- **Repositories**: DB/IO (Knex)
- **Errores**: mapear a HTTP (400/403/404/409/500) con `{ message, code?, details? }`
- **Naming**: archivos kebab-case, clases PascalCase, funciones/vars camelCase
- **Auth/headers en FE**: siempre por interceptores (no manual)

---

## 7️⃣ Realtime (si aplica)

- **Eventos claros** (`message:new`, `message:read`, etc.)
- **ACKs explícitos** para delivered/read
- **Auto-scroll** solo si el usuario está al final; si no, CTA "Nuevos mensajes"
- **Lecturas** con IntersectionObserver cuando el mensaje entra al viewport