import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  MessageSquare,
  X,
  Send,
  CornerDownRight,
  ExternalLink,
  Check,
  Bell,
  BookOpen,
  Award,
} from 'lucide-react';
import teamsToastService from '../services/teamsToastService';
import chatSocketService from '../../chat/services/chatSocketService';
import useAuth from '../../auth/hooks/useAuth';
import '../styles/teamsToast.css';

/**
 * Plays a subtle, non-intrusive 2-tone melodic chime (inspired by MS Teams)
 * via Web Audio API. Zero dependencies, silent fail if audio context blocked.
 */
function playTeamsChime() {
  try {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return;
    const ctx = new AudioContext();
    if (ctx.state === 'suspended') {
      ctx.resume().catch(() => {});
    }

    const now = ctx.currentTime;

    // Tone 1: C5 (523.25 Hz)
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(523.25, now);
    gain1.gain.setValueAtTime(0.12, now);
    gain1.gain.exponentialRampToValueAtTime(0.0001, now + 0.22);
    osc1.connect(gain1);
    gain1.connect(ctx.destination);
    osc1.start(now);
    osc1.stop(now + 0.22);

    // Tone 2: G5 (783.99 Hz)
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(783.99, now + 0.1);
    gain2.gain.setValueAtTime(0.14, now + 0.1);
    gain2.gain.exponentialRampToValueAtTime(0.0001, now + 0.38);
    osc2.connect(gain2);
    gain2.connect(ctx.destination);
    osc2.start(now + 0.1);
    osc2.stop(now + 0.38);
  } catch {
    // Audio contexts can be restricted by browser policy before first interaction
  }
}

/**
 * Single Microsoft Teams styled notification card
 */
