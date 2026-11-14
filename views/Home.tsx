
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, Globe, ArrowRight, Lightbulb } from 'lucide-react';
import { VULNERABLE_GROUPS, PUBLIC_INTEREST_GROUPS } from '../types';
import { Logo } from '../components/Logo';

export const Home: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col gap-6 md:grid md:grid-cols-2 md:gap-12 lg:gap-20 md:items-start md:min-h-[70vh]">
      {/* Điện thoại: 'contents' để các khối con xếp theo thứ tự order; máy tính: cột trái */}
      <div className="contents md:block md:space-y-6 md:sticky md:top-28">
      {/* Header Section */}
      <section className="order-1 text-center space-y-6 pt-4 pb-2">
        <div className="inline-flex items-center justify-center p-3 animate-in fade-in zoom-in duration-700">
          <Logo size={150} />
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
      <div className="order-3 flex flex-col items-center md:items-stretch py-4 md:max-w-lg md:mx-auto md:w-full">
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

      {/* Có thể bạn chưa biết: hiện đủ cả hai nhóm đối tượng được bảo vệ */}
      <section className="order-2 bg-white rounded-[2rem] shadow-lg border border-gray-100 overflow-hidden">
        <div className="bg-amber-50 border-b border-amber-100 px-5 py-4 flex gap-3 items-start">
          <Lightbulb size={22} className="text-amber-500 shrink-0 mt-0.5" />
          <div>
            <h2 className="font-black text-amber-800 uppercase tracking-wide text-sm md:text-base">Có thể bạn chưa biết</h2>
            <p className="text-[11px] text-amber-900/80 leading-relaxed mt-1">
              Viện kiểm sát nhân dân có thể đứng ra khởi kiện để bảo vệ quyền dân sự của nhóm dễ bị tổn thương và bảo vệ lợi ích công khi không có người khởi kiện. Cụ thể gồm các trường hợp sau:
            </p>
          </div>
        </div>

        <div className="p-5 space-y-6">
          <div className="space-y-3">
            <h3 className="flex items-center gap-2 font-black text-red-800 uppercase text-[11px] tracking-wide">
              <span className="w-7 h-7 rounded-full bg-red-700 text-white flex items-center justify-center shrink-0"><CircleUsers size={14} /></span>
              Bảo vệ nhóm dễ bị tổn thương, gồm:
            </h3>
            <div className="space-y-2">
              {VULNERABLE_GROUPS.map((item, i) => (
                <div key={i} className="flex items-start gap-3 p-3 bg-red-50/50 rounded-xl border border-red-100/60">
                  <div className="mt-1.5 w-1.5 h-1.5 rounded-full bg-red-600 shrink-0" />
                  <span className="text-[11px] font-semibold text-gray-700 leading-snug">{item}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-3">
            <h3 className="flex items-center gap-2 font-black text-indigo-900 uppercase text-[11px] tracking-wide">
              <span className="w-7 h-7 rounded-full bg-indigo-900 text-white flex items-center justify-center shrink-0"><Globe size={14} /></span>
              Bảo vệ lợi ích công, trong các lĩnh vực:
            </h3>
            <div className="space-y-2">
              {PUBLIC_INTEREST_GROUPS.map((item, i) => (
                <div key={i} className="flex items-start gap-3 p-3 bg-indigo-50/50 rounded-xl border border-indigo-100/60">
                  <div className="mt-1.5 w-1.5 h-1.5 rounded-full bg-indigo-600 shrink-0" />
                  <span className="text-[11px] font-semibold text-gray-700 leading-snug">{item}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

    </div>
  );
};

// Import Users as CircleUsers to avoid conflict with standard lucide usage if needed
import { Users as CircleUsers } from 'lucide-react';
