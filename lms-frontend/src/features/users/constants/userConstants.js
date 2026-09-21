export const USER_STATUS = Object.freeze({
  ACTIVE: 'ACTIVE',
  INVITED: 'INVITED',
  SUSPENDED: 'SUSPENDED',
  DEACTIVATED: 'DEACTIVATED',
});

export const USER_STATUS_TONE = Object.freeze({
  [USER_STATUS.ACTIVE]: 'success',
  [USER_STATUS.INVITED]: 'info',
  [USER_STATUS.SUSPENDED]: 'warning',
  [USER_STATUS.DEACTIVATED]: 'danger',
});
