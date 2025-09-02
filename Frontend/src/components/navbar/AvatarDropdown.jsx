import React from 'react'
import { LogOut, User } from 'lucide-react'
import { useDashboard } from '../../context/DashboardContext.jsx'

export default function AvatarDropdown() {
  const { user, logout, avatarOpen, setAvatarOpen } = useDashboard()

  const handleLogout = () => {
    logout()
  }

  return (
    <div className="relative">
      <button
        onClick={() => setAvatarOpen((v) => !v)}
        className="w-10 h-10 rounded-full bg-indigo-600 text-white flex items-center justify-center shadow"
      >
        <User size={18} />
      </button>
      {avatarOpen && (
        <div className="absolute right-0 mt-2 w-44 bg-[#0f1535] text-white rounded-xl shadow-lg border border-white/10 p-2 z-10">
          <div className="px-3 py-2">
            <p className="text-sm font-semibold">{user?.ownerName || 'User'}</p>
            <p className="text-xs text-white/70">{user?.mobileNumber || ''}</p>
          </div>
          <button
            onClick={handleLogout}
            className="w-full flex items-center space-x-2 px-3 py-2 rounded-lg hover:bg-white/10"
          >
            <LogOut size={16} />
            <span>Logout</span>
          </button>
        </div>
      )}
    </div>
  )
}
