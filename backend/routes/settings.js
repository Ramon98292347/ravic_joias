const express = require('express');
const { body, validationResult } = require('express-validator');
const { authenticateToken } = require('../middleware/auth');
const supabase = require('../config/supabase');

const router = express.Router();

// All routes require authentication
router.use(authenticateToken);

// Get all settings
router.get('/', async (req, res) => {
  try {
    const { data: settings, error } = await supabase
      .from('settings')
      .select('*')
      .order('key', { ascending: true });

    if (error) {
      return res.status(500).json({ error: 'Erro ao buscar configurações' });
    }

    // Group settings by category
    const groupedSettings = groupSettingsByCategory(settings || []);

    res.json({ settings: groupedSettings });
  } catch (error) {
    console.error('Settings error:', error);
    res.status(500).json({ error: 'Erro ao buscar configurações' });
  }
});

// Get public settings (for frontend)
router.get('/public', async (req, res) => {
  try {
    const { data: settings, error } = await supabase
      .from('settings')
      .select('key, value, type')
      .eq('is_public', true)
      .order('key', { ascending: true });

    if (error) {
      return res.status(500).json({ error: 'Erro ao buscar configurações públicas' });
    }

    // Convert to key-value object
    const publicSettings = settings?.reduce((acc, setting) => {
      acc[setting.key] = parseSettingValue(setting.value, setting.type);
      return acc;
    }, {}) || {};

    res.json({ settings: publicSettings });
  } catch (error) {
    console.error('Public settings error:', error);
    res.status(500).json({ error: 'Erro ao buscar configurações públicas' });
  }
});

// Update multiple settings
router.put('/bulk', 
  body('settings').isArray().withMessage('Settings deve ser um array'),
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ 
          error: 'Dados inválidos', 
          details: errors.array() 
        });
      }

      const { settings } = req.body;
      const updatedSettings = [];

      for (const setting of settings) {
        const { key, value } = setting;
        
        if (!key || value === undefined) {
          continue;
        }

        // Get old value for logging
        const { data: oldSetting } = await supabase
          .from('settings')
          .select('*')
          .eq('key', key)
          .single();

        const { data: updatedSetting, error } = await supabase
          .from('settings')
          .update({ 
            value: value.toString(),
            updated_at: new Date()
          })
          .eq('key', key)
          .select()
          .single();

        if (!error && updatedSetting) {
          updatedSettings.push(updatedSetting);
          
          // Log the action
          await logAction(req.user.id, 'update_setting', 'settings', key, oldSetting, updatedSetting);
        }
      }

      res.json({
        message: `${updatedSettings.length} configurações atualizadas com sucesso`,
        settings: updatedSettings
      });
    } catch (error) {
      console.error('Bulk update settings error:', error);
      res.status(500).json({ error: 'Erro ao atualizar configurações' });
    }
  }
);

// Update single setting
router.put('/:key',
  body('value').exists().withMessage('Valor é obrigatório'),
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ 
          error: 'Dados inválidos', 
          details: errors.array() 
        });
      }

      const { key } = req.params;
      const { value } = req.body;

      // Get old value for logging
      const { data: oldSetting } = await supabase
        .from('settings')
        .select('*')
        .eq('key', key)
        .single();

      if (!oldSetting) {
        return res.status(404).json({ error: 'Configuração não encontrada' });
      }

      const { data: setting, error } = await supabase
        .from('settings')
        .update({ 
          value: value.toString(),
          updated_at: new Date()
        })
        .eq('key', key)
        .select()
        .single();

      if (error) {
        return res.status(500).json({ error: 'Erro ao atualizar configuração' });
      }

      // Log the action
      await logAction(req.user.id, 'update_setting', 'settings', key, oldSetting, setting);

      res.json({
        message: 'Configuração atualizada com sucesso',
        setting
      });
    } catch (error) {
      console.error('Update setting error:', error);
      res.status(500).json({ error: 'Erro ao atualizar configuração' });
    }
  }
);

// Create new setting (admin only)
router.post('/', 
  [
    body('key').notEmpty().withMessage('Chave é obrigatória'),
    body('value').exists().withMessage('Valor é obrigatório'),
    body('type').isIn(['string', 'number', 'boolean']).withMessage('Tipo inválido'),
    body('description').optional().isString(),
    body('is_public').optional().isBoolean()
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ 
          error: 'Dados inválidos', 
          details: errors.array() 
        });
      }

      const { key, value, type, description, is_public = false } = req.body;

      const { data: setting, error } = await supabase
        .from('settings')
        .insert([{
          key,
          value: value.toString(),
          type,
          description,
          is_public
        }])
        .select()
        .single();

      if (error) {
        if (error.code === '23505') { // Unique violation
          return res.status(400).json({ error: 'Chave já existe' });
        }
        return res.status(500).json({ error: 'Erro ao criar configuração' });
      }

      // Log the action
      await logAction(req.user.id, 'create_setting', 'settings', key, null, setting);

      res.status(201).json({
        message: 'Configuração criada com sucesso',
        setting
      });
    } catch (error) {
      console.error('Create setting error:', error);
      res.status(500).json({ error: 'Erro ao criar configuração' });
    }
  }
);

// Delete setting (admin only)
router.delete('/:key', async (req, res) => {
  try {
    const { key } = req.params;

    // Get setting for logging
    const { data: setting } = await supabase
      .from('settings')
      .select('*')
      .eq('key', key)
      .single();

    if (!setting) {
      return res.status(404).json({ error: 'Configuração não encontrada' });
    }

    const { error } = await supabase
      .from('settings')
      .delete()
      .eq('key', key);

    if (error) {
      return res.status(500).json({ error: 'Erro ao excluir configuração' });
    }

    // Log the action
    await logAction(req.user.id, 'delete_setting', 'settings', key, setting, null);

    res.json({ message: 'Configuração excluída com sucesso' });
  } catch (error) {
    console.error('Delete setting error:', error);
    res.status(500).json({ error: 'Erro ao excluir configuração' });
  }
});

// Helper functions
function groupSettingsByCategory(settings) {
  const categories = {
    'store': [],
    'contact': [],
    'social': [],
    'shipping': [],
    'appearance': [],
    'other': []
  };

  settings.forEach(setting => {
    if (setting.key.includes('store_') || setting.key.includes('home_')) {
      categories.store.push(setting);
    } else if (setting.key.includes('contact_') || setting.key.includes('email') || setting.key.includes('phone')) {
      categories.contact.push(setting);
    } else if (setting.key.includes('social_') || setting.key.includes('instagram') || setting.key.includes('facebook')) {
      categories.social.push(setting);
    } else if (setting.key.includes('shipping_') || setting.key.includes('frete')) {
      categories.shipping.push(setting);
    } else if (setting.key.includes('appearance_') || setting.key.includes('carousel_')) {
      categories.appearance.push(setting);
    } else {
      categories.other.push(setting);
    }
  });

  return categories;
}

function parseSettingValue(value, type) {
  switch (type) {
    case 'number':
      return parseFloat(value) || 0;
    case 'boolean':
      return value === 'true';
    default:
      return value;
  }
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
      ip_address: '0.0.0.0', // Should get from req.ip
      user_agent: 'Admin Dashboard' // Should get from req.headers['user-agent']
    }]);
  } catch (error) {
    console.error('Error logging action:', error);
  }
}

module.exports = router;
