import React from 'react'
import { useAuth } from '../contexts/AuthContext'

export default function Navbar() {
  const { profile, signOut } = useAuth()

  return (
    <nav className="navbar">
      <a href="/" className="navbar-brand">
        <span>🐱</span>
        חנות מזון בעלי חיים
      </a>
      <div className="navbar-right">
        <span style={{ fontSize: 13, color: 'var(--gray-600)' }}>
          שלום, {profile?.full_name?.split(' ')[0]}
          {profile?.is_admin && <span style={{ marginRight: 6, fontSize: 11, background: 'var(--green-light)', color: 'var(--green)', padding: '2px 7px', borderRadius: 99, fontWeight: 600 }}>מנהלת</span>}
        </span>
        <button className="btn btn-secondary btn-sm" onClick={signOut}>יציאה</button>
      </div>
    </nav>
  )
}
