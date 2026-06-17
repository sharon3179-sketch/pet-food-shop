// AddPaymentModal.js
import React, { useState } from 'react'
import { supabase } from '../lib/supabase'

function fmt(n) { return Number(n || 0).toLocaleString('he-IL', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) }

export default function AddPaymentModal({ user, onClose, onSaved }) {
  const [amount, setAmount] = useState('')
  const [note, setNote] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const debt = Number(user.balance || 0)

  async function handleSave() {
    setError('')
    const n = parseFloat(amount)
    if (!n || n <= 0) { setError('יש להזין סכום תקין'); return }
    setLoading(true)

    const { error: err } = await supabase.from('payments').insert({
      user_id: user.id,
      amount: n,
      note: note || null
    })

    if (err) setError(err.message)
    else onSaved()
    setLoading(false)
  }

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal-header">
          <h3 className="modal-title">רישום תשלום — {user.full_name}</h3>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>

        <div style={{ background: 'var(--red-light)', borderRadius: 'var(--radius-sm)', padding: '10px 14px', marginBottom: '1.25rem', fontSize: 14 }}>
          יתרת חוב נוכחית: <strong style={{ color: 'var(--red)' }}>₪{fmt(debt)}</strong>
        </div>

        {error && <div className="alert alert-error">{error}</div>}

        <div className="form-group">
          <label className="form-label">סכום ששולם (₪)</label>
          <input className="form-input" type="number" min="0" step="0.01" value={amount} onChange={e => setAmount(e.target.value)} placeholder="0.00" autoFocus />
          {debt > 0 && (
            <button style={{ fontSize: 12, color: 'var(--green)', background: 'none', border: 'none', cursor: 'pointer', marginTop: 4 }}
              onClick={() => setAmount(debt.toString())}>
              מלא סכום מלא: ₪{fmt(debt)}
            </button>
          )}
        </div>

        <div className="form-group">
          <label className="form-label">הערה (אופציונלי)</label>
          <input className="form-input" type="text" value={note} onChange={e => setNote(e.target.value)} placeholder='למשל: העברה בנקאית' />
        </div>

        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn btn-primary" style={{ flex: 1 }} onClick={handleSave} disabled={loading}>
            {loading ? 'שומר...' : 'רשום תשלום'}
          </button>
          <button className="btn btn-secondary" onClick={onClose}>ביטול</button>
        </div>
      </div>
    </div>
  )
}
