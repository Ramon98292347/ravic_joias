import { supabase } from "@/lib/supabase";
import { cartService, CartItem } from "@/services/cart";

export type CustomerInfo = {
  name: string;
  email: string;
  phone: string;
};

type OrderInsert = {
  order_number: string;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  total_amount: number;
  payment_status?: string;
  order_status?: string;
  notes?: string | null;
};

const tryInsert = async (table: string, payload: any) => {
  const { data, error } = await supabase.from(table).insert(payload).select().single();
  if (error) throw error;
  return data;
};

const tryInsertOrderItems = async (table: string, payloads: any[]) => {
  const { data, error } = await supabase.from(table).insert(payloads).select();
  if (error) throw error;
  return data;
};

export const checkoutService = {
  async finalizeOrder(customer: CustomerInfo): Promise<{ order_id: string; order_number: string }> {
    const items: CartItem[] = await cartService.listItems();
    const total = items.reduce((sum, it) => sum + (it.total_price || 0), 0);
    const orderNumber = `RAV-${Date.now()}`;

    const orderPayload: OrderInsert = {
      order_number: orderNumber,
      customer_name: customer.name,
      customer_email: customer.email,
      customer_phone: customer.phone,
      total_amount: Number(total.toFixed(2)),
      payment_status: "pending",
      order_status: "pending",
      notes: null,
    };

    let orderRow: any;
    try {
      orderRow = await tryInsert("pedidos", orderPayload);
    } catch (e) {
      orderRow = await tryInsert("orders", orderPayload);
    }

    const orderId = orderRow.id;

    const orderItemsPayload = items.map((it) => ({
      order_id: orderId,
      product_id: it.product_id,
      product_name: it.product?.name || "Produto",
      product_price: it.unit_price,
      quantity: it.quantity,
      size: it.customization?.size ?? null,
      subtotal: it.total_price,
    }));

    try {
      await tryInsertOrderItems("itens_do_pedido", orderItemsPayload);
    } catch (e) {
      await tryInsertOrderItems("order_items", orderItemsPayload);
    }

    const payload = {
      order_id: orderId,
      order_number: orderNumber,
      total_amount: Number(total.toFixed(2)),
      customer: {
        name: customer.name,
        email: customer.email,
        phone: customer.phone,
      },
      items: items.map((it) => ({
        product_id: it.product_id,
        name: it.product?.name || "Produto",
        quantity: it.quantity,
        unit_price: it.unit_price,
        total_price: it.total_price,
        size: it.customization?.size ?? null,
        image_url:
          it.product?.images?.find((img) => img?.is_primary)?.url ||
          it.product?.images?.[0]?.url ||
          null,
      })),
      order_public_url: `${window.location.origin}/carrinho`,
      site_url: window.location.origin,
    };

    try {
      await fetch("https://n8n-n8n.ynlng8.easypanel.host/webhook/revic-joias", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
    } catch {
      // Ignore webhook errors; order is still saved
    }

    await cartService.clearCart();

    return { order_id: orderId, order_number: orderNumber };
  },
};
