import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Copy, ImagePlus, Loader2, Send, Sparkles, Trash2, X } from 'lucide-react';
import { sendConciergeMessages, type ConciergeMessage } from '../services/geminiConciergeService';
import { fileToConciergeImage } from '../utils/conciergeImage';

const MAX_IMAGES_PER_SEND = 4;
const DEFAULT_IMAGE_ONLY_TEXT =
  'この画像について、花・植物の観点でアドバイスをお願いします。';

type PendingImage = { id: string; file: File; previewUrl: string };

export default function FlowerConciergePage() {
  const navigate = useNavigate();
  const [messages, setMessages] = useState<ConciergeMessage[]>([]);
  const [input, setInput] = useState('');
  const [pendingImages, setPendingImages] = useState<PendingImage[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<number | null>(null);
  const [localApiWarning, setLocalApiWarning] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  /** 開発時: Vite 内の Gemini（GEMINI_API_KEY）か、フォールバック用の :3000 API のどちらかが使えるか確認 */
  useEffect(() => {
    if (!import.meta.env.DEV) return;

    let cancelled = false;

    const checkApi3000 = () => {
      const base = import.meta.env.VITE_API_BASE_URL || '';
      const useLocal =
        !base || base.includes('localhost') || base.includes('127.0.0.1');
      if (!useLocal) {
        setLocalApiWarning(
          '.env に GEMINI_API_KEY を設定して npm run dev を再起動するか、VITE_API_BASE_URL で API を指定してください。'
        );
        return;
      }
      fetch('/api/health')
        .then((r) => {
          if (cancelled) return;
          if (!r.ok) {
            setLocalApiWarning(
              `Vite に GEMINI_API_KEY が見えていません。 .env に追加して dev を再起動するか、npm run dev:full で API（ポート 3000）を起動してください（HTTP ${r.status}）。`
            );
            return;
          }
          setLocalApiWarning(null);
        })
        .catch(() => {
          if (!cancelled) {
            setLocalApiWarning(
              'Vite に GEMINI_API_KEY が見えていません。.env に追加して npm run dev を再起動するか、npm run dev:full を実行してください。'
            );
          }
        });
    };

    fetch('/__gemini_dev/health')
      .then(async (r) => {
        if (cancelled) return;
        if (!r.ok) {
          checkApi3000();
          return;
        }
        let j: { geminiConfigured?: boolean } = {};
        try {
          j = (await r.json()) as { geminiConfigured?: boolean };
        } catch {
          checkApi3000();
          return;
        }
        if (j.geminiConfigured) {
          setLocalApiWarning(null);
          return;
        }
        checkApi3000();
      })
      .catch(() => {
        if (!cancelled) checkApi3000();
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const removePending = useCallback((id: string) => {
    setPendingImages((prev) => {
      const t = prev.find((p) => p.id === id);
      if (t) URL.revokeObjectURL(t.previewUrl);
      return prev.filter((p) => p.id !== id);
    });
  }, []);

  const onPickFiles = useCallback(
    (files: FileList | null) => {
      if (!files?.length) return;
      const next: PendingImage[] = [];
      let room = MAX_IMAGES_PER_SEND - pendingImages.length;
      for (let i = 0; i < files.length && room > 0; i++) {
        const file = files[i];
        if (!file.type.startsWith('image/')) continue;
        next.push({
          id: `${Date.now()}-${i}-${Math.random().toString(36).slice(2)}`,
          file,
          previewUrl: URL.createObjectURL(file),
        });
        room--;
      }
      if (next.length) {
        setPendingImages((p) => [...p, ...next]);
      }
      if (fileInputRef.current) fileInputRef.current.value = '';
    },
    [pendingImages.length]
  );

  const handleSend = useCallback(async () => {
    const trimmed = input.trim();
    if (loading) return;
    if (!trimmed && pendingImages.length === 0) return;

    setError(null);

    const snapshot = pendingImages;
    let imagePayloads: { mimeType: string; data: string }[] = [];
    try {
      imagePayloads = await Promise.all(snapshot.map((p) => fileToConciergeImage(p.file)));
    } catch (e) {
      setError(e instanceof Error ? e.message : '画像の処理に失敗しました');
      return;
    }

    const userText =
      trimmed || (imagePayloads.length > 0 ? DEFAULT_IMAGE_ONLY_TEXT : '');
    const userMsg: ConciergeMessage = {
      role: 'user',
      text: userText,
      ...(imagePayloads.length > 0 ? { images: imagePayloads } : {}),
    };

    setPendingImages([]);
    const nextThread = [...messages, userMsg];
    setMessages(nextThread);
    setInput('');
    setLoading(true);

    try {
      const reply = await sendConciergeMessages(nextThread);
      snapshot.forEach((p) => URL.revokeObjectURL(p.previewUrl));
      setMessages((prev) => [...prev, { role: 'assistant', text: reply }]);
    } catch (e) {
      setMessages((prev) => prev.slice(0, -1));
      setInput(trimmed);
      setPendingImages(snapshot);
      setError(e instanceof Error ? e.message : '送信に失敗しました');
    } finally {
      setLoading(false);
    }
  }, [input, loading, messages, pendingImages]);

  const clearSession = () => {
    pendingImages.forEach((p) => URL.revokeObjectURL(p.previewUrl));
    setPendingImages([]);
    setMessages([]);
    setError(null);
    setInput('');
  };

  const copyAssistant = async (text: string, index: number) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedId(index);
      setTimeout(() => setCopiedId(null), 2000);
    } catch {
      setError('クリップボードにコピーできませんでした');
    }
  };

  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: '#FAF8F5' }}>
      <header
        className="sticky top-0 z-20 border-b px-4 py-3 flex items-center gap-3"
        style={{
          backgroundColor: 'rgba(250,248,245,0.97)',
          backdropFilter: 'blur(8px)',
          borderColor: '#E0D6C8',
        }}
      >
        <button
          type="button"
          onClick={() => navigate('/customer-menu')}
          className="p-2 rounded-sm border transition-colors"
          style={{ borderColor: '#E0D6C8', color: '#3D3A36' }}
          aria-label="メニューに戻る"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="flex-1 min-w-0">
          <p className="text-xs tracking-[0.2em]" style={{ color: '#3A4A32', fontWeight: 600 }}>
            AI CONCIERGE
          </p>
          <h1
            className="text-base sm:text-lg truncate"
            style={{
              fontFamily: "'Noto Serif JP', serif",
              color: '#141210',
              fontWeight: 600,
            }}
          >
            AI flower concierge
          </h1>
        </div>
        <button
          type="button"
          onClick={clearSession}
          className="p-2 rounded-sm border transition-colors shrink-0"
          style={{ borderColor: '#E0D6C8', color: '#3D3A36' }}
          title="この画面の会話を消去"
          aria-label="会話を消去"
        >
          <Trash2 className="w-5 h-5" />
        </button>
      </header>

      {localApiWarning && (
        <div
          className="px-4 py-3 text-sm border-b"
          style={{
            backgroundColor: '#F5EBE6',
            borderColor: '#D4A594',
            color: '#5C3D32',
          }}
          role="alert"
        >
          {localApiWarning}
        </div>
      )}

      <div
        className="px-4 py-3 text-sm border-b space-y-2"
        style={{
          backgroundColor: '#F5F0E8',
          borderColor: '#E0D6C8',
          color: '#1E1C1A',
        }}
      >
        <p className="leading-relaxed">
          <strong>保存されません:</strong>
          会話はこの画面を開いている間だけ表示されます。アプリやタブを閉じると消えます（サーバーにも残しません）。
        </p>
        <p className="leading-relaxed text-xs" style={{ color: '#2A2826' }}>
          大切な内容は、メモアプリなどにコピー＆ペーストして保管することをおすすめします。
        </p>
        {import.meta.env.DEV && (
          <p
            className="leading-relaxed text-xs pt-2 border-t mt-1"
            style={{ borderColor: '#C4B8A8', color: '#3A4A32' }}
          >
            <strong>ローカル開発:</strong>
            <code className="text-[11px]">GEMINI_API_KEY</code> は .env に書き、
            <code className="text-[11px]">npm run dev</code> のみで Vite が Node 経由で呼び出します（キーはバンドルに含みません）。
            キーが無い場合は <code className="text-[11px]">npm run dev:full</code> で API サーバー経由になります。
          </p>
        )}
      </div>

      <main className="flex-1 overflow-y-auto px-4 py-4 space-y-4 max-w-2xl mx-auto w-full">
        {messages.length === 0 && !loading && (
          <div
            className="rounded-sm p-6 text-center border"
            style={{
              backgroundColor: 'rgba(255,255,255,0.95)',
              borderColor: '#E0D6C8',
            }}
          >
            <Sparkles className="w-10 h-10 mx-auto mb-3" style={{ color: '#3A4A32' }} />
            <p style={{ color: '#141210', fontWeight: 600 }} className="mb-2">
              花のこと、なんでもどうぞ
            </p>
            <p className="text-sm" style={{ color: '#1E1C1A' }}>
              ギフトの選び方、育て方、季節の花、花屋での注文のコツなど、気軽にご相談ください。
            </p>
            <p className="text-xs mt-3 leading-relaxed" style={{ color: '#2A2826' }}>
              葉や花の写真を添付して、状態の見方やお手入れのヒントを聞くこともできます（1回最大4枚）。
            </p>
          </div>
        )}

        {messages.map((m, i) => (
          <div
            key={`${i}-${m.role}`}
            className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className="max-w-[90%] rounded-sm px-4 py-3 whitespace-pre-wrap border shadow-sm leading-relaxed text-[15px] sm:text-[16px] font-medium"
              style={{
                backgroundColor: m.role === 'user' ? '#D4E0CC' : '#FFFFFF',
                borderColor: m.role === 'assistant' ? '#9A8B78' : '#A89884',
                color: '#070605',
                fontWeight: 500,
              }}
            >
              {m.role === 'user' && m.images && m.images.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-2">
                  {m.images.map((img, j) => (
                    <img
                      key={`${i}-img-${j}`}
                      src={`data:${img.mimeType};base64,${img.data}`}
                      alt=""
                      className="max-h-36 rounded-sm border object-cover"
                      style={{ borderColor: '#C5C9C0' }}
                    />
                  ))}
                </div>
              )}
              {m.text}
              {m.role === 'assistant' && (
                <button
                  type="button"
                  onClick={() => copyAssistant(m.text, i)}
                  className="mt-3 flex items-center gap-1 text-xs font-medium"
                  style={{ color: '#0D1A0A' }}
                >
                  <Copy className="w-3.5 h-3.5" />
                  {copiedId === i ? 'コピーしました' : 'コピー'}
                </button>
              )}
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex justify-start">
            <div
              className="rounded-sm px-4 py-3 flex items-center gap-2 border text-sm"
              style={{
                backgroundColor: '#FFFFFF',
                borderColor: '#C9BFB0',
                color: '#070605',
                fontWeight: 600,
              }}
            >
              <Loader2 className="w-4 h-4 animate-spin" />
              考えています…
            </div>
          </div>
        )}

        {error && (
          <div
            className="rounded-sm p-3 text-sm border"
            style={{
              backgroundColor: '#F5EBE6',
              borderColor: '#D4A594',
              color: '#5C3D32',
            }}
            role="alert"
          >
            {error}
          </div>
        )}

        <div ref={bottomRef} />
      </main>

      <footer
        className="sticky bottom-0 z-20 border-t p-3"
        style={{
          backgroundColor: 'rgba(250,248,245,0.98)',
          borderColor: '#E0D6C8',
        }}
      >
        <div className="max-w-2xl mx-auto space-y-2">
          {pendingImages.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {pendingImages.map((p) => (
                <div key={p.id} className="relative inline-block">
                  <img
                    src={p.previewUrl}
                    alt=""
                    className="h-20 w-20 object-cover rounded-sm border"
                    style={{ borderColor: '#E0D6C8' }}
                  />
                  <button
                    type="button"
                    onClick={() => removePending(p.id)}
                    className="absolute -top-1 -right-1 p-0.5 rounded-full border bg-white shadow-sm"
                    style={{ borderColor: '#E0D6C8', color: '#3D3A36' }}
                    aria-label="添付を削除"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}
          <div className="flex gap-2 items-end">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif"
              multiple
              className="hidden"
              onChange={(e) => onPickFiles(e.target.files)}
              aria-hidden
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={
                loading || pendingImages.length >= MAX_IMAGES_PER_SEND
              }
              className="p-3 rounded-sm border transition-opacity disabled:opacity-40 shrink-0"
              style={{
                borderColor: '#E0D6C8',
                color: '#3D3A36',
                backgroundColor: '#fff',
              }}
              title="画像を添付（最大4枚）"
              aria-label="画像を添付"
            >
              <ImagePlus className="w-5 h-5" />
            </button>
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  void handleSend();
                }
              }}
              rows={2}
              placeholder="花のことで聞きたいことを入力…（画像のみでも送信可）"
              className="flex-1 resize-none rounded-sm border px-3 py-2.5 text-[15px] sm:text-base font-medium placeholder:text-[#4A4540] placeholder:font-normal"
              style={{
                borderColor: '#8F8272',
                color: '#070605',
                backgroundColor: '#fff',
                caretColor: '#070605',
              }}
              disabled={loading}
              aria-label="メッセージ入力"
            />
            <button
              type="button"
              onClick={() => void handleSend()}
              disabled={
                loading || (!input.trim() && pendingImages.length === 0)
              }
              className="p-3 rounded-sm border transition-opacity disabled:opacity-40 shrink-0"
              style={{
                backgroundColor: '#5C6B4A',
                borderColor: '#4A5640',
                color: '#FAF8F5',
              }}
              aria-label="送信"
            >
              <Send className="w-5 h-5" />
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
}
