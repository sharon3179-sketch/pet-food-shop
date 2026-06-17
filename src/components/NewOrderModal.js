import React, { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'

function fmt(n) { return Number(n || 0).toLocaleString('he-IL', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) }

export default function NewOrderModal({ onClose, onSaved }) {
  const { user } = useAuth()
  const [products, setProducts] = useState([])
  const [quantities, setQuantities] = useState({})
  const [note, setNote] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [confirmed, setConfirmed] = useState(false)

  useEffect(() => {
    supabase.from('products').select('*').eq('active', true).order('name').then(({ data }) => {
      if (data) setProducts(data)
    })
  }, [])

  function setQty(id, val) {
    const n = Math.max(0, parseInt(val) || 0)
    setQuantities(q => ({ ...q, [id]: n }))
  }

  const items = products.filter(p => (quantities[p.id] || 0) > 0)
  const total = items.reduce((s, p) => s + p.price * (quantities[p.id] || 0), 0)

  async function handleOrder() {
    setError('')
    if (items.length === 0) { setError('יש לבחור לפחות מוצר אחד'); return }
    setLoading(true)

    try {
      const { data: order, error: oErr } = await supabase.from('orders').insert({
        user_id: user.id,
        type: 'order',
        total: total,
        note: note || null
      }).select().single()

      if (oErr) throw oErr

      const orderItems = items.map(p => ({
        order_id: order.id,
        product_id: p.id,
        product_name: p.name,
        product_price: p.price,
        quantity: quantities[p.id],
        subtotal: p.price * quantities[p.id]
      }))

      const { error: iErr } = await supabase.from('order_items').insert(orderItems)
      if (iErr) throw iErr

      setConfirmed(true)
      setTimeout(onSaved, 1500)
    } catch (e) {
      setError(e.message)
    }
    setLoading(false)
  }

  if (confirmed) return (
    <div className="modal-overlay">
      <div className="modal" style={{ textAlign: 'center', padding: '2.5rem' }}>
        <div style={{ fontSize: 48, marginBottom: 12 }}>✅</div>
        <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 8 }}>ההזמנה נשלחה!</h3>
        <p style={{ color: 'var(--gray-500)' }}>סה"כ ₪{fmt(total)} נוסף לחשבונך</p>
      </div>
    </div>
  )

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal-header">
          <h3 className="modal-title">הזמנה חדשה</h3>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>

        {error && <div className="alert alert-error">{error}</div>}

        {products.length === 0 ? (
          <div className="empty-state" style={{ padding: '2rem 0' }}>
            <div className="empty-icon">📦</div>
            <p>אין מוצרים זמינים כרגע</p>
          </div>
        ) : (
          <>
            <div style={{ border: '1px solid var(--gray-200)', borderRadius: 'var(--radius-sm)', overflow: 'hidden', marginBottom: '1rem' }}>
              {products.map((p, i) => (
                <div key={p.id} style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: '11px 12px',
                  borderBottom: i < products.length - 1 ? '1px solid var(--gray-100)' : 'none',
                  background: (quantities[p.id] || 0) > 0 ? 'var(--green-light)' : 'white'
                }}>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 500 }}>{p.name}</div>
                    <div style={{ fontSize: 12, color: 'var(--gray-500)' }}>₪{fmt(p.price)} / {p.unit}</div>
                  </div>
                  <div className="qty-control">
                    <button className="qty-btn" onClick={() => setQty(p.id, (quantities[p.id] || 0) - 1)}>−</button>
                    <span style={{ minWidth: 24, textAlign: 'center', fontWeight: 600 }}>{quantities[p.id] || 0}</span>
                    <button className="qty-btn" onClick={() => setQty(p.id, (quantities[p.id] || 0) + 1)}>+</button>
                  </div>
                </div>
              ))}
            </div>

            <div className="form-group">
              <label className="form-label">הערה (אופציונלי)</label>
              <input className="form-input" type="text" value={note} onChange={e => setNote(e.target.value)} placeholder="הערה להזמנה" />
            </div>

            {items.length > 0 && (
              <div style={{ background: 'var(--gray-50)', borderRadius: 'var(--radius-sm)', padding: '12px', marginBottom: '1rem' }}>
                {items.map(p => (
                  <div key={p.id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 4 }}>
                    <span>{p.name} × {quantities[p.id]}</span>
                    <span>₪{fmt(p.price * quantities[p.id])}</span>
                  </div>
                ))}
                <hr className="divider" />
                <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 700, fontSize: 16 }}>
                  <span>סה"כ</span>
                  <span>₪{fmt(total)}</span>
                </div>
              </div>
            )}
          </>
        )}

        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn btn-primary" style={{ flex: 1 }} onClick={handleOrder} disabled={loading || items.length === 0}>
            {loading ? 'שולח...' : `שלח הזמנה${items.length > 0 ? ` — ₪${fmt(total)}` : ''}`}
          </button>
          <button className="btn btn-secondary" onClick={onClose}>ביטול</button>
        </div>
      </div>
    </div>
  )
}
