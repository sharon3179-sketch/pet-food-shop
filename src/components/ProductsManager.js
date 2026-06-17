import React, { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

function fmt(n) { return Number(n || 0).toLocaleString('he-IL', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) }

function ProductModal({ product, onClose, onSaved }) {
  const [name, setName] = useState(product?.name || '')
  const [price, setPrice] = useState(product?.price || '')
  const [unit, setUnit] = useState(product?.unit || 'שק')
  const [stock, setStock] = useState(product?.stock ?? '')
  const [description, setDescription] = useState(product?.description || '')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleSave() {
    setError('')
    if (!name.trim()) { setError('שם המוצר חובה'); return }
    if (!price || isNaN(price) || Number(price) <= 0) { setError('מחיר לא תקין'); return }
    setLoading(true)

    const payload = {
      name: name.trim(),
      price: parseFloat(price),
      unit: unit.trim() || 'יח׳',
      stock: parseInt(stock) || 0,
      description: description.trim() || null,
      updated_at: new Date().toISOString()
    }

    let err
    if (product?.id) {
      ({ error: err } = await supabase.from('products').update(payload).eq('id', product.id))
    } else {
      ({ error: err } = await supabase.from('products').insert(payload))
    }

    if (err) setError(err.message)
    else onSaved()
    setLoading(false)
  }

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal-header">
          <h3 className="modal-title">{product?.id ? 'עריכת מוצר' : 'מוצר חדש'}</h3>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>

        {error && <div className="alert alert-error">{error}</div>}

        <div className="form-group">
          <label className="form-label">שם המוצר *</label>
          <input className="form-input" value={name} onChange={e => setName(e.target.value)} placeholder='למשל: רויאל קנין חתולים 10 ק"ג' />
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <div className="form-group">
            <label className="form-label">מחיר (₪) *</label>
            <input className="form-input" type="number" min="0" step="0.01" value={price} onChange={e => setPrice(e.target.value)} placeholder="0.00" />
          </div>
          <div className="form-group">
            <label className="form-label">יחידה</label>
            <input className="form-input" value={unit} onChange={e => setUnit(e.target.value)} placeholder='שק, יח׳, אריזה...' />
          </div>
        </div>
        <div className="form-group">
          <label className="form-label">כמות במלאי</label>
          <input className="form-input" type="number" min="0" value={stock} onChange={e => setStock(e.target.value)} placeholder="0" />
        </div>
        <div className="form-group">
          <label className="form-label">תיאור (אופציונלי)</label>
          <input className="form-input" value={description} onChange={e => setDescription(e.target.value)} placeholder="פרטים נוספים על המוצר" />
        </div>

        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn btn-primary" style={{ flex: 1 }} onClick={handleSave} disabled={loading}>
            {loading ? 'שומר...' : 'שמור מוצר'}
          </button>
          <button className="btn btn-secondary" onClick={onClose}>ביטול</button>
        </div>
      </div>
    </div>
  )
}

export default function ProductsManager() {
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [editProduct, setEditProduct] = useState(null)
  const [showNew, setShowNew] = useState(false)

  async function fetchProducts() {
    setLoading(true)
    const { data } = await supabase.from('products').select('*').order('name')
    if (data) setProducts(data)
    setLoading(false)
  }

  useEffect(() => { fetchProducts() }, [])

  async function toggleActive(p) {
    await supabase.from('products').update({ active: !p.active }).eq('id', p.id)
    fetchProducts()
  }

  return (
    <div>
      <div className="section-header">
        <h2 className="section-title">מוצרים</h2>
        <button className="btn btn-primary" onClick={() => setShowNew(true)}>+ מוצר חדש</button>
      </div>

      {loading ? <div className="spinner" /> : products.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">📦</div>
          <p>אין מוצרים עדיין. לחצי על "+ מוצר חדש" להתחיל.</p>
        </div>
      ) : (
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>שם</th>
                  <th>מחיר</th>
                  <th>יחידה</th>
                  <th>מלאי</th>
                  <th>סטטוס</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {products.map(p => (
                  <tr key={p.id} style={{ opacity: p.active ? 1 : 0.5 }}>
                    <td style={{ fontWeight: 500 }}>{p.name}</td>
                    <td>₪{fmt(p.price)}</td>
                    <td>{p.unit}</td>
                    <td>{p.stock}</td>
                    <td>
                      <span className={`badge ${p.active ? 'badge-paid' : 'badge-manual'}`}>
                        {p.active ? 'פעיל' : 'מושבת'}
                      </span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
                        <button className="btn btn-secondary btn-sm" onClick={() => setEditProduct(p)}>עריכה</button>
                        <button className="btn btn-secondary btn-sm" onClick={() => toggleActive(p)}>
                          {p.active ? 'השבת' : 'הפעל'}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {showNew && (
        <ProductModal
          onClose={() => setShowNew(false)}
          onSaved={() => { setShowNew(false); fetchProducts() }}
        />
      )}

      {editProduct && (
        <ProductModal
          product={editProduct}
          onClose={() => setEditProduct(null)}
          onSaved={() => { setEditProduct(null); fetchProducts() }}
        />
      )}
    </div>
  )
}
