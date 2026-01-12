## Hipóteses
- Estado por origin corrompido (localStorage: cart_id/admin_token) impedindo carregamento.
- Backend Express com CORS restrito a portas específicas.
- Múltiplos dev servers causando instabilidade em HMR/WS.

## Verificações
1. Inspecionar Network e Console no cenário que “não carrega”.
2. Limpar Storage do origin fixo e recarregar para validar estado.
3. Conferir VITE_API_URL e a config de CORS no backend.

## Correções
1. Backend: padronizar CORS para incluir localhost/127.0.0.1 na porta de dev; uso de lista segura em dev.
2. Frontend:
   - Renovar admin_token ao receber 401 e redirecionar claramente.
   - Regenerar cart_id quando listItems falhar por estado inválido.
   - Expor feedback de erros em carregamentos (Admin/Carrinho/Home).
3. Ambiente: garantir apenas um dev server ativo na porta definida.

## Entregáveis
- Ajustes de CORS no backend.
- Validações de estado e recuperação no frontend.
- Logs e feedbacks visuais em pontos críticos.

Posso começar aplicando CORS no backend, depois validar e ajustar a recuperação de estado no frontend (cart/admin), e por fim adicionar instrumentação de erros.