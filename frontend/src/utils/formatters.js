// Format currency in VND
export const formatCurrency = (amount) => {
  if (amount === null || amount === undefined) return '0 đ';
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
  }).format(amount);
};

// Format number with thousand separators
export const formatNumber = (number) => {
  if (number === null || number === undefined) return '0';
  return new Intl.NumberFormat('vi-VN').format(number);
};

// Format date to Vietnamese format
export const formatDate = (date) => {
  if (!date) return '';
  return new Intl.DateTimeFormat('vi-VN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date(date));
};

// Format datetime to Vietnamese format
export const formatDateTime = (date) => {
  if (!date) return '';
  return new Intl.DateTimeFormat('vi-VN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(date));
};

// Format date for input fields (YYYY-MM-DD)
export const formatDateForInput = (date) => {
  if (!date) return '';
  const d = new Date(date);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

// Get date range (for filters)
export const getDateRange = (range) => {
  const today = new Date();
  const startDate = new Date();
  let endDate = new Date();

  switch (range) {
    case 'today':
      startDate.setHours(0, 0, 0, 0);
      endDate.setHours(23, 59, 59, 999);
      break;
    case 'yesterday':
      startDate.setDate(today.getDate() - 1);
      startDate.setHours(0, 0, 0, 0);
      endDate.setDate(today.getDate() - 1);
      endDate.setHours(23, 59, 59, 999);
      break;
    case 'week':
      startDate.setDate(today.getDate() - 7);
      startDate.setHours(0, 0, 0, 0);
      break;
    case 'month':
      startDate.setMonth(today.getMonth() - 1);
      startDate.setHours(0, 0, 0, 0);
      break;
    case 'year':
      startDate.setFullYear(today.getFullYear() - 1);
      startDate.setHours(0, 0, 0, 0);
      break;
    default:
      startDate.setMonth(today.getMonth() - 1);
  }

  return {
    startDate: formatDateForInput(startDate),
    endDate: formatDateForInput(endDate),
  };
};
