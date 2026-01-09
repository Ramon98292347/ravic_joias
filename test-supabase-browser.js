// Teste direto de query do Supabase no navegador
// Abra o console do navegador (F12) e cole este código

(async function testSupabaseQuery() {
  console.log('🧪 Iniciando teste de query do Supabase...');
  
  try {
    // Test 1: Query simples de produtos
    console.log('\n📋 Testando query simples de produtos...');
    const { data: products, error: productsError } = await supabase
      .from('products')
      .select('id,name,price,is_active')
      .eq('is_active', true)
      .limit(5);
    
    console.log('✅ Produtos encontrados:', products?.length || 0);
    console.log('❌ Erro:', productsError);
    
    if (products && products.length > 0) {
      console.log('📦 Primeiro produto:', products[0]);
    }

    // Test 2: Query com relacionamentos
    console.log('\n📋 Testando query com relacionamentos...');
    const { data: complex, error: complexError } = await supabase
      .from('products')
      .select('id,name,price,category:categories(id,name)')
      .eq('is_active', true)
      .limit(3);
    
    console.log('✅ Produtos complexos:', complex?.length || 0);
    console.log('❌ Erro complexo:', complexError);

    // Test 3: Verificar se há dados no banco
    console.log('\n📋 Verificando total de produtos...');
    const { count, error: countError } = await supabase
      .from('products')
      .select('*', { count: 'exact', head: true });
    
    console.log('📊 Total de produtos:', count);
    console.log('❌ Erro na contagem:', countError);

  } catch (error) {
    console.error('❌ Erro geral:', error);
  }
  
  console.log('\n🏁 Teste finalizado!');
})();