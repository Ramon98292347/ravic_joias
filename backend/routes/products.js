const express = require('express');
const { body, validationResult } = require('express-validator');
const supabase = require('../config/supabase');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// All routes require authentication
router.use(authenticateToken);

// Get all products with pagination and filtering
router.get('/', async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 20, 
      category, 
      collection, 
      search, 
      status = 'all',
      featured,
      new: isNew
    } = req.query;

    const offset = (page - 1) * limit;

    let query = supabase
      .from('products')
      .select(`
        *,
        categories(name, slug),
        collections(name, slug),
        product_images(url, alt_text, is_primary, sort_order)
      `, { count: 'exact' })
      .range(offset, offset + limit - 1)
      .order('created_at', { ascending: false });

    // Apply filters
    if (category && category !== 'all') {
      query = query.eq('category_id', category);
    }

    if (collection && collection !== 'all') {
      query = query.eq('collection_id', collection);
    }

    if (search) {
      query = query.or(`name.ilike.%${search}%,description.ilike.%${search}%`);
    }

    if (status === 'active') {
      query = query.eq('is_active', true);
    } else if (status === 'inactive') {
      query = query.eq('is_active', false);
    }

    if (featured === 'true') {
      query = query.eq('is_featured', true);
    }

    if (isNew === 'true') {
      query = query.eq('is_new', true);
    }

    const { data: products, error, count } = await query;

    if (error) {
      return res.status(500).json({ error: 'Erro ao buscar produtos' });
    }

    res.json({
      products: products || [],
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: count || 0,
        pages: Math.ceil((count || 0) / limit)
      }
    });
  } catch (error) {
    console.error('Products error:', error);
    res.status(500).json({ error: 'Erro ao buscar produtos' });
  }
});

// Get single product
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const { data: product, error } = await supabase
      .from('products')
      .select(`
        *,
        categories(name, slug),
        collections(name, slug),
        product_images(*)
      `)
      .eq('id', id)
      .single();

    if (error || !product) {
      return res.status(404).json({ error: 'Produto não encontrado' });
    }

    res.json({ product });
  } catch (error) {
    console.error('Product error:', error);
    res.status(500).json({ error: 'Erro ao buscar produto' });
  }
});

// Create product validation
const productValidation = [
  body('name').notEmpty().withMessage('Nome é obrigatório'),
  body('price').isFloat({ min: 0 }).withMessage('Preço deve ser um número positivo'),
  body('stock').isInt({ min: 0 }).withMessage('Estoque deve ser um número inteiro positivo'),
  body('category_id').optional().isUUID().withMessage('Categoria inválida'),
  body('collection_id').optional().isUUID().withMessage('Coleção inválida')
];

// Create new product
router.post('/', productValidation, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        error: 'Dados inválidos', 
        details: errors.array() 
      });
    }

    const {
      name,
      description,
      short_description,
      category_id,
      collection_id,
      material,
      price,
      promotional_price,
      stock,
      is_active = true,
      is_featured = false,
      is_new = false,
      is_on_sale = false,
      tags,
      meta_title,
      meta_description
    } = req.body;

    // Generate slug from name
    const slug = name.toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');

    const { data: product, error } = await supabase
      .from('products')
      .insert([{
        name,
        slug: `${slug}-${Date.now()}`,
        description,
        short_description,
        category_id,
        collection_id,
        material,
        price,
        promotional_price,
        stock,
        is_active,
        is_featured,
        is_new,
        is_on_sale,
        tags,
        meta_title,
        meta_description
      }])
      .select()
      .single();

    if (error) {
      return res.status(500).json({ error: 'Erro ao criar produto' });
    }

    // Log the action
    await logAction(req.user.id, 'create_product', 'products', product.id, null, product);

    res.status(201).json({
      message: 'Produto criado com sucesso',
      product
    });
  } catch (error) {
    console.error('Create product error:', error);
    res.status(500).json({ error: 'Erro ao criar produto' });
  }
});

