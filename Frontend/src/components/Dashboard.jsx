import React, { useMemo, useState } from 'react'
import { Menu, Package, BarChart2, ShoppingCart, Settings, ChevronDown, LogOut, Building2, User } from 'lucide-react'
import { useAuth } from '../context/AuthContext.jsx'
import { toast } from 'react-toastify'
import { Area, AreaChart, Bar, BarChart, CartesianGrid, RadialBar, RadialBarChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'

export default function Dashboard() {
  const { user, logout } = useAuth()
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false)
  const [avatarOpen, setAvatarOpen] = useState(false)

  const shops = useMemo(() => [
    { id: 's1', name: 'Main Street Hardware' },
    { id: 's2', name: 'Downtown Tools' },
    { id: 's3', name: 'North Depot' },
  ], [])
  const [selectedShop, setSelectedShop] = useState(shops[0].id)

  const handleLogout = () => {
    logout()
    toast.success('Logged out')
  }

  const Sidebar = (
    <div className="w-64 bg-[#0b1020] text-white lg:static lg:translate-x-0 h-full shadow-2xl">
      <div className="p-6 border-b border-white/10">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-600/30 flex items-center justify-center text-indigo-400">
            <Package size={22} />
          </div>
          <div>
            <p className="font-bold leading-tight">Inventory</p>
            <p className="text-xs text-white/60">Manager</p>
          </div>
        </div>
      </div>
      <nav className="p-4 space-y-2">
        <a className="flex items-center space-x-3 px-3 py-2 rounded-xl bg-indigo-600/20 text-indigo-300 font-medium" href="#">
          <BarChart2 size={18} />
          <span>Dashboard</span>
        </a>
        <a className="flex items-center space-x-3 px-3 py-2 rounded-xl hover:bg-white/5 text-white/80" href="#">
          <ShoppingCart size={18} />
          <span>Sales</span>
        </a>
        <a className="flex items-center space-x-3 px-3 py-2 rounded-xl hover:bg-white/5 text-white/80" href="#">
          <Settings size={18} />
          <span>Settings</span>
        </a>
      </nav>
      <div className="mt-auto p-4 hidden lg:block">
        <div className="rounded-2xl p-4 bg-gradient-to-br from-indigo-600/30 to-purple-600/30 text-white">
          <p className="text-sm font-semibold">Need help?</p>
          <p className="text-xs text-white/70">Please check our docs</p>
          <button className="mt-3 text-xs bg-white/10 hover:bg-white/20 px-3 py-1 rounded-lg">Documentation</button>
        </div>
      </div>
    </div>
  )

  // Dummy data for charts
  const salesArea = [
    { name: 'Jan', sales: 400, items: 240 },
    { name: 'Feb', sales: 300, items: 139 },
    { name: 'Mar', sales: 200, items: 980 },
    { name: 'Apr', sales: 278, items: 390 },
    { name: 'May', sales: 189, items: 480 },
    { name: 'Jun', sales: 239, items: 380 },
    { name: 'Jul', sales: 349, items: 430 },
    { name: 'Aug', sales: 420, items: 520 },
    { name: 'Sep', sales: 360, items: 410 },
    { name: 'Oct', sales: 420, items: 520 },
    { name: 'Nov', sales: 460, items: 560 },
    { name: 'Dec', sales: 520, items: 610 },
  ]

  const activeUsers = [
    { name: 'Mon', users: 300 },
    { name: 'Tue', users: 500 },
    { name: 'Wed', users: 200 },
    { name: 'Thu', users: 450 },
    { name: 'Fri', users: 350 },
    { name: 'Sat', users: 600 },
    { name: 'Sun', users: 250 },
  ]

  const satisfaction = [{ name: 'Satisfaction', value: 95, fill: '#34d399' }]

  return (
    <div className="w-full min-h-screen bg-[#0a0f1e] flex items-stretch justify-center relative overflow-hidden">
      {/* Container */}
      <div className="w-full max-w-7xl mx-4 my-6 bg-[#0f1535] rounded-3xl shadow-2xl overflow-hidden flex">
        {/* Sidebar (mobile overlay) */}
        <div className="lg:block hidden">
          {Sidebar}
        </div>
        {/* Mobile sidebar */}
        {mobileSidebarOpen && (
          <div className="fixed inset-0 z-40 lg:hidden">
            <div className="absolute inset-0 bg-black/50" onClick={() => setMobileSidebarOpen(false)} />
            <div className="absolute left-0 top-0 bottom-0 z-50">
              {Sidebar}
            </div>
          </div>
        )}

        {/* Main content */}
        <div className="flex-1 flex flex-col">
          {/* Navbar */}
          <div className="h-16 px-4 lg:px-8 flex items-center justify-between border-b border-white/10 bg-[#0f1535] text-white">
            <div className="flex items-center space-x-3">
              <button className="lg:hidden inline-flex items-center justify-center w-10 h-10 rounded-xl bg-white/10 hover:bg-white/20" onClick={() => setMobileSidebarOpen(true)}>
                <Menu size={20} />
              </button>
              <h1 className="text-xl font-bold">Dashboard</h1>
            </div>

            <div className="flex items-center space-x-4">
              {/* Shops dropdown */}
              <div className="relative">
                <div className="flex items-center px-3 py-2 bg-white/10 border border-white/10 rounded-xl">
                  <Building2 size={18} className="text-white/70 mr-2" />
                  <select
                    value={selectedShop}
                    onChange={(e) => setSelectedShop(e.target.value)}
                    className="appearance-none bg-transparent pr-6 text-sm text-white focus:outline-none"
                  >
                    {shops.map(s => (
                      <option value={s.id} key={s.id}>{s.name}</option>
                    ))}
                  </select>
                  <ChevronDown size={16} className="text-white/70 -ml-5" />
                </div>
              </div>

              {/* Avatar dropdown */}
              <div className="relative">
                <button onClick={() => setAvatarOpen(v => !v)} className="w-10 h-10 rounded-full bg-indigo-600 text-white flex items-center justify-center shadow">
                  <User size={18} />
                </button>
                {avatarOpen && (
                  <div className="absolute right-0 mt-2 w-44 bg-[#0f1535] text-white rounded-xl shadow-lg border border-white/10 p-2 z-10">
                    <div className="px-3 py-2">
                      <p className="text-sm font-semibold">{user?.ownerName || 'User'}</p>
                      <p className="text-xs text-white/70">{user?.mobileNumber || ''}</p>
                    </div>
                    <button onClick={handleLogout} className="w-full flex items-center space-x-2 px-3 py-2 rounded-lg hover:bg-white/10">
                      <LogOut size={16} />
                      <span>Logout</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Top stats cards */}
          <div className="p-4 lg:p-8 grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
            {[{ label: "Today's Money", value: '$53,000', change: '+5%' }, { label: "Today's Users", value: '2,300', change: '+5%' }, { label: 'New Clients', value: '+3,020', change: '-14%' }, { label: 'Total Sales', value: '$173,000', change: '+8%' }].map((c) => (
              <div key={c.label} className="rounded-2xl p-5 bg-gradient-to-br from-[#121a3d] to-[#182057] text-white border border-white/10">
                <p className="text-xs text-white/60">{c.label}</p>
                <div className="mt-3 flex items-end justify-between">
                  <p className="text-2xl font-extrabold">{c.value}</p>
                  <span className={`text-xs ${c.change.startsWith('+') ? 'text-emerald-400' : 'text-rose-400'}`}>{c.change}</span>
                </div>
              </div>
            ))}
          </div>

          {/* Charts row */}
          <div className="px-4 lg:px-8 grid grid-cols-1 xl:grid-cols-3 gap-4">
            {/* Area chart */}
            <div className="rounded-2xl p-5 bg-gradient-to-br from-[#121a3d] to-[#182057] text-white border border-white/10 xl:col-span-2">
              <div className="flex items-center justify-between mb-4">
                <p className="font-semibold">Sales Overview</p>
                <span className="text-xs text-emerald-400">(+5%) more in 2025</span>
              </div>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={salesArea} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#6366f1" stopOpacity={0.8}/>
                        <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                      </linearGradient>
                      <linearGradient id="colorItems" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#22d3ee" stopOpacity={0.8}/>
                        <stop offset="95%" stopColor="#22d3ee" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" />
                    <XAxis dataKey="name" stroke="#ffffff50" />
                    <YAxis stroke="#ffffff50" />
                    <Tooltip contentStyle={{ background: '#0f1535', border: '1px solid #ffffff22', color: '#fff' }} />
                    <Area type="monotone" dataKey="sales" stroke="#6366f1" fillOpacity={1} fill="url(#colorSales)" />
                    <Area type="monotone" dataKey="items" stroke="#22d3ee" fillOpacity={1} fill="url(#colorItems)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Radial satisfaction */}
            <div className="rounded-2xl p-5 bg-gradient-to-br from-[#121a3d] to-[#182057] text-white border border-white/10">
              <p className="font-semibold mb-4">Satisfaction Rate</p>
              <div className="h-64 flex items-center justify-center">
                <ResponsiveContainer width="100%" height="100%">
                  <RadialBarChart innerRadius="70%" outerRadius="100%" data={satisfaction} startAngle={90} endAngle={-270}>
                    <RadialBar minAngle={15} background clockWise dataKey="value" cornerRadius={8} fill="#34d399" />
                    <Tooltip contentStyle={{ background: '#0f1535', border: '1px solid #ffffff22', color: '#fff' }} />
                  </RadialBarChart>
                </ResponsiveContainer>
              </div>
              <p className="text-center text-3xl font-extrabold">95%</p>
              <p className="text-center text-xs text-white/60">Based on 61 ratings</p>
            </div>
          </div>

          {/* Bottom row */}
          <div className="px-4 lg:px-8 py-4 grid grid-cols-1 xl:grid-cols-3 gap-4">
            <div className="rounded-2xl p-5 bg-gradient-to-br from-[#121a3d] to-[#182057] text-white border border-white/10">
              <div className="flex items-center justify-between mb-4">
                <p className="font-semibold">Active Users</p>
                <span className="text-xs text-emerald-400">(+23%) than last week</span>
              </div>
              <div className="h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={activeUsers}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" />
                    <XAxis dataKey="name" stroke="#ffffff50" />
                    <YAxis stroke="#ffffff50" />
                    <Tooltip contentStyle={{ background: '#0f1535', border: '1px solid #ffffff22', color: '#fff' }} />
                    <Bar dataKey="users" fill="#8b5cf6" radius={[6,6,0,0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="rounded-2xl p-5 bg-gradient-to-br from-[#121a3d] to-[#182057] text-white border border-white/10 xl:col-span-2">
              <p className="font-semibold mb-4">Projects</p>
              <div className="space-y-3">
                {[{ name:'Chakra Soft UI Version', budget:'$14,000', completion:'60%' }, { name:'Add Progress Track', budget:'$3,000', completion:'10%' }, { name:'Fix Platform Errors', budget:'Not set', completion:'100%' }, { name:'Launch our Mobile App', budget:'$32,000', completion:'100%' }].map(p => (
                  <div key={p.name} className="flex items-center justify-between bg-white/5 rounded-xl px-4 py-3">
                    <span className="text-sm">{p.name}</span>
                    <div className="flex items-center space-x-4 text-xs text-white/70">
                      <span>{p.budget}</span>
                      <span>{p.completion}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
