import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Plus, Search, RefreshCw } from 'lucide-react';

import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import PaginationControls from '../components/ui/pagination-controls';
import { Skeleton } from '../components/ui/skeleton';
import ProductRow from '../components/Admin/ProductRow';
import ProductForm from '../components/Admin/ProductForm';
import { PRODUCT_CATEGORIES } from '../lib/categories';
import { getPageCount, paginate } from '../lib/pagination';
import { getCachedProducts, listProducts } from '../services/products';

const CATEGORIES = [{ value: 'tous', label: 'Tous' }, ...PRODUCT_CATEGORIES];
const PAGE_SIZE = 10;

export default function AdminProduits() {
  const [search, setSearch] = useState('');
  const [cat, setCat] = useState('tous');
  const [page, setPage] = useState(1);
  const [creating, setCreating] = useState(false);
  const [products, setProducts] = useState(() => getCachedProducts());
  const [isLoading, setIsLoading] = useState(() => getCachedProducts().length === 0);
  const [isFetching, setIsFetching] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const loadProducts = React.useCallback(async () => {
    try {
      setErrorMessage('');
      const data = await listProducts();
      setProducts(data);
    } catch (error) {
      setProducts([]);
      setErrorMessage(error.message || 'Impossible de charger les produits.');
    } finally {
      setIsLoading(false);
      setIsFetching(false);
    }
  }, []);

  React.useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      loadProducts();
    }, 0);
    window.addEventListener('products-updated', loadProducts);

    return () => {
      window.clearTimeout(timeoutId);
      window.removeEventListener('products-updated', loadProducts);
    };
  }, [loadProducts]);

  const filtered = products.filter((product) => {
    const matchCat = cat === 'tous' || product.category === cat;
    const matchSearch =
      !search.trim() || product.name.toLowerCase().includes(search.toLowerCase());
    return matchCat && matchSearch;
  });
  const pageCount = getPageCount(filtered.length, PAGE_SIZE);
  const currentPage = Math.min(page, pageCount);
  const visibleProducts = paginate(filtered, currentPage, PAGE_SIZE);

  const handleCreateSuccess = () => {
    setCreating(false);
    loadProducts();
  };

  return (
    <div className="min-h-screen bg-background font-inter">
      <header className="sticky top-0 z-50 bg-background/95 backdrop-blur-md border-b border-border">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center gap-3">
          <Link
            to="/admin"
            className="w-9 h-9 rounded-xl bg-secondary flex items-center justify-center hover:bg-secondary/70 transition-colors flex-shrink-0"
          >
            <ArrowLeft className="w-4 h-4 text-foreground" />
          </Link>
          <div className="flex-1 min-w-0">
            <h1 className="font-inter font-bold text-foreground text-base leading-tight">
              Gestion des produits
            </h1>
            <p className="font-inter text-xs text-muted-foreground">
              {products.length} produits au total
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="icon"
              onClick={() => {
                setIsFetching(true);
                loadProducts();
              }}
              disabled={isFetching}
              className="border-border w-9 h-9"
            >
              <RefreshCw className={`w-4 h-4 ${isFetching ? 'animate-spin' : ''}`} />
            </Button>
            <Button
              onClick={() => setCreating(true)}
              className="bg-primary text-primary-foreground font-inter font-bold h-9 px-4 text-sm"
            >
              <Plus className="w-4 h-4 mr-1.5" />
              Ajouter
            </Button>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 py-4 space-y-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            value={search}
            onChange={(event) => {
              setSearch(event.target.value);
              setPage(1);
            }}
            placeholder="Rechercher un produit..."
            className="pl-9 bg-secondary border-border font-inter"
          />
        </div>

        <div className="bg-secondary w-full flex overflow-x-auto h-auto p-1 gap-1 rounded-lg">
          {CATEGORIES.map((category) => (
            <button
              key={category.value}
              type="button"
              onClick={() => {
                setCat(category.value);
                setPage(1);
              }}
              className={`font-inter text-xs py-2 px-3 whitespace-nowrap capitalize flex-shrink-0 rounded-md transition-colors ${
                cat === category.value
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {category.label}
            </button>
          ))}
        </div>

        <div className="flex items-center justify-between text-xs font-inter text-muted-foreground">
          <span>{filtered.length} produit{filtered.length !== 1 ? 's' : ''}</span>
          <span>
            {filtered.filter((product) => product.available).length} disponibles •{' '}
            {filtered.filter((product) => !product.available).length} indisponibles
          </span>
        </div>

        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3, 4, 5].map((item) => (
              <Skeleton key={item} className="h-20 w-full rounded-2xl" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20">
            <p className="font-inter text-muted-foreground text-sm">
              {errorMessage || 'Aucun produit trouvé'}
            </p>
            <button
              type="button"
              onClick={() => setCreating(true)}
              className="mt-3 text-primary font-inter font-semibold text-sm hover:underline"
            >
              + Ajouter un produit
            </button>
          </div>
        ) : (
          <div className="space-y-3 pb-8">
            {visibleProducts.map((product) => (
              <ProductRow key={product.id} product={product} onChanged={loadProducts} />
            ))}
            <PaginationControls page={currentPage} pageCount={pageCount} onPageChange={setPage} />
          </div>
        )}
      </div>

      {creating && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4">
          <div className="bg-card border border-border max-w-lg w-[calc(100vw-2rem)] rounded-2xl p-6">
            <h2 className="font-inter font-bold text-foreground mb-4">Nouveau produit</h2>
            <ProductForm onSuccess={handleCreateSuccess} onCancel={() => setCreating(false)} />
          </div>
        </div>
      )}
    </div>
  );
}
