const express = require('express');
const { authenticateToken } = require('../middleware/auth');
const supabase = require('../config/supabase');

const router = express.Router();

// All routes require authentication
router.use(authenticateToken);

// Get dashboard stats
router.get('/dashboard', async (req, res) => {
  try {
    // Get today's orders
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const { data: todayOrders, error: todayError } = await supabase
      .from('orders')
      .select('total_amount')
      .gte('created_at', today.toISOString())
      .eq('order_status', 'paid');

    // Get total sales
    const { data: totalSales, error: salesError } = await supabase
      .from('orders')
      .select('total_amount')
      .eq('order_status', 'paid');

    // Get total products
    const { data: totalProducts, error: productsError } = await supabase
      .from('products')
      .select('id', { count: 'exact' });

    // Get products out of stock
    const { data: outOfStockProducts, error: stockError } = await supabase
      .from('products')
      .select('id', { count: 'exact' })
      .lte('stock', 0);

    // Get sales by period (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const { data: salesByPeriod, error: periodError } = await supabase
      .from('orders')
      .select('created_at, total_amount')
      .gte('created_at', thirtyDaysAgo.toISOString())
      .eq('order_status', 'paid')
      .order('created_at', { ascending: true });

    // Get top selling products
    const { data: topProducts, error: topError } = await supabase
      .from('order_items')
      .select('product_id, product_name, product_price, quantity')
      .limit(10);

    // Calculate totals
    const todayTotal = todayOrders?.reduce((sum, order) => sum + parseFloat(order.total_amount), 0) || 0;
    const totalSalesAmount = totalSales?.reduce((sum, order) => sum + parseFloat(order.total_amount), 0) || 0;

    // Process sales by period for chart
    const salesChartData = processSalesData(salesByPeriod || []);

    // Process top products
    const topProductsData = processTopProducts(topProducts || []);

    res.json({
      stats: {
        todaySales: todayTotal,
        todayOrders: todayOrders?.length || 0,
        totalSales: totalSalesAmount,
        totalOrders: totalSales?.length || 0,
        totalProducts: totalProducts?.length || 0,
        outOfStockProducts: outOfStockProducts?.length || 0
      },
      salesChart: salesChartData,
      topProducts: topProductsData
    });

  } catch (error) {
    console.error('Dashboard error:', error);
    res.status(500).json({ error: 'Erro ao carregar dashboard' });
  }
});

// Get all admin users (admin only)
router.get('/users', async (req, res) => {
  try {
    const { data: users, error } = await supabase
      .from('admin_users')
      .select('id, email, name, role, is_active, created_at, last_login')
      .order('created_at', { ascending: false });

    if (error) {
      return res.status(500).json({ error: 'Erro ao buscar usuários' });
    }

    res.json({ users });
  } catch (error) {
    console.error('Users error:', error);
    res.status(500).json({ error: 'Erro ao buscar usuários' });
  }
});

// Create new admin user (admin only)
router.post('/users', async (req, res) => {
  try {
    const { email, name, password, role = 'editor' } = req.body;

    if (!email || !name || !password) {
      return res.status(400).json({ error: 'Email, nome e senha são obrigatórios' });
    }

    // Hash password
    const bcrypt = require('bcryptjs');
    const hashedPassword = await bcrypt.hash(password, 10);

    const { data: user, error } = await supabase
      .from('admin_users')
      .insert([{
        email,
        name,
        password: hashedPassword,
        role,
        is_active: true
      }])
      .select('id, email, name, role, is_active, created_at')
      .single();

    if (error) {
      if (error.code === '23505') { // Unique violation
        return res.status(400).json({ error: 'Email já cadastrado' });
      }
      return res.status(500).json({ error: 'Erro ao criar usuário' });
    }

    // Log the action
    await logAction(req.user.id, 'create_user', 'admin_users', user.id, null, user);

    res.status(201).json({
      message: 'Usuário criado com sucesso',
      user
    });
  } catch (error) {
    console.error('Create user error:', error);
    res.status(500).json({ error: 'Erro ao criar usuário' });
  }
});

// Update admin user (admin only)
router.put('/users/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { email, name, role, is_active } = req.body;

    // Get old values for logging
    const { data: oldUser } = await supabase
      .from('admin_users')
      .select('*')
      .eq('id', id)
      .single();

    if (!oldUser) {
      return res.status(404).json({ error: 'Usuário não encontrado' });
    }

    const updateData = {};
    if (email) updateData.email = email;
    if (name) updateData.name = name;
    if (role) updateData.role = role;
    if (typeof is_active === 'boolean') updateData.is_active = is_active;
    updateData.updated_at = new Date();

    const { data: user, error } = await supabase
      .from('admin_users')
      .update(updateData)
      .eq('id', id)
      .select('id, email, name, role, is_active, updated_at')
      .single();

    if (error) {
      return res.status(500).json({ error: 'Erro ao atualizar usuário' });
    }

    // Log the action
    await logAction(req.user.id, 'update_user', 'admin_users', id, oldUser, user);

    res.json({
      message: 'Usuário atualizado com sucesso',
      user
    });
  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({ error: 'Erro ao atualizar usuário' });
  }
});

