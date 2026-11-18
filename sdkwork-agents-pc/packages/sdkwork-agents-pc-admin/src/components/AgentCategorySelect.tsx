import { useState } from 'react';

import type { AgentCategoryRecord } from '@sdkwork/agents-pc-core/sdk/agentsBackendSdkClient';

import { useAgentAdminCopy } from '../agentAdminCopy';
import { SelectionField } from './SelectionField';
import { SelectionModal } from './SelectionModal';

/**
 * Single-select agent category picker.
 *
 * The managed taxonomy is two levels: domains group the assignable leaf
 * specialties. Agents must reference a leaf, so domains are excluded from the
 * options while still providing context in each option description.
 */
export function AgentCategorySelect({
  categories,
  value,
  onChange,
  disabled = false,
}: {
  categories: readonly AgentCategoryRecord[];
  value: string;
  onChange: (categoryCode: string) => void;
  disabled?: boolean;
}) {
  const copy = useAgentAdminCopy();
  const [open, setOpen] = useState(false);
  const selected = categories.find((category) => category.categoryCode === value);
  const chips = selected
    ? [{ key: selected.categoryCode, label: selected.name }]
    : value
      ? [{ key: value, label: value }]
      : [];

  const parentIds = new Set(
    categories.map((category) => category.parentId).filter((parentId): parentId is string => Boolean(parentId)),
  );
  const byId = new Map(categories.map((category) => [category.id, category]));
  const leaves = categories
    .filter(
      (category) =>
        !parentIds.has(category.id)
        && (category.lifecycleStatus === 'active' || category.categoryCode === value),
    )
    .slice()
    .sort((left, right) => left.name.localeCompare(right.name));

  const options = leaves.map((category) => {
    const parent = category.parentId ? byId.get(category.parentId) : undefined;
    return {
      value: category.categoryCode,
      label: category.name,
      description: [parent?.name, category.categoryCode].filter(Boolean).join(' · '),
    };
  });

  return (
    <>
      <SelectionField
        label={copy.edit.fields.category}
        placeholder={copy.edit.categoryNone}
        selected={chips}
        onOpen={() => setOpen(true)}
        disabled={disabled}
        expanded={open}
        tone="blue"
        hint={copy.edit.categoryLeafHint}
      />
      <SelectionModal
        open={open}
        title={copy.edit.categoryPickerTitle}
        description={copy.edit.categoryPickerDescription}
        options={options}
        value={value ? [value] : []}
        onCancel={() => setOpen(false)}
        onConfirm={(next) => {
          setOpen(false);
          onChange(next[0] ?? '');
        }}
        searchPlaceholder={copy.selection.searchPlaceholder}
        noMatchLabel={copy.selection.noMatch}
        selectedCountLabel={copy.selection.selectedCount}
        cancelLabel={copy.selection.cancel}
        confirmLabel={copy.selection.confirm}
        clearLabel={copy.selection.clear}
        emptyOptionLabel={copy.edit.categoryNone}
        singleSelect
        closeLabel={copy.overlay.close}
      />
    </>
  );
}
