
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, Globe, ArrowRight } from 'lucide-react';
import { VULNERABLE_GROUPS, PUBLIC_INTEREST_GROUPS } from '../types';
import { Logo } from '../components/Logo';

export const Home: React.FC = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'vulnerable' | 'public'>('vulnerable');

  return (
    <div className="flex flex-col gap-6 md:grid md:grid-cols-2 md:gap-12 md:items-center md:min-h-[60vh]">
      {/* Điện thoại: 'contents' để các khối con xếp theo thứ tự order; máy tính: cột trái */}
      <div className="contents md:block md:space-y-6">
      {/* Header Section */}
      <section className="order-1 text-center space-y-6 pt-4 pb-2">
        <div className="inline-flex items-center justify-center p-3 animate-in fade-in zoom-in duration-700">
          <Logo size={130} />
        </div>
        <div className="space-y-2 px-2 md:px-0">
          <h2 className="text-red-900 font-black text-base md:text-xl uppercase tracking-tight leading-snug text-center">
            Viện kiểm sát nhân dân tỉnh Quảng Trị
          </h2>
          <h3 className="text-red-900 font-black text-base md:text-xl uppercase tracking-tight leading-snug text-center">
            Viện kiểm sát nhân dân khu vực 3
          </h3>
          <div className="pt-2">
            <h1 className="text-red-700 font-black text-2xl md:text-4xl uppercase tracking-widest md:tracking-wide leading-none">
              Cổng Tiếp nhận Phản ánh
            </h1>
          </div>
        </div>
        <p className="text-gray-500 italic text-xs md:text-base leading-relaxed px-6 md:px-4">
          Tiếp nhận phản ánh nhằm bảo vệ quyền dân sự của các chủ thể là nhóm dễ bị tổn thương, bảo vệ lợi ích công khi không có người khởi kiện.
        </p>
      </section>

      {/* Call to Action */}
      <div className="order-3 flex flex-col items-center md:items-stretch py-4 md:max-w-md md:mx-auto md:w-full">
        <button 
          onClick={() => navigate('/report')}
          className="group relative w-full py-5 bg-red-700 text-white rounded-2xl font-black text-lg shadow-xl hover:bg-red-800 transition-all flex items-center justify-center gap-3 overflow-hidden"
        >
          <span className="relative z-10 uppercase tracking-[0.15em]">Bắt đầu phản ánh</span>
          <ArrowRight className="relative z-10 group-hover:translate-x-1 transition-transform" size={20} />
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
        </button>
        <button
          onClick={() => navigate('/tra-cuu')}
          className="mt-3 w-full py-4 bg-white border-2 border-red-700 text-red-700 rounded-2xl font-black text-sm uppercase tracking-[0.15em] hover:bg-red-50 transition-all"
        >
          Tra cứu tiến độ đơn đã gửi
        </button>
      </div>
      </div>

      {/* Explanation Section */}
      <section className="order-2 bg-white rounded-[2rem] shadow-lg border border-gray-100 overflow-hidden">
        <div className="flex border-b">
          <button 
            onClick={() => setActiveTab('vulnerable')}
            className={`flex-1 py-4 px-2 font-bold text-[8px] md:text-xs flex flex-col items-center justify-center gap-1 transition-all ${activeTab === 'vulnerable' ? 'bg-red-700 text-white' : 'hover:bg-gray-50 text-gray-500'}`}
          >
            <CircleUsers size={16} />
            BẢO VỆ NHÓM DỄ BỊ TỔN THƯƠNG
          </button>
          <button 
            onClick={() => setActiveTab('public')}
            className={`flex-1 py-4 px-2 font-bold text-[8px] md:text-xs flex flex-col items-center justify-center gap-1 transition-all ${activeTab === 'public' ? 'bg-indigo-900 text-white' : 'hover:bg-gray-50 text-gray-500'}`}
          >
            <Globe size={16} />
            BẢO VỆ LỢI ÍCH CÔNG
          </button>
        </div>

        <div className="p-5 min-h-[250px]">
          {activeTab === 'vulnerable' ? (
            <div className="space-y-3 animate-in fade-in slide-in-from-left duration-500">
              {VULNERABLE_GROUPS.map((item, i) => (
                <div key={i} className="flex items-start gap-3 p-3 bg-gray-50 rounded-xl border border-transparent hover:border-red-100 transition-all">
                  <div className="mt-1 w-1.5 h-1.5 rounded-full bg-red-600 shrink-0" />
                  <span className="text-[11px] font-semibold text-gray-700 leading-snug">{item}</span>
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-3 animate-in fade-in slide-in-from-right duration-500">
              {PUBLIC_INTEREST_GROUPS.map((item, i) => (
                <div key={i} className="flex items-start gap-3 p-3 bg-gray-50 rounded-xl border border-transparent hover:border-indigo-100 transition-all">
                  <div className="mt-1 w-1.5 h-1.5 rounded-full bg-indigo-600 shrink-0" />
                  <span className="text-[11px] font-semibold text-gray-700 leading-snug">{item}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

    </div>
  );
};

// Import Users as CircleUsers to avoid conflict with standard lucide usage if needed
import { Users as CircleUsers } from 'lucide-react';
