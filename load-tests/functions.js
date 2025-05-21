/**
 * Helper functions for Artillery load testing
 */

// Generate a random string of specified length
function randomString(length) {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

// Get a date 1 day in the future for poll expiration
function getExpirationDate() {
  const date = new Date();
  date.setDate(date.getDate() + 1);
  return date.toISOString();
}

// Export functions for Artillery to use
module.exports = {
  $randomString: randomString,
  $getExpirationDate: getExpirationDate
};
