import React from 'react';

// Phù hiệu Viện kiểm sát nhân dân (ảnh trong thư mục public/logo.png).
// Đường dẫn tương đối để chạy đúng cả trên GitHub Pages (/phananhkv3/) lẫn khi chạy thử ở gốc.
export const Logo: React.FC<{ size?: number; className?: string }> = ({ size = 48, className = "" }) => {
  return (
    <img
      src="./logo.png"
      alt="Phù hiệu Viện kiểm sát nhân dân"
      width={size}
      height={size}
      className={`object-contain select-none ${className}`}
      style={{ width: size, height: size }}
      draggable={false}
    />
  );
};
