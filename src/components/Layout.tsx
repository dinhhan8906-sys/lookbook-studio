import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Camera, LayoutDashboard, PlusCircle, Settings, UserCircle } from 'lucide-react';
import { useStore } from '../store/useStore';
import { cn } from '../lib/utils';

export function Layout({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  const user = useStore((state) => state.user);

  const navigation = [
    { name: 'Bảng điều khiển', href: '/', icon: LayoutDashboard },
    { name: 'Tạo dự án', href: '/create', icon: PlusCircle },
    { name: 'Cài đặt', href: '/settings', icon: Settings },
  ];

  return (
    <div className="flex h-screen bg-zinc-50 overflow-hidden">
      {/* Sidebar */}
      <div className="w-64 bg-white border-r border-zinc-200 flex flex-col">
        <div className="h-16 flex items-center px-6 border-b border-zinc-200">
          <Camera className="w-6 h-6 text-indigo-600 mr-2" />
          <span className="font-bold text-lg tracking-tight text-zinc-900">Lookbook Studio</span>
        </div>

        <nav className="flex-1 px-4 py-6 space-y-1">
          {navigation.map((item) => {
            const isActive = location.pathname === item.href;
            return (
              <Link
                key={item.name}
                to={item.href}
                className={cn(
                  'flex items-center px-3 py-2.5 text-sm font-medium rounded-xl transition-colors',
                  isActive
                    ? 'bg-indigo-50 text-indigo-700'
                    : 'text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900'
                )}
              >
                <item.icon
                  className={cn(
                    'mr-3 flex-shrink-0 h-5 w-5',
                    isActive ? 'text-indigo-600' : 'text-zinc-400'
                  )}
                  aria-hidden="true"
                />
                {item.name}
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-zinc-200">
          <div className="flex items-center bg-zinc-50 p-3 rounded-xl border border-zinc-200">
            <UserCircle className="h-8 w-8 text-zinc-400" />
            <div className="ml-3">
              <p className="text-sm font-medium text-zinc-900 truncate">{user.email}</p>
              <p className="text-xs text-zinc-500">
                {user.plan.toUpperCase()} • {user.credits} tín dụng
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <main className="flex-1 overflow-y-auto p-8">
          <div className="max-w-7xl mx-auto">{children}</div>
        </main>
      </div>
    </div>
  );
}
