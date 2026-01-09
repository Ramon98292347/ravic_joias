import React, { useEffect, useMemo, useState } from "react";
import AdminLayout from "./AdminLayout";
import { supabase } from "@/lib/supabase";

type OrderTable = "pedidos" | "orders";

type OrderRow = {
  id: string;
  order_number: string;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  total_amount: number;
  order_status: string;
  payment_status: string;
  created_at: string;
  __table: OrderTable;
};

type OrderItemRow = {
  id: string;
  product_name: string;
  quantity: number;
  product_price?: number;
  unit_price?: number;
  subtotal?: number;
  total_price?: number;
  size?: number | null;
};

const AdminOrders: React.FC = () => {
  const [orders, setOrders] = useState<OrderRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("all");
  const [paymentFilter, setPaymentFilter] = useState("all");
  const [selectedOrder, setSelectedOrder] = useState<(OrderRow & { items?: OrderItemRow[] }) | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [confirmingPaymentId, setConfirmingPaymentId] = useState<string | null>(null);

  const statusOptions = useMemo(
    () => [
      { value: "all", label: "Todos os Status" },
      { value: "pending", label: "Pendente" },
      { value: "confirmed", label: "Confirmado" },
      { value: "preparing", label: "Em Preparação" },
      { value: "shipped", label: "Enviado" },
      { value: "delivered", label: "Entregue" },
      { value: "cancelled", label: "Cancelado" },
    ],
    []
  );

  const paymentStatusOptions = useMemo(
    () => [
      { value: "all", label: "Todos os Pagamentos" },
      { value: "pending", label: "Pagamento Pendente" },
      { value: "confirmed", label: "Pagamento Confirmado" },
      { value: "refunded", label: "Reembolsado" },
      { value: "failed", label: "Falhou" },
    ],
    []
  );

  const statusLabelByValue = useMemo(() => {
    const map: Record<string, string> = {};
    for (const s of statusOptions) map[s.value] = s.label;
    return map;
  }, [statusOptions]);

  const paymentLabelByValue = useMemo(() => {
    const map: Record<string, string> = {};
    for (const p of paymentStatusOptions) map[p.value] = p.label;
    return map;
  }, [paymentStatusOptions]);

  useEffect(() => {
    loadOrders();
  }, [statusFilter, paymentFilter]);

  const loadOrders = async () => {
    try {
      setLoading(true);

      const tableCandidates: OrderTable[] = ["pedidos", "orders"];
      let rows: OrderRow[] = [];

      for (const table of tableCandidates) {
        let q = supabase
          .from(table)
          .select(
            "id,order_number,customer_name,customer_email,customer_phone,total_amount,order_status,payment_status,created_at"
          )
          .order("created_at", { ascending: false });

        if (statusFilter !== "all") q = q.eq("order_status", statusFilter);
        if (paymentFilter !== "all") q = q.eq("payment_status", paymentFilter);

        const res = await q;
        if (!res.error && Array.isArray(res.data)) {
          rows = (res.data as any[]).map((r) => ({ ...r, __table: table }));
          break;
        }
      }

      setOrders(rows);
    } catch {
      setOrders([]);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getStatusColor = (status: string) => {
    const colors: { [key: string]: string } = {
      pending: "bg-yellow-500/20 text-yellow-400",
      confirmed: "bg-blue-500/20 text-blue-400",
      preparing: "bg-purple-500/20 text-purple-400",
      shipped: "bg-indigo-500/20 text-indigo-400",
      delivered: "bg-green-500/20 text-green-400",
      cancelled: "bg-red-500/20 text-red-400",
    };
    return colors[status] || "bg-slate-500/20 text-slate-400";
  };

  const getPaymentStatusColor = (paymentStatus: string) => {
    const colors: { [key: string]: string } = {
      pending: "bg-yellow-500/20 text-yellow-400",
      confirmed: "bg-green-500/20 text-green-400",
      refunded: "bg-blue-500/20 text-blue-400",
      failed: "bg-red-500/20 text-red-400",
    };
    return colors[paymentStatus] || "bg-slate-500/20 text-slate-400";
  };

  const handleStatusUpdate = async (order: OrderRow, newStatus: string) => {
    try {
      const { error } = await supabase
        .from(order.__table)
        .update({ order_status: newStatus })
        .eq("id", order.id);
      if (error) throw error;
      await loadOrders();
      if (selectedOrder?.id === order.id) setSelectedOrder({ ...selectedOrder, order_status: newStatus });
    } catch {
      alert("Erro ao atualizar status do pedido");
    }
  };

  const confirmPayment = async (order: OrderRow) => {
    try {
      setConfirmingPaymentId(order.id);
      const { error } = await supabase
        .from(order.__table)
        .update({ payment_status: "confirmed" })
        .eq("id", order.id);
      if (error) throw error;
      await loadOrders();
      if (selectedOrder?.id === order.id) setSelectedOrder({ ...selectedOrder, payment_status: "confirmed" });
    } catch {
      alert("Erro ao confirmar pagamento");
    } finally {
      setConfirmingPaymentId(null);
    }
  };

  const viewOrderDetails = async (order: OrderRow) => {
    setSelectedOrder({ ...order });
    setShowModal(true);

    if (order.__table === "pedidos") {
      const { data } = await supabase
        .from("itens_do_pedido")
        .select("id,product_name,quantity,product_price,subtotal,size")
        .eq("order_id", order.id)
        .order("created_at", { ascending: true });

      setSelectedOrder((prev) => (prev && prev.id === order.id ? { ...prev, items: (data as any[]) || [] } : prev));
    }
  };

  if (loading) {
    return (
      <AdminLayout title="Pedidos">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-400"></div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title="Pedidos">
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold text-white">Pedidos</h2>
          <div className="text-sm text-slate-400">Total: {orders.length} pedidos</div>
        </div>

        <div className="bg-slate-800 rounded-lg p-4 border border-slate-700">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Status do Pedido</label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-amber-400"
              >
                {statusOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Status do Pagamento</label>
              <select
                value={paymentFilter}
                onChange={(e) => setPaymentFilter(e.target.value)}
                className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-amber-400"
              >
                {paymentStatusOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        <div className="bg-slate-800 rounded-lg border border-slate-700">
          {orders.length === 0 ? (
            <div className="text-center py-12 text-slate-400">
              <p className="text-lg mb-2">Nenhum pedido encontrado</p>
              <p className="text-sm">Nenhum pedido corresponde aos filtros selecionados.</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-700">
              {orders.map((order) => (
                <div key={order.id} className="p-6 hover:bg-slate-700/30 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <h3 className="text-lg font-semibold text-white">Pedido #{order.order_number}</h3>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(order.order_status)}`}>
                          {statusLabelByValue[order.order_status] || order.order_status}
                        </span>
                        {order.payment_status === "confirmed" ? (
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPaymentStatusColor(order.payment_status)}`}>
                            {paymentLabelByValue[order.payment_status] || order.payment_status}
                          </span>
                        ) : (
                          <button
                            type="button"
                            disabled={confirmingPaymentId === order.id}
                            onClick={() => confirmPayment(order)}
                            className={`px-2 py-1 rounded-full text-xs font-medium ${getPaymentStatusColor(order.payment_status)} hover:opacity-90 disabled:opacity-60`}
                          >
                            {confirmingPaymentId === order.id
                              ? "Confirmando..."
                              : paymentLabelByValue[order.payment_status] || order.payment_status}
                          </button>
                        )}
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                        <div>
                          <p className="text-slate-400">Cliente</p>
                          <p className="text-white">{order.customer_name}</p>
                        </div>
                        <div>
                          <p className="text-slate-400">Valor Total</p>
                          <p className="text-white font-medium">{formatCurrency(order.total_amount)}</p>
                        </div>
                        <div>
                          <p className="text-slate-400">Data</p>
                          <p className="text-white">{formatDate(order.created_at)}</p>
                        </div>
                      </div>

                      <div className="mt-2">
                        <p className="text-slate-400 text-sm">Email: {order.customer_email} • Telefone: {order.customer_phone}</p>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2 ml-4">
                      <button
                        onClick={() => viewOrderDetails(order)}
                        className="px-3 py-1 bg-slate-700 hover:bg-slate-600 text-white text-sm rounded-lg transition-colors"
                      >
                        Ver Detalhes
                      </button>

                      <select
                        value={order.order_status}
                        onChange={(e) => handleStatusUpdate(order, e.target.value)}
                        className="px-3 py-1 bg-slate-700 border border-slate-600 text-white text-sm rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-400"
                      >
                        {statusOptions.slice(1).map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {showModal && selectedOrder && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-slate-800 rounded-lg p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto border border-slate-700">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-semibold text-white">Detalhes do Pedido #{selectedOrder.order_number}</h3>
                <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-white transition-colors">
                  ✕
                </button>
              </div>

              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="text-lg font-medium text-white mb-3">Informações do Cliente</h4>
                    <div className="space-y-2 text-sm">
                      <div>
                        <span className="text-slate-400">Nome:</span>
                        <span className="text-white ml-2">{selectedOrder.customer_name}</span>
                      </div>
                      <div>
                        <span className="text-slate-400">Email:</span>
                        <span className="text-white ml-2">{selectedOrder.customer_email}</span>
                      </div>
                      <div>
                        <span className="text-slate-400">Telefone:</span>
                        <span className="text-white ml-2">{selectedOrder.customer_phone}</span>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h4 className="text-lg font-medium text-white mb-3">Pagamento</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center justify-between">
                        <span className="text-slate-400">Status:</span>
                        {selectedOrder.payment_status === "confirmed" ? (
                          <span
                            className={`ml-2 px-2 py-1 rounded-full text-xs font-medium ${getPaymentStatusColor(selectedOrder.payment_status)}`}
                          >
                            {paymentLabelByValue[selectedOrder.payment_status] || selectedOrder.payment_status}
                          </span>
                        ) : (
                          <button
                            type="button"
                            disabled={confirmingPaymentId === selectedOrder.id}
                            onClick={() => confirmPayment(selectedOrder)}
                            className={`ml-2 px-2 py-1 rounded-full text-xs font-medium ${getPaymentStatusColor(selectedOrder.payment_status)} hover:opacity-90 disabled:opacity-60`}
                          >
                            {confirmingPaymentId === selectedOrder.id
                              ? "Confirmando..."
                              : paymentLabelByValue[selectedOrder.payment_status] || selectedOrder.payment_status}
                          </button>
                        )}
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-slate-400">Total:</span>
                        <span className="text-white font-medium">{formatCurrency(selectedOrder.total_amount)}</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="text-lg font-medium text-white mb-3">Itens do Pedido</h4>
                  {Array.isArray(selectedOrder.items) && selectedOrder.items.length > 0 ? (
                    <div className="bg-slate-700/50 rounded-lg p-4">
                      {selectedOrder.items.map((item, index) => {
                        const unit = item.unit_price ?? item.product_price ?? 0;
                        const total = item.total_price ?? item.subtotal ?? unit * item.quantity;
                        return (
                          <div
                            key={item.id}
                            className={`flex justify-between items-center ${index > 0 ? "pt-3 border-t border-slate-600" : ""}`}
                          >
                            <div className="min-w-0">
                              <p className="text-white truncate">{item.product_name}</p>
                              <p className="text-slate-400 text-sm">
                                Quantidade: {item.quantity}
                                {item.size ? ` • Tamanho: ${item.size}` : ""}
                              </p>
                            </div>
                            <div className="text-right">
                              <p className="text-white">{formatCurrency(Number(unit || 0))}</p>
                              <p className="text-slate-400 text-sm">{formatCurrency(Number(total || 0))}</p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="text-slate-400 text-sm">Sem itens para exibir</div>
                  )}
                </div>
              </div>

              <div className="mt-6 flex justify-end">
                <button
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 border border-slate-600 text-slate-300 rounded-lg hover:bg-slate-700 transition-colors"
                >
                  Fechar
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
};

export default AdminOrders;

