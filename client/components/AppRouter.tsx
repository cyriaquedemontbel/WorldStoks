import React, { useEffect, useState } from 'react'
import { Routes, Route, useNavigate, useLocation } from 'react-router-dom'
import { Header } from './Header'
import { HomePage } from '../pages/HomePage'
import OrderBookPage from '../pages/OrderBookPage'
import { StockDetailPage } from '../pages/StockDetailPage'
import { PortfolioPage } from '../pages/PortfolioPage'
import { FundsPage } from '../pages/FundsPage'
// ...existing code...
import AdminOrdersPage from '../pages/AdminOrdersPage'
import { AdminPage } from '../pages/AdminPage'
import { SettingsPage } from '../pages/SettingsPage'
import { LoginPage } from '../pages/LoginPage'
import { TradeModal } from './TradeModal'
import * as api from '../services/api'
import type { Stock } from '../types'

const initialUser = { isLoggedIn: false, isAdmin: false, username: '', email: '', cash: 0, portfolio: {} } as any



export default function AppRouter(): React.ReactElement {
  const navigate = useNavigate()
  const location = useLocation()
  const [user, setUser] = useState<any>(initialUser)
  const [stocks, setStocks] = useState<Stock[]>([])
  const [tradeModal, setTradeModal] = useState<{ stock: Stock; type: 'buy' | 'sell' } | null>(null)

  useEffect(() => {
    let mounted = true
    api.apiFetchStocks().then(s => { if (mounted && s) setStocks(s) }).catch(() => {})
    api.apiFetchMe().then(me => { if (mounted && me) setUser(me) }).catch(() => {})
    return () => { mounted = false }
  }, [])

  const computeCurrentPage = (path: string) => {
    if (path.startsWith('/orderbook')) return 'orderbook'
    if (path.startsWith('/admin/orders')) return 'admin-orders'
    if (path.startsWith('/admin')) return 'admin'
    if (path.startsWith('/portfolio')) return 'portfolio'
    if (path.startsWith('/funds')) return 'funds'
    if (path.startsWith('/history')) return 'history'
    if (path.startsWith('/settings')) return 'settings'
    if (path.startsWith('/login')) return 'login'
    if (path.startsWith('/about')) return 'about'
    return 'home'
  }

  const currentPage = computeCurrentPage(location.pathname)

  function handleNavigate(page: string, ticker?: string) {
    switch (page) {
      case 'home': return navigate('/')
      case 'login': return navigate('/login')
      case 'portfolio': return navigate('/portfolio')
      case 'funds': return navigate('/funds')
      case 'history': return navigate('/history')
      case 'orderbook': return navigate(`/orderbook/${ticker ?? 'AAPL'}`)
      case 'admin': return navigate('/admin')
      case 'admin-orders': return navigate('/admin/orders')
      case 'settings': return navigate('/settings')
      case 'about': return navigate('/about')
      default: return navigate('/')
    }
  }

  function handleLogout() {
    localStorage.removeItem('authToken')
    setUser({ ...initialUser })
    navigate('/')
  }

  async function handleLogin(email: string, password: string) {
    const res = await api.apiLogin(email, password)
    if ((res as any)?.token) {
      localStorage.setItem('authToken', (res as any).token)
      const me = (res as any).user ?? await api.apiFetchMe()
      if (me) setUser(me)
      navigate('/')
    } else {
      throw new Error('Login failed')
    }
  }

  async function handleSignUp(data: any) {
    const res = await api.apiSignUp(data)
    if ((res as any)?.token) {
      localStorage.setItem('authToken', (res as any).token)
      const me = (res as any).user ?? await api.apiFetchMe()
      if (me) setUser(me)
      navigate('/')
    } else {
      throw new Error('Signup failed')
    }
  }

  function openTradeModal(stock: Stock, type: 'buy' | 'sell') { setTradeModal({ stock, type }) }

  async function handleConfirmTrade(ticker: string, quantity: number) {
    if (!tradeModal) return
    try {
      if (tradeModal.type === 'buy') await api.apiBuyStock(ticker, quantity)
      else await api.apiSellStock(ticker, quantity)
      const [me, updatedStocks] = await Promise.all([api.apiFetchMe(), api.apiFetchStocks()])
      if (me) setUser(me)
      if (updatedStocks) setStocks(updatedStocks)
    } catch (err) {
      console.error('Trade failed', err)
    } finally { setTradeModal(null) }
  }

  function handleStockSelect(ticker: string) { navigate(`/stock/${ticker}`) }

  return (
    <div>
      <Header user={user} currentPage={currentPage} onNavigate={handleNavigate} onLogout={handleLogout} />
      <main className="main-content">
        <Routes>
          <Route path="/" element={<HomePage stocks={stocks} user={user} onStockSelect={handleStockSelect} onNavigate={handleNavigate} onOpenTradeModal={(stock: Stock, type) => openTradeModal(stock, type)} />} />
          <Route path="/orderbook/:ticker" element={<OrderBookPage />} />
          <Route path="/stock/:ticker" element={<StockDetailPage stocks={stocks} user={user} onOpenTradeModal={(stock, type) => openTradeModal(stock, type)} />} />
          <Route path="/login" element={<LoginPage onLogin={handleLogin} onSignUp={handleSignUp} />} />
          <Route path="/portfolio" element={<PortfolioPage user={user} stocks={stocks} onNavigate={handleNavigate} />} />
          <Route path="/funds" element={<FundsPage user={user} onUpdateFunds={async (amount, type) => { const u = await api.apiUpdateFunds(amount, type); setUser(u); return 'OK' }} />} />
          <Route path="/admin" element={<AdminPage stocks={stocks} onAddStock={async (s: any) => { try { await api.apiAddStock(s); return true } catch { return false } }} onUpdateStock={async (s: any) => { try { await api.apiUpdateStock(s); return true } catch { return false } }} onDeleteStock={async (ticker: string) => { try { await api.apiDeleteStock(ticker); setStocks(await api.apiFetchStocks()) } catch (e) { console.error(e) } }} />} />
          <Route path="/admin/orders" element={<AdminOrdersPage />} />
          <Route path="/settings" element={<SettingsPage user={user} onUpdateUser={async (u: any) => { const newUser = await api.apiUpdateUser(u); setUser(newUser); return newUser }} />} />
          <Route path="*" element={<div style={{ padding: 40 }}>Page not found</div>} />
        </Routes>
      </main>
      {tradeModal && (<TradeModal user={user} stock={tradeModal.stock} type={tradeModal.type} onClose={() => setTradeModal(null)} onConfirm={handleConfirmTrade} />)}
    </div>
  )
}
