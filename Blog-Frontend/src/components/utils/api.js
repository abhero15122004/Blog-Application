import authService from '../../services/authService';

// The actual API base URL is resolved inside authService from env vars.
// This file is a thin wrapper around authService.authenticatedFetch.

/**
 * Enhanced API fetch function that works with both OAuth and Basic Auth
 */
const apiFetch = async (url, options = {}) => {
    try {
        // Use the auth service for authenticated requests
        return await authService.authenticatedFetch(url, options);
    } catch (error) {
        console.error(`API fetch error for ${url}:`, error);
        throw error;
    }
};

/**
 * Legacy functions for backward compatibility
 * These now use the unified auth service
 */
export const registerUser = async (formData) => {
    return await authService.registerUser(formData);
};

export const verifyOTP = async (email, otp) => {
    return await authService.verifyOTP(email, otp);
};

export const resendOTP = async (email) => {
    return await authService.resendOTP(email);
};

export const loginUser = async (email, password) => {
    const result = await authService.loginWithCredentials(email, password);
    return result.user;
};

// Export the enhanced fetch function as default
export default apiFetch;