import React, { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

function fmt(n) { return Number(n || 0).toLocaleString('he-IL', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) }
function fmtDate(d) { return new Date(d).toLocaleDateString('he-IL') }

export default function UserOrdersModal({ user, onClose }) {
  const [orders, setOrders] = useState([])
  const [payments, setPayments] = useState([])
  const [loading, setLoading] = useState(true)
  const [expanded, setExpanded] = useState(null)
  const [tab, setTab] = useState('orders')

  useEffect(() => {
    Promise.all([
      supabase.from('orders').select('*, order_items(*)').eq('user_id', user.id).order('created_at', { ascending: false }),
      supabase.from('payments').select('*').eq('user_id', user.id).order('created_at', { ascending: false })
    ]).then(([o, p]) => {
      if (o.data) setOrders(o.data)
      if (p.data) setPayments(p.data)
      setLoading(false)
    })
  }, [user.id])

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
                  <div
                    style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '11px 14px', cursor: order.order_items?.length ? 'pointer' : 'default' }}
                    onClick={() => order.order_items?.length && setExpanded(expanded === order.id ? null : order.id)}
                  >
                    <div>
                      <div style={{ fontSize: 14, fontWeight: 500, display: 'flex', gap: 7, alignItems: 'center' }}>
                        {order.type === 'opening_balance' ? (order.note || 'יתרת פתיחה') : `הזמנה`}
                        {orderLabel(order.type) && <span className="badge badge-manual" style={{ fontSize: 11 }}>{orderLabel(order.type)}</span>}
                      </div>
                      <div style={{ fontSize: 12, color: 'var(--gray-500)' }}>{fmtDate(order.created_at)}</div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ fontWeight: 600 }}>₪{fmt(order.total)}</span>
                      {order.order_items?.length > 0 && <span style={{ color: 'var(--gray-400)' }}>{expanded === order.id ? '▴' : '▾'}</span>}
                    </div>
                  </div>
                  {expanded === order.id && order.order_items?.length > 0 && (
                    <div style={{ background: 'var(--gray-50)', borderTop: '1px solid var(--gray-100)', padding: '8px 14px 10px' }}>
                      {order.order_items.map(item => (
                        <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', fontSize: 13, color: 'var(--gray-700)' }}>
                          <span>{item.product_name} × {item.quantity}</span>
                          <span>₪{fmt(item.subtotal)}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )
        ) : (
          payments.length === 0 ? <p style={{ color: 'var(--gray-500)', textAlign: 'center', padding: '2rem' }}>אין תשלומים</p> : (
            <div style={{ border: '1px solid var(--gray-200)', borderRadius: 'var(--radius-sm)', overflow: 'hidden' }}>
              {payments.map((p, i) => (
                <div key={p.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '11px 14px', borderBottom: i < payments.length - 1 ? '1px solid var(--gray-100)' : 'none' }}>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 500 }}>{p.note || 'תשלום'}</div>
                    <div style={{ fontSize: 12, color: 'var(--gray-500)' }}>{fmtDate(p.created_at)}</div>
                  </div>
                  <span style={{ fontWeight: 600, color: 'var(--green)' }}>₪{fmt(p.amount)}</span>
                </div>
              ))}
            </div>
          )
        )}

        <div style={{ marginTop: '1.25rem' }}>
          <button className="btn btn-secondary btn-full" onClick={onClose}>סגור</button>
        </div>
      </div>
    </div>
  )
}
