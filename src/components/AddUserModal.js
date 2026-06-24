import React, { useState } from 'react'
import { supabase } from '../lib/supabase'

export default function AddUserModal({ onClose, onSaved }) {
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [phone, setPhone] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleSave() {
    setError('')
    if (!fullName.trim()) { setError('יש להזין שם מלא'); return }
    if (!email.trim()) { setError('יש להזין אימייל'); return }
    if (!password || password.length < 6) { setError('סיסמה חייבת להכיל לפחות 6 תווים'); return }
    setLoading(true)

    try {
      const { data, error: fnErr } = await supabase.rpc('create_user', {
        user_email: email.trim(),
        user_password: password,
        user_full_name: fullName.trim(),
        user_phone: phone.trim() || null
      })

      if (fnErr) throw fnErr
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
          <h3 className="modal-title">הוספת חברה חדשה</h3>
          <button className="modal-close" onClick={onClose}>X</button>
        </div>

        {error && <div className="alert alert-error">{error}</div>}

        <div className="form-group">
          <label className="form-label">שם מלא *</label>
          <input className="form-input" value={fullName} onChange={e => setFullName(e.target.value)} placeholder="שם מלא" autoFocus />
        </div>

        <div className="form-group">
          <label className="form-label">אימייל *</label>
          <input className="form-input" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="email@example.com" />
        </div>

        <div className="form-group">
          <label className="form-label">סיסמה *</label>
          <input className="form-input" type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="לפחות 6 תווים" />
        </div>

        <div className="form-group">
          <label className="form-label">טלפון (אופציונלי)</label>
          <input className="form-input" type="tel" value={phone} onChange={e => setPhone(e.target.value)} placeholder="050-0000000" />
        </div>

        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn btn-primary" style={{ flex: 1 }} onClick={handleSave} disabled={loading}>
            {loading ? 'שומר...' : 'הוסף חברה'}
          </button>
          <button className="btn btn-secondary" onClick={onClose}>ביטול</button>
        </div>
      </div>
    </div>
  )
}
