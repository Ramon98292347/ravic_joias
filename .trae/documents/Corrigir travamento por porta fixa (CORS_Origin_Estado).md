## O que vamos corrigir
- CORS do backend para aceitar seu origin de desenvolvimento de forma segura.
- Comportamento de estado por origin: limpar/renovar admin_token/cart_id em erros e expor feedbacks.
- Instrumentar carregamentos para não falharem silenciosamente (especialmente Carrinho).

## Passos
1. Backend (server.js): substituir whitelist fixa por validação de origem dinâmica em dev (localhost/127.0.0.1 com qualquer porta), mantendo restrito em produção via FRONTEND_URL.
2. Frontend (cartService): tratar erro em listItems, exibir feedback e, se necessário, regenerar cart_id quando falhar por estado inválido.
3. Frontend (adminService): já remove token em 401; adicionaremos mensagens claras nas telas Admin quando 401 ocorrer.
4. Verificações: limpar storage do origin problemático, rodar em porta fixa e validar que os dados carregam repetidamente.

## Entregáveis
- server.js com CORS robusto em dev.
- cartService com recuperação/feedback em falhas.
- Mensagens de erro visíveis nas páginas afetadas.

Posso aplicar agora essas alterações e validar em sua porta fixa preferida.