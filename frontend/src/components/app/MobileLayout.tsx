import React, { useEffect, useMemo, useState, useCallback } from "react";
import { useLocation, useSearchParams } from "react-router-dom";
import {
  MessageSquare, Search, Send, Smile, Paperclip, Phone, Video, Info,
  ChevronDown, ChevronLeft, User2, Plus, Settings, LogOut, Bell,
  Users, Stethoscope, Shield, Wifi, Camera, Edit3, Save, X, WifiOff, Clock
} from "lucide-react";

import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "../../components/ui/avatar";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { Label } from "../../components/ui/label";
import { Badge } from "../../components/ui/badge";
import { toast } from "react-hot-toast";

import { useAuthStore } from "../../store/auth.store";
import { useConversations } from "../../hooks/useConversations";
import { useMessages } from "../../hooks/useMessages";
import { useChatSocket } from "../chat/hooks/useChatSocket";
import { useAutoScroll } from "../chat/hooks/useAutoScroll";
import { MessageItem } from "../chat/MessageItem";

import { useContacts } from "../contacts/hooks/useContacts";
import { useStartConversation } from "../contacts/hooks/useStartConversation"; // <- usar el mismo hook que Contacts
import { useUpdateProfile } from "../../hooks/useUsersApi";
import { ContactFilter, Contact } from "../contacts/types";
import { useQueryClient } from '@tanstack/react-query';

type TabKey = "chats" | "search" | "profile";

