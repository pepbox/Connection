export const setCookieOptions = {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    // "none" required for cross-origin requests in production (Vercel + Render etc.)
    // "lax" is safe for same-origin dev
    sameSite: (process.env.NODE_ENV === 'production' ? 'none' : 'lax') as 'none' | 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000,
  };