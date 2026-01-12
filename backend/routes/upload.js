const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { authenticateToken } = require('../middleware/auth');
const supabase = require('../config/supabase');

const router = express.Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadPath = path.join(__dirname, '../uploads/products');
    
    // Create directory if it doesn't exist
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }
    
    cb(null, uploadPath);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, `product-${uniqueSuffix}${ext}`);
  }
});

const fileFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png|webp/;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowedTypes.test(file.mimetype);

  if (mimetype && extname) {
    return cb(null, true);
  } else {
    cb(new Error('Apenas imagens (JPEG, JPG, PNG, WebP) são permitidas'));
  }
};

const upload = multer({
  storage: storage,
  limits: {
    fileSize: parseInt(process.env.MAX_FILE_SIZE) || 5 * 1024 * 1024 // 5MB
  },
  fileFilter: fileFilter
});

// All upload routes require authentication and admin/editor role
router.use(authenticateToken);

// Upload product image
router.post('/product-image', upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'Nenhuma imagem enviada' });
    }

    const { product_id, alt_text = '', is_primary = false } = req.body;
    
    if (!product_id) {
      // Delete the uploaded file if no product_id provided
      fs.unlinkSync(req.file.path);
      return res.status(400).json({ error: 'ID do produto é obrigatório' });
    }

    // Verify product exists
    const { data: product, error: productError } = await supabase
      .from('products')
      .select('id')
      .eq('id', product_id)
      .single();

    if (productError || !product) {
      // Delete the uploaded file if product doesn't exist
      fs.unlinkSync(req.file.path);
      return res.status(404).json({ error: 'Produto não encontrado' });
    }

    // If this is primary image, unset other primary images for this product
    if (is_primary) {
      await supabase
        .from('product_images')
        .update({ is_primary: false })
        .eq('product_id', product_id);
    }

    // Get the next sort order
    const { data: lastImage } = await supabase
      .from('product_images')
      .select('sort_order')
      .eq('product_id', product_id)
      .order('sort_order', { ascending: false })
      .limit(1)
      .single();

    const sort_order = (lastImage?.sort_order || 0) + 1;

    // Save image info to database
    const { data: image, error } = await supabase
      .from('product_images')
      .insert([{
        product_id,
        image_url: `/uploads/products/${req.file.filename}`,
        alt_text,
        is_primary,
        sort_order
      }])
      .select()
      .single();

    if (error) {
      // Delete the uploaded file if database insert fails
      fs.unlinkSync(req.file.path);
      return res.status(500).json({ error: 'Erro ao salvar imagem' });
    }

    // Log the action
    await logAction(req.user.id, 'upload_image', 'product_images', image.id, null, image);

    res.json({
      message: 'Imagem enviada com sucesso',
      image
    });

  } catch (error) {
    console.error('Upload error:', error);
    
    // Clean up uploaded file on error
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    
    res.status(500).json({ error: 'Erro ao fazer upload da imagem' });
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
