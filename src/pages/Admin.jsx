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

const PAGE_SIZE = 8;
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
  if (type === 'credit') return 'Crédit';
  return 'Cash';
}

async function exportOrdersExcel(orders) {
  const sortedOrders = [...orders].sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
  const totalTotal = sortedOrders.reduce((sum, order) => sum + Number(order.total_amount || 0), 0);
  const totalPaid = sortedOrders.reduce((sum, order) => sum + Number(order.paid_amount || 0), 0);
  const totalDebt = sortedOrders.reduce((sum, order) => sum + Number(order.remaining_amount || 0), 0);

  await exportStyledExcel({
    filename: 'commandes-restaurant-kin-delices.xlsx',
    title: 'Commandes validées',
    subtitle: `Généré le ${DATE_TIME_FORMATTER.format(new Date())}`,
    summaryRows: [
      ['Nombre de commandes', sortedOrders.length],
      ['Total global', formatCurrency(totalTotal)],
      ['Total payé', formatCurrency(totalPaid)],
      ['Dette totale', formatCurrency(totalDebt)],
    ],
    columns: [
      { key: 'date', label: 'Date', width: 18 },
      { key: 'client', label: 'Client', width: 28 },
      { key: 'total', label: 'Total', width: 16, numeric: true },
      { key: 'paid', label: 'Payé', width: 16, numeric: true },
      { key: 'debt', label: 'Dette', width: 16, numeric: true },
      { key: 'paymentType', label: 'Type de paiement', width: 18 },
    ],
    rows: sortedOrders.map((order) => ({
      date: DATE_TIME_FORMATTER.format(new Date(order.created_at)),
      client: order.clients?.name || '',
      total: Number(order.total_amount || 0),
      paid: Number(order.paid_amount || 0),
      debt: Number(order.remaining_amount || 0),
      paymentType: formatPaymentType(order.payment_type),
    })),
  });
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

  const dayOrders = useMemo(() => {
    return orders.filter((order) => isSameLocalDay(new Date(order.created_at), selectedDate));
  }, [orders, selectedDate]);

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

  const sortedDayOrders = useMemo(
    () => [...dayOrders].sort((a, b) => new Date(b.created_at) - new Date(a.created_at)),
    [dayOrders],
  );
  const pageCount = getPageCount(sortedDayOrders.length, PAGE_SIZE);
  const currentPage = Math.min(page, pageCount);
  const visibleDayOrders = paginate(sortedDayOrders, currentPage, PAGE_SIZE);
  const firstVisibleOrder = sortedDayOrders.length === 0 ? 0 : (currentPage - 1) * PAGE_SIZE + 1;
  const lastVisibleOrder = Math.min(currentPage * PAGE_SIZE, sortedDayOrders.length);

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
                Cash réel, paiements et dettes
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
              title="Exporter les commandes en Excel"
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
            <StatCard label="Commandes du jour" value={dayOrders.length} icon={ShoppingCart} colorClass="bg-primary/10 text-primary" delay={0} />
            <StatCard label="Total du jour" value={formatCurrency(totals.dayTotal)} icon={TrendingUp} colorClass="bg-green-500/10 text-green-400" delay={0.05} />
            <StatCard label="Payé du jour" value={formatCurrency(totals.dayPaid)} icon={Banknote} colorClass="bg-emerald-500/10 text-emerald-400" delay={0.1} />
            <StatCard label="Dette du jour" value={formatCurrency(totals.dayDebt)} icon={CreditCard} colorClass="bg-red-500/10 text-red-400" delay={0.15} />
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="bg-card border border-border rounded-2xl p-4">
            <p className="font-inter text-xs text-muted-foreground">Total global</p>
            <p className="font-inter font-black text-foreground text-xl">{formatCurrency(totals.globalTotal)}</p>
          </div>
          <div className="bg-card border border-border rounded-2xl p-4">
            <p className="font-inter text-xs text-muted-foreground">Cash réel encaissé</p>
            <p className="font-inter font-black text-green-400 text-xl">{formatCurrency(totals.globalPaid)}</p>
          </div>
          <div className="bg-card border border-border rounded-2xl p-4">
            <p className="font-inter text-xs text-muted-foreground">Dette totale</p>
            <p className="font-inter font-black text-red-400 text-xl">{formatCurrency(totals.globalDebt)}</p>
          </div>
        </div>

        <section className="border-t border-border pt-5">
          <div className="mb-4 flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
            <h2 className="font-inter font-bold text-foreground text-base">Commandes validées</h2>
            {!isLoading && sortedDayOrders.length > 0 ? (
              <p className="font-inter text-xs text-muted-foreground">
                {firstVisibleOrder}-{lastVisibleOrder} sur {sortedDayOrders.length} commandes
              </p>
            ) : null}
          </div>

          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((item) => (
                <Skeleton key={item} className="h-24 w-full rounded-2xl" />
              ))}
            </div>
          ) : sortedDayOrders.length === 0 ? (
            <div className="text-center py-16 bg-card rounded-2xl border border-border">
              <ShoppingCart className="w-12 h-12 text-muted-foreground/20 mx-auto mb-3" />
              <p className="font-inter text-muted-foreground text-sm">
                {errorMessage || 'Aucune commande validée ce jour'}
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {visibleDayOrders.map((order) => (
                <article key={order.id} className="bg-card border border-border rounded-2xl p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="font-inter font-bold text-foreground text-sm truncate">
                        {order.clients?.name || 'Client inconnu'}
                      </p>
                      <p className="font-inter text-xs text-muted-foreground mt-1">
                        {DATE_TIME_FORMATTER.format(new Date(order.created_at))} · {formatPaymentType(order.payment_type)}
                      </p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="font-inter font-black text-foreground text-base">
                        {formatCurrency(order.total_amount)}
                      </p>
                      <p className="font-inter text-xs text-muted-foreground">
                        Payé {formatCurrency(order.paid_amount)} · Dette {formatCurrency(order.remaining_amount)}
                      </p>
                    </div>
                  </div>
                </article>
              ))}
              <PaginationControls page={currentPage} pageCount={pageCount} onPageChange={setPage} />
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
