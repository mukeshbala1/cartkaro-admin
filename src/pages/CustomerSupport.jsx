import { useEffect, useMemo, useState } from 'react';
import { PackageSearch, RotateCcw, Search, Check, X } from 'lucide-react';
import Layout from '../components/Layout';
import { decideReturn, fetchOrders } from '../firebase/orderService';
import { useAuth } from '../context/AuthContext';

const statusStyle = {
  requested: 'bg-warning-50 text-warning-600', approved: 'bg-success-50 text-success-600', rejected: 'bg-danger-50 text-danger-600', none: 'bg-ink-100 text-ink-500',
};

export default function CustomerSupport() {
  const { adminEmail } = useAuth();
  const [orders, setOrders] = useState([]);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [processing, setProcessing] = useState('');

  useEffect(() => {
    fetchOrders().then(setOrders).catch(() => setError('Unable to load orders.')).finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(() => orders.filter((order) =>
    [order.id, order.customerName, order.customerPhone, order.partnerName].join(' ').toLowerCase().includes(query.toLowerCase()),
  ), [orders, query]);

  async function handleReturn(orderId, decision) {
    setProcessing(orderId);
    try {
      await decideReturn(orderId, decision, adminEmail);
      setOrders((current) => current.map((order) => order.id === orderId ? { ...order, returnStatus: decision } : order));
    } catch {
      setError('Unable to update the return request.');
    } finally {
      setProcessing('');
    }
  }

  return (
    <Layout title="Customer Support" subtitle="Track orders and process return requests">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        {[['Orders', orders.length, PackageSearch], ['Return requests', orders.filter((o) => o.returnStatus === 'requested').length, RotateCcw], ['Resolved returns', orders.filter((o) => ['approved', 'rejected'].includes(o.returnStatus)).length, Check]].map(([label, value, Icon]) => (
          <div key={label} className="bg-white rounded-xl2 p-5 shadow-card ring-1 ring-ink-100 flex items-center gap-4"><span className="p-3 bg-navy-50 rounded-xl text-navy-700"><Icon size={21} /></span><div><p className="text-2xl font-display font-bold text-navy-900">{value}</p><p className="text-sm text-ink-500">{label}</p></div></div>
        ))}
      </div>
      <div className="bg-white rounded-xl2 shadow-card ring-1 ring-ink-100 overflow-hidden">
        <div className="p-5 border-b border-ink-100 flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between"><div><h2 className="font-display font-bold text-navy-900">Order tracking</h2><p className="text-sm text-ink-500">Search an order or review pending returns.</p></div><div className="relative"><Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-400" /><input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Order, customer, phone…" className="w-full sm:w-72 pl-9 pr-3 py-2 rounded-xl ring-1 ring-ink-200 text-sm outline-none focus:ring-2 focus:ring-gold-400" /></div></div>
        {error && <p className="mx-5 mt-4 text-sm text-danger-600">{error}</p>}
        {loading ? <div className="p-10 text-center text-ink-500">Loading orders…</div> : <div className="overflow-x-auto"><table className="w-full text-sm"><thead className="bg-ink-50 text-left text-ink-500"><tr><th className="p-4 font-semibold">Order</th><th className="p-4 font-semibold">Customer</th><th className="p-4 font-semibold">Partner</th><th className="p-4 font-semibold">Status</th><th className="p-4 font-semibold">Return</th><th className="p-4 font-semibold">Action</th></tr></thead><tbody>{filtered.map((order) => <tr key={order.id} className="border-t border-ink-100"><td className="p-4 font-semibold text-navy-900">{order.id}<p className="font-normal text-xs text-ink-500 mt-0.5">₹{order.total}</p></td><td className="p-4 text-ink-700">{order.customerName}<p className="text-xs text-ink-500 mt-0.5">{order.customerPhone}</p></td><td className="p-4 text-ink-700">{order.partnerName}</td><td className="p-4 capitalize text-ink-600">{order.orderStatus?.replaceAll('_', ' ')}</td><td className="p-4"><span className={`capitalize px-2.5 py-1 rounded-full text-xs font-semibold ${statusStyle[order.returnStatus] || statusStyle.none}`}>{order.returnStatus || 'none'}</span>{order.returnReason && <p className="text-xs text-ink-500 mt-1">{order.returnReason}</p>}</td><td className="p-4">{order.returnStatus === 'requested' ? <div className="flex gap-2"><button disabled={processing === order.id} onClick={() => handleReturn(order.id, 'approved')} className="p-2 rounded-lg text-success-600 bg-success-50"><Check size={16} /></button><button disabled={processing === order.id} onClick={() => handleReturn(order.id, 'rejected')} className="p-2 rounded-lg text-danger-600 bg-danger-50"><X size={16} /></button></div> : <span className="text-xs text-ink-400">No action needed</span>}</td></tr>)}</tbody></table></div>}
      </div>
    </Layout>
  );
}
