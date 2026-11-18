import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  X, Check, Shield, Cpu, Key, LogOut, Code, AlertCircle,
  Laptop, Smartphone, CreditCard, ChevronRight, Activity, Copy, Sparkles
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import {
  readProfileAvatarIndex,
  readProfileBio,
  writeProfileAvatarIndex,
  writeProfileBio,
} from '@sdkwork/agents-pc-commons';
import {
  resolveAppSdkDisplayName,
  resolveAppSdkUserEmail,
} from '@sdkwork/agents-pc-core/session';
import { ProfileTab } from './profile/ProfileTab';
import { BillingTab } from './profile/BillingTab';
import { UsageTab } from './profile/UsageTab';
import { SecurityTab } from './profile/SecurityTab';
import { DeveloperTab } from './profile/DeveloperTab';

interface UserProfileModalProps {
  onClose: () => void;
  initialTab?: 'profile' | 'billing' | 'usage' | 'security' | 'developer';
}

interface ActiveSession {
  id: string;
  device: string;
  browser: string;
  ip: string;
  location: string;
  activeNow: boolean;
  type: 'desktop' | 'mobile';
}

const AVATAR_COLOR_TEMPLATES = [
  { name: 'Sky Blue', class: 'bg-[#165DFF] text-white', colorHex: '#165DFF' },
  { name: 'Emerald', class: 'bg-emerald-500 text-white', colorHex: '#10b981' },
  { name: 'Violet', class: 'bg-violet-500 text-white', colorHex: '#8b5cf6' },
  { name: 'Sunset Orange', class: 'bg-orange-500 text-white', colorHex: '#f97316' },
  { name: 'Rose', class: 'bg-rose-500 text-white', colorHex: '#f43f5e' },
  { name: 'Midnight', class: 'bg-[#1f1f1f] text-white', colorHex: '#1f1f1f' }
];

