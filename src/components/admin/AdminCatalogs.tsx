import React, { useEffect, useState } from "react";
import { Plus, Edit, Trash2, Image } from "lucide-react";
import AdminLayout from "./AdminLayout";
import { fetchCategories } from "@/services/publicData";
import { adminData } from "@/services/adminData";
import { adminAuth } from "@/services/adminAuth";
import { supabase } from "@/lib/supabase";

interface Category {
  id: string;
  name: string;
  slug: string;
  description?: string;
  image_url?: string | null;
  cover_image_url?: string | null;
  is_active: boolean;
  sort_order: number;
}

const AdminCatalogs: React.FC = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    slug: "",
    description: "",
    image_url: "",
    is_active: true,
    sort_order: 0,
  });

  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    try {
      setLoading(true);
      const response = await fetchCategories();
      setCategories(response || []);
    } finally {
      setLoading(false);
    }
  };

  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");
  };

  const handleNameChange = (name: string) => {
    setFormData((prev) => ({ ...prev, name, slug: generateSlug(name) }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const id = editingCategory ? editingCategory.id : null;
    await adminData.upsertCategory(id, formData);
    setShowModal(false);
    setEditingCategory(null);
    resetForm();
    loadCategories();
  };

  const handleEdit = (category: Category) => {
    setEditingCategory(category);
    setFormData({
      name: category.name,
      slug: category.slug,
      description: category.description || "",
      image_url: category.image_url || "",
      is_active: category.is_active,
      sort_order: category.sort_order || 0,
    });
    setShowModal(true);
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Tem certeza que deseja excluir este catálogo?")) return;
    await adminData.deleteCategory(id);
    loadCategories();
  };

  const resetForm = () => {
    setFormData({
      name: "",
      slug: "",
      description: "",
      image_url: "",
      is_active: true,
      sort_order: 0,
    });
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingCategory(null);
    resetForm();
  };

  const parseSupabasePublicUrl = (url: string) => {
    try {
      const u = new URL(url);
      const marker = "/storage/v1/object/public/";
      const idx = u.pathname.indexOf(marker);
      if (idx === -1) return null;
      const rest = u.pathname.slice(idx + marker.length);
      const [bucket, ...pathParts] = rest.split("/");
      const path = pathParts.join("/");
      if (!bucket || !path) return null;
      return { bucket, path };
    } catch {
      return null;
    }
  };

  const handleImageUpload = async (file: File) => {
    try {
      const user = await adminAuth.getCurrentUser();
      if (!user) {
        alert("Faça login para enviar imagem");
        return;
      }
      const bucket = import.meta.env.VITE_STORAGE_BUCKET || "public-assets";

      // Remove imagem anterior do storage se for URL pública do Supabase
      if (editingCategory?.image_url) {
        const info = parseSupabasePublicUrl(editingCategory.image_url);
        if (info) {
          await supabase.storage.from(info.bucket).remove([info.path]);
        }
      }

      const folder = `categories/${formData.slug || Date.now()}`;
      const path = `${folder}/${Date.now()}-${file.name}`;
      const { publicUrl } = await adminData.uploadToStorage(bucket, path, file);
      setFormData({ ...formData, image_url: publicUrl });
    } catch (e) {
      alert("Erro ao enviar imagem do catálogo");
    }
  };

  if (loading) {
    return (
      <AdminLayout title="Catálogos">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-400"></div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title="Catálogos">
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-white">Catálogos</h1>
            <p className="text-slate-400 mt-1">Gerencie as categorias exibidas nos catálogos</p>
          </div>
          <button
            onClick={() => setShowModal(true)}
            className="bg-amber-500 hover:bg-amber-600 text-slate-900 px-4 py-2 rounded-lg font-medium flex items-center gap-2 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Novo Catálogo
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {categories.map((c) => (
            <div key={c.id} className="bg-slate-800 rounded-lg border border-slate-700 overflow-hidden">
              <div className="aspect-video bg-slate-700 relative">
                {c.image_url ? (
                  <img
                    src={c.image_url}
                    alt={c.name}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = "none";
                      (e.target as HTMLImageElement).nextElementSibling?.classList.remove("hidden");
                    }}
                  />
                ) : null}
                <div className={`absolute inset-0 flex items-center justify-center ${c.image_url ? "hidden" : ""}`}>
                  <Image className="w-12 h-12 text-slate-500" />
                </div>
              </div>

              <div className="p-4">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-semibold text-white">{c.name}</h3>
                  <span
                    className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                      c.is_active ? "bg-green-500/20 text-green-400" : "bg-gray-500/20 text-gray-400"
                    }`}
                  >
                    {c.is_active ? "Ativa" : "Inativa"}
                  </span>
                </div>
                {c.description && (
                  <p className="text-slate-400 text-sm mb-3 line-clamp-2">{c.description}</p>
                )}
                <div className="flex justify-between items-center">
                  <span className="text-xs text-slate-500">Ordem: {c.sort_order || 0}</span>
                  <div className="flex gap-2">
                    <button onClick={() => handleEdit(c)} className="text-amber-400 hover:text-amber-300 p-1 transition-colors" title="Editar">
                      <Edit className="w-4 h-4" />
                    </button>
                    <button onClick={() => handleDelete(c.id)} className="text-red-400 hover:text-red-300 p-1 transition-colors" title="Excluir">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {categories.length === 0 && (
          <div className="text-center py-12">
            <Image className="w-12 h-12 text-slate-500 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-white mb-2">Nenhum catálogo encontrado</h3>
            <p className="text-slate-400 mb-4">Comece criando seu primeiro catálogo</p>
            <button
              onClick={() => setShowModal(true)}
              className="bg-amber-500 hover:bg-amber-600 text-slate-900 px-4 py-2 rounded-lg font-medium text-sm transition-colors"
            >
              Criar Primeiro Catálogo
            </button>
          </div>
        )}

        {showModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-slate-800 rounded-lg max-w-md w-full border border-slate-700">
              <div className="flex justify-between items-center p-6 border-b border-slate-700">
                <h2 className="text-xl font-bold text-white">{editingCategory ? "Editar Catálogo" : "Novo Catálogo"}</h2>
                <button onClick={closeModal} className="text-slate-400 hover:text-white transition-colors">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <form onSubmit={handleSubmit} className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Nome *</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => handleNameChange(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Slug *</label>
                  <input
                    type="text"
                    value={formData.slug}
                    onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Descrição</label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                    rows={3}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">URL da Imagem</label>
                  <input
                    type="url"
                    value={formData.image_url}
                    onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                    placeholder="https://exemplo.com/imagem.jpg"
                  />
                  <div className="mt-2">
                    <input type="file" accept="image/*" onChange={(e) => e.target.files && handleImageUpload(e.target.files[0])} />
                    <p className="text-xs text-slate-400 mt-2">Ao selecionar arquivo, a imagem atual será substituída.</p>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Ordem</label>
                  <input
                    type="number"
                    value={formData.sort_order}
                    onChange={(e) => setFormData({ ...formData, sort_order: parseInt(e.target.value) || 0 })}
                    className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                    min="0"
                  />
                </div>
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="is_active"
                    checked={formData.is_active}
                    onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                    className="h-4 w-4 text-amber-600 bg-slate-700 border-slate-600 rounded focus:ring-amber-500"
                  />
                  <label htmlFor="is_active" className="ml-2 block text-sm text-slate-300">Catálogo ativo</label>
                </div>
                <div className="flex gap-3 pt-4">
                  <button type="button" onClick={closeModal} className="flex-1 px-4 py-2 border border-slate-600 rounded-lg text-slate-300 hover:bg-slate-700 transition-colors">
                    Cancelar
                  </button>
                  <button type="submit" className="flex-1 px-4 py-2 bg-amber-500 hover:bg-amber-600 text-slate-900 rounded-lg font-medium transition-colors">
                    {editingCategory ? "Atualizar" : "Criar"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
};

export default AdminCatalogs;
