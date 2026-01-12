// Script de teste para verificar conexão com Supabase
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Configuração do Supabase (vamos pegar do .env)
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

console.log('🧪 Testando conexão com Supabase...');
console.log('📍 URL:', supabaseUrl);
console.log('🔑 Anon Key:', supabaseAnonKey ? 'Presente' : 'Faltando');

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Configuração do Supabase incompleta!');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testQueries() {
  try {
    // Test 1: Verificar tabela products
    console.log('\n📋 Testando tabela products...');
    const { data: products, error: productsError } = await supabase
      .from('products')
      .select('id,name,price,is_active')
      .eq('is_active', true)
      .limit(5);
    
    console.log('✅ Products:', products);
    console.log('❌ Products Error:', productsError);

    // Test 2: Verificar tabela itens_do_carrossel
    console.log('\n📋 Testando tabela itens_do_carrossel...');
    const { data: carousel, error: carouselError } = await supabase
      .from('itens_do_carrossel')
      .select('*')
      .eq('is_active', true)
      .limit(5);
    
    console.log('✅ Carousel:', carousel);
    console.log('❌ Carousel Error:', carouselError);

    // Test 3: Verificar tabela imagens_do_produto
    console.log('\n📋 Testando tabela imagens_do_produto...');
    const { data: images, error: imagesError } = await supabase
      .from('imagens_do_produto')
      .select('*')
      .limit(5);
    
    console.log('✅ Images:', images);
    console.log('❌ Images Error:', imagesError);

    // Test 4: Query complexa como usada no código
    console.log('\n📋 Testando query complexa...');
    const { data: complex, error: complexError } = await supabase
      .from("products")
      .select(
        "id,name,price,promotional_price,is_new,category:categories(id,name,slug),images:imagens_do_produto(url,is_primary,sort_order)"
      )
      .eq("is_active", true)
      .order("created_at", { ascending: false })
      .range(0, 9);
    
    console.log('✅ Complex Query:', complex);
    console.log('❌ Complex Error:', complexError);

  } catch (error) {
    console.error('❌ Erro geral:', error);
  }
}

testQueries().then(() => {
  console.log('\n🏁 Teste finalizado!');
});