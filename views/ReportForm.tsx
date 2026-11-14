
import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Send, CheckCircle2, User, UserX, FileText, AlertCircle, Info, Paperclip, X, File, Image as ImageIcon, Film, MapPin } from 'lucide-react';
import { ReportTargetType, ReportStatus, VULNERABLE_GROUPS, PUBLIC_INTEREST_GROUPS, Report, Attachment } from '../types';
import { analyzeReport } from '../services/geminiService';
import { saveReport } from '../services/storageService';

export const ReportForm: React.FC = () => {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [validationError, setValidationError] = useState<string | null>(null);
  
  const [formData, setFormData] = useState<Partial<Report>>({
    targetType: undefined,
    reporterRole: 'Bản thân',
    subCategory: '',
    citizenName: '',
    birthYear: '',
    address: '',
    phoneNumber: '',
    email: '',
    targetName: '',
    targetAddress: '',
    title: '',
    description: '',
  });

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    const newAttachments: Attachment[] = [];
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const base64 = await fileToBase64(file);
      newAttachments.push({
        name: file.name,
        type: file.type,
        size: file.size,
        data: base64
      });
    }
    setAttachments([...attachments, ...newAttachments]);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = error => reject(error);
    });
  };

  const removeAttachment = (index: number) => {
    setAttachments(attachments.filter((_, i) => i !== index));
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getFileIcon = (type: string) => {
    if (type.startsWith('image/')) return <ImageIcon size={16} className="text-blue-500" />;
    if (type.startsWith('video/')) return <Film size={16} className="text-purple-500" />;
    return <File size={16} className="text-gray-500" />;
  };

  const isNumeric = (val: string) => /^\d+$/.test(val);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError(null);

    // 1. Xác thực bắt buộc cho Mục tiêu bảo vệ
    if (!formData.targetType) {
      setValidationError("Vui lòng chọn Mục tiêu bảo vệ.");
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    if (!formData.subCategory || formData.subCategory === "") {
      setValidationError("Vui lòng chọn Danh mục chi tiết của vụ việc.");
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    // 2. Xác thực Năm sinh (chỉ chứa số)
    if (formData.birthYear && !isNumeric(formData.birthYear)) {
      setValidationError("Ô Năm sinh không chứa ký tự chữ.");
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    // 3. Xác thực Số điện thoại (chỉ chứa số)
    if (formData.phoneNumber && !isNumeric(formData.phoneNumber)) {
      setValidationError("Ô Số điện thoại không chứa ký tự chữ.");
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    setLoading(true);

    try {
      const aiSummary = await analyzeReport(formData);
      
      const newReport: Report = {
        ...formData as any,
        id: Math.random().toString(36).substr(2, 9),
        status: ReportStatus.PENDING,
        createdAt: new Date().toISOString(),
        aiSummary: aiSummary,
        attachments: attachments,
      };

      await saveReport(newReport);

      setSubmitted(true);
      // Removed the auto-navigate to /my-reports as it's not implemented yet
      // setTimeout(() => navigate('/'), 3000);
    } catch (err) {
      console.error("Lỗi khi gửi phản ánh:", err);
      alert("Có lỗi xảy ra khi lưu dữ liệu. Vui lòng thử lại.");
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <div className="flex flex-col items-center justify-center py-20 space-y-6 text-center animate-in fade-in zoom-in duration-500">
        <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center shadow-lg">
          <CheckCircle2 size={40} className="text-green-600" />
        </div>
        <h2 className="text-2xl font-black text-gray-900 uppercase tracking-tight">Tiếp nhận thành công!</h2>
        <p className="text-sm text-gray-500 px-6">Thông tin phản ánh và tài liệu đính kèm đã được lưu trữ an toàn trên hệ thống.</p>
        <button 
          onClick={() => navigate('/')}
          className="px-8 py-4 bg-red-900 text-white font-black rounded-2xl uppercase tracking-widest text-xs shadow-xl shadow-red-100"
        >
          Quay lại trang chủ
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="text-center pt-4">
        <h1 className="text-xl font-black text-gray-900 uppercase tracking-widest">Nội dung phản ánh</h1>
        <div className="h-1 w-12 bg-red-600 mx-auto mt-2 rounded-full" />
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {validationError && (
          <div className="bg-red-50 border border-red-200 p-4 rounded-2xl flex items-center gap-3 text-red-700 text-[11px] font-bold animate-in fade-in zoom-in">
            <AlertCircle size={18} className="shrink-0" />
            {validationError}
          </div>
        )}

        {/* Step 1: Mục tiêu bảo vệ - BẮT BUỘC */}
        <div className={`bg-white p-5 rounded-[2rem] shadow-sm border transition-all space-y-5 ${validationError && !formData.targetType ? 'border-red-500 ring-2 ring-red-100' : 'border-gray-100'}`}>
          <div className="flex justify-between items-center">
            <h3 className="text-sm font-black flex items-center gap-2 text-red-800 uppercase tracking-wider">
              <Info size={18} /> Mục tiêu bảo vệ <span className="text-red-600">*</span>
            </h3>
            <span className="text-[9px] font-black text-white uppercase tracking-widest bg-red-600 px-2 py-0.5 rounded-full">Bắt buộc</span>
          </div>
          
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => {
                setFormData({ ...formData, targetType: ReportTargetType.VULNERABLE, subCategory: '' });
                setValidationError(null);
              }}
              className={`p-4 rounded-2xl border-2 text-center transition-all flex flex-col items-center justify-center gap-2 ${formData.targetType === ReportTargetType.VULNERABLE ? 'border-red-600 bg-red-50 shadow-inner' : 'border-gray-50 bg-gray-50'}`}
            >
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${formData.targetType === ReportTargetType.VULNERABLE ? 'bg-red-600 text-white' : 'bg-gray-200 text-gray-400'}`}>1</div>
              <div className="font-bold text-[9px] text-gray-900 uppercase leading-tight">Nhóm dễ bị<br/>tổn thương</div>
            </button>
            <button
              type="button"
              onClick={() => {
                setFormData({ ...formData, targetType: ReportTargetType.PUBLIC_INTEREST, subCategory: '' });
                setValidationError(null);
              }}
              className={`p-4 rounded-2xl border-2 text-center transition-all flex flex-col items-center justify-center gap-2 ${formData.targetType === ReportTargetType.PUBLIC_INTEREST ? 'border-indigo-600 bg-indigo-50 shadow-inner' : 'border-gray-50 bg-gray-50'}`}
            >
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${formData.targetType === ReportTargetType.PUBLIC_INTEREST ? 'bg-indigo-600 text-white' : 'bg-gray-200 text-gray-400'}`}>2</div>
              <div className="font-bold text-[9px] text-gray-900 uppercase leading-tight">Lợi ích<br/>công cộng</div>
            </button>
          </div>

          <div className="space-y-2">
            <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest">
              Danh mục chi tiết <span className="text-red-600">*</span>
            </label>
            <select 
              value={formData.subCategory}
              disabled={!formData.targetType}
              onChange={(e) => {
                setFormData({...formData, subCategory: e.target.value});
                setValidationError(null);
              }}
              className={`w-full p-3 bg-gray-50 border rounded-xl text-xs font-semibold focus:ring-2 focus:ring-red-500 outline-none transition-all ${!formData.targetType ? 'opacity-50 cursor-not-allowed' : 'border-gray-100 hover:border-gray-300'} ${validationError && !formData.subCategory && formData.targetType ? 'border-red-500' : ''}`}
            >
              <option value="" disabled>--- Vui lòng chọn danh mục chi tiết ---</option>
              {formData.targetType === ReportTargetType.VULNERABLE 
                ? VULNERABLE_GROUPS.map(g => <option key={g} value={g}>{g}</option>)
                : formData.targetType === ReportTargetType.PUBLIC_INTEREST 
                  ? PUBLIC_INTEREST_GROUPS.map(g => <option key={g} value={g}>{g}</option>)
                  : null
              }
            </select>
          </div>
        </div>

        {/* Step 2: Người phản ánh */}
        <div className="bg-white p-5 rounded-[2rem] shadow-sm border border-gray-100 space-y-5">
          <h3 className="text-sm font-black flex items-center gap-2 text-gray-800 uppercase tracking-wider">
            <User size={18} className="text-red-700" /> Người phản ánh <span className="text-red-600">*</span>
          </h3>
          <div className="space-y-4">
            <input required type="text" placeholder="Họ và tên" value={formData.citizenName} onChange={(e) => setFormData({...formData, citizenName: e.target.value})} className="w-full p-3 bg-gray-50 border border-gray-100 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-red-500 outline-none" />
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <input 
                  required 
                  type="text" 
                  inputMode="numeric"
                  placeholder="Năm sinh" 
                  value={formData.birthYear} 
                  onChange={(e) => {
                    setFormData({...formData, birthYear: e.target.value});
                    if (validationError) setValidationError(null);
                  }} 
                  className={`w-full p-3 bg-gray-50 border rounded-xl text-xs font-semibold focus:ring-2 focus:ring-red-500 outline-none transition-all ${validationError?.includes("Năm sinh") ? 'border-red-500 bg-red-50' : 'border-gray-100'}`} 
                />
              </div>
              <div className="space-y-1">
                <input 
                  required 
                  type="text" 
                  inputMode="tel"
                  placeholder="SĐT liên hệ" 
                  value={formData.phoneNumber} 
                  onChange={(e) => {
                    setFormData({...formData, phoneNumber: e.target.value});
                    if (validationError) setValidationError(null);
                  }} 
                  className={`w-full p-3 bg-gray-50 border rounded-xl text-xs font-semibold focus:ring-2 focus:ring-red-500 outline-none transition-all ${validationError?.includes("Số điện thoại") ? 'border-red-500 bg-red-50' : 'border-gray-100'}`} 
                />
              </div>
            </div>
            <input required type="text" placeholder="Địa chỉ thường trú" value={formData.address} onChange={(e) => setFormData({...formData, address: e.target.value})} className="w-full p-3 bg-gray-50 border border-gray-100 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-red-500 outline-none" />
          </div>
        </div>

        {/* New Step: Người bị phản ánh */}
        <div className="bg-white p-5 rounded-[2rem] shadow-sm border border-gray-100 space-y-5">
          <h3 className="text-sm font-black flex items-center gap-2 text-gray-800 uppercase tracking-wider">
            <UserX size={18} className="text-red-700" /> Đối tượng bị phản ánh <span className="text-red-600">*</span>
          </h3>
          <div className="space-y-4">
            <div className="relative">
              <input required type="text" placeholder="Tên cơ quan, tổ chức hoặc cá nhân" value={formData.targetName} onChange={(e) => setFormData({...formData, targetName: e.target.value})} className="w-full p-3 bg-gray-50 border border-gray-100 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-red-500 outline-none" />
            </div>
            <div className="relative">
              <MapPin size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input required type="text" placeholder="Địa chỉ của đối tượng bị phản ánh" value={formData.targetAddress} onChange={(e) => setFormData({...formData, targetAddress: e.target.value})} className="w-full pl-10 pr-3 py-3 bg-gray-50 border border-gray-100 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-red-500 outline-none" />
            </div>
          </div>
        </div>

        {/* Step 3: Nội dung */}
        <div className="bg-white p-5 rounded-[2rem] shadow-sm border border-gray-100 space-y-5">
          <h3 className="text-sm font-black flex items-center gap-2 text-gray-800 uppercase tracking-wider">
            <FileText size={18} className="text-red-700" /> Chi tiết vụ việc <span className="text-red-600">*</span>
          </h3>
          <div className="space-y-4">
            <input required type="text" placeholder="Tiêu đề phản ánh" value={formData.title} onChange={(e) => setFormData({...formData, title: e.target.value})} className="w-full p-3 bg-gray-50 border border-gray-100 rounded-xl text-xs font-black focus:ring-2 focus:ring-red-500 outline-none" />
            <textarea required rows={5} placeholder="Mô tả chi tiết hành vi, thời gian, địa điểm..." value={formData.description} onChange={(e) => setFormData({...formData, description: e.target.value})} className="w-full p-3 bg-gray-50 border border-gray-100 rounded-xl text-xs font-medium focus:ring-2 focus:ring-red-500 outline-none resize-none leading-relaxed" />
          </div>
        </div>

        {/* Step 4: Tài liệu đính kèm - KHÔNG BẮT BUỘC */}
        <div className="bg-white p-5 rounded-[2rem] shadow-sm border border-gray-100 space-y-5">
          <div className="flex justify-between items-center">
            <h3 className="text-sm font-black flex items-center gap-2 text-gray-800 uppercase tracking-wider">
              <Paperclip size={18} className="text-red-700" /> Tài liệu chứng cứ
            </h3>
            <span className="text-[9px] font-black text-gray-500 uppercase tracking-widest bg-gray-100 px-2 py-0.5 rounded-full">Không bắt buộc</span>
          </div>

          <div className="space-y-4">
            <input 
              type="file" 
              multiple 
              className="hidden" 
              ref={fileInputRef}
              onChange={handleFileChange}
              accept="*/*"
            />
            <button 
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="w-full py-6 border-2 border-dashed border-gray-200 rounded-[2rem] flex flex-col items-center justify-center gap-2 hover:border-red-300 hover:bg-red-50 transition-all text-gray-400 group"
            >
              <Paperclip size={32} className="group-hover:text-red-600 transition-colors" />
              <div className="text-center">
                <span className="text-[11px] font-black uppercase tracking-widest block text-gray-600">Nhấn để đính kèm chứng cứ</span>
                <span className="text-[9px] font-medium text-gray-400">Hỗ trợ Video, Hình ảnh, Tài liệu...</span>
              </div>
            </button>

            {attachments.length > 0 && (
              <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                {attachments.map((file, idx) => (
                  <div key={idx} className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl border border-gray-100 animate-in slide-in-from-left duration-200">
                    <div className="shrink-0">
                      {getFileIcon(file.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[10px] font-bold text-gray-700 truncate">{file.name}</p>
                      <p className="text-[8px] text-gray-400 font-mono">{formatFileSize(file.size)}</p>
                    </div>
                    <button 
                      type="button" 
                      onClick={() => removeAttachment(idx)}
                      className="p-1 hover:bg-red-100 rounded-full text-gray-400 hover:text-red-600 transition-colors"
                    >
                      <X size={14} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="p-4 bg-red-50 rounded-2xl flex gap-3 border border-red-100">
          <AlertCircle className="text-red-600 shrink-0" size={16} />
          <p className="text-[10px] text-red-800 leading-tight font-bold italic">
            Người phản ánh chịu trách nhiệm trước pháp luật về tính trung thực của chứng cứ và thông tin đã cung cấp.
          </p>
        </div>

        <button 
          disabled={loading}
          type="submit"
          className={`w-full py-5 bg-red-900 text-white font-black rounded-[2rem] shadow-xl hover:bg-red-800 transition-all flex items-center justify-center gap-2 tracking-widest uppercase text-sm ${loading ? 'opacity-70 cursor-not-allowed' : ''}`}
        >
          {loading ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Send size={20} />}
          {loading ? 'Đang xử lý tài liệu...' : 'GỬI PHẢN ÁNH'}
        </button>
      </form>
    </div>
  );
};
