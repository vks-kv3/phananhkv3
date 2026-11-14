
import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { FileText, LayoutDashboard, LogOut, Phone } from 'lucide-react';
import { Logo } from './Logo';

export const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const isLoggedIn = sessionStorage.getItem('isLoggedIn') === 'true';
  const isAdminView = location.pathname.startsWith('/admin');

  const navItems = [
    { path: '/', label: 'Trang chủ', icon: <LayoutDashboard size={20} /> },
    { path: '/report', label: 'Phản ánh', icon: <FileText size={20} /> },
    { path: isLoggedIn ? '/admin' : '/login', label: 'Cán bộ', icon: <Logo size={20} /> },
  ];

  return (
    <div className="min-h-screen bg-gray-200/50 flex justify-center items-start md:py-8">
      {/* Mobile-sized Container */}
      <div className="w-full max-w-[480px] min-h-screen md:min-h-[850px] md:max-h-[90vh] bg-white md:rounded-[3rem] shadow-2xl flex flex-col overflow-hidden relative border-x border-gray-100">
        
        {/* Unified App Header */}
        <header className="bg-white/80 backdrop-blur-md border-b h-14 flex items-center justify-between px-3 sticky top-0 z-50">
          <div className="flex items-center gap-2 overflow-hidden flex-1">
            <div className="bg-red-50 p-1 rounded-lg shrink-0">
              <Logo size={24} />
            </div>
            <div className="flex flex-col justify-center overflow-hidden">
              <h1 className="font-black text-red-700 text-[8px] min-[380px]:text-[9px] uppercase leading-none tracking-tighter whitespace-nowrap">
                Viện kiểm sát nhân dân khu vực 3, tỉnh Quảng Trị
              </h1>
            </div>
          </div>
        </header>

        {/* Content Area */}
        <main className="flex-1 overflow-y-auto overflow-x-hidden scroll-smooth pb-20">
          <div className="p-5">
            {children}
          </div>
        </main>

        {/* Bottom Navigation (Phone Style) */}
        <nav className="absolute bottom-0 left-0 right-0 bg-white/90 backdrop-blur-lg border-t flex justify-around py-2 pb-5 px-4 z-50">
          {navItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`flex flex-col items-center gap-1 p-2 transition-all ${
                location.pathname === item.path ? 'text-red-700' : 'text-gray-400'
              }`}
            >
              <div className={`transition-all duration-300 ${location.pathname === item.path ? 'bg-red-50 p-2 rounded-xl scale-110 shadow-sm' : ''}`}>
                {item.icon}
              </div>
              <span className={`text-[8px] font-black uppercase tracking-tighter ${location.pathname === item.path ? 'opacity-100' : 'opacity-60'}`}>
                {item.label}
              </span>
            </Link>
          ))}
        </nav>
      </div>
    </div>
  );
};
