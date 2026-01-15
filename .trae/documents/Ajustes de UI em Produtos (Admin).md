## Decisões
- Cards como padrão e opção de alternar para Tabela (desktop).
- Visualização em **modal central** (já usado e simples), full-screen em mobile.
- Edição **inline no modal** com botões "Atualizar" e "Excluir".
- Preview **1:1 estrito (aspect-square)** com `object-cover`.
- Mostrar metadados úteis (Coleção e Tags) quando existirem.

## Mudanças nos Arquivos
- AdminProductForm.tsx
  - Tornar o preview quadrado nos blocos de preview de imagem: [AdminProductForm.tsx:L313-L325](file:///c:/Users/ramon/OneDrive/Documentos/Ramon/Projeto%20trae/petr-leo-dourado-main/src/components/admin/AdminProductForm.tsx#L313-L325)
  - Usar container `aspect-square` + imagem `w-full h-full object-cover` para novo e edição.
- AdminProducts.tsx
  - Preview do modal quadrado: [AdminProducts.tsx:L626-L630](file:///c:/Users/ramon/OneDrive/Documentos/Ramon/Projeto%20trae/petr-leo-dourado-main/src/components/admin/AdminProducts.tsx#L626-L630)
  - Substituir tabela por **grid de cards clicáveis** (desktop também), reusando o card mobile: [AdminProducts.tsx:L440-L502](file:///c:/Users/ramon/OneDrive/Documentos/Ramon/Projeto%20trae/petr-leo-dourado-main/src/components/admin/AdminProducts.tsx#L440-L502)
  - Adicionar estado `viewMode` ("cards" | "table") com toggle. Padrão: cards.
  - Card inteiro abre `openEditModal(product)`; botões "Editar" e "Excluir" permanecem.
  - No modal, exibir coleção e tags se disponíveis.

## Testes/Validação
- Abrir /admin/products e /admin/products/new e verificar preview 1:1.
- Testar cards clicáveis abrindo modal; executar Atualizar e Excluir.
- Alternar entre Cards e Tabela em desktop.
- Verificar comportamento em mobile (modal full-screen) e produtos sem imagem (placeholder).

## Riscos e Mitigação
- Usuários acostumados com tabela: manter alternância para tabela.
- Produtos sem imagem: usar placeholder com aspect-square e `object-cover`.

Aprovo aplicar essas mudanças e depois rodar/validar no navegador. Confirma para eu executar.