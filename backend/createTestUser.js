require('dotenv').config();
const bcrypt = require('bcryptjs');
const supabase = require('./config/supabase');

async function createTestUser() {
  try {
    // Dados do usuário de teste
    const testUser = {
      email: 'admin@ravicjoias.com',
      password: 'admin123',
      name: 'Administrador Teste',
      role: 'admin',
      is_active: true
    };

    // Hash da senha
    const hashedPassword = await bcrypt.hash(testUser.password, 10);

    // Verificar se o usuário já existe
    const { data: existingUser } = await supabase
      .from('admin_users')
      .select('id')
      .eq('email', testUser.email)
      .single();

    if (existingUser) {
      console.log('✅ Usuário de teste já existe:');
      console.log(`📧 Email: ${testUser.email}`);
      console.log(`🔑 Senha: ${testUser.password}`);
      console.log('⚠️  Usuário já cadastrado, não foi necessário criar novo.');
      return;
    }

    // Criar novo usuário
    const { data, error } = await supabase
      .from('admin_users')
      .insert([
        {
          email: testUser.email,
          password: hashedPassword,
          name: testUser.name,
          role: testUser.role,
          is_active: testUser.is_active,
          login_attempts: 0,
          created_at: new Date(),
          updated_at: new Date()
        }
      ])
      .select()
      .single();

    if (error) {
      console.error('❌ Erro ao criar usuário:', error);
      return;
    }

    console.log('✅ Usuário de teste criado com sucesso!');
    console.log(`📧 Email: ${testUser.email}`);
    console.log(`🔑 Senha: ${testUser.password}`);
    console.log(`👤 Nome: ${testUser.name}`);
    console.log(`🎭 Role: ${testUser.role}`);
    console.log('');
    console.log('📝 Use essas credenciais para fazer login no painel admin.');
    console.log('🌐 Acesse: http://localhost:3000/admin/login');

  } catch (error) {
    console.error('❌ Erro:', error);
  } finally {
    process.exit(0);
  }
}

// Executar o script
createTestUser();