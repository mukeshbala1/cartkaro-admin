// src/pages/PartnerHub/PartnerDashboard.jsx
import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Store,
  Clock3,
  CheckCircle2,
  XCircle,
  Carrot,
  UtensilsCrossed,
  Pill,
  CalendarPlus,
  FileClock,
  ArrowUpRight,
} from 'lucide-react';
import Layout from '../../components/Layout';
import StatCard from '../../components/StatCard';
import { Loader } from '../../components/Feedback';
import { fetchPartners, fetchUpdateRequests } from '../../firebase/partnerService';
import { isToday } from '../../utils/dateUtils';

export default function PartnerDashboard() {
  const navigate = useNavigate();
  const [partners, setPartners] = useState([]);
  const [updateRequests, setUpdateRequests] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    Promise.all([fetchPartners(), fetchUpdateRequests()]).then(([p, u]) => {
      if (!active) return;
      setPartners(p);
      setUpdateRequests(u);
      setLoading(false);
    });
    return () => {
      active = false;
    };
  }, []);

  const stats = useMemo(() => {
    const total = partners.length;
    const pending = partners.filter((p) => p.verificationStatus === 'pending').length;
    const approved = partners.filter((p) => p.verificationStatus === 'approved').length;
    const rejected = partners.filter((p) => p.verificationStatus === 'rejected').length;
    const grocery = partners.filter((p) => p.businessDetails?.businessType === 'grocery').length;
    const restaurant = partners.filter((p) => p.businessDetails?.businessType === 'restaurant').length;
    const medical = partners.filter((p) => p.businessDetails?.businessType === 'medical').length;
    const todayRegistrations = partners.filter((p) => isToday(p.createdAt)).length;
    const pendingUpdateRequests = updateRequests.filter((r) => r.status === 'pending').length;
    return { total, pending, approved, rejected, grocery, restaurant, medical, todayRegistrations, pendingUpdateRequests };
  }, [partners, updateRequests]);

  if (loading) {
    return (
      <Layout title="Partner Hub" subtitle="Overview & verification status">
        <Loader label="Loading partner hub overview…" />
      </Layout>
    );
  }

  return (
    <Layout title="Partner Hub" subtitle="Overview & verification status">
      <Section title="Verification Overview">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          <StatCard label="Total Partners" value={stats.total} icon={Store} tone="navy" delay={0} />
          <StatCard label="Pending Verification" value={stats.pending} icon={Clock3} tone="gold" delay={0.05} />
          <StatCard label="Approved Partners" value={stats.approved} icon={CheckCircle2} tone="light" delay={0.1} />
          <StatCard label="Rejected Partners" value={stats.rejected} icon={XCircle} tone="light" delay={0.15} />
        </div>
      </Section>

      <Section title="Business Counts">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
          <StatCard label="Grocery Stores" value={stats.grocery} icon={Carrot} tone="light" delay={0} />
          <StatCard label="Restaurants" value={stats.restaurant} icon={UtensilsCrossed} tone="light" delay={0.05} />
          <StatCard label="Medical Stores" value={stats.medical} icon={Pill} tone="light" delay={0.1} />
        </div>
      </Section>

      <Section title="Other Stats">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <StatCard label="Today Registrations" value={stats.todayRegistrations} icon={CalendarPlus} tone="light" delay={0} />
          <StatCard label="Pending Update Requests" value={stats.pendingUpdateRequests} icon={FileClock} tone="light" delay={0.05} />
        </div>
      </Section>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 mt-2">
        <ActionTile
          title="View All Partners"
          description="Browse, search and filter every registered partner."
          onClick={() => navigate('/partner-hub/partners')}
        />
        <ActionTile
          title="Review Update Requests"
          description="Approve or reject changes partners have submitted."
          onClick={() => navigate('/partner-hub/update-requests')}
          badge={stats.pendingUpdateRequests}
        />
      </div>
    </Layout>
  );
}

function Section({ title, children }) {
  return (
    <div className="mb-7">
      <h3 className="text-sm font-semibold text-ink-500 uppercase tracking-wide mb-3">{title}</h3>
      {children}
    </div>
  );
}

function ActionTile({ title, description, onClick, badge }) {
  return (
    <motion.button
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      onClick={onClick}
      className="text-left bg-white rounded-xl2 ring-1 ring-ink-100 shadow-card p-5 flex items-center justify-between gap-3 hover:-translate-y-0.5 hover:shadow-lift transition-all duration-200"
    >
      <div>
        <div className="flex items-center gap-2">
          <p className="font-display font-bold text-navy-900">{title}</p>
          {!!badge && (
            <span className="text-[11px] font-bold bg-gold-500/15 text-gold-600 px-2 py-0.5 rounded-full">
              {badge} new
            </span>
          )}
        </div>
        <p className="text-sm text-ink-500 mt-1">{description}</p>
      </div>
      <span className="shrink-0 p-2.5 rounded-xl bg-navy-50 text-navy-700">
        <ArrowUpRight size={18} />
      </span>
    </motion.button>
  );
}