export const UserProfileModal: React.FC<UserProfileModalProps> = ({ onClose, initialTab = 'profile' }) => {
  const { t } = useTranslation('settings');
  const { t: tCommon } = useTranslation('common');

  // Identity is owned by the IAM session; the editable presentation fields
  // (bio, avatar style) are account-scoped, so a different account never sees
  // the previous account's profile and nothing is duplicated locally.
  const [username, setUsername] = useState(
    () => resolveAppSdkDisplayName() ?? tCommon('mockUserName'),
  );
  const [email, setEmail] = useState(() => resolveAppSdkUserEmail() ?? '');
  const [bio, setBio] = useState(() => readProfileBio() || t('defaultBio'));
  const [avatarIndex, setAvatarIndex] = useState(
    () => readProfileAvatarIndex(AVATAR_COLOR_TEMPLATES.length),
  );

  const [activeTab, setActiveTab] = useState<'profile' | 'billing' | 'usage' | 'security' | 'developer'>(initialTab);
  const [isToastVisible, setIsToastVisible] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  // Active device sessions are owned by the IAM session manager. The list
  // stays empty until the session API is wired into this surface; no
  // fabricated devices are rendered.
  const [sessions, setSessions] = useState<ActiveSession[]>([]);

  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setIsToastVisible(true);
  };

  useEffect(() => {
    if (isToastVisible) {
      const timer = setTimeout(() => setIsToastVisible(false), 2500);
      return () => clearTimeout(timer);
    }
  }, [isToastVisible]);

  const handleSaveProfile = () => {
    setIsSaving(true);
    setTimeout(() => {
      // Only the fields without an IAM projection are persisted, and they are
      // account-scoped. Display name and email stay owned by the session.
      writeProfileBio(bio);
      writeProfileAvatarIndex(avatarIndex);
      setUsername(resolveAppSdkDisplayName() ?? tCommon('mockUserName'));
      setEmail(resolveAppSdkUserEmail() ?? '');
      setIsSaving(false);
      triggerToast(t('saveProfile') + ' - ' + tCommon('copied').replace('!', ''));
    }, 600);
  };

  const handleRevokeSessions = () => {
    setSessions(prev => prev.filter(s => s.activeNow));
    triggerToast(t('revokeAll'));
  };

  const handleCopyCode = () => {
    const codeText = `import { ChatService } from '@sdkwork/agents-pc-chat';

// 1. Configure standard streams
await ChatService.streamChat({
  model: 'gemini-2.5-flash',
  vendor: 'Google',
  messages: [
    { role: 'user', text: 'Hello, World!' }
  ],
  onMessageUpdate: (text) => {
    console.log("Chunk received:", text);
  },
  onComplete: () => {
    console.log("Stream delivery finished.");
  }
});`;

    navigator.clipboard.writeText(codeText);
    triggerToast(t('copiedSnippet'));
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      {/* Toast Alert */}
      <AnimatePresence>
        {isToastVisible && (
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            className="fixed top-6 left-1/2 -translate-x-1/2 bg-gray-900 text-white py-3 px-6 rounded-xl flex items-center gap-2.5 text-sm font-medium z-999"
          >
            <Sparkles size={16} className="text-[#165DFF] animate-pulse" />
            <span>{toastMessage}</span>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.div
        id="user-profile-modal-container"
        initial={{ opacity: 0, scale: 0.97, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.97, y: 15 }}
        className="bg-white dark:bg-[#1e1e1e] rounded-3xl w-full max-w-4xl h-[700px] overflow-hidden flex flex-col max-h-[92vh]"
      >
        {/* Header bar */}
        <div className="px-6 py-5 flex justify-between items-center bg-gray-50/50 dark:bg-zinc-900/45 shrink-0">
          <div className="flex items-center gap-3">
            <div className={`w-8 h-8 rounded-xl ${AVATAR_COLOR_TEMPLATES[avatarIndex].class} flex items-center justify-center font-bold text-sm transition-all duration-300`}>
              {username.substring(0, 2).toUpperCase()}
            </div>
            <div>
              <h2 className="font-semibold text-base text-gray-900 dark:text-white leading-none mb-0.5">{t('profile')}</h2>
              <p className="text-[11px] text-gray-500 dark:text-zinc-400 font-mono">{t('profileDetail')}</p>
            </div>
            </div>
          <button
            onClick={onClose}
            className="text-gray-400 dark:text-zinc-500 hover:text-gray-800 dark:hover:text-zinc-200 p-1.5 rounded-xl hover:bg-gray-100 dark:hover:bg-zinc-800/80 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Modal body (Sidebar/Content layout) */}
        <div className="flex flex-1 min-h-0 overflow-hidden">
          {/* Left Navigation tabs */}
          <div className="w-56 bg-gray-50/50 dark:bg-zinc-900/10 p-4 shrink-0 flex flex-col justify-between">
            <div className="space-y-1">
              {[
                { id: 'profile', label: t('profile'), icon: <Cpu size={16} /> },
                { id: 'billing', label: t('plan'), icon: <CreditCard size={16} /> },
                { id: 'usage', label: t('usage'), icon: <Activity size={16} /> },
                { id: 'security', label: t('sessions'), icon: <Shield size={16} /> },
                { id: 'developer', label: t('developer'), icon: <Code size={16} /> },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl text-xs font-semibold tracking-wide transition-all ${
                    activeTab === tab.id
                    ? 'bg-[#165DFF] text-white'
                      : 'text-gray-600 dark:text-zinc-300 hover:bg-gray-100 dark:hover:bg-zinc-800/60'
                  }`}
                >
                  <span className="shrink-0">{tab.icon}</span>
                  <span className="truncate flex-1 text-left">{tab.label}</span>
                </button>
              ))}
            </div>

            </div>

          {/* Right workspace panels */}
          <div className="flex-1 overflow-y-auto p-8 relative bg-white dark:bg-[#1d1d1d]">

            {activeTab === 'profile' && (
              <ProfileTab
                t={t}
                tCommon={tCommon}
                username={username}
                setUsername={setUsername}
                email={email}
                setEmail={setEmail}
                bio={bio}
                setBio={setBio}
                avatarIndex={avatarIndex}
                setAvatarIndex={setAvatarIndex}
                isSaving={isSaving}
                handleSaveProfile={handleSaveProfile}
                AVATAR_COLOR_TEMPLATES={AVATAR_COLOR_TEMPLATES}
              />
            )}

            {activeTab === 'billing' && (
              <BillingTab
                t={t}
                tCommon={tCommon}
              />
            )}

            {activeTab === 'usage' && (
              <UsageTab
                t={t}
              />
            )}

            {activeTab === 'security' && (
              <SecurityTab
                t={t}
                sessions={sessions}
                setSessions={setSessions}
                handleRevokeSessions={handleRevokeSessions}
                triggerToast={triggerToast}
              />
            )}

            {activeTab === 'developer' && (
              <DeveloperTab
                t={t}
                handleCopyCode={handleCopyCode}
              />
            )}

          </div>
          </div>
      </motion.div>
    </div>
  );
};
