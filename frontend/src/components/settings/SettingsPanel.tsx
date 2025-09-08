import React, { useState } from 'react';
import { useSettings, useUpdateSetting } from '../../hooks/useSettings';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { AlertCircle, CheckCircle, Settings as SettingsIcon } from 'lucide-react';
import { AppSettings } from '../../types/settings.types';

export const SettingsPanel: React.FC = () => {
  const { data: settings, error, isLoading } = useSettings();
  const updateSetting = useUpdateSetting();
  const [isUpdating, setIsUpdating] = useState<string | null>(null);

  // Obtener el valor actual de los recibos de lectura
  const currentReadReceipts = (settings as AppSettings)?.read_receipts_enabled ?? false;

  const handleToggleReadReceipts = async (checked: boolean) => {
    // Validar que el valor sea realmente un boolean
    if (typeof checked !== 'boolean') {
      return;
    }
    
    setIsUpdating('read_receipts_enabled');
    try {
      await updateSetting.mutateAsync({
        key: 'read_receipts_enabled',
        value: checked
      });
    } catch (error) {
      console.error('Update failed:', error);
    } finally {
      setIsUpdating(null);
    }
  };


  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <p className="text-red-600">Error al cargar la configuración</p>
        </div>
      </div>
    );
  }

  if (!settings) return null;

  return (
    <div className="h-full flex flex-col">
      <div className="flex-shrink-0 p-6 border-b bg-white">
        <div className="flex items-center gap-3">
          <SettingsIcon className="h-8 w-8 text-blue-600" />
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Configuración del Sistema</h1>
            <p className="text-gray-600">Gestiona la configuración global de la aplicación</p>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6">
        <div className="max-w-2xl mx-auto space-y-6">
        {/* Read Receipts */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              Recibos de Lectura
              {isUpdating === 'read_receipts_enabled' && (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
              )}
            </CardTitle>
            <CardDescription>
              Controla si los usuarios pueden ver cuando sus mensajes han sido leídos
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div className="space-y-1">
                  <h3 className="font-medium text-gray-900">Estado actual</h3>
                  <p className="text-sm text-gray-500">
                    {currentReadReceipts ? 'Recibos de lectura habilitados' : 'Recibos de lectura deshabilitados'}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {isUpdating === 'read_receipts_enabled' && (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                  )}
                </div>
              </div>
              
              <div className="text-center space-y-2">
                <p className="text-sm text-gray-500">
                  Usa los botones para cambiar el estado de los recibos de lectura
                </p>
                <div className="flex gap-2 justify-center">
                  <button
                    onClick={() => handleToggleReadReceipts(true)}
                    className="px-4 py-2 text-sm bg-blue-100 text-blue-700 rounded hover:bg-blue-200 disabled:opacity-50"
                    disabled={isUpdating === 'read_receipts_enabled'}
                  >
                    True
                  </button>
                  <button
                    onClick={() => handleToggleReadReceipts(false)}
                    className="px-4 py-2 text-sm bg-gray-100 text-gray-700 rounded hover:bg-gray-200 disabled:opacity-50"
                    disabled={isUpdating === 'read_receipts_enabled'}
                  >
                    False
                  </button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Status */}
        <Card className="bg-green-50 border-green-200">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-green-700">
              <CheckCircle className="h-5 w-5" />
              <span className="font-medium">Configuración activa</span>
            </div>
            <p className="text-sm text-green-600 mt-1">
              Los cambios se aplican inmediatamente en toda la aplicación
            </p>
          </CardContent>
        </Card>
        </div>
      </div>
    </div>
  );
};
