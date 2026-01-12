require('dotenv').config();
const bcrypt = require('bcryptjs');

// Senha criptografada para "admin123"
const hashedPassword = '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi';

console.log('📝 USUÁRIO DE TESTE CRIADO MANUALMENTE');
console.log('═══════════════════════════════════════');
console.log('');
console.log('📧 Email: admin@ravicjoias.com');
console.log('🔑 Senha: admin123');
console.log('👤 Nome: Administrador');
console.log('🎭 Role: admin');
console.log('');
console.log('🌐 Acesse: http://localhost:3000/admin/login');
console.log('');
console.log('📋 INSTRUÇÕES PARA SUPABASE:');
console.log('1. Acesse o dashboard do Supabase');
console.log('2. Vá para SQL Editor');
console.log('3. Cole e execute o seguinte comando:');
console.log('');
console.log('INSERT INTO admin_users (email, password, name, role, is_active) VALUES');
console.log(`('admin@ravicjoias.com', '${hashedPassword}', 'Administrador', 'admin', true);`);
console.log('');
console.log('⚠️  Certifique-se de executar o script setup-database.sql primeiro para criar a tabela.');