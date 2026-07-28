export function validateCommissionRule(values) {
  const errors = {};
  const value = Number(values.commissionValue);
  if (!values.employeeId) errors.employeeId = 'Select a sales person.';
  if (!values.commissionType) errors.commissionType = 'Select a commission type.';
  if (values.commissionValue === '' || !Number.isFinite(value) || value < 0) errors.commissionValue = 'Commission cannot be negative.';
  if (values.commissionType === 'PERCENTAGE' && (value < 0.01 || value > 100)) errors.commissionValue = 'Percentage must be between 0.01% and 100%.';
  if (!values.effectiveFrom) errors.effectiveFrom = 'Effective From is required.';
  if (values.effectiveFrom && values.effectiveTo && values.effectiveTo < values.effectiveFrom) errors.effectiveTo = 'Effective To cannot be before Effective From.';
  if (!Number.isInteger(Number(values.priority)) || Number(values.priority) < 1) errors.priority = 'Priority must be at least 1.';
  return errors;
}
