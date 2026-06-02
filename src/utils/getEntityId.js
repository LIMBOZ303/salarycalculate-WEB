export const getEntityId = (item) => {
  if (!item) return '';
  return (
    item._id ||
    item.id ||
    item.userId?._id ||
    item.userId?.id ||
    (typeof item.userId === 'string' ? item.userId : '') ||
    item.employeeId?._id ||
    item.employeeId?.id ||
    (typeof item.employeeId === 'string' ? item.employeeId : '') ||
    ''
  );
};

export const getUserId = (item) => {
  if (!item) return '';
  return (
    item.userId?._id ||
    item.userId?.id ||
    (typeof item.userId === 'string' ? item.userId : '') ||
    item._id ||
    item.id ||
    ''
  );
};

export const getEmployeeProfileId = (item) => {
  if (!item) return '';
  if (typeof item === 'string') return item;
  if (item.employee && typeof item.employee === 'object') {
    return item.employee._id || item.employee.id || '';
  }
  return item._id || item.id || '';
};

export const getShiftId = (item) => {
  if (!item) return '';
  return item._id || item.id || '';
};

export const getBranchId = (item) => {
  if (!item) return '';
  if (typeof item === 'string') return item;
  return (
    item.branchId?._id ||
    item.branchId?.id ||
    (typeof item.branchId === 'string' ? item.branchId : '') ||
    item._id ||
    item.id ||
    ''
  );
};

export const hasValidId = (id) => {
  return typeof id === 'string' && id.trim().length > 0 && id !== 'undefined';
};

export const devLog = (...args) => {
  if (import.meta.env.DEV) {
    console.log(...args);
  }
};
