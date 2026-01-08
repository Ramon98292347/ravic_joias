CREATE TABLE IF NOT EXISTS public.pedidos (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  order_number VARCHAR(50) UNIQUE NOT NULL,
  customer_name VARCHAR(255) NOT NULL,
  customer_email VARCHAR(255) NOT NULL,
  customer_phone VARCHAR(50),
  total_amount NUMERIC(10,2) NOT NULL,
  payment_status VARCHAR(50) DEFAULT 'pending',
  order_status VARCHAR(50) DEFAULT 'pending',
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.itens_do_pedido (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id UUID NOT NULL REFERENCES public.pedidos(id) ON DELETE CASCADE,
  product_id UUID,
  product_name VARCHAR(255) NOT NULL,
  product_price NUMERIC(10,2) NOT NULL,
  quantity INTEGER NOT NULL,
  subtotal NUMERIC(10,2) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.pedidos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.itens_do_pedido ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS anon_insert_pedidos ON public.pedidos;
CREATE POLICY anon_insert_pedidos ON public.pedidos
  FOR INSERT
  TO anon
  WITH CHECK (true);

DROP POLICY IF EXISTS anon_select_pedidos ON public.pedidos;
CREATE POLICY anon_select_pedidos ON public.pedidos
  FOR SELECT
  TO anon
  USING (true);

DROP POLICY IF EXISTS anon_insert_itens ON public.itens_do_pedido;
CREATE POLICY anon_insert_itens ON public.itens_do_pedido
  FOR INSERT
  TO anon
  WITH CHECK (true);

DROP POLICY IF EXISTS anon_select_itens ON public.itens_do_pedido;
CREATE POLICY anon_select_itens ON public.itens_do_pedido
  FOR SELECT
  TO anon
  USING (true);

CREATE INDEX IF NOT EXISTS idx_pedidos_order_status ON public.pedidos(order_status);
CREATE INDEX IF NOT EXISTS idx_pedidos_created ON public.pedidos(created_at);
CREATE INDEX IF NOT EXISTS idx_itens_pedido_order ON public.itens_do_pedido(order_id);
