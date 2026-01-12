## Diagnóstico Geral
- Frontend React/Vite com persistência via Supabase no cliente; carrinho usa cart_id em localStorage.
- Serviços centralizados (adminData/publicData/cart/checkout). Admin mistura Supabase e um cliente Axios legado.
- Pontos de salvamento/atualização principais: AdminProducts/AdminProductForm/AdminCatalogs/AdminCollections/AdminSettings, Carrinho, Finalizar/Checkout.

## Travamentos e Riscos Identificados
- Requisições redundantes no AdminProducts: único useEffect recarrega categorias/coleções junto com produtos a cada filtro.
- Fluxo de salvar no Admin (Catalogs/Collections/Products) força window.location.reload, sem loading adequado e com UX de bloqueio.
- Carrinho: updateQty/remove sem try/catch nem feedback; possibilidade de UI inconsistente em erro de rede.
- Header recalcula contagem em eventos frequentes (focus/visibility/cart:updated); sem debounce pode causar custo excessivo.
- Checkout: order_number derivado de timestamp sem unicidade forte sob concorrência.

## Melhorias Propostas (Implementação)
1. **Padronizar chamadas assíncronas**
   - Criar wrapper de requests com timeout, retries opcionais e tratamento uniforme de erro.
   - Aplicar em serviços de Admin, Carrinho e Checkout.
2. **Refatorar efeitos e carregamentos no Admin**
   - Separar useEffects: carregar categorias/coleções uma vez; produtos apenas quando filtros mudarem.
   - Introduzir estados isLoading/isSaving e desabilitar botões durante operações.
   - Substituir window.location.reload por atualização local de estado após sucesso.
3. **Robustez no Carrinho**
   - Adicionar try/catch e toasts em updateQty/remove; desabilitar interações durante salvamento.
   - Debounce para atualização da contagem do Header; evitar múltiplas leituras encadeadas.
4. **Checkout resiliente**
   - Garantir unicidade de order_number (UUID/sequence); exibir feedback granular de erros e spinner de envio.
   - Confirmar limpeza do carrinho apenas após persistência de pedido e itens.
5. **Consistência e Segurança**
   - Unificar import do supabase client (evitar mistura dinâmica/estática).
   - Fornecer .env.example com SUPABASE_URL, SUPABASE_ANON_KEY, BACKEND_URL (se usado).
   - Revisar políticas RLS e evitar expor dados sensíveis no cliente.

## Entregáveis
- Refatorações nos componentes Admin (Products/Catalogs/Collections/Settings) com loading/erro e sem reload.
- Melhoria no serviço de Carrinho com tratamento de erro e debounces.
- Ajustes no Checkout para unicidade e UX de envio.
- Wrapper de requests reutilizável e .env.example documentado.

Confirma que posso iniciar a implementação dessas melhorias em etapas, começando pelo AdminProducts (efeitos e UX de salvamento), seguido de Carrinho e Checkout?