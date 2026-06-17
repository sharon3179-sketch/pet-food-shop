import React, { useState } from 'react'
import { useAuth } from '../contexts/AuthContext'

export default function LoginPage() {
  const { signIn, signUp } = useAuth()
  const [mode, setMode] = useState('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [fullName, setFullName] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setSuccess('')
    setLoading(true)

    if (mode === 'login') {
      const { error } = await signIn(email, password)
      if (error) setError('שגיאה: ' + (error.message === 'Invalid login credentials' ? 'אימייל או סיסמה שגויים' : error.message))
    } else {
      if (!fullName.trim()) { setError('יש להזין שם מלא'); setLoading(false); return }
      const { error } = await signUp(email, password, fullName)
      if (error) setError('שגיאה: ' + error.message)
      else setSuccess('נרשמת בהצלחה! המנהלת תאשר את חשבונך בקרוב.')
    }
    setLoading(false)
  }

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'linear-gradient(135deg, #e8f5ee 0%, #f8f9fa 100%)',
      padding: '1rem'
    }}>
      <div style={{ width: '100%', maxWidth: 380 }}>
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{ fontSize: 48, marginBottom: 8 }}>🐱</div>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: 'var(--green)' }}>חנות מזון בעלי חיים</h1>
          <p style={{ color: 'var(--gray-500)', fontSize: 14, marginTop: 4 }}>רכישה משותפת, חיסכון לכולם</p>
        </div>

        <div className="card">
          <div className="nav-tabs" style={{ marginBottom: '1.5rem' }}>
            <button className={`nav-tab ${mode === 'login' ? 'active' : ''}`} onClick={() => { setMode('login'); setError(''); setSuccess('') }}>כניסה</button>
            <button className={`nav-tab ${mode === 'register' ? 'active' : ''}`} onClick={() => { setMode('register'); setError(''); setSuccess('') }}>הרשמה</button>
          </div>

          {error && <div className="alert alert-error">{error}</div>}
          {success && <div className="alert alert-success">{success}</div>}

          {!success && (
            <form onSubmit={handleSubmit}>
              {mode === 'register' && (
                <div className="form-group">
                  <label className="form-label">שם מלא</label>
                  <input className="form-input" type="text" value={fullName} onChange={e => setFullName(e.target.value)} placeholder="שרה כהן" required />
                </div>
              )}
              <div className="form-group">
                <label className="form-label">אימייל</label>
                <input className="form-input" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com" required />
              </div>
              <div className="form-group">
                <label className="form-label">סיסמה</label>
                <input className="form-input" type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="לפחות 6 תווים" required minLength={6} />
              </div>
              <button className="btn btn-primary btn-full" type="submit" disabled={loading}>
                {loading ? 'רגע...' : mode === 'login' ? 'כניסה' : 'הרשמה'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}
