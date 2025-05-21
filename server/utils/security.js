/**
 * Security utilities for input sanitization and validation
 */

// Simple HTML sanitization to prevent XSS
const sanitizeInput = (input) => {
  if (!input) return '';
  
  // Convert to string if not already
  const str = String(input);
  
  // Replace HTML special characters with their entity equivalents
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
};

// Validate email format
const isValidEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

// Validate password strength
const isStrongPassword = (password) => {
  // At least 8 characters, containing at least one number, one uppercase, one lowercase
  const passwordRegex = /^(?=.*\d)(?=.*[a-z])(?=.*[A-Z]).{8,}$/;
  return passwordRegex.test(password);
};

// Validate URL format
const isValidUrl = (url) => {
  try {
    new URL(url);
    return true;
  } catch (e) {
    return false;
  }
};

// Validate that input is a positive integer
const isPositiveInteger = (value) => {
  return Number.isInteger(Number(value)) && Number(value) > 0;
};

module.exports = {
  sanitizeInput,
  isValidEmail,
  isStrongPassword,
  isValidUrl,
  isPositiveInteger
};
