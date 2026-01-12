// Script de debug para verificar produtos no Supabase
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_KEY;

console.log('🧪 Iniciando debug de produtos...');
console.log('📍 URL:', supabaseUrl);
console.log('🔑 Anon Key:', supabaseAnonKey ? 'Presente' : 'Faltando');

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function debugProducts() {
  console.log('\n=== 🔍 TESTE 1: Query Simples ===');
  try {
    const { data, error, count } = await supabase
      .from('products')
      .select('*', { count: 'exact' })
      .eq('is_active', true)
      .range(0, 4);
    
    console.log('✅ Dados:', data);
    console.log('📊 Total:', count);
    console.log('❌ Erro:', error);
  } catch (err) {
    console.log('❌ Exceção:', err.message);
  }

  console.log('\n=== 🔍 TESTE 2: Query com Categoria ===');
  try {
    const { data, error } = await supabase
      .from('products')
      .select('*, category:categories(id,name,slug)')
      .eq('is_active', true)
      .range(0, 4);
    
    console.log('✅ Dados com categoria:', data);
    console.log('❌ Erro:', error);
  } catch (err) {
    console.log('❌ Exceção:', err.message);
  }

  console.log('\n=== 🔍 TESTE 3: Query com Imagens ===');
  try {
    const { data, error } = await supabase
      .from('products')
      .select('*, images:imagens_do_produto(url,is_primary,sort_order)')
      .eq('is_active', true)
      .range(0, 4);
    
    console.log('✅ Dados com imagens:', data);
    console.log('❌ Erro:', error);
  } catch (err) {
    console.log('❌ Exceção:', err.message);
  }

  console.log('\n=== 🔍 TESTE 4: Verificar Tabelas ===');
  try {
    // Verificar se as tabelas existem
    const tables = ['products', 'categories', 'imagens_do_produto', 'itens_do_carrossel'];
    
    for (const table of tables) {
      try {
        const { count, error } = await supabase
          .from(table)
          .select('*', { count: 'exact', head: true });
        
        console.log(`📊 ${table}: ${count} registros`);
        if (error) console.log(`❌ Erro em ${table}:`, error.message);
      } catch (err) {
        console.log(`❌ Tabela ${table} não existe ou erro:`, err.message);
      }
    }
  } catch (err) {
    console.log('❌ Exceção ao verificar tabelas:', err.message);
  }

  console.log('\n=== 🔍 TESTE 5: Verificar Estrutura ===');
  try {
    // Tentar ver a estrutura da tabela products
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .limit(1);
    
    if (data && data.length > 0) {
      console.log('📋 Colunas disponíveis:', Object.keys(data[0]));
    } else {
      console.log('⚠️ Nenhum dado encontrado para análise de estrutura');
    }
    
    if (error) console.log('❌ Erro:', error);
  } catch (err) {
    console.log('❌ Exceção:', err.message);
  }
}

// Executar o debug
debugProducts().then(() => {
  console.log('\n🏁 Debug finalizado!');
}).catch(err => {
  console.log('❌ Erro geral:', err.message);
});