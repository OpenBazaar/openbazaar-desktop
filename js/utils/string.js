export function capitalize(str) {
  if (typeof str !== 'string') {
    throw new Error('Please provide a str as a String.');
  }

  return str.charAt(0).toUpperCase() + str.slice(1);
}
