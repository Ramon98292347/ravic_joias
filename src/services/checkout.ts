import { supabase } from "@/lib/supabase";
import { cartService, CartItem } from "@/services/cart";

export type CustomerInfo = {
  name: string;
  email: string;
  phone: string;
  paymentMethod: string;
};

type OrderInsert = {
  order_number: string;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  total_amount: number;
  payment_status?: string;
  order_status?: string;
  payment_method?: string;
  notes?: string | null;
};

const tryInsert = async (table: string, payload: any) => {
  const { error } = await supabase.from(table).insert(payload);
  if (error) throw error;
  return true;
};

const tryInsertOrderItems = async (table: string, payloads: any[]) => {
  const { error } = await supabase.from(table).insert(payloads);
  if (error) throw error;
  return true;
};

export const checkoutService = {
  async finalizeOrder(customer: CustomerInfo): Promise<{ order_id: string; order_number: string }> {
    const items: CartItem[] = await cartService.listItems();
    const total = items.reduce((sum, it) => sum + (it.total_price || 0), 0);
    const orderNumber = `RAV-${crypto.randomUUID()}`;

    const orderPayload: OrderInsert = {
      order_number: orderNumber,
      customer_name: customer.name,
      customer_email: customer.email,
      customer_phone: customer.phone,
      total_amount: Number(total.toFixed(2)),
      payment_status: "pending",
      order_status: "pending",
      payment_method: customer.paymentMethod,
      notes: null,
    };

    await tryInsert("pedidos", orderPayload);
    const { data: fetchedOrder, error: fetchErr } = await supabase
      .from("pedidos")
      .select("id")
      .eq("order_number", orderNumber)
      .single();
    if (fetchErr || !fetchedOrder) throw fetchErr || new Error("Falha ao obter pedido");
    const orderId = (fetchedOrder as any).id;

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
      await supabase.from("pedidos").delete().eq("id", orderId);
      throw e;
    }

    const payload = {
      order_id: orderId,
      order_number: orderNumber,
      total_amount: Number(total.toFixed(2)),
      customer: {
        name: customer.name,
        email: customer.email,
        phone: customer.phone,
        paymentMethod: customer.paymentMethod,
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
