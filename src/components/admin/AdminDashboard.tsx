import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import AdminLayout from './AdminLayout';
import { supabase } from '@/lib/supabase';

interface DashboardStats {
  totalSales: number;
  todayOrders: number;
  totalProducts: number;
  lowStockProducts: number;
  recentOrders: any[];
  salesList: any[];
}

const AdminDashboard: React.FC = () => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState('1');
  const [confirmingPaymentId, setConfirmingPaymentId] = useState<string | null>(null);

  useEffect(() => {
    loadDashboardData();
  }, [dateRange]);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const startOfToday = new Date();
      startOfToday.setHours(0, 0, 0, 0);
      const startIso = startOfToday.toISOString();
      const rangeDays = Number(dateRange) || 7;
      const startRange = new Date();
      startRange.setDate(startRange.getDate() - rangeDays);
      startRange.setHours(0, 0, 0, 0);
      const startRangeIso = startRange.toISOString();

      const { count: totalProducts } = await supabase
        .from('products')
        .select('id', { count: 'exact' })
        .eq('is_active', true);

      const { count: lowStockProducts } = await supabase
        .from('products')
        .select('id', { count: 'exact' })
        .lte('stock', 0)
        .eq('is_active', true);

      const tables = ['pedidos', 'orders'];
      let totalSales = 0;
      let todayOrdersCount = 0;
      let recentOrders: any[] = [];
      let salesList: any[] = [];

      for (const table of tables) {
        const list = await supabase
          .from(table)
          .select('id,order_number,customer_name,total_amount,order_status,payment_status,created_at')
          .gte('created_at', startRangeIso)
          .order('created_at', { ascending: false });
        if (!list.error && Array.isArray(list.data)) {
          const rows = (list.data as any[]).map((r) => ({ ...r, __table: table }));
          totalSales = rows
            .filter((r) => (r.payment_status || '').toLowerCase() === 'confirmed')
            .reduce((sum, r) => sum + Number(r.total_amount || 0), 0);
          todayOrdersCount = rows.filter(
            (r) => r.created_at && new Date(r.created_at).getTime() >= new Date(startIso).getTime()
          ).length;
          recentOrders = rows.slice(0, 5);
          salesList = rows.filter((r) => (r.payment_status || '').toLowerCase() === 'confirmed');
          break;
        }
      }

      const data: DashboardStats = {
        totalSales: totalSales || 0,
        todayOrders: todayOrdersCount || 0,
        totalProducts: totalProducts || 0,
        lowStockProducts: lowStockProducts || 0,
        recentOrders,
        salesList,
      };
      setStats(data);
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const confirmPayment = async (order: any) => {
    const table = order?.__table;
    if (!table || !order?.id) return;
    try {
      setConfirmingPaymentId(order.id);
      const { error } = await supabase
        .from(table)
        .update({ payment_status: 'confirmed' })
        .eq('id', order.id);
      if (error) throw error;
      await loadDashboardData();
    } catch {
      alert('Não foi possível confirmar o pagamento');
    } finally {
      setConfirmingPaymentId(null);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const formatNumber = (value: number) => {
    return new Intl.NumberFormat('pt-BR').format(value);
  };

  if (loading) {
    return (
      <AdminLayout title="Dashboard">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-400"></div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title="Dashboard">
      <div className="space-y-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-slate-800 rounded-lg p-6 border border-slate-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-400 text-sm font-medium">Total de Vendas</p>
                <p className="text-2xl font-bold text-white mt-1">
                  {formatCurrency(stats?.totalSales || 0)}
                </p>
              </div>
              <div className="w-12 h-12 bg-green-500/20 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-slate-800 rounded-lg p-6 border border-slate-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-400 text-sm font-medium">Pedidos do Dia</p>
                <p className="text-2xl font-bold text-white mt-1">
                  {formatNumber(stats?.todayOrders || 0)}
                </p>
              </div>
              <div className="w-12 h-12 bg-blue-500/20 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-slate-800 rounded-lg p-6 border border-slate-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-400 text-sm font-medium">Produtos Cadastrados</p>
                <p className="text-2xl font-bold text-white mt-1">
                  {formatNumber(stats?.totalProducts || 0)}
                </p>
              </div>
              <div className="w-12 h-12 bg-purple-500/20 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-slate-800 rounded-lg p-6 border border-slate-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-400 text-sm font-medium">Produtos sem Estoque</p>
                <p className="text-2xl font-bold text-white mt-1">
                  {formatNumber(stats?.lowStockProducts || 0)}
                </p>
              </div>
              <div className="w-12 h-12 bg-red-500/20 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
            </div>
          </div>
        </div>

        {/* Charts and Recent Orders */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Sales List */}
          <div className="bg-slate-800 rounded-lg p-6 border border-slate-700">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-white">Vendas por Período</h3>
              <select
                value={dateRange}
                onChange={(e) => setDateRange(e.target.value)}
                className="bg-slate-700 text-white rounded px-3 py-1 text-sm border border-slate-600"
              >
                <option value="1">Último dia</option>
                <option value="7">Últimos 7 dias</option>
                <option value="30">Últimos 30 dias</option>
                <option value="90">Últimos 90 dias</option>
              </select>
            </div>
            <div className="space-y-3">
              {stats?.salesList && stats.salesList.length > 0 ? (
                stats.salesList.map((order) => (
                  <div key={order.id} className="flex items-center justify-between p-3 bg-slate-700/30 rounded">
                    <div className="min-w-0">
                      <p className="text-white font-medium truncate">#{order.order_number}</p>
                      <p className="text-slate-400 text-sm truncate">{order.customer_name}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-white font-medium">{formatCurrency(Number(order.total_amount || 0))}</p>
                      <span className={`text-xs px-2 py-1 rounded-full ${
                        (order.payment_status || '').toLowerCase() === 'confirmed'
                          ? 'bg-green-500/20 text-green-400'
                          : 'bg-red-500/20 text-red-400'
                      }`}>
                        {(order.payment_status || '').toLowerCase() === 'confirmed' ? 'Pagamento Confirmado' : 'Pagamento Pendente'}
                      </span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-10 text-slate-400">
                  <p>Nenhuma venda no período selecionado</p>
                </div>
              )}
            </div>
          </div>

          {/* Recent Orders */}
          <div className="bg-slate-800 rounded-lg p-6 border border-slate-700">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-white">Pedidos Recentes</h3>
              <Link to="/admin/orders" className="text-amber-400 hover:text-amber-300 text-sm">
                Ver todos
              </Link>
            </div>
            <div className="space-y-3">
              {stats?.recentOrders?.length > 0 ? (
                stats.recentOrders.map((order) => (
                  <div key={order.id} className="flex items-center justify-between p-3 bg-slate-700/50 rounded-lg">
                    <div>
                      <p className="text-white font-medium">#{order.order_number}</p>
                      <p className="text-slate-400 text-sm">{order.customer_name}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-white font-medium">{formatCurrency(order.total_amount)}</p>
                      {(order.payment_status || '').toLowerCase() === 'confirmed' ? (
                        <span className="text-xs px-2 py-1 rounded-full bg-green-500/20 text-green-400">
                          Pagamento Confirmado
                        </span>
                      ) : (
                        <button
                          type="button"
                          disabled={confirmingPaymentId === order.id}
                          onClick={() => confirmPayment(order)}
                          className="text-xs px-2 py-1 rounded-full bg-red-500/20 text-red-400 hover:bg-red-500/30 disabled:opacity-60"
                        >
                          {confirmingPaymentId === order.id ? 'Confirmando...' : 'Pagamento Pendente'}
                        </button>
                      )}
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-slate-400">
                  <svg className="w-12 h-12 mx-auto mb-3 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                  </svg>
                  <p>Nenhum pedido recente</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-slate-800 rounded-lg p-6 border border-slate-700">
          <h3 className="text-lg font-semibold text-white mb-4">Ações Rápidas</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Link
              to="/admin/products/new"
              className="flex items-center justify-center space-x-2 bg-amber-400 hover:bg-amber-500 text-slate-900 font-medium py-3 px-4 rounded-lg transition-colors"
            >
              <span>➕</span>
              <span>Novo Produto</span>
            </Link>
            <Link
              to="/admin/orders"
              className="flex items-center justify-center space-x-2 bg-blue-500 hover:bg-blue-600 text-white font-medium py-3 px-4 rounded-lg transition-colors"
            >
              <span>📋</span>
              <span>Ver Pedidos</span>
            </Link>
            <Link
              to="/admin/carousel"
              className="flex items-center justify-center space-x-2 bg-purple-500 hover:bg-purple-600 text-white font-medium py-3 px-4 rounded-lg transition-colors"
            >
              <span>🎞</span>
              <span>Carrossel</span>
            </Link>
            <Link
              to="/admin/settings"
              className="flex items-center justify-center space-x-2 bg-slate-600 hover:bg-slate-700 text-white font-medium py-3 px-4 rounded-lg transition-colors"
            >
              <span>⚙</span>
              <span>Configurações</span>
            </Link>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};

function getStatusLabel(status: string): string {
  const labels = {
    'pending': 'Pendente',
    'paid': 'Pago',
    'processing': 'Processando',
    'shipped': 'Enviado',
    'delivered': 'Entregue',
    'cancelled': 'Cancelado'
  };
  return labels[status as keyof typeof labels] || status;
}

export default AdminDashboard;
