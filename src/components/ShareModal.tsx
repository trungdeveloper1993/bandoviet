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
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm dark:bg-black/60"
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 15 }}
            className="relative bg-white dark:bg-slate-900 w-full max-w-md rounded-2xl shadow-xl overflow-hidden border border-slate-100 dark:border-slate-800 p-6 flex flex-col"
          >
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-extrabold text-slate-800 dark:text-slate-100 uppercase tracking-wider flex items-center gap-1.5">
                <Send className="w-4 h-4 text-indigo-500 animate-pulse" />
                <span>Chia Sẻ Lịch Trình Hành Trình</span>
              </h3>
              <button
                onClick={onClose}
                className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
                id="close-share-modal"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Description */}
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-5 leading-relaxed">
              Gửi lịch trình du lịch cá nhân này tới bạn bè của bạn! Toàn bộ danh sách địa điểm định đi, đã đi kèm ghi chú chi tiết đã được mã hóa an toàn vào đường dẫn chia sẻ này.
            </p>

            {/* URL Input Box */}
            <div className="bg-slate-50 dark:bg-slate-850 p-2.5 rounded-xl border border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2.5 mb-4 select-none">
              <input
                type="text"
                readOnly
                value={shareUrl}
                className="bg-transparent border-none outline-none text-xs text-slate-600 dark:text-slate-300 w-full font-mono overflow-x-auto"
              />
              <button
                onClick={handleCopyLink}
                className={`flex items-center gap-1 font-bold text-xs px-3.5 py-1.5 rounded-lg cursor-pointer transition ${
                  copied
                    ? 'bg-emerald-500 text-white'
                    : 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-sm'
                }`}
                id="share-copy-link-btn"
              >
                {copied ? (
                  <>
                    <Check className="w-3.5 h-3.5" />
                    <span>Đã sao chép</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Sao chép</span>
                  </>
                )}
              </button>
            </div>

            {/* Social Share grid */}
            <div className="space-y-4 pt-1">
              <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">
                Chia sẻ nhanh qua nền tảng:
              </label>

              <div className="grid grid-cols-2 gap-2">
                <a
                  href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 px-3 py-2 border border-slate-150 dark:border-slate-800 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-850 transition text-xs font-bold text-slate-700 dark:text-slate-300"
                >
                  <Facebook className="w-4 h-4 text-blue-600 fill-blue-600 border-none" />
                  <span>Facebook</span>
                </a>

                <a
                  href={`https://twitter.com/intent/tweet?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent('Xem lịch lịch hành trình du lịch tuyệt hảo của mình tại đây nhé!')}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 px-3 py-2 border border-slate-150 dark:border-slate-800 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-850 transition text-xs font-bold text-slate-700 dark:text-slate-300"
                >
                  <Twitter className="w-4 h-4 text-sky-500 fill-sky-500 border-none" />
                  <span>X / Twitter</span>
                </a>
              </div>

              {/* Zalo Messenger custom info copy popup alert */}
              <div className="p-3 bg-amber-500/5 rounded-xl border border-amber-500/10 text-[11px] text-amber-700 dark:text-amber-400 flex items-start gap-2 leading-relaxed">
                <ShieldCheck className="w-4 h-4 shrink-0 text-amber-500 mt-0.5" />
                <span>
                 Đối với <b>Zalo</b> hoặc <b>Messenger</b>, vui lòng sao chép đường dẫn phía trên bằng nút copy và dán vào cửa sổ chat với bạn bè để họ nhận lịch trình lập tức!
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
