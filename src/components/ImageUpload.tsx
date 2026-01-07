import React, { useState, useCallback } from 'react';
import { Upload, X, Image as ImageIcon, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface ImageUploadProps {
  productId: string;
  onUploadComplete: (imageUrl: string, imageId: string) => void;
  onImageRemove?: (imageId: string) => void;
  existingImages?: Array<{
    id: string;
    url: string;
    alt_text?: string;
    is_primary?: boolean;
  }>;
}

const ImageUpload: React.FC<ImageUploadProps> = ({
  productId,
  onUploadComplete,
  onImageRemove,
  existingImages = []
}) => {
  const [isUploading, setIsUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const { toast } = useToast();

  const handleUpload = async (file: File) => {
    if (!file) return;

    // Validar tipo de arquivo
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      toast({
        title: 'Erro',
        description: 'Tipo de arquivo não permitido. Use: JPEG, PNG, WebP',
        variant: 'destructive'
      });
      return;
    }

    // Validar tamanho (5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: 'Erro',
        description: 'Arquivo muito grande. Máximo: 5MB',
        variant: 'destructive'
      });
      return;
    }

    setIsUploading(true);

    const formData = new FormData();
    formData.append('image', file);
    formData.append('alt_text', file.name);
    formData.append('is_primary', existingImages.length === 0 ? 'true' : 'false');

    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/storage/products/${productId}/images/upload`, {
        method: 'POST',
        body: formData,
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Erro ao fazer upload');
      }

      toast({
        title: 'Sucesso',
        description: 'Imagem enviada com sucesso!'
      });

      onUploadComplete(data.url, data.data.id);

    } catch (error) {
      console.error('Erro no upload:', error);
      toast({
        title: 'Erro',
        description: error instanceof Error ? error.message : 'Erro ao fazer upload da imagem',
        variant: 'destructive'
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleUpload(e.dataTransfer.files[0]);
    }
  }, []);

  const handleRemoveImage = async (imageId: string) => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/storage/images/${imageId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (!response.ok) {
        throw new Error('Erro ao excluir imagem');
      }

      toast({
        title: 'Sucesso',
        description: 'Imagem excluída com sucesso!'
      });

      onImageRemove?.(imageId);

    } catch (error) {
      console.error('Erro ao excluir:', error);
      toast({
        title: 'Erro',
        description: 'Erro ao excluir imagem',
        variant: 'destructive'
      });
    }
  };

  return (
    <div className="space-y-4">
      {/* Área de upload */}
      <div
        className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
          dragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300'
        } ${isUploading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        {isUploading ? (
          <div className="flex flex-col items-center justify-center">
            <Loader2 className="w-8 h-8 text-blue-500 animate-spin mb-2" />
            <p className="text-sm text-gray-600">Enviando imagem...</p>
          </div>
        ) : (
          <>
            <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
            <p className="text-sm text-gray-600 mb-2">
              Arraste e solte uma imagem aqui, ou
            </p>
            <label className="cursor-pointer">
              <span className="text-blue-500 hover:text-blue-600 text-sm font-medium">
                clique para selecionar
              </span>
              <input
                type="file"
                className="hidden"
                accept="image/jpeg,image/jpg,image/png,image/webp"
                onChange={(e) => e.target.files?.[0] && handleUpload(e.target.files[0])}
              />
            </label>
            <p className="text-xs text-gray-500 mt-2">
              JPEG, PNG, WebP • Máx. 5MB
            </p>
          </>
        )}
      </div>

      {/* Preview das imagens existentes */}
      {existingImages.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {existingImages.map((image) => (
            <div key={image.id} className="relative group">
              <div className="aspect-square rounded-lg overflow-hidden bg-gray-100">
                {image.url ? (
                  <img
                    src={image.url}
                    alt={image.alt_text || 'Imagem do produto'}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <ImageIcon className="w-8 h-8 text-gray-400" />
                  </div>
                )}
              </div>
              
              {image.is_primary && (
                <div className="absolute top-2 left-2 bg-blue-500 text-white text-xs px-2 py-1 rounded">
                  Principal
                </div>
              )}
              
              <button
                onClick={() => handleRemoveImage(image.id)}
                className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ImageUpload;