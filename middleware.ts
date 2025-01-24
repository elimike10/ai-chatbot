// Removing NextAuth middleware to allow access without authentication
export const config = {
  matcher: [], // Empty matcher means no routes are protected
};
