// Utilidad para probar la autenticación desde la consola del navegador

export const testLogin = async () => {
  try {
    console.log('🔄 Iniciando test de login...');
    
    // Hacer login
    const response = await fetch('/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: 'doctor@medichat.com',
        password: 'Password123!'
      })
    });
    
    const data = await response.json();
    console.log('📥 Respuesta del login:', data);
    
    if (data.success) {
      // Guardar en localStorage como lo hace Zustand
      const authData = {
        state: {
          token: data.data.token,
          user: data.data.user,
          isAuthenticated: true
        },
        version: 0
      };
      
      localStorage.setItem('auth-storage', JSON.stringify(authData));
      console.log('✅ Token guardado en localStorage');
      
      // Probar petición autenticada
      const profileResponse = await fetch('/api/users/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${data.data.token}`
        },
        body: JSON.stringify({
          first_name: 'Test',
          last_name: 'Frontend',
          description: 'Prueba desde frontend'
        })
      });
      
      const profileData = await profileResponse.json();
      console.log('📝 Respuesta de actualización de perfil:', profileData);
      
      return { loginData: data, profileData };
    } else {
      console.error('❌ Error en login:', data);
      return { error: data };
    }
  } catch (error) {
    console.error('❌ Error en test:', error);
    return { error };
  }
};

// Función para verificar el estado actual
export const checkAuthState = () => {
  const stored = localStorage.getItem('auth-storage');
  console.log('📦 Estado en localStorage:', stored);
  
  if (stored) {
    try {
      const parsed = JSON.parse(stored);
      console.log('🔍 Estado parseado:', parsed);
      return parsed;
    } catch (error) {
      console.error('❌ Error parseando localStorage:', error);
      return null;
    }
  }
  
  return null;
};

// Exponer funciones globalmente para usar en la consola
if (typeof window !== 'undefined') {
  (window as any).testLogin = testLogin;
  (window as any).checkAuthState = checkAuthState;
}