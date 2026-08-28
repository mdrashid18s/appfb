/**
 * @file StudentStore.jsx
 * @description Modern E-Commerce Store & Purchases System for Student Portal.
 * Supports Mock Interviews, Test Series, Video Courses, eBooks, Shopping Cart,
 * Promo Code discounts, UPI/QR Payment simulation, and Purchases Access dashboard.
 */

import React, { useState, useEffect, useRef } from 'react';
import { 
  ShoppingBag, 
  Search, 
  Star, 
  CheckCircle, 
  CheckCircle2,
  X, 
  Sparkles, 
  ArrowRight,
  BookOpen,
  Award,
  Video,
  FileText,
  ChevronRight,
  Download,
  Printer,
  Check,
  AlertTriangle,
  AlertOctagon,
  RotateCcw,
  ArrowLeft,
  Mail,
  ShieldCheck,
  RefreshCw,
  CreditCard,
  Lock,
  Smartphone,
  Building,
  Wallet,
  Info,
  ArrowUpDown,
  ChevronDown,
  TrendingUp,
  TrendingDown,
  Clock,
  SlidersHorizontal,
  Trash2,
  Tag
} from 'lucide-react';
import styles from './StudentStore.module.css';

/** Helper: Format today's date as YYYYMMDD */
const dateStr = () => {
  const d = new Date();
  return `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}${String(d.getDate()).padStart(2, '0')}`;
};

/** Helper: Format date nicely */
const formatDate = (dateStr) => {
  if (!dateStr) return new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' });
  try {
    return new Date(dateStr).toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' });
  } catch (e) {
    return dateStr;
  }
};

