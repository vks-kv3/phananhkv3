import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Search, Clock, TrendingUp, CheckCircle2, AlertCircle, RefreshCcw } from 'lucide-react';
import { ReportStatus, TrackingRecord } from '../types';
import { getTrackingRecord, normalizeTrackingCode } from '../services/storageService';

const STEPS = [
  { status: ReportStatus.PENDING, label: 'Đã tiếp nhận', icon: Clock },
  { status: ReportStatus.PROCESSING, label: 'Đang xử lý', icon: TrendingUp },
  { status: ReportStatus.RESOLVED, label: 'Đã giải quyết', icon: CheckCircle2 },
];

const formatDate = (iso: string) => {
  const d = new Date(iso);
  return isNaN(d.getTime()) ? iso : d.toLocaleString('vi-VN', { dateStyle: 'short', timeStyle: 'short' });
};

export const TrackReport: React.FC = () => {
  const [searchParams] = useSearchParams();
  const [code, setCode] = useState(searchParams.get('ma') || '');
  const [loading, setLoading] = useState(false);
  const [record, setRecord] = useState<TrackingRecord | null>(null);
  const [error, setError] = useState<string | null>(null);

  const lookup = async (value: string) => {
    const normalized = normalizeTrackingCode(value);
    if (!/^KV3-[A-Z0-9]{4}-[A-Z0-9]{4}$/.test(normalized)) {
      setError('Mã tra cứu gồm 8 ký tự, có dạng KV3-XXXX-XXXX.');
      setRecord(null);
      return;
    }
    setCode(normalized);
    setLoading(true);
    setError(null);
    try {
      const result = await getTrackingRecord(normalized);
      setRecord(result);
      if (!result) setError('Không tìm thấy đơn phản ánh với mã này. Vui lòng kiểm tra lại.');
    } catch (e) {
      console.error(e);
      setRecord(null);
      setError('Hệ thống tra cứu đang gặp sự cố. Vui lòng thử lại sau.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const initial = searchParams.get('ma');
    if (initial) lookup(initial);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const currentStep = record ? STEPS.findIndex(s => s.status === record.status) : -1;

  return (
    <div className="space-y-6">
      <div className="text-center pt-4">
        <h1 className="text-xl font-black text-gray-900 uppercase tracking-widest">Tra cứu tiến độ</h1>
        <div className="h-1 w-12 bg-red-600 mx-auto mt-2 rounded-full" />
        <p className="text-[11px] text-gray-500 mt-3 px-4">Nhập mã tra cứu được cấp sau khi gửi phản ánh.</p>
      </div>

      <form
        onSubmit={e => { e.preventDefault(); lookup(code); }}
        className="bg-white p-5 rounded-[2rem] shadow-sm border border-gray-100 space-y-3"
      >
        <input
          value={code}
          onChange={e => setCode(e.target.value)}
          placeholder="KV3-XXXX-XXXX"
          autoCapitalize="characters"
          className="w-full p-4 bg-gray-50 rounded-2xl text-center text-lg font-black font-mono tracking-[0.15em] uppercase outline-none focus:ring-2 focus:ring-red-200"
        />
        <button
          type="submit"
          disabled={loading || !code.trim()}
          className="w-full py-4 bg-red-700 text-white rounded-2xl font-black uppercase tracking-widest text-xs flex items-center justify-center gap-2 disabled:opacity-50"
        >
          {loading ? <RefreshCcw size={16} className="animate-spin" /> : <Search size={16} />}
          Tra cứu
        </button>
      </form>

      {error && (
        <div className="bg-red-50 border border-red-200 p-4 rounded-2xl flex items-center gap-3 text-red-700 text-[11px] font-bold">
          <AlertCircle size={18} className="shrink-0" />
          {error}
        </div>
      )}

      {record && (
        <div className="bg-white p-5 rounded-[2rem] shadow-sm border border-gray-100 space-y-5">
          <div className="flex justify-between text-[10px] text-gray-500">
            <span>Gửi lúc: <b className="text-gray-700">{formatDate(record.createdAt)}</b></span>
            <span>Cập nhật: <b className="text-gray-700">{formatDate(record.updatedAt)}</b></span>
          </div>

          <div className="flex items-start justify-between">
            {STEPS.map((step, i) => {
              const Icon = step.icon;
              const done = i <= currentStep;
              return (
                <div key={step.status} className="flex-1 flex flex-col items-center gap-2 relative">
                  {i > 0 && (
                    <div className={`absolute top-5 right-1/2 w-full h-1 -z-0 ${i <= currentStep ? 'bg-red-600' : 'bg-gray-200'}`} />
                  )}
                  <div className={`relative z-10 w-10 h-10 rounded-full flex items-center justify-center ${done ? 'bg-red-600 text-white' : 'bg-gray-100 text-gray-400'}`}>
                    <Icon size={18} />
                  </div>
                  <span className={`text-[9px] font-black uppercase text-center ${done ? 'text-red-800' : 'text-gray-400'}`}>{step.label}</span>
                </div>
              );
            })}
          </div>

          {record.resolutionResponse ? (
            <div className="bg-green-50 border border-green-100 p-4 rounded-2xl space-y-2">
              <p className="text-[10px] font-black text-green-800 uppercase tracking-widest">Nội dung trả lời của Viện kiểm sát</p>
              <p className="text-[12px] text-gray-800 leading-relaxed whitespace-pre-wrap">{record.resolutionResponse}</p>
            </div>
          ) : (
            <p className="text-[11px] text-gray-500 italic text-center">
              Đơn đang được xem xét. Kết quả trả lời sẽ hiển thị tại đây khi có.
            </p>
          )}
        </div>
      )}
    </div>
  );
};
