/**
 * Tool invocation card rendering contract (`BotMessageItem` ToolCallCard).
 *
 * The chat UI replaces raw MCP tool ids (`mcp__generations__video.create`) and raw
 * argument JSON with a localized action title, a media-generation placeholder while the
 * tool is running, and inline media once results arrive. This test pins the user-visible
 * output through server-side rendering so the card cannot regress to raw ids or raw JSON.
 */
import assert from 'node:assert/strict';
import test from 'node:test';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { createInstance, type i18n as I18n } from 'i18next';
import { I18nextProvider } from 'react-i18next';

import { BotMessageItem } from '../packages/sdkwork-agents-pc-chat/src/components/BotMessageItem';
import type { ChatMessage, ChatToolCall } from '../packages/sdkwork-agents-pc-chat/src/types';

/** Minimal common-namespace resources mirroring shell.json tool-card keys. */
const COMMON_RESOURCES: Record<string, string> = {
  'toolTitle.image.create': '生成图片',
  'toolTitle.image.retrieve': '查询图片结果',
  'toolTitle.video.create': '生成视频',
  'toolTitle.video.retrieve': '查询视频结果',
  'toolTitle.music.create': '生成音乐',
  'toolTitle.music.retrieve': '查询音乐结果',
  'toolTitle.speech.create': '语音合成',
  'toolTitle.sfx.create': '生成音效',
  'toolTitle.transcriptions.create': '语音转文字',
  'toolTitle.translations.create': '语音翻译',
  'toolProgress.image': '图片生成中…',
  'toolProgress.video': '视频生成中…',
  'toolProgress.audio': '音频合成中…',
  'toolDone.image': '图片已生成',
  'toolDone.video': '视频已生成',
  'toolDone.audio': '音频已生成',
  'toolDone.media': '媒体已生成',
  'toolPlaceholder.hint': '通常需要十几秒，请稍候',
  toolCall: '工具调用',
  toolFailed: '执行失败',
};

async function createTestI18n(): Promise<I18n> {
  const instance = createInstance();
  await instance.init({
    lng: 'zh-CN',
    fallbackLng: 'zh-CN',
    keySeparator: false,
    nsSeparator: ':',
    defaultNS: 'common',
    resources: {
      'zh-CN': { common: COMMON_RESOURCES },
    },
  });
  return instance;
}

function renderBotMessage(tools: ChatToolCall[], html: string, i18n: I18n): string {
  const message: ChatMessage = {
    id: 'message-1',
    role: 'model',
    text: '',
    toolCalls: tools,
  };
  return renderToStaticMarkup(
    React.createElement(
      I18nextProvider,
      { i18n },
      React.createElement(BotMessageItem, {
        message,
        copiedId: null,
        feedback: {},
        handleCopy: () => undefined,
        handleFeedback: () => undefined,
        onOpenArtifact: () => undefined,
      }),
    ),
  );
}

test('running video-create tool renders a localized title and media placeholder', async () => {
  const i18n = await createTestI18n();
  const html = renderBotMessage(
    [
      {
        id: 'call-1',
        name: 'mcp__generations__video.create',
        status: 'running',
        arguments: JSON.stringify({
          prompt: '生成一段海浪拍打礁石的视频',
          model: 'viduq3',
          vendor: 'vidu',
          durationSeconds: 5,
        }),
      },
    ],
    '',
    i18n,
  );
  assert.match(html, /生成视频/);
  assert.match(html, /视频生成中/);
  assert.match(html, /通常需要十几秒，请稍候/);
  // The raw MCP id and raw argument JSON stay out of the collapsed running card.
  assert.ok(!html.includes('mcp__generations__video.create'));
  assert.ok(!html.includes('viduq3'));
});

test('completed tool with media renders inline media instead of raw payloads', async () => {
  const i18n = await createTestI18n();
  const html = renderBotMessage(
    [
      {
        id: 'call-2',
        name: 'mcp__generations__image.create',
        status: 'completed',
        arguments: JSON.stringify({ prompt: '画一只橙色的猫', model: 'gemini-image-pro' }),
        media: [{ kind: 'image', url: 'https://cdn.example/img-1.png' }],
      },
    ],
    '',
    i18n,
  );
  assert.match(html, /生成图片/);
  assert.match(html, /<img[^>]*src="https:\/\/cdn\.example\/img-1\.png"/);
  assert.match(html, /图片已生成/);
  assert.ok(!html.includes('gemini-image-pro'));
});

test('non-media and unrecognized tools keep readable titles', async () => {
  const i18n = await createTestI18n();
  const html = renderBotMessage(
    [
      { id: 'call-3', name: 'mcp__generations__music.create', status: 'completed' },
      { id: 'call-4', name: 'intelligence.model.list', status: 'completed' },
    ],
    '',
    i18n,
  );
  assert.match(html, /生成音乐/);
  assert.match(html, /intelligence\.model\.list/);
});
