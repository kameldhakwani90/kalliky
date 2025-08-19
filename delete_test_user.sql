-- Script pour supprimer l'utilisateur de test medkamel.dhakwani@gmail.com
-- et toutes ses données associées

DO $$
DECLARE
    user_id_var VARCHAR;
    business_ids VARCHAR[];
    store_ids VARCHAR[];
BEGIN
    -- Trouver l'ID de l'utilisateur
    SELECT id INTO user_id_var FROM "User" WHERE email = 'medkamel.dhakwani@gmail.com';
    
    IF user_id_var IS NOT NULL THEN
        RAISE NOTICE 'Utilisateur trouvé avec ID: %', user_id_var;
        
        -- Récupérer les IDs des businesses
        SELECT ARRAY(SELECT id FROM "Business" WHERE "ownerId" = user_id_var) INTO business_ids;
        RAISE NOTICE 'Business IDs: %', business_ids;
        
        -- Récupérer les IDs des stores
        SELECT ARRAY(SELECT s.id FROM "Store" s 
                    JOIN "Business" b ON s."businessId" = b.id 
                    WHERE b."ownerId" = user_id_var) INTO store_ids;
        RAISE NOTICE 'Store IDs: %', store_ids;
        
        -- Supprimer dans l'ordre des dépendances
        DELETE FROM "UsageTracking" WHERE "storeId" = ANY(store_ids);
        RAISE NOTICE 'Supprimé UsageTracking pour les stores';
        
        DELETE FROM "Subscription" WHERE "storeId" = ANY(store_ids);
        RAISE NOTICE 'Supprimé Subscriptions pour les stores';
        
        DELETE FROM "TrialUsage" WHERE "userId" = user_id_var;
        RAISE NOTICE 'Supprimé TrialUsage pour utilisateur';
        
        DELETE FROM "PhoneNumber" WHERE "businessId" = ANY(business_ids);
        RAISE NOTICE 'Supprimé PhoneNumbers pour les businesses';
        
        DELETE FROM "Store" WHERE "businessId" = ANY(business_ids);
        RAISE NOTICE 'Supprimé Stores pour les businesses';
        
        DELETE FROM "Business" WHERE "ownerId" = user_id_var;
        RAISE NOTICE 'Supprimé Businesses pour utilisateur';
        
        DELETE FROM "User" WHERE id = user_id_var;
        RAISE NOTICE 'Supprimé User: %', user_id_var;
        
        RAISE NOTICE 'Utilisateur medkamel.dhakwani@gmail.com et toutes ses données ont été supprimés avec succès';
    ELSE
        RAISE NOTICE 'Utilisateur medkamel.dhakwani@gmail.com non trouvé dans la base';
    END IF;
END $$;