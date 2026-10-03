import React, { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import {
  DriveUploadImage,
  useDriveUploadImageController,
  useDriveUploadImageSnapshot,
} from 'sdkwork-drive-pc-upload-image';
import type {
  DriveUploadImageService,
  DriveUploadImageValue,
} from '@sdkwork/drive-upload-image-core';

import { toast } from './Toast';

const AVATAR_UPLOAD_COPY = {
  pickImage: '上传头像',
  replaceImage: '更换头像',
  removeImage: '移除',
  retryUpload: '重试',
  uploading: '上传中',
  uploadFailed: '上传失败',
} as const;

/**
 * Maps the modal's persisted avatar string (a `drive://` uri, a legacy
 * display url, or empty) onto the shared component's persist-safe value.
 */
function toAvatarUploadValue(avatar: string): DriveUploadImageValue | null {
  if (!avatar) return null;
  return {
    uri: avatar,
    source: avatar.startsWith('drive://') ? 'drive' : 'external',
  };
}

export interface EditBasicInfoModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialName: string;
  initialDesc: string;
  /** Persisted avatar: a `drive://` uri, a legacy display url, or empty. */
  initialAvatar: string;
  /** Shared Drive image-upload service built by the host service layer. */
  avatarService: DriveUploadImageService;
  /**
   * Entity anchor at pick time; a function returning null keeps the picked
   * image pending for the persist-first flow (`DRIVE_SPEC.md` section 18.3).
   */
  avatarAppResourceId?: string | (() => string | null | undefined);
  /**
   * Persists the owning agent and returns its id; called on save when a
   * picked avatar is still pending because no anchor existed at pick time.
   */
  onEnsureAvatarAnchor: () => Promise<string | null>;
  onSave: (name: string, desc: string, avatar: string) => void;
}

export const EditBasicInfoModal: React.FC<EditBasicInfoModalProps> = ({
  isOpen,
  onClose,
  initialName,
  initialDesc,
  initialAvatar,
  avatarService,
  avatarAppResourceId,
  onEnsureAvatarAnchor,
  onSave,
}) => {
  const [tempName, setTempName] = useState(initialName);
  const [tempDesc, setTempDesc] = useState(initialDesc);
  const [tempAvatar, setTempAvatar] = useState(initialAvatar);
  const [anchoringAvatar, setAnchoringAvatar] = useState(false);

  const avatarController = useDriveUploadImageController({
    service: avatarService,
    resolveAppResourceId: () =>
      typeof avatarAppResourceId === 'function' ? avatarAppResourceId() : avatarAppResourceId ?? null,
    onFailed: (failure) => {
      console.error('Avatar Drive upload failed', failure.error);
      toast('头像上传失败，请检查登录状态和 Drive 服务', 'error');
    },
    onUploaded: (values) => {
      setTempAvatar(values[values.length - 1]?.uri ?? '');
    },
  });
  const avatarSnapshot = useDriveUploadImageSnapshot(avatarController);

  useEffect(() => {
    if (!isOpen) return;
    setTempName(initialName);
    setTempDesc(initialDesc);
    setTempAvatar(initialAvatar);
    // Drops leftover pending/error picks from an earlier session; the
    // controlled `value` below re-seeds the persisted avatar.
    avatarController.clear();
  }, [isOpen, initialName, initialDesc, initialAvatar, avatarController]);

  if (!isOpen) return null;

  const handleSave = async (): Promise<void> => {
    if (!tempName.trim() || avatarSnapshot.isUploading || anchoringAvatar) return;
    let avatarForSave = tempAvatar;
    if (avatarSnapshot.hasPending) {
      // The agent did not exist when the image was picked: persist first,
      // upload second, then keep the stable drive uri (section 18.3).
      setAnchoringAvatar(true);
      try {
        const anchor = await onEnsureAvatarAnchor();
        if (!anchor) {
          throw new Error('Persisted Agent id is required for avatar upload.');
        }
        const values = await avatarController.uploadPending({ appResourceId: anchor });
        avatarForSave = values[values.length - 1]?.uri ?? '';
      } catch (error) {
        console.error('Avatar Drive upload failed', error);
        toast('头像上传失败，请检查登录状态和 Drive 服务', 'error');
        return;
      } finally {
        setAnchoringAvatar(false);
      }
    }
    onSave(tempName, tempDesc, avatarForSave);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="flex w-[480px] flex-col overflow-hidden rounded-xl border border-slate-300 dark:border-white/10 bg-slate-50 dark:bg-[#222] shadow-2xl"
      >
        <div className="flex items-center justify-between border-b border-slate-200 dark:border-white/5 bg-slate-50 dark:bg-[#1a1a1a] p-4">
          <h3 className="font-medium text-slate-800 dark:text-gray-200">编辑基础信息</h3>
        </div>
        <div className="space-y-4 p-6">
          <div className="mb-2 flex flex-col items-center justify-center">
            <DriveUploadImage
              service={avatarService}
              controller={avatarController}
              value={toAvatarUploadValue(tempAvatar)}
              shape="circle"
              sizePx={80}
              copy={AVATAR_UPLOAD_COPY}
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm text-slate-500 dark:text-gray-400">智能体名称</label>
            <input
              type="text"
              value={tempName}
              onChange={(event) => setTempName(event.target.value)}
              className="w-full rounded-lg border border-slate-200 dark:border-white/5 bg-slate-50 dark:bg-[#181818] px-3 py-2.5 text-sm text-slate-800 dark:text-gray-200 outline-none transition-colors focus:border-slate-300 dark:focus:border-white/20"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm text-slate-500 dark:text-gray-400">简介</label>
            <textarea
              value={tempDesc}
              onChange={(event) => setTempDesc(event.target.value)}
              className="custom-scrollbar h-20 w-full resize-none rounded-lg border border-slate-200 dark:border-white/5 bg-slate-50 dark:bg-[#181818] px-3 py-2.5 text-sm text-slate-800 dark:text-gray-200 outline-none transition-colors focus:border-slate-300 dark:focus:border-white/20"
            />
          </div>
        </div>
        <div className="flex justify-end gap-2 border-t border-slate-200 dark:border-white/5 bg-slate-50 dark:bg-[#1a1a1a] p-4">
          <button
            type="button"
            onClick={onClose}
            className="rounded bg-slate-900/5 dark:bg-white/5 px-4 py-2 text-sm text-slate-700 dark:text-gray-300 hover:bg-slate-900/10 dark:hover:bg-white/10"
          >
            取消
          </button>
          <button
            type="button"
            disabled={!tempName.trim() || avatarSnapshot.isUploading || anchoringAvatar}
            onClick={() => void handleSave()}
            className="rounded bg-[#00b42a] px-4 py-2 text-sm text-white transition-colors hover:bg-[#009a24] disabled:bg-[#00b42a]/50"
          >
            {avatarSnapshot.isUploading || anchoringAvatar ? '上传中' : '保存'}
          </button>
        </div>
      </motion.div>
    </div>
  );
};
