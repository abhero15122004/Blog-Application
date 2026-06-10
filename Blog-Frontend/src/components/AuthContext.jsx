"use client"

import { createContext, useState, useEffect } from "react"
import authService from "../services/authService"

export const AuthContext = createContext()

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null)
    const [isLoggedIn, setIsLoggedIn] = useState(false)
    const [authMethod, setAuthMethod] = useState(null)
    const [loading, setLoading] = useState(true)

    // Initialize auth service and check status
    useEffect(() => {
        const initializeAuth = async () => {
            try {
                setLoading(true)
                // Initialize auth service (handles OAuth callbacks)
                await authService.initialize()

                // Check current auth status
                const status = await authService.checkAuthStatus()
                if (status.isAuthenticated) {
                    setUser(status.user)
                    setIsLoggedIn(true)
                    setAuthMethod(status.method)
                    localStorage.setItem("isLoggedIn", "true")
                    console.log("User authenticated:", {
                        method: status.method,
                        user: status.user,
                        verified: status.user?.isVerified,
                    })
                } else {
                    setUser(null)
                    setIsLoggedIn(false)
                    setAuthMethod(null)
                    localStorage.removeItem("isLoggedIn")
                    console.log("User not authenticated")
                }
            } catch (error) {
                console.error("Auth initialization error:", error)
                setUser(null)
                setIsLoggedIn(false)
                setAuthMethod(null)
                localStorage.removeItem("isLoggedIn")
            } finally {
                setLoading(false)
            }
        }

        initializeAuth()
    }, [])

    /**
     * Login with email and password (Basic Auth)
     */
    const loginWithCredentials = async (email, password, onSuccess) => {
        try {
            setLoading(true)
            const result = await authService.loginWithCredentials(email, password)
            if (result.success) {
                setUser(result.user)
                setIsLoggedIn(true)
                setAuthMethod(result.method)
                localStorage.setItem("isLoggedIn", "true")
                console.log("Basic auth login successful:", result.user)
                if (onSuccess) onSuccess()
                return result
            }
        } catch (error) {
            console.error("Basic auth login failed:", error)
            throw error
        } finally {
            setLoading(false)
        }
    }

    /**
     * Initiate OAuth login
     */
    const loginWithOAuth = (provider) => {
        try {
            console.log(`Initiating ${provider} OAuth login`)
            authService.initiateOAuthLogin(provider)
        } catch (error) {
            console.error(`${provider} OAuth login failed:`, error)
            throw error
        }
    }

    /**
     * Register new user (Basic Auth only)
     */
    const register = async (formData) => {
        try {
            setLoading(true)
            const result = await authService.registerUser(formData)
            console.log("Registration successful:", result)
            return result
        } catch (error) {
            console.error("Registration failed:", error)
            throw error
        } finally {
            setLoading(false)
        }
    }

    /**
     * Verify OTP (Basic Auth only)
     */
    const verifyOTP = async (email, otp) => {
        try {
            setLoading(true)
            const result = await authService.verifyOTP(email, otp)
            console.log("OTP verification successful:", result)
            return result
        } catch (error) {
            console.error("OTP verification failed:", error)
            throw error
        } finally {
            setLoading(false)
        }
    }

    /**
     * Resend OTP (Basic Auth only)
     */
    const resendOTP = async (email) => {
        try {
            const result = await authService.resendOTP(email)
            console.log("OTP resent successfully")
            return result
        } catch (error) {
            console.error("Failed to resend OTP:", error)
            throw error
        }
    }

    /**
     * Logout user (works for both auth methods)
     */
    const logout = async () => {
        try {
            setLoading(true)
            await authService.logout()
            setUser(null)
            setIsLoggedIn(false)
            setAuthMethod(null)
            localStorage.removeItem("isLoggedIn")
            console.log("Logout successful")
        } catch (error) {
            console.error("Logout error:", error)
            // Always clear state even on error
            setUser(null)
            setIsLoggedIn(false)
            setAuthMethod(null)
            localStorage.removeItem("isLoggedIn")
        } finally {
            setLoading(false)
        }
    }

    /**
     * Refresh user data
     */
    const refreshUser = async () => {
        try {
            const status = await authService.checkAuthStatus()
            if (status.isAuthenticated) {
                setUser(status.user)
                setIsLoggedIn(true)
                setAuthMethod(status.method)
                return status.user
            } else {
                setUser(null)
                setIsLoggedIn(false)
                setAuthMethod(null)
                return null
            }
        } catch (error) {
            console.error("Failed to refresh user:", error)
            setUser(null)
            setIsLoggedIn(false)
            setAuthMethod(null)
            throw error
        }
    }

    const contextValue = {
        // State
        user,
        isLoggedIn,
        authMethod,
        loading,
        // Basic Auth methods
        loginWithCredentials,
        register,
        verifyOTP,
        resendOTP,
        // OAuth methods
        loginWithOAuth,
        // Common methods
        logout,
        refreshUser,
        // Utility methods
        isBasicAuth: authMethod === "basic",
        isOAuth: authMethod === "oauth",
    }

    return <AuthContext.Provider value={contextValue}>{children}</AuthContext.Provider>
}