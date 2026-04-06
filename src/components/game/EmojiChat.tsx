import { useState, useEffect, useRef } from 'react';
import { setupEmojiChat } from '@/lib/multiplayerUtils';

const QUICK_EMOJIS = ['👋', '😎', '🔥', '😂', '😱', '👏', '💪', '🤔', '😭', '🎯', '💀', '🏆'];

interface EmojiChatProps {
  roomId: string;
  isHost: boolean;
}

interface FloatingEmoji {
  id: number;
  emoji: string;
  fromMe: boolean;
}

let emojiIdCounter = 0;

export default function EmojiChat({ roomId, isHost }: EmojiChatProps) {
  const [floating, setFloating] = useState<FloatingEmoji[]>([]);
  const [showPicker, setShowPicker] = useState(false);
  const [cooldown, setCooldown] = useState(false);
  const chatRef = useRef<{ send: (emoji: string) => void; cleanup: () => void } | null>(null);

  useEffect(() => {
    const chat = setupEmojiChat(roomId, isHost, (emoji) => {
      addFloating(emoji, false);
    });
    chatRef.current = chat;
    return () => chat.cleanup();
  }, [roomId, isHost]);

  const addFloating = (emoji: string, fromMe: boolean) => {
    const id = ++emojiIdCounter;
    setFloating(prev => [...prev.slice(-5), { id, emoji, fromMe }]);
    // Auto-remove after animation
    setTimeout(() => {
      setFloating(prev => prev.filter(f => f.id !== id));
    }, 2500);
  };

  const sendEmoji = (emoji: string) => {
    if (cooldown) return;
    chatRef.current?.send(emoji);
    addFloating(emoji, true);
    setShowPicker(false);
    // 1.5s cooldown to prevent spam
    setCooldown(true);
    setTimeout(() => setCooldown(false), 1500);
  };

  return (
    <>
      {/* Floating emoji animations */}
      <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
        {floating.map(f => (
          <div
            key={f.id}
            className="absolute animate-emoji-float"
            style={{
              left: f.fromMe ? '15%' : '85%',
              bottom: '20%',
              fontSize: '2.5rem',
              filter: 'drop-shadow(0 2px 8px rgba(0,0,0,0.3))',
            }}
          >
            {f.emoji}
          </div>
        ))}
      </div>

      {/* Chat button + picker */}
      <div className="relative">
        <button
          onClick={() => setShowPicker(prev => !prev)}
          className={`px-3 py-2 rounded-xl border text-sm font-bold transition-all active:scale-[0.95] ${
            showPicker
              ? 'border-primary/60 bg-primary/15 text-primary'
              : 'border-border bg-card text-muted-foreground hover:text-foreground'
          } ${cooldown ? 'opacity-50' : ''}`}
          aria-label="Enviar emoji"
        >
          💬
        </button>

        {showPicker && (
          <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 bg-card border border-border rounded-xl p-2 shadow-xl animate-fade-in z-40 min-w-[200px]">
            <p className="text-[8px] text-muted-foreground uppercase tracking-wider text-center mb-1.5">Enviar emoji</p>
            <div className="grid grid-cols-6 gap-1">
              {QUICK_EMOJIS.map(emoji => (
                <button
                  key={emoji}
                  onClick={() => sendEmoji(emoji)}
                  disabled={cooldown}
                  className="text-xl p-1.5 rounded-lg hover:bg-muted active:scale-90 transition-all disabled:opacity-30"
                >
                  {emoji}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </>
  );
}
