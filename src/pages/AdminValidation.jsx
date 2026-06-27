import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, CheckCircle2, Loader2, Plus, RefreshCw, Search, ShoppingBag, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import PaginationControls from '../components/ui/pagination-controls';
import { Skeleton } from '../components/ui/skeleton';
import { formatCurrency } from '../lib/currency';
import { getPageCount, paginate } from '../lib/pagination';
import { getProductImageUrl } from '../lib/productImages';
import { createClient, listClients } from '../services/clients';
import { cancelPendingOrder, listPendingOrders } from '../services/pendingOrders';
import { validatePendingOrder } from '../services/orders';

const PAYMENT_TYPES = [
  { value: 'cash', label: 'Cash' },
  { value: 'mobile_money', label: 'Mobile money' },
  { value: 'card', label: 'Carte' },
  { value: 'credit', label: 'Crédit' },
];
const PAGE_SIZE = 6;
const DATE_TIME_FORMATTER = new Intl.DateTimeFormat('fr-FR', {
  dateStyle: 'short',
  timeStyle: 'short',
});

function PendingOrderCard({ pendingOrder, clients, onValidated, onClientCreated }) {
  const [clientId, setClientId] = useState('');
  const [creatingClient, setCreatingClient] = useState(false);
  const [clientName, setClientName] = useState('');
  const [clientPhone, setClientPhone] = useState('');
  const [clientWorkplace, setClientWorkplace] = useState('');
  const [clientSearch, setClientSearch] = useState('');
  const [paymentType, setPaymentType] = useState('cash');
  const [paidAmount, setPaidAmount] = useState('');
  const [saving, setSaving] = useState(false);
  const [canceling, setCanceling] = useState(false);

  const total = useMemo(() => pendingOrder.total || 0, [pendingOrder.total]);
  const effectivePaidAmount = paymentType === 'credit' ? Number(paidAmount || 0) : total;
  const debt = Math.max(0, total - effectivePaidAmount);

  const filteredClients = useMemo(() => {
    const query = clientSearch.trim().toLowerCase();
    if (!query) return clients;

    return clients.filter((client) =>
      [client.name, client.phone, client.client_code, client.workplace]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(query)),
    );
  }, [clientSearch, clients]);

  const selectedClient = clients.find((client) => client.id === clientId);

  const handleCreateClient = async () => {
    if (!clientName.trim()) {
      toast.error('Le nom du client est requis');
      return;
    }

    if (!clientPhone.trim()) {
      toast.error("Le téléphone permet d'identifier le client");
      return;
    }

    setSaving(true);
    try {
      const client = await createClient({
        name: clientName,
        phone: clientPhone,
        workplace: clientWorkplace,
      });
      await onClientCreated();
      setClientId(client.id);
      setCreatingClient(false);
      setClientName('');
      setClientPhone('');
      setClientWorkplace('');
      toast.success('Client créé');
    } catch (error) {
      toast.error(error.message || 'Impossible de créer le client');
    } finally {
      setSaving(false);
    }
  };

  const handleValidate = async () => {
    if (!clientId) {
      toast.error('Sélectionnez ou créez un client');
      return;
    }

    if (paymentType === 'credit' && effectivePaidAmount >= total) {
      toast.error('Une vente à crédit doit garder une dette');
      return;
    }

    if (effectivePaidAmount < 0) {
      toast.error('Le montant payé est invalide');
      return;
    }

    setSaving(true);
    try {
      await validatePendingOrder({
        pendingOrderId: pendingOrder.id,
        clientId,
        paymentType,
        paidAmount: effectivePaidAmount,
        items: pendingOrder.items,
      });
      toast.success('Commande validée');
      onValidated();
    } catch (error) {
      toast.error(error.message || 'Impossible de valider la commande');
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = async () => {
    if (!window.confirm('Annuler ce panier en attente ? Cette action supprimera la fausse commande.')) {
      return;
    }

    setCanceling(true);
    try {
      await cancelPendingOrder(pendingOrder.id);
      toast.success('Commande annulée');
      onValidated();
    } catch (error) {
      toast.error(error.message || "Impossible d'annuler la commande");
    } finally {
      setCanceling(false);
    }
  };

  return (
    <article className="bg-card border border-border rounded-2xl p-4 space-y-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="font-inter font-bold text-foreground text-sm">
            Panier #{pendingOrder.id.slice(-6).toUpperCase()}
          </h2>
          <p className="font-inter text-xs text-muted-foreground mt-1">
            {DATE_TIME_FORMATTER.format(new Date(pendingOrder.created_at))}
          </p>
        </div>
        <p className="font-inter font-black text-primary text-xl">{formatCurrency(total)}</p>
      </div>

      <div className="space-y-2">
        {pendingOrder.items.map((item) => (
          <div key={item.product_id} className="flex items-center gap-3 bg-secondary/50 rounded-xl p-2">
            <div className="w-12 h-12 rounded-lg overflow-hidden bg-secondary flex-shrink-0">
              <img
                src={getProductImageUrl(item.product?.image_url)}
                alt={item.product?.name || 'Produit'}
                className="w-full h-full object-cover"
              />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-inter font-semibold text-foreground text-sm truncate">
                {item.product?.name || 'Produit introuvable'}
              </p>
              <p className="font-inter text-xs text-muted-foreground">
                {item.quantity} x {formatCurrency(item.product?.price || 0)}
              </p>
            </div>
            <p className="font-inter font-bold text-foreground text-sm">
              {formatCurrency(item.line_total)}
            </p>
          </div>
        ))}
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        <div className="space-y-2">
          <label className="font-inter text-sm text-muted-foreground">Client</label>
          {!creatingClient ? (
            <div className="space-y-2">
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    value={clientSearch}
                    onChange={(event) => setClientSearch(event.target.value)}
                    placeholder="Rechercher nom, téléphone, code, bureau..."
                    className="pl-9 bg-secondary border-border font-inter"
                  />
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={() => setCreatingClient(true)}
                  className="border-border"
                >
                  <Plus className="w-4 h-4" />
                </Button>
              </div>

              <div className="max-h-52 overflow-y-auto rounded-xl border border-border bg-secondary/40 p-1 space-y-1">
                {filteredClients.length === 0 ? (
                  <p className="font-inter text-xs text-muted-foreground text-center py-4">
                    Aucun client trouvé
                  </p>
                ) : (
                  filteredClients.map((client) => (
                    <button
                      key={client.id}
                      type="button"
                      onClick={() => setClientId(client.id)}
                      className={`w-full text-left rounded-lg px-3 py-2 transition-colors ${
                        clientId === client.id
                          ? 'bg-primary text-primary-foreground'
                          : 'hover:bg-secondary text-foreground'
                      }`}
                    >
                      <span className="font-inter font-bold text-sm block">{client.name}</span>
                      <span className="font-inter text-xs opacity-80 block">
                        {client.phone || 'Sans téléphone'} · {client.client_code || 'Nouveau'}{client.workplace ? ` · ${client.workplace}` : ''}
                      </span>
                    </button>
                  ))
                )}
              </div>

              {selectedClient ? (
                <div className="rounded-xl bg-primary/10 border border-primary/20 px-3 py-2">
                  <p className="font-inter text-xs text-primary font-bold">Client sélectionné</p>
                  <p className="font-inter text-sm text-foreground">
                    {selectedClient.name} · {selectedClient.phone || 'sans téléphone'} · {selectedClient.client_code}
                  </p>
                </div>
              ) : null}
            </div>
          ) : (
            <div className="space-y-2">
              <Input
                value={clientName}
                onChange={(event) => setClientName(event.target.value)}
                placeholder="Nom du client"
                className="bg-secondary border-border font-inter"
              />
              <Input
                value={clientPhone}
                onChange={(event) => setClientPhone(event.target.value)}
                placeholder="Téléphone du client"
                className="bg-secondary border-border font-inter"
              />
              <Input
                value={clientWorkplace}
                onChange={(event) => setClientWorkplace(event.target.value)}
                placeholder="Bureau / entreprise optionnel"
                className="bg-secondary border-border font-inter"
              />
              <div className="flex gap-2">
                <Button
                  type="button"
                  onClick={handleCreateClient}
                  disabled={saving}
                  className="flex-1 bg-primary text-primary-foreground font-inter font-bold"
                >
                  Créer
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setCreatingClient(false)}
                  className="flex-1 border-border font-inter"
                >
                  Annuler
                </Button>
              </div>
            </div>
          )}
        </div>

        <div className="space-y-2">
          <label className="font-inter text-sm text-muted-foreground">Paiement</label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {PAYMENT_TYPES.map((type) => (
              <button
                key={type.value}
                type="button"
                onClick={() => setPaymentType(type.value)}
                className={`h-10 rounded-xl border font-inter text-xs font-bold transition-colors ${
                  paymentType === type.value
                    ? 'border-primary bg-primary text-primary-foreground'
                    : 'border-border bg-secondary text-muted-foreground hover:text-foreground'
                }`}
              >
                {type.label}
              </button>
            ))}
          </div>

          {paymentType === 'credit' ? (
            <Input
              type="number"
              min="0"
              max={Math.max(total - 1, 0)}
              step="500"
              value={paidAmount}
              onChange={(event) => setPaidAmount(event.target.value)}
              placeholder="Montant payé"
              className="bg-secondary border-border font-inter"
            />
          ) : (
            <div className="h-10 rounded-md border border-border bg-secondary px-3 flex items-center font-inter text-sm text-muted-foreground">
              Payé automatiquement: {formatCurrency(total)}
            </div>
          )}
        </div>
      </div>

      <div className="flex flex-col gap-3 bg-secondary/50 rounded-xl p-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="font-inter text-xs text-muted-foreground">
          Payé: <span className="font-bold text-green-400">{formatCurrency(effectivePaidAmount)}</span>
          {' '}· Dette:{' '}
          <span className="font-bold text-red-400">{formatCurrency(debt)}</span>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row">
          <Button
            type="button"
            variant="outline"
            onClick={handleCancel}
            disabled={saving || canceling}
            className="border-destructive/40 bg-destructive/10 text-destructive hover:bg-destructive/20 font-inter font-bold rounded-xl"
          >
            {canceling ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Trash2 className="w-4 h-4 mr-2" />}
            Annuler
          </Button>
          <Button
            onClick={handleValidate}
            disabled={saving || canceling || total <= 0}
            className="bg-primary text-primary-foreground font-inter font-bold rounded-xl"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <CheckCircle2 className="w-4 h-4 mr-2" />}
            Valider
          </Button>
        </div>
      </div>
    </article>
  );
}

