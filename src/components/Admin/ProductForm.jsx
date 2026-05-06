import React, { useState } from 'react';
import { Loader2, Upload, X } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { DEFAULT_PRODUCT_CATEGORY, PRODUCT_CATEGORIES } from '../../lib/categories';
import { createProduct, updateProduct } from '../../services/products';

export default function ProductForm({ product, onSuccess, onCancel }) {
  const isEdit = Boolean(product);
  const [form, setForm] = useState({
    name: product?.name || '',
    price: product?.price?.toString() || '',
    category: product?.category || DEFAULT_PRODUCT_CATEGORY,
    image_url: product?.image_url || '',
    available: product?.available !== false,
  });
  const [saving, setSaving] = useState(false);

  const setField = (key, value) => {
    setForm((current) => ({ ...current, [key]: value }));
  };

  const handleImageUpload = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      setField('image_url', String(reader.result));
    };
    reader.readAsDataURL(file);
  };

  const handleSave = async () => {
    if (!form.name.trim()) {
      toast.error('Le nom est requis');
      return;
    }

    if (!form.price || Number.isNaN(Number.parseFloat(form.price))) {
      toast.error('Le prix est invalide');
      return;
    }

    setSaving(true);

    const payload = {
      name: form.name.trim(),
      price: Number.parseFloat(form.price),
      category: form.category,
      image_url: form.image_url,
      available: form.available,
    };

    try {
      if (isEdit) {
        await updateProduct(product.id, payload);
        toast.success('Produit mis à jour');
      } else {
        await createProduct(payload);
        toast.success('Produit créé');
      }

      if (typeof onSuccess === 'function') {
        onSuccess();
      }
    } catch (error) {
      toast.error(error.message || 'Impossible d enregistrer le produit');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="space-y-1.5">
        <Label className="font-inter text-sm">Nom du produit *</Label>
        <Input
          value={form.name}
          onChange={(event) => setField('name', event.target.value)}
          placeholder="Ex: Burger Classic"
          className="bg-secondary border-border font-inter"
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label className="font-inter text-sm">Prix (FC) *</Label>
          <Input
            type="number"
            min="0"
            step="500"
            value={form.price}
            onChange={(event) => setField('price', event.target.value)}
            placeholder="0.00"
            className="bg-secondary border-border font-inter"
          />
        </div>
        <div className="space-y-1.5">
          <Label className="font-inter text-sm">Catégorie</Label>
          <select
            value={form.category}
            onChange={(event) => setField('category', event.target.value)}
            className="flex h-9 w-full items-center justify-between whitespace-nowrap rounded-md border border-border bg-secondary px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring font-inter"
          >
            {PRODUCT_CATEGORIES.map((category) => (
              <option key={category.value} value={category.value}>
                {category.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="space-y-1.5">
        <Label className="font-inter text-sm">Image</Label>
        <div className="flex gap-3 items-center">
          {form.image_url ? (
            <div className="relative w-20 h-20 rounded-xl overflow-hidden flex-shrink-0 border border-border">
              <img src={form.image_url} alt="" className="w-full h-full object-cover" />
              <button
                type="button"
                onClick={() => setField('image_url', '')}
                className="absolute top-1 right-1 w-5 h-5 bg-black/70 rounded-full flex items-center justify-center"
              >
                <X className="w-3 h-3 text-white" />
              </button>
            </div>
          ) : (
            <div className="w-20 h-20 rounded-xl border-2 border-dashed border-border bg-secondary flex items-center justify-center flex-shrink-0">
              <Upload className="w-5 h-5 text-muted-foreground" />
            </div>
          )}
          <div className="flex-1 space-y-2">
            <label className="cursor-pointer">
              <div className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-border bg-secondary font-inter text-sm text-foreground hover:bg-secondary/70 transition-colors">
                <Upload className="w-4 h-4" />
                Choisir un fichier
              </div>
              <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
            </label>
            <Input
              value={form.image_url}
              onChange={(event) => setField('image_url', event.target.value)}
              placeholder="Ou coller une URL"
              className="bg-secondary border-border font-inter text-xs"
            />
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between py-3 px-4 bg-secondary rounded-xl">
        <div>
          <p className="font-inter font-semibold text-foreground text-sm">Disponible</p>
          <p className="font-inter text-xs text-muted-foreground">Visible sur le menu client</p>
        </div>
        <button
          type="button"
          onClick={() => setField('available', !form.available)}
          className={`relative w-12 h-6 rounded-full transition-colors ${form.available ? 'bg-primary' : 'bg-muted'}`}
        >
          <span
            className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-all ${
              form.available ? 'left-7' : 'left-1'
            }`}
          />
        </button>
      </div>

      <div className="flex gap-3 pt-2">
        <Button variant="outline" onClick={onCancel} className="flex-1 border-border font-inter">
          Annuler
        </Button>
        <Button
          onClick={handleSave}
          disabled={saving}
          className="flex-1 bg-primary text-primary-foreground font-inter font-bold"
        >
          {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
          {isEdit ? 'Enregistrer' : 'Creer'}
        </Button>
      </div>
    </div>
  );
}
