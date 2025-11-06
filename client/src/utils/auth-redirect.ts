// Helper function to redirect to login page with correct path handling
export function redirectToLogin() {
  // Use the full URL to ensure the redirect works correctly
  const loginUrl = `${window.location.origin}/api/login`;
  window.location.href = loginUrl;
}