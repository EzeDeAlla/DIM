import { useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';
import apiClient from '../../../api/axios.config';
import { Contact, ContactFilter } from '../types';
import { useAuthStore } from '../../../store/auth.store';

const fetchAllContacts = async (currentUserId?: string) => {
  // Obtener TODOS los contactos sin filtros del backend
  const { data } = await apiClient.get<{ success: boolean; data: Contact[] }>('/users');
  
  // Filtrar el usuario actual de la lista de contactos
  const contacts = data.success ? data.data : [];
  return currentUserId 
    ? contacts.filter((contact: Contact) => contact.id !== currentUserId)
    : contacts;
};

const filterContactsClientSide = (contacts: Contact[], filter: ContactFilter): Contact[] => {
  let filteredContacts = contacts;

  // Filtro por tipo de usuario
  if (filter.userType !== 'ALL') {
    const targetUserType = filter.userType === 'DOCTOR' ? 'doctor' : 'admin';
    filteredContacts = filteredContacts.filter(contact => 
      contact.user_type === targetUserType || 
      (targetUserType === 'admin' && contact.user_type === 'administrador')
    );
  }

  // Filtro por búsqueda de texto
  if (filter.searchTerm) {
    const searchLower = filter.searchTerm.toLowerCase();
    filteredContacts = filteredContacts.filter(contact =>
      contact.first_name.toLowerCase().includes(searchLower) ||
      contact.last_name.toLowerCase().includes(searchLower) ||
      contact.email.toLowerCase().includes(searchLower) ||
      (contact.specialty && contact.specialty.toLowerCase().includes(searchLower))
    );
  }

  // Filtro por usuarios en línea
  if (filter.showOnlineOnly) {
    filteredContacts = filteredContacts.filter(contact => contact.is_online);
  }

  return filteredContacts;
};

export const useContacts = (filter: ContactFilter) => {
  const { user } = useAuthStore();
  
  const { data: allContacts, ...queryResult } = useQuery({
    queryKey: ['all-contacts', user?.id],
    queryFn: () => fetchAllContacts(user?.id),
    staleTime: 60000, // 1 minuto - más tiempo ya que filtramos en cliente
    refetchOnWindowFocus: false,
  });

  // Filtrar en el cliente usando useMemo para optimizar
  const filteredContacts = useMemo(() => {
    if (!allContacts) return [];
    return filterContactsClientSide(allContacts, filter);
  }, [allContacts, filter]);

  return {
    ...queryResult,
    data: filteredContacts
  };
};