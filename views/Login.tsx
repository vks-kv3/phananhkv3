
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Lock, User, AlertCircle, ArrowLeft, LogIn } from 'lucide-react';
import { Logo } from '../components/Logo';
import { signInWithPopup, GoogleAuthProvider } from 'firebase/auth';
import { auth } from '../firebase';

export const Login: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleGoogleLogin = async () => {
    setLoading(true);
    setError('');
    const provider = new GoogleAuthProvider();
    try {
      const result = await signInWithPopup(auth, provider);
      const user = result.user;
      
      // Kiểm tra xem email có phải là admin không
      if (user.email === 'vksndthixabadon@gmail.com') {
        sessionStorage.setItem('isLoggedIn', 'true');
        navigate('/admin');
      } else {
        setError('Tài khoản của bạn không có quyền truy cập hệ thống quản trị.');
        await auth.signOut();
      }
    } catch (err: any) {
      console.error("Lỗi đăng nhập:", err);
      setError('Có lỗi xảy ra khi đăng nhập. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[70vh] flex items-center justify-center">
      <div className="w-full md:max-w-md space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
        <div className="text-center space-y-4">
          <div className="inline-flex p-4 bg-white rounded-3xl shadow-xl border border-red-50">
            <Logo size={80} />
          </div>
          <div className="space-y-1">
            <h1 className="text-xl font-black text-gray-900 uppercase tracking-tighter">Cổng cán bộ nghiệp vụ</h1>
            <p className="text-[10px] font-bold text-red-700 uppercase tracking-[0.3em]">Hệ thống quản lý nội bộ</p>
          </div>
        </div>

        <div className="bg-white p-8 rounded-[2.5rem] shadow-xl border border-gray-100 relative overflow-hidden">
          {/* Decorative element */}
          <div className="absolute top-0 right-0 w-24 h-24 bg-red-50 rounded-full -mr-12 -mt-12 opacity-50" />
          
          <div className="space-y-6 relative z-10">
            {error && (
              <div className="p-4 bg-red-50 border border-red-100 rounded-2xl flex items-center gap-3 text-red-800 text-[11px] font-bold animate-in fade-in zoom-in">
                <AlertCircle size={18} className="shrink-0" />
                {error}
              </div>
            )}

            <div className="text-center space-y-4">
              <p className="text-xs text-gray-500 font-medium">
                Sử dụng tài khoản Google công vụ để đăng nhập vào hệ thống quản trị.
              </p>
              
              <button
                onClick={handleGoogleLogin}
                disabled={loading}
                className="w-full py-4 bg-white border-2 border-gray-100 text-gray-700 font-black rounded-2xl shadow-sm hover:border-red-200 hover:bg-red-50 transition-all uppercase tracking-widest text-xs flex items-center justify-center gap-3"
              >
                {loading ? (
                  <div className="w-5 h-5 border-2 border-red-900/30 border-t-red-900 rounded-full animate-spin" />
                ) : (
                  <img src="https://www.gstatic.com/firebase/anonymous-scan.png" className="w-5 h-5 hidden" alt="" />
                )}
                <LogIn size={18} className="text-red-700" />
                {loading ? 'Đang xác thực...' : 'Đăng nhập với Google'}
              </button>
            </div>
          </div>
        </div>

        <button 
          onClick={() => navigate('/')}
          className="flex items-center justify-center gap-2 mx-auto text-gray-400 hover:text-red-700 transition-colors"
        >
          <ArrowLeft size={16} />
          <span className="text-[10px] font-black uppercase tracking-widest">Quay lại trang chủ</span>
        </button>
      </div>
    </div>
  );
};