// Delete admin user (admin only)
router.delete('/users/:id', async (req, res) => {
  try {
    const { id } = req.params;

    // Get user for logging
    const { data: user } = await supabase
      .from('admin_users')
      .select('*')
      .eq('id', id)
      .single();

    if (!user) {
      return res.status(404).json({ error: 'Usuário não encontrado' });
    }

    // Prevent self-deletion
    if (id === req.user.id) {
      return res.status(400).json({ error: 'Não é possível excluir seu próprio usuário' });
    }

    const { error } = await supabase
      .from('admin_users')
      .delete()
      .eq('id', id);

    if (error) {
      return res.status(500).json({ error: 'Erro ao excluir usuário' });
    }

    // Log the action
    await logAction(req.user.id, 'delete_user', 'admin_users', id, user, null);

    res.json({ message: 'Usuário excluído com sucesso' });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({ error: 'Erro ao excluir usuário' });
  }
});

// Helper functions
function processSalesData(sales) {
  const dailySales = {};
  
  sales.forEach(sale => {
    const date = new Date(sale.created_at).toLocaleDateString('pt-BR');
    if (!dailySales[date]) {
      dailySales[date] = 0;
    }
    dailySales[date] += parseFloat(sale.total_amount);
  });

  return Object.entries(dailySales).map(([date, amount]) => ({
    date,
    amount: Math.round(amount * 100) / 100
  })).sort((a, b) => new Date(a.date) - new Date(b.date));
}

function processTopProducts(items) {
  const productSales = {};
  
  items.forEach(item => {
    if (!productSales[item.product_id]) {
      productSales[item.product_id] = {
        name: item.product_name,
        quantity: 0,
        revenue: 0
      };
    }
    productSales[item.product_id].quantity += item.quantity;
    productSales[item.product_id].revenue += parseFloat(item.product_price) * item.quantity;
  });

  return Object.entries(productSales)
    .map(([id, data]) => ({
      id,
      name: data.name,
      quantity: data.quantity,
      revenue: Math.round(data.revenue * 100) / 100
    }))
    .sort((a, b) => b.quantity - a.quantity)
    .slice(0, 5);
}

async function logAction(userId, action, resourceType, resourceId, oldValues, newValues) {
  try {
    await supabase.from('audit_logs').insert([{
      user_id: userId,
      action,
      resource_type: resourceType,
      resource_id: resourceId,
      old_values: oldValues,
      new_values: newValues,
      ip_address: '0.0.0.0', // You should get this from req.ip
      user_agent: 'Admin Dashboard' // You should get this from req.headers['user-agent']
    }]);
  } catch (error) {
    console.error('Error logging action:', error);
  }
}

// Carousel Routes
// Get carousel items
router.get('/carousel', async (req, res) => {
  try {
    console.log('Fetching carousel items...');
    
    // Get carousel items with product details - simplified query
    const { data: carouselItems, error: carouselError } = await supabase
      .from('carousel_items')
      .select('*')
      .order('sort_order', { ascending: true });

    if (carouselError) {
      console.error('Carousel items error:', carouselError);
      throw carouselError;
    }

    console.log('Carousel items found:', carouselItems?.length || 0);

    // Get product details for each item
    const itemsWithProducts = [];
    if (carouselItems && carouselItems.length > 0) {
      for (const item of carouselItems) {
        const { data: product, error: productError } = await supabase
          .from('products')
          .select('id, name, price, promotional_price, images')
          .eq('id', item.product_id)
          .single();

        if (productError) {
          console.error(`Error fetching product ${item.product_id}:`, productError);
          continue;
        }

        itemsWithProducts.push({
          ...item,
          product: product
        });
      }
    }

    // Get carousel settings
    const { data: settings, error: settingsError } = await supabase
      .from('settings')
      .select('key, value')
      .in('key', ['carousel_autoplay', 'carousel_interval']);

    if (settingsError) {
      console.error('Settings error:', settingsError);
      throw settingsError;
    }

    const autoplay = settings?.find(s => s.key === 'carousel_autoplay')?.value === 'true';
    const interval = parseInt(settings?.find(s => s.key === 'carousel_interval')?.value) || 4000;
    const transition_time = interval / 1000; // Convert to seconds

    console.log('Sending carousel response:', {
      itemsCount: itemsWithProducts.length,
      auto_play: autoplay,
      transition_time: transition_time
    });

    res.json({
      items: itemsWithProducts || [],
      auto_play: autoplay,
      transition_time: transition_time
    });
  } catch (error) {
    console.error('Error fetching carousel items:', error);
    res.status(500).json({ error: 'Erro ao buscar itens do carrossel', details: error.message });
  }
});

// Update carousel items
router.put('/carousel', async (req, res) => {
  try {
    const { items } = req.body;
    const userId = req.user.id;

    // Start transaction
    const { data: existingItems, error: fetchError } = await supabase
      .from('carousel_items')
      .select('id');

    if (fetchError) throw fetchError;

    // Delete existing items
    if (existingItems && existingItems.length > 0) {
      const { error: deleteError } = await supabase
        .from('carousel_items')
        .delete()
        .in('id', existingItems.map(item => item.id));

      if (deleteError) throw deleteError;
    }

    // Insert new items
    if (items && items.length > 0) {
      const carouselItems = items.map(item => ({
        product_id: item.product_id,
        sort_order: item.sort_order,
        is_active: item.is_active
      }));

      const { error: insertError } = await supabase
        .from('carousel_items')
        .insert(carouselItems);

      if (insertError) throw insertError;
    }

    // Log action
    await logAction(userId, 'update', 'carousel', null, null, { items });

    res.json({ message: 'Carrossel atualizado com sucesso' });
  } catch (error) {
    console.error('Error updating carousel items:', error);
    res.status(500).json({ error: 'Erro ao atualizar carrossel' });
  }
});

module.exports = router;