export default function AdminValidation() {
  const [pendingOrders, setPendingOrders] = useState([]);
  const [clients, setClients] = useState([]);
  const [page, setPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [isFetching, setIsFetching] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const loadData = React.useCallback(async () => {
    try {
      setErrorMessage('');
      const [pendingData, clientsData] = await Promise.all([listPendingOrders(), listClients()]);
      setPendingOrders(pendingData);
      setClients(clientsData);
    } catch (error) {
      setPendingOrders([]);
      setClients([]);
      setErrorMessage(error.message || 'Impossible de charger les validations.');
    } finally {
      setIsLoading(false);
      setIsFetching(false);
    }
  }, []);

  const reloadClients = React.useCallback(async () => {
    const clientsData = await listClients();
    setClients(clientsData);
  }, []);

  useEffect(() => {
    const timeoutId = window.setTimeout(loadData, 0);
    window.addEventListener('pending-orders-updated', loadData);

    return () => {
      window.clearTimeout(timeoutId);
      window.removeEventListener('pending-orders-updated', loadData);
    };
  }, [loadData]);

  const pageCount = getPageCount(pendingOrders.length, PAGE_SIZE);
  const currentPage = Math.min(page, pageCount);
  const visiblePendingOrders = paginate(pendingOrders, currentPage, PAGE_SIZE);

  return (
    <div className="min-h-screen bg-background font-inter">
      <header className="sticky top-0 z-50 bg-background/95 backdrop-blur-md border-b border-border">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <Link
              to="/admin"
              className="w-9 h-9 rounded-xl bg-secondary flex items-center justify-center hover:bg-secondary/70 transition-colors flex-shrink-0"
            >
              <ArrowLeft className="w-4 h-4 text-foreground" />
            </Link>
            <div>
              <h1 className="font-inter font-bold text-foreground text-base">Validation</h1>
              <p className="font-inter text-xs text-muted-foreground">
                {pendingOrders.length} paniers en attente
              </p>
            </div>
          </div>

          <Button
            variant="outline"
            size="icon"
            onClick={() => {
              setIsFetching(true);
              loadData();
            }}
            disabled={isFetching}
            className="border-border w-9 h-9"
          >
            <RefreshCw className={`w-4 h-4 ${isFetching ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-5">
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((item) => (
              <Skeleton key={item} className="h-80 rounded-2xl" />
            ))}
          </div>
        ) : pendingOrders.length === 0 ? (
          <div className="text-center py-20 bg-card rounded-2xl border border-border">
            <ShoppingBag className="w-12 h-12 text-muted-foreground/20 mx-auto mb-3" />
            <p className="font-inter text-muted-foreground text-sm">
              {errorMessage || 'Aucun panier à valider'}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {visiblePendingOrders.map((pendingOrder) => (
              <PendingOrderCard
                key={pendingOrder.id}
                pendingOrder={pendingOrder}
                clients={clients}
                onValidated={loadData}
                onClientCreated={reloadClients}
              />
            ))}
            <PaginationControls page={currentPage} pageCount={pageCount} onPageChange={setPage} />
          </div>
        )}
      </main>
    </div>
  );
}
