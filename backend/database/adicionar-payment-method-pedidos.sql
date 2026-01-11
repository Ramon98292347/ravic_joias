-- Adicionar coluna payment_method à tabela pedidos
ALTER TABLE public.pedidos 
ADD COLUMN IF NOT EXISTS payment_method VARCHAR(100);

-- Atualizar pedidos existentes com valor padrão
UPDATE public.pedidos 
SET payment_method = 'pending' 
WHERE payment_method IS NULL;

-- Criar índice para melhor performance
CREATE INDEX IF NOT EXISTS idx_pedidos_payment_method ON public.pedidos(payment_method);