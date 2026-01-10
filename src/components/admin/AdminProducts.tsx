import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import AdminLayout from './AdminLayout';
import { fetchProducts, fetchCategories } from '@/services/publicData';
import { adminData } from '@/services/adminData';
import OptimizedImage from '@/components/OptimizedImage';

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
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [categories, setCategories] = useState<any[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<any | null>(null);
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

  useEffect(() => {
    loadProducts();
    loadCategories();
  }, [searchTerm, categoryFilter, statusFilter]);

  const loadProducts = async () => {
    try {
      setLoading(true);
      const params: any = {
        search: searchTerm || undefined,
        category: categoryFilter !== 'all' ? categoryFilter : undefined,
        featured: statusFilter === 'featured' ? true : undefined,
        isNew: statusFilter === 'new' ? true : undefined,
      };
      const { products } = await fetchProducts({ page: 1, limit: 200, ...params });
      setProducts(products || []);
    } catch (error) {
      console.error('Error loading products:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadCategories = async () => {
    try {
      const response = await fetchCategories();
      setCategories(response || []);
    } catch (error) {
      console.error('Error loading categories:', error);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Tem certeza que deseja excluir este produto?')) return;
    try {
      await adminData.deleteProduct(id);
      loadProducts();
    } catch (e) {
      alert('Erro ao excluir produto');
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
      const full = await adminData.getProduct(product.id);
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
      closeModal();
      loadProducts();
    } catch (e) {
      alert('Erro ao salvar produto');
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
        </div>

        <div className="sm:hidden space-y-3">
          {products.map((product) => (
            <div key={product.id} className="bg-slate-800 rounded-lg border border-slate-700 p-3">
              <div className="flex items-start gap-3">
                <OptimizedImage
                  src={getPrimaryImage(product)}
                  alt={product.name}
                  className="w-12 h-12 rounded-lg object-cover flex-shrink-0"
                />
                <div className="min-w-0 flex-1">
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
                        onClick={() => openEditModal(product)}
                        className="px-2 py-1 rounded-md bg-slate-700 text-amber-300 text-xs font-medium hover:bg-slate-600 transition-colors"
                      >
                        Editar
                      </button>
                      <button
                        onClick={() => handleDelete(product.id)}
                        className="px-2 py-1 rounded-md bg-slate-700 text-red-300 text-xs font-medium hover:bg-slate-600 transition-colors"
                      >
                        Excluir
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="hidden sm:block bg-slate-800 rounded-lg border border-slate-700 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-700">
                <tr>
                  <th className="px-3 sm:px-6 py-2 sm:py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">
                    Imagem
                  </th>
                  <th className="px-3 sm:px-6 py-2 sm:py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">
                    Nome
                  </th>
                  <th className="hidden md:table-cell px-3 sm:px-6 py-2 sm:py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">
                    Categoria
                  </th>
                  <th className="px-3 sm:px-6 py-2 sm:py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">
                    Preço
                  </th>
                  <th className="hidden sm:table-cell px-3 sm:px-6 py-2 sm:py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">
                    Estoque
                  </th>
                  <th className="px-3 sm:px-6 py-2 sm:py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="hidden lg:table-cell px-3 sm:px-6 py-2 sm:py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">
                    Destaque
                  </th>
                  <th className="px-3 sm:px-6 py-2 sm:py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">
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
                    <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap">
                      <div className="text-xs sm:text-sm font-medium text-white truncate max-w-[140px] lg:max-w-none">
                        {product.name}
                      </div>
                      {product.is_new && <div className="text-xs text-green-400 mt-0.5 sm:mt-1">✨ Novidade</div>}
                    </td>
                    <td className="hidden md:table-cell px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap">
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
                        <button onClick={() => openEditModal(product)} className="text-amber-400 hover:text-amber-300">
                          ✏️
                        </button>
                        <button onClick={() => handleDelete(product.id)} className="text-red-400 hover:text-red-300">
                          🗑️
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

        {showModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-slate-800 rounded-lg max-w-2xl w-full border border-slate-700">
              <div className="flex justify-between items-center p-6 border-b border-slate-700">
                <h2 className="text-xl font-bold text-white">Editar Produto</h2>
                <button onClick={closeModal} className="text-slate-400 hover:text-white transition-colors">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <form onSubmit={handleSubmit} className="p-6 space-y-4">
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
                      {/* coleção opcional, preenche via formulário avançado se necessário */}
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
                    Atualizar
                  </button>
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
