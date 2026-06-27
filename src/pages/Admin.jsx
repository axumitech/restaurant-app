import React, { useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Banknote,
  CreditCard,
  Download,
  FileCheck2,
  LayoutDashboard,
  LogOut,
  Package,
  RefreshCw,
  ShoppingCart,
  TrendingUp,
  Users,
} from 'lucide-react';

import { Button } from '../components/ui/button';
import PaginationControls from '../components/ui/pagination-controls';
import { Skeleton } from '../components/ui/skeleton';
import StatCard from '../components/Admin/StatCard';
import DateFilter from '../components/Admin/DateFilter';
import { exportStyledExcel } from '../lib/excelExport';
import { formatCurrency } from '../lib/currency';
import { getPageCount, paginate } from '../lib/pagination';
import { listOrders } from '../services/orders';
import { logoutAdmin } from '../services/adminAuth';

const PAGE_SIZE = 6;
const DATE_TIME_FORMATTER = new Intl.DateTimeFormat('fr-FR', {
  dateStyle: 'short',
  timeStyle: 'short',
});

function getLocalStartOfDay(date = new Date()) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function isSameLocalDay(dateA, dateB) {
  return (
    dateA.getFullYear() === dateB.getFullYear() &&
    dateA.getMonth() === dateB.getMonth() &&
    dateA.getDate() === dateB.getDate()
  );
}

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

function groupOrdersByClient(orders) {
  const groupsByClientId = new Map();

  orders.forEach((order) => {
    const clientId = order.clients?.id || order.client_id || 'unknown';
    const group = groupsByClientId.get(clientId) || {
      clientId,
      client: order.clients || { id: clientId, name: 'Client inconnu', phone: '' },
      orders: [],
      totalAmount: 0,
      paidAmount: 0,
      remainingAmount: 0,
      lastOrderDate: order.created_at,
    };

    group.orders.push(order);
    group.totalAmount += Number(order.total_amount || 0);
    group.paidAmount += Number(order.paid_amount || 0);
    group.remainingAmount += Number(order.remaining_amount || 0);

    if (new Date(order.created_at) > new Date(group.lastOrderDate)) {
      group.lastOrderDate = order.created_at;
    }

    groupsByClientId.set(clientId, group);
  });

  return [...groupsByClientId.values()]
    .map((group) => ({
      ...group,
      orders: [...group.orders].sort((a, b) => new Date(b.created_at) - new Date(a.created_at)),
    }))
    .sort((a, b) => new Date(b.lastOrderDate) - new Date(a.lastOrderDate));
}

