import { useState, useMemo } from 'react';
import { useAxiosQuery } from '../../hooks/useAxiosQuery';
import { useRealtimeUpdates } from './hooks';
import { conversationsApi } from '../../api/conversations.api';
import './ConversationList.css';

interface Conversation {
  id: string;
  participants: Array<{
    id: string;
    name: string;
    avatar?: string;
    role: 'doctor' | 'nurse' | 'admin' | 'patient';
    isOnline?: boolean;
  }>;
  lastMessage?: {
    id: string;
    content: string;
    senderId: string;
    timestamp: string;
    isRead: boolean;
  };
  unreadCount: number;
  updatedAt: string;
}

interface ConversationListProps {
  selectedConversationId: string | null;
  onConversationSelect: (conversationId: string) => void;
}

export const ConversationList = ({
  selectedConversationId,
  onConversationSelect
}: ConversationListProps) => {
  const [searchTerm, setSearchTerm] = useState('');

  // Obtener conversaciones del backend
  const { 
    data: conversations = [], 
    isLoading, 
    error 
  } = useAxiosQuery<Conversation[]>({
    queryKey: ['conversations'],
    queryFn: () => conversationsApi.getConversations()
  });

  // Usar hook de actualizaciones en tiempo real
  useRealtimeUpdates();

  // Filtrar conversaciones por término de búsqueda
  const filteredConversations = useMemo(() => {
    if (!searchTerm.trim()) return conversations;
    
    return conversations.filter(conversation => {
      const participantNames = conversation.participants
        .map(p => p.name.toLowerCase())
        .join(' ');
      const lastMessageContent = conversation.lastMessage?.content.toLowerCase() || '';
      const search = searchTerm.toLowerCase();
      
      return participantNames.includes(search) || lastMessageContent.includes(search);
    });
  }, [conversations, searchTerm]);

  // Ordenar conversaciones por última actualización
  const sortedConversations = useMemo(() => {
    return [...filteredConversations].sort((a, b) => 
      new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
    );
  }, [filteredConversations]);

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);

    if (diffInHours < 1) {
      const minutes = Math.floor(diffInHours * 60);
      return minutes < 1 ? 'Ahora' : `${minutes}m`;
    } else if (diffInHours < 24) {
      return `${Math.floor(diffInHours)}h`;
    } else if (diffInHours < 48) {
      return 'Ayer';
    } else {
      return date.toLocaleDateString('es-ES', { 
        day: '2-digit', 
        month: '2-digit' 
      });
    }
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

  if (isLoading) {
    return (
      <div className="conversation-list">
        <div className="conversation-header">
          <h2>Conversaciones</h2>
        </div>
        <div className="conversation-loading">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="conversation-skeleton">
              <div className="skeleton-avatar"></div>
              <div className="skeleton-content">
                <div className="skeleton-line skeleton-name"></div>
                <div className="skeleton-line skeleton-message"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="conversation-list">
        <div className="conversation-header">
          <h2>Conversaciones</h2>
        </div>
        <div className="conversation-error">
          <p>Error al cargar conversaciones</p>
          <button onClick={() => window.location.reload()}>Reintentar</button>
        </div>
      </div>
    );
  }

  return (
    <div className="conversation-list">
      <div className="conversation-header">
        <h2>Conversaciones</h2>
        <div className="search-container">
          <svg className="search-icon" width="20" height="20" viewBox="0 0 24 24" fill="none">
            <circle cx="11" cy="11" r="8" stroke="currentColor" strokeWidth="2"/>
            <path d="m21 21-4.35-4.35" stroke="currentColor" strokeWidth="2"/>
          </svg>
          <input
            type="text"
            placeholder="Buscar conversaciones..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
        </div>
      </div>

      <div className="conversation-items">
        {sortedConversations.length === 0 ? (
          <div className="no-conversations">
            <p>No hay conversaciones</p>
          </div>
        ) : (
          sortedConversations.map((conversation) => {
            const otherParticipants = conversation.participants.filter(p => p.id !== 'current-user-id');
            const isSelected = conversation.id === selectedConversationId;
            
            return (
              <div
                key={conversation.id}
                className={`conversation-item ${isSelected ? 'selected' : ''}`}
                onClick={() => onConversationSelect(conversation.id)}
              >
                <div className="conversation-avatar">
                  {otherParticipants.length === 1 ? (
                    <div className="single-avatar">
                      {otherParticipants[0].avatar ? (
                        <img 
                          src={otherParticipants[0].avatar} 
                          alt={otherParticipants[0].name}
                          className="avatar-image"
                        />
                      ) : (
                        <div 
                          className="avatar-placeholder"
                          style={{ backgroundColor: getRoleColor(otherParticipants[0].role) }}
                        >
                          {otherParticipants[0].name.charAt(0).toUpperCase()}
                        </div>
                      )}
                      {otherParticipants[0].isOnline && (
                        <div className="online-indicator"></div>
                      )}
                    </div>
                  ) : (
                    <div className="group-avatar">
                      <div className="group-icon">👥</div>
                    </div>
                  )}
                </div>

                <div className="conversation-content">
                  <div className="conversation-header-row">
                    <div className="participant-info">
                      {otherParticipants.length === 1 ? (
                        <span className="participant-name">
                          <span className="role-label" style={{ color: getRoleColor(otherParticipants[0].role) }}>
                            {getRoleLabel(otherParticipants[0].role)}
                          </span>
                          {otherParticipants[0].name}
                        </span>
                      ) : (
                        <span className="participant-name">
                          Grupo ({otherParticipants.length + 1})
                        </span>
                      )}
                    </div>
                    <div className="conversation-meta">
                      {conversation.lastMessage && (
                        <span className="timestamp">
                          {formatTimestamp(conversation.lastMessage.timestamp)}
                        </span>
                      )}
                      {conversation.unreadCount > 0 && (
                        <div className="unread-badge">
                          {conversation.unreadCount > 99 ? '99+' : conversation.unreadCount}
                        </div>
                      )}
                    </div>
                  </div>

                  {conversation.lastMessage && (
                    <div className="last-message">
                      <span className={`message-preview ${!conversation.lastMessage.isRead ? 'unread' : ''}`}>
                        {conversation.lastMessage.content}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default ConversationList;