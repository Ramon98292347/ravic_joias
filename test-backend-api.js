// Teste direto via backend API
async function testBackendAPI() {
  console.log('🧪 Testando API do backend...');
  
  try {
    // Test 1: Verificar se o backend está rodando
    console.log('\n📋 Testando conexão com backend...');
    const healthResponse = await fetch('http://localhost:3001/health');
    console.log('✅ Health check:', healthResponse.status);
    
    // Test 2: Testar produtos via API
    console.log('\n📋 Testando produtos via API...');
    const productsResponse = await fetch('http://localhost:3001/api/products');
    console.log('✅ Products API status:', productsResponse.status);
    
    if (productsResponse.ok) {
      const productsData = await productsResponse.json();
      console.log('📦 Quantidade de produtos:', productsData.products?.length || 0);
      if (productsData.products && productsData.products.length > 0) {
        console.log('📦 Exemplo de produto:', productsData.products[0]);
      }
    }

    // Test 3: Testar carrossel via API
    console.log('\n📋 Testando carrossel via API...');
    const carouselResponse = await fetch('http://localhost:3001/api/carousel');
    console.log('✅ Carousel API status:', carouselResponse.status);
    
    if (carouselResponse.ok) {
      const carouselData = await carouselResponse.json();
      console.log('📋 Quantidade de itens do carrossel:', carouselData.length || 0);
      if (carouselData.length > 0) {
        console.log('📋 Exemplo de item do carrossel:', carouselData[0]);
      }
    }

  } catch (error) {
    console.error('❌ Erro ao testar API:', error);
  }
}

testBackendAPI().then(() => {
  console.log('\n🏁 Teste da API finalizado!');
});