async function exportOrdersExcel(orders) {
  const groupedClients = groupOrdersByClient(orders);
  const totalTotal = groupedClients.reduce((sum, group) => sum + group.totalAmount, 0);
  const totalPaid = groupedClients.reduce((sum, group) => sum + group.paidAmount, 0);
  const totalDebt = groupedClients.reduce((sum, group) => sum + group.remainingAmount, 0);

  await exportStyledExcel({
    filename: 'suivi-clients-premium-delice.xlsx',
    title: 'Suivi clients - commandes, paiements et dettes',
    subtitle: `Généré le ${DATE_TIME_FORMATTER.format(new Date())}`,
    summaryRows: [
      ['Nombre de clients', groupedClients.length],
      ['Nombre de commandes', orders.length],
      ['Total commandé', formatCurrency(totalTotal)],
      ['Total payé', formatCurrency(totalPaid)],
      ['Dette restante', formatCurrency(totalDebt)],
    ],
    columns: [
      { key: 'client', label: 'Client', width: 28 },
      { key: 'phone', label: 'Téléphone', width: 18 },
      { key: 'orders', label: 'Commandes', width: 14, numeric: true },
      { key: 'items', label: 'Résumé des produits commandés', width: 55 },
      { key: 'total', label: 'Total commandé', width: 18, numeric: true },
      { key: 'paid', label: 'Total payé', width: 16, numeric: true },
      { key: 'debt', label: 'Dette restante', width: 16, numeric: true },
      { key: 'lastOrder', label: 'Dernière commande', width: 20 },
    ],
    rows: groupedClients.map((group) => ({
      client: group.client?.name || '',
      phone: group.client?.phone || '',
      orders: group.orders.length,
      items: group.orders.map(getOrderItemsSummary).filter(Boolean).join(' | '),
      total: group.totalAmount,
      paid: group.paidAmount,
      debt: group.remainingAmount,
      lastOrder: DATE_TIME_FORMATTER.format(new Date(group.lastOrderDate)),
    })),
    worksheets: [
      {
        name: 'Résumé clients',
        title: 'Résumé par client',
        columns: [
          { key: 'client', label: 'Client', width: 28 },
          { key: 'phone', label: 'Téléphone', width: 18 },
          { key: 'orders', label: 'Commandes', width: 14, numeric: true },
          { key: 'total', label: 'Total commandé', width: 18, numeric: true },
          { key: 'paid', label: 'Total payé', width: 16, numeric: true },
          { key: 'debt', label: 'Dette restante', width: 16, numeric: true },
          { key: 'lastOrder', label: 'Dernière commande', width: 20 },
        ],
        rows: groupedClients.map((group) => ({
          client: group.client?.name || '',
          phone: group.client?.phone || '',
          orders: group.orders.length,
          total: group.totalAmount,
          paid: group.paidAmount,
          debt: group.remainingAmount,
          lastOrder: DATE_TIME_FORMATTER.format(new Date(group.lastOrderDate)),
        })),
      },
      {
        name: 'Détail commandes',
        title: 'Détail des commandes',
        columns: [
          { key: 'date', label: 'Date', width: 18 },
          { key: 'client', label: 'Client', width: 28 },
          { key: 'items', label: 'Produits commandés', width: 55 },
          { key: 'paymentType', label: 'Type', width: 16 },
          { key: 'total', label: 'Total', width: 16, numeric: true },
          { key: 'paid', label: 'Payé', width: 16, numeric: true },
          { key: 'debt', label: 'Dette', width: 16, numeric: true },
        ],
        rows: groupedClients.flatMap((group) =>
          group.orders.map((order) => ({
            date: DATE_TIME_FORMATTER.format(new Date(order.created_at)),
            client: group.client?.name || '',
            items: getOrderItemsSummary(order),
            paymentType: formatPaymentType(order.payment_type),
            total: Number(order.total_amount || 0),
            paid: Number(order.paid_amount || 0),
            debt: Number(order.remaining_amount || 0),
          })),
        ),
      },
    ],
  });
}

function ClientOrderGroup({ group }) {
  const [expanded, setExpanded] = React.useState(false);

  return (
    <article className="bg-card border border-border rounded-2xl p-4 space-y-4">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0">
          <p className="font-inter font-black text-foreground text-base truncate">
            {group.client?.name || 'Client inconnu'}
          </p>
          <p className="font-inter text-xs text-muted-foreground mt-1">
            {group.client?.phone || 'Sans téléphone'} · {group.orders.length} commande{group.orders.length > 1 ? 's' : ''}
          </p>
          <p className="font-inter text-xs text-muted-foreground mt-1">
            Dernière commande: {DATE_TIME_FORMATTER.format(new Date(group.lastOrderDate))}
          </p>
        </div>

        <div className="grid grid-cols-3 gap-2 lg:min-w-[420px]">
          <div className="rounded-xl bg-secondary/60 px-3 py-3">
            <p className="font-inter text-[11px] text-muted-foreground">Commandé</p>
            <p className="font-inter font-black text-foreground text-sm sm:text-base">
              {formatCurrency(group.totalAmount)}
            </p>
          </div>
          <div className="rounded-xl bg-emerald-500/10 border border-emerald-500/30 px-3 py-3">
            <p className="font-inter text-[11px] font-bold text-emerald-300 uppercase">Payé</p>
            <p className="font-inter font-black text-emerald-400 text-base sm:text-lg">
              {formatCurrency(group.paidAmount)}
            </p>
          </div>
          <div className="rounded-xl bg-red-500/10 border border-red-500/30 px-3 py-3">
            <p className="font-inter text-[11px] font-bold text-red-300 uppercase">Dette</p>
            <p className="font-inter font-black text-red-400 text-base sm:text-lg">
              {formatCurrency(group.remainingAmount)}
            </p>
          </div>
        </div>
      </div>

      <Button
        type="button"
        variant="outline"
        onClick={() => setExpanded((current) => !current)}
        className="border-border font-inter"
      >
        {expanded ? 'Masquer le détail' : 'Voir le détail des commandes'}
      </Button>

      {expanded ? (
        <div className="space-y-2">
          {group.orders.map((order) => (
            <div key={order.id} className="rounded-xl border border-border bg-secondary/30 p-3">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <p className="font-inter font-bold text-foreground text-sm">
                    {DATE_TIME_FORMATTER.format(new Date(order.created_at))} · {formatPaymentType(order.payment_type)}
                  </p>
                  <p className="font-inter text-xs text-muted-foreground mt-1">
                    {getOrderItemsSummary(order) || 'Aucun détail produit'}
                  </p>
                </div>
                <div className="grid grid-cols-3 gap-2 sm:min-w-[310px]">
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
          ))}
        </div>
      ) : null}
    </article>
  );
}

