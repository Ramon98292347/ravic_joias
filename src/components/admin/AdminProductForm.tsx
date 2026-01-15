import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import AdminLayout from './AdminLayout';
import { fetchCategories, fetchCollections } from '@/services/publicData';
import { adminData } from '@/services/adminData';
import ImageUpload from '@/components/ImageUpload';

interface ProductForm {
  name: string;
  description: string;
  category_id: string;
  collection_id?: string;
  material: string;
  price: string;
  promotional_price?: string;
  stock: string;
  tags: string[];
  is_active: boolean;
  is_featured: boolean;
  is_new: boolean;
  images: File[];
}

const AdminProductForm: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isEditing = !!id;
  const adminProductFormDebugEnabled = !!import.meta.env.DEV;

  const adminProductFormLog = (level: "debug" | "info" | "warn" | "error", message: string, data?: unknown) => {
    if (!adminProductFormDebugEnabled) return;
    const prefix = "[AdminProductForm]";
    if (data === undefined) {
      console[level](`${prefix} ${message}`);
      return;
    }
    console[level](`${prefix} ${message}`, data);
  };

  const [formData, setFormData] = useState<ProductForm>({
    name: '',
    description: '',
    category_id: '',
    collection_id: '',
    material: '',
    price: '',
    promotional_price: '',
    stock: '',
    tags: [],
    is_active: true,
    is_featured: false,
    is_new: false,
    images: [],
  });

  const [categories, setCategories] = useState<any[]>([]);
  const [collections, setCollections] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [tagInput, setTagInput] = useState('');
  const [existingImages, setExistingImages] = useState<any[]>([]);
  const [successMessage, setSuccessMessage] = useState('');
  const collectionSlug = collections.find((c) => c.id === formData.collection_id)?.slug || '';

  useEffect(() => {
    loadCategories();
    loadCollections();
    if (isEditing) {
      loadProduct();
    }
  }, [id]);

  const loadCategories = async () => {
    try {
      const response = await fetchCategories({ includeInactive: true });
      setCategories(response || []);
    } catch (error) {
      console.error('Erro ao carregar categorias:', error);
    }
  };

  const loadCollections = async () => {
    try {
      const response = await fetchCollections({ includeInactive: true });
      setCollections(response || []);
    } catch (error) {
      console.error('Erro ao carregar coleções:', error);
    }
  };

  const loadProduct = async () => {
    try {
      setLoading(true);
      const product = await adminData.getProduct(id!);
      const { data: imgs } = await (await import('@/lib/supabase')).supabase
        .from('imagens_do_produto')
        .select('id,url,alt_text,is_primary,sort_order')
        .eq('product_id', id!);
      setExistingImages((imgs as any) || []);
      
      setFormData({
        name: product.name,
        description: product.description,
        category_id: product.category_id,
        collection_id: product.collection_id || '',
        material: product.material,
        price: product.price.toString(),
        promotional_price: product.promotional_price?.toString() || '',
        stock: product.stock.toString(),
        tags: product.tags || [],
        is_active: product.is_active,
        is_featured: product.is_featured,
        is_new: product.is_new,
        images: [],
      });
    } catch (error) {
      console.error('Erro ao carregar produto:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;
    
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleTagAdd = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && tagInput.trim()) {
      e.preventDefault();
      if (!formData.tags.includes(tagInput.trim())) {
        setFormData(prev => ({
          ...prev,
          tags: [...prev.tags, tagInput.trim()],
        }));
      }
      setTagInput('');
    }
  };

  const handleTagRemove = (tagToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove),
    }));
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setFormData(prev => ({
      ...prev,
      images: [...prev.images, ...files],
    }));
  };

  const handleImageRemove = (index: number) => {
    setFormData(prev => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index),
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const opId = `${Date.now()}-${Math.random().toString(16).slice(2)}`;
      const productPayload = {
        name: formData.name,
        description: formData.description,
        category_id: formData.category_id,
        collection_id: formData.collection_id || null,
        material: formData.material,
        price: parseFloat(formData.price),
        promotional_price: formData.promotional_price ? parseFloat(formData.promotional_price) : null,
        stock: parseInt(formData.stock),
        tags: formData.tags || [],
        is_active: formData.is_active,
        is_featured: formData.is_featured,
        is_new: formData.is_new,
      };

      adminProductFormLog("info", "salvar:start", {
        opId,
        isEditing,
        id: isEditing ? id : null,
        hasImages: formData.images.length > 0,
        imagesCount: formData.images.length,
        category_id: formData.category_id,
        collection_id: formData.collection_id || null,
      });

      const upsertPendingLog = window.setTimeout(() => {
        adminProductFormLog("warn", "salvar:upsert:pendente", { opId, waitedMs: 15000 });
      }, 15000);
      let newId: string;
      try {
        newId = await adminData.upsertProduct(isEditing ? id! : null, productPayload);
      } finally {
        window.clearTimeout(upsertPendingLog);
      }
      adminProductFormLog("info", "salvar:upsert:ok", { opId, productId: isEditing ? id : newId });

      // Upload/Substituição de imagens (se houver arquivos anexados)
      if (formData.images.length > 0) {
        const bucket = import.meta.env.VITE_STORAGE_BUCKET || 'product-images';
        const productId = (isEditing ? id! : (newId as string));
        adminProductFormLog("info", "salvar:imagens:start", {
          opId,
          productId,
          bucket,
          count: formData.images.length,
        });

        if (isEditing) {
          const deletePendingLog = window.setTimeout(() => {
            adminProductFormLog("warn", "salvar:imagens:deleteAll:pendente", { opId, productId, waitedMs: 15000 });
          }, 15000);
          try {
            await adminData.deleteAllProductImagesByProduct(productId);
          } finally {
            window.clearTimeout(deletePendingLog);
          }
          adminProductFormLog("info", "salvar:imagens:deleteAll:ok", { opId, productId });
        }
        for (let i = 0; i < formData.images.length; i++) {
          const file = formData.images[i];
          const folder = (collections.find((c) => c.id === formData.collection_id)?.slug) || `products/${productId}`;
          const path = `${folder}/${Date.now()}-${file.name}`;
          adminProductFormLog("debug", "salvar:imagens:arquivo", {
            opId,
            productId,
            index: i,
            fileName: file.name,
            fileSize: file.size,
            fileType: file.type,
            path,
          });

          const uploadPendingLog = window.setTimeout(() => {
            adminProductFormLog("warn", "salvar:imagens:upload:pendente", { opId, productId, waitedMs: 15000, path });
          }, 15000);
          let uploaded: { publicUrl: string; storagePath: string };
          try {
            uploaded = await adminData.uploadToStorage(bucket, path, file);
          } finally {
            window.clearTimeout(uploadPendingLog);
          }
          const { publicUrl, storagePath } = uploaded;

          const addPendingLog = window.setTimeout(() => {
            adminProductFormLog("warn", "salvar:imagens:add:pendente", { opId, productId, waitedMs: 15000 });
          }, 15000);
          try {
            await adminData.addProductImage(productId, {
              url: publicUrl,
              alt_text: file.name,
              is_primary: i === 0,
              sort_order: i,
              bucket_name: bucket,
              storage_path: storagePath,
            });
          } finally {
            window.clearTimeout(addPendingLog);
          }
          adminProductFormLog("debug", "salvar:imagens:add:ok", { opId, productId, index: i, storagePath });
        }
        adminProductFormLog("info", "salvar:imagens:ok", { opId, productId });
      }

      // Mostrar mensagem de sucesso e recarregar a página
      const message = isEditing ? 'Produto atualizado com sucesso!' : 'Produto criado com sucesso!';
      setSuccessMessage(message);
      
      // Aguardar um momento para a mensagem ser vista e então navegar
      setTimeout(() => {
        navigate('/admin/products');
      }, 800);
      
    } catch (error) {
      console.error('[AdminProductForm] Erro ao salvar produto:', error);
      alert('Erro ao salvar produto. Tente novamente.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <AdminLayout title={isEditing ? 'Editar Produto' : 'Novo Produto'}>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-400"></div>
        </div>
      </AdminLayout>
    );
  }

  return (
      <AdminLayout title={isEditing ? 'Editar Produto' : 'Novo Produto'}>
        <div className="max-w-4xl mx-auto max-h-[80vh] overflow-y-auto pr-2">
          {/* Mensagem de sucesso */}
          {successMessage && (
            <div className="mb-4 p-4 bg-green-600 border border-green-500 rounded-lg text-white">
            {successMessage}
          </div>
          )}
          {!isEditing && (
            <div className="mb-4">
              <div className="flex items-center gap-3">
                <input
                  id="top-image-upload"
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleImageUpload}
                  className="hidden"
                />
                <label
                  htmlFor="top-image-upload"
                  className="inline-flex items-center px-4 py-2 rounded-lg bg-amber-400 text-slate-900 font-medium hover:bg-amber-500 cursor-pointer"
                >
                  Selecionar Fotos
                </label>
                {formData.images.length > 0 && (
                  <span className="text-sm text-slate-300 truncate max-w-[60%]">
                    {formData.images.map((f) => f.name).join(', ')}
                  </span>
                )}
              </div>
            </div>
          )}
          <div className="mb-4">
            {isEditing ? (
              (() => {
                const primary = existingImages?.find((img: any) => img?.is_primary) || existingImages?.[0];
                return primary?.url ? (
                <div className="w-full aspect-square rounded-lg border border-slate-700 overflow-hidden">
                  <img src={primary.url} alt="Imagem do produto" className="w-full h-full object-cover" />
                </div>
              ) : null;
            })()
          ) : (
            formData.images.length > 0 ? (
              <div className="w-full aspect-square rounded-lg border border-slate-700 overflow-hidden">
                <img src={URL.createObjectURL(formData.images[0])} alt="Pré-visualização" className="w-full h-full object-cover" />
              </div>
            ) : null
          )}
        </div>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information */}
          <div className="bg-slate-800 rounded-lg p-6 border border-slate-700">
            <h3 className="text-lg font-semibold text-white mb-4">Informações Básicas</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Nome do Produto *</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  required
                  className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-amber-400"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Categoria *</label>
                <select
                  name="category_id"
                  value={formData.category_id}
                  onChange={handleInputChange}
                  required
                  className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-amber-400"
                >
                  <option value="">Selecione uma categoria</option>
                  {categories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="mt-4">
              <label className="block text-sm font-medium text-slate-300 mb-2">Descrição</label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                rows={4}
                className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-amber-400"
                placeholder="Descrição detalhada do produto..."
              />
            </div>
          </div>

          {/* Pricing and Stock */}
          <div className="bg-slate-800 rounded-lg p-6 border border-slate-700">
            <h3 className="text-lg font-semibold text-white mb-4">Preço e Estoque</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Preço *</label>
                <input
                  type="number"
                  name="price"
                  value={formData.price}
                  onChange={handleInputChange}
                  required
                  step="0.01"
                  min="0"
                  className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-amber-400"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Preço Promocional</label>
                <input
                  type="number"
                  name="promotional_price"
                  value={formData.promotional_price}
                  onChange={handleInputChange}
                  step="0.01"
                  min="0"
                  className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-amber-400"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Estoque *</label>
                <input
                  type="number"
                  name="stock"
                  value={formData.stock}
                  onChange={handleInputChange}
                  required
                  min="0"
                  className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-amber-400"
                />
              </div>
            </div>
          </div>

          {/* Additional Information */}
          <div className="bg-slate-800 rounded-lg p-6 border border-slate-700">
            <h3 className="text-lg font-semibold text-white mb-4">Informações Adicionais</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Coleção</label>
                <select
                  name="collection_id"
                  value={formData.collection_id}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-amber-400"
                >
                  <option value="">Selecione uma coleção</option>
                  {collections.map((collection) => (
                    <option key={collection.id} value={collection.id}>
                      {collection.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Material</label>
                <input
                  type="text"
                  name="material"
                  value={formData.material}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-amber-400"
                  placeholder="Ex: Ouro, Prata, Aço"
                />
              </div>
            </div>

            <div className="mt-4">
              <label className="block text-sm font-medium text-slate-300 mb-2">Tags</label>
              <div className="flex flex-wrap gap-2 mb-2">
                {formData.tags.map((tag) => (
                  <span
                    key={tag}
                    className="inline-flex items-center px-2 py-1 bg-amber-400/20 text-amber-400 rounded-full text-sm"
                  >
                    {tag}
                    <button
                      type="button"
                      onClick={() => handleTagRemove(tag)}
                      className="ml-1 text-amber-400 hover:text-amber-300"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
              <input
                type="text"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={handleTagAdd}
                className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-amber-400"
                placeholder="Digite uma tag e pressione Enter"
              />
            </div>
          </div>

          {/* Settings */}
          <div className="bg-slate-800 rounded-lg p-6 border border-slate-700">
            <h3 className="text-lg font-semibold text-white mb-4">Configurações</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  name="is_active"
                  checked={formData.is_active}
                  onChange={handleInputChange}
                  className="rounded border-slate-600 text-amber-400 focus:ring-amber-400"
                />
                <span className="text-slate-300">Produto Ativo</span>
              </label>

              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  name="is_featured"
                  checked={formData.is_featured}
                  onChange={handleInputChange}
                  className="rounded border-slate-600 text-amber-400 focus:ring-amber-400"
                />
                <span className="text-slate-300">Produto em Destaque</span>
              </label>

              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  name="is_new"
                  checked={formData.is_new}
                  onChange={handleInputChange}
                  className="rounded border-slate-600 text-amber-400 focus:ring-amber-400"
                />
                <span className="text-slate-300">Novidade</span>
              </label>
            </div>
          </div>

          {/* Images */}
          <div className="bg-slate-800 rounded-lg p-6 border border-slate-700">
            <h3 className="text-lg font-semibold text-white mb-4">Imagens do Produto</h3>
            {isEditing ? (
              <ImageUpload
                productId={id!}
                existingImages={existingImages}
                onUploadComplete={() => loadProduct()}
                onImageRemove={() => loadProduct()}
                folderPrefix={collectionSlug}
              />
            ) : (
              <div>
                <input id="bottom-image-upload" type="file" accept="image/*" multiple onChange={handleImageUpload} className="hidden" />
                <label htmlFor="bottom-image-upload" className="inline-flex items-center px-4 py-2 rounded-lg bg-amber-400 text-slate-900 font-medium hover:bg-amber-500 cursor-pointer">
                  Selecionar Fotos
                </label>
                {formData.images.length > 0 && (
                  <div className="mt-4 grid grid-cols-2 md:grid-cols-3 gap-3">
                    {formData.images.map((file, idx) => (
                      <div key={idx} className="relative">
                        <img src={URL.createObjectURL(file)} alt={file.name} className="w-full h-32 object-cover rounded-md border border-slate-700" />
                        <button
                          type="button"
                          onClick={() => handleImageRemove(idx)}
                          className="absolute top-2 right-2 px-2 py-1 text-xs bg-slate-900/80 text-white rounded"
                        >
                          Remover
                        </button>
                      </div>
                    ))}
                  </div>
                )}
                <p className="text-xs text-slate-400 mt-2">As imagens selecionadas serão enviadas após criar o produto.</p>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex justify-end space-x-4">
            <button
              type="button"
              onClick={() => navigate('/admin/products')}
              className="px-6 py-2 border border-slate-600 text-slate-300 rounded-lg hover:bg-slate-700 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-6 py-2 bg-amber-400 hover:bg-amber-500 text-slate-900 font-medium rounded-lg transition-colors disabled:opacity-50"
            >
              {submitting ? 'Salvando...' : (isEditing ? 'Atualizar Produto' : 'Criar Produto')}
            </button>
          </div>
        </form>
      </div>
    </AdminLayout>
  );
};

export default AdminProductForm;
