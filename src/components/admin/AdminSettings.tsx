import React, { useState, useEffect } from 'react';
import AdminLayout from './AdminLayout';
import { adminData } from '@/services/adminData';
import { adminAuth } from '@/services/adminAuth';

interface Settings {
  free_shipping: boolean;
  free_shipping_minimum: number;
  whatsapp_number: string;
  contact_email: string;
  facebook_url: string;
  instagram_url: string;
  main_banner_text: string;
  main_banner_subtitle: string;
  main_banner_image: File | null;
  main_banner_image_url: string;
}

const AdminSettings: React.FC = () => {
  const [settings, setSettings] = useState<Settings>({
    free_shipping: false,
    free_shipping_minimum: 0,
    whatsapp_number: '',
    contact_email: '',
    facebook_url: '',
    instagram_url: '',
    main_banner_text: '',
    main_banner_subtitle: '',
    main_banner_image: null,
    main_banner_image_url: '',
  });
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const rows = await adminData.listSettings();
      const get = (k: string) => rows.find((r) => r.key === k)?.value ?? '';
      setSettings({
        free_shipping: (rows.find(r => r.key === 'free_shipping')?.value === 'true') || false,
        free_shipping_minimum: parseFloat(get('free_shipping_minimum')) || 0,
        whatsapp_number: get('whatsapp_number'),
        contact_email: get('contact_email'),
        facebook_url: get('facebook_url'),
        instagram_url: get('instagram_url'),
        main_banner_text: get('main_banner_text'),
        main_banner_subtitle: get('main_banner_subtitle'),
        main_banner_image: null,
        main_banner_image_url: get('main_banner_image_url'),
      });
    } catch (error) {
      console.error('Error loading settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;
    
    setSettings(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    setSettings(prev => ({
      ...prev,
      main_banner_image: file,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      // Upload banner image if provided
      let bannerUrl = settings.main_banner_image_url;
      if (settings.main_banner_image) {
        const bucket = import.meta.env.VITE_STORAGE_BUCKET || 'product-images';
        const path = `settings/banner/${Date.now()}-${settings.main_banner_image.name}`;
        const { publicUrl } = await adminData.uploadToStorage(bucket, path, settings.main_banner_image);
        bannerUrl = publicUrl;
      }

      const user = await adminAuth.getCurrentUser().catch(() => null);
      const updaterId = user?.id || null;
      await adminData.upsertSettings([
        { key: 'free_shipping', value: String(settings.free_shipping), type: 'boolean' },
        { key: 'free_shipping_minimum', value: String(settings.free_shipping_minimum), type: 'decimal' },
        { key: 'whatsapp_number', value: settings.whatsapp_number, type: 'string' },
        { key: 'contact_email', value: settings.contact_email, type: 'string' },
        { key: 'facebook_url', value: settings.facebook_url, type: 'string' },
        { key: 'instagram_url', value: settings.instagram_url, type: 'string' },
        { key: 'main_banner_text', value: settings.main_banner_text, type: 'string' },
        { key: 'main_banner_subtitle', value: settings.main_banner_subtitle, type: 'string' },
        { key: 'main_banner_image_url', value: bannerUrl, type: 'string' },
      ], updaterId);
      alert('Configurações salvas com sucesso!');
    } catch (error) {
      console.error('Error saving settings:', error);
      alert('Erro ao salvar configurações. Tente novamente.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <AdminLayout title="Configurações">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-400"></div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title="Configurações">
      <div className="max-w-4xl mx-auto">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Shipping Settings */}
          <div className="bg-slate-800 rounded-lg p-6 border border-slate-700">
            <h3 className="text-lg font-semibold text-white mb-4">Configurações de Frete</h3>
            
            <div className="space-y-4">
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  name="free_shipping"
                  checked={settings.free_shipping}
                  onChange={handleInputChange}
                  className="rounded border-slate-600 text-amber-400 focus:ring-amber-400"
                />
                <span className="text-slate-300">Frete grátis ativado</span>
              </label>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Valor mínimo para frete grátis
                </label>
                <input
                  type="number"
                  name="free_shipping_minimum"
                  value={settings.free_shipping_minimum}
                  onChange={handleInputChange}
                  min="0"
                  step="0.01"
                  className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-amber-400"
                />
              </div>
            </div>
          </div>

          {/* Contact Settings */}
          <div className="bg-slate-800 rounded-lg p-6 border border-slate-700">
            <h3 className="text-lg font-semibold text-white mb-4">Informações de Contato</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  WhatsApp da Loja
                </label>
                <input
                  type="text"
                  name="whatsapp_number"
                  value={settings.whatsapp_number}
                  onChange={handleInputChange}
                  placeholder="(00) 00000-0000"
                  className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-amber-400"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Email de Contato
                </label>
                <input
                  type="email"
                  name="contact_email"
                  value={settings.contact_email}
                  onChange={handleInputChange}
                  placeholder="contato@petrleo.com"
                  className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-amber-400"
                />
              </div>
            </div>
          </div>

          {/* Social Media */}
          <div className="bg-slate-800 rounded-lg p-6 border border-slate-700">
            <h3 className="text-lg font-semibold text-white mb-4">Redes Sociais</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Facebook
                </label>
                <input
                  type="url"
                  name="facebook_url"
                  value={settings.facebook_url}
                  onChange={handleInputChange}
                  placeholder="https://facebook.com/petrleo"
                  className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-amber-400"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Instagram
                </label>
                <input
                  type="url"
                  name="instagram_url"
                  value={settings.instagram_url}
                  onChange={handleInputChange}
                  placeholder="https://www.instagram.com/ravicjoias"
                  className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-amber-400"
                />
              </div>
            </div>
          </div>

          {/* Main Banner */}
          <div className="bg-slate-800 rounded-lg p-6 border border-slate-700">
            <h3 className="text-lg font-semibold text-white mb-4">Banner Principal</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Texto Principal
                </label>
                <input
                  type="text"
                  name="main_banner_text"
                  value={settings.main_banner_text}
                  onChange={handleInputChange}
                  placeholder="Bem-vindo à Petr Leo"
                  className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-amber-400"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Subtítulo
                </label>
                <input
                  type="text"
                  name="main_banner_subtitle"
                  value={settings.main_banner_subtitle}
                  onChange={handleInputChange}
                  placeholder="Joias exclusivas e sofisticadas"
                  className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-amber-400"
                />
              </div>
            </div>

            <div className="mt-4">
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Imagem do Banner
              </label>
              <input
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-amber-400"
              />
              {settings.main_banner_image_url && (
                <div className="mt-2">
                  <img
                    src={settings.main_banner_image_url}
                    alt="Banner atual"
                    className="w-full max-w-md rounded-lg"
                  />
                </div>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end space-x-4">
            <button
              type="button"
              onClick={loadSettings}
              className="px-6 py-2 border border-slate-600 text-slate-300 rounded-lg hover:bg-slate-700 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-6 py-2 bg-amber-400 hover:bg-amber-500 text-slate-900 font-medium rounded-lg transition-colors disabled:opacity-50"
            >
              {saving ? 'Salvando...' : 'Salvar Configurações'}
            </button>
          </div>
        </form>
      </div>
    </AdminLayout>
  );
};

export default AdminSettings;
