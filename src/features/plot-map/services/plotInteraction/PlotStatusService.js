const STATUS_ACTIONS = {
  Available: ['reserve', 'book', 'block', 'edit', 'delete'],
  Reserved: ['book', 'sold', 'release', 'edit', 'delete'],
  Booked: ['sold', 'edit', 'delete'],
  Sold: ['edit'],
  Blocked: ['release', 'edit', 'delete'],
};

export const PlotStatusService = {
  getActionsForStatus(status = 'Available') {
    return STATUS_ACTIONS[status] || STATUS_ACTIONS.Available;
  },

  canPerformAction(status, action) {
    return this.getActionsForStatus(status).includes(action);
  },

  getStatusLabel(status) {
    return status || 'Available';
  },
};
