import React, { useRef, useState } from 'react';
import { Lock, Unlock, KeyRound, Download, Upload, ShieldCheck, AlertTriangle, RefreshCcw } from 'lucide-react';
import { EncryptionConfig } from '../types';
import { generateKeyFile, loadKeyFile, KeyFile } from '../services/cryptoService';
import { setEncryptionConfig } from '../services/storageService';

export interface LoadedKey {
  privateKey: CryptoKey;
  fingerprint: string;
}

const downloadKeyFile = (file: KeyFile) => {
  const blob = new Blob([JSON.stringify(file, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `chia-khoa-giai-ma-VKSKV3-${file.fingerprint}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 2000);
};

const readFileText = (f: File) =>
  new Promise<string>((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(String(r.result));
    r.onerror = () => reject(r.error);
    r.readAsText(f);
  });

interface Props {
  config: EncryptionConfig | null;
  configLoaded: boolean;
  loadedKey: LoadedKey | null;
  lockedCount: number;
  onConfigCreated: (c: EncryptionConfig) => void;
  onKeyLoaded: (k: LoadedKey | null) => void;
}

export const EncryptionPanel: React.FC<Props> = ({ config, configLoaded, loadedKey, lockedCount, onConfigCreated, onKeyLoaded }) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [pending, setPending] = useState<KeyFile | null>(null);
  const [savedTwice, setSavedTwice] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const pickFile = () => inputRef.current?.click();

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (inputRef.current) inputRef.current.value = '';
    if (!f) return;
    setError(null);
    setNotice(null);
    setBusy(true);
    try {
      const loaded = await loadKeyFile(await readFileText(f));

      if (pending) {
        // Bước xác nhận khi bật mã hóa: tệp chọn lại phải đúng tệp vừa tạo
        if (loaded.fingerprint !== pending.fingerprint) {
          throw new Error('Tệp vừa chọn không phải chìa khóa vừa tạo. Hãy chọn đúng tệp đã tải về.');
        }
        const cfg: EncryptionConfig = {
          publicKeyJwk: pending.publicKeyJwk,
          fingerprint: pending.fingerprint,
          createdAt: new Date().toISOString(),
        };
        await setEncryptionConfig(cfg);
        setPending(null);
        onConfigCreated(cfg);
      } else if (config && loaded.fingerprint !== config.fingerprint) {
        setNotice(`Tệp này là chìa khóa ${loaded.fingerprint}, khác chìa khóa đang dùng (${config.fingerprint}). Chỉ mở được các đơn mã hóa bằng chìa khóa này.`);
      }
      onKeyLoaded({ privateKey: loaded.privateKey, fingerprint: loaded.fingerprint });
    } catch (err: any) {
      setError(err?.message || 'Không mở được tệp chìa khóa.');
    } finally {
      setBusy(false);
    }
  };

  const startSetup = async () => {
    setError(null);
    setBusy(true);
    try {
      const file = await generateKeyFile();
      setPending(file);
      setSavedTwice(false);
      downloadKeyFile(file);
    } catch (err: any) {
      setError('Trình duyệt không tạo được chìa khóa: ' + (err?.message || err));
    } finally {
      setBusy(false);
    }
  };

  const fileInput = (
    <input ref={inputRef} type="file" accept=".json,application/json" className="hidden" onChange={handleFile} />
  );

  const messages = (
    <>
      {error && (
        <p className="text-[11px] text-red-700 font-bold flex gap-1.5"><AlertTriangle size={14} className="shrink-0" />{error}</p>
      )}
      {notice && <p className="text-[11px] text-amber-800 flex gap-1.5"><AlertTriangle size={14} className="shrink-0" />{notice}</p>}
    </>
  );

  if (!configLoaded) return null;

  // 1. Chưa bật mã hóa
  if (!config) {
    return (
      <div className="bg-amber-50 border border-amber-200 rounded-[2rem] p-5 space-y-4">
        {fileInput}
        <div className="flex gap-3">
          <Unlock className="text-amber-600 shrink-0" size={22} />
          <div className="space-y-1">
            <h3 className="font-black text-amber-900 uppercase text-sm">Chưa bật mã hóa dữ liệu</h3>
            <p className="text-[11px] text-amber-900/80 leading-relaxed">
              Hiện đơn của người dân được lưu nguyên văn trên Firebase. Bật mã hóa để thông tin cá nhân và nội dung đơn được mã hóa ngay trên máy người dân; chỉ máy có tệp chìa khóa mới đọc được.
            </p>
          </div>
        </div>

        {!pending ? (
          <button type="button" onClick={startSetup} disabled={busy}
            className="w-full py-3 bg-amber-600 hover:bg-amber-700 text-white rounded-xl font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2 disabled:opacity-60">
            {busy ? <RefreshCcw size={16} className="animate-spin" /> : <KeyRound size={16} />} Tạo chìa khóa mã hóa
          </button>
        ) : (
          <div className="bg-white rounded-2xl border border-amber-200 p-4 space-y-3">
            <p className="text-[11px] font-black text-gray-800 uppercase">Chìa khóa {pending.fingerprint} đã được tải về máy</p>
            <ol className="text-[11px] text-gray-700 leading-relaxed list-decimal pl-5 space-y-1">
              <li>Tìm tệp <b>chia-khoa-giai-ma-VKSKV3-{pending.fingerprint}.json</b> trong thư mục Tải về.</li>
              <li><b>Chép ra ít nhất 2 nơi an toàn</b> (ví dụ 2 USB cất trong tủ hồ sơ). Mất tệp này thì <b>không bao giờ đọc lại được</b> các đơn đã mã hóa.</li>
              <li>Không gửi tệp qua Zalo, email hay lưu lên mạng.</li>
              <li>Chọn lại tệp đó ở nút dưới để xác nhận và bật mã hóa.</li>
            </ol>
            <label className="flex items-start gap-2 text-[11px] text-gray-800 font-semibold">
              <input type="checkbox" checked={savedTwice} onChange={e => setSavedTwice(e.target.checked)} className="mt-0.5" />
              Tôi đã lưu tệp chìa khóa ở ít nhất 2 nơi an toàn.
            </label>
            <div className="flex flex-col sm:flex-row gap-2">
              <button type="button" onClick={() => downloadKeyFile(pending)}
                className="flex-1 py-2.5 border-2 border-gray-300 rounded-xl text-[11px] font-black uppercase text-gray-700 flex items-center justify-center gap-2 hover:bg-gray-50">
                <Download size={14} /> Tải lại tệp
              </button>
              <button type="button" onClick={pickFile} disabled={!savedTwice || busy}
                className="flex-1 py-2.5 bg-green-700 text-white rounded-xl text-[11px] font-black uppercase flex items-center justify-center gap-2 disabled:opacity-40">
                {busy ? <RefreshCcw size={14} className="animate-spin" /> : <Upload size={14} />} Chọn tệp để bật mã hóa
              </button>
            </div>
            <button type="button" onClick={() => setPending(null)} className="text-[10px] text-gray-500 underline">Hủy</button>
          </div>
        )}
        {messages}
      </div>
    );
  }

  // 2. Đã bật mã hóa, đã mở chìa khóa
  if (loadedKey) {
    return (
      <div className="bg-green-50 border border-green-200 rounded-[2rem] p-5 space-y-2">
        <div className="flex flex-col sm:flex-row sm:items-center gap-3 justify-between">
          <div className="flex gap-3 items-start">
            <ShieldCheck className="text-green-700 shrink-0" size={22} />
            <div>
              <h3 className="font-black text-green-900 uppercase text-sm">Đã mở chìa khóa {loadedKey.fingerprint}</h3>
              <p className="text-[11px] text-green-900/80">Chìa khóa chỉ nằm trong trang này. Đóng trình duyệt hoặc bấm “Khóa lại” thì phải chọn lại tệp.</p>
            </div>
          </div>
          <button type="button" onClick={() => { onKeyLoaded(null); setNotice(null); }}
            className="px-4 py-2 bg-white border-2 border-green-300 rounded-xl text-[11px] font-black uppercase text-green-800 flex items-center gap-2 shrink-0">
            <Lock size={14} /> Khóa lại
          </button>
        </div>
        {messages}
      </div>
    );
  }

  // 3. Đã bật mã hóa, chưa mở chìa khóa
  return (
    <div className="bg-slate-50 border border-slate-200 rounded-[2rem] p-5 space-y-3">
      {fileInput}
      <div className="flex gap-3">
        <Lock className="text-slate-700 shrink-0" size={22} />
        <div>
          <h3 className="font-black text-slate-900 uppercase text-sm">Dữ liệu đang được mã hóa</h3>
          <p className="text-[11px] text-slate-700 leading-relaxed">
            Chìa khóa đang dùng: <b className="font-mono">{config.fingerprint}</b>.
            {lockedCount > 0 ? ` Có ${lockedCount} đơn cần mở chìa khóa để xem.` : ''} Chọn tệp chìa khóa từ USB để xem nội dung đơn.
          </p>
        </div>
      </div>
      <button type="button" onClick={pickFile} disabled={busy}
        className="w-full py-3 bg-slate-800 hover:bg-slate-900 text-white rounded-xl font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2 disabled:opacity-60">
        {busy ? <RefreshCcw size={16} className="animate-spin" /> : <KeyRound size={16} />} Mở chìa khóa
      </button>
      {messages}
    </div>
  );
};
