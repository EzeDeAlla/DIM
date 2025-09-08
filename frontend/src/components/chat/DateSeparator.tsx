import React from 'react';

interface DateSeparatorProps {
  /** Texto de la fecha a mostrar */
  date: string;
  /** Clase CSS adicional */
  className?: string;
}

/**
 * Componente para mostrar separadores de fecha en el chat
 */
export const DateSeparator: React.FC<DateSeparatorProps> = ({ 
  date, 
  className = '' 
}) => {
  return (
    <div 
      className={`date-separator ${className}`}
      role="separator"
      aria-label={`Mensajes del ${date}`}
    >
      <div className="date-separator-line" />
      <span className="date-separator-text">{date}</span>
      <div className="date-separator-line" />
    </div>
  );
};

export default DateSeparator;