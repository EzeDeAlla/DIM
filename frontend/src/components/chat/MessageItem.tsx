interface Message {
  id: string;
  content: string;
  senderId: string;
  senderName: string;
  senderRole: 'doctor' | 'nurse' | 'admin' | 'patient';
  timestamp: string;
  isRead?: boolean;
  status?: 'sent' | 'delivered' | 'read';
  delivered_at?: string;
  readBy?: Record<string, string>;
  deliveryStatus?: 'sending' | 'sent' | 'delivered' | 'read' | 'failed';
}

interface MessageItemProps {
  message: Message;
  showAvatar: boolean;
  showTimestamp: boolean;
  isOwn: boolean;
}

export const MessageItem = ({
  message,
  showAvatar,
  showTimestamp,
  isOwn
}: MessageItemProps) => {
  // Debug: log solo para mensajes propios
  if (isOwn) {
    // console.log('MessageItem - Mensaje propio:', {
    //   id: message.id,
    //   status: message.status,
    //   deliveryStatus: message.deliveryStatus,
    //   delivered_at: message.delivered_at
    // });
  }
  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('es-ES', { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: false
    });
  };

  const getRoleColor = (role: string) => {
    const colors = {
      doctor: '#059669',
      nurse: '#0284c7', 
      admin: '#7c3aed',
      patient: '#dc2626'
    };
    return colors[role as keyof typeof colors] || '#64748b';
  };

  const getRoleLabel = (role: string) => {
    const labels = {
      doctor: 'Dr.',
      nurse: 'Enf.',
      admin: 'Admin',
      patient: 'Pac.'
    };
    return labels[role as keyof typeof labels] || '';
  };

  const getDeliveryStatusIcon = () => {
    // Usar el deliveryStatus calculado en DesktopLayout
    const currentStatus = message.deliveryStatus || 'sent';

    switch (currentStatus) {
      case 'sending':
        return (
          <svg className="w-3.5 h-3.5 opacity-100 flex-shrink-0 text-white/60 animate-spin" viewBox="0 0 24 24" fill="none">
            <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" strokeDasharray="31.416" strokeDashoffset="31.416">
              <animate attributeName="stroke-dasharray" dur="2s" values="0 31.416;15.708 15.708;0 31.416;0 31.416" repeatCount="indefinite"/>
              <animate attributeName="stroke-dashoffset" dur="2s" values="0;-15.708;-31.416;-31.416" repeatCount="indefinite"/>
            </circle>
          </svg>
        );
      case 'sent':
        return (
          <svg className="w-3.5 h-3.5 opacity-100 flex-shrink-0 text-white/80" viewBox="0 0 24 24" fill="none">
            <path d="M20 6L9 17l-5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        );
      case 'delivered':
        return (
          <svg className="w-3.5 h-3.5 opacity-100 flex-shrink-0 text-white/70" viewBox="0 0 24 24" fill="none">
            <path d="M2 12l4 4 8-8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M8 12l4 4 8-8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        );
      case 'read':
        return (
          <svg className="w-3.5 h-3.5 opacity-100 flex-shrink-0 text-[#4FC3F7]" viewBox="0 0 24 24" fill="none">
            <path d="M2 12l4 4 8-8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M8 12l4 4 8-8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        );
      case 'failed':
        return (
          <svg className="w-3.5 h-3.5 opacity-100 flex-shrink-0 text-red-600" viewBox="0 0 24 24" fill="none">
            <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
            <path d="m15 9-6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="m9 9 6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        );
      default:
        return null;
    }
  };

  return (
    <div className={`mb-4 w-full animate-messageSlideIn ${isOwn ? 'own' : 'other'}`}>
      {showTimestamp && (
        <div className="flex items-center justify-center my-4 relative">
          <div className="absolute top-1/2 left-0 right-0 h-px bg-slate-200 dark:bg-slate-600 z-10"></div>
          <span className="bg-slate-50 dark:bg-slate-800 px-3 py-1 rounded-2xl text-xs text-slate-500 dark:text-slate-400 font-medium z-20 relative border border-slate-200 dark:border-slate-600">
            {formatTimestamp(message.timestamp)}
          </span>
        </div>
      )}
      
      <div className={`flex items-start gap-3 ${isOwn ? 'flex-row-reverse' : ''}`}>
        {!isOwn && (
          <div className="flex-shrink-0 w-8 h-8">
            {showAvatar ? (
              <div 
                className="w-8 h-8 rounded-full flex items-center justify-center text-white font-semibold text-sm md:w-7 md:h-7 md:text-xs"
                style={{ backgroundColor: getRoleColor(message.senderRole) }}
              >
                {message.senderName.charAt(0).toUpperCase()}
              </div>
            ) : (
              <div className="w-8 h-8 flex-shrink-0"></div>
            )}
          </div>
        )}
        
        <div className={`max-w-[70%] min-w-0 md:max-w-[85%] sm:max-w-[90%] ${isOwn ? 'flex flex-col items-end' : ''}`}>
          {!isOwn && showAvatar && (
            <div className="mb-1 pl-3">
              <span className="text-xs text-slate-500 dark:text-slate-400 font-medium flex items-center gap-1">
                <span 
                  className="text-[0.625rem] font-bold uppercase tracking-wider"
                  style={{ color: getRoleColor(message.senderRole) }}
                >
                  {getRoleLabel(message.senderRole)}
                </span>
                {message.senderName}
              </span>
            </div>
          )}
          
          <div className={`px-4 py-3 md:px-3.5 md:py-2.5 rounded-[1.125rem] relative break-words hyphens-auto transition-opacity duration-200 ${
            isOwn 
              ? 'bg-blue-500 text-white rounded-br-1.5' 
              : 'bg-slate-100 dark:bg-slate-600 text-slate-800 dark:text-slate-100 rounded-bl-1.5'
          }`}>
            <div className="leading-[1.4] text-sm md:text-[0.8125rem] mb-1 max-w-full whitespace-pre-wrap">
              {message.content}
            </div>
            
            <div className="flex items-center justify-between gap-2 mt-1 opacity-100">
              <span className="text-[0.625rem] opacity-70 font-medium">
                {formatTimestamp(message.timestamp)}
              </span>
              
              {isOwn && (
                <div className="flex items-center gap-0.5 ml-2">
                  {getDeliveryStatusIcon()}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MessageItem;