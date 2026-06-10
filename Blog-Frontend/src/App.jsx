"use client"

import React, { lazy, Suspense, useEffect } from "react"
import { Toaster } from "./components/ui/toaster"
import { Toaster as Sonner } from "./components/ui/sonner"
import { TooltipProvider } from "./components/ui/tooltip"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom"

import Navbar from "./components/Navbar"
import Footer from "./components/Footer"
import { AuthProvider } from "./components/AuthContext"
import { PageSpinner } from "./components/shared/Spinner"
import { ScrollToTop } from "./components/shared/ScrollToTop"

// Home is eagerly imported (everyone lands here, no point splitting)
import Home from "./components/pages/Home"

// All other routes are lazy — each becomes its own chunk so the initial
// bundle stays small and TTI is fast.
const Login = lazy(() => import("./components/pages/Login"))
const Register = lazy(() => import("./components/pages/Register"))
const WriteBlog = lazy(() => import("./components/pages/WriteBlog"))
const NotFound = lazy(() => import("./components/pages/NotFound"))
const OTPVerification = lazy(() => import("./components/pages/OTPVerification"))
const UserProfile = lazy(() => import("./components/pages/UserProfile"))
const AllBlogs = lazy(() => import("./components/pages/AllBlogs"))
const BlogDetail = lazy(() => import("./components/pages/BlogDetail"))
const LinkNotAvailable = lazy(() => import("./components/pages/LinkNotAvailable"))
const EditBlog = lazy(() => import("./components/pages/EditBog"))
const Unsubscribe = lazy(() => import("./components/Unsubscribe"))
const UnsubscribeGeneral = lazy(() => import("./components/UnsubscribeGeneral"))

import "./App.css"

const queryClient = new QueryClient()

const ScrollRestoration = () => {
  const { pathname } = useLocation()
  useEffect(() => {
    window.history.scrollRestoration = "manual"
    window.scrollTo({ top: 0, behavior: "instant" })
  }, [pathname])
  return null
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <AuthProvider>
        <BrowserRouter>
          <ScrollRestoration />
          <a
            href="#main"
            className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-[100] focus:px-4 focus:py-2 focus:bg-accent focus:text-accent-ink focus:font-bold focus:tracking-[0.08em] focus:uppercase focus:text-xs focus:border focus:border-accent"
          >
            Skip to content
          </a>
          <div className="flex flex-col min-h-screen">
            <Navbar />
            <main id="main" className="flex-1">
              <Suspense fallback={<PageSpinner />}>
                <Routes>
                  <Route path="/" element={<Home />} />
                  <Route path="/login" element={<Login />} />
                  <Route path="/register" element={<Register />} />
                  <Route path="/verify-otp" element={<OTPVerification />} />
                  <Route path="/profile" element={<UserProfile />} />
                  <Route path="/write-blog" element={<WriteBlog />} />
                  <Route path="/blog/:id" element={<BlogDetail />} />
                  <Route path="/blogs" element={<AllBlogs />} />
                  <Route path="/link-not-available" element={<LinkNotAvailable />} />
                  <Route path="/otp-verification" element={<OTPVerification />} />
                  <Route path="/edit-blog/:id" element={<EditBlog />} />
                  <Route path="/unsubscribe" element={<Unsubscribe />} />
                  <Route path="/unsubscribe/general" element={<UnsubscribeGeneral />} />
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </Suspense>
            </main>
            <Footer />
          </div>
          <ScrollToTop />
          <Toaster />
          <Sonner />
        </BrowserRouter>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
)

export default App