function TeamsNotificationCard({ notification, onDismiss }) {
  const navigate = useNavigate();
  const [isReplying, setIsReplying] = useState(false);
  const [replyText, setReplyText] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [sentSuccess, setSentSuccess] = useState(false);
  const [isDismissing, setIsDismissing] = useState(false);
  const timerRef = useRef(null);
  const replyInputRef = useRef(null);

  // Extract channel ID from metadata or linkUrl
  const channelId =
    notification.data?.channelId ||
    (notification.linkUrl?.match(/channelId=([^&]+)/)?.[1] ?? null);

  const senderName =
    notification.data?.senderName ||
    notification.title?.replace(/^Message from\s+/i, '') ||
    'Colleague';

  const senderInitial = senderName.charAt(0).toUpperCase();

  const isChatNotification =
    notification.type === 'CHAT_DM' ||
    notification.type === 'CHAT_MENTION' ||
    notification.type === 'CHAT_CHANNEL' ||
    notification.type === 'CHAT_MESSAGE' ||
    Boolean(channelId);

  // Auto-dismiss countdown (6.5s), paused if hovering or actively typing reply
  const startTimer = useCallback(() => {
    if (isReplying || sentSuccess) return;
    clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      handleDismiss();
    }, 6500);
  }, [isReplying, sentSuccess]);

  const pauseTimer = useCallback(() => {
    clearTimeout(timerRef.current);
  }, []);

  useEffect(() => {
    startTimer();
    return () => clearTimeout(timerRef.current);
  }, [startTimer]);

  useEffect(() => {
    if (isReplying) {
      clearTimeout(timerRef.current);
      setTimeout(() => replyInputRef.current?.focus(), 50);
    }
  }, [isReplying]);

  const handleDismiss = () => {
    setIsDismissing(true);
    setTimeout(() => {
      onDismiss(notification.toastId);
    }, 200);
  };

  const handleCardClick = (e) => {
    // Don't navigate if clicking inputs, buttons, or during quick reply
    if (e.target.closest('button') || e.target.closest('input') || isReplying) {
      return;
    }
    handleDismiss();
    if (notification.linkUrl) {
      navigate(notification.linkUrl);
    }
  };

  const handleSendReply = async (e) => {
    e.preventDefault();
    if (!replyText.trim() || !channelId || isSending) return;

    setIsSending(true);
    try {
      chatSocketService.connect();
      chatSocketService.sendMessage(channelId, replyText.trim(), `quick-${Date.now()}`);
      setSentSuccess(true);
      setTimeout(() => {
        handleDismiss();
      }, 900);
    } catch {
      setIsSending(false);
    }
  };

  // Type icon mapping
  const getHeaderIcon = () => {
    if (isChatNotification) return <MessageSquare size={11} />;
    if (notification.type?.includes('COURSE')) return <BookOpen size={11} />;
    if (notification.type?.includes('ASSESSMENT')) return <Award size={11} />;
    return <Bell size={11} />;
  };

  return (
    <div
      className={`teams-toast-card ${isDismissing ? 'teams-toast-card--dismissing' : ''}`}
      onMouseEnter={pauseTimer}
      onMouseLeave={startTimer}
    >
      <div className="teams-toast-card__top-bar" />

      {/* Header */}
      <div className="teams-toast-header">
        <div className="teams-toast-header__brand">
          <div className="teams-toast-header__icon-badge">{getHeaderIcon()}</div>
          <span className="teams-toast-header__title">
            {isChatNotification ? 'LMS Chat' : 'LMS Notification'}
          </span>
          <span className="teams-toast-header__dot">•</span>
          <span className="teams-toast-header__time">just now</span>
        </div>
        <button
          type="button"
          onClick={handleDismiss}
          className="teams-toast-header__close-btn"
          aria-label="Dismiss notification"
        >
          <X size={13} />
        </button>
      </div>

      {/* Body */}
      <div className="teams-toast-body" onClick={handleCardClick}>
        <div className="teams-toast-avatar-wrapper">
          <div className="teams-toast-avatar">{senderInitial}</div>
          <div className="teams-toast-presence" title="Active now" />
        </div>

        <div className="teams-toast-content">
          <div className="teams-toast-sender-row">
            <span className="teams-toast-sender-name">{senderName}</span>
            {notification.data?.channelName && (
              <span className="teams-toast-channel-context">
                in #{notification.data.channelName}
              </span>
            )}
          </div>
          <p className="teams-toast-message-text">
            {notification.message || notification.body || notification.title || ''}
          </p>
        </div>
      </div>

      {/* Quick Reply Form or Actions */}
      {isChatNotification && (
        <>
          {isReplying ? (
            <div className="teams-toast-reply-box">
              {sentSuccess ? (
                <div className="teams-toast-reply-sent">
                  <Check size={14} />
                  <span>Reply sent!</span>
                </div>
              ) : (
                <form onSubmit={handleSendReply} className="teams-toast-reply-form">
                  <input
                    ref={replyInputRef}
                    type="text"
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    placeholder="Type a reply..."
                    className="teams-toast-reply-input"
                    disabled={isSending}
                    onKeyDown={(e) => {
                      if (e.key === 'Escape') setIsReplying(false);
                    }}
                  />
                  <button
                    type="submit"
                    disabled={!replyText.trim() || isSending}
                    className="teams-toast-reply-send-btn"
                    title="Send reply (Enter)"
                    aria-label="Send reply"
                  >
                    <Send size={13} />
                  </button>
                </form>
              )}
            </div>
          ) : (
            <div className="teams-toast-actions">
              <button
                type="button"
                onClick={() => setIsReplying(true)}
                className="teams-toast-action-btn"
              >
                <CornerDownRight size={12} />
                <span>Reply</span>
              </button>
              {notification.linkUrl && (
                <button
                  type="button"
                  onClick={() => {
                    handleDismiss();
                    navigate(notification.linkUrl);
                  }}
                  className="teams-toast-action-btn teams-toast-action-btn--primary"
                >
                  <ExternalLink size={12} />
                  <span>Open</span>
                </button>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}

/**
 * Host component mounted globally in AppShell that renders
 * Microsoft Teams-style toasts in the bottom right corner.
 */
export default function TeamsNotificationHost() {
  const [toasts, setToasts] = useState([]);
  const { user: currentUser } = useAuth();
  const currentUserRef = useRef(currentUser);

  useEffect(() => {
    currentUserRef.current = currentUser;
  }, [currentUser]);

  useEffect(() => {
    let prevCount = 0;
    const unsub = teamsToastService.subscribe((items) => {
      setToasts(items);
      // If a new toast was pushed, play subtle Teams chime
      if (items.length > prevCount) {
        playTeamsChime();
      }
      prevCount = items.length;
    });

    const unsubChat = chatSocketService.on('new_message', (msg) => {
      if (!msg) return;

      // Don't show toast for current user's own messages
      const curr = currentUserRef.current;
      const curId = curr?.id || curr?.userId || curr?.sub;
      if (curId && String(msg.senderId) === String(curId)) return;

      const pathname = window.location.pathname;
      const search = window.location.search;

      // If user is currently looking at this exact channel, don't show duplicate toast
      if (pathname.includes('/chat')) {
        const urlParams = new URLSearchParams(search);
        const activeChId = urlParams.get('channelId') || pathname.split('/chat/')[1];
        if (activeChId && String(activeChId) === String(msg.channelId)) {
          return;
        }
      }

      teamsToastService.show({
        id: `chat-${msg.id || Date.now()}`,
        type: msg.channelType === 'DIRECT' ? 'CHAT_DM' : 'CHAT_CHANNEL',
        title: msg.senderName || msg.sender_name || 'New Message',
        message: msg.content || (msg.attachments?.length ? 'Sent an attachment' : 'New message'),
        linkUrl: `/chat?channelId=${msg.channelId}`,
        data: {
          channelId: msg.channelId,
          channelName: msg.channelName,
          senderName: msg.senderName || msg.sender_name,
        },
      });
    });

    return () => {
      unsub();
      unsubChat();
    };
  }, []);

  if (toasts.length === 0) return null;

  return (
    <div className="teams-toast-container" role="region" aria-label="Incoming notifications">
      {toasts.map((toast) => (
        <TeamsNotificationCard
          key={toast.toastId}
          notification={toast}
          onDismiss={(id) => teamsToastService.dismiss(id)}
        />
      ))}
    </div>
  );
}
