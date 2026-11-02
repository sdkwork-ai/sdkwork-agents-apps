import React, { useState } from 'react';
import { motion } from 'motion/react';
import {
  DriveUploadImage,
  useDriveUploadImageController,
  useDriveUploadImageSnapshot,
} from '@sdkwork/drive-mobile-react-upload-image';
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

export const EditBasicInfoModal: React.FC<{
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
  /** Receives the durable avatar reference (a `drive://` uri or legacy url). */
  onSave: (name: string, desc: string, avatar: string) => void;
}> = ({
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
      toast(failure.error.message.trim() || '头像上传失败，请重试', 'error');
    },
    onUploaded: (values) => {
      setTempAvatar(values[values.length - 1]?.uri ?? '');
    },
  });
  const avatarSnapshot = useDriveUploadImageSnapshot(avatarController);

  React.useEffect(() => {
    if (isOpen) {
      setTempName(initialName);
      setTempDesc(initialDesc);
      setTempAvatar(initialAvatar);
      // Drops leftover pending/error picks from an earlier session; the
      // controlled `value` below re-seeds the persisted avatar.
      avatarController.clear();
    }
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
        const detail = error instanceof Error && error.message.trim() ? error.message : '';
        toast(detail || '头像上传失败，请重试', 'error');
        return;
      } finally {
        setAnchoringAvatar(false);
      }
    }
    onSave(tempName, tempDesc, avatarForSave);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[var(--color-scrim,rgba(10,27,61,0.45))]">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-[480px] bg-[var(--color-surface-color,#FFFFFF)] rounded-xl flex flex-col overflow-hidden"
      >
        <div className="flex items-center justify-between p-4 bg-[var(--color-surface-color,#FFFFFF)]">
          <h3 className="font-medium text-[var(--color-text-primary,#0A1B3D)]">编辑基础信息</h3>
        </div>
        <div className="p-6 space-y-4">
          <div className="flex flex-col items-center justify-center mb-2">
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
             <label className="block text-sm text-[var(--color-text-secondary,#5B6B88)] mb-1.5">智能体名称</label>
             <input type="text" value={tempName} onChange={e => setTempName(e.target.value)} className="w-full bg-[var(--color-input-bg,#EAF1FB)] rounded-lg py-2.5 px-3 text-sm text-[var(--color-text-primary,#0A1B3D)] outline-none transition-colors" />
          </div>
          <div>
             <label className="block text-sm text-[var(--color-text-secondary,#5B6B88)] mb-1.5">简介</label>
             <textarea value={tempDesc} onChange={e => setTempDesc(e.target.value)} className="w-full bg-[var(--color-input-bg,#EAF1FB)] rounded-lg py-2.5 px-3 text-sm text-[var(--color-text-primary,#0A1B3D)] outline-none h-20 resize-none transition-colors custom-scrollbar" />
          </div>
        </div>
        <div className="flex justify-end gap-2 p-4 bg-[var(--color-surface-color,#FFFFFF)]">
          <button onClick={onClose} className="px-4 py-2 rounded bg-[var(--color-surface-muted,#EAF1FB)] text-[var(--color-text-primary,#0A1B3D)] hover:bg-[var(--color-surface-strong,#DCE8F9)] transition-colors text-sm">取消</button>
          <button
            disabled={!tempName.trim() || avatarSnapshot.isUploading || anchoringAvatar}
            onClick={() => void handleSave()}
            className="px-4 py-2 rounded bg-[var(--color-success,#00B42A)] hover:bg-[var(--color-success,#00B42A)] disabled:bg-[var(--color-success,#00B42A)]/50 text-white transition-colors text-sm"
          >{avatarSnapshot.isUploading || anchoringAvatar ? '上传中' : '保存'}</button>
        </div>
      </motion.div>
    </div>
  );
};
