import { useCallback, useEffect, useState } from 'react';
import { FiPlus } from 'react-icons/fi';
import { motion } from 'framer-motion';
import PageHeader from '../../../components/layout/PageHeader';
import Button from '../../../components/ui/button/Button';
import ConfirmationModal from '../../../components/modal/ConfirmationModal';
import { useToast } from '../../../components/feedback/Toast';
import { listSalesUsers } from '../../../services/users/userApi.js';
import CommissionFilters from './CommissionFilters.jsx';
import CommissionFormModal from './CommissionFormModal.jsx';
import CommissionStats from './CommissionStats.jsx';
import CommissionTable from './CommissionTable.jsx';
import { deleteCommissionRule, loadCommissionRules, loadCommissionStats, saveCommissionRule, updateCommissionRuleStatus } from './commissionService.js';
import './commission.css';

const initialFilters = { search: '', role: '', commissionType: '', status: '' };
export default function CommissionList() {
  const toast = useToast();
  const [filters, setFilters] = useState(initialFilters); const [rules, setRules] = useState([]); const [stats, setStats] = useState(null); const [salesUsers, setSalesUsers] = useState([]); const [loading, setLoading] = useState(true); const [page, setPage] = useState(1); const [pagination, setPagination] = useState({ totalPages: 1 }); const [modalRule, setModalRule] = useState(undefined); const [deleteTarget, setDeleteTarget] = useState(null); const [saving, setSaving] = useState(false);
  const load = useCallback(async () => { setLoading(true); try { const [ruleResult, statsResult, users] = await Promise.all([loadCommissionRules({ ...filters, page, limit: 10 }), loadCommissionStats(), listSalesUsers()]); setRules(ruleResult.items || []); setPagination(ruleResult.pagination || { totalPages: 1 }); setStats(statsResult); setSalesUsers(users || []); } catch (error) { toast.error(error.message || 'Failed to load commission rules.'); } finally { setLoading(false); } }, [filters, page, toast]);
  useEffect(() => { const timer = setTimeout(load, 250); return () => clearTimeout(timer); }, [load]);
  const changeFilter = (field, value) => { setPage(1); setFilters((current) => ({ ...current, [field]: value })); };
  const save = async (rule) => { setSaving(true); try { await saveCommissionRule(rule); toast.success(rule.id ? 'Commission rule updated.' : 'Commission rule created.'); setModalRule(undefined); await load(); } catch (error) { toast.error(error.message || 'Unable to save commission rule.'); } finally { setSaving(false); } };
  const changeStatus = async (rule, status) => { try { await updateCommissionRuleStatus(rule.id, status); toast.success(`Rule ${status.toLowerCase()}.`); await load(); } catch (error) { toast.error(error.message || 'Unable to update rule status.'); } };
  const remove = async () => { try { await deleteCommissionRule(deleteTarget.id); toast.success('Commission rule deleted.'); setDeleteTarget(null); await load(); } catch (error) { toast.error(error.message || 'Unable to delete commission rule.'); } };
  return <motion.div className="erp-module-page commission-page" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
    <PageHeader title="Sales Commission Management" description="Configure commission rules for sales executives, agents, team leaders and channel partners." actions={<Button variant="primary" onClick={() => setModalRule(null)}><FiPlus /> Add Commission Rule</Button>} />
    <CommissionStats stats={stats} loading={loading} />
    <CommissionFilters filters={filters} onChange={changeFilter} />
    <CommissionTable data={rules} loading={loading} onView={(rule) => setModalRule({ ...rule, viewOnly: true })} onEdit={setModalRule} onStatusChange={changeStatus} onDelete={setDeleteTarget} />
    {pagination.totalPages > 1 && <div className="commission-pagination"><Button variant="ghost" disabled={page <= 1} onClick={() => setPage((current) => current - 1)}>Previous</Button><span>Page {page} of {pagination.totalPages}</span><Button variant="ghost" disabled={page >= pagination.totalPages} onClick={() => setPage((current) => current + 1)}>Next</Button></div>}
    <CommissionFormModal open={modalRule !== undefined} rule={modalRule} salesUsers={salesUsers} saving={saving} onClose={() => setModalRule(undefined)} onSave={save} />
    <ConfirmationModal open={Boolean(deleteTarget)} onClose={() => setDeleteTarget(null)} onConfirm={remove} title="Delete commission rule?" message="This configuration will be permanently removed. It does not affect payments or calculated commissions." highlight={deleteTarget?.salesPerson} confirmLabel="Delete Rule" />
  </motion.div>;
}
