## Escopo
- Corrigir travamentos e redundâncias de carregamento/salvamento no Admin, Carrinho e Checkout.
- Padronizar estados de loading/erro e remover reloads forçados.
- Otimizar eventos do Header e garantir unicidade/robustez no Checkout.

## Intervenções por Área
### AdminProducts.tsx
- Separar efeitos: carregar categorias/coleções no mount; carregar produtos só quando filtros mudarem.
- Adicionar isLoading para lista de produtos e indicadores visuais; evitar requisições paralelas.
- Remover qualquer reload indireto e atualizar estado local após salvar/editar.

### AdminProductForm.tsx
- Introduzir isSaving com desabilitação de botões durante upload/salvamento.
- Substituir window.location.reload por atualização do item/retorno para listagem via navegação/estado.

### AdminCatalogs.tsx e AdminCollections.tsx
- Remover window.location.reload no submit; atualizar estado local (optimistic update) e exibir feedback de sucesso/erro.
- Adicionar isSaving/isLoading e desabilitar ações enquanto persiste.

### AdminSettings.tsx
- Padronizar isSaving e tratamento de erro, mantendo consistência com demais telas.

### Header.tsx
- Debounce/throttle para atualização da contagem do carrinho em eventos (focus/visibility/cart:updated).
- Garantir limpeza de listeners e evitar múltiplas leituras encadeadas.

### Carrinho.tsx e services/cart.ts
- Envolver updateQty/remove em try/catch com feedback ao usuário e desabilitar controles durante salvamento.
- Garantir que a lista recarregue somente após sucesso; em erro, reverter UI.

### Checkout (services/checkout.ts e Finalizar.tsx)
- Gerar order_number com UUID/sequence para unicidade.
- Spinner/estado de envio; feedback granular de erro.
- Limpar carrinho apenas após persistência de pedido e itens; em falha na criação de itens, remover pedido criado (rollback manual).

### Utilitário de Requests
- Criar wrapper utilitário para padronizar timeout/retries e normalizar erros das chamadas Supabase.
- Aplicar gradualmente nos serviços (adminData, publicData, cart, checkout).

## Validação
- Rodar build e testes manuais nas telas afetadas.
- Verificar ausência de reloads e fluidez de UX em Admin, Carrinho e Checkout.
- Monitorar console e rede para confirmar redução de requisições redundantes.

## Entregáveis
- Refatorações nos arquivos citados com estados de loading/erro padronizados.
- Debounce no Header e robustez no Carrinho/Checkout.
- Wrapper de requests reutilizável e documentação mínima das variáveis no .env.example.

Se aprovado, inicio pela refatoração do AdminProducts (efeitos e loading), seguido de Carrinho, Checkout e Header, aplicando o utilitário de requests quando necessário.