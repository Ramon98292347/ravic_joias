import React, { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import AdminLayout from './AdminLayout';
import { fetchProducts, fetchCategories, fetchCollections } from '@/services/publicData';
import { adminData } from '@/services/adminData';
import OptimizedImage from '@/components/OptimizedImage';
import { useAuth } from '@/context/AuthProvider';

interface Product {
  id: string;
  name: string;
  price: number;
  promotional_price?: number;
  stock: number;
  is_active: boolean;
  is_featured: boolean;
  is_new: boolean;
  category?: { name: string };
  images?: { url: string; is_primary?: boolean | null }[];
}

const AdminProducts: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [collectionFilter, setCollectionFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [categories, setCategories] = useState<any[]>([]);
  const [collections, setCollections] = useState<any[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<any | null>(null);
  const [viewMode, setViewMode] = useState<'cards' | 'table'>('cards');
  const [formData, setFormData] = useState<any>({
    name: '',
    description: '',
    category_id: '',
    collection_id: '',
    material: '',
    price: '',
    promotional_price: '',
    stock: '',
    is_active: true,
    is_featured: false,
    is_new: false,
  });
  const [newImageFile, setNewImageFile] = useState<File | null>(null);
  const [currentImageInfo, setCurrentImageInfo] = useState<{ url?: string; storage_path?: string; bucket_name?: string } | null>(null);
  const adminProductsDebugEnabled = !!import.meta.env.DEV;
  const listAbortRef = useRef<AbortController | null>(null);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(50);
  const { authReady, session } = useAuth();
  const navigate = useNavigate();

  const adminProductsLog = (level: "debug" | "info" | "warn" | "error", message: string, data?: unknown) => {
    if (!adminProductsDebugEnabled) return;
    const prefix = "[AdminProducts]";
    if (data === undefined) {
      console[level](`${prefix} ${message}`);
      return;
    }
    console[level](`${prefix} ${message}`, data);
  };

  useEffect(() => {
    loadCategories();
    loadCollections();
    return () => {
      listAbortRef.current?.abort();
    };
  }, []);

  useEffect(() => {
    if (!authReady) return;
    if (!session) return;
    loadProducts();
  }, [authReady, session, searchTerm, categoryFilter, collectionFilter, statusFilter, page, limit]);

  const loadProducts = async () => {
    const opId = `${Date.now()}-${Math.random().toString(16).slice(2)}`;
    const params: any = {
      search: searchTerm || undefined,
      category: categoryFilter !== 'all' ? categoryFilter : undefined,
      collection: collectionFilter !== 'all' ? collectionFilter : undefined,
      featured: statusFilter === 'featured' ? true : undefined,
      isNew: statusFilter === 'new' ? true : undefined,
      active: statusFilter === 'active' ? true : statusFilter === 'inactive' ? false : undefined,
      includeInactive: true,
      page,
      limit,
    };
    try {
      setLoading(true);
      adminProductsLog("debug", "loadProducts:start", { opId, params });
      if (listAbortRef.current) {
        adminProductsLog("debug", "loadProducts:abort_previous", { opId });
        listAbortRef.current.abort();
      }
      listAbortRef.current = new AbortController();
      const pendingLog = window.setTimeout(() => {
        adminProductsLog("warn", "loadProducts:pendente", { opId, waitedMs: 15000, params });
      }, 15000);
      try {
        const { products } = await fetchProducts(params, { signal: listAbortRef.current.signal });
        setProducts(products || []);
        adminProductsLog("debug", "loadProducts:ok", { opId, count: (products || []).length });
      } finally {
        window.clearTimeout(pendingLog);
      }
    } catch (error) {
      console.error('Erro ao carregar produtos:', error);
      adminProductsLog("error", "loadProducts:error", { opId, error });
    } finally {
      setLoading(false);
    }
  };

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

  const handleDelete = async (id: string) => {
    if (!window.confirm('Tem certeza que deseja excluir este produto?')) return;
    try {
      setIsDeleting(id);
      setProducts((prev) => prev.filter((p) => p.id !== id));
      await adminData.deleteProduct(id);
      await loadProducts();
      navigate('/admin/products', { replace: true });
    } catch (e) {
      alert('Erro ao excluir produto');
    } finally {
      setIsDeleting(null);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const getPrimaryImage = (product: Product) => {
    const primary = product.images?.find((img) => img?.is_primary) || product.images?.[0];
    return primary?.url || '/placeholder.svg';
  };

  const openEditModal = async (product: Product) => {
    try {
      const [full, cats, cols] = await Promise.all([
        adminData.getProduct(product.id),
        categories.length ? Promise.resolve(categories) : fetchCategories({ includeInactive: true }),
        collections.length ? Promise.resolve(collections) : fetchCollections({ includeInactive: true }),
      ]);
      if (categories.length === 0) setCategories((cats as any[]) || []);
      if (collections.length === 0) setCollections((cols as any[]) || []);
      setEditingProduct(full);
      setFormData({
        name: full.name || '',
        description: full.description || '',
        category_id: full.category_id || '',
        collection_id: full.collection_id || '',
        material: full.material || '',
        price: (full.price ?? '').toString(),
        promotional_price: (full.promotional_price ?? '').toString(),
        stock: (full.stock ?? '').toString(),
        is_active: !!full.is_active,
        is_featured: !!full.is_featured,
        is_new: !!full.is_new,
      });
      try {
        const { supabase } = await import('@/lib/supabase');
        const { data: imgs } = await supabase
          .from('imagens_do_produto')
          .select('id,url,alt_text,is_primary,sort_order,storage_path,bucket_name')
          .eq('product_id', full.id);
        const arr = Array.isArray(imgs) ? imgs : [];
        const primary = arr.find((i: any) => i?.is_primary) || arr[0];
        setCurrentImageInfo(primary ? { url: primary.url, storage_path: primary.storage_path, bucket_name: primary.bucket_name } : null);
      } catch (error) {
        console.error('Erro ao carregar imagens do produto:', error);
      }
      setShowModal(true);
    } catch (e) {
      alert('Erro ao carregar produto para edição');
    }
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingProduct(null);
    setFormData({
      name: '',
      description: '',
      category_id: '',
      collection_id: '',
      material: '',
      price: '',
      promotional_price: '',
      stock: '',
      is_active: true,
      is_featured: false,
      is_new: false,
    });
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;
    setFormData((prev: any) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProduct) return;
    try {
      setIsSaving(true);
      const opId = `${Date.now()}-${Math.random().toString(16).slice(2)}`;
      const productId = editingProduct.id as string;
      adminProductsLog("info", "salvar:start", {
        opId,
        productId,
        hasNewImage: !!newImageFile,
        collection_id: formData.collection_id || null,
        category_id: formData.category_id || null,
      });

      const upsertPendingLog = window.setTimeout(() => {
        adminProductsLog("warn", "salvar:upsert:pendente", { opId, productId, waitedMs: 15000 });
      }, 15000);
      try {
        await adminData.upsertProduct(editingProduct.id, {
          name: formData.name,
          description: formData.description,
          category_id: formData.category_id || null,
          collection_id: formData.collection_id || null,
          material: formData.material,
          price: parseFloat(formData.price || '0'),
          promotional_price: formData.promotional_price ? parseFloat(formData.promotional_price) : null,
          stock: parseInt(formData.stock || '0'),
          is_active: !!formData.is_active,
          is_featured: !!formData.is_featured,
          is_new: !!formData.is_new,
        });
      } finally {
        window.clearTimeout(upsertPendingLog);
      }
      adminProductsLog("info", "salvar:upsert:ok", { opId, productId });

      let newPrimaryImageUrl: string | null = null;
      if (newImageFile) {
        const bucket = import.meta.env.VITE_STORAGE_BUCKET || 'product-images';
        const folder = editingProduct?.collection_id ? `collections/${editingProduct.collection_id}` : `products/${productId}`;
        adminProductsLog("info", "salvar:imagem:start", {
          opId,
          productId,
          bucket,
          folder,
          fileName: newImageFile.name,
          fileSize: newImageFile.size,
          fileType: newImageFile.type,
        });

        const deletePendingLog = window.setTimeout(() => {
          adminProductsLog("warn", "salvar:imagem:deleteAll:pendente", { opId, productId, waitedMs: 15000 });
        }, 15000);
        try {
          await adminData.deleteAllProductImagesByProduct(productId);
        } finally {
          window.clearTimeout(deletePendingLog);
        }
        adminProductsLog("info", "salvar:imagem:deleteAll:ok", { opId, productId });

        const path = `${folder}/${Date.now()}-${newImageFile.name}`;
        const uploadPendingLog = window.setTimeout(() => {
          adminProductsLog("warn", "salvar:imagem:upload:pendente", { opId, productId, waitedMs: 15000, path });
        }, 15000);
        let uploaded: { publicUrl: string; storagePath: string };
        try {
          uploaded = await adminData.uploadToStorage(bucket, path, newImageFile);
        } finally {
          window.clearTimeout(uploadPendingLog);
        }
        const { publicUrl, storagePath } = uploaded;
        adminProductsLog("info", "salvar:imagem:upload:ok", { opId, productId, storagePath });
        newPrimaryImageUrl = publicUrl;

        const addPendingLog = window.setTimeout(() => {
          adminProductsLog("warn", "salvar:imagem:add:pendente", { opId, productId, waitedMs: 15000 });
        }, 15000);
        try {
          await adminData.addProductImage(productId, {
            url: publicUrl,
            alt_text: newImageFile.name,
            is_primary: true,
            sort_order: 0,
            bucket_name: bucket,
            storage_path: storagePath,
          });
        } finally {
          window.clearTimeout(addPendingLog);
        }
        adminProductsLog("info", "salvar:imagem:add:ok", { opId, productId });
      }
      setShowModal(false);
      setEditingProduct(null);
      setProducts((prev) => prev.map((p) => {
        if (p.id !== productId) return p;
        const updated = {
          ...p,
          name: formData.name,
          description: formData.description,
          price: parseFloat(formData.price || '0'),
          promotional_price: formData.promotional_price ? parseFloat(formData.promotional_price) : undefined,
          stock: parseInt(formData.stock || '0'),
          is_active: !!formData.is_active,
          is_featured: !!formData.is_featured,
          is_new: !!formData.is_new,
        } as Product;
        if (newPrimaryImageUrl) {
          updated.images = [{ url: newPrimaryImageUrl, is_primary: true }];
        }
        return updated;
      }));
      adminProductsLog("info", "salvar:ok", { opId, productId });
    } catch (e) {
      console.error("[AdminProducts] Erro ao salvar produto:", e);
      alert('Erro ao salvar produto');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col xs:flex-row xs:items-start sm:items-center sm:justify-between gap-3 sm:gap-4">
          <div className="min-w-0">
            <h2 className="text-xl xs:text-2xl sm:text-3xl font-bold text-white truncate">Produtos</h2>
            <p className="text-slate-400 mt-1 text-sm sm:text-base">Gerencie seus produtos</p>
          </div>
          <Link
            to="/admin/products/new"
            className="bg-amber-400 hover:bg-amber-500 text-slate-900 px-3 sm:px-4 py-2 rounded-lg font-medium transition-colors flex items-center space-x-2 flex-shrink-0 text-sm sm:text-base"
          >
            <span>+</span>
            <span>Novo produto</span>
          </Link>
        </div>

        {/* Filters */}
        <div className="bg-slate-800 rounded-lg border border-slate-700 p-4 sm:p-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Buscar</label>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Nome do produto..."
                className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-400"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Categoria</label>
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-amber-400"
              >
                <option value="all">Todas as Categorias</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Coleção</label>
              <select
                value={collectionFilter}
                onChange={(e) => setCollectionFilter(e.target.value)}
                className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-amber-400"
              >
                <option value="all">Todas as Coleções</option>
                {collections.map((collection) => (
                  <option key={collection.id} value={collection.id}>
                    {collection.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Status</label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-amber-400"
              >
                <option value="all">Todos</option>
                <option value="active">Ativos</option>
                <option value="inactive">Inativos</option>
                <option value="featured">Destaques</option>
                <option value="new">Novos</option>
              </select>
            </div>
          </div>
          <div className="mt-4 flex items-center justify-end gap-2">
            <button
              onClick={() => setViewMode('cards')}
              className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${viewMode === 'cards' ? 'bg-amber-500 text-slate-900' : 'bg-slate-700 text-slate-300 hover:bg-slate-600'}`}
            >
              Cards
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${viewMode === 'table' ? 'bg-amber-500 text-slate-900' : 'bg-slate-700 text-slate-300 hover:bg-slate-600'}`}
            >
              Tabela
            </button>
          </div>
        </div>

        {loading && (
          <div className="text-slate-300">Carregando produtos...</div>
        )}
        {!loading && products.length === 0 && (
          <div className="text-slate-300">
            Nenhum produto carregado.
            <button
              className="ml-2 px-3 py-1 rounded bg-amber-400 text-slate-900"
              onClick={() => loadProducts()}
            >
              Tentar novamente
            </button>
          </div>
        )}

        {viewMode === 'cards' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {products.map((product) => (
              <div
                key={product.id}
                onClick={() => navigate(`/admin/products/${product.id}`)}
                className="bg-slate-800 rounded-lg border border-slate-700 p-3 cursor-pointer hover:border-slate-600 transition-colors"
              >
                <div className="w-full aspect-square rounded-lg overflow-hidden border border-slate-700">
                  <OptimizedImage
                    src={getPrimaryImage(product)}
                    alt={product.name}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="mt-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="text-sm font-medium text-white truncate">{product.name}</div>
                      <div className="text-xs text-slate-400 mt-0.5 truncate">{product.category?.name || '-'}</div>
                    </div>
                    <div className="flex flex-col items-end gap-1 flex-shrink-0">
                      <span
                        className={`inline-flex px-2 py-0.5 text-xs font-semibold rounded-full ${
                          product.is_active ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
                        }`}
                      >
                        {product.is_active ? 'Ativo' : 'Inativo'}
                      </span>
                      {product.is_new && <span className="text-xs text-green-400">✨ Novo</span>}
                    </div>
                  </div>
                  <div className="mt-2 flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <div className="text-sm text-white">
                        {formatCurrency(product.promotional_price || product.price)}
                      </div>
                      {product.promotional_price && (
                        <div className="text-xs text-slate-400 line-through">{formatCurrency(product.price)}</div>
                      )}
                      <div
                        className={`text-xs font-medium mt-1 ${
                          product.stock > 10 ? 'text-green-400' : product.stock > 0 ? 'text-yellow-400' : 'text-red-400'
                        }`}
                      >
                        {product.stock} unidades
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <button
                        onClick={(e) => { e.stopPropagation(); navigate(`/admin/products/${product.id}`); }}
                        className="px-2 py-1 rounded-md bg-slate-700 text-amber-300 text-xs font-medium hover:bg-slate-600 transition-colors"
                      >
                        Editar
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); if (!isDeleting) handleDelete(product.id); }}
                        className={`px-2 py-1 rounded-md ${isDeleting === product.id ? 'bg-slate-600 text-slate-400' : 'bg-slate-700 text-red-300 hover:bg-slate-600'} text-xs font-medium transition-colors`}
                        disabled={!!isDeleting}
                      >
                        {isDeleting === product.id ? 'Excluindo...' : 'Excluir'}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {viewMode === 'table' && (
        <div className="bg-slate-800 rounded-lg border border-slate-700 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full table-fixed">
              <thead className="bg-slate-700">
                <tr>
                  <th className="w-16 sm:w-20 px-3 sm:px-6 py-2 sm:py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">
                    Imagem
                  </th>
                  <th className="w-40 md:w-56 lg:w-64 px-3 sm:px-6 py-2 sm:py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">
                    Nome
                  </th>
                  <th className="hidden md:table-cell md:w-44 lg:w-52 px-3 sm:px-6 py-2 sm:py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">
                    Categoria
                  </th>
                  <th className="w-24 sm:w-28 px-3 sm:px-6 py-2 sm:py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">
                    Preço
                  </th>
                  <th className="hidden sm:table-cell sm:w-24 md:w-28 px-3 sm:px-6 py-2 sm:py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">
                    Estoque
                  </th>
                  <th className="w-28 sm:w-32 px-3 sm:px-6 py-2 sm:py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="hidden lg:table-cell lg:w-28 xl:w-32 px-3 sm:px-6 py-2 sm:py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">
                    Destaque
                  </th>
                  <th className="w-32 sm:w-40 px-3 sm:px-6 py-2 sm:py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">
                    Ações
                  </th>
                </tr>
              </thead>
              <tbody className="bg-slate-800 divide-y divide-slate-700">
                {products.map((product) => (
                  <tr key={product.id} className="hover:bg-slate-700/50">
                    <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap">
                      <OptimizedImage
                        src={getPrimaryImage(product)}
                        alt={product.name}
                        className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg object-cover"
                      />
                    </td>
                    <td className="px-3 sm:px-6 py-3 sm:py-4">
                      <div className="text-xs sm:text-sm font-medium text-white truncate max-w-[160px] md:max-w-[200px] lg:max-w-[240px] xl:max-w-[320px]">
                        {product.name}
                      </div>
                      {product.is_new && <div className="text-xs text-green-400 mt-0.5 sm:mt-1">✨ Novidade</div>}
                    </td>
                    <td className="hidden md:table-cell px-3 sm:px-6 py-3 sm:py-4">
                      <div className="text-xs sm:text-sm text-slate-300">{product.category?.name || '-'}</div>
                    </td>
                    <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap">
                      <div className="text-xs sm:text-sm text-white">
                        {formatCurrency(product.promotional_price || product.price)}
                      </div>
                      {product.promotional_price && (
                        <div className="text-xs text-slate-400 line-through">{formatCurrency(product.price)}</div>
                      )}
                    </td>
                    <td className="hidden sm:table-cell px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap">
                      <div
                        className={`text-xs sm:text-sm font-medium ${
                          product.stock > 10 ? 'text-green-400' : product.stock > 0 ? 'text-yellow-400' : 'text-red-400'
                        }`}
                      >
                        {product.stock} unidades
                      </div>
                    </td>
                    <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap">
                      <span
                        className={`inline-flex px-2 py-0.5 sm:px-2 sm:py-1 text-xs font-semibold rounded-full ${
                          product.is_active ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
                        }`}
                      >
                        {product.is_active ? 'Ativo' : 'Inativo'}
                      </span>
                    </td>
                    <td className="hidden lg:table-cell px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap">
                      <span
                        className={`inline-flex px-2 py-0.5 sm:px-2 sm:py-1 text-xs font-semibold rounded-full ${
                          product.is_featured ? 'bg-yellow-500/20 text-yellow-400' : 'bg-slate-500/20 text-slate-400'
                        }`}
                      >
                        {product.is_featured ? 'Sim' : 'Não'}
                      </span>
                    </td>
                    <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-xs sm:text-sm font-medium">
                      <div className="flex items-center space-x-1 sm:space-x-2">
                        <button onClick={() => navigate(`/admin/products/${product.id}`)} className="text-amber-400 hover:text-amber-300">
                          ✏️
                        </button>
                        <button
                          onClick={() => { if (!isDeleting) handleDelete(product.id); }}
                          className={`hover:text-red-300 ${isDeleting === product.id ? 'text-slate-500' : 'text-red-400'}`}
                          disabled={!!isDeleting}
                        >
                          {isDeleting === product.id ? '⏳' : '🗑️'}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          {products.length === 0 && (
            <div className="text-center py-12">
              <div className="text-slate-400 text-lg mb-2">Nenhum produto encontrado</div>
              <div className="text-slate-500 text-sm">Tente ajustar os filtros ou adicionar um novo produto</div>
            </div>
          )}
        </div>
        )}

        {showModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-slate-800 rounded-lg max-w-2xl w-full border border-slate-700 max-h-[80vh] overflow-y-auto">
              <div className="flex justify-between items-center p-6 border-b border-slate-700">
                <h2 className="text-xl font-bold text-white">Editar Produto</h2>
                <button onClick={closeModal} className="text-slate-400 hover:text-white transition-colors">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <form onSubmit={handleSubmit} className="p-6 space-y-4">
                {currentImageInfo?.url && (
                  <div className="mb-4">
                    <div className="w-full aspect-square rounded-lg border border-slate-700 overflow-hidden">
                      <img src={currentImageInfo.url} alt="Imagem atual do produto" className="w-full h-full object-cover" />
                    </div>
                  </div>
                )}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">Nome *</label>
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">Categoria *</label>
                    <select
                      name="category_id"
                      value={formData.category_id}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                      required
                    >
                      <option value="">Selecione</option>
                      {categories.map((category) => (
                        <option key={category.id} value={category.id}>{category.name}</option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">Coleção</label>
                    <select
                      name="collection_id"
                      value={formData.collection_id}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                    >
                      <option value="">Selecione</option>
                      {collections.map((collection) => (
                        <option key={collection.id} value={collection.id}>{collection.name}</option>
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
                      className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                  <div className="text-xs text-slate-400">
                    <span className="font-medium text-slate-300">Coleção:</span>{' '}
                    {(() => {
                      const col = collections.find((c: any) => c.id === editingProduct?.collection_id);
                      return col?.name || '-';
                    })()}
                  </div>
                  <div className="text-xs text-slate-400">
                    <span className="font-medium text-slate-300">Tags:</span>{' '}
                    {Array.isArray(editingProduct?.tags) && editingProduct.tags.length > 0
                      ? editingProduct.tags.join(', ')
                      : '-'}
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">Preço *</label>
                    <input
                      type="number"
                      name="price"
                      value={formData.price}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                      required
                      step="0.01"
                      min="0"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">Promoção</label>
                    <input
                      type="number"
                      name="promotional_price"
                      value={formData.promotional_price}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                      step="0.01"
                      min="0"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">Estoque *</label>
                    <input
                      type="number"
                      name="stock"
                      value={formData.stock}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                      required
                      min="0"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Descrição</label>
                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                    rows={3}
                  />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <label className="flex items-center space-x-2">
                    <input type="checkbox" name="is_active" checked={formData.is_active} onChange={handleInputChange} className="rounded border-slate-600 text-amber-400 focus:ring-amber-400" />
                    <span className="text-slate-300">Ativo</span>
                  </label>
                  <label className="flex items-center space-x-2">
                    <input type="checkbox" name="is_featured" checked={formData.is_featured} onChange={handleInputChange} className="rounded border-slate-600 text-amber-400 focus:ring-amber-400" />
                    <span className="text-slate-300">Destaque</span>
                  </label>
                  <label className="flex items-center space-x-2">
                    <input type="checkbox" name="is_new" checked={formData.is_new} onChange={handleInputChange} className="rounded border-slate-600 text-amber-400 focus:ring-amber-400" />
                    <span className="text-slate-300">Novo</span>
                  </label>
                </div>
              <div className="flex gap-3 pt-4">
                <button type="button" onClick={closeModal} className="flex-1 px-4 py-2 border border-slate-600 rounded-lg text-slate-300 hover:bg-slate-700 transition-colors">
                  Cancelar
                </button>
                <button type="submit" className="flex-1 px-4 py-2 bg-amber-500 hover:bg-amber-600 text-slate-900 rounded-lg font-medium transition-colors">
                  {isSaving ? 'Salvando...' : 'Atualizar'}
                </button>
              </div>
              <div className="pt-4">
                <label className="block text-sm font-medium text-slate-300 mb-2">Imagem do Produto (opcional)</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setNewImageFile(e.target.files?.[0] || null)}
                  className="block w-full text-sm text-slate-300 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-amber-500 file:text-slate-900 hover:file:bg-amber-600"
                />
                <p className="text-xs text-slate-400 mt-2">Se selecionar um arquivo, a imagem atual será substituída no storage e na tabela.</p>
                {currentImageInfo && (
                  <div className="mt-2 space-y-1 text-xs text-slate-400">
                    <div>URL atual: <span className="break-all">{currentImageInfo.url}</span></div>
                    <div>Storage path: <span className="break-all">{currentImageInfo.storage_path || '-'}</span></div>
                    <div>Bucket: {currentImageInfo.bucket_name || '-'}</div>
                  </div>
                )}
              </div>
            </form>
          </div>
        </div>
      )}
      </div>
    </AdminLayout>
  );
};

export default AdminProducts;
