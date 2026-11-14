
import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { FileText, LayoutDashboard, LogOut, Phone, Search } from 'lucide-react';
import { Logo } from './Logo';

export const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const isLoggedIn = sessionStorage.getItem('isLoggedIn') === 'true';
  const isAdminView = location.pathname.startsWith('/admin');

  const navItems = [
    { path: '/', label: 'Trang chủ', icon: <LayoutDashboard size={20} /> },
    { path: '/report', label: 'Phản ánh', icon: <FileText size={20} /> },
    { path: '/tra-cuu', label: 'Tra cứu', icon: <Search size={20} /> },
    { path: isLoggedIn ? '/admin' : '/login', label: 'Cán bộ', icon: <Logo size={20} /> },
  ];

  return (
    <div className="min-h-screen bg-gray-200/50 md:bg-gray-50 flex justify-center items-start">
      {/* Điện thoại: khung hẹp 480px. Máy tính (từ 768px): toàn màn hình */}
      <div className="w-full max-w-[480px] md:max-w-none min-h-screen bg-white md:bg-gray-50 shadow-2xl md:shadow-none flex flex-col overflow-hidden md:overflow-visible relative border-x border-gray-100 md:border-x-0">
        
        {/* Unified App Header */}
        <header className="bg-white/80 md:bg-white backdrop-blur-md border-b h-14 md:h-20 flex items-center justify-between px-3 md:px-8 sticky top-0 z-50 md:shadow-sm">
          <div className="w-full md:max-w-6xl md:mx-auto flex items-center justify-between gap-6">
            <Link to="/" className="flex items-center gap-2 md:gap-3 overflow-hidden flex-1">
              <div className="bg-red-50 p-1 md:p-1.5 rounded-lg shrink-0">
                <span className="md:hidden"><Logo size={24} /></span>
                <span className="hidden md:block"><Logo size={40} /></span>
              </div>
              <div className="flex flex-col justify-center overflow-hidden">
                <p className="hidden md:block text-[11px] font-bold text-gray-500 uppercase tracking-wide leading-tight">Viện kiểm sát nhân dân tỉnh Quảng Trị</p>
                <h1 className="font-black text-red-700 text-[8px] min-[380px]:text-[9px] md:text-base uppercase leading-none md:leading-tight tracking-tighter md:tracking-normal whitespace-nowrap">
                  Viện kiểm sát nhân dân khu vực 3<span className="md:hidden">, tỉnh Quảng Trị</span>
                </h1>
              </div>
            </Link>
            {/* Thanh điều hướng ngang cho máy tính */}
            <nav className="hidden md:flex items-center gap-1 shrink-0">
              {navItems.map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold transition-all ${
                    location.pathname === item.path ? 'bg-red-50 text-red-700' : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'
                  }`}
                >
                  {item.icon}
                  {item.label}
                </Link>
              ))}
            </nav>
          </div>
        </header>

        {/* Content Area */}
        <main className="flex-1 overflow-y-auto md:overflow-visible overflow-x-hidden scroll-smooth pb-20 md:pb-12">
          <div className="p-5 md:px-8 md:py-10 md:max-w-6xl md:mx-auto desktop-scale">
            {children}
          </div>
        </main>

        <footer className="hidden md:block border-t bg-white py-6 text-center text-xs text-gray-400">
          Viện kiểm sát nhân dân khu vực 3, tỉnh Quảng Trị — Cổng tiếp nhận phản ánh
        </footer>

        {/* Bottom Navigation (Phone Style) */}
        <nav className="md:hidden fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[480px] bg-white/90 backdrop-blur-lg border-t flex justify-around py-2 pb-5 px-4 z-50">
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
