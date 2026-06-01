import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Send, Copy, Check, Facebook, Twitter, ShieldCheck } from 'lucide-react';

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  shareUrl: string;
}

export const ShareModal: React.FC<ShareModalProps> = ({ isOpen, onClose, shareUrl }) => {
  const [copied, setCopied] = useState(false);

  const handleCopyLink = () => {
    navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.55 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-slate-900/60 backdrop-blur-[2px] dark:bg-black/85"
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 15 }}
            className="relative bg-white dark:bg-slate-900 w-full max-w-md rounded-3xl border border-slate-100 dark:border-slate-800/80 p-6 flex flex-col z-10 select-none text-slate-850 dark:text-slate-100 shadow-[0_20px_50px_rgba(0,0,0,0.12)]"
          >
            {/* Header */}
            <div className="flex items-center justify-between mb-3.5 pb-3 border-b border-slate-100 dark:border-slate-800/60">
              <h3 className="text-sm font-extrabold text-slate-900 dark:text-white uppercase tracking-tight flex items-center gap-2 font-sans">
                <span className="text-yellow-400 font-extrabold animate-bounce">★</span>
                <span>CHIA SẺ LỊCH TRÌNH</span>
              </h3>
              <button
                onClick={onClose}
                className="p-1.5 rounded-full bg-slate-50 dark:bg-slate-850 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 transition cursor-pointer"
                id="close-share-modal"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Description */}
            <p className="text-[11px] text-slate-600 dark:text-slate-400 mb-4 leading-relaxed font-sans">
              Gửi lịch trình du lịch cá nhân này tới bạn bè của bạn! Toàn bộ vị trí địa điểm định đi, đã đi kèm ghi chú chi tiết đã được mã hóa an toàn vào đường dẫn liên kết này.
            </p>

            {/* URL Input Box */}
            <div className="bg-slate-50 dark:bg-slate-950 p-2.5 border border-slate-200 dark:border-slate-800 rounded-2xl flex flex-col sm:flex-row items-stretch gap-2 mb-4 select-none">
              <input
                type="text"
                readOnly
                value={shareUrl}
                className="bg-transparent border-none outline-none text-[10px] text-slate-700 dark:text-slate-350 w-full font-mono overflow-x-auto py-1 px-1.5 focus:outline-none"
              />
              <button
                onClick={handleCopyLink}
                className={`flex items-center justify-center gap-1.5 font-bold text-[10px] uppercase px-3.5 py-1.5 rounded-xl cursor-pointer transition active:scale-95 shrink-0 ${
                  copied
                    ? 'bg-emerald-500 text-white'
                    : 'bg-indigo-650 bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm'
                }`}
                id="share-copy-link-btn"
              >
                {copied ? (
                  <>
                    <Check className="w-3 h-3 text-white" />
                    <span>Xong!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3 h-3 text-white" />
                    <span>COPY</span>
                  </>
                )}
              </button>
            </div>

            {/* Social Share grid */}
            <div className="space-y-3 pt-0.5">
              <label className="text-[8px] text-slate-450 dark:text-slate-500 font-extrabold uppercase tracking-widest block font-mono">
                ✦ CHIA SẺ QUA NỀN TẢNG:
              </label>

              <div className="grid grid-cols-2 gap-2">
                <a
                  href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-1.5 px-3 py-2 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-850 rounded-xl text-[10px] font-bold text-slate-700 dark:text-slate-300 uppercase cursor-pointer transition"
                >
                  <Facebook className="w-3.5 h-3.5 text-blue-600 fill-blue-600 border-none shrink-0" />
                  <span>Facebook</span>
                </a>

                <a
                  href={`https://twitter.com/intent/tweet?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent('Xem bản đồ du lịch độc nhất vô nhị của mình tại đây nhé!')}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-1.5 px-3 py-2 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-850 rounded-xl text-[10px] font-bold text-slate-700 dark:text-slate-300 uppercase cursor-pointer transition"
                >
                  <Twitter className="w-3.5 h-3.5 text-sky-500 fill-sky-500 border-none shrink-0" />
                  <span>Twitter</span>
                </a>
              </div>

              {/* Zalo Messenger custom info copy popup alert */}
              <div className="p-3 bg-amber-500/10 border border-dashed border-amber-500/30 rounded-2xl text-[10px] text-amber-700 dark:text-amber-400 flex items-start gap-2.5 leading-relaxed">
                <ShieldCheck className="w-4 h-4 shrink-0 text-amber-500 mt-0.5" />
                <span className="font-sans">
                 Đối với <b>Zalo</b> hoặc <b>Messenger</b>, hãy nhấp vào nút <b>COPY</b> ở trên và dán hộp thoại gửi cho bạn bè để chia sẻ lập tức!
                </span>
              </div>
            </div>

          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
export default ShareModal;

