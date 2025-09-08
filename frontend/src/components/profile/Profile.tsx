import React, { useState, useRef } from 'react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Label } from '../ui/label';
import { Camera, User, Edit3, Stethoscope, Save, X } from 'lucide-react';
import { useAuthStore } from '../../store/auth.store';
import { useUpdateAvatar, useUpdateProfile } from '../../hooks/useUsersApi';
import { toast } from 'react-hot-toast';


interface ProfileProps {}

const Profile: React.FC<ProfileProps> = () => {
  const { user, setUser } = useAuthStore();
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    full_name: user ? `${user.first_name} ${user.last_name}` : '',
    bio: user?.description || '',
    specialty: user?.specialty || '',
    avatar_url: user?.avatar_url || ''
  });
  const fileInputRef = useRef<HTMLInputElement>(null);
  const updateAvatarMutation = useUpdateAvatar();
  
  // Log del estado de la mutación
  console.log('🔍 [FRONTEND] Estado de updateAvatarMutation:', {
    isPending: updateAvatarMutation.isPending,
    isError: updateAvatarMutation.isError,
    error: updateAvatarMutation.error,
    isSuccess: updateAvatarMutation.isSuccess
  });
  const updateProfileMutation = useUpdateProfile();

  const handleSave = async () => {
    if (!user) return;

    try {
      // Separar nombre completo en first_name y last_name
      const nameParts = formData.full_name.trim().split(' ');
      const first_name = nameParts[0] || '';
      const last_name = nameParts.slice(1).join(' ') || '';

      const profileData = {
        first_name,
        last_name,
        description: formData.bio,
        specialty: formData.specialty
      };

      const updatedUser = await updateProfileMutation.mutateAsync(profileData);

      // Actualizar el store de auth con los datos actualizados
      if (updatedUser) {
        setUser({
          ...user,
          first_name: updatedUser.first_name,
          last_name: updatedUser.last_name,
          description: updatedUser.description,
          specialty: updatedUser.specialty
        });
      }

      toast.success('Perfil actualizado correctamente');
      setIsEditing(false);
    } catch (error) {
      console.error('Error al actualizar perfil:', error);
      toast.error('Error al actualizar el perfil');
    }
  };

  const handleCancel = () => {
    setFormData({
      full_name: user ? `${user.first_name} ${user.last_name}` : '',
      bio: user?.description || '',
      specialty: user?.specialty || '',
      avatar_url: user?.avatar_url || ''
    });
    setIsEditing(false);
  };

  const handleAvatarChange = () => {
    console.log('🎯 [DEBUG] handleAvatarChange ejecutado');
    console.log('📎 [DEBUG] fileInputRef.current:', fileInputRef.current);
    fileInputRef.current?.click();
    console.log('✅ [DEBUG] click() ejecutado en input file');
  };

  const convertToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = error => reject(error);
    });
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    console.log('🎯 [DEBUG] handleFileChange ejecutado');
    const file = event.target.files?.[0];
    console.log('📁 [DEBUG] Archivo seleccionado:', file);
    if (!file) {
      console.log('❌ [DEBUG] No hay archivo seleccionado');
      return;
    }

    // Validaciones mejoradas
    const maxSize = 5 * 1024 * 1024; // 5MB
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    const allowedExtensions = ['.jpg', '.jpeg', '.png', '.webp'];

    console.log('🔍 [DEBUG] Validando archivo:', {
      name: file.name,
      size: file.size,
      type: file.type,
      maxSize,
      allowedTypes,
      allowedExtensions
    });

    // Validar tamaño
    if (file.size > maxSize) {
      console.log('❌ [DEBUG] Archivo muy grande:', file.size);
      toast.error(`La imagen debe ser menor a 5MB. Tamaño actual: ${(file.size / (1024 * 1024)).toFixed(2)}MB`);
      return;
    }

    // Validar tipo MIME
    if (!allowedTypes.includes(file.type)) {
      console.log('❌ [DEBUG] Tipo MIME no válido:', file.type);
      toast.error('Solo se permiten archivos JPG, PNG o WebP');
      return;
    }

    // Validar extensión del archivo
    const fileExtension = file.name.toLowerCase().substring(file.name.lastIndexOf('.'));
    if (!allowedExtensions.includes(fileExtension)) {
      console.log('❌ [DEBUG] Extensión no válida:', fileExtension);
      toast.error('Extensión de archivo no válida. Use: .jpg, .jpeg, .png o .webp');
      return;
    }

    console.log('✅ [DEBUG] Validaciones pasadas, creando imagen para validar dimensiones');

    // Validar dimensiones mínimas (opcional)
    const img = new Image();
    const objectUrl = URL.createObjectURL(file);
    console.log('🖼️ [DEBUG] Creando imagen para validar dimensiones, objectUrl:', objectUrl);
    
    img.onload = async () => {
      console.log('✅ [DEBUG] Imagen cargada exitosamente, dimensiones:', { width: img.width, height: img.height });
      URL.revokeObjectURL(objectUrl);
      
      // Validar dimensiones mínimas
      if (img.width < 100 || img.height < 100) {
        console.log('❌ [DEBUG] Dimensiones muy pequeñas:', { width: img.width, height: img.height });
        toast.error('La imagen debe tener al menos 100x100 píxeles');
        return;
      }

      // Validar dimensiones máximas
      if (img.width > 2048 || img.height > 2048) {
        console.log('❌ [DEBUG] Dimensiones muy grandes:', { width: img.width, height: img.height });
        toast.error('La imagen no debe superar 2048x2048 píxeles');
        return;
      }

      // Validar tamaño del archivo (máximo 5MB)
      const maxSizeInBytes = 5 * 1024 * 1024; // 5MB
      if (file.size > maxSizeInBytes) {
        console.log('❌ [DEBUG] Archivo demasiado grande:', file.size, 'bytes');
        toast.error('La imagen es demasiado grande. Por favor, selecciona una imagen menor a 5MB');
        return;
      }

      console.log('✅ [DEBUG] Validaciones de dimensiones y tamaño pasadas, iniciando conversión a base64');

      try {
        console.log('🔄 Iniciando proceso de actualización de avatar');
        const base64 = await convertToBase64(file);
        console.log('✅ Imagen convertida a base64, tamaño:', base64.length);
        
        // Actualizar preview local inmediatamente
        setFormData(prev => ({ ...prev, avatar_url: base64 }));
        console.log('✅ Preview local actualizado');
        
        // Enviar al servidor
        console.log('📤 Enviando imagen al servidor...');
        console.log('🔧 [FRONTEND] Llamando a mutateAsync con:', { avatar_url: base64.substring(0, 50) + '...' });
        const updatedUser = await updateAvatarMutation.mutateAsync({ avatar_url: base64 });
        console.log('✅ [FRONTEND] mutateAsync completado exitosamente');
        console.log('✅ Respuesta del servidor:', updatedUser);
        
        // Actualizar el store de auth con el usuario actualizado
        if (updatedUser && user) {
          console.log('✅ Actualizando store de auth con nueva URL:', updatedUser.avatar_url);
          setUser({ ...user, avatar_url: updatedUser.avatar_url });
        }
        
        toast.success('Foto de perfil actualizada correctamente');
      } catch (error) {
        console.error('❌ Error al actualizar avatar:', error);
        toast.error('Error al actualizar la foto de perfil');
        // Revertir preview en caso de error
        setFormData(prev => ({ ...prev, avatar_url: user?.avatar_url || '' }));
      }
    };

    img.onerror = (error) => {
      console.log('❌ [DEBUG] Error al cargar imagen:', error);
      URL.revokeObjectURL(objectUrl);
      toast.error('El archivo seleccionado no es una imagen válida');
    };

    console.log('🔗 [DEBUG] Asignando src a la imagen:', objectUrl);
    img.src = objectUrl;
    
    // Limpiar el input para permitir seleccionar el mismo archivo nuevamente
    event.target.value = '';
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6 pb-16">
      {/* Header */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Mi Perfil</h1>
            <p className="text-gray-600">Gestiona tu información personal y profesional</p>
          </div>
          <div className="flex items-center gap-3">
            {!isEditing ? (
              <Button onClick={() => setIsEditing(true)} className="bg-teal-600 hover:bg-teal-700">
                <Edit3 className="h-4 w-4 mr-2" />
                Editar Perfil
              </Button>
            ) : (
              <div className="flex gap-2">
                <Button onClick={handleSave} className="bg-teal-600 hover:bg-teal-700">
                  <Save className="h-4 w-4 mr-2" />
                  Guardar
                </Button>
                <Button onClick={handleCancel} variant="outline">
                  <X className="h-4 w-4 mr-2" />
                  Cancelar
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Foto de Perfil */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Camera className="h-5 w-5 text-teal-600" />
            Foto de Perfil
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-6">
            <div className="relative">
              <Avatar className="h-24 w-24 ring-4 ring-gray-100">
                 <AvatarImage src={formData.avatar_url} alt={formData.full_name} />
                 <AvatarFallback className="bg-teal-100 text-teal-700 text-xl font-medium">
                   {formData.full_name.split(' ').map((n: string) => n[0]).join('')}
                 </AvatarFallback>
               </Avatar>
              <Button
                size="sm"
                className="absolute -bottom-2 -right-2 rounded-full h-8 w-8 p-0 bg-teal-600 hover:bg-teal-700"
                onClick={handleAvatarChange}
                disabled={updateAvatarMutation.isPending}
              >
                <Camera className="h-4 w-4" />
              </Button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/jpg,image/png,image/webp"
                onChange={handleFileChange}
                className="hidden"
              />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 mb-1">{formData.full_name || 'Sin nombre'}</h3>
              <p className="text-sm text-gray-500 mb-2">{user?.email}</p>
              <p className="text-sm text-gray-600">{formData.specialty || 'Sin especialidad'}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Información Personal */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5 text-teal-600" />
            Información Personal
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="full_name">Nombre Completo</Label>
              {isEditing ? (
                <Input
                  id="full_name"
                  value={formData.full_name}
                  onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                  placeholder="Ingresa tu nombre completo"
                />
              ) : (
                <div className="p-3 bg-gray-50 rounded-md border">
                  {formData.full_name || 'No especificado'}
                </div>
              )}
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="email">Correo Electrónico</Label>
              <div className="p-3 bg-gray-50 rounded-md border text-gray-500">
                {user?.email || 'No especificado'}
              </div>
              <p className="text-xs text-gray-500">El correo no se puede modificar</p>
            </div>
          </div>

          <div className="space-y-2">
             <Label htmlFor="bio">Descripción / Bio</Label>
             {isEditing ? (
               <textarea
                 id="bio"
                 value={formData.bio}
                 onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setFormData({ ...formData, bio: e.target.value })}
                 placeholder="Cuéntanos sobre ti, tu experiencia y tus intereses profesionales..."
                 rows={4}
                 className="w-full p-3 border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
               />
             ) : (
               <div className="p-3 bg-gray-50 rounded-md border min-h-[100px]">
                 {formData.bio || 'No hay descripción disponible'}
               </div>
             )}
           </div>
        </CardContent>
      </Card>

      {/* Información Profesional */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Stethoscope className="h-5 w-5 text-teal-600" />
            Información Profesional
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-8 pb-8">
          <div className="max-w-md">
            <div className="space-y-2">
              <Label htmlFor="specialty">Especialidad Médica</Label>
              {isEditing ? (
                <Input
                  id="specialty"
                  value={formData.specialty}
                  onChange={(e) => setFormData({ ...formData, specialty: e.target.value })}
                  placeholder="Ej: Cardiología, Pediatría, Medicina General..."
                />
              ) : (
                <div className="p-3 bg-gray-50 rounded-md border">
                  {formData.specialty || 'No especificado'}
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Profile;