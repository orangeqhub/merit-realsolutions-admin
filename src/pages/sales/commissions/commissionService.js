import * as api from './commissionApi.js';

export async function loadCommissionRules(filters) { return api.getCommissionRules(filters); }
export async function loadCommissionStats() { return api.getCommissionStats(); }
export async function saveCommissionRule(rule) { return rule.id ? api.updateCommissionRule(rule.id, rule) : api.createCommissionRule(rule); }
export { deleteCommissionRule, updateCommissionRuleStatus } from './commissionApi.js';