// Update product
router.put('/:id', productValidation, async (req, res) => {
  try {
    const { id } = req.params;
    console.log('[products:update] start', {
      productId: id,
      userId: req.user?.id,
      bodyKeys: req.body ? Object.keys(req.body) : [],
    });
    const errors = validationResult(req);
    
    if (!errors.isEmpty()) {
      console.warn('[products:update] validation_error', {
        productId: id,
        userId: req.user?.id,
        details: errors.array(),
      });
      return res.status(400).json({ 
        error: 'Dados inválidos', 
        details: errors.array() 
      });
    }

    // Get old values for logging
    const { data: oldProduct } = await supabase
      .from('products')
      .select('*')
      .eq('id', id)
      .single();

    if (!oldProduct) {
      console.warn('[products:update] not_found', { productId: id, userId: req.user?.id });
      return res.status(404).json({ error: 'Produto não encontrado' });
    }

    const updateData = {};
    const fields = [
      'name', 'description', 'short_description', 'category_id', 'collection_id',
      'material', 'price', 'promotional_price', 'stock', 'is_active',
      'is_featured', 'is_new', 'is_on_sale', 'tags', 'meta_title', 'meta_description'
    ];

    fields.forEach(field => {
      if (req.body[field] !== undefined) {
        updateData[field] = req.body[field];
      }
    });

    updateData.updated_at = new Date();
    console.log('[products:update] update_payload', {
      productId: id,
      userId: req.user?.id,
      updateKeys: Object.keys(updateData),
    });

    const { data: product, error } = await supabase
      .from('products')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('[products:update] supabase_error', { productId: id, userId: req.user?.id, error });
      return res.status(500).json({ error: 'Erro ao atualizar produto' });
    }

    // Log the action
    await logAction(req.user.id, 'update_product', 'products', id, oldProduct, product);

    console.log('[products:update] ok', { productId: id, userId: req.user?.id });
    res.json({
      message: 'Produto atualizado com sucesso',
      product
    });
  } catch (error) {
    console.error('Update product error:', error);
    res.status(500).json({ error: 'Erro ao atualizar produto' });
  }
});

// Delete product (admin only)
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    // Get product for logging
    const { data: product } = await supabase
      .from('products')
      .select('*')
      .eq('id', id)
      .single();

    if (!product) {
      return res.status(404).json({ error: 'Produto não encontrado' });
    }

    // Delete product images first
    await supabase
      .from('product_images')
      .delete()
      .eq('product_id', id);

    // Delete product
    const { error } = await supabase
      .from('products')
      .delete()
      .eq('id', id);

    if (error) {
      return res.status(500).json({ error: 'Erro ao excluir produto' });
    }

    // Log the action
    await logAction(req.user.id, 'delete_product', 'products', id, product, null);

    res.json({ message: 'Produto excluído com sucesso' });
  } catch (error) {
    console.error('Delete product error:', error);
    res.status(500).json({ error: 'Erro ao excluir produto' });
  }
});

// Get categories
router.get('/categories/all', async (req, res) => {
  try {
    const { data: categories, error } = await supabase
      .from('categories')
      .select('*')
      .order('name', { ascending: true });

    if (error) {
      return res.status(500).json({ error: 'Erro ao buscar categorias' });
    }

    res.json({ categories: categories || [] });
  } catch (error) {
    console.error('Categories error:', error);
    res.status(500).json({ error: 'Erro ao buscar categorias' });
  }
});

// Get collections
router.get('/collections/all', async (req, res) => {
  try {
    const { data: collections, error } = await supabase
      .from('collections')
      .select('*')
      .order('name', { ascending: true });

    if (error) {
      return res.status(500).json({ error: 'Erro ao buscar coleções' });
    }

    res.json({ collections: collections || [] });
  } catch (error) {
    console.error('Collections error:', error);
    res.status(500).json({ error: 'Erro ao buscar coleções' });
  }
});

// Helper function to log actions
async function logAction(userId, action, resourceType, resourceId, oldValues, newValues) {
  try {
    await supabase.from('audit_logs').insert([{
      user_id: userId,
      action,
      resource_type: resourceType,
      resource_id: resourceId,
      old_values: oldValues,
      new_values: newValues,
      ip_address: '0.0.0.0', // Should get from req.ip
      user_agent: 'Admin Dashboard' // Should get from req.headers['user-agent']
    }]);
  } catch (error) {
    console.error('Error logging action:', error);
  }
}

module.exports = router;
