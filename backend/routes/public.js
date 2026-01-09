const express = require('express');
const supabase = require('../config/supabase');
const router = express.Router();

router.get('/categories', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('categories')
      .select('id,name,slug,description,image_url,is_active,sort_order')
      .order('sort_order', { ascending: true })
      .order('name', { ascending: true });

    if (error) return res.status(500).json({ error: 'Erro ao buscar categorias' });

    const items = (data || []).filter((c) => c.is_active !== false);
    const categoryIds = items.map((c) => c.id).filter(Boolean);

    let coverByCategoryId = {};
    if (categoryIds.length > 0) {
      const selectClauses = [
        'id,category_id,created_at,images:imagens_do_produto(url,is_primary,sort_order)',
        'id,category_id,created_at,images:product_images(url,is_primary,sort_order)',
        'id,category_id,created_at'
      ];

      let products = [];
      let productsError = null;

      for (const selectClause of selectClauses) {
        const res = await supabase
          .from('products')
          .select(selectClause)
          .eq('is_active', true)
          .in('category_id', categoryIds)
          .order('created_at', { ascending: false })
          .limit(200);

        productsError = res.error;
        if (!res.error) {
          products = res.data || [];
          break;
        }
      }

      if (!productsError) {
        for (const product of products || []) {
          const categoryId = product.category_id;
          if (!categoryId || coverByCategoryId[categoryId]) continue;

          const images = Array.isArray(product.images) ? product.images : [];
          const sorted = images.slice().sort((a, b) => {
            const ap = a?.is_primary ? 1 : 0;
            const bp = b?.is_primary ? 1 : 0;
            if (ap !== bp) return bp - ap;
            return (a?.sort_order ?? 0) - (b?.sort_order ?? 0);
          });

          const url = sorted[0]?.url;
          if (url) coverByCategoryId[categoryId] = url;
        }
      }
    }

    res.json({
      categories: items.map((c) => ({
        ...c,
        cover_image_url: c.image_url || coverByCategoryId[c.id] || null,
      })),
    });
  } catch (e) {
    res.status(500).json({ error: 'Erro ao buscar categorias' });
  }
});

router.get('/collections', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('coleções')
      .select('id,name,slug,description,image_url,banner_url,is_active,sort_order')
      .order('sort_order', { ascending: true })
      .order('name', { ascending: true });

    if (error) return res.status(500).json({ error: 'Erro ao buscar coleções' });

    const items = (data || []).filter((c) => c.is_active !== false);
    res.json({ collections: items });
  } catch (e) {
    res.status(500).json({ error: 'Erro ao buscar coleções' });
  }
});

// Rota pública para produtos visíveis
router.get('/products', async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 20, 
      category, 
      collection, 
      search,
      featured,
      new: isNew
    } = req.query;

    const offset = (page - 1) * limit;

    const attempts = [
      `*,category:categories(id,name,slug,description),collection:coleções(id,name,slug,description),images:imagens_do_produto(id,url,alt_text,sort_order,is_primary,storage_path,bucket_name)`,
      `*,category:categories(id,name,slug,description),collection:coleções(id,name,slug,description),images:product_images(id,url,alt_text,sort_order,is_primary,storage_path,bucket_name)`,
      `*,category:categories(id,name,slug,description),collection:collections(id,name,slug,description),images:product_images(id,url,alt_text,sort_order,is_primary,storage_path,bucket_name)`,
      `*,category:categories(id,name,slug,description)`
    ];

    let products = [];
    let count = 0;
    let error = null;

    for (const selectClause of attempts) {
      let q = supabase
        .from('products')
        .select(selectClause, { count: 'exact' })
        .eq('is_active', true)
        .range(offset, offset + limit - 1)
        .order('created_at', { ascending: false });

      if (category && category !== 'all') q = q.eq('category_id', category);
      if (collection && collection !== 'all') q = q.eq('collection_id', collection);
      if (search) q = q.or(`name.ilike.%${search}%,description.ilike.%${search}%`);
      if (featured === 'true') q = q.eq('is_featured', true);
      if (isNew === 'true') q = q.eq('is_new', true);

      const res = await q;
      error = res.error;
      if (!res.error) {
        products = res.data || [];
        count = res.count || 0;
        break;
      }
    }

    if (error) {
      console.error('Erro ao buscar produtos:', error);
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
  } catch (e) {
    console.error('Erro ao buscar produtos:', e);
    res.status(500).json({ error: 'Erro ao buscar produtos' });
  }
});

module.exports = router;
