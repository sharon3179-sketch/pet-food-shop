import React, { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import EditOrderModal from './EditOrderModal'

function fmt(n) { return Number(n || 0).toLocaleString('he-IL', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) }
function fmtDate(d) { return new Date(d).toLocaleDateString('he-IL') }

export default function UserOrdersModal({ user, onClose }) {
  const [orders, setOrders] = useState([])
  const [payments, setPayments] = useState([])
  const [loading, setLoading] = useState(true)
  const [expanded, setExpanded] = useState(null)
  const [tab, setTab] = useState('orders')
  const [editOrder, setEditOrder] = useState(null)

  const fetchData = () => {
    Promise.all([
      supabase.from('orders').select('*, order_items(*)').eq('user_id', user.id).order('created_at', { ascending: false }),
      supabase.from('payments').select('*').eq('user_id', user.id).order('created_at', { ascending: false })
    ]).then(([o, p]) => {
      if (o.data) setOrders(o.data)
      if (p.data) setPayments(p.data)
      setLoading(false)
    })
  }

  useEffect(() => { fetchData() }, [user.id])

  function orderLabel(type) {
    if (type === 'opening_balance') return 'יתרת פתיחה'
    if (type === 'manual') return 'ידנית'
    return null
  }

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal" style={{ maxWidth: 560 }}>
        <div className="modal-header">
          <h3 className="modal-title">היסטוריה — {user.full_name}</h3>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>

        <div className="nav-tabs" style={{ marginBottom: '1rem' }}>
          <button className={`nav-tab ${tab === 'orders' ? 'active' : ''}`} onClick={() => setTab('orders')}>הזמנות ({orders.length})</button>
          <button className={`nav-tab ${tab === 'payments' ? 'active' : ''}`} onClick={() => setTab('payments')}>תשלומים ({payments.length})</button>
        </div>

        {loading ? <div className="spinner" /> : tab === 'orders' ? (
          orders.length === 0 ? <p style={{ color: 'var(--gray-500)', textAlign: 'center', padding: '2rem' }}>אין הזמנות</p> : (
            <div style={{ border: '1px solid var(--gray-200)', borderRadius: 'var(--radius-sm)', overflow: 'hidden' }}>
              {orders.map((order, i) => (
                <div key={order.id} style={{ borderBottom: i < orders.length - 1 ? '1px solid var(--gray-100)' : 'none' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '11px
