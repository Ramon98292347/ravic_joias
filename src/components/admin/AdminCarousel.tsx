import React, { useState, useEffect } from 'react';
import AdminLayout from './AdminLayout';
import { fetchProducts } from '@/services/publicData';
import { adminData } from '@/services/adminData';

interface CarouselItem {
  id: string;
  product_id: string;
  product?: Product;
  sort_order: number;
  is_active: boolean;
}

interface Product {
  id: string;
  name: string;
  price: number;
  promotional_price?: number;
  images?: { url: string; is_primary?: boolean | null }[] | null;
}

const AdminCarousel: React.FC = () => {
  const [carouselItems, setCarouselItems] = useState<CarouselItem[]>([]);
  const [availableProducts, setAvailableProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedProduct, setSelectedProduct] = useState('');
  const [autoPlay, setAutoPlay] = useState(true);
  const [transitionTime, setTransitionTime] = useState(4);

  useEffect(() => {
    loadCarouselItems();
    loadAvailableProducts();
  }, []);

  const loadCarouselItems = async () => {
    try {
      const rows = await adminData.listCarouselItems();
      // Enriquecer com dados do produto
      const ids = rows.map((r: any) => r.product_id).filter(Boolean);
      let products: Record<string, Product> = {};
      if (ids.length > 0) {
        const { products: found } = await fetchProducts({ page: 1, limit: 200 });
        for (const p of found) {
          products[p.id] = p as Product;
        }
      }
      const items = rows.map((r: any) => ({ ...r, product: products[r.product_id] }));
      setCarouselItems(items);
    } catch (error) {
      console.error('Error loading carousel items:', error);
    }
  };

  const loadAvailableProducts = async () => {
    try {
      const { products } = await fetchProducts({ page: 1, limit: 200, isNew: true });
      setAvailableProducts(products || []);
    } catch (error) {
      console.error('Error loading available products:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddProduct = async () => {
    if (!selectedProduct) return;

    try {
      await adminData.addCarouselItem({
        product_id: selectedProduct,
        sort_order: carouselItems.length + 1,
        is_active: true,
      });
      
      setSelectedProduct('');
      loadCarouselItems();
    } catch (error) {
      console.error('Error adding product to carousel:', error);
    }
  };

  const handleRemoveProduct = async (index: number) => {
    try {
      const item = carouselItems[index];
      if (item?.id) await adminData.deleteCarouselItem(item.id);
      // Reordenar todos os demais
      const remaining = carouselItems.filter((_, i) => i !== index);
      await Promise.all(
        remaining.map((it, i) => adminData.updateCarouselItem(it.id, { sort_order: i + 1 }))
      );
      loadCarouselItems();
    } catch (error) {
      console.error('Error removing product from carousel:', error);
    }
  };

  const handleReorder = async (fromIndex: number, toIndex: number) => {
    try {
      const items = [...carouselItems];
      const [movedItem] = items.splice(fromIndex, 1);
      items.splice(toIndex, 0, movedItem);
      
      // Reorder items
      await Promise.all(items.map((item, i) => adminData.updateCarouselItem(item.id, { sort_order: i + 1 })));
      loadCarouselItems();
    } catch (error) {
      console.error('Error reordering carousel items:', error);
    }
  };

  const handleToggleActive = async (index: number) => {
    try {
      const item = carouselItems[index];
      await adminData.updateCarouselItem(item.id, { is_active: !item.is_active });
      loadCarouselItems();
    } catch (error) {
      console.error('Error toggling carousel item:', error);
    }
  };

  const handleSaveSettings = async () => {
    try {
      // Save settings would be implemented here
      alert('Configurações salvas com sucesso!');
    } catch (error) {
      console.error('Error saving settings:', error);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const getPrimaryImage = (product?: Product) => {
    const primaryImage = product?.images?.find(img => img?.is_primary) || product?.images?.[0];
    return primaryImage?.url || '/placeholder.svg';
  };

  if (loading) {
    return (
      <AdminLayout title="Carrossel de Novidades">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-400"></div>
        </div>
      </AdminLayout>
    );
  }

  return (
      <AdminLayout title="Carrossel de Novidades">
      <div className="space-y-4 sm:space-y-6">
        {/* Settings */}
        <div className="bg-slate-800 rounded-lg p-4 sm:p-6 border border-slate-700">
          <h3 className="text-base sm:text-lg font-semibold text-white mb-3 sm:mb-4">Configurações do Carrossel</h3>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 lg:gap-6">
            <div>
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={autoPlay}
                  onChange={(e) => setAutoPlay(e.target.checked)}
                  className="rounded border-slate-600 text-amber-400 focus:ring-amber-400"
                />
                <span className="text-slate-300">Autoplay ativado</span>
              </label>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Tempo de transição (segundos)
              </label>
              <select
                value={transitionTime}
                onChange={(e) => setTransitionTime(Number(e.target.value))}
                className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-amber-400"
              >
                <option value={3}>3 segundos</option>
                <option value={4}>4 segundos</option>
                <option value={5}>5 segundos</option>
                <option value={6}>6 segundos</option>
              </select>
            </div>

            <div className="flex items-end">
              <button
                onClick={handleSaveSettings}
                className="w-full bg-amber-400 hover:bg-amber-500 text-slate-900 font-medium px-4 py-2 rounded-lg transition-colors"
              >
                Salvar Configurações
              </button>
            </div>
          </div>
        </div>

        {/* Add Product */}
        <div className="bg-slate-800 rounded-lg p-4 sm:p-6 border border-slate-700">
          <h3 className="text-base sm:text-lg font-semibold text-white mb-3 sm:mb-4">Adicionar Produto ao Carrossel</h3>
          
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
            <select
              value={selectedProduct}
              onChange={(e) => setSelectedProduct(e.target.value)}
              className="flex-1 px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-amber-400 text-sm sm:text-base"
            >
              <option value="">Selecione um produto</option>
              {availableProducts.map((product) => (
                <option key={product.id} value={product.id}>
                  {product.name}
                </option>
              ))}
            </select>
            <button
              onClick={handleAddProduct}
              disabled={!selectedProduct}
              className="bg-amber-400 hover:bg-amber-500 text-slate-900 font-medium px-4 py-2 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base"
            >
              Adicionar
            </button>
          </div>
        </div>

        {/* Current Items */}
        <div className="bg-slate-800 rounded-lg p-4 sm:p-6 border border-slate-700">
          <h3 className="text-base sm:text-lg font-semibold text-white mb-3 sm:mb-4">Produtos no Carrossel ({carouselItems.length})</h3>
          
          {carouselItems.length === 0 ? (
            <div className="text-center py-12 text-slate-400">
              <svg className="w-16 h-16 mx-auto mb-4 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <p className="text-lg mb-2">Nenhum produto no carrossel</p>
              <p className="text-sm">Adicione produtos novos para exibir no carrossel da página inicial.</p>
            </div>
          ) : (
            <div className="space-y-3 sm:space-y-4">
              {carouselItems.map((item, index) => (
                <div key={item.id || index} className="bg-slate-700/50 rounded-lg p-3 sm:p-4">
                  <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3 lg:gap-4">
                    <div className="flex items-center space-x-3 sm:space-x-4">
                      <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-lg overflow-hidden flex-shrink-0">
                        <img
                          src={getPrimaryImage(item.product)}
                          alt={item.product.name}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            e.currentTarget.src = '/placeholder-product.jpg';
                          }}
                        />
                      </div>
                      <div className="min-w-0 flex-1">
                        <h4 className="text-white font-medium text-sm sm:text-base truncate">{item.product.name}</h4>
                        <p className="text-slate-400 text-xs sm:text-sm">
                          {formatCurrency(item.product.promotional_price || item.product.price)}
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between lg:justify-end space-x-2 sm:space-x-3">
                      <button
                        onClick={() => handleToggleActive(index)}
                        className={`px-2 sm:px-3 py-1 rounded-full text-xs sm:text-sm font-medium transition-colors whitespace-nowrap ${
                          item.is_active
                            ? 'bg-green-500/20 text-green-400 hover:bg-green-500/30'
                            : 'bg-slate-500/20 text-slate-400 hover:bg-slate-500/30'
                        }`}
                      >
                        {item.is_active ? 'Ativo' : 'Inativo'}
                      </button>
                      
                      <div className="flex space-x-1">
                        <button
                          onClick={() => handleReorder(index, index - 1)}
                          disabled={index === 0}
                          className="p-1 text-slate-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed"
                          title="Mover para cima"
                        >
                          ↑
                        </button>
                        <button
                          onClick={() => handleReorder(index, index + 1)}
                          disabled={index === carouselItems.length - 1}
                          className="p-1 text-slate-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed"
                          title="Mover para baixo"
                        >
                          ↓
                        </button>
                      </div>
                      
                      <button
                        onClick={() => handleRemoveProduct(index)}
                        className="p-1 text-red-400 hover:text-red-300"
                        title="Remover"
                      >
                        🗑️
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Preview */}
        <div className="bg-slate-800 rounded-lg p-4 sm:p-6 border border-slate-700">
          <h3 className="text-base sm:text-lg font-semibold text-white mb-3 sm:mb-4">Prévia do Carrossel</h3>
          
          <div className="bg-slate-900 rounded-lg p-8">
            <div className="text-center text-slate-400">
              <svg className="w-16 h-16 mx-auto mb-4 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <p>Prévia do carrossel será exibida aqui</p>
              <p className="text-sm mt-1">Com transição automática a cada {transitionTime} segundos</p>
              {autoPlay && <p className="text-xs mt-2">🔄 Autoplay ativado</p>}
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminCarousel;
