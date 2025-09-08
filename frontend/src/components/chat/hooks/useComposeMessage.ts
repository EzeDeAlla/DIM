import { useForm } from 'react-hook-form';
import { useCallback, useRef, useEffect } from 'react';
import { MessageFormData } from '../schema';
import { useAxiosMutation } from '../../../hooks/useAxiosQuery';

interface UseComposeMessageOptions {
  /** ID de la conversación */
  conversationId: string;
  /** Callback cuando se envía un mensaje exitosamente */
  onMessageSent?: (message: any) => void;
  /** Callback cuando ocurre un error */
  onError?: (error: any) => void;
  /** Si debe limpiar el formulario después de enviar */
  clearOnSend?: boolean;
  /** Placeholder para el textarea */
  placeholder?: string;
  /** Máximo de caracteres permitidos */
  maxLength?: number;
}

interface UseComposeMessageReturn {
  /** Instancia de react-hook-form */
  form: any;
  /** Ref para el textarea */
  textareaRef: React.RefObject<HTMLTextAreaElement | null>;
  /** Si está enviando el mensaje */
  isSending: boolean;
  /** Error de envío */
  sendError: any;
  /** Función para enviar el mensaje */
  sendMessage: (data: MessageFormData) => Promise<void>;
  /** Función para manejar el envío del formulario */
  handleSubmit: (e?: React.FormEvent) => void;
  /** Función para manejar teclas especiales (Enter, Ctrl+Enter) */
  handleKeyDown: (e: React.KeyboardEvent<HTMLTextAreaElement>) => void;
  /** Función para insertar texto en la posición del cursor */
  insertText: (text: string) => void;
  /** Función para enfocar el textarea */
  focusTextarea: () => void;
  /** Contador de caracteres actual */
  characterCount: number;
  /** Si se excede el límite de caracteres */
  isOverLimit: boolean;
  
}

/**
 * Hook para manejar la composición y envío de mensajes
 */
export const useComposeMessage = ({
  conversationId,
  onMessageSent,
  onError,
  clearOnSend = true,
  // placeholder = 'Escribe un mensaje...', // Comentado: no se usa
  maxLength = 2000
}: UseComposeMessageOptions): UseComposeMessageReturn => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Configurar react-hook-form
  const form = useForm({
    defaultValues: {
      content: '',
      conversationId,
      attachments: []
    },
    mode: 'onChange'
  });

  const { watch, setValue, handleSubmit: formHandleSubmit, reset } = form;
  const content = watch('content');
  const characterCount = content?.length || 0;
  const isOverLimit = characterCount > maxLength;

  // Mutation para enviar mensaje
  const {
    mutateAsync: sendMessageMutation,
    isPending: isSending,
    error: sendError
  } = useAxiosMutation({
    mutationFn: async (data: MessageFormData) => {
      const response = await fetch('/api/messages/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
      });
      
      if (!response.ok) {
        throw new Error('Error al enviar mensaje');
      }
      
      return response.json();
    },
    onSuccess: (data) => {
      if (clearOnSend) {
        reset();
        setValue('conversationId', conversationId);
      }
      onMessageSent?.(data);
    },
    onError: (error) => {
      console.error('Error sending message:', error);
      onError?.(error);
    }
  });

  // Función para enviar mensaje
  const sendMessage = useCallback(async (data: MessageFormData) => {
    if (!data.content.trim() || isOverLimit) {
      return;
    }
    
    try {
      await sendMessageMutation({
        ...data,
        content: data.content.trim(),
        conversationId
      });
    } catch (error) {
      console.error('Error in sendMessage:', error);
    }
  }, [sendMessageMutation, conversationId, isOverLimit, onError]);

  // Manejar envío del formulario
  const handleSubmit = useCallback((e?: React.FormEvent) => {
    e?.preventDefault();
    formHandleSubmit((data) => {
      // Validación manual básica
      if (!data.content?.trim()) return;
      sendMessage(data as MessageFormData);
    })();
  }, [formHandleSubmit, sendMessage]);

  // Manejar teclas especiales
  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter') {
      if (e.ctrlKey || e.metaKey) {
        // Ctrl+Enter o Cmd+Enter: insertar salto de línea
        e.preventDefault();
        const textarea = e.currentTarget;
        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;
        const currentValue = textarea.value;
        const newValue = currentValue.substring(0, start) + '\n' + currentValue.substring(end);
        
        setValue('content', newValue);
        
        // Restaurar posición del cursor después del salto de línea
        setTimeout(() => {
          textarea.selectionStart = textarea.selectionEnd = start + 1;
        }, 0);
      } else {
        // Enter solo: enviar mensaje
        e.preventDefault();
        if (!isSending && content.trim() && !isOverLimit) {
          handleSubmit();
        }
      }
    }
  }, [setValue, isSending, content, isOverLimit, handleSubmit]);

  // Función para insertar texto en la posición del cursor
  const insertText = useCallback((text: string) => {
    if (!textareaRef.current) return;
    
    const textarea = textareaRef.current;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const currentValue = content || '';
    const newValue = currentValue.substring(0, start) + text + currentValue.substring(end);
    
    setValue('content', newValue);
    
    // Restaurar posición del cursor después del texto insertado
    setTimeout(() => {
      textarea.selectionStart = textarea.selectionEnd = start + text.length;
      textarea.focus();
    }, 0);
  }, [content, setValue]);

  // Función para enfocar el textarea
  const focusTextarea = useCallback(() => {
    textareaRef.current?.focus();
  }, []);

  // Auto-resize del textarea
  useEffect(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const adjustHeight = () => {
      textarea.style.height = 'auto';
      const maxHeight = 120; // Máximo 5 líneas aproximadamente
      const newHeight = Math.min(textarea.scrollHeight, maxHeight);
      textarea.style.height = `${newHeight}px`;
    };

    adjustHeight();
  }, [content]);

  // Actualizar conversationId cuando cambie
  useEffect(() => {
    setValue('conversationId', conversationId);
  }, [conversationId, setValue]);

  return {
    form,
    textareaRef,
    isSending,
    sendError,
    sendMessage,
    handleSubmit,
    handleKeyDown,
    insertText,
    focusTextarea,
    characterCount,
    isOverLimit
  };
};

/**
 * Hook simplificado para casos básicos
 */
export const useSimpleComposeMessage = (conversationId: string) => {
  return useComposeMessage({
    conversationId,
    placeholder: 'Escribe un mensaje...',
    clearOnSend: true
  });
};