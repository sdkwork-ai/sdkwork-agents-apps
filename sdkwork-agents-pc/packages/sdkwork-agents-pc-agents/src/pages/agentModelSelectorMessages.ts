import type { UnifiedAgentModelSelectorMessages } from '@sdkwork/models-pc-picker';

/**
 * Locale copy for the shared `UnifiedAgentModelSelector` in the agent editor.
 *
 * The picker is owned by `sdkwork-models`, so its button labels, empty states and
 * custom-model dialog copy are the models domain's; the host only supplies the
 * words. They are keyed `agentsConsoleModelSelector.*` in the `common` catalog
 * (the namespace this package already registers through
 * `agentsWorkbenchCommonCatalog`) so the editor stays translatable instead of
 * freezing Chinese into a fourth-party component.
 *
 * Every key is looked up with a Chinese default. That matters in both
 * directions: a host that registers the catalog gets proper `en-US` copy, and a
 * host that does not still renders words rather than raw keys. The defaults
 * mirror the strings `sdkwork-birdcoder-pc-i18n` already publishes for this same
 * component, so terminology does not drift between the two products.
 */

/**
 * The subset of i18next's `t` this module needs.
 *
 * Declared structurally so the package does not take an i18next dependency just
 * to name the parameter; `useTranslation().t` satisfies it as-is.
 */
export type DefaultedTranslator = (key: string, defaultValue: string) => string;

export function buildAgentModelSelectorMessages(
  t: DefaultedTranslator,
): UnifiedAgentModelSelectorMessages {
  return {
    addModel: t('agentsConsoleModelSelector.addModel', '添加模型'),
    addModelTitle: t('agentsConsoleModelSelector.addModelTitle', '添加自定义模型'),
    advancedSettings: t('agentsConsoleModelSelector.advancedSettings', '高级设置'),
    apiKeyLabel: t('agentsConsoleModelSelector.apiKeyLabel', 'API Key'),
    apiKeyPlaceholder: t(
      'agentsConsoleModelSelector.apiKeyPlaceholder',
      '输入模型服务 API Key',
    ),
    apiKeyRequired: t('agentsConsoleModelSelector.apiKeyRequired', '请输入 API Key。'),
    baseUrlInvalid: t(
      'agentsConsoleModelSelector.baseUrlInvalid',
      '请输入有效的 HTTP(S) Base URL。',
    ),
    baseUrlLabel: t('agentsConsoleModelSelector.baseUrlLabel', 'Base URL'),
    baseUrlPlaceholder: t(
      'agentsConsoleModelSelector.baseUrlPlaceholder',
      'https://api.example.com/v1',
    ),
    builtInModels: t('agentsConsoleModelSelector.builtInModels', '内置模型'),
    cancel: t('agentsConsoleModelSelector.cancel', '取消'),
    clearSearch: t('agentsConsoleModelSelector.clearSearch', '清除模型搜索'),
    close: t('agentsConsoleModelSelector.close', '关闭'),
    createFailed: t(
      'agentsConsoleModelSelector.createFailed',
      '无法保存并配置该模型。',
    ),
    creating: t('agentsConsoleModelSelector.creating', '正在保存...'),
    customModels: t('agentsConsoleModelSelector.customModels', '自定义模型'),
    customTag: t('agentsConsoleModelSelector.customTag', '自定义'),
    defaultModelLabel: t('agentsConsoleModelSelector.defaultModelLabel', '默认模型'),
    defaultModelPlaceholder: t(
      'agentsConsoleModelSelector.defaultModelPlaceholder',
      '输入默认模型 ID',
    ),
    defaultModelRequired: t(
      'agentsConsoleModelSelector.defaultModelRequired',
      '请输入默认模型 ID。',
    ),
    getApiKey: t('agentsConsoleModelSelector.getApiKey', '获取 API Key'),
    inputContextLabel: t(
      'agentsConsoleModelSelector.inputContextLabel',
      '输入上下文 Token 数',
    ),
    modelAlreadyExists: t(
      'agentsConsoleModelSelector.modelAlreadyExists',
      '该模型已存在。',
    ),
    modelSelectorLabel: t('agentsConsoleModelSelector.modelSelectorLabel', '可用模型'),
    multimodalLabel: t('agentsConsoleModelSelector.multimodalLabel', '多模态输入'),
    noModels: t('agentsConsoleModelSelector.noModels', '暂无可用模型'),
    noSearchResults: t(
      'agentsConsoleModelSelector.noSearchResults',
      '没有匹配的模型',
    ),
    notSupported: t('agentsConsoleModelSelector.notSupported', '不支持'),
    outputContextLabel: t(
      'agentsConsoleModelSelector.outputContextLabel',
      '输出上下文 Token 数',
    ),
    previewTag: t('agentsConsoleModelSelector.previewTag', '预览版'),
    providerRequired: t(
      'agentsConsoleModelSelector.providerRequired',
      '必须保留当前 Agent Provider。',
    ),
    providerSection: t(
      'agentsConsoleModelSelector.providerSection',
      '支持的 Agent Provider',
    ),
    searchPlaceholder: t('agentsConsoleModelSelector.searchPlaceholder', '搜索模型'),
    selectFailed: t(
      'agentsConsoleModelSelector.selectFailed',
      '无法为当前 Agent Provider 配置该模型。',
    ),
    submit: t('agentsConsoleModelSelector.submit', '保存模型'),
    supported: t('agentsConsoleModelSelector.supported', '支持'),
    supportedModelsLabel: t(
      'agentsConsoleModelSelector.supportedModelsLabel',
      '支持的模型',
    ),
    supportedModelsPlaceholder: t(
      'agentsConsoleModelSelector.supportedModelsPlaceholder',
      '每行一个模型 ID，或使用逗号分隔',
    ),
    supportedProvidersHint: t(
      'agentsConsoleModelSelector.supportedProvidersHint',
      '选择可使用此模型的 Agent Provider，默认全部选中。',
    ),
    toolCallRoundsLabel: t(
      'agentsConsoleModelSelector.toolCallRoundsLabel',
      '工具调用轮数',
    ),
    useSystemDefaultPlaceholder: t(
      'agentsConsoleModelSelector.useSystemDefaultPlaceholder',
      '使用系统默认值',
    ),
    vendorLabel: t('agentsConsoleModelSelector.vendorLabel', '模型厂商'),
    vendorPlaceholder: t(
      'agentsConsoleModelSelector.vendorPlaceholder',
      '例如：openai-compatible',
    ),
    vendorRequired: t('agentsConsoleModelSelector.vendorRequired', '请输入模型厂商。'),
  };
}
