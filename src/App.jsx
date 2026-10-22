import React, { useState, useEffect, useMemo, useRef } from 'react'
import {
  Search, Phone, Send, ShieldCheck, CheckCircle2, Star, Filter,
  ArrowRight, X, Download, SlidersHorizontal, Package, Tag,
  Clock, MapPin, Check, ChevronDown, ChevronUp,
  MessageCircle, Sparkles, RotateCcw, Zap, ShoppingBag, ShoppingCart, Plus,
  LayoutGrid, Cog, Cpu, Layers, Box, Home, Lock
} from 'lucide-react'
import { getStoredParts, fetchLiveParts } from './services/apiService'
import { FilterSidebar } from './components/FilterSidebar'
import { FlipkartCategoryView } from './components/FlipkartCategoryView'
import { DealsOfTheDay } from './components/DealsOfTheDay'
import { AdminPageView } from './components/AdminPageView'
import { ProductCardImageCarousel } from './components/ProductCardImageCarousel'

export default function App() {
  // Real-time parts state synced with Central API & local storage
  const [parts, setParts] = useState(() => {
    const raw = getStoredParts() || [];
    const seen = new Set();
    return raw.filter(p => {
      const k = String(p.code || p.id || '').trim();
      if (k && seen.has(k)) return false;
      if (k) seen.add(k);
      return true;
    });
  })
  const [isFlipkartCategoriesOpen, setIsFlipkartCategoriesOpen] = useState(false)
  
  // Page View state: 'shop' (default catalog) | 'admin' (in-page workstation)
  const [currentPage, setCurrentPage] = useState(() => {
    const hash = (typeof window !== 'undefined' ? window.location.hash : '').toLowerCase()
    const search = (typeof window !== 'undefined' ? window.location.search : '').toLowerCase()
    return (hash.includes('admin') || search.includes('admin')) ? 'admin' : 'shop'
  })

  // Secret Logo Multi-Click Tracker (3 quick clicks opens Admin Page)
  const logoClicksRef = useRef({ count: 0, lastTime: 0 })

  const handleLogoClick = () => {
    const now = Date.now()
    if (now - logoClicksRef.current.lastTime < 500) {
      logoClicksRef.current.count += 1
    } else {
      logoClicksRef.current.count = 1
    }
    logoClicksRef.current.lastTime = now

    if (logoClicksRef.current.count >= 3) {
      setCurrentPage('admin')
      window.location.hash = 'admin'
      logoClicksRef.current.count = 0
    } else {
      if (currentPage === 'admin') {
        setCurrentPage('shop')
        history.replaceState(null, '', window.location.pathname)
      } else {
        handleGoHome()
      }
    }
  }

  // Reload parts from API
  const refreshParts = () => {
    fetchLiveParts().then(({ parts: liveParts }) => {
      const seen = new Set();
      const deduped = (liveParts || []).filter(p => {
        const k = String(p.code || p.id || '').trim();
        if (k && seen.has(k)) return false;
        if (k) seen.add(k);
        return true;
      });
      setParts(deduped);
    });
  };

  useEffect(() => {
    const handleSync = () => {
      const stored = getStoredParts();
      const seen = new Set();
      const deduped = (stored || []).filter(p => {
        const k = String(p.code || p.id || '').trim();
        if (k && seen.has(k)) return false;
        if (k) seen.add(k);
        return true;
      });
      setParts(deduped);
    };
    window.addEventListener('parts_updated', handleSync);
    window.addEventListener('storage', handleSync);

    // Initial Live Sync from API
    refreshParts()

    // ── HOW TO OPEN ADMIN PANEL (IN-PAGE WORKSTATION) WITHOUT A BUTTON: ──
    // 1. Visit URL hash: #admin (e.g. http://localhost:5173/#admin)
    // 2. Visit URL query: ?admin or ?admin=true
    const checkAdminRoute = () => {
      const hash = (window.location.hash || '').toLowerCase()
      const search = (window.location.search || '').toLowerCase()
      if (hash.includes('admin') || search.includes('admin')) {
        setCurrentPage('admin')
      }
    }
    checkAdminRoute()
    window.addEventListener('hashchange', checkAdminRoute)

    // 3. Keyboard Shortcut: Ctrl + Shift + A  OR  Alt + A
    const handleKeyDown = (e) => {
      if (
        (e.ctrlKey && e.shiftKey && (e.key === 'A' || e.key === 'a')) ||
        (e.altKey && (e.key === 'A' || e.key === 'a')) ||
        (e.ctrlKey && e.altKey && (e.key === 'A' || e.key === 'a'))
      ) {
        e.preventDefault()
        setCurrentPage(prev => {
          const next = prev === 'admin' ? 'shop' : 'admin'
          if (next === 'admin') {
            window.location.hash = 'admin'
          } else {
            history.replaceState(null, '', window.location.pathname)
          }
          return next
        })
      }
    }
    window.addEventListener('keydown', handleKeyDown)

    // 4. Global window function: openAdmin() or admin() in browser console (F12)
    window.openAdmin = () => {
      setCurrentPage('admin')
      window.location.hash = 'admin'
    }
    window.admin = window.openAdmin

    window.openShop = () => {
      setCurrentPage('shop')
      history.replaceState(null, '', window.location.pathname)
    }
    window.shop = window.openShop

    return () => {
      window.removeEventListener('parts_updated', handleSync)
      window.removeEventListener('storage', handleSync)
      window.removeEventListener('hashchange', checkAdminRoute)
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [])

  // Search & Filter State (Amazon / Flipkart Style)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('All Categories')
  const [priceRange, setPriceRange] = useState('all') // 'all' | 'under-25k' | '25k-50k' | '50k-100k' | 'above-100k' | 'custom'
  const [maxPriceLimit, setMaxPriceLimit] = useState(250000)
  const [inStockOnly, setInStockOnly] = useState(false)
  const [selectedBadges, setSelectedBadges] = useState([])
  const [sortBy, setSortBy] = useState('featured') // 'featured' | 'price-asc' | 'price-desc' | 'name-asc'
  const [isMobileFilterOpen, setIsMobileFilterOpen] = useState(false)

  // Dynamic categories with "All Categories" as default
  const allCategories = useMemo(() => {
    const set = new Set(['All Categories'])
    parts.forEach((p) => {
      if (p.category && p.category !== 'All Products' && p.category !== 'All Categories') {
        set.add(p.category)
      }
    })
    return Array.from(set)
  }, [parts])

  // Category counts
  const categoryCounts = useMemo(() => {
    const counts = { 'All Categories': parts.length }
    parts.forEach((p) => {
      if (p.category) {
        counts[p.category] = (counts[p.category] || 0) + 1
      }
    })
    return counts
  }, [parts])

  // Available unique badges
  const availableBadges = useMemo(() => {
    const set = new Set()
    parts.forEach((p) => {
      if (p.badge && p.badge.trim().toLowerCase() !== 'oem standard') {
        set.add(p.badge)
      }
    })
    return Array.from(set)
  }, [parts])

  // Badge counts
  const badgeCounts = useMemo(() => {
    const counts = {}
    parts.forEach((p) => {
      if (p.badge && p.badge.trim().toLowerCase() !== 'oem standard') {
        counts[p.badge] = (counts[p.badge] || 0) + 1
      }
    })
    return counts
  }, [parts])

  // Toggle single badge in multi-select list
  const toggleBadge = (badge) => {
    setSelectedBadges((prev) =>
      prev.includes(badge) ? prev.filter((b) => b !== badge) : [...prev, badge]
    )
  }

  // Reset all filters
  const handleResetFilters = () => {
    setSelectedCategory('All Categories')
    setPriceRange('all')
    setMaxPriceLimit(250000)
    setInStockOnly(false)
    setSelectedBadges([])
    setSearchQuery('')
  }

  // Active filter count for mobile badge
  const activeFiltersCount = useMemo(() => {
    let count = 0
    if (selectedCategory && selectedCategory !== 'All Categories') count++
    if (priceRange !== 'all' || maxPriceLimit < 250000) count++
    if (inStockOnly) count++
    if (selectedBadges.length > 0) count += selectedBadges.length
    if (searchQuery.trim()) count++
    return count
  }, [selectedCategory, priceRange, maxPriceLimit, inStockOnly, selectedBadges, searchQuery])

  // Filtered and Sorted Products (Flipkart / Amazon Logic)
  const filteredProducts = useMemo(() => {
    let list = [...parts]

    // Category filter
    if (selectedCategory && selectedCategory !== 'All Categories') {
      list = list.filter((p) => p.category === selectedCategory)
    }

    // Price range & max price limit
    if (priceRange !== 'all') {
      list = list.filter((p) => {
        const price = Number(p.price) || 0
        if (price === 0) return true // Price on Request / unpriced items always remain visible
        if (priceRange === 'under-25k') return price < 25000
        if (priceRange === '25k-50k') return price >= 25000 && price <= 50000
        if (priceRange === '50k-100k') return price > 50000 && price <= 100000
        if (priceRange === 'above-100k') return price > 100000
        if (priceRange === 'custom') return price <= maxPriceLimit
        return true
      })
    } else if (maxPriceLimit < 250000) {
      list = list.filter((p) => {
        const price = Number(p.price) || 0
        if (price === 0) return true
        return price <= maxPriceLimit
      })
    }

    // Availability
    if (inStockOnly) {
      list = list.filter((p) => p.inStock)
    }

    // Classification Badges (Multi-select)
    if (selectedBadges.length > 0) {
      list = list.filter((p) => p.badge && selectedBadges.includes(p.badge))
    }

    // Search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim()
      list = list.filter(
        (p) =>
          (p.title && p.title.toLowerCase().includes(q)) ||
          ((p.itemCode || p.code) && (p.itemCode || p.code).toLowerCase().includes(q)) ||
          (p.category && p.category.toLowerCase().includes(q)) ||
          (p.specs && p.specs.some((s) => (s.value && s.value.toLowerCase().includes(q)) || (s.label && s.label.toLowerCase().includes(q))))
      )
    }

    // Sorting
    if (sortBy === 'price-asc') {
      list.sort((a, b) => Number(a.price) - Number(b.price))
    } else if (sortBy === 'price-desc') {
      list.sort((a, b) => Number(b.price) - Number(a.price))
    } else if (sortBy === 'name-asc') {
      list.sort((a, b) => (a.title || '').localeCompare(b.title || ''))
    }

    return list
  }, [parts, searchQuery, selectedCategory, priceRange, maxPriceLimit, inStockOnly, selectedBadges, sortBy])

  const INITIAL_ENQUIRY_FORM = {
    name: '',
    phone: '',
    whatsapp: '',
    email: '',
    city: '',
    gst: '',
    message: ''
  }

  // Modal State for "Contact Supplier" / "Get Best Price"
  const [enquiryItem, setEnquiryItem] = useState(null)
  const [enquiryQuantity, setEnquiryQuantity] = useState(1)
  const [enquiryForm, setEnquiryForm] = useState(INITIAL_ENQUIRY_FORM)
  const [sameAsMobile, setSameAsMobile] = useState(true)
  const [enquirySubmitted, setEnquirySubmitted] = useState(false)
  const [isSubmittingEnquiry, setIsSubmittingEnquiry] = useState(false)
  const [enquiryError, setEnquiryError] = useState('')
  const [formErrors, setFormErrors] = useState({})
  const [isClosing, setIsClosing] = useState(false)

  // Quantity Change Handler (allow typing, limit between 1 and 500)
  const handleQuantityChange = (e) => {
    const val = e.target.value.replace(/[^0-9]/g, '')
    if (val === '') {
      setEnquiryQuantity('')
      return
    }
    const num = parseInt(val, 10)
    if (num > 500) {
      setEnquiryQuantity(500)
    } else {
      setEnquiryQuantity(num)
    }
  }

  const handleQuantityBlur = () => {
    const num = parseInt(enquiryQuantity, 10)
    if (isNaN(num) || num < 1) {
      setEnquiryQuantity(1)
    } else if (num > 500) {
      setEnquiryQuantity(500)
    } else {
      setEnquiryQuantity(num)
    }
  }

  // Open Enquiry Modal
  const handleOpenEnquiry = (product) => {
    setEnquiryItem(product)
    setEnquiryQuantity(1)
    setEnquiryForm(INITIAL_ENQUIRY_FORM)
    setSameAsMobile(true)
    setEnquirySubmitted(false)
    setEnquiryError('')
    setFormErrors({})
    setIsClosing(false)
  }

  // Smooth close
  const handleCloseEnquiry = () => {
    setIsClosing(true)
    setEnquirySubmitted(false)
    setTimeout(() => {
      setEnquiryItem(null)
      setIsClosing(false)
      setEnquiryForm(INITIAL_ENQUIRY_FORM)
      setSameAsMobile(true)
      setEnquiryError('')
      setFormErrors({})
    }, 280)
  }

  // Smooth scroll to catalog section
  const handleScrollToCatalog = () => {
    const el = document.getElementById('catalog-section')
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' })
    }
  }

  // Select category from Hero banner and jump to catalog
  const handleSelectCategoryFromHero = (category) => {
    setSelectedCategory(category)
    handleScrollToCatalog()
  }

  // Go to Home (resets category and search back to default Home view)
  const handleGoHome = () => {
    setSelectedCategory('All Categories')
    setSearchQuery('')
    setPriceRange('all')
    setSelectedBadges([])
    setIsFlipkartCategoriesOpen(false)
    setIsMobileFilterOpen(false)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const isHomePage = selectedCategory === 'All Categories' && !searchQuery

  // Escape key handler
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && enquiryItem && !isClosing) {
        handleCloseEnquiry()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [enquiryItem, isClosing])

  // Form Validation
  const validateField = (name, value) => {
    let err = ''
    if (name === 'name') {
      const trimmed = (value || '').trim()
      if (!trimmed) {
        err = 'Full name is required'
      } else if (!/^[a-zA-Z\s]+$/.test(trimmed)) {
        err = 'Name should take only alphabets'
      } else if (trimmed.length < 2) {
        err = 'Name must be at least 2 letters'
      }
    } else if (name === 'phone') {
      const cleanPhone = (value || '').trim()
      if (!cleanPhone) {
        err = 'Mobile number is required'
      } else if (!/^[0-9]+$/.test(cleanPhone)) {
        err = 'Mobile number should take only numbers'
      } else if (cleanPhone.length !== 10) {
        err = 'Mobile number must be exactly 10 digits'
      }
    } else if (name === 'whatsapp') {
      const cleanPhone = (value || '').trim()
      if (!cleanPhone) {
        err = 'WhatsApp number is required'
      } else if (!/^[0-9]+$/.test(cleanPhone)) {
        err = 'WhatsApp number should take only numbers'
      } else if (cleanPhone.length !== 10) {
        err = 'WhatsApp number must be exactly 10 digits'
      }
    } else if (name === 'email') {
      const trimmed = (value || '').trim().toLowerCase()
      if (trimmed && !/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/i.test(trimmed)) {
        err = 'Please enter a valid email address'
      }
    } else if (name === 'gst') {
      const cleanGst = (value || '').trim().toUpperCase()
      if (cleanGst) {
        if (!/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/i.test(cleanGst) && cleanGst.length !== 15) {
          err = 'Please enter a valid 15-character GSTIN (e.g. 29AAAAA0000A1Z5)'
        }
      }
    }
    return err
  }

  const validateAll = () => {
    const errors = {}
    const nameErr = validateField('name', enquiryForm.name)
    if (nameErr) errors.name = nameErr

    const phoneErr = validateField('phone', enquiryForm.phone)
    if (phoneErr) errors.phone = phoneErr

    const whatsappErr = validateField('whatsapp', enquiryForm.whatsapp)
    if (whatsappErr) errors.whatsapp = whatsappErr

    const emailErr = validateField('email', enquiryForm.email)
    if (emailErr) errors.email = emailErr

    const gstErr = validateField('gst', enquiryForm.gst)
    if (gstErr) errors.gst = gstErr

    setFormErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleToggleSameAsMobile = (e) => {
    const checked = e.target.checked
    setSameAsMobile(checked)
    if (checked) {
      setEnquiryForm((prev) => ({ ...prev, whatsapp: prev.phone }))
      if (formErrors.whatsapp) {
        const err = validateField('whatsapp', enquiryForm.phone)
        setFormErrors((prev) => ({ ...prev, whatsapp: err }))
      }
    }
  }

  const handleEnquiryChange = (e) => {
    let { name, value } = e.target

    if (name === 'name') {
      value = value.replace(/[^a-zA-Z\s]/g, '')
    } else if (name === 'phone') {
      value = value.replace(/[^0-9]/g, '').slice(0, 10)
    } else if (name === 'whatsapp') {
      value = value.replace(/[^0-9]/g, '').slice(0, 10)
    } else if (name === 'gst') {
      value = value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 15)
    } else if (name === 'email') {
      value = value.toLowerCase()
    }

    setEnquiryForm((prev) => {
      const next = { ...prev, [name]: value }
      if (name === 'phone' && sameAsMobile) {
        next.whatsapp = value
      }
      return next
    })

    if (formErrors[name]) {
      const err = validateField(name, value)
      setFormErrors((prev) => ({ ...prev, [name]: err }))
    }
    if (name === 'phone' && sameAsMobile && formErrors.whatsapp) {
      const wErr = validateField('whatsapp', value)
      setFormErrors((prev) => ({ ...prev, whatsapp: wErr }))
    }
    if (enquiryError) {
      setEnquiryError('')
    }
  }

  const handleEnquiryBlur = (e) => {
    const { name, value } = e.target
    const err = validateField(name, value)
    setFormErrors((prev) => ({ ...prev, [name]: err }))
  }

  // Submit Enquiry directly to sales@sbdat.com
  const handleSubmitEnquiry = async (e) => {
    e.preventDefault()
    if (!validateAll()) {
      return
    }

    setIsSubmittingEnquiry(true)
    setEnquiryError('')

    const partCode = enquiryItem.itemCode || enquiryItem.code || 'PART'
    const unitPrice = Number(enquiryItem.price) || 0
    const qty = Math.min(500, Math.max(1, parseInt(enquiryQuantity, 10) || 1))
    const totalPrice = unitPrice * qty

    const payload = {
      recipient: 'sales@sbdat.com',
      name: enquiryForm.name.trim(),
      phone: enquiryForm.phone.trim() || enquiryForm.whatsapp.trim(),
      whatsapp: enquiryForm.whatsapp.trim() || enquiryForm.phone.trim(),
      gstin: enquiryForm.gst ? enquiryForm.gst.trim().toUpperCase() : '',
      email: enquiryForm.email.trim() || '',
      city: enquiryForm.city.trim() || '',
      message: enquiryForm.message.trim() || '',
      partCode,
      partTitle: enquiryItem.title,
      quantity: qty,
      unitPrice,
      totalPrice,
      unit: enquiryItem.priceUnit || enquiryItem.unit || 'Piece'
    }

    // 1. Submit to API endpoint (sales@sbdat.com)
    try {
      const endpoints = ['/api/quote.php', 'https://sbelevators.com/api/quote.php']
      for (const url of endpoints) {
        try {
          const res = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
          })
          if (res.ok) break
        } catch {}
      }
    } catch (err) {
      console.warn('Quote submit notice:', err)
    }

    // 2. Prepare direct mailto link to sales@sbdat.com
    const subject = `Order Request: [${partCode}] ${enquiryItem.title} - ${enquiryForm.name.trim()}`
    const body = 
      `ORDER REQUEST FOR SB ELEVATORS\n` +
      `Submitted To: sales@sbdat.com\n\n` +
      `ITEM SPECIFICATIONS:\n` +
      `• Part Code: ${partCode}\n` +
      `• Part Name: ${enquiryItem.title}\n` +
      `• Quantity: ${qty} ${payload.unit}s\n` +
      (unitPrice > 0 ? `• Estimated Unit Price: ₹${unitPrice.toLocaleString('en-IN')}\n• Total Estimated: ₹${totalPrice.toLocaleString('en-IN')}\n\n` : `\n`) +
      `BUYER DETAILS:\n` +
      `• Name: ${enquiryForm.name.trim()}\n` +
      `• Mobile Number: ${enquiryForm.phone.trim()}\n` +
      `• WhatsApp Number: ${enquiryForm.whatsapp.trim()}\n` +
      (enquiryForm.gst ? `• GSTIN: ${enquiryForm.gst.trim().toUpperCase()}\n` : '') +
      `• Email: ${enquiryForm.email.trim() || 'Not Provided'}\n` +
      `• City: ${enquiryForm.city.trim() || 'Not Provided'}\n` +
      (enquiryForm.message ? `• Requirement: ${enquiryForm.message.trim()}\n\n` : '\n') +
      `Please provide formal order confirmation and delivery schedule.`

    const mailtoUrl = `mailto:sales@sbdat.com?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`
    
    // Save to localStorage for permanent tracking
    try {
      const existingQuotes = JSON.parse(localStorage.getItem('sb_submitted_quotations') || '[]')
      existingQuotes.unshift({
        id: `REQ-${Date.now()}`,
        date: new Date().toISOString(),
        ...payload
      })
      localStorage.setItem('sb_submitted_quotations', JSON.stringify(existingQuotes.slice(0, 50)))
    } catch {}

    setIsSubmittingEnquiry(false)
    setEnquirySubmitted(true)
  }

  return (
    <div className={`min-h-screen ${currentPage === 'admin' ? 'h-screen overflow-hidden pb-0' : 'lg:h-screen lg:overflow-hidden pb-20 lg:pb-[48px]'} bg-[#F4F6F9] text-slate-900 font-sans flex flex-col selection:bg-[#0745A7]/10 selection:text-[#0745A7]`}>
      
      {/* ── TOP UTILITY BRAND BAR (Amazon / Flipkart E-Commerce Style) ── */}
      <header className="bg-[#0745A7] text-white py-2.5 px-4 sm:px-6 lg:px-8 shadow-xs sticky top-0 z-40">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-3 sm:gap-6">
          
          {/* Logo (Click = Home; 3 fast clicks = Opens Admin Panel) */}
          <div 
            onClick={handleLogoClick}
            className="flex items-center gap-2 shrink-0 cursor-pointer select-none group"
            title="SB Elevators (Triple-click for Admin Panel)"
          >
            <span className="font-bold tracking-tight text-base sm:text-lg md:text-xl text-white group-hover:text-amber-300 transition-colors">
              SB ELEVATORS
            </span>
            <ShoppingCart className="text-white w-5 h-5 sm:w-6 sm:h-6 group-hover:scale-110 transition-transform" strokeWidth={2.2} />
          </div>

          {/* Center Search Input in Header (Like Amazon / Flipkart) */}
          <div className="flex-1 max-w-xl relative hidden md:block">
            <div className="relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search elevator parts, codes (e.g. SB-TM-450), motors, door systems..."
                className="w-full pl-9 pr-8 py-2 rounded-xl bg-white text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-400 shadow-sm"
              />
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={15} />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5"
                >
                  <X size={14} />
                </button>
              )}
            </div>
          </div>

          {/* Quick Helpline */}
          <div className="flex items-center gap-2 sm:gap-3 text-xs font-medium shrink-0">
            <a 
              href="tel:+918048956234" 
              className="flex items-center gap-1.5 hover:text-amber-300 transition-colors bg-white/10 hover:bg-white/15 px-3 py-1.5 rounded-lg text-xs"
              title="Call Helpline"
            >
              <Phone size={13} className="text-amber-300 shrink-0" />
              <span className="hidden sm:inline text-white/90">Helpline:</span>
              <strong className="text-white font-bold">+91 80489 56234</strong>
            </a>
          </div>

        </div>

        {/* Mobile Search Input */}
        <div className="md:hidden mt-2 pt-1 border-t border-white/10">
          <div className="relative">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search parts, codes (e.g. SB-TM-450)..."
              className="w-full pl-9 pr-8 py-1.5 rounded-lg bg-white text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none"
            />
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 p-0.5"
              >
                <X size={14} />
              </button>
            )}
          </div>
        </div>
      </header>

      {/* ── IN-PAGE WORKSTATION: ADMIN PAGE VIEW (NO POPUP MODAL) ── */}
      {currentPage === 'admin' ? (
        <div className="flex-1 min-h-0 w-full overflow-y-auto overscroll-contain no-scrollbar [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
          <AdminPageView
            onBackToStore={() => {
              setCurrentPage('shop')
              history.replaceState(null, '', window.location.pathname)
            }}
            parts={parts}
            onPartsUpdated={refreshParts}
          />
        </div>
      ) : (
        <div className="w-full bg-white flex-1 min-h-0 flex flex-col">
          <div className="max-w-7xl mx-auto w-full h-full flex flex-col lg:flex-row items-stretch min-h-0 flex-1">
            
            {/* ── LEFT SIDEBAR FILTERS (Independent Scrolling Column) ── */}
            <FilterSidebar
              allCategories={allCategories}
              selectedCategory={selectedCategory}
              setSelectedCategory={setSelectedCategory}
              categoryCounts={categoryCounts}
              priceRange={priceRange}
              setPriceRange={setPriceRange}
              maxPriceLimit={maxPriceLimit}
              setMaxPriceLimit={setMaxPriceLimit}
              inStockOnly={inStockOnly}
              setInStockOnly={setInStockOnly}
              selectedBadges={selectedBadges}
              toggleBadge={toggleBadge}
              availableBadges={availableBadges}
              badgeCounts={badgeCounts}
              totalResults={filteredProducts.length}
              onResetFilters={handleResetFilters}
              isMobileOpen={isMobileFilterOpen}
              setIsMobileOpen={setIsMobileFilterOpen}
            />

            {/* ── RIGHT MAIN COLUMN (Hero Section, Catalog & Footer - Independent Scrolling Column) ── */}
            <div id="catalog-section" className="flex-1 w-full min-w-0 lg:h-full lg:overflow-y-auto lg:overscroll-contain bg-white flex flex-col justify-between no-scrollbar [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
              <div>
                {/* Category / Search Mode Breadcrumb Header (when not on root Home) */}
                {!isHomePage && (
                  <div className="bg-white border-b border-slate-200 py-2.5 px-4 sm:px-6">
                    <div className="flex items-center justify-between gap-3 flex-wrap">
                      <div className="flex items-center gap-2 text-xs text-slate-500">
                        <button
                          type="button"
                          onClick={handleGoHome}
                          className="hover:text-[#0745A7] font-bold flex items-center gap-1 cursor-pointer text-slate-700"
                        >
                          <Home size={13} />
                          <span>Home</span>
                        </button>
                        <span>/</span>
                        <span className="font-extrabold text-slate-900">{selectedCategory}</span>
                        {searchQuery && (
                          <span className="text-slate-500">
                            — searching "{searchQuery}"
                          </span>
                        )}
                      </div>

                      <button
                        type="button"
                        onClick={handleGoHome}
                        className="text-xs font-bold text-[#0745A7] hover:text-[#053787] flex items-center gap-1 cursor-pointer"
                      >
                        <span>← Back to Home</span>
                      </button>
                    </div>
                  </div>
                )}

                {/* Hero Section: Deals of the Day (Top of Main Page Content) */}
                {isHomePage && (
                  <DealsOfTheDay
                    parts={parts}
                    onOpenShopNow={handleOpenEnquiry}
                  />
                )}

                {/* ── RIGHT PRODUCT CATALOG AREA ── */}
                <main className="w-full min-w-0 p-2 sm:p-5 lg:p-6 bg-white">
            
            {/* Top Product Controls Bar */}
            <div className="space-y-2 pb-3 mb-2 border-b border-slate-100">

              {/* Row 1: Filters button + Result count */}
              <div className="flex items-center justify-between gap-2">
                {/* Mobile Filter Button (Flipkart style) */}
                <button
                  type="button"
                  onClick={() => setIsMobileFilterOpen(true)}
                  className="lg:hidden bg-slate-50 hover:bg-slate-100 text-slate-800 font-bold px-3 py-1.5 rounded-lg text-xs flex items-center gap-1.5 border border-slate-300 cursor-pointer shrink-0"
                >
                  <Filter size={13} className="text-[#0745A7]" />
                  <span>Filters</span>
                  {activeFiltersCount > 0 && (
                    <span className="bg-[#0745A7] text-white text-[10px] w-4 h-4 rounded-full flex items-center justify-center font-bold">
                      {activeFiltersCount}
                    </span>
                  )}
                </button>

                <p className="text-xs sm:text-sm text-slate-600 font-medium truncate">
                  Showing <strong className="text-slate-900 font-bold">{filteredProducts.length}</strong> items
                  {selectedCategory !== 'All Categories' && (
                    <span> in <strong className="text-[#0745A7]">{selectedCategory}</strong></span>
                  )}
                </p>
              </div>

              {/* Row 2: Sort Dropdown — full width on mobile */}
              <div className="flex items-center gap-2 text-xs">
                <span className="text-slate-500 font-medium shrink-0">Sort by:</span>
                <div className="relative flex-1">
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="w-full appearance-none bg-white border border-slate-300 rounded-lg pl-3 pr-7 py-2 text-xs font-semibold text-slate-800 focus:outline-none focus:border-[#0745A7] cursor-pointer shadow-2xs"
                  >
                    <option value="featured">Featured</option>
                    <option value="price-asc">Price: Low to High</option>
                    <option value="price-desc">Price: High to Low</option>
                    <option value="name-asc">Name: A to Z</option>
                  </select>
                  <ChevronDown size={13} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                </div>
              </div>

            </div>

            {/* Active Filters Pill Strip */}
            {(selectedCategory !== 'All Categories' || priceRange !== 'all' || maxPriceLimit < 250000 || inStockOnly || selectedBadges.length > 0 || searchQuery) && (
              <div className="rounded-lg bg-slate-50 border border-slate-200 px-3 py-2.5 mb-4">
                {/* Header row: label + clear all */}
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[11px] text-slate-500 font-semibold uppercase tracking-wide">Active Filters</span>
                  <button
                    type="button"
                    onClick={handleResetFilters}
                    className="text-[11px] text-[#0745A7] hover:underline font-bold cursor-pointer"
                  >
                    Clear All
                  </button>
                </div>

                {/* Pills row */}
                <div className="flex flex-wrap items-center gap-1.5">
                  {selectedCategory !== 'All Categories' && (
                    <span className="inline-flex items-center gap-1 bg-[#0745A7]/10 text-[#0745A7] px-2.5 py-1 rounded-md text-[11px] font-semibold border border-[#0745A7]/20">
                      Category: {selectedCategory}
                      <button type="button" onClick={() => setSelectedCategory('All Categories')} className="ml-0.5 hover:text-[#0745A7]/60 cursor-pointer">
                        <X size={11} />
                      </button>
                    </span>
                  )}

                  {priceRange !== 'all' && priceRange !== 'custom' && (
                    <span className="inline-flex items-center gap-1 bg-amber-50 text-amber-900 px-2.5 py-1 rounded-md text-[11px] font-semibold border border-amber-200">
                      Price: {priceRange}
                      <button type="button" onClick={() => { setPriceRange('all'); setMaxPriceLimit(250000); }} className="ml-0.5 hover:text-amber-700 cursor-pointer">
                        <X size={11} />
                      </button>
                    </span>
                  )}

                  {maxPriceLimit < 250000 && (
                    <span className="inline-flex items-center gap-1 bg-amber-50 text-amber-900 px-2.5 py-1 rounded-md text-[11px] font-semibold border border-amber-200">
                      Budget: Up to ₹{Number(maxPriceLimit).toLocaleString('en-IN')}
                      <button type="button" onClick={() => { setMaxPriceLimit(250000); setPriceRange('all'); }} className="ml-0.5 hover:text-amber-700 cursor-pointer">
                        <X size={11} />
                      </button>
                    </span>
                  )}

                  {inStockOnly && (
                    <span className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-800 px-2.5 py-1 rounded-md text-[11px] font-semibold border border-emerald-200">
                      In Stock Only
                      <button type="button" onClick={() => setInStockOnly(false)} className="ml-0.5 hover:text-emerald-600 cursor-pointer">
                        <X size={11} />
                      </button>
                    </span>
                  )}

                  {selectedBadges.map((badge) => (
                    <span key={badge} className="inline-flex items-center gap-1 bg-slate-100 text-slate-800 px-2.5 py-1 rounded-md text-[11px] font-semibold border border-slate-300">
                      {badge}
                      <button type="button" onClick={() => toggleBadge(badge)} className="ml-0.5 hover:text-slate-600 cursor-pointer">
                        <X size={11} />
                      </button>
                    </span>
                  ))}

                  {searchQuery && (
                    <span className="inline-flex items-center gap-1 bg-blue-50 text-blue-800 px-2.5 py-1 rounded-md text-[11px] font-semibold border border-blue-200">
                      "{searchQuery}"
                      <button type="button" onClick={() => setSearchQuery('')} className="ml-0.5 hover:text-blue-600 cursor-pointer">
                        <X size={11} />
                      </button>
                    </span>
                  )}
                </div>
              </div>
            )}

            {/* ── PRODUCT CARDS GRID (Flipkart / Amazon Style) ── */}
            {filteredProducts.length === 0 ? (
              <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center max-w-lg mx-auto shadow-xs my-6">
                <Package size={48} className="mx-auto text-slate-300 mb-3" />
                <h3 className="text-base font-bold text-slate-900">
                  {parts.length === 0 ? 'Catalog is Ready (0 Products)' : 'No components match selected filters'}
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  {parts.length === 0
                    ? 'All dummy data removed. You can now publish your actual elevator spare parts from the Admin Panel.'
                    : 'Try clearing some filters on the left sidebar to view available elevator inventory.'}
                </p>
                {parts.length === 0 ? (
                  <button
                    onClick={() => { setCurrentPage('admin'); window.location.hash = 'admin'; }}
                    className="mt-4 text-xs font-semibold px-4 py-2 rounded-xl bg-[#0745A7] text-white hover:bg-[#053787] transition-colors cursor-pointer"
                  >
                    Open Admin Panel to Add Parts
                  </button>
                ) : (
                  <button
                    onClick={handleResetFilters}
                    className="mt-4 text-xs font-semibold px-4 py-2 rounded-xl bg-[#0745A7] text-white hover:bg-[#053787] transition-colors cursor-pointer"
                  >
                    Reset All Filters
                  </button>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-2 xl:grid-cols-3 gap-2 sm:gap-4 lg:gap-5 items-stretch">
                {filteredProducts.map((product, idx) => {
                  const displayCode = product.itemCode || product.code || ''
                  const displayUnit = product.priceUnit || product.unit || 'Piece'

                  return (
                    <div
                      key={`${product.id || product.code || 'product'}-${idx}`}
                      className="bg-white border border-slate-200/90 hover:border-[#0745A7]/40 rounded-xl sm:rounded-2xl shadow-2xs hover:shadow-md transition-all duration-200 flex flex-col justify-between overflow-hidden group select-none"
                    >
                      <div>
                        {/* Top Product Image Showcase */}
                        <div className="relative bg-white border-b border-slate-100 h-44 sm:h-56 md:h-60 p-1.5 sm:p-2 flex items-center justify-center overflow-hidden">
                          {/* Stock Tag Badge */}
                          <div className="absolute top-2 left-2 z-10 flex flex-col gap-1 items-start pointer-events-none">
                            <span className="bg-emerald-600 text-white text-[9.5px] sm:text-xs font-bold px-1.5 sm:px-2 py-0.5 rounded shadow-2xs tracking-wide flex items-center gap-1">
                              <span className="w-1.5 h-1.5 rounded-full bg-white"></span>
                              In Stock
                            </span>
                            {product.badge && product.badge.trim().toLowerCase() !== 'oem standard' && (
                              <span className="bg-blue-50 text-[#0745A7] border border-blue-200 text-[8.5px] sm:text-[10px] font-bold px-1.5 py-0.2 rounded shadow-2xs truncate max-w-[85px] sm:max-w-none">
                                {product.badge}
                              </span>
                            )}
                          </div>

                          <ProductCardImageCarousel
                            images={product.images || (product.image ? [product.image] : [])}
                            title={product.title}
                            imageClassName="group-hover:scale-105"
                            onImageClick={() => handleOpenEnquiry(product)}
                          />
                        </div>

                        {/* Body Details */}
                        <div className="p-2 sm:p-3.5 flex flex-col gap-1 sm:gap-1.5">
                          {/* Category Tag */}
                          <span className="text-[9.5px] sm:text-[10.5px] font-semibold text-slate-400 uppercase tracking-wider truncate">
                            {product.category}
                          </span>

                          {/* Product Title + Part Code Continuing Inline Beside It */}
                          <h2
                            onClick={() => handleOpenEnquiry(product)}
                            className="text-xs sm:text-sm font-bold text-slate-900 group-hover:text-[#0745A7] transition-colors cursor-pointer leading-snug line-clamp-2"
                            title={`${product.title} (${displayCode})`}
                          >
                            {product.title}
                            {displayCode && (
                              <span className="text-[10px] sm:text-[11px] font-mono font-medium text-slate-500 ml-1">
                                ({displayCode})
                              </span>
                            )}
                          </h2>

                          {/* Compact Specifications Table */}
                          {product.specs && product.specs.length > 0 && (
                            <div className="mt-1 border border-slate-200/90 rounded-lg overflow-hidden bg-white shadow-2xs">
                              <table className="w-full text-[10px] sm:text-[11px] border-collapse">
                                <tbody>
                                  {product.specs.slice(0, 2).map((spec, sIdx) => (
                                    <tr
                                      key={spec.label || spec.parameter || sIdx}
                                      className={`border-b border-slate-100 last:border-b-0 ${
                                        sIdx % 2 === 0 ? 'bg-[#F9FAFB]' : 'bg-white'
                                      }`}
                                    >
                                      <td className="py-0.5 sm:py-1 px-1.5 sm:px-2 text-slate-500 font-medium whitespace-nowrap w-[45%] border-r border-slate-100 text-[9px] sm:text-[10.5px]">
                                        {spec.label || spec.parameter}
                                      </td>
                                      <td className="py-0.5 sm:py-1 px-1.5 sm:px-2 text-slate-900 font-semibold truncate max-w-[70px] sm:max-w-[140px] text-[9px] sm:text-[10.5px]">
                                        {spec.value}
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          )}

                          {/* Standard & Stock Info */}
                          <div className="flex items-center gap-1 mt-1 pt-1 border-t border-slate-100/70 text-[9.5px] sm:text-[10px] text-slate-500 font-medium truncate">
                            {product.compliance ? (
                              <span className="truncate">
                                {product.compliance}
                              </span>
                            ) : (
                              <span className="text-emerald-600 font-semibold flex items-center gap-1">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                                In Stock
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Bottom Pricing & Action Section (Flipkart / Amazon Style) */}
                      <div className="p-2 sm:p-3.5 pt-0 mt-auto">
                        <div className="pt-2 border-t border-slate-100 flex flex-col gap-1.5 sm:gap-2">
                          
                          {/* Price Block with MRP & Discount */}
                          <div>
                            {Number(product.price) > 0 ? (
                              <>
                                <div className="flex items-baseline gap-1 sm:gap-1.5 flex-wrap">
                                  <span className="text-sm sm:text-lg font-black text-[#0745A7] tracking-tight font-mono">
                                    ₹ {Number(product.price).toLocaleString('en-IN')}
                                  </span>
                                  <span className="line-through text-slate-400 text-[10px] sm:text-[11px] font-mono">
                                    ₹ {Number(Math.round(product.price * 1.15)).toLocaleString('en-IN')}
                                  </span>
                                  <span className="text-emerald-700 font-bold text-[9.5px] sm:text-[10.5px]">
                                    15% off
                                  </span>
                                </div>
                                <div className="flex items-center justify-between text-[9.5px] sm:text-[10.5px] text-slate-500 font-medium mt-0.5 truncate">
                                  <span>Unit: {displayUnit}</span>
                                </div>
                              </>
                              ) : null}
                          </div>

                          {/* Actions: Contact Supplier + Quick Phone */}
                          <div className="flex items-center justify-between gap-1 sm:gap-1.5 pt-1">
                            <button
                              type="button"
                              onClick={() => handleOpenEnquiry(product)}
                              className="flex-1 inline-flex items-center justify-center gap-1 bg-[#0745A7] hover:bg-[#053787] active:bg-[#042d6d] text-white py-1.5 px-2 sm:px-3.5 rounded-lg text-[10px] sm:text-xs font-semibold tracking-wide transition-all shadow-2xs hover:shadow-sm cursor-pointer whitespace-nowrap"
                            >
                              <ShoppingBag size={11} className="shrink-0" />
                              <span>Order Now</span>
                            </button>
                            <a
                              href="tel:+918048956234"
                              className="w-7 h-7 sm:w-8 sm:h-8 shrink-0 border border-slate-200 hover:border-[#0745A7] text-slate-700 hover:text-[#0745A7] hover:bg-[#0745A7]/5 rounded-lg flex items-center justify-center transition-all cursor-pointer shadow-2xs"
                              title="Call directly"
                            >
                              <Phone size={11} />
                            </a>
                          </div>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}

            {/* ── BOTTOM BULK ORDER BANNER ── */}
            <section className="mt-12 bg-white border border-slate-200/90 rounded-2xl p-5 sm:p-8 shadow-xs flex flex-col lg:flex-row items-center justify-between gap-5">
              <div className="space-y-1.5 text-center lg:text-left">
                <h3 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
                  Looking for Custom Elevator Components or Full Kits?
                </h3>
              </div>

              <div className="shrink-0 flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 sm:gap-3 w-full lg:w-auto">
                <button
                  type="button"
                  onClick={() => {
                    if (filteredProducts.length > 0) handleOpenEnquiry(filteredProducts[0])
                  }}
                  className="w-full sm:w-auto bg-[#0745A7] hover:bg-[#053787] text-white px-5 sm:px-6 py-2.5 rounded-xl text-xs sm:text-sm font-bold tracking-wider uppercase transition-all shadow-md cursor-pointer flex items-center justify-center gap-2"
                >
                  <span>Request Technical Quote</span>
                  <ArrowRight size={15} />
                </button>
                <a
                  href="tel:+918048956234"
                  className="w-full sm:w-auto border border-slate-300 hover:border-slate-400 bg-white text-slate-800 px-4 sm:px-5 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Phone size={14} />
                  <span>Talk to Engineer</span>
                </a>
              </div>
            </section>
          </main>
        </div>

          {/* ── UNIFIED STORE FOOTER (Inside Right Main Scrollable Column) ── */}
          <footer className="w-full bg-white text-slate-600 pt-8 pb-16 lg:pb-8 px-4 sm:px-6 lg:px-8 border-t border-slate-200/90 mt-auto">
            <div className="max-w-7xl mx-auto space-y-6">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-b border-slate-100 pb-6 text-xs">
                <div className="flex items-center gap-2">
                  <span className="font-extrabold text-slate-900 text-base tracking-tight">SB ELEVATORS</span>
                </div>
                <div className="flex items-center gap-4">
                  <a href="tel:+918048956234" className="text-[#0745A7] hover:text-[#053787] flex items-center gap-1.5 font-bold transition-colors">
                    <Phone size={13} className="text-[#0745A7]" />
                    <span>+91 80489 56234</span>
                  </a>
                </div>
              </div>
              
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-[11px] text-slate-500">
                <p>© {new Date().getFullYear()} SB Elevators Pvt Ltd. All rights reserved.</p>
              </div>
            </div>
          </footer>

        </div>
      </div>
    </div>
    )}

      {/* ── STICKY BOTTOM NAVIGATION BAR (Visible on Mobile & Tablets Only, Hidden on Laptop/Desktop/2XL) ── */}
      {currentPage !== 'admin' && (
        <nav aria-label="Bottom Navigation" className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200/90 shadow-xl py-1.5 px-3 flex items-center justify-around sm:justify-center sm:gap-16 md:gap-24">
          {/* Tab 1: Home */}
          <button
            type="button"
            onClick={handleGoHome}
            className={`flex flex-col items-center justify-center py-1 px-3 rounded-lg transition-colors cursor-pointer ${
              isHomePage && !isFlipkartCategoriesOpen ? 'text-[#0745A7] font-bold' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <Home size={18} />
            <span className="text-[10px] sm:text-xs mt-0.5">Home</span>
          </button>

          {/* Tab 2: Categories (Flipkart 2-Pane Explorer) */}
          <button
            type="button"
            onClick={() => setIsFlipkartCategoriesOpen(true)}
            className={`flex flex-col items-center justify-center py-1 px-3 rounded-lg transition-colors cursor-pointer ${
              (!isHomePage || isFlipkartCategoriesOpen) ? 'text-[#0745A7] font-bold' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <LayoutGrid size={18} />
            <span className="text-[10px] sm:text-xs mt-0.5">Categories</span>
          </button>

          {/* Tab 3: Filters with Active Count Badge */}
          <button
            type="button"
            onClick={() => {
              setIsMobileFilterOpen(true);
            }}
            className="relative flex flex-col items-center justify-center py-1 px-3 rounded-lg text-slate-500 hover:text-slate-800 transition-colors cursor-pointer"
          >
            <Filter size={18} />
            <span className="text-[10px] mt-0.5">Filters</span>
            {activeFiltersCount > 0 && (
              <span className="absolute top-0.5 right-2 bg-[#0745A7] text-white text-[9px] w-3.5 h-3.5 rounded-full flex items-center justify-center font-bold">
                {activeFiltersCount}
              </span>
            )}
          </button>

          {/* Tab 4: Helpline */}
          <a
            href="tel:+918048956234"
            className="flex flex-col items-center justify-center py-1 px-3 rounded-lg text-slate-500 hover:text-slate-800 transition-colors cursor-pointer"
          >
            <Phone size={18} />
            <span className="text-[10px] mt-0.5">Helpline</span>
          </a>
        </nav>
      )}

      {/* ── FLIPKART 2-PANE ALL CATEGORIES EXPLORER (Full-Screen Modal) ── */}
      <FlipkartCategoryView
        isOpen={isFlipkartCategoriesOpen}
        onClose={() => setIsFlipkartCategoriesOpen(false)}
        allCategories={allCategories}
        selectedCategory={selectedCategory}
        onSelectCategory={(cat) => {
          setSelectedCategory(cat);
          setIsFlipkartCategoriesOpen(false);
        }}
        parts={parts}
        onOpenShopNow={(part) => {
          handleOpenEnquiry(part);
        }}
      />

      {/* ── MODAL: CONTACT SUPPLIER / GET BEST PRICE (DROPS DOWN ATTACHED TO TOP OF SCREEN) ── */}
      {(enquiryItem || isClosing) && (
        <div
          className={`fixed inset-0 z-[120] flex items-start justify-center bg-black/60 backdrop-blur-sm p-0 sm:px-4 pt-0 transition-opacity duration-300 overflow-y-auto no-scrollbar [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden ${
            isClosing ? 'opacity-0 pointer-events-none' : 'opacity-100'
          }`}
          onClick={handleCloseEnquiry}
        >
          <div
            className={`w-full max-w-lg bg-white border border-slate-200 border-t-0 rounded-t-none rounded-b-2xl sm:rounded-b-3xl shadow-[0_25px_60px_-15px_rgba(0,0,0,0.35)] relative overflow-hidden max-h-[93vh] sm:max-h-[90vh] flex flex-col p-4 sm:p-7 no-scrollbar [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden ${
              isClosing ? 'animate-slide-up-top' : 'animate-slide-down-top'
            }`}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close Button */}
            <button
              onClick={handleCloseEnquiry}
              className="absolute top-4 right-4 sm:top-5 sm:right-5 w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center transition-colors cursor-pointer shrink-0 z-10"
              aria-label="Close modal"
            >
              <X size={18} />
            </button>

            {!enquirySubmitted && enquiryItem ? (
              <div className="overflow-y-auto no-scrollbar [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
                {/* Header */}
                <div className="mb-4 border-b border-slate-100 pb-3 pr-8">
                  <h3 className="text-xl font-bold text-slate-900 tracking-tight">
                    Order Request
                  </h3>
                </div>

                {/* Selected Product Card Summary */}
                <div className="flex items-center gap-3.5 bg-slate-50 border border-slate-200 rounded-2xl p-3 mb-4">
                  <div className="w-16 h-16 bg-white rounded-xl border border-slate-200/80 p-1 flex items-center justify-center shrink-0">
                    <img
                      src={enquiryItem.image}
                      alt={enquiryItem.title}
                      className="max-h-full max-w-full object-contain"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <span className="text-[10px] font-mono text-slate-500 font-bold uppercase block">
                      {enquiryItem.itemCode || enquiryItem.code}
                    </span>
                    <h4 className="text-xs sm:text-sm font-bold text-slate-900 truncate">
                      {enquiryItem.title}
                    </h4>
                    {enquiryItem.category && (
                      <span className="text-[11px] text-slate-500 font-medium block mt-0.5 truncate">
                        {enquiryItem.category}
                      </span>
                    )}
                  </div>
                </div>

                {/* Form */}
                <form
                  onSubmit={handleSubmitEnquiry}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && e.target.tagName !== 'TEXTAREA') {
                      e.preventDefault();
                    }
                  }}
                  className="space-y-3"
                >
                  {/* Quantity (Typeable with +/- buttons and max 500 limit) */}
                  <div className="flex items-center justify-between bg-slate-50 px-3.5 py-2 rounded-xl border border-slate-200">
                    <label className="text-xs font-semibold text-slate-700">
                      Requirement Quantity:
                    </label>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setEnquiryQuantity((q) => Math.max(1, (parseInt(q, 10) || 1) - 1))}
                        disabled={Number(enquiryQuantity) <= 1}
                        className="w-8 h-8 rounded-lg bg-white border border-slate-300 font-bold text-sm text-slate-700 flex items-center justify-center hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-colors"
                        title="Decrease quantity"
                      >
                        -
                      </button>
                      <input
                        type="text"
                        inputMode="numeric"
                        pattern="[0-9]*"
                        value={enquiryQuantity}
                        onChange={handleQuantityChange}
                        onBlur={handleQuantityBlur}
                        className="w-14 h-8 text-center font-bold text-sm text-slate-900 bg-white border border-slate-300 rounded-lg focus:outline-none focus:border-[#0745A7] focus:ring-2 focus:ring-[#0745A7]/20"
                        title="Enter quantity (up to 500)"
                      />
                      <button
                        type="button"
                        onClick={() => setEnquiryQuantity((q) => Math.min(500, (parseInt(q, 10) || 1) + 1))}
                        disabled={Number(enquiryQuantity) >= 500}
                        className="w-8 h-8 rounded-lg bg-white border border-slate-300 font-bold text-sm text-slate-700 flex items-center justify-center hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-colors"
                        title="Increase quantity"
                      >
                        +
                      </button>
                      <span className="text-xs text-slate-500 font-medium whitespace-nowrap">
                        {enquiryItem.priceUnit || enquiryItem.unit || 'Piece'}s
                      </span>
                    </div>
                  </div>

                  {/* Row 1: Your Full Name * & Mobile Number * */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                        Your Full Name *
                      </label>
                      <input
                        type="text"
                        name="name"
                        value={enquiryForm.name}
                        onChange={handleEnquiryChange}
                        onBlur={handleEnquiryBlur}
                        placeholder="e.g. Rajesh Sharma"
                        className={`w-full px-3.5 py-2 rounded-xl border text-sm sm:text-xs text-slate-900 focus:outline-none transition-colors ${
                          formErrors.name
                            ? 'border-rose-400 bg-rose-50/20 focus:border-rose-500 focus:ring-2 focus:ring-rose-500/20'
                            : 'border-slate-300 focus:border-[#0745A7] focus:ring-2 focus:ring-[#0745A7]/20'
                        }`}
                      />
                      {formErrors.name && (
                        <p className="text-[11px] text-rose-600 mt-1 font-medium">{formErrors.name}</p>
                      )}
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                        Mobile Number *
                      </label>
                      <input
                        type="tel"
                        name="phone"
                        value={enquiryForm.phone}
                        onChange={handleEnquiryChange}
                        onBlur={handleEnquiryBlur}
                        placeholder="9876543210"
                        maxLength={10}
                        className={`w-full px-3.5 py-2 rounded-xl border text-sm sm:text-xs text-slate-900 focus:outline-none transition-colors ${
                          formErrors.phone
                            ? 'border-rose-400 bg-rose-50/20 focus:border-rose-500 focus:ring-2 focus:ring-rose-500/20'
                            : 'border-slate-300 focus:border-[#0745A7] focus:ring-2 focus:ring-[#0745A7]/20'
                        }`}
                      />
                      {formErrors.phone && (
                        <p className="text-[11px] text-rose-600 mt-1 font-medium">{formErrors.phone}</p>
                      )}
                    </div>
                  </div>

                  {/* Row 2: WhatsApp Number * (with Same as Mobile) & GST Number (Optional) */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="text-[11px] font-semibold text-slate-700">
                          WhatsApp Number *
                        </label>
                        <label className="inline-flex items-center gap-1.5 cursor-pointer select-none text-[11px] text-slate-600 font-normal">
                          <input
                            type="checkbox"
                            checked={sameAsMobile}
                            onChange={handleToggleSameAsMobile}
                            className="w-3.5 h-3.5 accent-[#0745A7] rounded cursor-pointer"
                          />
                          <span>Same as Mobile</span>
                        </label>
                      </div>
                      <input
                        type="tel"
                        name="whatsapp"
                        value={enquiryForm.whatsapp}
                        onChange={handleEnquiryChange}
                        onBlur={handleEnquiryBlur}
                        placeholder="9876543210"
                        maxLength={10}
                        className={`w-full px-3.5 py-2 rounded-xl border text-sm sm:text-xs text-slate-900 focus:outline-none transition-colors ${
                          formErrors.whatsapp
                            ? 'border-rose-400 bg-rose-50/20 focus:border-rose-500 focus:ring-2 focus:ring-rose-500/20'
                            : 'border-slate-300 focus:border-[#0745A7] focus:ring-2 focus:ring-[#0745A7]/20'
                        }`}
                      />
                      {formErrors.whatsapp && (
                        <p className="text-[11px] text-rose-600 mt-1 font-medium">{formErrors.whatsapp}</p>
                      )}
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                        GST Number (Optional)
                      </label>
                      <input
                        type="text"
                        name="gst"
                        value={enquiryForm.gst}
                        onChange={handleEnquiryChange}
                        onBlur={handleEnquiryBlur}
                        placeholder="E.G. 29AAAAA0000A1Z5"
                        maxLength={15}
                        className={`w-full px-3.5 py-2 rounded-xl border text-sm sm:text-xs text-slate-900 focus:outline-none transition-colors uppercase font-mono ${
                          formErrors.gst
                            ? 'border-rose-400 bg-rose-50/20 focus:border-rose-500 focus:ring-2 focus:ring-rose-500/20'
                            : 'border-slate-300 focus:border-[#0745A7] focus:ring-2 focus:ring-[#0745A7]/20'
                        }`}
                      />
                      {formErrors.gst && (
                        <p className="text-[11px] text-rose-600 mt-1 font-medium">{formErrors.gst}</p>
                      )}
                    </div>
                  </div>

                  {/* Row 3: Email Address (Optional) & Delivery City / State */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                        Email Address (Optional)
                      </label>
                      <input
                        type="email"
                        name="email"
                        value={enquiryForm.email}
                        onChange={handleEnquiryChange}
                        onBlur={handleEnquiryBlur}
                        placeholder="name@company.com"
                        className={`w-full px-3.5 py-2 rounded-xl border text-sm sm:text-xs text-slate-900 focus:outline-none transition-colors ${
                          formErrors.email
                            ? 'border-rose-400 bg-rose-50/20 focus:border-rose-500 focus:ring-2 focus:ring-rose-500/20'
                            : 'border-slate-300 focus:border-[#0745A7] focus:ring-2 focus:ring-[#0745A7]/20'
                        }`}
                      />
                      {formErrors.email && (
                        <p className="text-[11px] text-rose-600 mt-1 font-medium">{formErrors.email}</p>
                      )}
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                        Delivery City / State
                      </label>
                      <input
                        type="text"
                        name="city"
                        value={enquiryForm.city}
                        onChange={handleEnquiryChange}
                        placeholder="Bengaluru, Karnataka"
                        className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-sm sm:text-xs text-slate-900 focus:outline-none focus:border-[#0745A7] focus:ring-2 focus:ring-[#0745A7]/20"
                      />
                    </div>
                  </div>

                  {/* Row 4: Requirement Details / Dimensions */}
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                      Requirement Details / Dimensions
                    </label>
                    <textarea
                      rows={2}
                      name="message"
                      value={enquiryForm.message}
                      onChange={handleEnquiryChange}
                      placeholder="Specify building type, shaft dimensions, or special delivery date..."
                      className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-sm sm:text-xs text-slate-900 focus:outline-none focus:border-[#0745A7] focus:ring-2 focus:ring-[#0745A7]/20"
                    />
                  </div>

                  {enquiryError && (
                    <p className="text-xs text-rose-600 font-semibold">{enquiryError}</p>
                  )}

                  {/* Submit Button */}
                  <button
                    type="submit"
                    disabled={isSubmittingEnquiry}
                    className="w-full bg-[#0745A7] hover:bg-[#053787] text-white py-3 rounded-xl font-bold text-xs sm:text-sm tracking-wide uppercase shadow-md transition-colors cursor-pointer mt-1 flex items-center justify-center gap-2"
                  >
                    {isSubmittingEnquiry ? (
                      <span>Submitting order request to sales@sbdat.com...</span>
                    ) : (
                      <span>SUBMIT ORDER REQUEST</span>
                    )}
                  </button>
                </form>
              </div>
            ) : (
              <div className="text-center py-6 space-y-3">
                <div className="w-14 h-14 rounded-full bg-blue-50 text-[#0745A7] flex items-center justify-center mx-auto">
                  <CheckCircle2 size={32} />
                </div>
                <h3 className="text-xl font-bold text-slate-900">
                  Order Request Submitted!
                </h3>
                <p className="text-xs sm:text-sm text-slate-600 max-w-sm mx-auto leading-relaxed">
                  Thank you, <strong>{enquiryForm.name}</strong>. Your order request for <strong>{enquiryItem?.title}</strong> ({enquiryQuantity} {enquiryItem?.priceUnit || enquiryItem?.unit || 'Piece'}s) has been submitted to <strong>sales@sbdat.com</strong>.
                </p>

                <div className="bg-slate-50 border border-slate-200/90 rounded-xl p-3 text-left text-xs text-slate-700 space-y-1.5 max-w-sm mx-auto">
                  <div className="flex justify-between">
                    <span className="text-slate-400 font-medium">Sent To:</span>
                    <strong className="text-[#0745A7] font-mono">sales@sbdat.com</strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400 font-medium">Part Code:</span>
                    <strong className="font-mono text-slate-800">{enquiryItem?.itemCode || enquiryItem?.code}</strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400 font-medium">Quantity:</span>
                    <strong className="text-slate-800">{enquiryQuantity} {enquiryItem?.priceUnit || enquiryItem?.unit || 'Piece'}s</strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400 font-medium">Mobile:</span>
                    <strong className="text-slate-800">{enquiryForm.phone}</strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400 font-medium">WhatsApp:</span>
                    <strong className="text-slate-800">{enquiryForm.whatsapp}</strong>
                  </div>
                  {enquiryForm.email && (
                    <div className="flex justify-between">
                      <span className="text-slate-400 font-medium">Email:</span>
                      <strong className="text-slate-800">{enquiryForm.email}</strong>
                    </div>
                  )}
                  {enquiryForm.gst && (
                    <div className="flex justify-between">
                      <span className="text-slate-400 font-medium">GSTIN:</span>
                      <strong className="font-mono text-slate-800">{enquiryForm.gst.toUpperCase()}</strong>
                    </div>
                  )}
                </div>

                <div className="pt-3 flex items-center justify-center gap-2 flex-wrap">
                  <a
                    href={`https://wa.me/918048956234?text=${encodeURIComponent(`Hello SB Elevators, I would like to submit an order request:\n\n• Part: ${enquiryItem?.title} (${enquiryItem?.itemCode || enquiryItem?.code})\n• Quantity: ${enquiryQuantity} ${enquiryItem?.priceUnit || enquiryItem?.unit || 'Piece'}s\n• Name: ${enquiryForm.name}\n• Mobile: ${enquiryForm.phone}\n• WhatsApp: ${enquiryForm.whatsapp}\n${enquiryForm.gst ? `• GSTIN: ${enquiryForm.gst}\n` : ''}${enquiryForm.email ? `• Email: ${enquiryForm.email}\n` : ''}${enquiryForm.city ? `• City: ${enquiryForm.city}\n` : ''}${enquiryForm.message ? `• Requirement: ${enquiryForm.message}\n` : ''}\nPlease provide order confirmation & delivery schedule.`)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-xs transition-colors"
                  >
                    <MessageCircle size={14} />
                    <span>Send on WhatsApp</span>
                  </a>
                  <a
                    href={`mailto:sales@sbdat.com?subject=${encodeURIComponent(`Order Request: [${enquiryItem?.itemCode || enquiryItem?.code}] ${enquiryItem?.title} - ${enquiryForm.name}`)}&body=${encodeURIComponent(`Dear Sales Team,\n\nI have submitted an order request for ${enquiryItem?.title} (${enquiryItem?.itemCode || enquiryItem?.code}).\nQuantity: ${enquiryQuantity}\nName: ${enquiryForm.name}\nMobile: ${enquiryForm.phone}\nWhatsApp: ${enquiryForm.whatsapp}\n${enquiryForm.gst ? `GSTIN: ${enquiryForm.gst}\n` : ''}City: ${enquiryForm.city}\nRequirement: ${enquiryForm.message}\n\nPlease reply with the order confirmation & delivery schedule.\nThank you.`)}`}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-50 text-xs font-semibold"
                  >
                    <Send size={13} />
                    <span>Open in Email</span>
                  </a>
                  <button
                    onClick={handleCloseEnquiry}
                    className="bg-[#0745A7] hover:bg-[#053787] text-white px-5 py-2 rounded-xl text-xs font-bold uppercase tracking-wider cursor-pointer shadow-xs"
                  >
                    Done & Continue Browsing
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
