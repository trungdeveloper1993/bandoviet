import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Copy, Check, Facebook, Send, Share2, Link2 } from 'lucide-react';
import { copyText } from '../lib/utils';

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  shareUrl: string;
}

const SHARE_TEXT = 'Xem bản đồ hành trình du lịch của mình nhé!';

export const ShareModal: React.FC<ShareModalProps> = ({ isOpen, onClose, shareUrl }) => {
  const [copied, setCopied] = useState(false);
  const canNativeShare = typeof navigator !== 'undefined' && typeof navigator.share === 'function';

  useEffect(() => {
    if (!isOpen) {
      setCopied(false);
      return;
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isOpen, onClose]);

  const handleCopyLink = async () => {
    if (await copyText(shareUrl)) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleNativeShare = async () => {
    try {
      await navigator.share({ title: 'Cảm ơn Nhé — Lịch trình', text: SHARE_TEXT, url: shareUrl });
    } catch {
      // user cancelled — nothing to do
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[9999] flex items-end sm:items-center justify-center sm:p-4 print:hidden">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-slate-950/50 backdrop-blur-[2px]"
          />

          <motion.div
            role="dialog"
            aria-modal="true"
            aria-labelledby="share-title"
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 40 }}
            transition={{ type: 'spring', damping: 30, stiffness: 340 }}
            className="relative w-full sm:max-w-md bg-white dark:bg-slate-900 rounded-t-[28px] sm:rounded-3xl shadow-2xl ring-1 ring-slate-900/5 dark:ring-white/10 p-5 pb-[calc(1.25rem+env(safe-area-inset-bottom))] sm:pb-5 text-slate-800 dark:text-slate-100"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <span className="w-11 h-11 rounded-2xl bg-linear-to-br from-emerald-400 to-teal-600 text-white flex items-center justify-center shadow-lg shadow-emerald-500/25">
                  <Share2 className="w-5 h-5" />
                </span>
                <div>
                  <h3 id="share-title" className="text-base font-bold text-slate-900 dark:text-white">
                    Chia sẻ lịch trình
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Bạn bè mở link là thấy toàn bộ bản đồ của bạn</p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="shrink-0 w-9 h-9 rounded-full flex items-center justify-center bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700 transition"
                aria-label="Đóng"
                id="close-share-modal"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {canNativeShare && (
              <button
                onClick={handleNativeShare}
                className="mt-5 w-full h-12 rounded-2xl flex items-center justify-center gap-2 text-sm font-semibold text-white bg-linear-to-r from-indigo-600 to-violet-600 shadow-lg shadow-indigo-600/25 active:scale-[0.99] transition"
              >
                <Send className="w-4 h-4" />
                Gửi qua Zalo, Messenger, tin nhắn…
              </button>
            )}

            <div className="mt-4 flex items-center gap-2 p-1.5 pl-3 rounded-2xl bg-slate-100/80 dark:bg-slate-800/70">
              <Link2 className="w-4 h-4 shrink-0 text-slate-400" />
              <input
                type="text"
                readOnly
                value={shareUrl}
                onFocus={(e) => e.currentTarget.select()}
                className="flex-1 min-w-0 bg-transparent outline-none text-xs text-slate-600 dark:text-slate-300 font-mono"
                aria-label="Liên kết chia sẻ"
              />
              <button
                onClick={handleCopyLink}
                className={`shrink-0 h-9 px-3.5 rounded-xl flex items-center gap-1.5 text-xs font-semibold transition active:scale-95 ${
                  copied
                    ? 'bg-emerald-500 text-white'
                    : 'bg-white text-slate-700 shadow-sm hover:bg-slate-50 dark:bg-slate-700 dark:text-white dark:hover:bg-slate-600'
                }`}
                id="share-copy-link-btn"
              >
                {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                {copied ? 'Đã chép' : 'Sao chép'}
              </button>
            </div>

            <div className="mt-3 grid grid-cols-2 gap-2">
              <a
                href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="h-11 rounded-2xl flex items-center justify-center gap-2 text-sm font-semibold text-slate-700 dark:text-slate-200 ring-1 ring-slate-200 dark:ring-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 transition"
              >
                <Facebook className="w-4 h-4 text-blue-600 fill-blue-600" />
                Facebook
              </a>
              <button
                onClick={() => {
                  // Zalo has no web share endpoint: phones use the native sheet (which lists the Zalo app);
                  // elsewhere copy the link and open Zalo Web so it can be pasted into a chat.
                  if (canNativeShare && window.matchMedia('(pointer: coarse)').matches) {
                    handleNativeShare();
                    return;
                  }
                  handleCopyLink();
                  window.open('https://chat.zalo.me/', '_blank', 'noopener');
                }}
                className="h-11 rounded-2xl flex items-center justify-center gap-2 text-sm font-semibold text-slate-700 dark:text-slate-200 ring-1 ring-slate-200 dark:ring-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 transition"
              >
                <span className="w-4 h-4 rounded-[5px] bg-[#0068FF] text-white text-[9px] font-black flex items-center justify-center">Z</span>
                Zalo
              </button>
            </div>

            <p className="mt-4 text-xs text-slate-400 dark:text-slate-500 leading-relaxed">
              Link chứa toàn bộ địa điểm và ghi chú. Người nhận có thể gộp vào bản đồ của họ hoặc chỉ xem.
            </p>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default ShareModal;