/** Helper: Dynamically Load Razorpay Checkout Script */
const loadRazorpayScript = () => {
  return new Promise((resolve) => {
    if (window.Razorpay) {
      resolve(true);
      return;
    }
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
};

/** Opens a new window with full GST Tax Invoice HTML and triggers print/save as PDF */
const printInvoice = (receipt, student) => {
  if (!receipt) return;

  const items = receipt.items && receipt.items.length > 0
    ? receipt.items
    : [{ title: 'Educational Course Package', category: 'XL Store Product', price: receipt.final_amount || 0, expires_at: null }];

  const subtotal = items.reduce((sum, i) => sum + parseFloat(i.price || 0), 0);
  const totalPaid = parseFloat(receipt.final_amount || subtotal || 0);

  const itemRows = items.map((item, idx) => `
    <tr>
      <td>${idx + 1}</td>
      <td>
        <strong>${item.title || 'Product'}</strong><br/>
        <span style="font-size:11px;color:#64748b;">Category: ${(item.category || 'Course').replace('_', ' ')}</span>
      </td>
      <td>${item.expires_at ? '365 Days' : 'Full Access'}</td>
      <td style="text-align:right;">₹${parseFloat(item.price || 0).toFixed(2)}</td>
    </tr>
  `).join('');

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>Tax Invoice - ${receipt.order_number || 'XL-INVOICE'}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Arial', sans-serif; font-size: 13px; color: #1e293b; background: white; padding: 32px; max-width: 780px; margin: 0 auto; }
    .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 24px; }
    .brand h1 { font-size: 22px; font-weight: 900; color: #4f46e5; letter-spacing: -0.5px; }
    .brand p { font-size: 11px; color: #64748b; margin-top: 2px; }
    .brand .gstin { font-size: 11px; color: #334155; margin-top: 4px; }
    .paid-stamp { background: #dcfce7; color: #15803d; border: 2px solid #16a34a; padding: 6px 14px; border-radius: 6px; font-weight: 800; font-size: 13px; text-align: center; }
    .invoice-no { font-size: 11px; color: #334155; margin-top: 8px; text-align: right; line-height: 1.6; }
    .invoice-no code { background: #f1f5f9; padding: 1px 5px; border-radius: 3px; font-size: 10px; }
    hr { border: none; border-top: 1px solid #e2e8f0; margin: 20px 0; }
    .bill-grid { display: flex; justify-content: space-between; margin-bottom: 20px; }
    .bill-to-label, .pay-label { font-size: 9px; text-transform: uppercase; color: #64748b; font-weight: 700; letter-spacing: 0.8px; margin-bottom: 4px; }
    .bill-to h3 { font-size: 14px; font-weight: 800; color: #0f172a; }
    .bill-to p { font-size: 11px; color: #475569; line-height: 1.6; margin-top: 2px; }
    .pay-method { text-align: right; }
    .pay-method .method-name { font-size: 13px; font-weight: 800; color: #16a34a; }
    .pay-method .status { font-size: 11px; color: #475569; margin-top: 2px; }
    table { width: 100%; border-collapse: collapse; margin-bottom: 16px; }
    thead tr { background: #4f46e5; color: white; }
    thead th { padding: 10px 12px; text-align: left; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; }
    tbody tr { border-bottom: 1px solid #f1f5f9; }
    tbody tr:nth-child(even) { background: #f8fafc; }
    tbody td { padding: 10px 12px; font-size: 12px; vertical-align: top; }
    .summary { margin-left: auto; width: 280px; }
    .summary-row { display: flex; justify-content: space-between; padding: 5px 0; font-size: 12px; }
    .summary-total { font-weight: 800; font-size: 14px; color: #16a34a; border-top: 2px solid #e2e8f0; margin-top: 6px; padding-top: 8px; }
    .footer { margin-top: 32px; display: flex; justify-content: space-between; align-items: flex-end; border-top: 1px solid #e2e8f0; padding-top: 16px; }
    .footer-note { font-size: 10px; color: #94a3b8; max-width: 360px; line-height: 1.5; }
    .signatory { text-align: right; }
    .signatory .name { font-weight: 800; font-size: 13px; color: #0f172a; }
    .signatory .title { font-size: 10px; color: #64748b; }
    .watermark { text-align: center; margin: 20px 0 10px; }
    .watermark span { display: inline-block; border: 2px solid #16a34a; color: #16a34a; font-weight: 800; font-size: 16px; padding: 4px 18px; border-radius: 4px; transform: rotate(-2deg); letter-spacing: 2px; }
    @media print {
      body { padding: 20px; }
      @page { margin: 15mm; size: A4; }
    }
  </style>
</head>
<body>

  <div class="header">
    <div class="brand">
      <h1>XL EDUCATION PORTAL</h1>
      <p>Authorized Academic Learning & Testing Solutions</p>
      <p class="gstin">GSTIN: <strong>07AAAAA0000A1Z5</strong> &nbsp;|&nbsp; SAC Code: 999293 (Educational E-Services)</p>
    </div>
    <div>
      <div class="paid-stamp">✅ PAID ONLINE</div>
      <div class="invoice-no">
        <strong>INVOICE #:</strong> ${receipt.order_number || 'XL-INV-' + dateStr()}<br/>
        <strong>DATE:</strong> ${formatDate(receipt.purchased_at)}<br/>
        <strong>TXN REF:</strong> <code>${receipt.transaction_id || 'N/A'}</code>
      </div>
    </div>
  </div>

  <hr/>

  <div class="bill-grid">
    <div class="bill-to">
      <div class="bill-to-label">BILLED TO (STUDENT):</div>
      <h3>${student?.name || 'Student'}</h3>
      <p>
        Roll / ID: <strong>${student?.['roll no'] || student?.roll_no || student?.login_id || 'N/A'}</strong><br/>
        Department: ${student?.department || 'Academic Studies'}<br/>
        Email: ${student?.['email adress'] || student?.email || 'N/A'}
      </p>
    </div>
    <div class="pay-method">
      <div class="pay-label">PAYMENT METHOD:</div>
      <div class="method-name">${receipt.payment_method || 'RAZORPAY GATEWAY'}</div>
      <div class="status">Status: <strong style="color:#16a34a;">VERIFIED &amp; COMPLETED</strong></div>
    </div>
  </div>

  <table>
    <thead>
      <tr>
        <th style="width:40px;">#</th>
        <th>Item Description</th>
        <th>Access Period</th>
        <th style="text-align:right;">Amount</th>
      </tr>
    </thead>
    <tbody>
      ${itemRows}
    </tbody>
  </table>

  <div style="display:flex; justify-content:flex-end;">
    <div class="summary">
      <div class="summary-row"><span style="color:#64748b;">Subtotal:</span><span>₹${subtotal.toFixed(2)}</span></div>
      <div class="summary-row summary-total"><span>Total Amount Paid:</span><span>₹${totalPaid.toFixed(2)}</span></div>
    </div>
  </div>

  <div class="watermark"><span>PAYMENT SUCCESSFUL</span></div>

  <div class="footer">
    <div class="footer-note">
      This is an official computer-generated Tax Invoice receipt verified via Razorpay Payment Gateway API.<br/>
      No physical signature required. For queries: mrrashidsaikh0365@gmail.com
    </div>
    <div class="signatory">
      <div class="name">XL EDUCATION</div>
      <div class="title">Authorized Finance Signatory</div>
    </div>
  </div>

  <script>
    window.onload = function() {
      setTimeout(function() { window.print(); }, 400);
    };
  </script>
</body>
</html>`;

  const win = window.open('', '_blank', 'width=900,height=700,scrollbars=yes');
  if (win) {
    win.document.write(html);
    win.document.close();
  } else {
    console.warn('Pop-up blocked! Please allow pop-ups for this site to download the invoice.');
  }
};

export default function StudentStore({ student }) {
  /** Catalog products list fetched from API */
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  /** Active Filter Category: 'All', 'Mock Interview', 'Test Series', 'Course', 'eBook' */
  const [activeCategory, setActiveCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('rating_desc');
  const [isSortOpen, setIsSortOpen] = useState(false);
  const sortRef = useRef(null);

  /** Custom Sort Options Config with rich icons & descriptions */
  const sortOptions = [
    {
      id: 'rating_desc',
      label: 'Top Rated & Popular',
      subtitle: 'Highest student ratings first',
      icon: Star,
      badge: 'Popular',
      color: '#f59e0b',
    },
    {
      id: 'price_asc',
      label: 'Price: Low to High',
      subtitle: 'Most affordable courses & books first',
      icon: TrendingDown,
      badge: 'Budget Friendly',
      color: '#10b981',
    },
    {
      id: 'price_desc',
      label: 'Price: High to Low',
      subtitle: 'Comprehensive packs & bundles first',
      icon: TrendingUp,
      badge: 'Premium',
      color: '#6366f1',
    },
    {
      id: 'newest',
      label: 'Newest Arrivals',
      subtitle: 'Recently added mock series & notes',
      icon: Clock,
      badge: 'New',
      color: '#0ea5e9',
    },
  ];

  /** Close custom sort dropdown when clicking outside */
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (sortRef.current && !sortRef.current.contains(event.target)) {
        setIsSortOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  /** Tab View State: 'store' | 'purchases' */
  const [viewMode, setViewMode] = useState('store');
  const [purchases, setPurchases] = useState([]);
  const [loadingPurchases, setLoadingPurchases] = useState(false);

  /** Dedicated Flipkart/Amazon Style Payment Result Screen State ('success' | 'failed' | 'cancelled' | null) */
  const [paymentScreen, setPaymentScreen] = useState(null);
  const [paymentScreenData, setPaymentScreenData] = useState(null);
  const [successCountdown, setSuccessCountdown] = useState(5);

  /** 5-Second Auto-redirect to My Purchases on Payment Success */
  useEffect(() => {
    if (paymentScreen === 'success') {
      setSuccessCountdown(5);
      const timer = setInterval(() => {
        setSuccessCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            setPaymentScreen(null);
            setViewMode('purchases');
            fetchMyPurchases();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => clearInterval(timer);
    }
  }, [paymentScreen]);

  /** Shopping Cart State with instant LocalStorage Persistence */
  const [cart, setCart] = useState(() => {
    try {
      const savedCart = localStorage.getItem('appfb_student_cart');
      return savedCart ? JSON.parse(savedCart) : [];
    } catch (e) {
      console.error('Failed to parse cart from localStorage', e);
      return [];
    }
  });
  const [isCartOpen, setIsCartOpen] = useState(false);

  /** Coupon State */
  const [couponInput, setCouponInput] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState(null); // { code, discount_amount, final_amount, message }
  const [couponError, setCouponError] = useState('');
  const [couponLoading, setCouponLoading] = useState(false);

  /** Modals State */
  const [selectedProduct, setSelectedProduct] = useState(null); // Product detail modal
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [paymentTab, setPaymentTab] = useState('card'); // 'card' | 'upi' | 'netbanking'
  const [cardData, setCardData] = useState({
    number: '4532 8921 7842 1092',
    name: 'ROHIT SHARMA',
    expiry: '12/28',
    cvv: '888'
  });
  const [upiId, setUpiId] = useState('student@okaxis');
  const [selectedBank, setSelectedBank] = useState('HDFC Bank');
  const [paymentMethod, setPaymentMethod] = useState('card');
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [orderReceipt, setOrderReceipt] = useState(null); // Order success details

  /** Store Wallet & Exchange State */
  const [walletBalance, setWalletBalance] = useState(0.00);
  const [useWalletInCart, setUseWalletInCart] = useState(false);
  const [exchangeSource, setExchangeSource] = useState(null); // The item being exchanged
  const [selectedExchangeProduct, setSelectedExchangeProduct] = useState(null);
  const [exchangeSuccessData, setExchangeSuccessData] = useState(null); // Exchange success receipt modal

  /** Toast Notification State */
  const [toastMessage, setToastMessage] = useState('');

  /** Custom In-App Web Alert Modal State (Replaces native browser alert) */
  const [customAlert, setCustomAlert] = useState(null); 
  // Structure: { title: string, message: string, type: 'warning' | 'error' | 'success' | 'info' }

  const showAlert = (message, title = 'Notification', type = 'warning') => {
    setCustomAlert({ title, message, type });
  };

  /** Save cart to localStorage whenever cart state changes */
  useEffect(() => {
    try {
      localStorage.setItem('appfb_student_cart', JSON.stringify(cart));
      window.dispatchEvent(new Event('cartUpdated'));
    } catch (e) {
      console.error('Failed to save cart', e);
    }
  }, [cart]);

  /** Listen for openStoreCart event dispatched from top navbar */
  useEffect(() => {
    const handleOpenCart = () => setIsCartOpen(true);
    window.addEventListener('openStoreCart', handleOpenCart);
    return () => window.removeEventListener('openStoreCart', handleOpenCart);
  }, []);

  /** Auto-clear toast after 3 seconds */
  useEffect(() => {
    if (toastMessage) {
      const timer = setTimeout(() => setToastMessage(''), 3000);
      return () => clearTimeout(timer);
    }
  }, [toastMessage]);

  /** Fetch Products, Purchases & Wallet when category, search or sort changes */
  useEffect(() => {
    fetchProducts();
    fetchWalletBalance();
    fetchMyPurchases();
  }, [activeCategory, searchQuery, sortBy]);

  /** Fetch Purchases when viewMode changes to 'purchases' */
  useEffect(() => {
    fetchMyPurchases();
    fetchWalletBalance();
  }, [viewMode]);

  const fetchWalletBalance = async () => {
    try {
      const token = localStorage.getItem('token');
      const rollNo = student?.['roll no'] || student?.roll_no || student?.login_id || '';
      const headers = { 'Accept': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;
      if (student?.id) headers['Student-Id'] = student.id;

      const res = await fetch(`/api/student/wallet?roll_no=${encodeURIComponent(rollNo)}`, { headers });
      const data = await res.json();
      if (data.success) {
        setWalletBalance(parseFloat(data.balance) || 0);
      }
    } catch (e) {
      console.error('Failed to fetch wallet balance', e);
    }
  };

  const fetchProducts = async (overrideSort) => {
    setLoading(true);
    try {
      const activeSort = overrideSort !== undefined ? overrideSort : sortBy;
      const token = localStorage.getItem('token');
      const rollNo = student?.['roll no'] || student?.roll_no || student?.login_id || '';
      let url = `/api/products?category=${encodeURIComponent(activeCategory)}&search=${encodeURIComponent(searchQuery)}&sort=${encodeURIComponent(activeSort)}&roll_no=${encodeURIComponent(rollNo)}`;
      console.log('🛒 [Store API Call] Fetching products with sort:', activeSort, '➔ URL:', url);
      
      const headers = { 'Accept': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;
      if (student?.id) headers['Student-Id'] = student.id;
      if (rollNo) headers['Student-Roll-No'] = rollNo;

      const res = await fetch(url, { headers });
      const data = await res.json();
      console.log('✅ [Store API Response] Received products count:', data.products?.length, 'Sorted as:', activeSort);

      if (data.success) {
        setProducts(data.products || []);
      }
    } catch (err) {
      console.error('Failed to fetch store products', err);
    }
    setLoading(false);
  };

  const fetchMyPurchases = async () => {
    setLoadingPurchases(true);
    try {
      const token = localStorage.getItem('token');
      const rollNo = student?.['roll no'] || student?.roll_no || student?.login_id;
      let url = `/api/student/purchases?roll_no=${encodeURIComponent(rollNo || '')}`;

      const headers = { 'Accept': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;
      if (student?.id) headers['Student-Id'] = student.id;

      const res = await fetch(url, { headers });
      const data = await res.json();

      if (data.success) {
        setPurchases(data.purchases || []);
        if (data.wallet_balance !== undefined) {
          setWalletBalance(parseFloat(data.wallet_balance) || 0);
        }
      }
    } catch (err) {
      console.error('Failed to fetch purchases', err);
    }
    setLoadingPurchases(false);
  };

  /** Initiate Product Exchange: Switch to Store view with Active Exchange Banner */
  const startProductExchange = (purchasedItem) => {
    setExchangeSource(purchasedItem);
    setSelectedExchangeProduct(null);
    setViewMode('store');
    window.scrollTo({ top: 0, behavior: 'smooth' });
    setToastMessage(`🔄 Exchange Mode: Select any course below to swap with "${purchasedItem.title}"`);
  };

  /** Direct In-Store Product Selection for Exchange */
  const handleSelectProductForExchange = async (targetProduct) => {
    if (!exchangeSource) return;

    // Check if student already owns this product
    const isAlreadyOwned = purchases.some(p => p.product_id === targetProduct.id || p.id === targetProduct.id);
    const isCurrentItem = exchangeSource.product_id === targetProduct.id || exchangeSource.id === targetProduct.id;

    if (isAlreadyOwned || isCurrentItem) {
      showAlert(
        "You have already purchased this course. Please choose a different course from the catalog to exchange.",
        "Course Already Owned",
        "warning"
      );
      return;
    }

    const oldPrice = parseFloat(exchangeSource.amount_paid || exchangeSource.price || 0);
    const newPrice = parseFloat(targetProduct.price || 0);
    const priceDiff = parseFloat((newPrice - oldPrice).toFixed(2));

    setSelectedExchangeProduct({ ...targetProduct, price_diff: priceDiff });

    // If replacement product is CHEAPER or EQUAL PRICE: Instant auto swap & wallet credit on backend!
    if (priceDiff <= 0) {
      await executeExchangeApi(targetProduct.id, 'AUTO_DIRECT_SWAP', targetProduct.title, priceDiff);
    } else {
      // If replacement product is MORE EXPENSIVE: Open Payment Modal to pay remaining difference
      setIsPaymentModalOpen(true);
    }
  };

  /** API call to execute the product exchange on backend */
  const executeExchangeApi = async (newProductId, customMethod = null, newProductTitle = '', priceDiff = 0) => {
    if (!exchangeSource) return;

    setIsProcessingPayment(true);
    try {
      const token = localStorage.getItem('token');
      const studentProductId = exchangeSource.student_product_id || exchangeSource.id;

      const res = await fetch('/api/products/exchange', {
        method: 'POST',
        headers: {
          'Content-Type':  'application/json',
          'Accept':        'application/json',
          'Authorization': token ? `Bearer ${token}` : '',
        },
        body: JSON.stringify({
          student_product_id: studentProductId,
          new_product_id:     newProductId,
          use_wallet:         true,
          payment_method:     customMethod || (paymentTab === 'card' ? `CARD (•••• ${cardData.number.slice(-4) || '1092'})` : (paymentTab === 'upi' ? `UPI (${upiId || 'Direct'})` : `NETBANKING (${selectedBank})`)),
        })
      });

      const data = await res.json();
      setIsProcessingPayment(false);

      if (data.success) {
        setIsPaymentModalOpen(false);
        setExchangeSuccessData({
          old_product: data.old_product || exchangeSource.title,
          old_price: parseFloat(data.old_price || exchangeSource.amount_paid || exchangeSource.price || 0),
          new_product: data.new_product || newProductTitle,
          new_price: parseFloat(data.new_price || selectedExchangeProduct?.price || 0),
          wallet_credited: parseFloat(data.wallet_credited || 0),
          amount_paid: parseFloat(data.amount_paid || 0),
          payment_method: data.payment_method || customMethod || 'EXCHANGE_SWAP',
          new_wallet_balance: parseFloat(data.wallet_balance || 0),
        });
        setExchangeSource(null);
        setSelectedExchangeProduct(null);
        setWalletBalance(parseFloat(data.wallet_balance || 0));
        fetchMyPurchases();
        fetchProducts();
        fetchWalletBalance();
      } else {
        showAlert(data.message || 'Exchange request failed. Please try again.', 'Exchange Error', 'error');
      }
    } catch (e) {
      console.error(e);
      setIsProcessingPayment(false);
      showAlert('A network error occurred while processing your product exchange. Please try again.', 'Network Error', 'error');
    }
  };

  /** Execute Exchange from Payment Details Modal */
  const handleExecuteExchange = async (customMethod = null) => {
    if (!exchangeSource || !selectedExchangeProduct) {
      showAlert('Please select a replacement product from the catalog.', 'Selection Required', 'warning');
      return;
    }
    await executeExchangeApi(
      selectedExchangeProduct.id, 
      customMethod, 
      selectedExchangeProduct.title, 
      selectedExchangeProduct.price_diff
    );
  };

  /** Cart Actions */
  const addToCart = (product, openDrawer = false) => {
    if (cart.some(item => item.id === product.id)) {
      if (openDrawer) {
        setIsCartOpen(true);
      } else {
        setToastMessage(`"${product.title}" is already in your cart!`);
      }
      return;
    }
    setCart([...cart, product]);
    setToastMessage(`✅ Added "${product.title}" to cart!`);
    if (openDrawer) {
      setIsCartOpen(true);
    }
  };

  const removeFromCart = (productId) => {
    const updated = cart.filter(item => item.id !== productId);
    setCart(updated);
    if (appliedCoupon) {
      // recalculate coupon on item removal
      setAppliedCoupon(null);
    }
  };

  const clearCart = () => {
    setCart([]);
    setAppliedCoupon(null);
  };

  /** Calculate Cart Bill */
  const cartSubtotal = cart.reduce((sum, item) => sum + (parseFloat(item.price) || 0), 0);
  const discountAmount = appliedCoupon ? appliedCoupon.discount_amount : 0;
  const finalPayable = Math.max(0, cartSubtotal - discountAmount);

  /** Coupon Handler */
  const handleApplyCoupon = async (e) => {
    e.preventDefault();
    if (!couponInput.trim()) return;

    setCouponError('');
    setCouponLoading(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/products/apply-coupon', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'Authorization': token ? `Bearer ${token}` : ''
        },
        body: JSON.stringify({
          coupon_code: couponInput.trim(),
          cart_total: cartSubtotal
        })
      });

      const data = await res.json();
      if (data.success) {
        setAppliedCoupon(data);
        setCouponInput('');
      } else {
        setCouponError(data.message || 'Invalid coupon code');
      }
    } catch (err) {
      console.error(err);
      setCouponError('Error validating coupon');
    }
    setCouponLoading(false);
  };

  /** Direct Buy Action - Launches Razorpay Gateway directly */
  const handleBuyNow = (product) => {
    let updatedCart = cart;
    if (!cart.some(item => item.id === product.id)) {
      updatedCart = [...cart, product];
      setCart(updatedCart);
    }
    setIsCartOpen(false);
    setSelectedProduct(null);
    handleProcessPayment(updatedCart);
  };

  /** Real Razorpay Payment Gateway Checkout Handler */
  const handleProcessPayment = async (overrideCart = null, selectedMethodLabel = null) => {
    // If student is paying the difference for a Product Exchange:
    if (exchangeSource && selectedExchangeProduct) {
      await handleExecuteExchange(selectedMethodLabel);
      return;
    }

    const activeCart = overrideCart || cart;
    if (!activeCart || activeCart.length === 0) {
      showAlert('Your cart is empty. Please add a product to proceed.', 'Cart Empty', 'warning');
      return;
    }

    setIsProcessingPayment(true);

    try {
      const token = localStorage.getItem('token');
      const currentStudent = student || (() => {
        try {
          const s = localStorage.getItem('student');
          return s ? JSON.parse(s) : null;
        } catch (e) {
          return null;
        }
      })();

      const rollNo = currentStudent?.['roll no'] || currentStudent?.roll_no || currentStudent?.login_id || '';
      const studentEmail = currentStudent?.['email adress'] || currentStudent?.email || '';

      const subtotal = activeCart.reduce((sum, item) => sum + (parseFloat(item.price) || 0), 0);
      const disc     = appliedCoupon ? (appliedCoupon.discount_amount || 0) : 0;
      const rawPayable = Math.max(0, subtotal - disc);
      const walletDeduct = useWalletInCart ? Math.min(rawPayable, walletBalance) : 0;
      const payable  = Math.max(0, parseFloat((rawPayable - walletDeduct).toFixed(2)));
      const isFree   = payable === 0;

      // ── 1. Handle 100% Free Order (STUDENT100 Coupon or Full Wallet Balance) ──
      if (isFree) {
        const checkoutRes = await fetch('/api/products/checkout', {
          method: 'POST',
          headers: {
            'Content-Type':  'application/json',
            'Accept':        'application/json',
            'Authorization': token ? `Bearer ${token}` : '',
            'Student-Id':    currentStudent?.id || ''
          },
          body: JSON.stringify({
            student_id:      currentStudent?.id || null,
            roll_no:         rollNo,
            email:           studentEmail,
            cart_items:      activeCart.map(i => ({ id: i.id, price: i.price })),
            total_amount:    subtotal,
            discount_amount: disc + walletDeduct,
            use_wallet:      useWalletInCart,
            final_amount:    0,
            payment_method:  walletDeduct > 0 ? 'STORE_WALLET' : 'FREE_COUPON (' + (appliedCoupon?.coupon_code || appliedCoupon?.code || 'STUDENT100') + ')',
            coupon_code:     appliedCoupon ? (appliedCoupon.coupon_code || appliedCoupon.code) : null,
          })
        });

        const data = await checkoutRes.json();
        setIsProcessingPayment(false);

        if (data.success && data.order) {
          setIsCartOpen(false);
          setIsPaymentModalOpen(false);
          setPaymentScreen('success');
          setSuccessCountdown(5);
          fetchWalletBalance();
          setPaymentScreenData({
            order: {
              order_number:      data.order.order_number || ('ORD-' + Date.now()),
              transaction_id:    data.order.transaction_id || '100% FREE (STUDENT100)',
              final_amount:      0,
              payment_method:    data.order.payment_method || 'FREE_COUPON',
              purchased_at:      data.order.purchased_at || new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
            },
            email: studentEmail || student?.email,
            items: [...activeCart],
            subtotal: subtotal,
            discount: disc + walletDeduct,
            final_amount: 0,
            studentName: currentStudent?.name || 'Student',
            rollNo: rollNo
          });
          clearCart();
          fetchProducts();
        } else {
          showAlert(data.message || 'Free order checkout failed. Please try again.', 'Order Error', 'error');
        }
        return;
      }

      // ── 2. Real Razorpay Payment Gateway Integration ──
      const isLoaded = await loadRazorpayScript();
      if (!isLoaded) {
        setIsProcessingPayment(false);
        showAlert('Unable to load Razorpay Payment Gateway. Please check your internet connection and try again.', 'Gateway Error', 'error');
        return;
      }

      // Create Razorpay Order on Backend
      const orderRes = await fetch('/api/payment/create-razorpay-order', {
        method: 'POST',
        headers: {
          'Content-Type':  'application/json',
          'Accept':        'application/json',
          'Authorization': token ? `Bearer ${token}` : '',
          'Student-Id':    currentStudent?.id || ''
        },
        body: JSON.stringify({
          amount:          payable,
          cart_items:      activeCart.map(i => ({ id: i.id, price: i.price })),
          student_id:      currentStudent?.id || null,
          discount_amount: disc + walletDeduct,
          coupon_code:     appliedCoupon ? (appliedCoupon.coupon_code || appliedCoupon.code) : null,
        })
      });

      const orderData = await orderRes.json();
      if (!orderData.success || !orderData.razorpay_order_id) {
        setIsProcessingPayment(false);
        showAlert(orderData.message || 'Failed to initialize Razorpay payment. Please try again.', 'Payment Error', 'error');
        return;
      }

      // Open official Razorpay Checkout Window
      const options = {
        key: orderData.key_id,
        amount: orderData.amount,
        currency: orderData.currency || 'INR',
        name: 'XL Education Portal',
        description: `Enrollment for ${activeCart.length} item(s)`,
        image: '/logo.svg',
        order_id: orderData.razorpay_order_id,
        handler: async function (response) {
          setIsProcessingPayment(true);
          try {
            // Verify signature on backend
            const verifyRes = await fetch('/api/payment/verify-razorpay', {
              method: 'POST',
              headers: {
                'Content-Type':  'application/json',
                'Accept':        'application/json',
                'Authorization': token ? `Bearer ${token}` : '',
                'Student-Id':    currentStudent?.id || ''
              },
              body: JSON.stringify({
                razorpay_order_id:   response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature:  response.razorpay_signature,
                student_id:          currentStudent?.id || null,
                roll_no:             rollNo,
                email:               studentEmail,
                cart_items:          activeCart.map(i => ({ id: i.id, price: i.price })),
                total_amount:        subtotal,
                discount_amount:     disc + walletDeduct,
                final_amount:        payable,
                coupon_code:         appliedCoupon ? (appliedCoupon.coupon_code || appliedCoupon.code) : null,
              })
            });

            const verifyData = await verifyRes.json();
            setIsProcessingPayment(false);

            if (verifyData.success) {
              setIsCartOpen(false);
              setIsPaymentModalOpen(false);
              setPaymentScreen('success');
              setSuccessCountdown(5);
              fetchWalletBalance();
              setPaymentScreenData({
                order: {
                  order_number:      verifyData.order.order_number || verifyData.order.razorpay_order_id || ('ORD-' + Date.now()),
                  transaction_id:    verifyData.order.transaction_id || response.razorpay_payment_id,
                  final_amount:      payable,
                  payment_method:    verifyData.order.payment_method || 'RAZORPAY',
                  purchased_at:      verifyData.order.purchased_at || new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
                },
                email: studentEmail || student?.email,
                items: [...activeCart],
                subtotal: subtotal,
                discount: disc + walletDeduct,
                final_amount: payable,
                studentName: currentStudent?.name || 'Student',
                rollNo: rollNo
              });
              clearCart();
              fetchProducts();
              fetchMyPurchases();
            } else {
              setPaymentScreen('failed');
              setPaymentScreenData({
                error: verifyData.message || 'Payment signature verification failed. Please contact support.'
              });
            }
          } catch (e) {
            setIsProcessingPayment(false);
            setPaymentScreen('failed');
            setPaymentScreenData({
              error: 'Verification connection timeout. If money was deducted, our background sync will activate your course within 5 minutes.'
            });
          }
        },
        modal: {
          ondismiss: async function () {
            setIsProcessingPayment(false);
            try {
              await fetch('/api/payment/cancel-order', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ razorpay_order_id: orderData.razorpay_order_id })
              });
            } catch (e) {}
            setToastMessage('Payment popup was closed by user.');
          }
        },
        prefill: {
          name: currentStudent?.name || '',
          email: studentEmail || '',
          contact: currentStudent?.phone_no || ''
        },
        notes: {
          student_roll: rollNo,
          student_id: currentStudent?.id || ''
        },
        theme: {
          color: '#4f46e5'
        }
      };

      setIsProcessingPayment(false);
      const rzpWindow = new window.Razorpay(options);
      rzpWindow.on('payment.failed', function (resp) {
        setIsProcessingPayment(false);
        setPaymentScreen('failed');
        setPaymentScreenData({
          error: resp.error?.description || 'Payment was declined by your bank.'
        });
      });
      rzpWindow.open();

    } catch (err) {
      console.error(err);
      setIsProcessingPayment(false);
      showAlert('Network communication error during checkout. Please try again.', 'Checkout Error', 'error');
    }
  };


  /** Category & Feature Helpers */
  const getCategoryClass = (cat) => {
    if (!cat) return styles.catMock;
    const c = String(cat).toLowerCase();
    if (c.includes('mock')) return styles.catMock;
    if (c.includes('test')) return styles.catTest;
    if (c.includes('course')) return styles.catCourse;
    if (c.includes('ebook')) return styles.catEbook;
    return styles.catMock;
  };

  const getCategoryIcon = (cat) => {
    if (!cat) return <Sparkles size={14} />;
    const c = String(cat).toLowerCase();
    if (c.includes('mock')) return <Video size={14} />;
    if (c.includes('test')) return <Award size={14} />;
    if (c.includes('course')) return <BookOpen size={14} />;
    if (c.includes('ebook')) return <FileText size={14} />;
    return <Sparkles size={14} />;
  };

  const getFeaturesList = (features) => {
    if (Array.isArray(features)) return features;
    if (typeof features === 'string') {
      try {
        const parsed = JSON.parse(features);
        if (Array.isArray(parsed)) return parsed;
      } catch (e) {}
      return features.split('\n').map(s => s.trim()).filter(Boolean);
    }
    return [];
  };

  return (
    <div className={styles.storeContainer}>
      
      {/* Floating Toast Alert */}
      {toastMessage && (
        <div style={{
          position: 'fixed',
          bottom: '24px',
          right: '24px',
          background: '#0f172a',
          color: '#ffffff',
          padding: '12px 20px',
          borderRadius: '8px',
          boxShadow: '0 10px 25px rgba(0,0,0,0.2)',
          zIndex: 9999,
          fontSize: '0.9rem',
          fontWeight: 600,
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          borderLeft: '4px solid #f97316',
          animation: 'fadeIn 0.3s ease'
        }}>
          <Sparkles size={16} color="#f97316" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════════
          FLIPKART / AMAZON STYLE DEDICATED PAYMENT RESULT SCREENS
          ══════════════════════════════════════════════════════════════════════════ */}

      {/* 1. SUCCESS POPUP MODAL (CENTERED & 5-SECOND AUTO-REDIRECT) */}
      {paymentScreen === 'success' && paymentScreenData && (
        <div className={styles.paymentPopupOverlay} onClick={() => { setPaymentScreen(null); setViewMode('purchases'); fetchMyPurchases(); }}>
          <div className={styles.paymentPopupCard} onClick={(e) => e.stopPropagation()}>
            <div className={styles.resultHeaderSuccess} style={{ padding: '2.5rem 1.5rem 2rem 1.5rem' }}>
              <div className={styles.resultIconCircleSuccess} style={{ width: '76px', height: '76px', margin: '0 auto 1rem auto' }}>
                <Check size={44} strokeWidth={3.5} />
              </div>
              <h2 className={styles.resultTitle} style={{ fontSize: '1.65rem', marginBottom: '0.35rem' }}>
                Order Placed Successfully! 🎉
              </h2>
              <p className={styles.resultSubtitle} style={{ fontSize: '0.95rem', opacity: 0.95 }}>
                Payment verified instantly • Course access is now active
              </p>
            </div>

            <div style={{ padding: '1.75rem 1.5rem 1.5rem 1.5rem' }}>
              {/* Order Info Bar */}
              <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '0.85rem', padding: '1rem 1.25rem', marginBottom: '1.25rem', display: 'flex', justifyContent: 'space-around', alignItems: 'center' }}>
                <div>
                  <span style={{ fontSize: '0.7rem', color: '#64748b', fontWeight: 700, textTransform: 'uppercase', display: 'block', letterSpacing: '0.5px' }}>Order Reference ID</span>
                  <strong style={{ fontSize: '0.95rem', color: '#0f172a', wordBreak: 'break-all' }}>{paymentScreenData.order?.order_number || paymentScreenData.order?.razorpay_order_id || 'N/A'}</strong>
                </div>
                <div style={{ width: '1px', height: '32px', background: '#cbd5e1' }}></div>
                <div>
                  <span style={{ fontSize: '0.7rem', color: '#64748b', fontWeight: 700, textTransform: 'uppercase', display: 'block', letterSpacing: '0.5px' }}>Total Amount Paid</span>
                  <strong style={{ fontSize: '1.2rem', color: '#059669', fontWeight: 800 }}>₹{parseFloat(paymentScreenData.final_amount || paymentScreenData.order?.final_amount || 0).toFixed(2)}</strong>
                </div>
              </div>

              {/* Items Preview Chips */}
              {(paymentScreenData.items || []).length > 0 && (
                <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '0.75rem', padding: '0.75rem 1rem', marginBottom: '1.25rem', textAlign: 'left' }}>
                  <div style={{ fontSize: '0.75rem', color: '#166534', fontWeight: 700, textTransform: 'uppercase', marginBottom: '0.4rem' }}>
                    ✅ Unlocked Items:
                  </div>
                  {paymentScreenData.items.map((item, idx) => (
                    <div key={idx} style={{ fontSize: '0.85rem', color: '#14532d', fontWeight: 600, display: 'flex', justifyContent: 'space-between' }}>
                      <span>• {item.title}</span>
                      <span>₹{item.price}</span>
                    </div>
                  ))}
                </div>
              )}

              {/* 5-Second Countdown Status */}
              <div style={{ fontSize: '0.9rem', color: '#475569', marginBottom: '1.5rem', lineHeight: 1.5 }}>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', color: '#059669', fontWeight: 700, fontSize: '0.95rem' }}>
                  <CheckCircle2 size={18} /> Available in My Purchases tab
                </span>
                <div style={{ marginTop: '6px', fontSize: '0.85rem', color: '#64748b' }}>
                  Auto-redirecting in <strong style={{ color: '#059669', fontSize: '1.05rem' }}>{successCountdown}s</strong>... (Download Tax Invoice anytime from My Purchases)
                </div>
              </div>

              {/* Primary Action Button */}
              <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center' }}>
                <button 
                  className={styles.btnActionPrimarySuccess}
                  style={{ width: '100%', justifyContent: 'center', padding: '0.9rem 1.5rem', fontSize: '1rem', borderRadius: '0.75rem' }}
                  onClick={() => { setPaymentScreen(null); setViewMode('purchases'); fetchMyPurchases(); }}
                >
                  View in My Purchases Now <ChevronRight size={20} />
                </button>
              </div>
            </div>

            {/* 5-Second Visual Progress Drain Bar */}
            <div className={styles.popupProgressBar}>
              <div className={styles.popupProgressFill}></div>
            </div>
          </div>
        </div>
      )}

      {/* 2. FAILURE POPUP MODAL (CENTERED & RED THEME) */}
      {paymentScreen === 'failed' && paymentScreenData && (
        <div className={styles.paymentPopupOverlay} onClick={() => setPaymentScreen(null)}>
          <div className={styles.paymentPopupCard} onClick={(e) => e.stopPropagation()}>
            <div className={styles.resultHeaderFailure} style={{ padding: '2.5rem 1.5rem 2rem 1.5rem' }}>
              <div className={styles.resultIconCircleFailure} style={{ width: '76px', height: '76px', margin: '0 auto 1rem auto' }}>
                <AlertOctagon size={42} strokeWidth={2.5} />
              </div>
              <h2 className={styles.resultTitle} style={{ fontSize: '1.6rem', marginBottom: '0.35rem' }}>
                {paymentScreenData.title || 'Payment Failed'}
              </h2>
              <p className={styles.resultSubtitle} style={{ fontSize: '0.95rem', opacity: 0.95 }}>
                {paymentScreenData.reason || 'Transaction could not be completed at this time.'}
              </p>
            </div>

            <div style={{ padding: '1.75rem 1.5rem 1.5rem 1.5rem' }}>
              <div style={{ background: '#fff1f2', border: '1px solid #fecdd3', borderRadius: '0.85rem', padding: '1rem 1.25rem', marginBottom: '1.5rem', color: '#9f1239', fontSize: '0.9rem', lineHeight: 1.5, textAlign: 'left' }}>
                <strong>💡 Don't worry!</strong>
                <p style={{ margin: '0.35rem 0 0 0', fontSize: '0.85rem' }}>
                  If any money was debited from your account, it will be automatically refunded by your bank within 3-5 business days. Your selected items in the cart are safe.
                </p>
              </div>

              {/* Action Buttons */}
              <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center', flexWrap: 'wrap' }}>
                <button 
                  className={styles.btnActionStore}
                  style={{ flex: '1 1 140px', justifyContent: 'center', padding: '0.85rem 1rem' }}
                  onClick={() => { setPaymentScreen(null); setIsCartOpen(true); }}
                >
                  <ArrowLeft size={16} /> Return to Cart
                </button>

                <button 
                  className={styles.btnActionRetry}
                  style={{ flex: '2 1 200px', justifyContent: 'center', padding: '0.85rem 1.25rem', borderRadius: '0.75rem' }}
                  onClick={() => { setPaymentScreen(null); handleProcessPayment(paymentScreenData.cart); }}
                >
                  <RotateCcw size={16} /> Retry Payment Now
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 3. CANCELLED POPUP MODAL (CENTERED & RED THEME) */}
      {paymentScreen === 'cancelled' && (
        <div className={styles.paymentPopupOverlay} onClick={() => setPaymentScreen(null)}>
          <div className={styles.paymentPopupCard} onClick={(e) => e.stopPropagation()}>
            <div className={styles.resultHeaderFailure} style={{ padding: '2.5rem 1.5rem 2rem 1.5rem' }}>
              <div className={styles.resultIconCircleFailure} style={{ width: '76px', height: '76px', margin: '0 auto 1rem auto' }}>
                <AlertTriangle size={42} strokeWidth={2.5} />
              </div>
              <h2 className={styles.resultTitle} style={{ fontSize: '1.6rem', marginBottom: '0.35rem' }}>
                Payment Incomplete / Cancelled
              </h2>
              <p className={styles.resultSubtitle} style={{ fontSize: '0.95rem', opacity: 0.95 }}>
                You closed the Razorpay payment window before completing the checkout.
              </p>
            </div>

            <div style={{ padding: '1.75rem 1.5rem 1.5rem 1.5rem' }}>
              <div style={{ background: '#fef2f2', border: '1px solid #fee2e2', borderRadius: '0.85rem', padding: '1rem 1.25rem', marginBottom: '1.5rem', color: '#991b1b', fontSize: '0.9rem', lineHeight: 1.5, textAlign: 'left' }}>
                <strong>🛒 Cart is Saved:</strong>
                <p style={{ margin: '0.35rem 0 0 0', fontSize: '0.85rem', color: '#7f1d1d' }}>
                  Your selected items (<strong>{cart.length} item{cart.length > 1 ? 's' : ''}</strong>) are safely preserved in your bag. You can resume checkout anytime.
                </p>
              </div>

              {/* Action Buttons */}
              <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center', flexWrap: 'wrap' }}>
                <button 
                  className={styles.btnActionStore}
                  style={{ flex: '1 1 140px', justifyContent: 'center', padding: '0.85rem 1rem' }}
                  onClick={() => setPaymentScreen(null)}
                >
                  Explore More Courses
                </button>
                <button 
                  className={styles.btnActionRetry}
                  style={{ flex: '2 1 200px', justifyContent: 'center', padding: '0.85rem 1.25rem', borderRadius: '0.75rem' }}
                  onClick={() => { setPaymentScreen(null); handleProcessPayment(); }}
                >
                  <RefreshCw size={16} /> Resume Checkout (Pay ₹{finalPayable.toFixed(2)})
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Banner Announcement */}
      <div className={styles.bannerHero}>
        <div className={styles.bannerContent}>
          <div className={styles.bannerBadge}>
            <Sparkles size={14} /> Class-Wise 11+, GCSE &amp; A-Level Academic Catalog
          </div>
          <h2>Level Up Your Prep with Class-Wise Mocks &amp; Courses</h2>
          <p>Access full-length timed 11+ mock papers (GL/CEM), GCSE &amp; A-Level exam preparation packs, video masterclasses, and 1-on-1 academic mentorship.</p>
          <div className={styles.couponPill}>
            <span>Use Coupon <code>EXCEL20</code> for 20% Flat Discount</span>
          </div>
        </div>
        <div className={styles.bannerActions} style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap' }}>
          <div style={{
            background: 'rgba(16, 185, 129, 0.2)',
            border: '1px solid rgba(16, 185, 129, 0.5)',
            color: '#a7f3d0',
            padding: '0.55rem 1rem',
            borderRadius: '0.65rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            fontWeight: 700,
            fontSize: '0.85rem',
            boxShadow: '0 2px 8px rgba(16, 185, 129, 0.15)'
          }}>
            <Wallet size={18} color="#34d399" /> Store Wallet: <strong style={{ color: '#ffffff', fontSize: '1rem' }}>₹{walletBalance.toFixed(2)}</strong>
          </div>
        </div>
      </div>

      {/* Controls & Filter Bar */}
      <div className={styles.controlsBar}>
        <div className={styles.leftControls}>
          {/* Search */}
          <div className={styles.searchBox}>
            <Search size={16} color="#64748b" />
            <input 
              type="text" 
              placeholder="Search 11+ mocks, GCSE packs, video courses..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            {searchQuery && (
              <X size={14} color="#94a3b8" style={{ cursor: 'pointer' }} onClick={() => setSearchQuery('')} />
            )}
          </div>

          {/* Category Pills */}
          <div className={styles.categoryTabs}>
            {['All', '11+ Mock Series', 'Test Series', 'Course', 'eBook', '1-on-1 Mentorship'].map(cat => (
              <button 
                key={cat}
                className={`${styles.categoryBtn} ${activeCategory === cat ? styles.activeCategory : ''}`}
                onClick={() => { setActiveCategory(cat); setViewMode('store'); }}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Sort & Action Toggle (Store / My Purchases) - Aligned to the Right */}
        <div className={styles.rightControls}>
          {viewMode === 'store' && (
            <div className={styles.customSortWrapper} ref={sortRef}>
              <button
                type="button"
                className={`${styles.customSortTrigger} ${isSortOpen ? styles.sortTriggerActive : ''}`}
                onClick={() => setIsSortOpen(!isSortOpen)}
                aria-haspopup="listbox"
                aria-expanded={isSortOpen}
              >
                <div className={styles.sortTriggerIcon}>
                  <SlidersHorizontal size={15} />
                </div>
                <div className={styles.sortTriggerText}>
                  <span className={styles.sortTriggerLabel}>SORT BY</span>
                  <span className={styles.sortTriggerValue}>
                    {sortOptions.find(o => o.id === sortBy)?.label || 'Top Rated'}
                  </span>
                </div>
                <ChevronDown 
                  size={16} 
                  className={`${styles.sortChevron} ${isSortOpen ? styles.sortChevronOpen : ''}`} 
                />
              </button>

              {isSortOpen && (
                <div className={styles.customSortDropdown} role="listbox">
                  <div className={styles.sortDropdownHeader}>
                    <span>Choose Sort Order</span>
                    <span className={styles.sortOptionCount}>{sortOptions.length} Options</span>
                  </div>
                  <div className={styles.sortOptionsList}>
                    {sortOptions.map((opt) => {
                      const Icon = opt.icon;
                      const isSelected = sortBy === opt.id;
                      return (
                        <div
                          key={opt.id}
                          className={`${styles.sortOptionItem} ${isSelected ? styles.sortOptionSelected : ''}`}
                          onClick={() => {
                            setSortBy(opt.id);
                            setIsSortOpen(false);
                            fetchProducts(opt.id);
                          }}
                          role="option"
                          aria-selected={isSelected}
                        >
                          <div 
                            className={styles.sortOptionIconWrap} 
                            style={{ 
                              color: isSelected ? '#ffffff' : opt.color, 
                              backgroundColor: isSelected ? opt.color : `${opt.color}18` 
                            }}
                          >
                            <Icon size={16} />
                          </div>
                          <div className={styles.sortOptionInfo}>
                            <div className={styles.sortOptionTitleRow}>
                              <span className={styles.sortOptionTitle}>{opt.label}</span>
                              {opt.badge && (
                                <span 
                                  className={styles.sortOptionBadge} 
                                  style={{ 
                                    color: opt.color, 
                                    borderColor: `${opt.color}40`, 
                                    backgroundColor: `${opt.color}12` 
                                  }}
                                >
                                  {opt.badge}
                                </span>
                              )}
                            </div>
                            <span className={styles.sortOptionSubtitle}>{opt.subtitle}</span>
                          </div>
                          {isSelected && (
                            <div className={styles.sortCheckmark}>
                              <Check size={16} strokeWidth={2.5} />
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}

          <button 
            className={`${styles.purchasesBtn} ${viewMode === 'purchases' ? styles.activePurchasesBtn : ''}`}
            onClick={() => setViewMode(viewMode === 'purchases' ? 'store' : 'purchases')}
          >
            <Award size={16} />
            My Purchases
            {purchases.length > 0 && (
              <span style={{ background: '#4f46e5', color: 'white', padding: '1px 6px', borderRadius: '10px', fontSize: '0.75rem' }}>
                {purchases.length}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* VIEW MODE 1: MY PURCHASES DASHBOARD */}
      {viewMode === 'purchases' ? (
        <div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.75rem' }}>
            <div>
              <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800 }}>My Purchased Enrolled Courses & Mocks</h3>
              <p style={{ margin: '0.2rem 0 0 0', color: '#64748b', fontSize: '0.85rem' }}>
                Purchased wrong item? Click <strong>"Change Product"</strong> on any item to swap or get refund to wallet.
              </p>
            </div>
            <button className={styles.btnSecondary} onClick={() => setViewMode('store')}>
              ← Back to Product Catalog
            </button>
          </div>

          {loadingPurchases ? (
            <div style={{ padding: '3rem', textAlign: 'center', color: '#64748b' }}>
              Loading your active purchases...
            </div>
          ) : purchases.length === 0 ? (
            <div style={{ background: 'white', padding: '3rem 2rem', borderRadius: '1rem', border: '1px solid #e2e8f0', textAlign: 'center' }}>
              <Award size={48} color="#cbd5e1" style={{ marginBottom: '1rem' }} />
              <h4 style={{ margin: '0 0 0.5rem 0', fontSize: '1.1rem' }}>No Active Purchases Yet</h4>
              <p style={{ color: '#64748b', margin: '0 0 1.5rem 0', fontSize: '0.9rem' }}>You haven't bought any mock interviews or courses yet. Browse our catalog to get started!</p>
              <button className={styles.btnPrimary} onClick={() => setViewMode('store')}>Browse Store</button>
            </div>
          ) : (
            <div className={styles.productsGrid}>
              {purchases.map(item => (
                <div key={item.id} className={styles.productCard} style={{ borderColor: '#bbf7d0' }}>
                  <div className={styles.cardHeader}>
                    <div className={styles.cardHeaderTop}>
                      <span className={`${styles.catBadge} ${getCategoryClass(item.category)}`}>
                        {item.category?.replace('_', ' ')}
                      </span>
                      <span style={{ background: '#dcfce7', color: '#15803d', fontSize: '0.75rem', fontWeight: 700, padding: '0.2rem 0.6rem', borderRadius: '0.35rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                        <CheckCircle2 size={12} /> Active Access
                      </span>
                    </div>
                    <h3 className={styles.productTitle}>{item.title}</h3>
                    <p className={styles.shortDesc}>{item.short_description}</p>
                    
                    <ul className={styles.featuresPreview}>
                      {getFeaturesList(item.features).slice(0, 3).map((feat, idx) => (
                        <li key={idx}><CheckCircle size={13} /> {feat}</li>
                      ))}
                    </ul>
                  </div>

                  <div className={styles.cardFooter} style={{ background: '#f0fdf4', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem' }}>
                    <div className={styles.priceBlock}>
                      <span style={{ fontSize: '0.75rem', color: '#166534', fontWeight: 600, display: 'block' }}>Purchased on {item.purchased_at}</span>
                      <span style={{ fontSize: '0.725rem', color: '#64748b' }}>Expires: {item.expires_at || 'Lifetime'}</span>
                    </div>
                    <div style={{ display: 'flex', gap: '0.45rem', flexWrap: 'wrap', alignItems: 'center' }}>
                      {/* Left: Change Product Button */}
                      <button 
                        className={styles.btnSecondary} 
                        style={{ padding: '0.45rem 0.65rem', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '4px', background: '#eff6ff', color: '#1d4ed8', borderColor: '#bfdbfe', fontWeight: 700 }}
                        onClick={() => startProductExchange(item)}
                        title="Mistakenly purchased? Swap with another course/product"
                      >
                        <RefreshCw size={13} /> Change Product
                      </button>

                      {/* Middle (Bich Me): Access Button */}
                      <button 
                        className={styles.btnPrimary} 
                        style={{ background: '#16a34a', padding: '0.45rem 0.9rem', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '4px', fontWeight: 700, boxShadow: '0 2px 8px rgba(22, 163, 74, 0.25)' }}
                        onClick={() => setToastMessage(`✨ Accessing study modules for: ${item.title}`)}
                      >
                        Access <ChevronRight size={14} />
                      </button>

                      {/* Right: Invoice Button */}
                      <button 
                        className={styles.btnSecondary} 
                        style={{ padding: '0.45rem 0.65rem', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '4px', background: 'white' }}
                        onClick={() => {
                          printInvoice({
                            order_number: item.razorpay_order_id || item.order_number || ('order_' + item.id),
                            transaction_id: item.transaction_id || ('pay_' + item.id),
                            final_amount: item.amount_paid || item.price || 0,
                            purchased_at: item.purchased_at || new Date().toLocaleDateString('en-IN'),
                            payment_method: 'DIRECT_PAY',
                            items: [{ title: item.title, category: item.category, price: item.amount_paid || item.price, expires_at: item.expires_at }]
                          }, student);
                        }}
                      >
                        <Download size={13} /> Invoice
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (

        /* VIEW MODE 2: CATALOG STORE GRID */
        <div>
          {/* ACTIVE PRODUCT EXCHANGE BANNER */}
          {exchangeSource && (
            <div style={{
              background: 'linear-gradient(135deg, #1e1b4b 0%, #312e81 100%)',
              color: '#ffffff',
              borderRadius: '1rem',
              padding: '1.25rem 1.5rem',
              marginBottom: '1.5rem',
              boxShadow: '0 10px 25px -5px rgba(49, 46, 129, 0.35)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: '1rem',
              border: '2px solid #6366f1'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
                <div style={{ background: '#4f46e5', padding: '0.7rem', borderRadius: '0.75rem', display: 'flex', boxShadow: '0 4px 12px rgba(79, 70, 229, 0.4)' }}>
                  <RefreshCw size={24} color="#38bdf8" />
                </div>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                    <span style={{ background: '#38bdf8', color: '#0f172a', fontSize: '0.7rem', fontWeight: 800, padding: '2px 8px', borderRadius: '4px', textTransform: 'uppercase' }}>
                      Exchange Mode Active
                    </span>
                    <h4 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 800, color: '#ffffff' }}>
                      Returning: "{exchangeSource.title}" (Original Value: ₹{parseFloat(exchangeSource.amount_paid || exchangeSource.price || 0).toFixed(2)})
                    </h4>
                  </div>
                  <p style={{ margin: '0.35rem 0 0 0', fontSize: '0.85rem', color: '#c7d2fe' }}>
                    👉 Click <strong>"Exchange With This"</strong> on any product below to swap. Surplus money will automatically be refunded to your Store Wallet.
                  </p>
                </div>
              </div>

              <button
                onClick={() => { setExchangeSource(null); setSelectedExchangeProduct(null); }}
                style={{
                  background: 'rgba(255, 255, 255, 0.15)',
                  border: '1px solid rgba(255, 255, 255, 0.3)',
                  color: '#ffffff',
                  padding: '0.55rem 1.1rem',
                  borderRadius: '0.5rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  fontSize: '0.85rem'
                }}
              >
                ✖ Cancel Exchange
              </button>
            </div>
          )}

          {loading ? (
            <div style={{ padding: '4rem', textAlign: 'center', color: '#64748b' }}>
              Fetching latest products & mock tests...
            </div>
          ) : products.length === 0 ? (
            <div style={{ background: 'white', padding: '3rem 2rem', borderRadius: '1rem', border: '1px solid #e2e8f0', textAlign: 'center' }}>
              <Search size={40} color="#cbd5e1" style={{ marginBottom: '0.75rem' }} />
              <h4>No matching products found</h4>
              <p style={{ color: '#64748b', fontSize: '0.9rem' }}>Try adjusting your search query or selecting a different category filter.</p>
            </div>
          ) : (
            <div className={styles.productsGrid}>
              {products.map(prod => {
                const isAlreadyOwned = Boolean(prod.is_purchased || purchases.some(p => p.product_id === prod.id || p.id === prod.id));
                const isCurrentSwapSource = Boolean(exchangeSource && (exchangeSource.product_id === prod.id || exchangeSource.id === prod.id));

                return (
                  <div 
                    key={prod.id} 
                    className={styles.productCard} 
                    style={
                      isCurrentSwapSource 
                        ? { borderColor: '#f59e0b', background: '#fffbeb', boxShadow: '0 4px 15px rgba(245, 158, 11, 0.15)' } 
                        : isAlreadyOwned && exchangeSource
                          ? { borderColor: '#86efac', background: '#f0fdf4', opacity: 0.85 }
                          : exchangeSource 
                            ? { borderColor: '#c7d2fe', boxShadow: '0 4px 15px rgba(99, 102, 241, 0.12)' } 
                            : {}
                    }
                  >
                    {prod.thumbnail && (
                      <div style={{ height: '160px', margin: '-1.5rem -1.5rem 1rem -1.5rem', borderRadius: '1rem 1rem 0 0', overflow: 'hidden', borderBottom: '1px solid #e2e8f0', position: 'relative' }}>
                        <img src={prod.thumbnail} alt={prod.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        {isAlreadyOwned && !isCurrentSwapSource && (
                          <div style={{ position: 'absolute', top: '10px', right: '10px', background: 'rgba(22, 163, 74, 0.92)', color: '#ffffff', padding: '4px 10px', borderRadius: '2rem', fontSize: '0.725rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '4px', backdropFilter: 'blur(4px)', boxShadow: '0 2px 6px rgba(0,0,0,0.15)' }}>
                            <CheckCircle2 size={13} /> Owned
                          </div>
                        )}
                        {isCurrentSwapSource && (
                          <div style={{ position: 'absolute', top: '10px', right: '10px', background: 'rgba(217, 119, 6, 0.95)', color: '#ffffff', padding: '4px 10px', borderRadius: '2rem', fontSize: '0.725rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '4px', backdropFilter: 'blur(4px)' }}>
                            <RefreshCw size={13} /> Returning Item
                          </div>
                        )}
                      </div>
                    )}
                    <div className={styles.cardHeader}>
                      <div className={styles.cardHeaderTop}>
                        <span className={`${styles.catBadge} ${getCategoryClass(prod.category)}`}>
                          {getCategoryIcon(prod.category)}
                          <span style={{ marginLeft: '4px' }}>{prod.category?.replace('_', ' ')}</span>
                        </span>
                        {isCurrentSwapSource ? (
                          <span style={{ background: '#fef3c7', color: '#b45309', padding: '0.2rem 0.55rem', borderRadius: '0.35rem', fontSize: '0.7rem', fontWeight: 800, display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
                            <RefreshCw size={11} /> Return Item
                          </span>
                        ) : isAlreadyOwned ? (
                          <span style={{ background: '#dcfce7', color: '#15803d', padding: '0.2rem 0.55rem', borderRadius: '0.35rem', fontSize: '0.7rem', fontWeight: 800, display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
                            <CheckCircle2 size={11} /> In My Purchases
                          </span>
                        ) : prod.badge ? (
                          <span className={styles.badgeTag}>{prod.badge}</span>
                        ) : null}
                      </div>

                      <h3 className={styles.productTitle} onClick={() => setSelectedProduct(prod)}>
                        {prod.title}
                      </h3>
                      <p className={styles.shortDesc}>{prod.short_description}</p>

                      <div className={styles.ratingRow}>
                        <span className={styles.starRating}><Star size={13} fill="#eab308" /> {prod.rating}</span>
                        <span>• ({prod.reviews_count || 120} reviews)</span>
                        <span>• {prod.validity_days} Days Access</span>
                      </div>

                      <ul className={styles.featuresPreview}>
                        {getFeaturesList(prod.features).slice(0, 3).map((feat, idx) => (
                          <li key={idx}><CheckCircle size={13} /> {feat}</li>
                        ))}
                      </ul>
                    </div>

                    <div className={styles.cardFooter}>
                      <div className={styles.priceBlock}>
                        {prod.original_price && (
                          <span className={styles.originalPrice}>₹{prod.original_price}</span>
                        )}
                        <span className={styles.currentPrice}>₹{prod.price}</span>
                      </div>

                      <div className={styles.cardActions}>
                        {exchangeSource ? (
                          isCurrentSwapSource ? (
                            <button 
                              className={styles.btnSecondary} 
                              disabled 
                              style={{ width: '100%', padding: '0.55rem', fontSize: '0.775rem', background: '#fef3c7', color: '#92400e', border: '1px solid #fde68a', cursor: 'not-allowed', fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}
                            >
                              <RefreshCw size={13} /> Currently Enrolled
                            </button>
                          ) : isAlreadyOwned ? (
                            <button 
                              className={styles.btnSecondary} 
                              style={{ width: '100%', padding: '0.55rem', fontSize: '0.775rem', background: '#f0fdf4', color: '#15803d', border: '1.5px solid #86efac', fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}
                              onClick={() => showAlert("You have already purchased this course. Please choose a different course from the catalog to exchange.", "Course Already Owned", "warning")}
                              title="Already in your purchases"
                            >
                              <CheckCircle2 size={13} /> Already Purchased
                            </button>
                          ) : (
                            <button 
                              className={styles.btnPrimary} 
                              style={{ 
                                background: 'linear-gradient(135deg, #4f46e5 0%, #4338ca 100%)', 
                                padding: '0.55rem 1rem', 
                                fontSize: '0.85rem', 
                                width: '100%',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '6px',
                                fontWeight: 800,
                                boxShadow: '0 4px 12px rgba(79, 70, 229, 0.3)'
                              }}
                              onClick={() => handleSelectProductForExchange(prod)}
                            >
                              <RefreshCw size={14} /> Exchange With This
                            </button>
                          )
                        ) : isAlreadyOwned ? (
                          <button 
                            className={`${styles.btnPrimary} ${styles.purchasedBtn}`} 
                            style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}
                            onClick={() => setViewMode('purchases')}
                          >
                            <CheckCircle2 size={14} /> In My Purchases ➔
                          </button>
                        ) : (
                          <>
                            <button 
                              className={styles.btnSecondary} 
                              onClick={() => addToCart(prod, false)}
                              style={{
                                background: cart.some(i => i.id === prod.id) ? '#f0fdf4' : undefined,
                                color: cart.some(i => i.id === prod.id) ? '#166534' : undefined,
                                borderColor: cart.some(i => i.id === prod.id) ? '#bbf7d0' : undefined
                              }}
                            >
                              {cart.some(i => i.id === prod.id) ? '✓ In Cart' : '+ Cart'}
                            </button>
                            <button className={styles.btnPrimary} onClick={() => handleBuyNow(prod)}>
                              Buy Now
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* PRODUCT DETAIL MODAL */}
      {selectedProduct && (
        <div className={styles.modalOverlay} onClick={() => setSelectedProduct(null)}>
          <div className={styles.detailModal} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <div>
                <span className={`${styles.catBadge} ${getCategoryClass(selectedProduct.category)}`}>
                  {selectedProduct.category?.replace('_', ' ')}
                </span>
                <h3 style={{ margin: '0.5rem 0 0.25rem 0', fontSize: '1.3rem', fontWeight: 800 }}>
                  {selectedProduct.title}
                </h3>
              </div>
              <button className={styles.modalCloseBtn} onClick={() => setSelectedProduct(null)}>
                <X size={18} />
              </button>
            </div>

            <div className={styles.modalBody}>
              {selectedProduct.thumbnail && (
                <div style={{ height: '180px', borderRadius: '0.75rem', overflow: 'hidden', marginBottom: '1.25rem', border: '1px solid #e2e8f0' }}>
                  <img src={selectedProduct.thumbnail} alt={selectedProduct.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                </div>
              )}
              <div>
                <h4 style={{ margin: '0 0 0.5rem 0', fontSize: '0.95rem', color: '#0f172a' }}>Overview & Description</h4>
                <p style={{ color: '#475569', fontSize: '0.9rem', lineHeight: 1.6, margin: 0 }}>
                  {selectedProduct.description || selectedProduct.short_description}
                </p>
              </div>

              <div>
                <h4 style={{ margin: '0 0 0.5rem 0', fontSize: '0.95rem', color: '#0f172a' }}>Key Highlights & Included Features</h4>
                <ul className={styles.featuresPreview}>
                  {getFeaturesList(selectedProduct.features).map((feat, idx) => (
                    <li key={idx} style={{ fontSize: '0.9rem', padding: '0.2rem 0' }}>
                      <CheckCircle size={15} /> {feat}
                    </li>
                  ))}
                </ul>
              </div>
              <div style={{ background: '#f8fafc', padding: '1rem', borderRadius: '0.75rem', border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                  <span style={{ fontSize: '0.8rem', color: '#64748b', display: 'block' }}>Total Price</span>
                  {selectedProduct.original_price && (
                    <span style={{ fontSize: '0.85rem', color: '#94a3b8', textDecoration: 'line-through', marginRight: '0.5rem' }}>
                      ₹{selectedProduct.original_price}
                    </span>
                  )}
                  <span style={{ fontSize: '1.4rem', fontWeight: 800, color: '#0f172a' }}>
                    ₹{selectedProduct.price}
                  </span>
                </div>

                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  {exchangeSource ? (
                    <button 
                      className={styles.btnPrimary} 
                      style={{ padding: '0.65rem 1.25rem', background: 'linear-gradient(135deg, #4f46e5 0%, #4338ca 100%)', display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 800 }} 
                      onClick={() => { 
                        const prod = selectedProduct;
                        setSelectedProduct(null); 
                        handleSelectProductForExchange(prod); 
                      }}
                    >
                      <RefreshCw size={15} /> Exchange With This Course
                    </button>
                  ) : (
                    <>
                      <button className={styles.btnSecondary} onClick={() => { addToCart(selectedProduct, false); setSelectedProduct(null); }}>
                        Add to Cart
                      </button>
                      <button className={styles.btnPrimary} style={{ padding: '0.65rem 1.25rem' }} onClick={() => { setSelectedProduct(null); handleBuyNow(selectedProduct); }}>
                        Buy Now
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* LUXURY SHOPPING CART DRAWER */}
      {isCartOpen && (
        <div className={styles.cartDrawerOverlay} onClick={() => setIsCartOpen(false)}>
          <div className={styles.cartDrawer} onClick={(e) => e.stopPropagation()}>
            {/* Drawer Header */}
            <div className={styles.cartDrawerHeader}>
              <div className={styles.cartDrawerHeaderLeft}>
                <div className={styles.cartDrawerIconBadge}>
                  <ShoppingBag size={20} />
                </div>
                <div>
                  <h3 className={styles.cartDrawerTitle}>Your Shopping Cart</h3>
                  <span className={styles.cartItemCountSubtitle}>
                    {cart.length} {cart.length === 1 ? 'item' : 'items'} selected
                  </span>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                {cart.length > 0 && (
                  <button 
                    type="button" 
                    className={styles.clearCartBtn}
                    onClick={() => setCart([])}
                    title="Clear all items"
                  >
                    Clear All
                  </button>
                )}
                <button 
                  type="button" 
                  className={styles.cartCloseBtn} 
                  onClick={() => setIsCartOpen(false)}
                  aria-label="Close Cart"
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            {/* Cart Items List */}
            <div className={styles.cartItemsList}>
              {cart.length === 0 ? (
                <div className={styles.emptyCartBox}>
                  <div className={styles.emptyCartIconWrap}>
                    <ShoppingBag size={48} />
                    <Sparkles size={20} className={styles.emptyCartSparkle} />
                  </div>
                  <h4 className={styles.emptyCartTitle}>Your cart is empty</h4>
                  <p className={styles.emptyCartText}>
                    Explore our top 11+ mock tests, GCSE packs, video courses, and 1-on-1 mentorship.
                  </p>
                  <button 
                    type="button" 
                    className={styles.exploreStoreBtn}
                    onClick={() => {
                      setIsCartOpen(false);
                      setViewMode('store');
                    }}
                  >
                    <Sparkles size={16} /> Explore Store Courses
                  </button>
                </div>
              ) : (
                cart.map(item => (
                  <div key={item.id} className={styles.cartItemCard}>
                    {item.thumbnail ? (
                      <img src={item.thumbnail} alt={item.title} className={styles.cartItemThumb} />
                    ) : (
                      <div className={styles.cartItemThumbFallback}>
                        <BookOpen size={20} color="#4f46e5" />
                      </div>
                    )}
                    <div className={styles.cartItemDetails}>
                      <span className={styles.cartItemCategoryPill}>{item.category_label || item.category || 'Course'}</span>
                      <h4 className={styles.cartItemTitle}>{item.title}</h4>
                      <div className={styles.cartItemMetaRow}>
                        <div className={styles.cartItemPriceBlock}>
                          <span className={styles.cartItemCurrentPrice}>₹{item.price}</span>
                          {item.original_price && item.original_price > item.price && (
                            <span className={styles.cartItemOriginalPrice}>₹{item.original_price}</span>
                          )}
                        </div>
                        {item.validity_days && (
                          <span className={styles.cartItemValidity}>
                            <Clock size={11} /> {item.validity_days} Days
                          </span>
                        )}
                      </div>
                    </div>
                    <button 
                      type="button" 
                      className={styles.removeItemBtn} 
                      onClick={() => removeFromCart(item.id)} 
                      title="Remove from cart"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))
              )}
            </div>

            {/* Cart Summary & Checkout Footer */}
            {cart.length > 0 && (
              <div className={styles.cartSummaryFooter}>
                {/* Coupon Code Input */}
                <form onSubmit={handleApplyCoupon} className={styles.cartCouponForm}>
                  <div className={styles.cartCouponInputWrap}>
                    <Tag size={15} color="#6366f1" className={styles.cartCouponIcon} />
                    <input 
                      type="text" 
                      placeholder="Enter Promo Code (e.g. EXCEL20)"
                      value={couponInput}
                      onChange={(e) => setCouponInput(e.target.value.toUpperCase())}
                    />
                  </div>
                  <button type="submit" className={styles.cartCouponApplyBtn} disabled={couponLoading}>
                    {couponLoading ? '...' : 'Apply'}
                  </button>
                </form>

                {couponError && (
                  <div className={styles.cartCouponError}>{couponError}</div>
                )}

                {appliedCoupon && (
                  <div className={styles.cartCouponSuccess}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                      <Check size={14} color="#16a34a" />
                      <span><strong>{appliedCoupon.code || appliedCoupon.coupon_code}</strong> applied ({appliedCoupon.message || 'Discount applied'})</span>
                    </div>
                    <X size={14} style={{ cursor: 'pointer' }} onClick={() => setAppliedCoupon(null)} title="Remove Coupon" />
                  </div>
                )}

                {/* Wallet Balance Deduction Widget */}
                <div className={`${styles.cartWalletBox} ${useWalletInCart && walletBalance > 0 ? styles.cartWalletActive : ''}`}>
                  <label className={styles.cartWalletLabel}>
                    <input 
                      type="checkbox" 
                      checked={useWalletInCart && walletBalance > 0} 
                      disabled={walletBalance <= 0}
                      onChange={(e) => setUseWalletInCart(e.target.checked)}
                    />
                    <Wallet size={16} color="#10b981" /> 
                    <span>Pay from Store Wallet <strong>(₹{walletBalance.toFixed(2)})</strong></span>
                  </label>
                  {walletBalance > 0 && useWalletInCart ? (
                    <span className={styles.cartWalletDiscountText}>
                      - ₹{Math.min(Math.max(0, cartSubtotal - discountAmount), walletBalance).toFixed(2)}
                    </span>
                  ) : (
                    <span className={styles.cartWalletHint}>
                      {walletBalance <= 0 ? 'No Balance' : 'Tick to apply'}
                    </span>
                  )}
                </div>

                {/* Price Breakdown */}
                <div className={styles.cartBillCard}>
                  <div className={styles.billRow}>
                    <span>Items Subtotal</span>
                    <span style={{ fontWeight: 600 }}>₹{cartSubtotal.toFixed(2)}</span>
                  </div>
                  {discountAmount > 0 && (
                    <div className={`${styles.billRow} ${styles.billDiscountRow}`}>
                      <span>Coupon Discount</span>
                      <span>- ₹{discountAmount.toFixed(2)}</span>
                    </div>
                  )}
                  {useWalletInCart && walletBalance > 0 && (
                    <div className={`${styles.billRow} ${styles.billWalletRow}`}>
                      <span>Wallet Balance Applied</span>
                      <span>- ₹{Math.min(Math.max(0, cartSubtotal - discountAmount), walletBalance).toFixed(2)}</span>
                    </div>
                  )}
                  <div className={`${styles.billRow} ${styles.billGrandTotal}`}>
                    <span>Total Amount to Pay</span>
                    <span className={styles.grandTotalValue}>
                      ₹{Math.max(0, (cartSubtotal - discountAmount) - (useWalletInCart ? Math.min(Math.max(0, cartSubtotal - discountAmount), walletBalance) : 0)).toFixed(2)}
                    </span>
                  </div>
                </div>

                {/* Checkout CTA */}
                <button 
                  type="button" 
                  className={styles.cartCheckoutBtn} 
                  onClick={() => { 
                    setIsCartOpen(false); 
                    setExchangeSource(null);
                    setSelectedExchangeProduct(null);
                    handleProcessPayment();
                  }}
                  disabled={isProcessingPayment}
                >
                  <ShieldCheck size={18} />
                  <span>
                    {isProcessingPayment 
                      ? 'Processing Order...' 
                      : (Math.max(0, (cartSubtotal - discountAmount) - (useWalletInCart ? Math.min(Math.max(0, cartSubtotal - discountAmount), walletBalance) : 0)) === 0 
                          ? '✨ Complete 100% Free Order' 
                          : `Proceed to Secure Payment (₹${Math.max(0, (cartSubtotal - discountAmount) - (useWalletInCart ? Math.min(Math.max(0, cartSubtotal - discountAmount), walletBalance) : 0)).toFixed(2)})`)}
                  </span>
                  <ArrowRight size={18} />
                </button>

                <div className={styles.secureBadgeFooter}>
                  <Lock size={12} color="#10b981" />
                  <span>256-Bit SSL Encrypted • Instant Access to Materials</span>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* PRODUCT EXCHANGE SUCCESS POPUP MODAL */}
      {exchangeSuccessData && (
        <div className={styles.modalOverlay} onClick={() => setExchangeSuccessData(null)}>
          <div 
            className={styles.paymentModal} 
            style={{ maxWidth: '540px', padding: 0, overflow: 'hidden', borderRadius: '1.25rem', border: '2px solid #22c55e', boxShadow: '0 20px 40px rgba(0,0,0,0.25)' }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div style={{ background: 'linear-gradient(135deg, #14532d 0%, #166534 100%)', color: '#ffffff', padding: '1.75rem 1.5rem', textAlign: 'center' }}>
              <div style={{ width: '60px', height: '60px', background: 'rgba(255,255,255,0.2)', borderRadius: '50%', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', marginBottom: '0.75rem', border: '2px solid rgba(255,255,255,0.4)' }}>
                <CheckCircle size={36} color="#4ade80" />
              </div>
              <h3 style={{ margin: '0 0 0.25rem 0', fontSize: '1.35rem', fontWeight: 900, color: '#ffffff' }}>
                Course Exchange Successful!
              </h3>
              <p style={{ margin: 0, fontSize: '0.85rem', color: '#bbf7d0' }}>
                Your study course has been swapped &amp; activated in your portal.
              </p>
            </div>

            {/* Modal Body: Comparison Card */}
            <div style={{ padding: '1.5rem' }}>
              <div style={{ background: '#f8fafc', border: '1.5px solid #e2e8f0', borderRadius: '0.85rem', padding: '1rem', marginBottom: '1.25rem' }}>
                
                {/* Old Returned Item */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '0.75rem', borderBottom: '1px dashed #cbd5e1' }}>
                  <div style={{ flex: 1, paddingRight: '0.5rem' }}>
                    <span style={{ fontSize: '0.7rem', color: '#dc2626', fontWeight: 800, textTransform: 'uppercase', display: 'block' }}>
                      ✖ Returned Course:
                    </span>
                    <strong style={{ fontSize: '0.925rem', color: '#475569', textDecoration: 'line-through' }}>
                      {exchangeSuccessData.old_product}
                    </strong>
                  </div>
                  <span style={{ fontSize: '0.9rem', color: '#64748b', fontWeight: 700 }}>
                    ₹{exchangeSuccessData.old_price.toFixed(2)}
                  </span>
                </div>

                {/* Swap Indicator */}
                <div style={{ textAlign: 'center', margin: '-10px 0', position: 'relative', zIndex: 2 }}>
                  <span style={{ background: '#4f46e5', color: '#fff', fontSize: '0.75rem', fontWeight: 800, padding: '3px 12px', borderRadius: '1rem', display: 'inline-flex', alignItems: 'center', gap: '4px', boxShadow: '0 2px 6px rgba(79, 70, 229, 0.3)' }}>
                    <RefreshCw size={11} /> Swapped With
                  </span>
                </div>

                {/* New Activated Item */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '0.75rem' }}>
                  <div style={{ flex: 1, paddingRight: '0.5rem' }}>
                    <span style={{ fontSize: '0.7rem', color: '#16a34a', fontWeight: 800, textTransform: 'uppercase', display: 'block' }}>
                      ✔ Activated New Course:
                    </span>
                    <strong style={{ fontSize: '1rem', color: '#0f172a' }}>
                      {exchangeSuccessData.new_product}
                    </strong>
                  </div>
                  <span style={{ fontSize: '1.05rem', color: '#16a34a', fontWeight: 800 }}>
                    ₹{exchangeSuccessData.new_price.toFixed(2)}
                  </span>
                </div>
              </div>

              {/* Settlement Summary */}
              {exchangeSuccessData.wallet_credited > 0 ? (
                <div style={{ background: '#f0fdf4', border: '1.5px solid #86efac', borderRadius: '0.75rem', padding: '0.85rem 1rem', display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.25rem' }}>
                  <div style={{ background: '#dcfce7', padding: '0.5rem', borderRadius: '0.5rem', display: 'flex' }}>
                    <Wallet size={24} color="#16a34a" />
                  </div>
                  <div>
                    <div style={{ fontWeight: 800, fontSize: '0.9rem', color: '#14532d' }}>
                      ₹{exchangeSuccessData.wallet_credited.toFixed(2)} Refunded to Store Wallet!
                    </div>
                    <div style={{ fontSize: '0.775rem', color: '#166534', marginTop: '2px' }}>
                      New Wallet Balance: <strong>₹{exchangeSuccessData.new_wallet_balance.toFixed(2)}</strong> (Available anytime).
                    </div>
                  </div>
                </div>
              ) : exchangeSuccessData.amount_paid > 0 ? (
                <div style={{ background: '#eff6ff', border: '1.5px solid #bfdbfe', borderRadius: '0.75rem', padding: '0.85rem 1rem', display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.25rem' }}>
                  <div style={{ background: '#dbeafe', padding: '0.5rem', borderRadius: '0.5rem', display: 'flex' }}>
                    <CreditCard size={24} color="#2563eb" />
                  </div>
                  <div>
                    <div style={{ fontWeight: 800, fontSize: '0.9rem', color: '#1e40af' }}>
                      ₹{exchangeSuccessData.amount_paid.toFixed(2)} Difference Paid
                    </div>
                    <div style={{ fontSize: '0.775rem', color: '#1d4ed8', marginTop: '2px' }}>
                      Payment Method: {exchangeSuccessData.payment_method}
                    </div>
                  </div>
                </div>
              ) : (
                <div style={{ background: '#f5f3ff', border: '1.5px solid #ddd6fe', borderRadius: '0.75rem', padding: '0.85rem 1rem', display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.25rem' }}>
                  <div style={{ background: '#ede9fe', padding: '0.5rem', borderRadius: '0.5rem', display: 'flex' }}>
                    <CheckCircle2 size={24} color="#7c3aed" />
                  </div>
                  <div style={{ fontSize: '0.85rem', color: '#5b21b6', fontWeight: 700 }}>
                    1:1 Free Direct Exchange (Exact Price Match)
                  </div>
                </div>
              )}

              {/* Action Button: Navigate directly to My Purchases */}
              <button
                className={styles.btnPrimary}
                style={{ width: '100%', padding: '0.85rem', fontSize: '1rem', fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', borderRadius: '0.65rem', background: '#16a34a', boxShadow: '0 4px 12px rgba(22, 163, 74, 0.3)' }}
                onClick={() => {
                  setExchangeSuccessData(null);
                  setViewMode('purchases');
                }}
              >
                Go to My Purchases &amp; Access Course <ChevronRight size={18} />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* INTERACTIVE PAYMENT DETAILS MODAL (CARD / UPI / NETBANKING) */}
      {isPaymentModalOpen && (
        <div className={styles.modalOverlay} onClick={() => !isProcessingPayment && setIsPaymentModalOpen(false)}>
          <div 
            className={styles.paymentModal} 
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div style={{ background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)', color: '#fff', padding: '1.25rem 1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '1.1rem', fontWeight: 800 }}>
                  <Lock size={18} color="#10b981" /> {exchangeSource && selectedExchangeProduct ? 'Exchange Difference Payment' : 'Secure Payment Gateway'}
                </div>
                <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '2px' }}>
                  {exchangeSource && selectedExchangeProduct ? `Upgrading: ${exchangeSource.title} ➔ ${selectedExchangeProduct.title}` : '256-Bit SSL Encrypted • Instant Direct Verification'}
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <span style={{ fontSize: '0.7rem', color: '#94a3b8', textTransform: 'uppercase', display: 'block', fontWeight: 700 }}>Total Payable</span>
                <span style={{ fontSize: '1.25rem', fontWeight: 800, color: '#38bdf8' }}>
                  ₹{(exchangeSource && selectedExchangeProduct
                    ? Math.max(0, (selectedExchangeProduct.price_diff || 0) - (useWalletInExchange ? Math.min(selectedExchangeProduct.price_diff || 0, walletBalance) : 0))
                    : Math.max(0, (cartSubtotal - discountAmount) - (useWalletInCart ? Math.min(Math.max(0, cartSubtotal - discountAmount), walletBalance) : 0))
                  ).toFixed(2)}
                </span>
              </div>
            </div>

            {/* Payment Method Selector Tabs */}
            <div style={{ display: 'flex', background: '#f8fafc', borderBottom: '1px solid #e2e8f0', padding: '0.5rem 1rem', gap: '0.5rem' }}>
              <button
                type="button"
                onClick={() => setPaymentTab('card')}
                style={{
                  flex: 1,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.35rem',
                  padding: '0.65rem 0.4rem',
                  borderRadius: '0.6rem',
                  fontSize: '0.8rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  background: paymentTab === 'card' ? '#4f46e5' : '#ffffff',
                  color: paymentTab === 'card' ? '#ffffff' : '#64748b',
                  boxShadow: paymentTab === 'card' ? '0 4px 12px rgba(79, 70, 229, 0.25)' : 'none',
                  border: paymentTab === 'card' ? 'none' : '1px solid #e2e8f0'
                }}
              >
                <CreditCard size={15} /> Card
              </button>

              <button
                type="button"
                onClick={() => setPaymentTab('upi')}
                style={{
                  flex: 1,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.35rem',
                  padding: '0.65rem 0.4rem',
                  borderRadius: '0.6rem',
                  fontSize: '0.8rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  background: paymentTab === 'upi' ? '#4f46e5' : '#ffffff',
                  color: paymentTab === 'upi' ? '#ffffff' : '#64748b',
                  boxShadow: paymentTab === 'upi' ? '0 4px 12px rgba(79, 70, 229, 0.25)' : 'none',
                  border: paymentTab === 'upi' ? 'none' : '1px solid #e2e8f0'
                }}
              >
                <Smartphone size={15} /> UPI / QR
              </button>

              <button
                type="button"
                onClick={() => setPaymentTab('netbanking')}
                style={{
                  flex: 1,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.35rem',
                  padding: '0.65rem 0.4rem',
                  borderRadius: '0.6rem',
                  fontSize: '0.8rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  background: paymentTab === 'netbanking' ? '#4f46e5' : '#ffffff',
                  color: paymentTab === 'netbanking' ? '#ffffff' : '#64748b',
                  boxShadow: paymentTab === 'netbanking' ? '0 4px 12px rgba(79, 70, 229, 0.25)' : 'none',
                  border: paymentTab === 'netbanking' ? 'none' : '1px solid #e2e8f0'
                }}
              >
                <Building size={15} /> Net Banking
              </button>

              <button
                type="button"
                onClick={() => {
                  setPaymentTab('wallet');
                  setUseWalletInCart(true);
                }}
                style={{
                  flex: 1,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.35rem',
                  padding: '0.65rem 0.4rem',
                  borderRadius: '0.6rem',
                  fontSize: '0.8rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  background: paymentTab === 'wallet' ? '#16a34a' : '#ffffff',
                  color: paymentTab === 'wallet' ? '#ffffff' : '#16a34a',
                  boxShadow: paymentTab === 'wallet' ? '0 4px 12px rgba(22, 163, 74, 0.25)' : 'none',
                  border: paymentTab === 'wallet' ? 'none' : '1px solid #86efac'
                }}
              >
                <Wallet size={15} /> Wallet (₹{walletBalance.toFixed(0)})
              </button>
            </div>

            {/* Modal Body */}
            <div style={{ padding: '1.5rem' }}>
              
              {/* TAB 1: CARD DETAILS */}
              {paymentTab === 'card' && (
                <div>
                  {/* Visual Credit Card Preview Graphic */}
                  <div style={{
                    background: 'linear-gradient(135deg, #1e1b4b 0%, #312e81 50%, #4338ca 100%)',
                    borderRadius: '1rem',
                    padding: '1.25rem 1.5rem',
                    color: '#ffffff',
                    marginBottom: '1.25rem',
                    boxShadow: '0 10px 25px -5px rgba(49, 46, 129, 0.4)',
                    position: 'relative',
                    overflow: 'hidden'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
                      <span style={{ fontSize: '0.75rem', fontWeight: 800, letterSpacing: '1px', color: '#c7d2fe', textTransform: 'uppercase' }}>XL EDUCATION PLATINUM</span>
                      <div style={{ display: 'flex', gap: '3px' }}>
                        <div style={{ width: '18px', height: '18px', borderRadius: '50%', background: '#ef4444', opacity: 0.9 }}></div>
                        <div style={{ width: '18px', height: '18px', borderRadius: '50%', background: '#f59e0b', opacity: 0.9, marginLeft: '-8px' }}></div>
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
                      <div style={{ width: '32px', height: '24px', background: '#fbbf24', borderRadius: '4px', border: '1px solid #d97706' }}></div>
                      <span style={{ fontSize: '0.65rem', color: '#a5b4fc', letterSpacing: '0.5px' }}>EMV SECURE CHIP</span>
                    </div>

                    <div style={{ fontSize: '1.2rem', fontFamily: 'monospace', letterSpacing: '2.5px', fontWeight: 700, marginBottom: '0.85rem' }}>
                      {cardData.number || '•••• •••• •••• ••••'}
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                      <div>
                        <span style={{ fontSize: '0.6rem', color: '#a5b4fc', textTransform: 'uppercase', display: 'block' }}>Cardholder Name</span>
                        <span style={{ fontSize: '0.85rem', fontWeight: 700, letterSpacing: '0.5px' }}>{(cardData.name || 'STUDENT NAME').toUpperCase()}</span>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <span style={{ fontSize: '0.6rem', color: '#a5b4fc', textTransform: 'uppercase', display: 'block' }}>Expires</span>
                        <span style={{ fontSize: '0.85rem', fontWeight: 700, fontFamily: 'monospace' }}>{cardData.expiry || 'MM/YY'}</span>
                      </div>
                    </div>
                  </div>

                  {/* Card Input Form */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                    <div>
                      <label style={{ fontSize: '0.75rem', fontWeight: 700, color: '#475569', display: 'block', marginBottom: '0.3rem' }}>
                        CARD NUMBER
                      </label>
                      <div style={{ position: 'relative' }}>
                        <input
                          type="text"
                          placeholder="4532 8921 7842 1092"
                          maxLength={19}
                          value={cardData.number}
                          onChange={(e) => {
                            const val = e.target.value.replace(/\D/g, '').slice(0, 16).replace(/(\d{4})(?=\d)/g, '$1 ');
                            setCardData({ ...cardData, number: val });
                          }}
                          style={{
                            width: '100%',
                            padding: '0.75rem 1rem 0.75rem 2.5rem',
                            borderRadius: '0.6rem',
                            border: '1.5px solid #cbd5e1',
                            fontSize: '0.95rem',
                            fontFamily: 'monospace',
                            outline: 'none',
                            boxSizing: 'border-box'
                          }}
                        />
                        <CreditCard size={18} color="#94a3b8" style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)' }} />
                      </div>
                    </div>

                    <div>
                      <label style={{ fontSize: '0.75rem', fontWeight: 700, color: '#475569', display: 'block', marginBottom: '0.3rem' }}>
                        CARDHOLDER NAME
                      </label>
                      <input
                        type="text"
                        placeholder="Name as printed on card"
                        value={cardData.name}
                        onChange={(e) => setCardData({ ...cardData, name: e.target.value.toUpperCase() })}
                        style={{
                          width: '100%',
                          padding: '0.75rem 1rem',
                          borderRadius: '0.6rem',
                          border: '1.5px solid #cbd5e1',
                          fontSize: '0.9rem',
                          outline: 'none',
                          boxSizing: 'border-box'
                        }}
                      />
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.85rem' }}>
                      <div>
                        <label style={{ fontSize: '0.75rem', fontWeight: 700, color: '#475569', display: 'block', marginBottom: '0.3rem' }}>
                          EXPIRY DATE
                        </label>
                        <input
                          type="text"
                          placeholder="MM/YY"
                          maxLength={5}
                          value={cardData.expiry}
                          onChange={(e) => {
                            const val = e.target.value.replace(/\D/g, '').slice(0, 4).replace(/(\d{2})(?=\d)/g, '$1/');
                            setCardData({ ...cardData, expiry: val });
                          }}
                          style={{
                            width: '100%',
                            padding: '0.75rem 1rem',
                            borderRadius: '0.6rem',
                            border: '1.5px solid #cbd5e1',
                            fontSize: '0.9rem',
                            fontFamily: 'monospace',
                            outline: 'none',
                            boxSizing: 'border-box'
                          }}
                        />
                      </div>

                      <div>
                        <label style={{ fontSize: '0.75rem', fontWeight: 700, color: '#475569', display: 'block', marginBottom: '0.3rem' }}>
                          CVV / CVC
                        </label>
                        <div style={{ position: 'relative' }}>
                          <input
                            type="password"
                            placeholder="•••"
                            maxLength={4}
                            value={cardData.cvv}
                            onChange={(e) => setCardData({ ...cardData, cvv: e.target.value.replace(/\D/g, '').slice(0, 4) })}
                            style={{
                              width: '100%',
                              padding: '0.75rem 1rem 0.75rem 2.5rem',
                              borderRadius: '0.6rem',
                              border: '1.5px solid #cbd5e1',
                              fontSize: '0.9rem',
                              fontFamily: 'monospace',
                              outline: 'none',
                              boxSizing: 'border-box'
                            }}
                          />
                          <Lock size={16} color="#94a3b8" style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)' }} />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 2: UPI / QR CODE */}
              {paymentTab === 'upi' && (
                <div>
                  <div style={{ background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: '0.85rem', padding: '1rem', marginBottom: '1.25rem', textAlign: 'center' }}>
                    <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#1e40af', textTransform: 'uppercase', display: 'block', marginBottom: '0.5rem' }}>
                      ⚡ Instant UPI Apps
                    </span>
                    <div style={{ display: 'flex', justifyContent: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                      {['Google Pay', 'PhonePe', 'Paytm', 'BHIM UPI'].map(app => (
                        <button
                          key={app}
                          type="button"
                          onClick={() => setUpiId(`student@${app.toLowerCase().replace(/\s/g, '')}`)}
                          style={{
                            background: '#ffffff',
                            border: '1px solid #cbd5e1',
                            borderRadius: '0.5rem',
                            padding: '0.4rem 0.75rem',
                            fontSize: '0.8rem',
                            fontWeight: 700,
                            color: '#334155',
                            cursor: 'pointer'
                          }}
                        >
                          {app}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label style={{ fontSize: '0.75rem', fontWeight: 700, color: '#475569', display: 'block', marginBottom: '0.3rem' }}>
                      ENTER VIRTUAL PAYMENT ADDRESS (VPA / UPI ID)
                    </label>
                    <div style={{ position: 'relative' }}>
                      <input
                        type="text"
                        placeholder="e.g. yourname@oksbi / mobile@upi"
                        value={upiId}
                        onChange={(e) => setUpiId(e.target.value)}
                        style={{
                          width: '100%',
                          padding: '0.75rem 1rem 0.75rem 2.5rem',
                          borderRadius: '0.6rem',
                          border: '1.5px solid #cbd5e1',
                          fontSize: '0.9rem',
                          outline: 'none',
                          boxSizing: 'border-box'
                        }}
                      />
                      <Smartphone size={18} color="#94a3b8" style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)' }} />
                    </div>
                    <span style={{ fontSize: '0.75rem', color: '#16a34a', fontWeight: 600, display: 'block', marginTop: '0.4rem' }}>
                      ✓ Verified UPI Handle Ready for Instant Payment
                    </span>
                  </div>
                </div>
              )}

              {/* TAB 3: NET BANKING */}
              {paymentTab === 'netbanking' && (
                <div>
                  <label style={{ fontSize: '0.75rem', fontWeight: 700, color: '#475569', display: 'block', marginBottom: '0.6rem' }}>
                    SELECT YOUR BANK
                  </label>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.6rem', marginBottom: '1rem' }}>
                    {['HDFC Bank', 'State Bank of India', 'ICICI Bank', 'Axis Bank', 'Kotak Mahindra', 'Punjab National Bank'].map(bank => (
                      <button
                        key={bank}
                        type="button"
                        onClick={() => setSelectedBank(bank)}
                        style={{
                          background: selectedBank === bank ? '#eff6ff' : '#ffffff',
                          border: `1.5px solid ${selectedBank === bank ? '#3b82f6' : '#cbd5e1'}`,
                          borderRadius: '0.6rem',
                          padding: '0.75rem 0.6rem',
                          fontSize: '0.85rem',
                          fontWeight: 700,
                          color: selectedBank === bank ? '#1d4ed8' : '#334155',
                          cursor: 'pointer',
                          textAlign: 'left',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.4rem'
                        }}
                      >
                        <Building size={16} color={selectedBank === bank ? '#2563eb' : '#64748b'} />
                        {bank}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* TAB 4: STORE WALLET */}
              {paymentTab === 'wallet' && (
                <div style={{ textAlign: 'center', padding: '1rem 0.5rem' }}>
                  <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: '#dcfce7', color: '#16a34a', margin: '0 auto 1rem auto', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 12px rgba(22, 163, 74, 0.2)' }}>
                    <Wallet size={34} />
                  </div>
                  <h4 style={{ margin: '0 0 0.35rem 0', fontSize: '1.15rem', color: '#0f172a', fontWeight: 800 }}>Store Wallet Payment</h4>
                  <p style={{ margin: '0 0 1.25rem 0', fontSize: '0.85rem', color: '#64748b' }}>
                    Pay directly using your available store credits &amp; exchange refunds.
                  </p>

                  <div style={{ background: '#f8fafc', border: '1.5px solid #e2e8f0', borderRadius: '0.85rem', padding: '1rem', maxWidth: '380px', margin: '0 auto 1.25rem auto' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', fontSize: '0.875rem' }}>
                      <span style={{ color: '#64748b' }}>Available Wallet Balance:</span>
                      <strong style={{ color: '#16a34a', fontSize: '1rem' }}>₹{walletBalance.toFixed(2)}</strong>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem', borderTop: '1px dashed #cbd5e1', paddingTop: '0.5rem' }}>
                      <span style={{ color: '#64748b' }}>Order Total:</span>
                      <strong style={{ color: '#0f172a', fontSize: '1rem' }}>
                        ₹{parseFloat(exchangeSource && selectedExchangeProduct ? selectedExchangeProduct.price_diff : (cartSubtotal - discountAmount)).toFixed(2)}
                      </strong>
                    </div>
                  </div>

                  {walletBalance < parseFloat(exchangeSource && selectedExchangeProduct ? selectedExchangeProduct.price_diff : (cartSubtotal - discountAmount)) ? (
                    <div style={{ background: '#fef3c7', color: '#b45309', padding: '0.75rem 1rem', borderRadius: '0.5rem', fontSize: '0.825rem', fontWeight: 700, marginBottom: '0.75rem', textAlign: 'left' }}>
                      ⚠️ Insufficient wallet balance! You have <strong>₹{walletBalance.toFixed(2)}</strong>. You can switch to the <strong>Card</strong> or <strong>UPI</strong> tab to pay the remaining balance.
                    </div>
                  ) : (
                    <div style={{ background: '#f0fdf4', color: '#15803d', padding: '0.75rem 1rem', borderRadius: '0.5rem', fontSize: '0.825rem', fontWeight: 700, marginBottom: '0.75rem' }}>
                      ✨ You have sufficient wallet balance to complete this purchase 100% instantly!
                    </div>
                  )}
                </div>
              )}

              {/* Order Security & Confirmation Strip */}
              {(() => {
                const activeModalAmount = (exchangeSource && selectedExchangeProduct)
                  ? Math.max(0, (selectedExchangeProduct.price_diff || 0) - (useWalletInExchange ? Math.min(selectedExchangeProduct.price_diff || 0, walletBalance) : 0))
                  : Math.max(0, (cartSubtotal - discountAmount) - (useWalletInCart ? Math.min(Math.max(0, cartSubtotal - discountAmount), walletBalance) : 0));

                return (
                  <>
                    <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '0.75rem', padding: '0.75rem 1rem', marginTop: '1.25rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.75rem', color: '#64748b' }}>
                        <ShieldCheck size={16} color="#16a34a" /> 100% Safe 256-Bit SSL Encrypted
                      </div>
                      <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#0f172a' }}>
                        Payable: <span style={{ color: '#059669', fontSize: '1rem' }}>₹{activeModalAmount.toFixed(2)}</span>
                      </div>
                    </div>

                    {/* Modal Buttons */}
                    <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.25rem' }}>
                      <button
                        type="button"
                        onClick={() => setIsPaymentModalOpen(false)}
                        disabled={isProcessingPayment}
                        style={{
                          flex: 1,
                          padding: '0.85rem',
                          borderRadius: '0.65rem',
                          border: '1.5px solid #cbd5e1',
                          background: '#ffffff',
                          color: '#475569',
                          fontWeight: 700,
                          cursor: 'pointer',
                          fontSize: '0.9rem'
                        }}
                      >
                        Cancel / Return
                      </button>
                      <button
                        type="button"
                        onClick={() => handleProcessPayment()}
                        disabled={isProcessingPayment}
                        style={{
                          flex: 2,
                          padding: '0.85rem',
                          borderRadius: '0.65rem',
                          border: 'none',
                          background: 'linear-gradient(135deg, #4f46e5 0%, #4338ca 100%)',
                          color: '#ffffff',
                          fontWeight: 800,
                          cursor: 'pointer',
                          fontSize: '0.95rem',
                          boxShadow: '0 4px 15px rgba(79, 70, 229, 0.35)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '0.5rem'
                        }}
                      >
                        {isProcessingPayment ? (
                          <>
                            <RefreshCw size={18} className="animate-spin" /> Verifying &amp; Processing...
                          </>
                        ) : (
                          <>
                            <Lock size={18} /> {exchangeSource && selectedExchangeProduct ? `Pay ₹${activeModalAmount.toFixed(2)} & Complete Exchange` : `Pay ₹${activeModalAmount.toFixed(2)} & Complete Order`}
                          </>
                        )}
                      </button>
                    </div>
                  </>
                );
              })()}

            </div>
          </div>
        </div>
      )}

      {/* OFFICIAL GST TAX INVOICE RECEIPT MODAL */}
      {isCheckoutOpen && orderReceipt && (
        <div className={styles.modalOverlay} onClick={() => setIsCheckoutOpen(false)}>
          <div className={styles.invoiceModal} onClick={(e) => e.stopPropagation()}>
            <div id="printable-tax-invoice" className={styles.printableInvoice}>
              
              {/* Invoice Header */}
              <div className={styles.invoiceHeader}>
                <div className={styles.invoiceBrand}>
                  <h2 style={{ margin: 0, color: '#4f46e5', fontSize: '1.35rem', fontWeight: 800 }}>XL EDUCATION PORTAL</h2>
                  <span style={{ fontSize: '0.75rem', color: '#64748b' }}>Authorized Academic Learning & Testing Solutions</span>
                  <div style={{ fontSize: '0.75rem', color: '#475569', marginTop: '4px' }}>
                    GSTIN: <strong>07AAAAA0000A1Z5</strong> | SAC: 999293 (Educational E-Services)
                  </div>
                </div>
                <div className={styles.invoiceMeta} style={{ textAlign: 'right' }}>
                  <span className={styles.paidStamp}>PAID ONLINE ✅</span>
                  <div style={{ fontSize: '0.8rem', color: '#334155', marginTop: '6px' }}>
                    <strong>INVOICE #:</strong> {orderReceipt.order_number}<br/>
                    <strong>DATE:</strong> {orderReceipt.purchased_at}<br/>
                    <strong>TXN REF:</strong> <code style={{ fontSize: '0.75rem', background: '#f1f5f9', padding: '1px 4px', borderRadius: '3px' }}>{orderReceipt.transaction_id}</code>
                  </div>
                </div>
              </div>

              <hr style={{ border: 'none', borderTop: '1px solid #e2e8f0', margin: '1rem 0' }} />

              {/* Bill To & Payment Info */}
              <div className={styles.billToGrid}>
                <div>
                  <span style={{ fontSize: '0.7rem', textTransform: 'uppercase', color: '#64748b', fontWeight: 700, letterSpacing: '0.5px' }}>BILLED TO (STUDENT):</span>
                  <div style={{ fontWeight: 700, fontSize: '0.95rem', color: '#0f172a', marginTop: '2px' }}>
                    {student?.name || 'Student Name'}
                  </div>
                  <div style={{ fontSize: '0.8rem', color: '#475569', lineHeight: 1.4 }}>
                    Roll / ID: <strong>{student?.['roll no'] || student?.roll_no || student?.login_id || 'N/A'}</strong><br/>
                    Department: {student?.department || 'Academic Studies'}<br/>
                    Email: {student?.['email adress'] || student?.email || 'N/A'}
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <span style={{ fontSize: '0.7rem', textTransform: 'uppercase', color: '#64748b', fontWeight: 700, letterSpacing: '0.5px' }}>PAYMENT METHOD:</span>
                  <div style={{ fontWeight: 700, fontSize: '0.9rem', color: '#16a34a', marginTop: '2px' }}>
                    {orderReceipt.payment_method || 'RAZORPAY GATEWAY'}
                  </div>
                  <div style={{ fontSize: '0.8rem', color: '#64748b' }}>
                    Status: <span style={{ color: '#16a34a', fontWeight: 700 }}>VERIFIED COMPLETED</span>
                  </div>
                </div>
              </div>

              {/* Line Items Table */}
              <table className={styles.invoiceTable}>
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Item Description</th>
                    <th>Access Period</th>
                    <th style={{ textAlign: 'right' }}>Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {(orderReceipt.items || []).length > 0 ? (
                    orderReceipt.items.map((item, idx) => (
                      <tr key={idx}>
                        <td>{idx + 1}</td>
                        <td>
                          <strong>{item.title}</strong>
                          <div style={{ fontSize: '0.75rem', color: '#64748b' }}>Category: {item.category}</div>
                        </td>
                        <td>{item.expires_at ? '365 Days Access' : 'Full Access'}</td>
                        <td style={{ textAlign: 'right' }}>₹{parseFloat(item.price || 0).toFixed(2)}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td>1</td>
                      <td>
                        <strong>Educational Course Package</strong>
                        <div style={{ fontSize: '0.75rem', color: '#64748b' }}>XL Store Product Access</div>
                      </td>
                      <td>365 Days Access</td>
                      <td style={{ textAlign: 'right' }}>₹{parseFloat(orderReceipt.final_amount || 0).toFixed(2)}</td>
                    </tr>
                  )}
                </tbody>
              </table>

              {/* Summary Calculation */}
              <div className={styles.invoiceSummary}>
                <div className={styles.summaryRow}>
                  <span style={{ color: '#64748b' }}>Subtotal:</span>
                  <span>₹{parseFloat(orderReceipt.final_amount || 0).toFixed(2)}</span>
                </div>
                <div className={styles.summaryRow} style={{ fontWeight: 800, fontSize: '1rem', color: '#16a34a', borderTop: '2px solid #e2e8f0', paddingTop: '6px' }}>
                  <span>Total Amount Paid:</span>
                  <span>₹{parseFloat(orderReceipt.final_amount || 0).toFixed(2)}</span>
                </div>
              </div>

              {/* Footer Authorization Stamp */}
              <div className={styles.invoiceFooterStamp}>
                <div style={{ fontSize: '0.75rem', color: '#64748b', maxWidth: '340px', lineHeight: 1.3 }}>
                  This is an official computer-generated Tax Invoice receipt verified via Razorpay Payment Gateway API. No signature required.
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontWeight: 800, fontSize: '0.85rem', color: '#0f172a' }}>XL EDUCATION</div>
                  <span style={{ fontSize: '0.725rem', color: '#64748b' }}>Authorized Finance Signatory</span>
                </div>
              </div>

            </div>

            {/* Action Buttons */}
            <div className={styles.invoiceActions}>
              <button className={styles.btnSecondary} onClick={() => { setIsCheckoutOpen(false); setOrderReceipt(null); }}>
                Close
              </button>
              <button 
                className={styles.btnPrimary} 
                style={{ background: '#4f46e5', display: 'flex', alignItems: 'center', gap: '6px' }} 
                onClick={() => printInvoice(orderReceipt, student)}
              >
                <Printer size={16} /> Download / Print PDF Invoice
              </button>
              <button 
                className={styles.btnPrimary} 
                style={{ background: '#16a34a', display: 'flex', alignItems: 'center', gap: '6px' }} 
                onClick={() => { setIsCheckoutOpen(false); setOrderReceipt(null); setViewMode('purchases'); }}
              >
                My Purchases <ArrowRight size={16} />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CUSTOM WEB IN-APP ALERT MODAL (NO LOCALHOST BROWSER POPUP) */}
      {customAlert && (
        <div className={styles.modalOverlay} onClick={() => setCustomAlert(null)} style={{ zIndex: 100000 }}>
          <div 
            className={styles.paymentModal} 
            style={{ 
              maxWidth: '440px', 
              padding: '1.75rem', 
              borderRadius: '1.25rem', 
              textAlign: 'center', 
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
              border: customAlert.type === 'warning' ? '2px solid #f59e0b' : (customAlert.type === 'error' ? '2px solid #ef4444' : '2px solid #3b82f6'),
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{
              width: '56px',
              height: '56px',
              borderRadius: '50%',
              margin: '0 auto 1rem auto',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: customAlert.type === 'warning' ? '#fef3c7' : (customAlert.type === 'error' ? '#fee2e2' : '#eff6ff'),
              color: customAlert.type === 'warning' ? '#d97706' : (customAlert.type === 'error' ? '#dc2626' : '#2563eb')
            }}>
              {customAlert.type === 'warning' ? <AlertCircle size={32} /> : (customAlert.type === 'error' ? <XCircle size={32} /> : <Info size={32} />)}
            </div>

            <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '1.25rem', fontWeight: 800, color: '#0f172a' }}>
              {customAlert.title}
            </h3>
            <p style={{ margin: '0 0 1.5rem 0', fontSize: '0.9rem', color: '#475569', lineHeight: 1.5 }}>
              {customAlert.message}
            </p>

            <button
              className={styles.btnPrimary}
              style={{
                width: '100%',
                padding: '0.75rem',
                fontSize: '0.95rem',
                fontWeight: 700,
                borderRadius: '0.65rem',
                background: customAlert.type === 'warning' ? '#d97706' : (customAlert.type === 'error' ? '#dc2626' : '#2563eb')
              }}
              onClick={() => setCustomAlert(null)}
            >
              Understood, Okay
            </button>
          </div>
        </div>
      )}

    </div>
  );
}
