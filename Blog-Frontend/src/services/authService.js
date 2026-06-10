/**
 * Unified Authentication Service
 * Handles both OAuth and Basic Auth with OTP verification
 */

// The frontend always talks to the deployed Render backend.
// Set VITE_API_BASE_URL_PROD in .env (local) or Netlify env vars.
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL_PROD;

class AuthService {
    constructor() {
        this.isInitialized = false
        this.pendingCallbacks = []
        this.oauthToastShown = false
    }

    /**
     * Initialize the service and check for OAuth callbacks
     */
    async initialize() {
        if (this.isInitialized) return

        // Check if we're returning from OAuth
        const urlParams = new URLSearchParams(window.location.search)
        if (urlParams.has("code") || urlParams.has("state") || urlParams.has("success")) {
            await this.handleOAuthCallback()
        }

        this.isInitialized = true

        // Execute any pending callbacks
        this.pendingCallbacks.forEach((callback) => callback())
        this.pendingCallbacks = []
    }

    /**
     * Handle OAuth callback from backend
     */
    async handleOAuthCallback() {
        try {
            // The backend should have set session cookies after successful OAuth
            const response = await this.checkAuthStatus()
            if (response.isAuthenticated) {
                // Clear any existing Basic Auth credentials
                this.clearStoredAuth()
                localStorage.setItem("authMethod", "oauth")

                // Clear URL parameters but keep success parameter for toast handling
                const urlParams = new URLSearchParams(window.location.search)
                if (urlParams.has("success")) {
                    // Keep success parameter for one more cycle to show toast
                    return { success: true, user: response.user }
                }
                window.history.replaceState({}, document.title, window.location.pathname)
                return { success: true, user: response.user }
            } else {
                // Handle failed authentication
                window.history.replaceState({}, document.title, "/login?error=oauth_failed")
                return { success: false }
            }
        } catch (error) {
            console.error("OAuth callback error:", error)
            window.history.replaceState({}, document.title, "/login?error=oauth_failed")
            return { success: false }
        }
    }

    /**
     * Start OAuth login flow
     */
    initiateOAuthLogin(provider) {
        // Clear any existing auth data before starting OAuth
        this.clearStoredAuth()
        this.oauthToastShown = false
        const redirectUrl = `${API_BASE_URL}/oauth2/authorization/${provider}`
        window.location.href = redirectUrl
    }

