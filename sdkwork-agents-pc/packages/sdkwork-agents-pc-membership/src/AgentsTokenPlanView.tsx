import {
  SdkworkSubscriptionCatalogPage,
  sdkworkSubscriptionCatalogHostComponents,
} from '@sdkwork/membership-pc-subscription/catalog';
import { useEffect, useState } from 'react';
import {
  AgentsTokenPlanCheckoutModal,
  AgentsTokenPlanPointsDetailsModal,
  AgentsTokenPlanPointsPurchaseModal,
  AgentsTokenPlanRedeemModal,
} from './TokenPlanModals';
import { useAgentsTokenPlanMemberSummary } from './memberSummary';
import { useAgentsTokenPlanNotify } from './notify';
import { getAgentsTokenPlanRuntime } from './runtime';

export function AgentsTokenPlanView() {
  const initialRuntime = getAgentsTokenPlanRuntime();
  const [isReady, setIsReady] = useState(() => !initialRuntime.prepare);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    if (!initialRuntime.prepare) return;
    let cancelled = false;
    Promise.resolve(initialRuntime.prepare())
      .then(() => { if (!cancelled) setIsReady(true); })
      .catch((reason: unknown) => {
        if (!cancelled) {
          setLoadError(reason instanceof Error ? reason.message : '会员服务加载失败。');
        }
      });
    return () => { cancelled = true; };
  }, [initialRuntime]);

  if (loadError) {
    return <div className="flex h-full items-center justify-center bg-[var(--ag-color-surface,#FFFFFF)] px-6 text-sm text-[var(--ag-color-danger,#F53F3F)]">{loadError}</div>;
  }
  if (!isReady) {
    return <div className="flex h-full items-center justify-center bg-[var(--ag-color-surface,#FFFFFF)] px-6 text-sm text-[var(--ag-color-text-tertiary,#8A97AD)]">正在加载会员方案...</div>;
  }
  return <AgentsTokenPlanCatalog />;
}

function AgentsTokenPlanCatalog() {
  const { memberSummary, refreshMembership, setMembershipTierKey } = useAgentsTokenPlanMemberSummary();
  const { NotifyOutlet, onNotify } = useAgentsTokenPlanNotify();
  const runtime = getAgentsTokenPlanRuntime();

  return (
    <div className="h-full min-h-0 overflow-y-auto bg-[var(--ag-color-surface,#FFFFFF)]" data-agents-token-plan>
      <div className="mx-auto w-full max-w-7xl">
        <SdkworkSubscriptionCatalogPage
          checkoutPort={runtime.checkoutService}
          components={{
            ...sdkworkSubscriptionCatalogHostComponents,
            checkoutModal: AgentsTokenPlanCheckoutModal,
            pointsDetailsModal: AgentsTokenPlanPointsDetailsModal,
            pointsPurchaseModal: AgentsTokenPlanPointsPurchaseModal,
            redeemModal: AgentsTokenPlanRedeemModal,
          }}
          memberSummary={memberSummary}
          notifyOutlet={NotifyOutlet}
          onLoginRequired={runtime.onLoginRequired}
          onMembershipTierUpdated={(membershipTierKey) => {
            setMembershipTierKey(membershipTierKey);
            void refreshMembership().catch(() => undefined);
          }}
          onNotify={onNotify}
        />
      </div>
      </div>
  );
}
