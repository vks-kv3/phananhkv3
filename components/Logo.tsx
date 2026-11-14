
import React from 'react';
import { Scale } from 'lucide-react';

export const Logo: React.FC<{ size?: number; className?: string }> = ({ size = 48, className = "" }) => {
  return (
    <div 
      className={`relative flex items-center justify-center transition-all duration-500 hover:rotate-3 group ${className}`} 
      style={{ width: size, height: size }}
    >
      {/* Lớp nền phù hiệu hình tròn màu đỏ đậm đặc trưng của ngành */}
      <div className="absolute inset-0 bg-gradient-to-br from-red-700 to-red-900 rounded-full border-[3px] border-yellow-500 shadow-xl flex items-center justify-center overflow-hidden">
        {/* Hiệu ứng ánh kim giả lập */}
        <div className="absolute top-0 left-0 w-full h-1/2 bg-white/10 -skew-y-12 transform origin-top-left"></div>
        
        {/* Biểu tượng Cán cân công lý màu vàng nhạt */}
        <Scale 
          size={size * 0.55} 
          className="text-yellow-200 relative z-10 drop-shadow-[0_2px_3px_rgba(0,0,0,0.5)]" 
          strokeWidth={2.5}
        />
      </div>
      
      {/* Vòng trang trí bên ngoài cho các kích thước lớn */}
      {size > 60 && (
        <div className="absolute inset-[-6px] border border-yellow-500/20 rounded-full group-hover:scale-110 transition-transform duration-700"></div>
      )}
    </div>
  );
};
