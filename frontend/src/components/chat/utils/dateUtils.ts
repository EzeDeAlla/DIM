/**
 * Utilidades para formateo de fechas y tiempo en el chat
 */

/**
 * Formatea una fecha/hora en formato HH:MM
 * @param timestamp - Timestamp en formato ISO string o Date
 * @returns Hora formateada como "14:30"
 */
export const formatTime = (timestamp: string | Date): string => {
  const date = typeof timestamp === 'string' ? new Date(timestamp) : timestamp;
  
  if (isNaN(date.getTime())) {
    return '--:--';
  }
  
  return date.toLocaleTimeString('es-ES', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  });
};

/**
 * Formatea una fecha en formato legible para separadores
 * @param timestamp - Timestamp en formato ISO string o Date
 * @returns Fecha formateada como "Hoy", "Ayer" o "DD/MM/YYYY"
 */
export const formatDateSeparator = (timestamp: string | Date): string => {
  const date = typeof timestamp === 'string' ? new Date(timestamp) : timestamp;
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000);
  const messageDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  
  if (isNaN(date.getTime())) {
    return 'Fecha inválida';
  }
  
  if (messageDate.getTime() === today.getTime()) {
    return 'Hoy';
  }
  
  if (messageDate.getTime() === yesterday.getTime()) {
    return 'Ayer';
  }
  
  // Para fechas más antiguas, mostrar día de la semana si es de esta semana
  const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
  if (messageDate > weekAgo) {
    return date.toLocaleDateString('es-ES', { weekday: 'long' });
  }
  
  // Para fechas más antiguas, mostrar fecha completa
  return date.toLocaleDateString('es-ES', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });
};

/**
 * Determina si dos fechas son del mismo día
 * @param date1 - Primera fecha
 * @param date2 - Segunda fecha
 * @returns true si son del mismo día
 */
export const isSameDay = (date1: string | Date, date2: string | Date): boolean => {
  const d1 = typeof date1 === 'string' ? new Date(date1) : date1;
  const d2 = typeof date2 === 'string' ? new Date(date2) : date2;
  
  return (
    d1.getFullYear() === d2.getFullYear() &&
    d1.getMonth() === d2.getMonth() &&
    d1.getDate() === d2.getDate()
  );
};

/**
 * Calcula la diferencia en minutos entre dos fechas
 * @param date1 - Primera fecha (más reciente)
 * @param date2 - Segunda fecha (más antigua)
 * @returns Diferencia en minutos
 */
export const getMinutesDifference = (date1: string | Date, date2: string | Date): number => {
  const d1 = typeof date1 === 'string' ? new Date(date1) : date1;
  const d2 = typeof date2 === 'string' ? new Date(date2) : date2;
  
  return Math.floor((d1.getTime() - d2.getTime()) / (1000 * 60));
};

/**
 * Determina si se debe mostrar el timestamp basado en la diferencia de tiempo
 * @param currentTimestamp - Timestamp del mensaje actual
 * @param previousTimestamp - Timestamp del mensaje anterior
 * @param thresholdMinutes - Umbral en minutos (por defecto 5)
 * @returns true si se debe mostrar el timestamp
 */
export const shouldShowTimestamp = (
  currentTimestamp: string | Date,
  previousTimestamp?: string | Date,
  thresholdMinutes: number = 5
): boolean => {
  if (!previousTimestamp) return true;
  
  const minutesDiff = getMinutesDifference(currentTimestamp, previousTimestamp);
  return minutesDiff >= thresholdMinutes;
};

/**
 * Formatea tiempo relativo (ej: "hace 5 minutos", "hace 2 horas")
 * @param timestamp - Timestamp a formatear
 * @returns Tiempo relativo formateado
 */
export const formatRelativeTime = (timestamp: string | Date): string => {
  const date = typeof timestamp === 'string' ? new Date(timestamp) : timestamp;
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMinutes = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  
  if (diffMinutes < 1) return 'Ahora';
  if (diffMinutes < 60) return `hace ${diffMinutes}m`;
  if (diffHours < 24) return `hace ${diffHours}h`;
  if (diffDays < 7) return `hace ${diffDays}d`;
  
  return formatDateSeparator(date);
};

/**
 * Agrupa mensajes por día para mostrar separadores
 * @param messages - Array de mensajes con timestamp
 * @returns Array de mensajes con separadores de día insertados
 */
export const groupMessagesByDay = <T extends { timestamp: string | Date; id: string }>(
  messages: T[]
): (T | { type: 'date-separator'; date: string; id: string })[] => {
  if (!messages.length) return [];
  
  const result: (T | { type: 'date-separator'; date: string; id: string })[] = [];
  let lastDate: string | null = null;
  
  messages.forEach((message, index) => {
    const messageDate = new Date(
      typeof message.timestamp === 'string' 
        ? message.timestamp 
        : message.timestamp
    );
    const currentDateStr = messageDate.toDateString();
    
    // Si es un día diferente al anterior, agregar separador
    if (lastDate !== currentDateStr) {
      result.push({
        type: 'date-separator',
        date: formatDateSeparator(messageDate),
        id: `separator-${currentDateStr}-${index}`
      });
      lastDate = currentDateStr;
    }
    
    result.push(message);
  });
  
  return result;
};