export default function Admin() {
  const navigate = useNavigate();
  const [selectedDate, setSelectedDate] = React.useState(() => getLocalStartOfDay());
  const [orders, setOrders] = React.useState([]);
  const [page, setPage] = React.useState(1);
  const [isLoading, setIsLoading] = React.useState(true);
  const [isFetching, setIsFetching] = React.useState(false);
  const [errorMessage, setErrorMessage] = React.useState('');

  const loadOrders = React.useCallback(async () => {
    try {
      setErrorMessage('');
      const data = await listOrders();
      setOrders(data);
    } catch (error) {
      setOrders([]);
      setErrorMessage(error.message || 'Impossible de charger les commandes.');
    } finally {
      setIsLoading(false);
      setIsFetching(false);
    }
  }, []);

  React.useEffect(() => {
    const timeoutId = window.setTimeout(loadOrders, 0);
    window.addEventListener('orders-updated', loadOrders);

    return () => {
      window.clearTimeout(timeoutId);
      window.removeEventListener('orders-updated', loadOrders);
    };
  }, [loadOrders]);

  const dayOrders = useMemo(
    () => orders.filter((order) => isSameLocalDay(new Date(order.created_at), selectedDate)),
    [orders, selectedDate],
  );

  const dayClientGroups = useMemo(() => groupOrdersByClient(dayOrders), [dayOrders]);

  const totals = useMemo(() => {
    const sumOrders = (rows, key) => rows.reduce((sum, order) => sum + Number(order[key] || 0), 0);
    return {
      dayTotal: sumOrders(dayOrders, 'total_amount'),
      dayPaid: sumOrders(dayOrders, 'paid_amount'),
      dayDebt: sumOrders(dayOrders, 'remaining_amount'),
      globalTotal: sumOrders(orders, 'total_amount'),
      globalPaid: sumOrders(orders, 'paid_amount'),
      globalDebt: sumOrders(orders, 'remaining_amount'),
    };
  }, [dayOrders, orders]);

  const pageCount = getPageCount(dayClientGroups.length, PAGE_SIZE);
  const currentPage = Math.min(page, pageCount);
  const visibleClientGroups = paginate(dayClientGroups, currentPage, PAGE_SIZE);
  const firstVisibleGroup = dayClientGroups.length === 0 ? 0 : (currentPage - 1) * PAGE_SIZE + 1;
  const lastVisibleGroup = Math.min(currentPage * PAGE_SIZE, dayClientGroups.length);

  const handleLogout = () => {
    logoutAdmin();
    navigate('/admin/login', { replace: true });
  };

  return (
    <div className="min-h-screen bg-background font-inter">
      <header className="sticky top-0 z-50 bg-background/95 backdrop-blur-md border-b border-border">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center flex-shrink-0">
              <LayoutDashboard className="w-5 h-5 text-primary-foreground" />
            </div>
            <div className="min-w-0">
              <h1 className="font-inter font-bold text-foreground text-base leading-tight truncate">
                Tableau financier
              </h1>
              <p className="font-inter text-xs text-muted-foreground truncate">
                Clients, paiements et dettes
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-shrink-0">
            <Link
              to="/admin/validation"
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-primary text-primary-foreground font-inter font-semibold text-xs hover:bg-primary/90 transition-colors"
            >
              <FileCheck2 className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Validation</span>
            </Link>
            <Link
              to="/admin/clients"
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-secondary text-foreground font-inter font-semibold text-xs hover:bg-secondary/70 transition-colors"
            >
              <Users className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Clients</span>
            </Link>
            <Link
              to="/admin/produits"
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-secondary text-foreground font-inter font-semibold text-xs hover:bg-secondary/70 transition-colors"
            >
              <Package className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Produits</span>
            </Link>
            <Button
              variant="outline"
              size="icon"
              onClick={() => {
                exportOrdersExcel(orders);
              }}
              disabled={orders.length === 0}
              className="border-border w-9 h-9"
              title="Exporter le suivi clients en Excel"
            >
              <Download className="w-4 h-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={() => {
                setIsFetching(true);
                loadOrders();
              }}
              disabled={isFetching}
              className="border-border w-9 h-9"
              title="Actualiser"
            >
              <RefreshCw className={`w-4 h-4 ${isFetching ? 'animate-spin' : ''}`} />
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={handleLogout}
              className="border-border w-9 h-9"
              title="Déconnexion"
            >
              <LogOut className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-4 py-5 space-y-6">
        <DateFilter
          selectedDate={selectedDate}
          onDateChange={(nextDate) => {
            setSelectedDate(getLocalStartOfDay(nextDate));
            setPage(1);
          }}
        />

        {isLoading ? (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {[1, 2, 3, 4].map((item) => (
              <Skeleton key={item} className="h-20 rounded-2xl" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <StatCard label="Clients du jour" value={dayClientGroups.length} icon={Users} colorClass="bg-primary/10 text-primary" delay={0} />
            <StatCard label="Total du jour" value={formatCurrency(totals.dayTotal)} icon={TrendingUp} colorClass="bg-green-500/10 text-green-400" delay={0.05} />
            <StatCard label="Payé du jour" value={formatCurrency(totals.dayPaid)} icon={Banknote} colorClass="bg-emerald-500/10 text-emerald-400" delay={0.1} />
            <StatCard label="Dette du jour" value={formatCurrency(totals.dayDebt)} icon={CreditCard} colorClass="bg-red-500/10 text-red-400" delay={0.15} />
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="bg-card border border-border rounded-2xl p-4">
            <p className="font-inter text-xs text-muted-foreground">Total global commandé</p>
            <p className="font-inter font-black text-foreground text-xl">{formatCurrency(totals.globalTotal)}</p>
          </div>
          <div className="bg-card border border-emerald-500/30 rounded-2xl p-4 bg-emerald-500/5">
            <p className="font-inter text-xs text-emerald-300">Total payé</p>
            <p className="font-inter font-black text-emerald-400 text-2xl">{formatCurrency(totals.globalPaid)}</p>
          </div>
          <div className="bg-card border border-red-500/30 rounded-2xl p-4 bg-red-500/5">
            <p className="font-inter text-xs text-red-300">Dette restante</p>
            <p className="font-inter font-black text-red-400 text-2xl">{formatCurrency(totals.globalDebt)}</p>
          </div>
        </div>

        <section className="border-t border-border pt-5">
          <div className="mb-4 flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
            <h2 className="font-inter font-bold text-foreground text-base">Commandes validées par client</h2>
            {!isLoading && dayClientGroups.length > 0 ? (
              <p className="font-inter text-xs text-muted-foreground">
                {firstVisibleGroup}-{lastVisibleGroup} sur {dayClientGroups.length} client{dayClientGroups.length > 1 ? 's' : ''}
              </p>
            ) : null}
          </div>

          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((item) => (
                <Skeleton key={item} className="h-32 w-full rounded-2xl" />
              ))}
            </div>
          ) : dayClientGroups.length === 0 ? (
            <div className="text-center py-16 bg-card rounded-2xl border border-border">
              <ShoppingCart className="w-12 h-12 text-muted-foreground/20 mx-auto mb-3" />
              <p className="font-inter text-muted-foreground text-sm">
                {errorMessage || 'Aucune commande validée ce jour'}
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {visibleClientGroups.map((group) => (
                <ClientOrderGroup key={group.clientId} group={group} />
              ))}
              <PaginationControls page={currentPage} pageCount={pageCount} onPageChange={setPage} />
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
