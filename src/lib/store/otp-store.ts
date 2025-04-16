// In-memory storage for OTPs (in a real app, use a database)
export const otpStore: Record<string, { otp: string; expiresAt: number }> = {};

// Function to clean up expired OTPs
export function cleanupExpiredOTPs() {
    const now = Date.now();
    Object.keys(otpStore).forEach((email) => {
        if (now > otpStore[email].expiresAt) {
            delete otpStore[email];
        }
    });
}

// Set up a periodic cleanup (e.g., every 15 minutes)
if (typeof window === 'undefined') { // Only run on server
    setInterval(cleanupExpiredOTPs, 15 * 60 * 1000);
} 