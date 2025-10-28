// Validate email
export const validateEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

// Validate phone number (Vietnamese format)
export const validatePhone = (phone) => {
  const phoneRegex = /(84|0[3|5|7|8|9])+([0-9]{8})\b/;
  return phoneRegex.test(phone);
};

// Validate required field
export const validateRequired = (value) => {
  return value !== null && value !== undefined && value !== '';
};

// Validate positive number
export const validatePositiveNumber = (value) => {
  return !isNaN(value) && Number(value) > 0;
};

// Validate non-negative number
export const validateNonNegativeNumber = (value) => {
  return !isNaN(value) && Number(value) >= 0;
};
