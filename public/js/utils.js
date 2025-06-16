// public/js/utils.js - Shared utilities
const Utils = {
  showToast: (message, type = 'info') => {
    // Toast notification function
  },
  
  formatCurrency: (amount) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR'
    }).format(amount);
  },
  
  formatDate: (date) => {
    return new Date(date).toLocaleDateString('id-ID');
  },
  
  ajax: async (url, options = {}) => {
    // Wrapper untuk fetch dengan error handling
  }
};