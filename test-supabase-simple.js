// Script de teste simplificado para verificar Supabase
import { supabase } from './src/lib/supabase.js';

async function testQueries() {
  console.log('🧪 Testando conexão com Supabase...');
  
  try {
    // Test 1: Verificar tabela products
    console.log('\n📋 Testando tabela products...');
    const { data: products, error: productsError } = await supabase
      .from('products')
      .select('id,name,price,is_active')
      .eq('is_active', true)
      .limit(5);
    
    console.log('✅ Products encontrados:', products?.length || 0);
    console.log('❌ Products Error:', productsError);
    
    if (products && products.length > 0) {
      console.log('📦 Exemplo de produto:', products[0]);
    }

    // Test 2: Verificar tabela itens_do_carrossel
    console.log('\n📋 Testando tabela itens_do_carrossel...');
    const { data: carousel, error: carouselError } = await supabase
      .from('itens_do_carrossel')
      .select('*')
      .eq('is_active', true)
      .limit(5);
    
    console.log('✅ Carousel encontrados:', carousel?.length || 0);
    console.log('❌ Carousel Error:', carouselError);

    // Test 3: Query complexa como usada no código
    console.log('\n📋 Testando query complexa...');
    const { data: complex, error: complexError } = await supabase
      .from("products")
      .select(
        "id,name,price,promotional_price,is_new,category:categories(id,name,slug),images:imagens_do_produto(url,is_primary,sort_order)"
      )
      .eq("is_active", true)
      .order("created_at", { ascending: false })
      .range(0, 9);
    
    console.log('✅ Complex Query encontrados:', complex?.length || 0);
    console.log('❌ Complex Error:', complexError);
    
    if (complex && complex.length > 0) {
      console.log('📦 Exemplo de produto complexo:', complex[0]);
    }

    // Test 4: Verificar estrutura da tabela
    console.log('\n📋 Verificando estrutura das tabelas...');
    const { data: tableInfo, error: tableError } = await supabase
      .from('products')
      .select('*')
      .limit(1);
    
    if (tableInfo && tableInfo.length > 0) {
      console.log('📊 Colunas disponíveis:', Object.keys(tableInfo[0]));
    }

  } catch (error) {
    console.error('❌ Erro geral:', error);
  }
}

testQueries().then(() => {
  console.log('\n🏁 Teste finalizado!');
});