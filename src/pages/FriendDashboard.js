import React, { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import NewOrderModal from '../components/NewOrderModal'

function fmt(n) { return Number(n || 0).toLocaleString('he-IL', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) }
function fmtDate(d) { return new Date(d).toLocaleDateString('he-IL') }

export default function FriendDashboard() {
  const { user, profile } = useAuth()
  const [orders, setOrders] = useState([])
  const [balance, setBalance] = useState(null)
  const [loading, setLoading] = useState(true)
  const [showOrder, setShowOrder] = useState(false)
  const [expandedOrder, setExpandedOrder] = useState(null)

  const fetchData = useCallback(async () => {
    setLoading(true)
    const [ordersRes, balanceRes] = await Promise.all([
      supabase.from('orders').select('*, order_items(*)').eq('user_id', user.id).order('created_at', { ascending: false }),
      supabase.from('user_balances').select('*').eq('id', user.id).single()
    ])
    if (ordersRes.data) setOrders(ordersRes.data)
    if (balanceRes.data) setBalance(balanceRes.data)
    setLoading(false)
  }, [user.id])

  useEffect(() => { fetchData() }, [fetchData])

  const debt = Number(balance?.balance || 0)

  function orderTypeLabel(type) {
    if (type === 'opening_balance') return 'יתרת פתיחה'
    if (type === 'manual') return 'הזמנה ידנית'
    return 'הזמנה'
  }

  return (
    <div>
      <div style={{ marginBottom: '1.5rem' }}>
        <h1 style={{ fontSize: 20, fontWeight: 700, marginBottom: 4 }}>שלום, {profile?.full_name?.split(' ')[0]} 👋</h1>
        <p style={{ color: 'var(--gray-500)', fontSize: 14 }}>הנה סיכום החשבון שלך</p>
      </div>

      <div className="metrics-grid">
        <div className="metric-card">
          <div className="metric-label">יתרת חוב</div>
          <div className={`metric-value ${debt > 0 ? 'red' : 'green'}`}>
            {debt > 0 ? `₪${fmt(debt)}` : debt < 0 ? `זיכוי ₪${fmt(Math.abs(debt))}` : 'מסולק ✓'}
          </div>
        </div>
        <div className="metric-card">
          <div className="metric-label">סה"כ הזמנות</div>
          <div className="metric-value">{orders.length}</div>
        </div>
        <div className="metric-card">
          <div className="metric-label">סה"כ שולם</div>
          <div className="metric-value green">₪{fmt(balance?.total_paid)}</div>
        </div>
      </div>

      <div className="section-header">
        <h2 className="section-title">הזמנות</h2>
        <button className="btn btn-primary" onClick={() => setShowOrder(true)}>+ הזמנה חדשה</button>
      </div>

      {loading ? <div className="spinner" /> : orders.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">🛒</div>
          <p>אין הזמנות עדיין. לחצי על "הזמנה חדשה" כדי להתחיל!</p>
        </div>
      ) : (
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          {orders.map((order, i) => (
            <div key={order.id} style={{ borderBottom: i < orders.length - 1 ? '1px solid var(--gray-100)' : 'none' }}>
              <div
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 16px', cursor: order.order_items?.length ? 'pointer' : 'default' }}
                onClick={() => order.order_items?.length && setExpandedOrder(expandedOrder === order.id ? null : order.id)}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div>
                    <div style={{ fontWeight: 500, fontSize: 14 }}>
                      {order.type === 'opening_balance' ? (order.note || 'יתרת פתיחה') : `הזמנה ${fmtDate(order.created_at)}`}
                    </div>
                    <div style={{ fontSize: 12, color: 'var(--gray-500)', display: 'flex', gap: 8, marginTop: 2 }}>
                      <span>{fmtDate(order.created_at)}</span>
                      {order.type !== 'order' && <span className="badge badge-manual" style={{ fontSize: 11, padding: '0 6px' }}>{orderTypeLabel(order.type)}</span>}
                    </div>
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{ fontWeight: 600, fontSize: 15 }}>₪{fmt(order.total)}</span>
                  {order.order_items?.length > 0 && (
                    <span style={{ color: 'var(--gray-400)', fontSize: 18 }}>{expandedOrder === order.id ? '▴' : '▾'}</span>
                  )}
                </div>
              </div>

              {expandedOrder === order.id && order.order_items?.length > 0 && (
                <div style={{ background: 'var(--gray-50)', borderTop: '1px solid var(--gray-100)', padding: '8px 16px 12px' }}>
                  {order.order_items.map(item => (
                    <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '5px 0', fontSize: 13, color: 'var(--gray-700)' }}>
                      <span>{item.product_name} × {item.quantity}</span>
                      <span>₪{fmt(item.subtotal)}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {showOrder && (
        <NewOrderModal
          onClose={() => setShowOrder(false)}
          onSaved={() => { setShowOrder(false); fetchData() }}
        />
      )}
    </div>
  )
}
