import React, { useContext, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { AuthContext } from './AuthContext';

/**
 * Protected Route Component
 * Handles authentication for both OAuth and Basic Auth users
 */
const ProtectedRoute = ({ children, requireVerification = true }) => {
    const { isLoggedIn, user, authMethod, loading } = useContext(AuthContext);
    const navigate = useNavigate();
    const location = useLocation();

    useEffect(() => {
        if (loading) return; // Wait for auth check to complete

        if (!isLoggedIn) {
            // Store the current path for redirect after login
            localStorage.setItem('redirectAfterLogin', location.pathname);
            navigate('/login', { replace: true });
            return;
        }

        // For Basic Auth users, check verification status
        if (authMethod === 'basic' && requireVerification && !user?.isVerified) {
            navigate('/verify-otp', {
                state: { email: user?.email },
                replace: true
            });
            return;
        }

        // OAuth users are automatically verified, so they can access protected routes

    }, [isLoggedIn, user, authMethod, loading, navigate, location.pathname, requireVerification]);

    // Show loading spinner while checking authentication
    if (loading) {
        return (
            <div className="pt-20 min-h-screen bg-black flex items-center justify-center">
                <div className="w-8 h-8 border-4 border-t-white border-r-white/30 border-b-white/10 border-l-white/60 rounded-full animate-spin"></div>
            </div>
        );
    }

    // Don't render anything if not authenticated (will redirect in useEffect)
    if (!isLoggedIn) {
        return null;
    }

    // Don't render if Basic Auth user is not verified (will redirect in useEffect)
    if (authMethod === 'basic' && requireVerification && !user?.isVerified) {
        return null;
    }

    // Render the protected content
    return children;
};

export default ProtectedRoute;