import React, { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

function fmt(n) { return Number(n || 0).toLocaleString('he-IL', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) }

export default function EditOrderModal({ order, userId, onClose, onSaved }) {
  const [products, setProducts] = useState([])
  const [quantities, setQuantities] = useState({})
  const [note, setNote] = useState(order.note || '')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    supabase.from('products').select('*').eq('active', true).order('name').then(({ data }) => {
      if (data) {
        setProducts(data)
        const qtys = {}
        order.order_items?.forEach(item => {
          const prod = data.find(p => p.id === item.product_id)
          if (prod) qtys[prod.id] = item.quantity
          else qtys[item.product_id || item.product_name] = item.quantity
        })
        setQuantities(qtys)
      }
    })
  }, [order])

  function setQty(id, val) {
    const n = Math.max(0, parseInt(val) || 0)
    setQuantities(q => ({ ...q, [id]: n }))
  }

  const items = products.filter(p => (quantities[p.id] || 0) > 0)
  const total = items.reduce((s, p) => s + p.price * (quantities[p.id] || 0), 0)

  async function handleSave() {
    setError('')
    if (items.length === 0) { setError('יש לבחור לפחות מוצר אחד'); return }
    setLoading(true)

    try {
      await supabase.from('order_items').delete().eq('order_id', order.id)

      const { error: oErr } = await supabase.from('orders').update({
        total: total,
        note: note || null,
        updated_at: new Date().toISOString()
      }).eq('id', order.id)
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

      onSaved()
    } catch (e) {
      setError(e.message)
    }
    setLoading(false)
  }

  async function handleDelete() {
    if (!window.confirm('למחוק את ההזמנה לגמרי? הסכום יוסר מהחוב.')) return
    setLoading(true)
    await supabase.from('orders').delete().eq('id', order.id)
    onSaved()
  }

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal-header">
          <h3 className="modal-title">עריכת הזמנה</h3>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>

        {error && <div className="alert alert-error">{error}</div>}

        <div className="form-group">
          <label className="form-label">מוצרים</label>
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
        </div>

        <div className="form-group">
          <label className="form-label">הערה (אופציונלי)</label>
          <input className="form-input" type="text" value={note} onChange={e => setNote(e.target.value)} />
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

        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn btn-primary" style={{ flex: 1 }} onClick={handleSave} disabled={loading}>
            {loading ? 'שומר...' : 'שמור שינויים'}
          </button>
          <button className="btn btn-danger" onClick={handleDelete} disabled={loading}>מחק</button>
          <button className="btn btn-secondary" onClick={onClose}>ביטול</button>
        </div>
      </div>
    </div>
  )
}
