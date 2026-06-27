import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, CheckCircle2, Loader2, RefreshCw, Search, Users } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import PaginationControls from '../components/ui/pagination-controls';
import { Skeleton } from '../components/ui/skeleton';
import { formatCurrency } from '../lib/currency';
import { getPageCount, paginate } from '../lib/pagination';
import { listClientAccounts, listClientPayments, recordClientPayment } from '../services/clients';
import { listOrders } from '../services/orders';

const PAGE_SIZE = 8;
const DATE_TIME_FORMATTER = new Intl.DateTimeFormat('fr-FR', {
  dateStyle: 'short',
  timeStyle: 'short',
});

function formatPaymentType(type) {
  if (type === 'mobile_money') return 'Mobile money';
  if (type === 'card') return 'Carte';
  if (type === 'credit') return 'Crédit';
  return 'Cash';
}

function getOrderItemsSummary(order) {
  return (order.items || [])
    .map((item) => `${item.quantity} x ${item.product_name}`)
    .join(', ');
}

function ClientPaymentPanel({ client, orders, onPaid }) {
  const [amount, setAmount] = useState('');
  const [notes, setNotes] = useState('');
  const [payments, setPayments] = useState([]);
  const [loadingPayments, setLoadingPayments] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let isMounted = true;
    setLoadingPayments(true);
    listClientPayments(client.client_id)
      .then((data) => {
        if (isMounted) setPayments(data);
      })
      .catch((error) => toast.error(error.message || 'Historique indisponible'))
      .finally(() => {
        if (isMounted) setLoadingPayments(false);
      });

    return () => {
      isMounted = false;
    };
  }, [client.client_id]);

  const handlePayment = async () => {
    const numericAmount = Number(amount || 0);

    if (numericAmount <= 0) {
      toast.error('Le montant du paiement est invalide');
      return;
    }

    if (numericAmount > client.dette_totale) {
      toast.error('Le paiement ne peut pas dépasser la dette');
      return;
    }

    setSaving(true);
    try {
      await recordClientPayment({
        clientId: client.client_id,
        amount: numericAmount,
        notes,
      });
      toast.success('Paiement validé');
      setAmount('');
      setNotes('');
      const nextPayments = await listClientPayments(client.client_id);
      setPayments(nextPayments);
      onPaid();
    } catch (error) {
      toast.error(error.message || 'Impossible de valider le paiement');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="mt-4 border-t border-border pt-4 space-y-3">
      {client.dette_totale > 0 ? (
        <div className="grid gap-2 md:grid-cols-[1fr_1.4fr_auto]">
          <Input
            type="number"
            min="0"
            max={client.dette_totale}
            step="500"
            value={amount}
            onChange={(event) => setAmount(event.target.value)}
            placeholder="Montant remboursé"
            className="bg-secondary border-border font-inter"
          />
          <Input
            value={notes}
            onChange={(event) => setNotes(event.target.value)}
            placeholder="Note optionnelle"
            className="bg-secondary border-border font-inter"
          />
          <Button
            onClick={handlePayment}
            disabled={saving}
            className="bg-primary text-primary-foreground font-inter font-bold"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <CheckCircle2 className="w-4 h-4 mr-2" />}
            Valider
          </Button>
        </div>
      ) : (
        <div className="rounded-xl bg-emerald-500/10 border border-emerald-500/20 px-3 py-2">
          <p className="font-inter text-sm font-bold text-emerald-400">Dette soldée</p>
        </div>
      )}

      <div className="space-y-2">
        <p className="font-inter text-xs font-bold uppercase text-muted-foreground">
          Détail des commandes
        </p>
        {orders.length === 0 ? (
          <p className="font-inter text-xs text-muted-foreground">Aucune commande validée</p>
        ) : (
          orders.map((order) => (
            <div key={order.id} className="rounded-xl border border-border bg-secondary/30 p-3">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <p className="font-inter text-sm font-bold text-foreground">
                    {DATE_TIME_FORMATTER.format(new Date(order.created_at))} · {formatPaymentType(order.payment_type)}
                  </p>
                  <p className="font-inter text-xs text-muted-foreground mt-1">
                    {getOrderItemsSummary(order) || 'Aucun détail produit'}
                  </p>
                </div>
                <div className="grid grid-cols-3 gap-2 sm:min-w-[300px]">
                  <p className="font-inter text-xs text-right text-foreground">
                    Total<br /><span className="font-bold">{formatCurrency(order.total_amount)}</span>
                  </p>
                  <p className="font-inter text-xs text-right text-emerald-400">
                    Payé<br /><span className="font-black">{formatCurrency(order.paid_amount)}</span>
                  </p>
                  <p className="font-inter text-xs text-right text-red-400">
                    Dette<br /><span className="font-black">{formatCurrency(order.remaining_amount)}</span>
                  </p>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      <div className="space-y-2">
        <p className="font-inter text-xs font-bold uppercase text-muted-foreground">
          Historique des remboursements
        </p>
        {loadingPayments ? (
          <Skeleton className="h-12 rounded-xl" />
        ) : payments.length === 0 ? (
          <p className="font-inter text-xs text-muted-foreground">Aucun remboursement enregistré</p>
        ) : (
          payments.map((payment) => (
            <div key={payment.id} className="flex items-center justify-between gap-3 rounded-xl bg-secondary/50 px-3 py-2">
              <div className="min-w-0">
                <p className="font-inter text-sm font-bold text-foreground">
                  {formatCurrency(payment.amount)}
                </p>
                <p className="font-inter text-xs text-muted-foreground truncate">
                  {DATE_TIME_FORMATTER.format(new Date(payment.created_at))}
                  {payment.notes ? ` · ${payment.notes}` : ''}
                </p>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default function AdminClients() {
  const [clients, setClients] = useState([]);
  const [orders, setOrders] = useState([]);
  const [expandedClientId, setExpandedClientId] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [isFetching, setIsFetching] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const loadClients = React.useCallback(async () => {
    try {
      setErrorMessage('');
      const [clientsData, ordersData] = await Promise.all([listClientAccounts(), listOrders()]);
      setClients(clientsData);
      setOrders(ordersData);
    } catch (error) {
      setClients([]);
      setErrorMessage(error.message || 'Impossible de charger les clients.');
    } finally {
      setIsLoading(false);
      setIsFetching(false);
    }
  }, []);

  useEffect(() => {
    const timeoutId = window.setTimeout(loadClients, 0);
    window.addEventListener('orders-updated', loadClients);

    return () => {
      window.clearTimeout(timeoutId);
      window.removeEventListener('orders-updated', loadClients);
    };
  }, [loadClients]);

  const filteredClients = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return clients;

    return clients.filter((client) =>
      [client.name, client.phone, client.client_code, client.workplace]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(query)),
    );
  }, [clients, search]);

  const totals = useMemo(
    () => ({
      debt: clients.reduce((sum, client) => sum + client.dette_totale, 0),
      paid: clients.reduce((sum, client) => sum + client.total_paye, 0),
      repayments: clients.reduce((sum, client) => sum + client.total_remboursements, 0),
    }),
    [clients],
  );

  const pageCount = getPageCount(filteredClients.length, PAGE_SIZE);
  const currentPage = Math.min(page, pageCount);
  const visibleClients = paginate(filteredClients, currentPage, PAGE_SIZE);

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
              <h1 className="font-inter font-bold text-foreground text-base">Clients</h1>
              <p className="font-inter text-xs text-muted-foreground">Paiements, remboursements et dettes</p>
            </div>
          </div>

          <Button
            variant="outline"
            size="icon"
            onClick={() => {
              setIsFetching(true);
              loadClients();
            }}
            disabled={isFetching}
            className="border-border w-9 h-9"
          >
            <RefreshCw className={`w-4 h-4 ${isFetching ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-5 space-y-5">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="bg-card border border-border rounded-2xl p-4">
            <p className="font-inter text-xs text-muted-foreground">Clients</p>
            <p className="font-inter font-black text-foreground text-xl">{clients.length}</p>
          </div>
          <div className="bg-card border border-border rounded-2xl p-4">
            <p className="font-inter text-xs text-muted-foreground">Payé total</p>
            <p className="font-inter font-black text-emerald-400 text-xl">{formatCurrency(totals.paid)}</p>
          </div>
          <div className="bg-card border border-border rounded-2xl p-4">
            <p className="font-inter text-xs text-muted-foreground">Dette totale</p>
            <p className="font-inter font-black text-red-400 text-xl">{formatCurrency(totals.debt)}</p>
          </div>
        </div>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            value={search}
            onChange={(event) => {
              setSearch(event.target.value);
              setPage(1);
            }}
            placeholder="Rechercher client, téléphone, code, bureau..."
            className="pl-9 bg-secondary border-border font-inter"
          />
        </div>

        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((item) => (
              <Skeleton key={item} className="h-28 rounded-2xl" />
            ))}
          </div>
        ) : visibleClients.length === 0 ? (
          <div className="text-center py-20 bg-card rounded-2xl border border-border">
            <Users className="w-12 h-12 text-muted-foreground/20 mx-auto mb-3" />
            <p className="font-inter text-muted-foreground text-sm">
              {errorMessage || 'Aucun client trouvé'}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {visibleClients.map((client) => (
              <article key={client.client_id} className="bg-card border border-border rounded-2xl p-4">
                <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                  <div className="min-w-0">
                    <h2 className="font-inter font-bold text-foreground text-base truncate">{client.name}</h2>
                    <p className="font-inter text-xs text-muted-foreground mt-1">
                      {client.phone || 'Sans téléphone'} · {client.client_code || 'Sans code'}
                      {client.workplace ? ` · ${client.workplace}` : ''}
                    </p>
                    <p className="font-inter text-xs text-muted-foreground mt-1">
                      {client.orders_count} commande{client.orders_count > 1 ? 's' : ''} · Remboursé {formatCurrency(client.total_remboursements)}
                    </p>
                  </div>

                  <div className="grid grid-cols-3 gap-2 md:min-w-[360px]">
                    <div className="rounded-xl bg-secondary/60 px-3 py-2">
                      <p className="font-inter text-[11px] text-muted-foreground">Commandé</p>
                      <p className="font-inter font-black text-foreground text-sm">{formatCurrency(client.total_commandes)}</p>
                    </div>
                    <div className="rounded-xl bg-emerald-500/10 border border-emerald-500/20 px-3 py-2">
                      <p className="font-inter text-[11px] text-emerald-300">Payé</p>
                      <p className="font-inter font-black text-emerald-400 text-sm">{formatCurrency(client.total_paye)}</p>
                    </div>
                    <div className="rounded-xl bg-red-500/10 border border-red-500/20 px-3 py-2">
                      <p className="font-inter text-[11px] text-red-300">Dette</p>
                      <p className="font-inter font-black text-red-400 text-sm">{formatCurrency(client.dette_totale)}</p>
                    </div>
                  </div>
                </div>

                <Button
                  variant="outline"
                  onClick={() => setExpandedClientId(expandedClientId === client.client_id ? '' : client.client_id)}
                  className="mt-4 border-border font-inter"
                >
                  {expandedClientId === client.client_id ? 'Masquer le suivi' : 'Suivre les paiements'}
                </Button>

                {expandedClientId === client.client_id ? (
                  <ClientPaymentPanel
                    client={client}
                    orders={orders.filter((order) => order.client_id === client.client_id)}
                    onPaid={loadClients}
                  />
                ) : null}
              </article>
            ))}
            <PaginationControls page={currentPage} pageCount={pageCount} onPageChange={setPage} />
          </div>
        )}
      </main>
    </div>
  );
}
