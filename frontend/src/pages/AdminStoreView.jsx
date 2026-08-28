import React, { useState, useEffect } from 'react';
import { useToast } from '../contexts/ToastContext';
import { 
  ShoppingBag, 
  IndianRupee, 
  Receipt, 
  Plus, 
  Edit, 
  Trash2, 
  Search, 
  X, 
  CheckCircle2, 
  Star, 
  Clock, 
  FileText, 
  Award, 
  Video, 
  BookOpen,
  Upload,
  Download,
  Mail,
  Printer,
  Tag,
  Copy,
  Check,
  RotateCcw,
  RefreshCw,
  AlertTriangle,
  XCircle,
  Ban
} from 'lucide-react';
import styles from './AdminStoreView.module.css';

export default function AdminStoreView() {
  const toast = useToast();
  const [subTab, setSubTab] = useState('products'); // 'products' | 'orders' | 'coupons'
  
  const fileInputRef = React.useRef(null);
  const [uploadingImage, setUploadingImage] = useState(false);

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploadingImage(true);
    const formData = new FormData();
    formData.append('image', file);

    try {
      const res = await fetch('/api/admin/products/upload-thumbnail', {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();
      if (data.success) {
        setProductForm(prev => ({ ...prev, thumbnail: data.url }));
        toast.success('Thumbnail image uploaded successfully!');
      } else {
        toast.error(data.message || 'Upload failed');
      }
    } catch (err) {
      console.error(err);
      toast.error('Image upload error');
    }
    setUploadingImage(false);
  };

  /** Orders State */
  const [orders, setOrders] = useState([]);
  const [totalRevenue, setTotalRevenue] = useState(0);
  const [loadingOrders, setLoadingOrders] = useState(true);
  const [orderSearch, setOrderSearch] = useState('');
  const [dateFilter, setDateFilter] = useState('all'); // 'all' | 'today' | 'week' | 'month'
  const [paymentFilter, setPaymentFilter] = useState('all'); // 'all' | 'UPI' | 'CARD' | 'NETBANKING' | 'RAZORPAY'
  const [statusFilter, setStatusFilter] = useState('all'); // 'all' | 'completed' | 'pending' | 'failed' | 'cancelled'
  const [statusCounts, setStatusCounts] = useState({ completed: 0, pending: 0, failed: 0 });
  const [syncingOrders, setSyncingOrders] = useState(false);
  const [resendingId, setResendingId] = useState(null);
  const [selectedInvoiceOrder, setSelectedInvoiceOrder] = useState(null);

  /** Coupons State */
  const [coupons, setCoupons] = useState([]);
  const [loadingCoupons, setLoadingCoupons] = useState(false);
  const [copiedCoupon, setCopiedCoupon] = useState(null);

  /** Products State */
  const [products, setProducts] = useState([]);
  const [loadingProducts, setLoadingProducts] = useState(true);

  /** Modal State */
  const [showProductModal, setShowProductModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [savingProduct, setSavingProduct] = useState(false);

  const [productForm, setProductForm] = useState({
    title: '',
    category: 'Mock Interview',
    price: '',
    original_price: '',
    thumbnail: '',
    badge: 'Bestseller',
    validity_days: '365',
    rating: '4.85',
    short_description: '',
    description: '',
    features: ''
  });

  useEffect(() => {
    fetchOrders();
    fetchProducts();
    fetchCoupons();
  }, []);

  const fetchOrders = async () => {
    setLoadingOrders(true);
    try {
      const res = await fetch('/api/admin/orders');
      const data = await res.json();
      if (data.success) {
        setOrders(data.orders || []);
        setTotalRevenue(data.total_revenue || 0);
        setStatusCounts({
          completed: data.completed_count || 0,
          pending: data.pending_count || 0,
          failed: data.failed_count || 0,
        });
      }
    } catch (err) {
      console.error('Failed to fetch admin orders', err);
    }
    setLoadingOrders(false);
  };

  const handleSyncPendingOrders = async () => {
    setSyncingOrders(true);
    try {
      const res = await fetch('/api/admin/orders/sync-pending', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' }
      });
      const data = await res.json();
      if (data.success) {
        toast.success(data.message || 'Status refreshed successfully!');
        fetchOrders();
      } else {
        toast.error(data.message || 'Refresh failed');
      }
    } catch (err) {
      console.error(err);
      toast.error('Network error during status refresh');
    } finally {
      setSyncingOrders(false);
    }
  };

  const fetchProducts = async () => {
    setLoadingProducts(true);
    try {
      const res = await fetch('/api/products');
      const data = await res.json();
      if (data.success) {
        setProducts(data.products || []);
      }
    } catch (err) {
      console.error('Failed to fetch admin products', err);
    }
    setLoadingProducts(false);
  };

  const fetchCoupons = async () => {
    setLoadingCoupons(true);
    try {
      const res = await fetch('/api/admin/coupons');
      const data = await res.json();
      if (data.success) {
        setCoupons(data.coupons || []);
      }
    } catch (err) {
      console.error('Failed to fetch admin coupons', err);
    }
    setLoadingCoupons(false);
  };

  const handleCopyCoupon = (code) => {
    navigator.clipboard.writeText(code);
    setCopiedCoupon(code);
    toast.success(`Coupon code ${code} copied!`);
    setTimeout(() => setCopiedCoupon(null), 2000);
  };

  const handleResendInvoice = async (ord) => {
    setResendingId(ord.id);
    try {
      const res = await fetch(`/api/admin/orders/${ord.id}/resend-invoice`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' }
      });
      const data = await res.json();
      if (data.success) {
        toast.success(data.message || 'Invoice email resent successfully!');
      } else {
        toast.error(data.message || 'Failed to resend invoice');
      }
    } catch (err) {
      console.error(err);
      toast.error('Network error resending invoice');
    } finally {
      setResendingId(null);
    }
  };

  const exportOrdersToCSV = () => {
    if (!filteredOrders.length) {
      toast.error('No orders available to export.');
      return;
    }
    const headers = [
      'Order Number',
      'Transaction ID',
      'Student Name',
      'Roll No',
      'Department',
      'Purchased Items',
      'Payment Method',
      'Payment Status',
      'Coupon Code',
      'Total Amount (INR)',
      'Discount (INR)',
      'Final Amount (INR)',
      'Date & Time'
    ];

    const rows = filteredOrders.map(o => [
      `"${(o.order_number || '').replace(/"/g, '""')}"`,
      `"${(o.transaction_id || '').replace(/"/g, '""')}"`,
      `"${(o.student_name || '').replace(/"/g, '""')}"`,
      `"${(o.student_roll || '').replace(/"/g, '""')}"`,
      `"${(o.department || '').replace(/"/g, '""')}"`,
      `"${(o.items_summary || '').replace(/"/g, '""')}"`,
      `"${(o.payment_method || '').replace(/"/g, '""')}"`,
      `"${(o.payment_status || '').replace(/"/g, '""')}"`,
      `"${(o.coupon_code || '').replace(/"/g, '""')}"`,
      o.total_amount || 0,
      o.discount_amount || 0,
      o.final_amount || 0,
      `"${(o.created_at || '').replace(/"/g, '""')}"`,
    ]);

    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `XL_Sales_Report_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    toast.success(`Exported ${filteredOrders.length} orders to CSV successfully!`);
  };

  const printAdminInvoice = (ord) => {
    if (!ord) return;

    const subtotal = Number(ord.total_amount || ord.final_amount || 0);
    const discount = Number(ord.discount_amount || 0);
    const finalPaid = Number(ord.final_amount || 0);

    const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>Tax Invoice - ${ord.order_number || 'INVOICE'}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      font-size: 13px;
      color: #1e293b;
      background: #f8fafc;
      padding: 30px 20px;
    }
    .invoice-card {
      background: white;
      border: 1px solid #e2e8f0;
      border-radius: 12px;
      padding: 36px 40px;
      max-width: 800px;
      margin: 0 auto;
      box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05);
    }
    .header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      border-bottom: 2px solid #f1f5f9;
      padding-bottom: 20px;
      margin-bottom: 24px;
    }
    .brand-title {
      font-size: 22px;
      font-weight: 900;
      color: #4f46e5;
      letter-spacing: -0.5px;
      margin-bottom: 4px;
    }
    .brand-subtitle {
      font-size: 12px;
      color: #64748b;
      margin-bottom: 4px;
    }
    .brand-gstin {
      font-size: 11px;
      color: #334155;
      font-weight: 600;
    }
    .invoice-badge-block {
      text-align: right;
    }
    .paid-badge {
      display: inline-block;
      background: #dcfce7;
      color: #15803d;
      border: 1.5px solid #86efac;
      padding: 5px 14px;
      border-radius: 6px;
      font-weight: 800;
      font-size: 12px;
      letter-spacing: 0.5px;
      margin-bottom: 8px;
    }
    .invoice-meta {
      font-size: 11px;
      color: #475569;
      line-height: 1.6;
    }
    .invoice-meta strong {
      color: #0f172a;
    }
    .bill-section {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 20px;
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      padding: 16px 20px;
      margin-bottom: 24px;
    }
    .bill-title {
      font-size: 10px;
      text-transform: uppercase;
      font-weight: 800;
      color: #64748b;
      letter-spacing: 0.8px;
      margin-bottom: 6px;
    }
    .student-name {
      font-size: 15px;
      font-weight: 800;
      color: #0f172a;
      margin-bottom: 2px;
    }
    .student-detail {
      font-size: 12px;
      color: #475569;
      line-height: 1.5;
    }
    .pay-details {
      text-align: right;
      font-size: 12px;
      color: #475569;
      line-height: 1.6;
    }
    .pay-method-highlight {
      font-size: 12px;
      font-weight: 800;
      color: #16a34a;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 24px;
    }
    thead tr {
      background: #4f46e5;
      color: white;
    }
    thead th {
      padding: 10px 14px;
      font-size: 11px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      text-align: left;
    }
    tbody tr {
      border-bottom: 1px solid #e2e8f0;
    }
    tbody tr:nth-child(even) {
      background: #f8fafc;
    }
    tbody td {
      padding: 12px 14px;
      font-size: 12px;
      color: #334155;
    }
    .summary-block {
      display: flex;
      justify-content: flex-end;
      margin-bottom: 24px;
    }
    .summary-table {
      width: 300px;
    }
    .summary-row {
      display: flex;
      justify-content: space-between;
      padding: 6px 0;
      font-size: 12px;
      color: #475569;
    }
    .summary-total {
      border-top: 2px solid #cbd5e1;
      margin-top: 6px;
      padding-top: 10px;
      font-size: 15px;
      font-weight: 800;
      color: #0f172a;
    }
    .total-highlight {
      color: #16a34a;
      font-size: 16px;
    }
    .footer {
      border-top: 1px solid #e2e8f0;
      padding-top: 18px;
      display: flex;
      justify-content: space-between;
      align-items: flex-end;
    }
    .footer-disclaimer {
      font-size: 10px;
      color: #94a3b8;
      max-width: 440px;
      line-height: 1.5;
    }
    .sign-box {
      text-align: right;
    }
    .sign-name {
      font-size: 13px;
      font-weight: 800;
      color: #0f172a;
    }
    .sign-role {
      font-size: 11px;
      color: #64748b;
    }
    @media print {
      body { background: white; padding: 0; }
      .invoice-card { border: none; box-shadow: none; padding: 15px 0; max-width: 100%; }
      @page { margin: 12mm; size: A4 portrait; }
    }
  </style>
</head>
<body>
  <div class="invoice-card">
    <div class="header">
      <div>
        <div class="brand-title">XL EDUCATION PORTAL</div>
        <div class="brand-subtitle">Authorized Academic Learning & Digital Exam System</div>
        <div class="brand-gstin">GSTIN: 07AAAAA0000A1Z5 &nbsp;|&nbsp; SAC Code: 999293 (Educational E-Services)</div>
      </div>
      <div class="invoice-badge-block">
        <div class="paid-badge">✅ TAX INVOICE RECEIPT</div>
        <div class="invoice-meta">
          <div>Invoice #: <strong>${ord.order_number || 'N/A'}</strong></div>
          <div>Date: <strong>${ord.created_at || ''}</strong></div>
          <div>Txn ID: <strong>${ord.transaction_id || 'N/A'}</strong></div>
        </div>
      </div>
    </div>

    <div class="bill-section">
      <div>
        <div class="bill-title">BILLED TO (STUDENT)</div>
        <div class="student-name">${ord.student_name || 'Student'}</div>
        <div class="student-detail">
          Roll No: <strong>${ord.student_roll || 'N/A'}</strong><br/>
          Department: ${ord.department || 'Academic Department'}
        </div>
      </div>
      <div class="pay-details">
        <div class="bill-title">PAYMENT DETAILS</div>
        <div>Mode: <span class="pay-method-highlight">${ord.payment_method || 'RAZORPAY'}</span></div>
        <div>Status: <strong style="color: #16a34a;">PAID & COMPLETED</strong></div>
        <div>Gateway Ref: <code>${ord.transaction_id || 'Captured'}</code></div>
      </div>
    </div>

    <table>
      <thead>
        <tr>
          <th style="width: 40px;">#</th>
          <th>Item Description</th>
          <th style="text-align: center; width: 90px;">SAC</th>
          <th style="text-align: right; width: 140px;">Amount (INR)</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td>1</td>
          <td>
            <strong style="color: #0f172a;">${ord.items_summary || 'Educational Product / Course Package'}</strong>
            <div style="font-size: 11px; color: #64748b; margin-top: 2px;">Full Student Portal Learning Access</div>
          </td>
          <td style="text-align: center; color: #64748b;">999293</td>
          <td style="text-align: right; font-weight: 700;">₹${subtotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
        </tr>
      </tbody>
    </table>

    <div class="summary-block">
      <div class="summary-table">
        <div class="summary-row">
          <span>Subtotal:</span>
          <span>₹${subtotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
        </div>
        ${discount > 0 ? `
        <div class="summary-row" style="color: #16a34a; font-weight: 600;">
          <span>Coupon Discount ${ord.coupon_code ? `(${ord.coupon_code})` : ''}:</span>
          <span>-₹${discount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
        </div>` : ''}
        <div class="summary-row summary-total">
          <span>Total Amount Paid:</span>
          <span class="total-highlight">₹${finalPaid.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
        </div>
      </div>
    </div>

    <div class="footer">
      <div class="footer-disclaimer">
        This is an official computer-generated Tax Invoice receipt verified via Razorpay Payment Gateway API.<br/>
        No physical signature required under Indian IT Act, 2000.
      </div>
      <div class="sign-box">
        <div class="sign-name">XL EDUCATION</div>
        <div class="sign-role">Authorized Finance Signatory</div>
      </div>
    </div>
  </div>

  <script>
    window.onload = function() {
      setTimeout(function() {
        window.print();
      }, 350);
    };
  </script>
</body>
</html>`;

    const printWin = window.open('', '_blank', 'width=850,height=900');
    if (printWin) {
      printWin.document.write(html);
      printWin.document.close();
      printWin.focus();
    }
  };

  const openAddModal = () => {
    setEditingProduct(null);
    setProductForm({
      title: '',
      category: 'Mock Interview',
      price: '',
      original_price: '',
      thumbnail: '',
      badge: 'Bestseller',
      validity_days: '365',
      rating: '4.85',
      short_description: '',
      description: '',
      features: ''
    });
    setShowProductModal(true);
  };

  const openEditModal = (product) => {
    setEditingProduct(product);
    setProductForm({
      title: product.title || '',
      category: product.category ? product.category.replace('_', ' ') : 'Mock Interview',
      price: product.price || '',
      original_price: product.original_price || '',
      thumbnail: product.thumbnail || '',
      badge: product.badge || '',
      validity_days: product.validity_days || '365',
      rating: product.rating || '4.85',
      short_description: product.short_description || '',
      description: product.description || '',
      features: Array.isArray(product.features) ? product.features.join('\n') : (product.features || '')
    });
    setShowProductModal(true);
  };

  const handleProductSubmit = async (e) => {
    e.preventDefault();
    setSavingProduct(true);
    try {
      const url = editingProduct 
        ? `/api/admin/products/${editingProduct.id}/update` 
        : '/api/admin/products';

      const res = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify(productForm)
      });

      const data = await res.json();
      if (data.success) {
        toast.success(data.message);
        setShowProductModal(false);
        fetchProducts();
      } else {
        toast.error(data.message || 'Failed to save product');
      }
    } catch (err) {
      console.error(err);
      toast.error('Error saving product');
    }
    setSavingProduct(false);
  };

  const handleDeleteProduct = async (id) => {
    if (!window.confirm('Are you sure you want to delete this product?')) return;

    try {
      const res = await fetch(`/api/admin/products/${id}`, {
        method: 'DELETE'
      });
      const data = await res.json();
      if (data.success) {
        toast.success('Product deleted successfully');
        fetchProducts();
      }
    } catch (err) {
      console.error(err);
      toast.error('Error deleting product');
    }
  };

  const filteredOrders = (orders || []).filter(o => {
    if (!o) return false;
    const query = (orderSearch || '').toLowerCase();
    const orderNum = String(o.order_number || '').toLowerCase();
    const studentName = String(o.student_name || '').toLowerCase();
    const studentRoll = String(o.student_roll || '').toLowerCase();
    const itemsSummary = String(o.items_summary || '').toLowerCase();
    const txnId = String(o.transaction_id || '').toLowerCase();

    const matchesSearch = orderNum.includes(query) ||
           studentName.includes(query) ||
           studentRoll.includes(query) ||
           itemsSummary.includes(query) ||
           txnId.includes(query);

    if (!matchesSearch) return false;

    // Status filter
    if (statusFilter !== 'all') {
      if (String(o.payment_status || '').toLowerCase() !== statusFilter.toLowerCase()) {
        return false;
      }
    }

    // Payment method filter
    if (paymentFilter !== 'all') {
      if (o.payment_method?.toUpperCase() !== paymentFilter.toUpperCase()) {
        return false;
      }
    }

    // Date range filter
    if (dateFilter !== 'all' && o.created_at) {
      const orderDate = new Date(o.created_at);
      const now = new Date();
      if (!isNaN(orderDate)) {
        if (dateFilter === 'today') {
          if (orderDate.toDateString() !== now.toDateString()) return false;
        } else if (dateFilter === 'week') {
          const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          if (orderDate < sevenDaysAgo) return false;
        } else if (dateFilter === 'month') {
          const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
          if (orderDate < thirtyDaysAgo) return false;
        }
      }
    }

    return true;
  });

  const averageOrderValue = statusCounts.completed > 0 ? Math.round(totalRevenue / statusCounts.completed) : 0;

  return (
    <div className={styles.container}>
      
      {/* Metrics Widgets */}
      <div className={styles.statsGrid}>
        <div className={styles.statCard}>
          <div className={`${styles.statIcon} ${styles.iconRevenue}`}>
            <IndianRupee size={24} />
          </div>
          <div className={styles.statContent}>
            <h4>Verified Revenue</h4>
            <p className={styles.statValue}>₹{(totalRevenue || 0).toLocaleString()}</p>
          </div>
        </div>

        <div className={styles.statCard}>
          <div className={`${styles.statIcon} ${styles.iconOrders}`}>
            <Receipt size={24} />
          </div>
          <div className={styles.statContent}>
            <h4>Total Orders</h4>
            <p className={styles.statValue}>
              {(orders || []).length} 
              <span style={{ fontSize: '0.8rem', fontWeight: 600, color: '#16a34a', marginLeft: '6px' }}>
                ({statusCounts.completed} Paid)
              </span>
            </p>
          </div>
        </div>

        <div className={styles.statCard} style={{ background: statusCounts.pending > 0 ? '#fffbeb' : 'white', borderColor: statusCounts.pending > 0 ? '#fde68a' : '#e2e8f0' }}>
          <div className={`${styles.statIcon}`} style={{ background: statusCounts.pending > 0 ? '#fef3c7' : '#f1f5f9', color: statusCounts.pending > 0 ? '#d97706' : '#64748b' }}>
            {statusCounts.pending > 0 ? <AlertTriangle size={24} /> : <Clock size={24} />}
          </div>
          <div className={styles.statContent}>
            <h4>Pending / Incomplete</h4>
            <p className={styles.statValue} style={{ color: statusCounts.pending > 0 ? '#b45309' : '#0f172a' }}>
              {statusCounts.pending} Orders
            </p>
          </div>
        </div>

        <div className={styles.statCard}>
          <div className={`${styles.statIcon} ${styles.iconProducts}`}>
            <ShoppingBag size={24} />
          </div>
          <div className={styles.statContent}>
            <h4>Active Products</h4>
            <p className={styles.statValue}>{(products || []).length}</p>
          </div>
        </div>
      </div>

      {/* Sub Tabs & Action Header */}
      <div className={styles.tabHeader}>
        <div className={styles.subTabs}>
          <button 
            className={`${styles.subTabBtn} ${subTab === 'products' ? styles.subTabActive : ''}`}
            onClick={() => setSubTab('products')}
          >
            <ShoppingBag size={16} /> Products Catalog ({(products || []).length})
          </button>
          <button 
            className={`${styles.subTabBtn} ${subTab === 'orders' ? styles.subTabActive : ''}`}
            onClick={() => setSubTab('orders')}
          >
            <Receipt size={16} /> Sales & Orders ({(orders || []).length})
            {statusCounts.pending > 0 && (
              <span style={{ background: '#f59e0b', color: 'white', fontSize: '0.7rem', padding: '0.1rem 0.4rem', borderRadius: '1rem', marginLeft: '4px' }}>
                {statusCounts.pending}
              </span>
            )}
          </button>
          <button 
            className={`${styles.subTabBtn} ${subTab === 'coupons' ? styles.subTabActive : ''}`}
            onClick={() => setSubTab('coupons')}
          >
            <Tag size={16} /> Discount Coupons ({(coupons || []).length})
          </button>
        </div>

        {subTab === 'products' ? (
          <button className={styles.addProductBtn} onClick={openAddModal}>
            <Plus size={16} /> Add New Product
          </button>
        ) : subTab === 'orders' ? (
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button 
              className={styles.syncBtn} 
              onClick={handleSyncPendingOrders} 
              disabled={syncingOrders}
              title="Refresh payment status"
            >
              <RefreshCw size={15} className={syncingOrders ? styles.spin : ''} /> 
              {syncingOrders ? 'Refreshing...' : 'Refresh Status'}
            </button>
          </div>
        ) : null}
      </div>

      {/* SUB TAB 1: ORDERS & SALES LEDGER */}
      {subTab === 'orders' && (
        <div className={styles.tableCard}>
          {/* Enhanced Filter Bar */}
          <div className={styles.filterBar}>
            <div className={styles.filterControls}>
              <div className={styles.searchBox}>
                <Search size={15} color="#64748b" />
                <input 
                  type="text" 
                  placeholder="Search order ID, student name, roll no..."
                  value={orderSearch}
                  onChange={(e) => setOrderSearch(e.target.value)}
                />
              </div>

              <select 
                className={styles.filterSelect}
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="all">⚡ All Statuses</option>
                <option value="completed">✓ Completed / Paid ({statusCounts.completed})</option>
                <option value="pending">⏳ Pending Payment ({statusCounts.pending})</option>
                <option value="failed">✗ Failed / Dropped ({statusCounts.failed})</option>
                <option value="cancelled">⊘ Cancelled</option>
              </select>

              <select 
                className={styles.filterSelect}
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
              >
                <option value="all">📅 All Dates</option>
                <option value="today">Today's Sales</option>
                <option value="week">Last 7 Days</option>
                <option value="month">This Month</option>
              </select>

              <select 
                className={styles.filterSelect}
                value={paymentFilter}
                onChange={(e) => setPaymentFilter(e.target.value)}
              >
                <option value="all">💳 All Payments</option>
                <option value="UPI">UPI Payments</option>
                <option value="CARD">Card Payments</option>
                <option value="NETBANKING">NetBanking</option>
                <option value="RAZORPAY">Razorpay Gateway</option>
              </select>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <span style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 600 }}>
                Showing {filteredOrders.length} of {orders.length} orders
              </span>
              <button className={styles.exportBtn} onClick={exportOrdersToCSV} title="Export CSV Spreadsheet">
                <Download size={15} /> Export CSV
              </button>
            </div>
          </div>

          <div className={styles.tableWrapper}>
            <table className={styles.ordersTable}>
              <thead>
                <tr>
                  <th>Order #</th>
                  <th>Student Info</th>
                  <th>Purchased Items</th>
                  <th>Payment Method</th>
                  <th>Payment Status</th>
                  <th>Total Amount</th>
                  <th>Date & Time</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {loadingOrders ? (
                  <tr>
                    <td colSpan="8" style={{ textAlign: 'center', padding: '2rem' }}>Loading sales transactions...</td>
                  </tr>
                ) : filteredOrders.length === 0 ? (
                  <tr>
                    <td colSpan="8" style={{ textAlign: 'center', padding: '2.5rem', color: '#64748b' }}>
                      <FileText size={32} style={{ margin: '0 auto 0.5rem auto', display: 'block', opacity: 0.5 }} />
                      No matching sales orders found.
                    </td>
                  </tr>
                ) : (
                  filteredOrders.map(ord => (
                    <tr key={ord.id} style={{ background: ord.payment_status === 'pending' ? '#fffdf5' : 'inherit' }}>
                      <td>
                        <strong style={{ color: '#4f46e5', cursor: 'pointer' }} onClick={() => setSelectedInvoiceOrder(ord)}>
                          {ord.order_number}
                        </strong>
                        <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Txn: {ord.transaction_id || 'N/A'}</div>
                      </td>
                      <td>
                        <strong>{ord.student_name}</strong>
                        <div style={{ fontSize: '0.75rem', color: '#64748b' }}>Roll: {ord.student_roll} ({ord.department})</div>
                      </td>
                      <td>
                        <div style={{ maxWidth: '240px', fontSize: '0.8rem', color: '#334155' }}>
                          {ord.items_summary}
                        </div>
                      </td>
                      <td>
                        <span className={styles.methodBadge}>{ord.payment_method}</span>
                      </td>
                      <td>
                        {ord.payment_status === 'completed' && (
                          <span className={styles.statusCompleted}>
                            <CheckCircle2 size={12} /> Completed
                          </span>
                        )}
                        {ord.payment_status === 'pending' && (
                          <span className={styles.statusPending}>
                            <Clock size={12} /> Pending
                          </span>
                        )}
                        {ord.payment_status === 'failed' && (
                          <span className={styles.statusFailed}>
                            <XCircle size={12} /> Failed
                          </span>
                        )}
                        {ord.payment_status === 'cancelled' && (
                          <span className={styles.statusCancelled}>
                            <Ban size={12} /> Cancelled
                          </span>
                        )}
                      </td>
                      <td>
                        <strong style={{ color: ord.payment_status === 'completed' ? '#16a34a' : '#64748b' }}>
                          ₹{ord.final_amount}
                        </strong>
                        {ord.discount_amount > 0 && (
                          <div style={{ fontSize: '0.7rem', color: '#f97316' }}>Disc: -₹{ord.discount_amount}</div>
                        )}
                      </td>
                      <td>{ord.created_at}</td>
                      <td style={{ textAlign: 'right' }}>
                        <div className={styles.rowActions}>
                          {ord.payment_status === 'completed' ? (
                            <>
                              <button 
                                className={styles.invoiceBtn} 
                                onClick={() => setSelectedInvoiceOrder(ord)}
                                title="View / Print Tax Invoice"
                              >
                                <Printer size={13} /> Invoice
                              </button>
                              <button 
                                className={styles.resendBtn} 
                                onClick={() => handleResendInvoice(ord)}
                                disabled={resendingId === ord.id}
                                title="Resend confirmation & invoice email"
                              >
                                <Mail size={13} /> {resendingId === ord.id ? 'Sending...' : 'Resend'}
                              </button>
                            </>
                          ) : (
                            <span style={{ color: '#94a3b8', fontSize: '0.9rem', fontWeight: 600, paddingRight: '0.75rem' }}>—</span>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* SUB TAB 3: DISCOUNT COUPONS MANAGEMENT */}
      {subTab === 'coupons' && (
        <div>
          <div style={{ marginBottom: '1.25rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <h3 style={{ margin: 0, fontSize: '1.1rem', color: '#0f172a' }}>Active Discount Coupons</h3>
              <p style={{ margin: '0.2rem 0 0 0', fontSize: '0.8rem', color: '#64748b' }}>
                Students can apply these promo codes during checkout on the Student Store portal.
              </p>
            </div>
            <button className={styles.exportBtn} onClick={fetchCoupons}>
              <RotateCcw size={14} /> Refresh Coupons
            </button>
          </div>

          {loadingCoupons ? (
            <div style={{ textAlign: 'center', padding: '3rem' }}>Loading discount coupons...</div>
          ) : (
            <div className={styles.couponsGrid}>
              {coupons.map((c, idx) => (
                <div key={idx} className={styles.couponCard}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                      <span className={styles.couponCodeBadge}>
                        <Tag size={13} /> {c.code}
                      </span>
                      <button 
                        onClick={() => handleCopyCoupon(c.code)}
                        style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#64748b', padding: '4px' }}
                        title="Copy Code"
                      >
                        {copiedCoupon === c.code ? <Check size={16} color="#16a34a" /> : <Copy size={16} />}
                      </button>
                    </div>
                    <h4 style={{ margin: '0 0 0.35rem 0', fontSize: '0.95rem', color: '#1e293b' }}>{c.label}</h4>
                    <p style={{ margin: 0, fontSize: '0.8rem', color: '#64748b' }}>
                      {c.type === 'percent' ? `${c.value}% Discount applied on total cart` : `Flat ₹${c.value} direct discount`}
                    </p>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: '1px solid #f1f5f9', paddingTop: '0.75rem' }}>
                    <span className={styles.couponDiscountValue}>
                      {c.type === 'percent' ? `${c.value}% OFF` : `₹${c.value} OFF`}
                    </span>
                    <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#16a34a', background: '#dcfce7', padding: '0.2rem 0.6rem', borderRadius: '1rem' }}>
                      ACTIVE
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* SUB TAB 2: PRODUCTS CATALOG MANAGEMENT */}
      {subTab === 'products' && (
        <div>
          {loadingProducts ? (
            <div style={{ textAlign: 'center', padding: '3rem' }}>Loading store catalog...</div>
          ) : (
            <div className={styles.catalogGrid}>
              {products.map(prod => (
                <div key={prod.id} className={styles.productAdminCard}>
                  <div>
                    {prod.thumbnail && (
                      <div style={{ height: '140px', margin: '-1.25rem -1.25rem 0.85rem -1.25rem', borderRadius: '0.85rem 0.85rem 0 0', overflow: 'hidden', borderBottom: '1px solid #e2e8f0' }}>
                        <img src={prod.thumbnail} alt={prod.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      </div>
                    )}
                    <div className={styles.productMeta}>
                      <span style={{ fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', background: '#e0e7ff', color: '#3730a3', padding: '0.15rem 0.5rem', borderRadius: '0.3rem' }}>
                        {prod.category?.replace('_', ' ')}
                      </span>
                      {prod.badge && (
                        <span style={{ fontSize: '0.7rem', fontWeight: 700, background: '#ffedd5', color: '#c2410c', padding: '0.15rem 0.5rem', borderRadius: '0.3rem' }}>
                          {prod.badge}
                        </span>
                      )}
                    </div>
                    <h3 style={{ margin: '0 0 0.4rem 0', fontSize: '1rem', color: '#0f172a' }}>{prod.title}</h3>
                    <p style={{ margin: '0 0 0.75rem 0', fontSize: '0.8rem', color: '#64748b', lineHeight: 1.4 }}>
                      {prod.short_description}
                    </p>
                    <div style={{ fontSize: '1.2rem', fontWeight: 800, color: '#0f172a' }}>
                      ₹{prod.price} {prod.original_price && <span style={{ fontSize: '0.8rem', color: '#94a3b8', textDecoration: 'line-through', fontWeight: 400 }}>₹{prod.original_price}</span>}
                    </div>
                  </div>

                  <div className={styles.cardActions}>
                    <button className={styles.editBtn} onClick={() => openEditModal(prod)}>
                      <Edit size={14} /> Edit Product
                    </button>
                    <button className={styles.deleteBtn} onClick={() => handleDeleteProduct(prod.id)}>
                      <Trash2 size={14} /> Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* CREATE / EDIT PRODUCT MODAL */}
      {showProductModal && (
        <div className={styles.modalOverlay} onClick={() => setShowProductModal(false)}>
          <div className={styles.productModal} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid #e2e8f0', paddingBottom: '0.75rem' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.15rem' }}>
                  {editingProduct ? `Edit Product (ID: #${editingProduct.id})` : 'Add New Product to Store'}
                </h3>
                {editingProduct && (
                  <span style={{ fontSize: '0.75rem', color: '#64748b' }}>Product Identifier: <code>ID #{editingProduct.id}</code></span>
                )}
              </div>
              <X size={18} style={{ cursor: 'pointer' }} onClick={() => setShowProductModal(false)} />
            </div>

            <form onSubmit={handleProductSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              
              {/* Product ID & Title Input Grid */}
              <div className={styles.formGrid}>
                <div className={styles.formGroup}>
                  <label>PRODUCT ID {editingProduct ? '(Auto System ID)' : '(Code)'}</label>
                  <input 
                    type="text" 
                    value={editingProduct ? `#${editingProduct.id}` : 'Auto-Generated on Save'} 
                    disabled 
                    readOnly
                    style={{ backgroundColor: '#f1f5f9', color: '#64748b', cursor: 'not-allowed', fontWeight: 700, fontFamily: 'monospace' }}
                  />
                </div>
                <div className={styles.formGroup}>
                  <label>PRODUCT TITLE *</label>
                  <input 
                    type="text" 
                    value={productForm.title} 
                    onChange={e => setProductForm({ ...productForm, title: e.target.value })}
                    placeholder="e.g. FAANG 1-on-1 Mock Interview"
                    required 
                  />
                </div>
              </div>

              <div className={styles.formGrid}>
                <div className={styles.formGroup}>
                  <label>CATEGORY *</label>
                  <select 
                    value={productForm.category}
                    onChange={e => setProductForm({ ...productForm, category: e.target.value })}
                  >
                    <option value="Mock Interview">Mock Interview</option>
                    <option value="Test Series">Test Series</option>
                    <option value="Course">Video Course</option>
                    <option value="eBook">eBook / Material</option>
                  </select>
                </div>

                <div className={styles.formGroup}>
                  <label>BADGE / TAG</label>
                  <input 
                    type="text" 
                    value={productForm.badge} 
                    onChange={e => setProductForm({ ...productForm, badge: e.target.value })}
                    placeholder="e.g. Bestseller, Hot, Popular" 
                  />
                </div>
              </div>

              {/* Thumbnail Image File Upload / URL Input */}
              <div className={styles.formGroup}>
                <label>PRODUCT THUMBNAIL IMAGE (Upload File or Enter URL)</label>
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  onChange={handleFileUpload} 
                  style={{ display: 'none' }} 
                  accept="image/*" 
                />
                <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem' }}>
                  <button 
                    type="button"
                    className={styles.addProductBtn}
                    style={{ background: '#4f46e5', padding: '0.45rem 0.85rem', fontSize: '0.82rem', flexShrink: 0 }}
                    onClick={() => fileInputRef.current && fileInputRef.current.click()}
                    disabled={uploadingImage}
                  >
                    <Upload size={14} /> {uploadingImage ? 'Uploading File...' : 'Upload Image File'}
                  </button>
                  <input 
                    type="text" 
                    value={productForm.thumbnail} 
                    onChange={e => setProductForm({ ...productForm, thumbnail: e.target.value })}
                    placeholder="Or paste image URL (https://...)" 
                    style={{ flex: 1 }}
                  />
                </div>
                {productForm.thumbnail && (
                  <div style={{ marginTop: '0.4rem', height: '120px', borderRadius: '0.5rem', overflow: 'hidden', border: '1px solid #cbd5e1', position: 'relative' }}>
                    <img src={productForm.thumbnail} alt="Thumbnail Preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    <button 
                      type="button" 
                      onClick={() => setProductForm({ ...productForm, thumbnail: '' })}
                      style={{ position: 'absolute', top: '6px', right: '6px', background: 'rgba(0,0,0,0.6)', color: 'white', border: 'none', borderRadius: '50%', padding: '4px', cursor: 'pointer', display: 'flex' }}
                    >
                      <X size={14} />
                    </button>
                  </div>
                )}
              </div>

              <div className={styles.formGrid}>
                <div className={styles.formGroup}>
                  <label>DISCOUNTED PRICE (₹) *</label>
                  <input 
                    type="number" 
                    value={productForm.price} 
                    onChange={e => setProductForm({ ...productForm, price: e.target.value })}
                    placeholder="e.g. 999"
                    required 
                  />
                </div>

                <div className={styles.formGroup}>
                  <label>ORIGINAL MRP (₹)</label>
                  <input 
                    type="number" 
                    value={productForm.original_price} 
                    onChange={e => setProductForm({ ...productForm, original_price: e.target.value })}
                    placeholder="e.g. 2499" 
                  />
                </div>
              </div>

              <div className={styles.formGrid}>
                <div className={styles.formGroup}>
                  <label>VALIDITY (DAYS)</label>
                  <input 
                    type="number" 
                    value={productForm.validity_days} 
                    onChange={e => setProductForm({ ...productForm, validity_days: e.target.value })}
                    placeholder="365" 
                  />
                </div>

                <div className={styles.formGroup}>
                  <label>STAR RATING</label>
                  <input 
                    type="text" 
                    value={productForm.rating} 
                    onChange={e => setProductForm({ ...productForm, rating: e.target.value })}
                    placeholder="4.85" 
                  />
                </div>
              </div>

              <div className={styles.formGroup}>
                <label>SHORT DESCRIPTION *</label>
                <input 
                  type="text" 
                  value={productForm.short_description} 
                  onChange={e => setProductForm({ ...productForm, short_description: e.target.value })}
                  placeholder="Short 1-line overview preview"
                  required 
                />
              </div>

              <div className={styles.formGroup}>
                <label>KEY FEATURES (1 feature per line)</label>
                <textarea 
                  rows="4" 
                  value={productForm.features} 
                  onChange={e => setProductForm({ ...productForm, features: e.target.value })}
                  placeholder="60 Mins 1-on-1 Video Session&#10;Detailed Performance Analysis&#10;Resume Review"
                />
              </div>

              <button 
                type="submit" 
                className={styles.addProductBtn} 
                disabled={savingProduct} 
                style={{ width: '100%', justifyContent: 'center', padding: '0.8rem', marginTop: '0.5rem' }}
              >
                {savingProduct ? 'Saving...' : (editingProduct ? 'Update Product' : 'Create Product')}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* OFFICIAL GST TAX INVOICE MODAL (VIEW & PRINT) */}
      {selectedInvoiceOrder && (
        <div className={styles.modalOverlay} onClick={() => setSelectedInvoiceOrder(null)}>
          <div className={styles.invoiceModal} onClick={(e) => e.stopPropagation()}>
            
            {/* Header with Print & Close buttons */}
            <div className={styles.invoiceHeader}>
              <div>
                <span style={{ background: '#e0e7ff', color: '#3730a3', fontSize: '0.75rem', fontWeight: 800, padding: '0.2rem 0.6rem', borderRadius: '0.3rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  Official Tax Invoice
                </span>
                <h2 style={{ margin: '0.4rem 0 0 0', fontSize: '1.4rem', color: '#0f172a' }}>
                  XL EDUCATION PORTAL
                </h2>
                <p style={{ margin: '0.15rem 0 0 0', fontSize: '0.8rem', color: '#64748b' }}>
                  GSTIN: 07AAAAA0000A1Z5 &bull; SAC: 999293 (Educational Support Services)
                </p>
              </div>

              <div className={styles.invoiceActions}>
                <button 
                  className={styles.printBtn} 
                  onClick={() => printAdminInvoice(selectedInvoiceOrder)}
                  title="Print or Save as PDF"
                >
                  <Printer size={15} /> Print / Save PDF
                </button>
                <button 
                  onClick={() => setSelectedInvoiceOrder(null)}
                  style={{ background: '#f1f5f9', border: 'none', borderRadius: '0.4rem', padding: '0.5rem', cursor: 'pointer', display: 'flex', color: '#64748b' }}
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            {/* Invoice Meta Details Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', background: '#f8fafc', padding: '1rem 1.25rem', borderRadius: '0.75rem', border: '1px solid #e2e8f0' }}>
              <div>
                <span style={{ fontSize: '0.7rem', color: '#64748b', textTransform: 'uppercase', fontWeight: 700 }}>BILLED TO</span>
                <h4 style={{ margin: '0.25rem 0 0 0', fontSize: '1rem', color: '#0f172a' }}>{selectedInvoiceOrder.student_name}</h4>
                <p style={{ margin: '0.15rem 0 0 0', fontSize: '0.8rem', color: '#475569' }}>
                  Roll No: <strong>{selectedInvoiceOrder.student_roll}</strong>
                </p>
                <p style={{ margin: '0.1rem 0 0 0', fontSize: '0.8rem', color: '#475569' }}>
                  Department: {selectedInvoiceOrder.department}
                </p>
              </div>

              <div style={{ textAlign: 'right' }}>
                <span style={{ fontSize: '0.7rem', color: '#64748b', textTransform: 'uppercase', fontWeight: 700 }}>INVOICE DETAILS</span>
                <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.85rem', color: '#0f172a' }}>
                  Invoice No: <strong style={{ color: '#4f46e5' }}>{selectedInvoiceOrder.order_number}</strong>
                </p>
                <p style={{ margin: '0.15rem 0 0 0', fontSize: '0.8rem', color: '#475569' }}>
                  Txn ID: {selectedInvoiceOrder.transaction_id || 'N/A'}
                </p>
                <p style={{ margin: '0.15rem 0 0 0', fontSize: '0.8rem', color: '#475569' }}>
                  Date: {selectedInvoiceOrder.created_at}
                </p>
                <p style={{ margin: '0.15rem 0 0 0', fontSize: '0.8rem', color: '#16a34a', fontWeight: 700 }}>
                  Status: COMPLETED ({selectedInvoiceOrder.payment_method})
                </p>
              </div>
            </div>

            {/* Line Items Table */}
            <div>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                <thead>
                  <tr style={{ background: '#f1f5f9', borderBottom: '2px solid #cbd5e1' }}>
                    <th style={{ padding: '0.65rem 0.85rem', textAlign: 'left', color: '#334155' }}>#</th>
                    <th style={{ padding: '0.65rem 0.85rem', textAlign: 'left', color: '#334155' }}>Item Description</th>
                    <th style={{ padding: '0.65rem 0.85rem', textAlign: 'center', color: '#334155' }}>SAC</th>
                    <th style={{ padding: '0.65rem 0.85rem', textAlign: 'right', color: '#334155' }}>Amount (INR)</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td style={{ padding: '0.75rem 0.85rem', borderBottom: '1px solid #e2e8f0' }}>1</td>
                    <td style={{ padding: '0.75rem 0.85rem', borderBottom: '1px solid #e2e8f0' }}>
                      <strong>{selectedInvoiceOrder.items_summary}</strong>
                    </td>
                    <td style={{ padding: '0.75rem 0.85rem', borderBottom: '1px solid #e2e8f0', textAlign: 'center', color: '#64748b' }}>
                      999293
                    </td>
                    <td style={{ padding: '0.75rem 0.85rem', borderBottom: '1px solid #e2e8f0', textAlign: 'right', fontWeight: 700 }}>
                      ₹{Number(selectedInvoiceOrder.total_amount || selectedInvoiceOrder.final_amount).toLocaleString()}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Summary Breakdown */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', borderTop: '2px solid #e2e8f0', paddingTop: '0.85rem' }}>
              <div style={{ width: '260px', display: 'flex', flexDirection: 'column', gap: '0.4rem', fontSize: '0.85rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', color: '#64748b' }}>
                  <span>Subtotal:</span>
                  <span>₹{Number(selectedInvoiceOrder.total_amount || selectedInvoiceOrder.final_amount).toLocaleString()}</span>
                </div>
                {selectedInvoiceOrder.discount_amount > 0 && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', color: '#16a34a' }}>
                    <span>Coupon Discount {selectedInvoiceOrder.coupon_code ? `(${selectedInvoiceOrder.coupon_code})` : ''}:</span>
                    <span>-₹{Number(selectedInvoiceOrder.discount_amount).toLocaleString()}</span>
                  </div>
                )}
                <div style={{ display: 'flex', justifyContent: 'space-between', color: '#0f172a', fontWeight: 800, fontSize: '1.1rem', borderTop: '1px solid #cbd5e1', paddingTop: '0.5rem' }}>
                  <span>Net Total Paid:</span>
                  <span style={{ color: '#16a34a' }}>₹{Number(selectedInvoiceOrder.final_amount).toLocaleString()}</span>
                </div>
              </div>
            </div>

            {/* Authorization Footer */}
            <div style={{ borderTop: '1px solid #f1f5f9', paddingTop: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
              <p style={{ margin: 0, fontSize: '0.75rem', color: '#94a3b8', maxWidth: '340px' }}>
                This is a computer-generated invoice and requires no physical signature under Indian Information Technology Act, 2000.
              </p>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '0.75rem', fontWeight: 800, color: '#334155' }}>XL EDUCATION</div>
                <div style={{ fontSize: '0.7rem', color: '#64748b' }}>Authorized Signatory</div>
              </div>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
