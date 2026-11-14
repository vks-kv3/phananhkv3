
import React, { useEffect, useState, useRef } from 'react';
import { Report, ReportStatus, ReportTargetType, Attachment } from '../types';
import { Scale, Users, FileCheck, AlertTriangle, MessageSquare, Eye, PieChart, TrendingUp, Filter, ChevronRight, CheckCircle, Paperclip, File, Image as ImageIcon, Film, Download, RefreshCcw, UserX, MapPin, Send, X, Plus, LogOut } from 'lucide-react';
import { getAllReports, updateReportStatus as dbUpdateStatus, subscribeToReports } from '../services/storageService';
import { auth } from '../firebase';
import { useNavigate } from 'react-router-dom';

export const AdminDashboard = () => {
  const navigate = useNavigate();
  const [reports, setReports] = useState<Report[]>([]);
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);
  const [loading, setLoading] = useState(true);
  const [resResponse, setResResponse] = useState('');
  const [resAttachments, setResAttachments] = useState<Attachment[]>([]);
  const resFileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const unsubscribe = subscribeToReports((data) => {
      setReports(data);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

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
    setResAttachments([...resAttachments, ...newAttachments]);
    if (resFileInputRef.current) resFileInputRef.current.value = '';
  };

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = error => reject(error);
    });
  };

  const removeResAttachment = (index: number) => {
    setResAttachments(resAttachments.filter((_, i) => i !== index));
  };

  const handleUpdateStatus = async (reportId: string, newStatus: ReportStatus) => {
    const trackingCode = reports.find(r => r.id === reportId)?.trackingCode;
    if (newStatus === ReportStatus.RESOLVED && !resResponse.trim()) {
      alert("Vui lòng nhập nội dung trả lời giải quyết cho người dân.");
      return;
    }

    try {
      const resolutionAttachments = newStatus === ReportStatus.RESOLVED ? resAttachments : undefined;
      await dbUpdateStatus(reportId, newStatus, newStatus === ReportStatus.RESOLVED ? resResponse : undefined, resolutionAttachments, trackingCode);
      
      const updatedReports = reports.map(report => 
        report.id === reportId ? { 
          ...report, 
          status: newStatus, 
          resolutionResponse: newStatus === ReportStatus.RESOLVED ? resResponse : report.resolutionResponse,
          resolutionAttachments: newStatus === ReportStatus.RESOLVED ? resAttachments : report.resolutionAttachments
        } : report
      );
      setReports(updatedReports);
      
      // Nếu trạng thái là Đã giải quyết (Hoàn tất), đóng modal để quay lại danh sách
      if (newStatus === ReportStatus.RESOLVED) {
        setSelectedReport(null);
      } else if (selectedReport && selectedReport.id === reportId) {
        // Fix: Removed the ternary comparisons on newStatus === ReportStatus.RESOLVED 
        // because TypeScript knows newStatus is narrowed to (PENDING | PROCESSING) in this else branch.
        setSelectedReport({ 
          ...selectedReport, 
          status: newStatus
        });
      }
      
      setResResponse('');
      setResAttachments([]);
    } catch (error) {
      alert("Không thể cập nhật trạng thái đơn.");
    }
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

  const downloadFile = (file: Attachment) => {
    const link = document.createElement('a');
    link.href = file.data;
    link.download = file.name;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const stats = [
    { label: 'Chờ tiếp nhận', count: reports.filter(r => r.status === ReportStatus.PENDING).length, color: 'text-amber-600', bg: 'bg-amber-50', icon: <AlertTriangle size={20} /> },
    { label: 'Đang xử lý', count: reports.filter(r => r.status === ReportStatus.PROCESSING).length, color: 'text-blue-600', bg: 'bg-blue-50', icon: <TrendingUp size={20} /> },
    { label: 'Đã giải quyết', count: reports.filter(r => r.status === ReportStatus.RESOLVED).length, color: 'text-green-600', bg: 'bg-green-50', icon: <FileCheck size={20} /> },
  ];

  const handleLogout = async () => {
    await auth.signOut();
    sessionStorage.removeItem('isLoggedIn');
    navigate('/login');
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 space-y-4">
        <RefreshCcw className="animate-spin text-red-700" size={32} />
        <p className="text-xs font-black uppercase text-gray-400">Đang tải dữ liệu từ hệ thống...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-10">
      <div className="flex items-center justify-between">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-black text-gray-900 uppercase tracking-tight">Hệ thống quản trị</h1>
          <p className="text-xs text-gray-500 font-medium">Viện kiểm sát nhân dân khu vực 3</p>
        </div>
        <button 
          onClick={handleLogout}
          className="p-3 bg-white border border-gray-100 rounded-2xl text-gray-400 hover:text-red-700 hover:bg-red-50 transition-all shadow-sm"
          title="Đăng xuất"
        >
          <LogOut size={20} />
        </button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="col-span-2 md:col-span-1 bg-red-900 text-white p-6 rounded-[2rem] shadow-xl flex items-center justify-between relative overflow-hidden">
          <div className="relative z-10">
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-red-200 mb-1">Tổng số đơn phản ánh</p>
            <p className="text-5xl font-black tracking-tighter">{reports.length}</p>
          </div>
          <div className="bg-white/10 p-4 rounded-3xl relative z-10">
            <PieChart size={40} className="text-red-200" />
          </div>
          <div className="absolute top-0 right-0 w-40 h-40 bg-white/5 rounded-full -mr-10 -mt-10" />
        </div>

        {stats.map((stat, i) => (
          <div key={i} className={`bg-white p-5 rounded-[2rem] border border-gray-100 shadow-sm flex flex-col gap-3 ${i === 2 ? 'col-span-2 md:col-span-1' : ''}`}>
            <div className={`w-10 h-10 rounded-2xl ${stat.bg} flex items-center justify-center ${stat.color}`}>
              {stat.icon}
            </div>
            <div>
              <p className="text-[9px] font-black text-gray-400 uppercase tracking-wider">{stat.label}</p>
              <p className="text-2xl font-black text-gray-900">{stat.count}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between px-2">
          <h3 className="text-sm font-black text-gray-900 uppercase tracking-tight flex items-center gap-2">
            <Filter size={16} className="text-red-700" />
            Danh sách vụ việc
          </h3>
        </div>

        <div className="space-y-3 md:space-y-0 md:grid md:grid-cols-2 md:gap-3">
          {reports.length === 0 ? (
            <div className="md:col-span-2 text-center py-10 bg-white rounded-3xl border border-dashed border-gray-200">
              <p className="text-xs text-gray-400 font-bold uppercase">Chưa có dữ liệu phản ánh</p>
            </div>
          ) : (
            reports.map((report) => (
              <div 
                key={report.id}
                onClick={() => {
                  setSelectedReport(report);
                  setResResponse(report.resolutionResponse || '');
                  setResAttachments(report.resolutionAttachments || []);
                }}
                className={`bg-white p-4 rounded-2xl border transition-all cursor-pointer flex items-center gap-4 ${selectedReport?.id === report.id ? 'border-red-600 shadow-md ring-1 ring-red-500/10' : 'border-gray-100 shadow-sm hover:border-gray-300'}`}
              >
                <div className={`w-10 h-10 rounded-xl shrink-0 flex items-center justify-center font-black text-xs ${report.targetType === ReportTargetType.VULNERABLE ? 'bg-red-50 text-red-700' : 'bg-indigo-50 text-indigo-700'}`}>
                  {report.targetType === ReportTargetType.VULNERABLE ? 'V' : 'P'}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h4 className="text-xs font-black text-gray-900 truncate uppercase">{report.title}</h4>
                    {report.attachments && report.attachments.length > 0 && <Paperclip size={10} className="text-gray-400" />}
                  </div>
                  <p className="text-[9px] text-gray-400 font-medium truncate">{report.citizenName} • {new Date(report.createdAt).toLocaleDateString('vi-VN')}</p>
                </div>
                <ChevronRight size={16} className="text-gray-300" />
              </div>
            ))
          )}
        </div>
      </div>

      {selectedReport && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-end md:items-center justify-center p-4" onClick={() => setSelectedReport(null)}>
          <div 
            className="bg-white w-full max-w-[440px] md:max-w-3xl rounded-t-[3rem] md:rounded-[3rem] p-8 space-y-6 max-h-[85vh] overflow-y-auto animate-in slide-in-from-bottom duration-500 shadow-2xl"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex justify-between items-start border-b pb-4">
              <div className="space-y-1">
                <span className={`text-[9px] font-black uppercase tracking-[0.2em] px-2 py-0.5 rounded ${
                  selectedReport.status === ReportStatus.PENDING ? 'bg-amber-100 text-amber-700' :
                  selectedReport.status === ReportStatus.PROCESSING ? 'bg-blue-100 text-blue-700' :
                  'bg-green-100 text-green-700'
                }`}>
                  {selectedReport.status}
                </span>
                <h3 className="text-xl font-black text-gray-900 uppercase leading-tight mt-2">{selectedReport.title}</h3>
                {selectedReport.trackingCode && (
                  <p className="text-[10px] text-gray-500 font-mono">Mã tra cứu: <b className="text-gray-800">{selectedReport.trackingCode}</b></p>
                )}
              </div>
              <button onClick={() => setSelectedReport(null)} className="p-2 bg-gray-50 rounded-full text-gray-400 hover:text-gray-900 transition-colors font-bold text-xl">×</button>
            </div>

            <div className="space-y-4">
              {/* AI Summary Section */}
              <div className="bg-red-50 p-4 rounded-2xl space-y-2 border border-red-100">
                <div className="flex items-center gap-2 text-[10px] font-black text-red-800 uppercase tracking-widest">
                  <MessageSquare size={14} /> AI Phân tích & Tóm tắt
                </div>
                <p className="text-[11px] text-red-900 leading-relaxed italic whitespace-pre-wrap">
                  {selectedReport.aiSummary || "Đang phân tích..."}
                </p>
              </div>

              {/* Citizen Info & Target Info */}
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-3">
                  <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Người gửi phản ánh</p>
                  <div className="space-y-1">
                    <p className="text-xs font-bold text-gray-800">{selectedReport.citizenName}</p>
                    <p className="text-[10px] text-gray-500">{selectedReport.phoneNumber}</p>
                    <p className="text-[10px] text-gray-500 italic">{selectedReport.address}</p>
                  </div>
                </div>
                <div className="space-y-3 border-l pl-4">
                  <p className="text-[9px] font-black text-red-400 uppercase tracking-widest flex items-center gap-1">
                    <UserX size={10} /> Đối tượng bị phản ánh
                  </p>
                  <div className="space-y-1">
                    <p className="text-xs font-bold text-red-900 uppercase">{selectedReport.targetName}</p>
                    <div className="flex items-start gap-1">
                       <MapPin size={10} className="mt-0.5 text-gray-400 shrink-0" />
                       <p className="text-[10px] text-gray-500 leading-tight">{selectedReport.targetAddress}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Description */}
              <div className="space-y-1">
                <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Nội dung chi tiết</p>
                <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100">
                  <p className="text-[11px] text-gray-600 leading-relaxed whitespace-pre-wrap">{selectedReport.description}</p>
                </div>
              </div>

              {/* Attachments (Citizen's) - Di chuyển lên sau nội dung chi tiết */}
              <div className="space-y-2">
                <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-1">
                  <Paperclip size={12} /> Chứng cứ từ người dân ({selectedReport.attachments?.length || 0})
                </p>
                {selectedReport.attachments && selectedReport.attachments.length > 0 ? (
                  <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                    {selectedReport.attachments.map((file, idx) => (
                      <div key={idx} className="flex items-center gap-3 p-3 bg-white border border-gray-100 rounded-xl hover:border-red-100 transition-all">
                        <div className="shrink-0">{getFileIcon(file.type)}</div>
                        <div className="flex-1 min-w-0">
                          <p className="text-[10px] font-bold text-gray-700 truncate">{file.name}</p>
                          <p className="text-[8px] text-gray-400 font-mono uppercase">{formatFileSize(file.size)}</p>
                        </div>
                        <button 
                          onClick={() => downloadFile(file)}
                          className="p-2 bg-gray-50 rounded-lg text-gray-400 hover:text-red-700 transition-colors"
                        >
                          <Download size={14} />
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-[10px] text-gray-400 italic px-2">Không có tài liệu đính kèm.</p>
                )}
              </div>

              {/* Resolution Response Textarea for Prosecutors */}
              {selectedReport.status === ReportStatus.PROCESSING && (
                <div className="space-y-4 animate-in slide-in-from-top duration-300">
                  <div className="space-y-2">
                    <p className="text-[9px] font-black text-green-700 uppercase tracking-widest flex items-center gap-1">
                      <MessageSquare size={12} /> Nội dung trả lời giải quyết
                    </p>
                    <textarea 
                      rows={4}
                      value={resResponse}
                      onChange={(e) => setResResponse(e.target.value)}
                      placeholder="Nhập kết quả xử lý, căn cứ pháp lý áp dụng để thông báo cho người dân..."
                      className="w-full p-4 bg-white border-2 border-green-300 focus:border-green-500 rounded-2xl text-[11px] font-medium outline-none focus:ring-2 focus:ring-green-500 transition-all resize-none"
                    />
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <p className="text-[9px] font-black text-green-700 uppercase tracking-widest flex items-center gap-1">
                        <Paperclip size={12} /> Văn bản giải quyết (Không bắt buộc)
                      </p>
                    </div>
                    
                    <input 
                      type="file" 
                      multiple 
                      hidden 
                      ref={resFileInputRef} 
                      onChange={handleFileChange}
                    />
                    
                    <div className="flex flex-wrap gap-2">
                      <button 
                        type="button"
                        onClick={() => resFileInputRef.current?.click()}
                        className="w-10 h-10 rounded-xl bg-green-100 text-green-700 flex items-center justify-center hover:bg-green-200 transition-colors"
                      >
                        <Plus size={20} />
                      </button>
                      
                      {resAttachments.map((file, idx) => (
                        <div key={idx} className="h-10 px-3 bg-white border border-green-100 rounded-xl flex items-center gap-2 group relative">
                          {getFileIcon(file.type)}
                          <span className="text-[9px] font-bold max-w-[80px] truncate">{file.name}</span>
                          <button 
                            onClick={() => removeResAttachment(idx)}
                            className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <X size={10} />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Show previous resolution if resolved */}
              {selectedReport.status === ReportStatus.RESOLVED && (
                <div className="space-y-4">
                  {selectedReport.resolutionResponse && (
                    <div className="space-y-2">
                      <p className="text-[9px] font-black text-green-700 uppercase tracking-widest">Nội dung đã trả lời</p>
                      <div className="bg-green-50 p-4 rounded-2xl border border-green-100">
                        <p className="text-[11px] text-green-900 leading-relaxed">{selectedReport.resolutionResponse}</p>
                      </div>
                    </div>
                  )}
                  
                  {selectedReport.resolutionAttachments && selectedReport.resolutionAttachments.length > 0 && (
                    <div className="space-y-2">
                      <p className="text-[9px] font-black text-green-700 uppercase tracking-widest">Văn bản giải quyết</p>
                      <div className="space-y-2">
                        {selectedReport.resolutionAttachments.map((file, idx) => (
                          <div key={idx} className="flex items-center gap-3 p-3 bg-white border border-green-100 rounded-xl">
                            {getFileIcon(file.type)}
                            <div className="flex-1 min-w-0">
                              <p className="text-[10px] font-bold text-gray-700 truncate">{file.name}</p>
                            </div>
                            <button onClick={() => downloadFile(file)} className="text-green-700"><Download size={14} /></button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex flex-col gap-2 pt-4">
                <button 
                  onClick={() => handleUpdateStatus(selectedReport.id, ReportStatus.PROCESSING)}
                  disabled={selectedReport.status === ReportStatus.PROCESSING || selectedReport.status === ReportStatus.RESOLVED}
                  className={`w-full py-4 font-black rounded-2xl text-[10px] uppercase tracking-widest transition-all shadow-lg ${
                    selectedReport.status === ReportStatus.PROCESSING || selectedReport.status === ReportStatus.RESOLVED
                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed shadow-none'
                    : 'bg-red-900 text-white shadow-red-100 hover:bg-red-800'
                  }`}
                >
                  Tiếp nhận xử lý
                </button>
                
                {(selectedReport.status === ReportStatus.PROCESSING) && (
                  <button 
                    onClick={() => handleUpdateStatus(selectedReport.id, ReportStatus.RESOLVED)}
                    className="w-full py-4 bg-green-600 text-white font-black rounded-2xl text-[10px] uppercase tracking-widest shadow-lg shadow-green-100 hover:bg-green-700 flex items-center justify-center gap-2"
                  >
                    <CheckCircle size={16} />
                    Hoàn tất & Trả lời
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
