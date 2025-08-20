// ============================================================================
// PAGE ADMIN - Monitoring Telnyx & Remboursements
// ============================================================================

'use client';

import TelnyxFailuresManager from '@/components/admin/TelnyxFailuresManager';

export default function TelnyxMonitoringPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Monitoring Telnyx & Remboursements</h1>
        <p className="text-muted-foreground mt-2">
          Surveillez les échecs d'attribution Telnyx et gérez les remboursements automatiques
        </p>
      </div>
      
      <TelnyxFailuresManager />
    </div>
  );
}