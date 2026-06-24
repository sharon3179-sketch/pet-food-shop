import React, { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import AddOrderModal from '../components/AddOrderModal'
import AddPaymentModal from '../components/AddPaymentModal'
import ProductsManager from '../components/ProductsManager'
import UserOrdersModal from '../components/UserOrdersModal'
import AddUserModal from '../components/AddUserModal'

function fmt(n) { return Number(n || 0).toLocaleString('he-IL', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) }
function initials(name) { return name?.split(' ').map(w => w[0]).slice(0, 2).join('') || '?' }

export default function AdminDashboard() {
  const [tab, setTab] = useState('friends')
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [addOrderUser, setAddOrderUser] = useState(null)
  const [addPaymentUser, setAddPaymentUser] = useState(null)
  const [viewOrdersUser, setViewOrdersUser] = useState(null)
  const [showAddUser, setShowAddUser] = useState(false)
  const [totalDebt, setTotalDebt] = useState(0)

  const fetchUsers = useCallback(async () => {
    setLoading(true)
    const { data } = await supabase.from('user_balances').select('*').order('full_name')
    if (data) {
      setUsers(data)
      setTotalDebt(data.reduce((s, u) => s + Math.max(0, Number(u.balance)), 0))
    }
    setLoading(false)
  }, [])

  useEffect(() => { fetchUsers() }, [fetchUsers])

  const avatarColors = [
    { bg: '#e8f5ee', color: '#1a7a4a' },
    { bg: '#eeedfe', color: '#534ab7' },
    { bg: '#faeeda', color: '#854f0b' },
    { bg: '#fbeaf0', color: '#993556' },
    { bg: '#e6f1fb', color: '#185fa5' },
  ]

  return (
    <div>
      <div className="metrics-grid">
        <div className="metric-card">
          <div className="metric-label">חברים רשומים</div>
          <div className="metric-value">{users.length}</div>
        </div>
        <div className="metric-card">
          <div className="metric-label">סה"כ חובות פתוחים</div>
          <div className={`metric-value ${totalDebt > 0 ? 'red' : 'green'}`}>NIS {fmt(totalDebt)}</div>
        </div>
        <div className="metric-card">
          <div className="metric-label">חברים עם חוב</div>
          <div className="metric-value red">{users.filter(u => Number(u.balance) > 0).length}</div>
        </div>
      </div>

      <div className="nav-tabs">
        <button className={`nav-tab ${tab === 'friends' ? 'active' : ''}`} onClick={() => setTab('friends')}>חברים וחובות</button>
        <button className={`nav-tab ${tab === 'products' ? 'active' : ''}`} onClick={() => setTab('products')}>מוצרים</button>
      </div>

      {tab === 'friends' && (
        <div>
          <div className="section-header">
            <h2 className="section-title">חברים וחובות</h2>
            <button className="btn btn-primary" onClick={() => setShowAddUser(true)}>+ הוסף חברה</button>
          </div>

          {loading ? <div className="spinner" /> : users.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">👥</div>
              <p>אין חברים רשומים עדיין</p>
            </div>
          ) : (
            <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
              <div className="table-wrapper">
                <table>
                  <thead>
                    <tr>
                      <th>שם</th>
                      <th>סה"כ חויב</th>
                      <th>סה"כ שולם</th>
                      <th>יתרת חוב</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((u, i) => {
                      const balance = Number(u.balance)
                      const col = avatarColors[i % avatarColors.length]
                      return (
                        <tr key={u.id}>
                          <td>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                              <div className="avatar" style={{ background: col.bg, color: col.color }}>{initials(u.full_name)}</div>
                              <div>
                                <div style={{ fontWeight: 500 }}>{u.full_name}</div>
                                {u.phone && <div style={{ fontSize: 12, color: 'var(--gray-500)' }}>{u.phone}</div>}
                              </div>
                            </div>
                          </td>
                          <td>NIS {fmt(u.total_charged)}</td>
                          <td>NIS {fmt(u.total_paid)}</td>
                          <td>
                            {balance > 0.009 ? (
                              <span className="badge badge-debt">NIS {fmt(balance)} חוב</span>
                            ) : balance < -0.009 ? (
                              <span className="badge badge-paid">זיכוי NIS {fmt(Math.abs(balance))}</span>
                            ) : (
                              <span className="badge badge-paid">מסולק</span>
                            )}
                          </td>
                          <td>
                            <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
                              <button className="btn btn-secondary btn-sm" onClick={() => setViewOrdersUser(u)}>היסטוריה</button>
                              <button className="btn btn-secondary btn-sm" onClick={() => setAddOrderUser(u)}>+ הזמנה</button>
                              {balance > 0 && (
                                <button className="btn btn-primary btn-sm" onClick={() => setAddPaymentUser(u)}>רשום תשלום</button>
                              )}
                            </div>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {tab === 'products' && <ProductsManager />}

      {showAddUser && (
        <AddUserModal
          onClose={() => setShowAddUser(false)}
          onSaved={() => { setShowAddUser(false); fetchUsers() }}
        />
      )}

      {addOrderUser && (
        <AddOrderModal
          user={addOrderUser}
          onClose={() => setAddOrderUser(null)}
          onSaved={() => { setAddOrderUser(null); fetchUsers() }}
        />
      )}

      {addPaymentUser && (
        <AddPaymentModal
          user={addPaymentUser}
          onClose={() => setAddPaymentUser(null)}
          onSaved={() => { setAddPaymentUser(null); fetchUsers() }}
        />
      )}

      {viewOrdersUser && (
        <UserOrdersModal
          user={viewOrdersUser}
          onClose={() => setViewOrdersUser(null)}
          onSaved={() => fetchUsers()}
        />
      )}
    </div>
  )
}
