import React, { useState } from 'react';
import { Pencil, Trash2, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

import ProductForm from './ProductForm';
import { getCategoryLabel } from '../../lib/categories';
import { formatCurrency } from '../../lib/currency';
import { getProductImageUrl } from '../../lib/productImages';
import { deleteProduct, updateProduct } from '../../services/products';

export default function ProductRow({ product, onChanged }) {
  const [editing, setEditing] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [togglingAvail, setTogglingAvail] = useState(false);

  const handleToggle = async () => {
    setTogglingAvail(true);
    try {
      await updateProduct(product.id, {
        name: product.name,
        price: product.price,
        category: product.category,
        image_url: product.image_url,
        available: !product.available,
      });
      if (typeof onChanged === 'function') {
        onChanged();
      }
      toast.success(product.available ? 'Produit desactive' : 'Produit active');
    } catch (error) {
      toast.error(error.message || 'Impossible de modifier la disponibilite');
    } finally {
      setTogglingAvail(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm(`Supprimer "${product.name}" ?`)) return;
    setDeleting(true);
    try {
      await deleteProduct(product.id);
      if (typeof onChanged === 'function') {
        onChanged();
      }
      toast.success('Produit supprime');
    } catch (error) {
      toast.error(error.message || 'Impossible de supprimer le produit');
    } finally {
      setDeleting(false);
    }
  };

  const handleEditSuccess = () => {
    setEditing(false);
    if (typeof onChanged === 'function') {
      onChanged();
    }
  };

  return (
    <>
      <div className="bg-card border border-border rounded-2xl p-3 flex items-center gap-3">
        <div className="w-14 h-14 rounded-xl overflow-hidden flex-shrink-0 bg-secondary">
          <img src={getProductImageUrl(product.image_url)} alt={product.name} className="w-full h-full object-cover" />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="font-inter font-semibold text-foreground text-sm truncate">{product.name}</p>
            <span
              className={`text-xs font-inter px-2 py-0.5 rounded-full font-medium ${
                product.available ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'
              }`}
            >
              {product.available ? 'Disponible' : 'Indisponible'}
            </span>
          </div>
          <div className="flex items-center gap-3 mt-0.5">
            <span className="font-inter font-bold text-primary text-sm">{formatCurrency(product.price)}</span>
            <span className="font-inter text-xs text-muted-foreground">{getCategoryLabel(product.category)}</span>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-shrink-0">
          <button
            type="button"
            onClick={handleToggle}
            disabled={togglingAvail}
            className={`relative w-10 h-5 rounded-full transition-colors ${
              product.available ? 'bg-primary' : 'bg-muted'
            } ${togglingAvail ? 'opacity-50' : ''}`}
          >
            <span
              className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-all ${
                product.available ? 'left-5' : 'left-0.5'
              }`}
            />
          </button>

          <button
            type="button"
            onClick={() => setEditing(true)}
            className="w-9 h-9 rounded-xl bg-secondary hover:bg-secondary/70 flex items-center justify-center transition-colors"
          >
            <Pencil className="w-4 h-4 text-foreground" />
          </button>

          <button
            type="button"
            onClick={handleDelete}
            disabled={deleting}
            className="w-9 h-9 rounded-xl bg-destructive/10 hover:bg-destructive/20 flex items-center justify-center transition-colors"
          >
            {deleting ? (
              <Loader2 className="w-4 h-4 text-destructive animate-spin" />
            ) : (
              <Trash2 className="w-4 h-4 text-destructive" />
            )}
          </button>
        </div>
      </div>

      {editing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4">
          <div className="bg-card border border-border max-w-lg w-[calc(100vw-2rem)] rounded-2xl p-6">
            <h2 className="font-inter font-bold text-foreground mb-4">Modifier le produit</h2>
            <ProductForm product={product} onSuccess={handleEditSuccess} onCancel={() => setEditing(false)} />
          </div>
        </div>
      )}
    </>
  );
}