    /**
     * Basic Auth login with credentials
     */
    async loginWithCredentials(email, password) {
        try {
            const credentials = btoa(`${email}:${password}`)
            const response = await fetch(`${API_BASE_URL}/api/users/profile`, {
                method: "GET",
                headers: {
                    Authorization: `Basic ${credentials}`,
                    "Content-Type": "application/json",
                },
            })

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}))
                throw new Error(errorData.message || "Login failed")
            }

            const data = await response.json()

            // Check if user is verified
            if (!data.user?.isVerified) {
                throw new Error("User account is not verified. Please check your email for verification instructions.")
            }

            // Clear any OAuth data and store Basic Auth credentials
            this.clearStoredAuth()
            localStorage.setItem("authCredentials", credentials)
            localStorage.setItem("authMethod", "basic")

            return { success: true, user: data.user, method: "basic" }
        } catch (error) {
            console.error("Basic auth login error:", error)
            throw error
        }
    }

    /**
     * Check current authentication status
     */
    async checkAuthStatus() {
        try {
            // First check OAuth authentication (session-based)
            const oauthResponse = await fetch(`${API_BASE_URL}/api/auth/check`, {
                method: "GET",
                credentials: "include", // Important for session cookies
            })

            if (oauthResponse.ok) {
                const oauthData = await oauthResponse.json()
                if (oauthData.isAuthenticated) {
                    // For OAuth users, get user profile
                    const profileResponse = await fetch(`${API_BASE_URL}/api/users/profile`, {
                        method: "GET",
                        credentials: "include",
                    })

                    if (profileResponse.ok) {
                        const profileData = await profileResponse.json()
                        // Clear any Basic Auth credentials and set OAuth method
                        const currentMethod = localStorage.getItem("authMethod")
                        if (currentMethod !== "oauth") {
                            localStorage.removeItem("authCredentials")
                            localStorage.setItem("authMethod", "oauth")
                        }
                        return {
                            isAuthenticated: true,
                            user: profileData.user,
                            method: "oauth",
                        }
                    }
                }
            }

            // If OAuth fails, try Basic Auth with stored credentials
            const credentials = localStorage.getItem("authCredentials")
            const authMethod = localStorage.getItem("authMethod")

            if (credentials && authMethod === "basic") {
                const response = await fetch(`${API_BASE_URL}/api/users/profile`, {
                    method: "GET",
                    headers: {
                        Authorization: `Basic ${credentials}`,
                    },
                })

                if (response.ok) {
                    const data = await response.json()
                    return {
                        isAuthenticated: true,
                        user: data.user,
                        method: "basic",
                    }
                } else {
                    // Clear invalid credentials
                    this.clearStoredAuth()
                }
            }

            // Not authenticated
            this.clearStoredAuth()
            return { isAuthenticated: false, user: null, method: null }
        } catch (error) {
            console.error("Auth status check error:", error)
            this.clearStoredAuth()
            return { isAuthenticated: false, user: null, method: null }
        }
    }

    /**
     * Register new user (Basic Auth only)
     */
    async registerUser(formData) {
        try {
            const response = await fetch(`${API_BASE_URL}/api/users`, {
                method: "POST",
                body: formData, // FormData for multipart request
            })

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}))
                throw new Error(errorData.message || "Registration failed")
            }

            return await response.json()
        } catch (error) {
            console.error("Registration error:", error)
            throw error
        }
    }

    /**
     * Verify OTP for Basic Auth users
     */
    async verifyOTP(email, otp) {
        try {
            const response = await fetch(`${API_BASE_URL}/api/users/verify`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ email, otp }),
            })

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}))
                throw new Error(errorData.message || "OTP verification failed")
            }

            return await response.json()
        } catch (error) {
            console.error("OTP verification error:", error)
            throw error
        }
    }

    /**
     * Resend OTP for Basic Auth users
     */
    async resendOTP(email) {
        try {
            const response = await fetch(`${API_BASE_URL}/api/users/resend-otp`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ email }),
            })

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}))
                throw new Error(errorData.message || "Failed to resend OTP")
            }

            return await response.json()
        } catch (error) {
            console.error("Resend OTP error:", error)
            throw error
        }
    }

    /**
     * Logout user (works for both auth methods)
     */
    async logout() {
        try {
            const authMethod = localStorage.getItem("authMethod")

            // For OAuth users, call the backend logout endpoint
            if (authMethod === "oauth") {
                await fetch(`${API_BASE_URL}/logout`, {
                    method: "POST",
                    credentials: "include",
                }).catch(() => {
                    // Ignore errors, we'll clear local state anyway
                })
            }

            this.clearStoredAuth()
            return { success: true }
        } catch (error) {
            console.error("Logout error:", error)
            // Always clear local state even on error
            this.clearStoredAuth()
            return { success: true }
        }
    }

    /**
     * Clear stored authentication data
     */
    clearStoredAuth() {
        localStorage.removeItem("authCredentials")
        localStorage.removeItem("authMethod")
        localStorage.removeItem("isLoggedIn")
        this.oauthToastShown = false
    }

    /**
     * Make authenticated API request
     */
    async authenticatedFetch(url, options = {}) {
        const authMethod = localStorage.getItem("authMethod")
        const defaultOptions = {
            headers: {},
        }

        if (authMethod === "basic") {
            const credentials = localStorage.getItem("authCredentials")
            if (credentials) {
                defaultOptions.headers["Authorization"] = `Basic ${credentials}`
            }
        }
        else if (authMethod === "oauth") {
            defaultOptions.credentials = "include"
        }

        // Don't override Content-Type if body is FormData
        if (!(options.body instanceof FormData)) {
            defaultOptions.headers["Content-Type"] = "application/json"
        }

        const mergedOptions = {
            ...defaultOptions,
            ...options,
            headers: {
                ...defaultOptions.headers,
                ...options.headers,
            },
        }

        // For OAuth, ensure credentials are included
        if (authMethod === "oauth") {
            mergedOptions.credentials = "include"
        }

        const response = await fetch(`${API_BASE_URL}${url}`, mergedOptions)

        // Handle 401 errors by clearing auth state
        if (response.status === 401) {
            this.clearStoredAuth()
            window.location.href = "/login"
            throw new Error("Authentication expired")
        }

        return response
    }

    /**
     * Add callback for when service is initialized
     */
    onInitialized(callback) {
        if (this.isInitialized) {
            callback()
        } else {
            this.pendingCallbacks.push(callback)
        }
    }
}

// Create and export singleton instance
const authService = new AuthService()
export default authService