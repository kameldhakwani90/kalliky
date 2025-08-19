-- ============================================================================
-- PERFORMANCE INDEXES - Amélioration des requêtes fréquentes
-- ============================================================================

-- Index pour Call.telnyxCallId (lookup par ID Telnyx)
CREATE INDEX IF NOT EXISTS "Call_telnyxCallId_idx" ON "Call"("telnyxCallId");

-- Index composé pour Customer.phone + businessId (lookup clients)
CREATE INDEX IF NOT EXISTS "Customer_phone_businessId_idx" ON "Customer"("phone", "businessId");

-- Index pour Call.businessId (statistiques par business)
CREATE INDEX IF NOT EXISTS "Call_businessId_idx" ON "Call"("businessId");

-- Index pour Call.customerId (historique client)
CREATE INDEX IF NOT EXISTS "Call_customerId_idx" ON "Call"("customerId");

-- Index pour Call.createdAt (tri chronologique)
CREATE INDEX IF NOT EXISTS "Call_createdAt_idx" ON "Call"("createdAt");

-- Index pour Order.customerId (commandes par client)
CREATE INDEX IF NOT EXISTS "Order_customerId_idx" ON "Order"("customerId");

-- Index pour Order.storeId + createdAt (stats boutique)
CREATE INDEX IF NOT EXISTS "Order_storeId_createdAt_idx" ON "Order"("storeId", "createdAt");

-- Index pour ActivityLog.storeId + createdAt (activités boutique)
CREATE INDEX IF NOT EXISTS "ActivityLog_storeId_createdAt_idx" ON "ActivityLog"("storeId", "createdAt");

-- Index pour AIConversationSession.isActive (sessions actives)
CREATE INDEX IF NOT EXISTS "AIConversationSession_isActive_idx" ON "AIConversationSession"("isActive") WHERE "isActive" = true;

-- Index pour PhoneNumber.businessId (numéros par business)
CREATE INDEX IF NOT EXISTS "PhoneNumber_businessId_idx" ON "PhoneNumber"("businessId");

-- Index pour Store.businessId (boutiques par business)
CREATE INDEX IF NOT EXISTS "Store_businessId_idx" ON "Store"("businessId");

-- Index pour Product.storeId + status (produits actifs par boutique)
CREATE INDEX IF NOT EXISTS "Product_storeId_status_idx" ON "Product"("storeId", "status");

-- Index pour Reservation.storeId + startDateTime (réservations par boutique)
CREATE INDEX IF NOT EXISTS "Reservation_storeId_startDateTime_idx" ON "Reservation"("storeId", "startDateTime");

-- Index pour Consultation.storeId + scheduledAt (consultations par boutique)  
CREATE INDEX IF NOT EXISTS "Consultation_storeId_scheduledAt_idx" ON "Consultation"("storeId", "scheduledAt");

-- Index pour Customer.businessId + status (clients actifs par business)
CREATE INDEX IF NOT EXISTS "Customer_businessId_status_idx" ON "Customer"("businessId", "status");

-- Index pour Customer.businessId + lastSeen (clients récents)
CREATE INDEX IF NOT EXISTS "Customer_businessId_lastSeen_idx" ON "Customer"("businessId", "lastSeen");

-- Index pour Subscription.businessId (abonnements par business)
CREATE INDEX IF NOT EXISTS "Subscription_businessId_idx" ON "Subscription"("businessId");

-- Index pour Call.status + businessId (appels par statut et business)
CREATE INDEX IF NOT EXISTS "Call_status_businessId_idx" ON "Call"("status", "businessId");