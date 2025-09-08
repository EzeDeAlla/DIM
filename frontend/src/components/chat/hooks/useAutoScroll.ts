import { useRef, useEffect, useCallback, useState } from 'react';

interface UseAutoScrollOptions {
  /** Threshold en píxeles para considerar que el usuario está "cerca del final" */
  threshold?: number;
  /** Comportamiento del scroll ('smooth' | 'instant' | 'auto') */
  behavior?: ScrollBehavior;
  /** Si debe hacer scroll automático al montar el componente */
  scrollOnMount?: boolean;
  /** Callback cuando el estado de auto-scroll cambia */
  onAutoScrollChange?: (isAutoScrolling: boolean) => void;
}

interface UseAutoScrollReturn {
  /** Ref para el contenedor de mensajes */
  messagesContainerRef: React.RefObject<HTMLDivElement | null>;
  /** Ref para el elemento al final de los mensajes */
  messagesEndRef: React.RefObject<HTMLDivElement | null>;
  /** Si está habilitado el scroll automático */
  isAutoScrollEnabled: boolean;
  /** Función para hacer scroll al final manualmente */
  scrollToBottom: (forceBehavior?: ScrollBehavior) => void;
  /** Función para habilitar/deshabilitar auto-scroll */
  setAutoScrollEnabled: (enabled: boolean) => void;
  /** Si el usuario está cerca del final */
  isNearBottom: boolean;
  /** Función para manejar el evento de scroll */
  handleScroll: () => void;
}

/**
 * Hook para manejar scroll automático en contenedores de mensajes
 * Scrollea automáticamente cuando:
 * - Se inserta un mensaje nuevo (optimista o recibido)
 * - Cambia la conversación
 * - Se re-monta la lista (paginación)
 * 
 * @param dependencies - Array de dependencias que triggean el auto-scroll
 * @param options - Opciones de configuración
 * @returns Objeto con refs, estados y funciones para manejar el scroll
 */
export const useAutoScroll = (
  dependencies: any[] = [],
  options: UseAutoScrollOptions = {}
): UseAutoScrollReturn => {
  const {
    threshold = 100,
    behavior = 'smooth',
    scrollOnMount = true,
    onAutoScrollChange
  } = options;

  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [isAutoScrollEnabled, setIsAutoScrollEnabledState] = useState(true);
  const [isNearBottom, setIsNearBottom] = useState(true);
  const lastScrollTop = useRef(0);
  const isScrollingProgrammatically = useRef(false);

  // Función para hacer scroll al final
  const scrollToBottom = useCallback((forceBehavior?: ScrollBehavior) => {
    if (!messagesEndRef.current) return;

    isScrollingProgrammatically.current = true;
    
    try {
      messagesEndRef.current.scrollIntoView({ 
        behavior: forceBehavior || behavior,
        block: 'end'
      });
    } catch (error) {
      // Fallback para navegadores que no soportan scrollIntoView con opciones
      if (messagesContainerRef.current) {
        messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
      }
    }

    // Reset flag después de un breve delay
    setTimeout(() => {
      isScrollingProgrammatically.current = false;
    }, 100);
  }, [behavior]);

  // Función para verificar si está cerca del final
  const checkIfNearBottom = useCallback(() => {
    if (!messagesContainerRef.current) return false;

    const { scrollTop, scrollHeight, clientHeight } = messagesContainerRef.current;
    const distanceFromBottom = scrollHeight - scrollTop - clientHeight;
    const nearBottom = distanceFromBottom <= threshold;
    
    setIsNearBottom(nearBottom);
    return nearBottom;
  }, [threshold]);

  // Manejar evento de scroll
  const handleScroll = useCallback(() => {
    if (!messagesContainerRef.current || isScrollingProgrammatically.current) {
      return;
    }

    const container = messagesContainerRef.current;
    const currentScrollTop = container.scrollTop;
    const isScrollingUp = currentScrollTop < lastScrollTop.current;
    
    lastScrollTop.current = currentScrollTop;

    // Verificar si está cerca del final
    const nearBottom = checkIfNearBottom();

    // Si el usuario scrollea hacia arriba manualmente, deshabilitar auto-scroll
    if (isScrollingUp && !nearBottom && isAutoScrollEnabled) {
      setIsAutoScrollEnabledState(false);
      onAutoScrollChange?.(false);
    }
    // Si el usuario scrollea cerca del final, habilitar auto-scroll
    else if (nearBottom && !isAutoScrollEnabled) {
      setIsAutoScrollEnabledState(true);
      onAutoScrollChange?.(true);
    }
  }, [isAutoScrollEnabled, checkIfNearBottom, onAutoScrollChange]);

  // Función para cambiar el estado de auto-scroll
  const setAutoScrollEnabled = useCallback((enabled: boolean) => {
    setIsAutoScrollEnabledState(enabled);
    onAutoScrollChange?.(enabled);
    
    if (enabled) {
      // Si se habilita, hacer scroll inmediatamente
      scrollToBottom('auto');
    }
  }, [scrollToBottom, onAutoScrollChange]);

  // Effect para scroll automático cuando cambian las dependencias
  useEffect(() => {
    if (isAutoScrollEnabled && dependencies.length > 0) {
      // Pequeño delay para asegurar que el DOM se haya actualizado
      const timeoutId = setTimeout(() => {
        scrollToBottom();
      }, 50);

      return () => clearTimeout(timeoutId);
    }
  }, [...dependencies, isAutoScrollEnabled]);

  // Effect para scroll inicial al montar
  useEffect(() => {
    if (scrollOnMount) {
      const timeoutId = setTimeout(() => {
        scrollToBottom('auto');
      }, 100);

      return () => clearTimeout(timeoutId);
    }
  }, [scrollOnMount, scrollToBottom]);

  // Effect para agregar/remover listener de scroll
  useEffect(() => {
    const container = messagesContainerRef.current;
    if (!container) return;

    // Throttle del evento scroll para mejor performance
    let ticking = false;
    const throttledHandleScroll = () => {
      if (!ticking) {
        requestAnimationFrame(() => {
          handleScroll();
          ticking = false;
        });
        ticking = true;
      }
    };

    container.addEventListener('scroll', throttledHandleScroll, { passive: true });
    
    // Verificar estado inicial
    checkIfNearBottom();

    return () => {
      container.removeEventListener('scroll', throttledHandleScroll);
    };
  }, [handleScroll, checkIfNearBottom]);

  return {
    messagesContainerRef,
    messagesEndRef,
    isAutoScrollEnabled,
    scrollToBottom,
    setAutoScrollEnabled,
    isNearBottom,
    handleScroll
  };
};

/**
 * Hook simplificado para casos de uso básicos
 */
export const useSimpleAutoScroll = (messages: any[] = []) => {
  return useAutoScroll([messages?.length], {
    threshold: 50,
    behavior: 'smooth'
  });
};