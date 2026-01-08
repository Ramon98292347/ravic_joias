import { supabase } from "@/lib/supabase";

export type CartItem = {
  id: string;
  cart_id: string;
  product_id: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  customization?: any | null;
  product?: {
    id: string;
    name: string;
    price: number;
    promotional_price?: number | null;
    images?: { url: string; is_primary?: boolean | null; sort_order?: number | null }[] | null;
  } | null;
};

const CART_KEY = "cart_id";

export const cartService = {
  getCartId(): string {
    let cid = localStorage.getItem(CART_KEY);
    if (!cid) {
      cid = crypto.randomUUID();
      localStorage.setItem(CART_KEY, cid);
    }
    return cid;
  },

  async listItems(): Promise<CartItem[]> {
    const cid = this.getCartId();
    const { data, error } = await supabase
      .from("shopping_cart_items")
      .select(
        `id,cart_id,product_id,quantity,unit_price,total_price,customization,
         product:products(id,name,price,promotional_price,images:imagens_do_produto(url,is_primary,sort_order))`
      )
      .eq("cart_id", cid)
      .order("created_at", { ascending: true });
    if (error) return [];
    return (data as any) || [];
  },

  async addItem(productId: string, quantity: number, unitPrice: number, customization?: any): Promise<void> {
    const cid = this.getCartId();
    const total = unitPrice * quantity;
    await supabase.from("shopping_cart_items").insert({
      cart_id: cid,
      product_id: productId,
      quantity,
      unit_price: unitPrice,
      total_price: total,
      customization: customization ?? null,
    });
    try {
      window.dispatchEvent(new CustomEvent("cart:updated"));
    } catch {}
  },

  async updateQuantity(itemId: string, quantity: number): Promise<void> {
    const { data, error } = await supabase
      .from("shopping_cart_items")
      .select("unit_price")
      .eq("id", itemId)
      .single();
    if (error) return;
    const unit = data?.unit_price ?? 0;
    await supabase
      .from("shopping_cart_items")
      .update({ quantity, total_price: unit * quantity })
      .eq("id", itemId);
    try {
      window.dispatchEvent(new CustomEvent("cart:updated"));
    } catch {}
  },

  async removeItem(itemId: string): Promise<void> {
    await supabase.from("shopping_cart_items").delete().eq("id", itemId);
    try {
      window.dispatchEvent(new CustomEvent("cart:updated"));
    } catch {}
  },

  async clearCart(): Promise<void> {
    const cid = this.getCartId();
    await supabase.from("shopping_cart_items").delete().eq("cart_id", cid);
    try {
      window.dispatchEvent(new CustomEvent("cart:updated"));
    } catch {}
  },
};
