import React, { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'

function fmt(n) { return Number(n || 0).toLocaleString('he-IL', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) }

export default function AddOrderModal({ user, onClose, onSaved }) {
  const { user: adminUser } = useAuth()
  const [mode, setMode] = useState('detailed') // 'detailed' | 'opening_balance'
  const [products, setProducts] = useState([])
  const [quantities, setQuantities] = useState({})
  const [note, setNote] = useState('')
  const [openingAmount, setOpeningAmount] = useState('')
  const [date, setDate] = useState(new Date().toISOString().split('T')[0])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

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

  async function handleSave() {
    setError('')
    setLoading(true)

    try {
      if (mode === 'opening_balance') {
        const amount = parseFloat(openingAmount)
        if (!amount || amount <= 0) throw new Error('יש להזין סכום חוב תקין')

        const { data: order, error: oErr } = await supabase.from('orders').insert({
          user_id: user.id,
          type: 'opening_balance',
          total: amount,
          note: note || 'יתרת פתיחה',
          created_at: date + 'T00:00:00Z'
        }).select().single()

        if (oErr) throw oErr
      } else {
        if (items.length === 0) throw new Error('יש לבחור לפחות מוצר אחד')

        const { data: order, error: oErr } = await supabase.from('orders').insert({
          user_id: user.id,
          type: 'manual',
          total: total,
          note: note,
          created_at: date + 'T00:00:00Z'
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
      }

      onSaved()
    } catch (e) {
      setError(e.message)
    }
    setLoading(false)
  }

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal-header">
          <h3 className="modal-title">הוספת חיוב — {user.full_name}</h3>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>

        <div className="nav-tabs" style={{ marginBottom: '1.25rem' }}>
          <button className={`nav-tab ${mode === 'detailed' ? 'active' : ''}`} onClick={() => setMode('detailed')}>הזמנה מפורטת</button>
          <button className={`nav-tab ${mode === 'opening_balance' ? 'active' : ''}`} onClick={() => setMode('opening_balance')}>יתרת פתיחה</button>
        </div>

        {error && <div className="alert alert-error">{error}</div>}

        <div className="form-group">
          <label className="form-label">תאריך</label>
          <input className="form-input" type="date" value={date} onChange={e => setDate(e.target.value)} />
        </div>

        {mode === 'opening_balance' ? (
          <>
            <div className="form-group">
              <label className="form-label">סכום החוב (₪)</label>
              <input className="form-input" type="number" min="0" step="0.01" value={openingAmount} onChange={e => setOpeningAmount(e.target.value)} placeholder="0.00" />
            </div>
            <div className="form-group">
              <label className="form-label">תיאור (אופציונלי)</label>
              <input className="form-input" type="text" value={note} onChange={e => setNote(e.target.value)} placeholder='למשל: יתרה מצטברת עד יוני 2025' />
            </div>
          </>
        ) : (
          <>
            <div className="form-group">
              <label className="form-label">בחרי מוצרים</label>
              {products.length === 0 ? (
                <p style={{ color: 'var(--gray-500)', fontSize: 14 }}>אין מוצרים — הוסיפי תחילה בלשונית "מוצרים"</p>
              ) : (
                <div style={{ border: '1px solid var(--gray-200)', borderRadius: 'var(--radius-sm)', overflow: 'hidden' }}>
                  {products.map((p, i) => (
                    <div key={p.id} style={{
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                      padding: '10px 12px',
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
              )}
            </div>

            <div className="form-group">
              <label className="form-label">הערה (אופציונלי)</label>
              <input className="form-input" type="text" value={note} onChange={e => setNote(e.target.value)} placeholder="הערה להזמנה" />
            </div>

            {items.length > 0 && (
              <div style={{ background: 'var(--gray-50)', borderRadius: 'var(--radius-sm)', padding: '12px', marginBottom: '1rem', fontSize: 14 }}>
                {items.map(p => (
                  <div key={p.id} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
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
          <button className="btn btn-primary" style={{ flex: 1 }} onClick={handleSave} disabled={loading}>
            {loading ? 'שומר...' : 'שמור חיוב'}
          </button>
          <button className="btn btn-secondary" onClick={onClose}>ביטול</button>
        </div>
      </div>
    </div>
  )
}
