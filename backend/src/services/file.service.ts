import { injectable } from 'inversify';
import * as fs from 'fs/promises';
import * as path from 'path';
import { v4 as uuidv4 } from 'uuid';

@injectable()
export class FileService {
  private readonly uploadsDir = path.join(process.cwd(), 'uploads', 'avatars');
  private readonly baseUrl = process.env.BASE_URL || 'http://localhost:3001';

  constructor() {
    this.ensureUploadsDirectory();
  }

  private async ensureUploadsDirectory(): Promise<void> {
    try {
      await fs.access(this.uploadsDir);
    } catch {
      await fs.mkdir(this.uploadsDir, { recursive: true });
    }
  }

  async saveBase64Image(base64Data: string): Promise<string> {
    try {
      // Validar imagen antes de procesarla
      if (!this.validateBase64Image(base64Data)) {
        throw new Error('Solo se permiten imágenes JPG, PNG o WebP menores a 5MB');
      }

      // Extraer el tipo MIME y los datos base64
      const matches = base64Data.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
      if (!matches || matches.length !== 3) {
        throw new Error('Formato de base64 inválido');
      }

      const mimeType = matches[1];
      const imageData = matches[2];

      // Validar tipo MIME
      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
      if (!allowedTypes.includes(mimeType)) {
        throw new Error('Solo se permiten imágenes JPG, PNG o WebP menores a 5MB');
      }

      // Generar nombre único para el archivo
      const extension = this.getExtensionFromMimeType(mimeType);
      const filename = `${uuidv4()}.${extension}`;
      const filepath = path.join(this.uploadsDir, filename);

      // Convertir base64 a buffer y guardar archivo
      const buffer = Buffer.from(imageData, 'base64');
      await fs.writeFile(filepath, buffer);

      // Retornar URL pública
      return `${this.baseUrl}/uploads/avatars/${filename}`;
    } catch (error) {
      throw new Error(`Error al guardar imagen: ${error instanceof Error ? error.message : 'Error desconocido'}`);
    }
  }

  async deleteImage(imageUrl: string): Promise<void> {
    try {
      // Extraer nombre del archivo de la URL
      const filename = path.basename(imageUrl);
      const filepath = path.join(this.uploadsDir, filename);

      // Verificar si el archivo existe y eliminarlo
      try {
        await fs.access(filepath);
        await fs.unlink(filepath);
      } catch {
        // El archivo no existe, no hacer nada
      }
    } catch (error) {
      console.error('Error al eliminar imagen:', error);
      // No lanzar error para no interrumpir el flujo principal
    }
  }

  private validateBase64Image(base64Data: string): boolean {
    // Verificar que sea una imagen válida (JPG, PNG, WebP)
    const imageRegex = /^data:image\/(jpeg|jpg|png|webp);base64,/;
    if (!imageRegex.test(base64Data)) {
      return false;
    }

    // Verificar tamaño (máximo 5MB)
    const base64String = base64Data.split(',')[1];
    const sizeInBytes = (base64String.length * 3) / 4;
    const maxSizeInBytes = 5 * 1024 * 1024; // 5MB
    
    return sizeInBytes <= maxSizeInBytes;
  }

  private getExtensionFromMimeType(mimeType: string): string {
    const extensions: Record<string, string> = {
      'image/jpeg': 'jpg',
      'image/jpg': 'jpg',
      'image/png': 'png',
      'image/webp': 'webp'
    };

    return extensions[mimeType] || 'jpg';
  }

  isValidImageUrl(url: string): boolean {
    try {
      const parsedUrl = new URL(url);
      return parsedUrl.pathname.includes('/uploads/avatars/');
    } catch {
      return false;
    }
  }
}