const MobileLayout: React.FC = () => {
  // ------ State ------
  const [activeTab, setActiveTab] = useState<TabKey>("chats");
  const [selectedChat, setSelectedChat] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [query, setQuery] = useState("");
  const [creatingChatId, setCreatingChatId] = useState<string | null>(null);

  // Profile state
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    full_name: "",
    bio: "",
    specialty: "",
    avatar_url: ""
  });

  // Contacts state
  const [contactFilter, setContactFilter] = useState<ContactFilter>({
    userType: "ALL",
    searchTerm: "",
    showOnlineOnly: false
  });

  const { user, token, logout, setUser } = useAuthStore();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const queryClient = useQueryClient();

  // ------ Data ------
  const { data: conversationsData, isLoading: conversationsLoading, error: conversationsError } = useConversations();
  const conversations = conversationsData?.conversations || [];

  const { data: messagesData, isLoading: messagesLoading } = useMessages(selectedChat || "", 1, 50);
  const messages = messagesData?.messages || [];

  // Contacts data
  const { data: contacts, isLoading: contactsLoading, error: contactsError } = useContacts(contactFilter);
  const startConversationMutation = useStartConversation(); // <- mismo hook que Contacts

  // Profile data
  const updateProfileMutation = useUpdateProfile();

  // ------ Socket ------
  const {
    socket,
    isConnected,
    joinConversation,
    leaveConversation,
    sendMessage: socketSendMessage,
    ackDelivered,
    markRead
  } = useChatSocket();

  // ------ Auto-scroll ------
  const {
    messagesContainerRef,
    messagesEndRef,
    isAutoScrollEnabled,
    setAutoScrollEnabled,
    scrollToBottom,
    handleScroll
  } = useAutoScroll([messages], { threshold: 50 });

  // ------ Helpers ------
  const getConversationById = (id: string) => conversations.find((c: any) => c.id === id);

  // Espera simple para que el backend procese la conversación
  const waitForBackendProcessing = async (timeoutMs = 1000) => {
    await new Promise(r => setTimeout(r, timeoutMs));
    await queryClient.invalidateQueries({ queryKey: ['conversations'] });
  };

  const filteredConversations = useMemo(() => {
    if (!query.trim()) return conversations;
    const q = query.toLowerCase();
    return conversations.filter((c: any) => {
      const name = (c.display_name || c.name || "").toLowerCase();
      return name.includes(q);
    });
  }, [conversations, query]);

  // Contact stats
  const contactStats = useMemo(() => {
    if (!contacts) return { total: 0, online: 0, doctors: 0, admins: 0 };

    return {
      total: contacts.length,
      online: contacts.filter((c: Contact) => c.is_online).length,
      doctors: contacts.filter((c: Contact) => c.user_type === "doctor").length,
      admins: contacts.filter((c: Contact) => c.user_type === "admin" || c.user_type === "administrador").length
    };
  }, [contacts]);

  // Initialize profile form data
  useEffect(() => {
    if (user) {
      setFormData({
        full_name: `${user.first_name} ${user.last_name}`,
        bio: user.description || "",
        specialty: user.specialty || "",
        avatar_url: user.avatar_url || ""
      });
    }
  }, [user]);

  // ------ Deep-link / state navigation (igual a Desktop) ------
  useEffect(() => {
    const conversationParam = searchParams.get("conversation");
    const stateConversationId = (location.state as any)?.selectedConversationId;
    the_loop: {
      const autoSelect = (location.state as any)?.autoSelectConversation;

      if (conversationParam) {
        if (conversations.length > 0) {
          const has = getConversationById(conversationParam);
          if (has) {
            setSelectedChat(conversationParam);
            setActiveTab("chats");
            window.history.replaceState({}, "", "/app");
          } else {
            setSelectedChat(conversationParam);
            setActiveTab("chats");
            window.history.replaceState({}, "", "/app");
          }
        } else if (!conversationsLoading) {
          setSelectedChat(conversationParam);
          setActiveTab("chats");
          window.history.replaceState({}, "", "/app");
        }
        break the_loop;
      }

      if (stateConversationId) {
        if (autoSelect) {
          setSelectedChat(stateConversationId);
          setActiveTab("chats");
          window.history.replaceState({}, "", "/app");
        } else if (conversations.length > 0) {
          const has = getConversationById(stateConversationId);
          if (has) {
            setSelectedChat(stateConversationId);
            setActiveTab("chats");
          }
        }
      }
    }
  }, [searchParams, location.state, conversations, conversationsLoading]);

  // ------ Join/Leave room al cambiar de conversación ------
  useEffect(() => {
    if (selectedChat && isConnected) {
      joinConversation(selectedChat);
      return () => {
        leaveConversation(selectedChat);
      };
    }
  }, [selectedChat, isConnected, joinConversation, leaveConversation]);

  // ------ Listeners (new/read) + auto-scroll ------
  useEffect(() => {
    if (!socket) return;

    const handleNewMessage = (msg: any) => {
      if (msg.sender_id !== user?.id) {
        ackDelivered(msg.id, msg.conversation_id);
      }
      if (isAutoScrollEnabled) {
        setTimeout(scrollToBottom, 80);
      }
    };

    const handleMessageRead = () => {
      // cache ya se actualiza en useChatSocket
    };

    socket.on("message:new", handleNewMessage);
    socket.on("message:read", handleMessageRead);
    return () => {
      socket.off("message:new", handleNewMessage);
      socket.off("message:read", handleMessageRead);
    };
  }, [socket, user?.id, ackDelivered, isAutoScrollEnabled, scrollToBottom]);

  // ------ Marcar como leídos al abrir / ver ------
  useEffect(() => {
    if (messages && user?.id && selectedChat) {
      const unread = messages.filter((m: any) => !m.is_read && m.sender_id !== user.id);
      if (unread.length > 0) {
        unread.forEach((m: any) => markRead(m.id, selectedChat));
      }
    }
  }, [messages, user?.id, selectedChat, markRead]);

  // ------ IntersectionObserver para marcar read en viewport ------
  useEffect(() => {
    if (!messages || !messagesContainerRef.current || !selectedChat) return;
    const rootEl = messagesContainerRef.current;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (!e.isIntersecting) return;
          const el = e.target as HTMLElement;
          const messageId = el.dataset.messageId;
          const senderId = el.dataset.senderId;
          if (messageId && senderId !== user?.id) {
            const m = messages.find((x: any) => x.id === messageId);
            if (m && !m.is_read) {
              markRead(messageId, selectedChat);
            }
          }
        });
      },
      { root: rootEl, rootMargin: "0px", threshold: 0.5 }
    );

    const els = rootEl.querySelectorAll("[data-message-id]");
    els.forEach((el) => {
      const senderId = (el as HTMLElement).dataset.senderId;
      if (senderId !== user?.id) observer.observe(el);
    });

    return () => observer.disconnect();
  }, [messages, user?.id, selectedChat, markRead, messagesContainerRef]);

  // ------ Enviar mensaje (optimista + ACK) ------
  const handleSendMessage = useCallback(async () => {
    if (!message.trim() || isSending || !isConnected || !selectedChat) return;

    const content = message.trim();
    setMessage("");
    setIsSending(true);

    try {
      await socketSendMessage(
        { conversation_id: selectedChat, content, message_type: "text" },
        { onOptimistic: () => setTimeout(scrollToBottom, 60) }
      );
    } catch (err: any) {
      console.error("❌ Error al enviar mensaje:", err);

      // evitar toast en 401/403 (igual que tu manejo en otros lugares)
      if (err?.response?.status === 403 ||
          err?.message?.includes("Access denied") ||
          err?.message?.includes("No tienes permisos") ||
          err?.message?.includes("Forbidden")) {
        // silencio
      } else if (err?.response?.status === 401) {
        // silencio
      } else {
        toast.error("Error al enviar. Reintentalo.");
      }

      setMessage(content);
    } finally {
      setIsSending(false);
    }
  }, [message, isSending, isConnected, selectedChat, socketSendMessage, scrollToBottom]);

  // ------ Contact handlers ------
  const getUserTypeLabel = (userType: string) => {
    switch (userType) {
      case "doctor":
        return "Doctor";
      case "admin":
      case "administrador":
        return "Administrador";
      default:
        return "Usuario";
    }
  };

  const handleStartChat = async (contact: Contact) => {
    try {
      if (!user?.id) throw new Error("Usuario no autenticado");
      setCreatingChatId(contact.id);

      // Igual que Contacts: solo el otro participante; el backend te agrega
      const res = await startConversationMutation.mutateAsync({
        participant_ids: [contact.id],
        title: `Conversación con ${contact.first_name} ${contact.last_name}`,
        description: `Conversación iniciada con ${getUserTypeLabel(contact.user_type)}`,
        created_by: user.id,
        is_group: false
      });

      const newId = (res as any)?.data?.id ?? (res as any)?.id;
      if (!newId) return;

      // Espera simple para que el backend procese la conversación
      await waitForBackendProcessing(1000);

      // Ahora abrir el chat
      setSelectedChat(newId);
      setActiveTab("chats");
      if (isConnected) {
        try { await joinConversation(newId); } catch { /* el effect hará retry */ }
      }
    } catch (error) {
      console.error("Error al iniciar conversación:", error);
    } finally {
      setCreatingChatId(null);
    }
  };

  // ------ Profile handlers ------
  const handleSaveProfile = async () => {
    if (!user) return;

    try {
      const nameParts = formData.full_name.trim().split(" ");
      const first_name = nameParts[0] || "";
      const last_name = nameParts.slice(1).join(" ") || "";

      const profileData = {
        first_name,
        last_name,
        description: formData.bio,
        specialty: formData.specialty
      };

      await updateProfileMutation.mutateAsync(profileData);

      // Update user in store
      setUser({
        ...user,
        first_name,
        last_name,
        description: formData.bio,
        specialty: formData.specialty
      });

      setIsEditing(false);
      toast.success("Perfil actualizado correctamente");
    } catch (error) {
      console.error("Error al actualizar perfil:", error);
      toast.error("Error al actualizar perfil");
    }
  };

  const convertToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = error => reject(error);
    });
  };

  const handleAvatarChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !user) return;

    try {
      // Validaciones de archivo
      const maxSize = 5 * 1024 * 1024; // 5MB
      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
      
      if (!allowedTypes.includes(file.type)) {
        toast.error("Solo se permiten imágenes JPG, PNG o WebP");
        return;
      }
      
      if (file.size > maxSize) {
        toast.error("La imagen debe ser menor a 5MB");
        return;
      }

      // Convertir a base64
      const base64 = await convertToBase64(file);
      
      // Enviar como JSON al endpoint PUT
      const response = await fetch("/api/users/avatar", {
        method: "PUT",
        headers: { 
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ avatar_url: base64 })
      });

      if (!response.ok) throw new Error("Error al subir avatar");

      const result = await response.json();
      setUser({ ...user, avatar_url: result.data.avatar_url });
      toast.success("Avatar actualizado correctamente");
    } catch (error) {
      console.error("Error al actualizar avatar:", error);
      toast.error("Error al actualizar avatar");
    }
  };

  // ------ UI blocks ------
  const HeaderChats = (
    <div className="px-4 py-3 border-b border-border/50 bg-card/60 backdrop-blur-md sticky top-0 z-10">
      <div className="flex items-center gap-3 mb-3">
        <div className="flex-1">
          <h1 className="text-lg font-semibold text-foreground">Mensajes</h1>
          <p className="text-xs text-muted-foreground">{isConnected ? "Conectado" : "Desconectado"}</p>
        </div>
        <Button size="icon" variant="ghost" className="rounded-full">
          <Plus className="h-5 w-5" />
        </Button>
        <Button size="icon" variant="ghost" className="rounded-full" onClick={() => setActiveTab("search")}>
          <Search className="h-5 w-5" />
        </Button>
      </div>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Buscar conversaciones..."
          className="pl-10 rounded-full bg-background/60 border-border/50 focus:border-primary/50"
        />
      </div>
    </div>
  );

  const HeaderChatDetail = selectedChat && (
    <div className="px-3 py-2 border-b border-border/50 bg-card/60 backdrop-blur-md sticky top-0 z-10">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            aria-label="Volver"
            className="p-2 rounded-full hover:bg-primary/10 active:scale-95 transition"
            onClick={() => setSelectedChat(null)}
          >
            <ChevronLeft className="h-5 w-5" />
          </button>

          <Avatar className="h-9 w-9">
            <AvatarImage src={getConversationById(selectedChat)?.participant_avatar || ""} />
            <AvatarFallback className="bg-primary/10 text-primary">
              {(getConversationById(selectedChat)?.display_name || getConversationById(selectedChat)?.name || "U")
                .split(" ")
                .map((n: string) => n[0])
                .join("")}
            </AvatarFallback>
          </Avatar>

          <div className="min-w-0">
            <h2 className="text-base font-semibold truncate">
              {getConversationById(selectedChat)?.display_name || getConversationById(selectedChat)?.name || "Sin nombre"}
            </h2>
            <p className="text-xs text-muted-foreground">
              {(() => {
                const c = getConversationById(selectedChat);
                if (!c) return "Sin estado";
                const other = c.participants?.find((p: any) => p.id !== user?.id);
                if (other) return other.isOnline ? "En línea" : "Desconectado";
                return isConnected ? "Conectado" : "Desconectado";
              })()}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1">
          <Button size="icon" variant="ghost" className="h-9 w-9 rounded-full">
            <Phone className="h-4 w-4" />
          </Button>
          <Button size="icon" variant="ghost" className="h-9 w-9 rounded-full">
            <Video className="h-4 w-4" />
          </Button>
          <Button size="icon" variant="ghost" className="h-9 w-9 rounded-full">
            <Info className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );

  const ChatsList = (
    <div className="flex-1 overflow-y-auto">
      {conversationsLoading ? (
        <div className="p-4 text-center text-muted-foreground">Cargando...</div>
      ) : conversationsError ? (
        <div className="p-4 text-center text-red-500">Error al cargar.</div>
      ) : filteredConversations.length === 0 ? (
        <div className="p-6 text-center text-muted-foreground">Sin conversaciones</div>
      ) : (
        filteredConversations.map((conversation: any) => {
          const unread = conversation.unreadCount ?? 0;
          return (
            <button
              key={conversation.id}
              onClick={() => {
                setSelectedChat(conversation.id);
                setActiveTab("chats");
              }}
              className={`w-full px-4 py-3 text-left border-b border-border/30 active:bg-primary/10 transition ${
                selectedChat === conversation.id ? "bg-primary/10" : "bg-transparent"
              }`}
            >
              <div className="flex items-start gap-3">
                <Avatar className="h-11 w-11">
                  <AvatarImage src={conversation.participant_avatar || ""} alt={conversation.display_name || conversation.name || "Usuario"} />
                  <AvatarFallback className="bg-primary/10 text-primary font-medium">
                    {(conversation.display_name || conversation.name || "U").split(" ").map((n: string) => n[0]).join("")}
                  </AvatarFallback>
                </Avatar>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <h3 className="font-medium truncate">{conversation.display_name || conversation.name || "Sin nombre"}</h3>
                    <span className="text-[11px] text-muted-foreground shrink-0">
                      {conversation.updated_at
                        ? new Date(conversation.updated_at).toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" })
                        : ""}
                    </span>
                  </div>
                  <div className="flex items-center justify-between mt-0.5">
                    <p className="text-xs text-muted-foreground truncate">Conversación</p>
                    {unread > 0 && (
                      <span className="ml-2 inline-flex items-center justify-center text-[10px] min-w-[18px] h-[18px] rounded-full bg-primary text-primary-foreground">
                        {unread}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </button>
          );
        })
      )}
    </div>
  );

  const ChatDetail = selectedChat && (
    <div className="h-full flex flex-col" style={{ height: "calc(100vh - 64px - 64px)" }}>
      {/* Messages Area - Scrollable */}
      <div
        className="flex-1 px-3 py-3 overflow-y-auto bg-gradient-to-b from-background to-muted/20"
        ref={messagesContainerRef as any}
        onScroll={handleScroll}
        aria-live="polite"
        style={{ minHeight: 0, maxHeight: "calc(100vh - 64px - 64px - 80px)", paddingBottom: "80px" }}
      >
        <div className="space-y-3 pb-4">
          {messagesLoading ? (
            <div className="flex justify-center items-center h-24">
              <p className="text-muted-foreground">Cargando mensajes…</p>
            </div>
          ) : messages.length === 0 ? (
            <div className="flex justify-center items-center h-24">
              <p className="text-muted-foreground">No hay mensajes</p>
            </div>
          ) : (
            messages.map((msg: any, i: number) => {
              const prev = i > 0 ? messages[i - 1] : null;
              const showAvatar = !prev || prev.sender_id !== msg.sender_id;
              const showTimestamp = !prev || new Date(msg.created_at).getTime() - new Date(prev.created_at).getTime() > 30 * 60 * 1000;

              const deliveryStatus = (() => {
                const hasBeenReadByOthers = msg.readBy && Object.keys(msg.readBy).some((uid) => uid !== msg.sender_id);
                if (hasBeenReadByOthers) return "read";
                if (msg.status === "delivered" || msg.delivered_at) return "delivered";
                return "sent";
              })();

  return (
                <div key={msg.id} className="message-wrapper" data-message-id={msg.id} data-sender-id={msg.sender_id}>
                  <MessageItem
                    message={{
                      id: msg.id,
                      content: msg.content,
                      senderId: msg.sender_id,
                      senderName: msg.sender_name || "Usuario",
                      senderRole: msg.sender_role || "patient",
                      timestamp: msg.created_at,
                      isRead: msg.is_read || false,
                      status: msg.status,
                      delivered_at: msg.delivered_at,
                      readBy: msg.readBy,
                      deliveryStatus
                    }}
                    showAvatar={showAvatar}
                    showTimestamp={showTimestamp}
                    isOwn={msg.sender_id === user?.id}
                  />
                </div>
              );
            })
          )}
          <div ref={messagesEndRef as any} />
          {!isAutoScrollEnabled && (
            <button
              className="fixed right-4 bottom-20 bg-primary text-primary-foreground rounded-full px-3 py-2 shadow-lg hover:bg-primary/90 active:scale-95 transition flex items-center gap-1 z-10"
              onClick={() => {
                setAutoScrollEnabled(true);
                scrollToBottom();
              }}
              aria-label="Ir al final"
            >
              <ChevronDown className="h-4 w-4" />
              <span className="text-xs">Nuevos</span>
            </button>
          )}
        </div>
      </div>

      {/* Message Input - Fixed at bottom, above navbar */}
      <div
        className="px-3 py-3 border-t border-border/50 bg-card/95 backdrop-blur-md flex-shrink-0"
        style={{ position: "fixed", bottom: "64px", left: 0, right: 0, zIndex: 60 }}
      >
        <div className="flex items-end gap-2">
          <div className="flex-1 min-w-0">
            <div className="relative">
              <Input
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Escribí tu mensaje…"
                className="pr-20 py-3 rounded-full bg-background/80 border-border/50 focus:border-primary/50 focus:ring-2 focus:ring-primary/20 w-full"
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleSendMessage();
                  }
                }}
                autoComplete="off"
                autoCorrect="off"
                autoCapitalize="off"
                spellCheck={false}
              />
              <div className="absolute right-1 top-1/2 -translate-y-1/2 flex items-center gap-1">
                <Button size="icon" variant="ghost" className="h-8 w-8 rounded-full hover:bg-primary/10">
                  <Paperclip className="h-4 w-4" />
                </Button>
                <Button size="icon" variant="ghost" className="h-8 w-8 rounded-full hover:bg-primary/10">
                  <Smile className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
          <Button
            size="icon"
            className="h-10 w-10 rounded-full shadow-sm flex-shrink-0"
            disabled={!message.trim() || isSending}
            onClick={handleSendMessage}
            title="Enviar"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );

  const SearchView = (
    <div className="flex-1 flex flex-col">
      <div className="px-4 py-3 border-b border-border/50 bg-card/60 backdrop-blur-md sticky top-0 z-10">
        <div className="relative mb-3">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={contactFilter.searchTerm}
            onChange={(e) => setContactFilter((prev) => ({ ...prev, searchTerm: e.target.value }))}
            placeholder="Buscar contactos…"
            className="pl-10 rounded-full bg-background/60 border-border/50 focus:border-primary/50"
          />
        </div>

        {/* Filter buttons */}
        <div className="flex gap-2 overflow-x-auto pb-2">
          <Button
            size="sm"
            variant={contactFilter.userType === "ALL" ? "default" : "outline"}
            onClick={() => setContactFilter((prev) => ({ ...prev, userType: "ALL" }))}
            className="text-xs whitespace-nowrap"
          >
            Todos ({contactStats.total})
          </Button>
          <Button
            size="sm"
            variant={contactFilter.userType === "DOCTOR" ? "default" : "outline"}
            onClick={() => setContactFilter((prev) => ({ ...prev, userType: "DOCTOR" }))}
            className="text-xs whitespace-nowrap"
          >
            <Stethoscope className="h-3 w-3 mr-1" />
            Doctores ({contactStats.doctors})
          </Button>
          <Button
            size="sm"
            variant={contactFilter.userType === "ADMIN" ? "default" : "outline"}
            onClick={() => setContactFilter((prev) => ({ ...prev, userType: "ADMIN" }))}
            className="text-xs whitespace-nowrap"
          >
            <Shield className="h-3 w-3 mr-1" />
            Admins ({contactStats.admins})
          </Button>
          <Button
            size="sm"
            variant={contactFilter.showOnlineOnly ? "default" : "outline"}
            onClick={() => setContactFilter((prev) => ({ ...prev, showOnlineOnly: !prev.showOnlineOnly }))}
            className="text-xs whitespace-nowrap"
          >
            <Wifi className="h-3 w-3 mr-1" />
            En línea ({contactStats.online})
          </Button>
        </div>
      </div>

      {/* Contacts List */}
      <div className="flex-1 overflow-y-auto p-4">
        {contactsLoading ? (
          <div className="flex justify-center items-center h-32">
            <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : contactsError ? (
          <div className="flex flex-col items-center justify-center h-32 gap-2">
            <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
              <Users className="h-6 w-6 text-red-500" />
            </div>
            <p className="text-red-500 text-sm text-center">Error al cargar contactos</p>
          </div>
        ) : !contacts || contacts.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-32 gap-2">
            <div className="w-12 h-12 bg-muted rounded-full flex items-center justify-center">
              <Users className="h-6 w-6 text-muted-foreground" />
            </div>
            <p className="text-muted-foreground text-sm text-center">No hay contactos</p>
          </div>
        ) : (
          <div className="space-y-3">
            {contacts.map((contact: Contact) => (
              <Card key={contact.id} className="p-4 hover:bg-primary/5 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <Avatar className="h-12 w-12">
                      <AvatarImage src={contact.avatar_url || ""} />
                      <AvatarFallback className="bg-primary/10 text-primary">
                        {contact.first_name?.charAt(0)}
                        {contact.last_name?.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    {contact.is_online ? (
                      <div className="absolute -bottom-1 -right-1 h-4 w-4 bg-green-500 rounded-full border-2 border-background flex items-center justify-center">
                        <Wifi className="h-2 w-2 text-white" />
                      </div>
                    ) : (
                      <div className="absolute -bottom-1 -right-1 h-4 w-4 bg-gray-400 rounded-full border-2 border-background flex items-center justify-center">
                        <WifiOff className="h-2 w-2 text-white" />
          </div>
        )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-medium truncate">
                        {contact.first_name} {contact.last_name}
                      </h3>
                      <Badge variant="secondary" className="text-xs">
                        {contact.user_type === "doctor" ? <Stethoscope className="h-3 w-3 mr-1" /> : <Shield className="h-3 w-3 mr-1" />}
                        {contact.user_type === "doctor" ? "Doctor" : contact.user_type === "admin" || contact.user_type === "administrador" ? "Administrador" : "Usuario"}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground truncate">{contact.email}</p>
                    {contact.specialty && <p className="text-xs text-muted-foreground truncate">{contact.specialty}</p>}
                    <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                      <Clock className="h-3 w-3" />
                      {contact.is_online ? <span className="text-green-600 font-medium">En línea</span> : <span>Últ. vez: {contact.last_online_at ? new Date(contact.last_online_at).toLocaleString() : "—"}</span>}
                    </div>
                  </div>

                  <Button
                    size="sm"
                    onClick={() => handleStartChat(contact)}
                    disabled={startConversationMutation.isPending || creatingChatId === contact.id}
                    className="flex-shrink-0"
                  >
                    <MessageSquare className="h-4 w-4 mr-1" />
                    {startConversationMutation.isPending && creatingChatId === contact.id ? "Iniciando..." : "Chat"}
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );

  const ProfileView = (
    <div className="flex-1 p-4 space-y-6">
      {/* Profile Header */}
      <div className="flex items-center gap-4">
        <div className="relative">
          <Avatar className="h-20 w-20 ring-4 ring-primary/20">
            <AvatarImage src={user?.avatar_url || ""} />
            <AvatarFallback className="bg-primary/10 text-primary text-xl font-semibold">
              {(user?.first_name || user?.email || "U").slice(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-green-500 rounded-full border-2 border-background flex items-center justify-center">
            <div className="w-2 h-2 bg-white rounded-full"></div>
          </div>
          {isEditing && (
            <Button
              size="icon"
              className="absolute -top-1 -right-1 h-8 w-8 rounded-full"
              onClick={() => document.getElementById("avatar-upload")?.click()}
            >
              <Camera className="h-4 w-4" />
            </Button>
          )}
        </div>
        <div className="flex-1">
          <h2 className="text-xl font-semibold">
            {user?.first_name} {user?.last_name}
          </h2>
          <p className="text-muted-foreground">{user?.email}</p>
          <div className="mt-1 px-2 py-1 bg-primary/10 text-primary rounded-full text-xs font-medium inline-block">
            {user?.user_type === "doctor" ? "👨‍⚕️ Doctor" : user?.user_type === "admin" || user?.user_type === "administrador" ? "👨‍💼 Administrador" : "👤 Usuario"}
          </div>
        </div>
        <Button size="sm" variant={isEditing ? "default" : "outline"} onClick={() => setIsEditing(!isEditing)}>
          {isEditing ? <X className="h-4 w-4" /> : <Edit3 className="h-4 w-4" />}
        </Button>
      </div>

      {/* Hidden file input for avatar */}
      <input id="avatar-upload" type="file" accept="image/*" onChange={handleAvatarChange} className="hidden" />

      {/* Profile Form */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Información Personal</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="full_name">Nombre completo</Label>
            <Input
              id="full_name"
              value={formData.full_name}
              onChange={(e) => setFormData((prev) => ({ ...prev, full_name: e.target.value }))}
              disabled={!isEditing}
              placeholder="Nombre completo"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="bio">Biografía</Label>
            <Input
              id="bio"
              value={formData.bio}
              onChange={(e) => setFormData((prev) => ({ ...prev, bio: e.target.value }))}
              disabled={!isEditing}
              placeholder="Cuéntanos sobre ti..."
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="specialty">Especialidad</Label>
            <Input
              id="specialty"
              value={formData.specialty}
              onChange={(e) => setFormData((prev) => ({ ...prev, specialty: e.target.value }))}
              disabled={!isEditing}
              placeholder="Especialidad médica"
            />
          </div>

          {isEditing && (
            <div className="flex gap-2 pt-4">
              <Button onClick={handleSaveProfile} disabled={updateProfileMutation.isPending} className="flex-1">
                <Save className="h-4 w-4 mr-2" />
                {updateProfileMutation.isPending ? "Guardando..." : "Guardar"}
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setIsEditing(false);
                  if (user) {
                    setFormData({
                      full_name: `${user.first_name} ${user.last_name}`,
                      bio: user.description || "",
                      specialty: user.specialty || "",
                      avatar_url: user.avatar_url || ""
                    });
                  }
                }}
                className="flex-1"
              >
                <X className="h-4 w-4 mr-2" />
                Cancelar
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Profile Info Cards */}
      <div className="space-y-3">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Estado de conexión</p>
                <p className="font-medium flex items-center gap-2">
                  <span className={`w-2 h-2 rounded-full ${isConnected ? "bg-green-500" : "bg-red-500"}`}></span>
                  {isConnected ? "Conectado" : "Desconectado"}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">ID de usuario</p>
                <p className="font-medium text-xs font-mono">{user?.id?.slice(0, 8)}...</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Action Buttons */}
      <div className="space-y-3">
        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Configuración</h3>

        <Button
          variant="ghost"
          className="w-full justify-start gap-3 h-12 hover:bg-primary/5 transition-colors"
          onClick={() => toast.success("Función de configuración próximamente")}
        >
          <Settings className="h-5 w-5 text-muted-foreground" />
          <span>Configuración</span>
        </Button>

        <Button
          variant="ghost"
          className="w-full justify-start gap-3 h-12 hover:bg-primary/5 transition-colors"
          onClick={() => toast.success("Función de notificaciones próximamente")}
        >
          <Bell className="h-5 w-5 text-muted-foreground" />
          <span>Notificaciones</span>
        </Button>

        <div className="pt-4 border-t border-border/50">
          <Button
            variant="ghost"
            className="w-full justify-start gap-3 h-12 text-red-500 hover:bg-red-500/10 transition-colors"
            onClick={async () => {
              try {
                await logout();
                toast.success("Sesión cerrada correctamente");
              } catch (error) {
                toast.error("Error al cerrar sesión");
              }
            }}
          >
            <LogOut className="h-5 w-5" />
            <span>Cerrar Sesión</span>
          </Button>
        </div>
      </div>
    </div>
  );

  // ------ Render principal (mobile app shell) ------
  const showChatDetail = activeTab === "chats" && selectedChat;

  return (
    <div className="fixed inset-0 bg-background text-foreground flex flex-col">
      {/* Top header */}
      {activeTab === "chats" ? (showChatDetail ? HeaderChatDetail : HeaderChats) : (
        <div className="px-4 py-3 border-b border-border/50 bg-card/60 backdrop-blur-md flex-shrink-0">
          <div className="flex items-center gap-3">
            {activeTab === "search" && <h1 className="text-lg font-semibold">Buscar</h1>}
            {activeTab === "profile" && <h1 className="text-lg font-semibold">Perfil</h1>}
          </div>
        </div>
      )}

      {/* Views - Scrollable content area */}
      <div className="flex-1 overflow-hidden" style={{ height: "calc(100vh - 64px - 64px)" }}>
        {activeTab === "chats" && !showChatDetail && <div className="h-full overflow-y-auto">{ChatsList}</div>}
        {activeTab === "chats" && showChatDetail && <div className="h-full flex flex-col">{ChatDetail}</div>}
        {activeTab === "search" && <div className="h-full overflow-y-auto">{SearchView}</div>}
        {activeTab === "profile" && <div className="h-full overflow-y-auto">{ProfileView}</div>}
      </div>

      {/* Bottom Nav - Fixed at bottom */}
      <nav
        className="h-16 border-t border-border/50 bg-card/95 backdrop-blur-md flex-shrink-0"
        style={{ position: "fixed", bottom: 0, left: 0, right: 0, zIndex: 50 }}
      >
        <div className="grid grid-cols-3 h-full">
          <button
            className={`flex flex-col items-center justify-center gap-1 text-xs transition-colors ${
              activeTab === "chats" ? "text-primary" : "text-muted-foreground hover:text-foreground"
            }`}
            onClick={() => setActiveTab("chats")}
          >
            <MessageSquare className="h-5 w-5" />
          Chats
        </button>
          <button
            className={`flex flex-col items-center justify-center gap-1 text-xs transition-colors ${
              activeTab === "search" ? "text-primary" : "text-muted-foreground hover:text-foreground"
            }`}
            onClick={() => setActiveTab("search")}
          >
            <Search className="h-5 w-5" />
            Buscar
          </button>
          <button
            className={`flex flex-col items-center justify-center gap-1 text-xs transition-colors ${
              activeTab === "profile" ? "text-primary" : "text-muted-foreground hover:text-foreground"
            }`}
            onClick={() => setActiveTab("profile")}
          >
            <User2 className="h-5 w-5" />
          Perfil
        </button>
      </div>
      </nav>
    </div>
  );
};

export default MobileLayout;
