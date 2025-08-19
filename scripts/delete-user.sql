-- Script pour supprimer complètement un utilisateur et toutes ses données
-- Remplacer 'medkamel.dhakwani@gmail.com' par l'email de l'utilisateur à supprimer

BEGIN;

-- 1. Supprimer les numéros de téléphone liés aux businesses
DELETE FROM PhoneNumber 
WHERE businessId IN (
  SELECT b.id FROM Business b 
  JOIN "User" u ON b.ownerId = u.id 
  WHERE u.email = 'medkamel.dhakwani@gmail.com'
);

-- 2. Supprimer les abonnements liés aux stores
DELETE FROM Subscription 
WHERE storeId IN (
  SELECT s.id FROM Store s 
  JOIN Business b ON s.businessId = b.id
  JOIN "User" u ON b.ownerId = u.id 
  WHERE u.email = 'medkamel.dhakwani@gmail.com'
);

-- 3. Supprimer les données d'usage liées aux stores
DELETE FROM UsageTracking 
WHERE storeId IN (
  SELECT s.id FROM Store s 
  JOIN Business b ON s.businessId = b.id
  JOIN "User" u ON b.ownerId = u.id 
  WHERE u.email = 'medkamel.dhakwani@gmail.com'
);

-- 4. Supprimer les commandes liées aux businesses
DELETE FROM "Order" 
WHERE businessId IN (
  SELECT b.id FROM Business b 
  JOIN "User" u ON b.ownerId = u.id 
  WHERE u.email = 'medkamel.dhakwani@gmail.com'
);

-- 5. Supprimer les clients liés aux businesses
DELETE FROM Customer 
WHERE businessId IN (
  SELECT b.id FROM Business b 
  JOIN "User" u ON b.ownerId = u.id 
  WHERE u.email = 'medkamel.dhakwani@gmail.com'
);

-- 6. Supprimer les stores
DELETE FROM Store 
WHERE businessId IN (
  SELECT b.id FROM Business b 
  JOIN "User" u ON b.ownerId = u.id 
  WHERE u.email = 'medkamel.dhakwani@gmail.com'
);

-- 7. Supprimer les factures liées aux businesses
DELETE FROM Invoice 
WHERE businessId IN (
  SELECT b.id FROM Business b 
  JOIN "User" u ON b.ownerId = u.id 
  WHERE u.email = 'medkamel.dhakwani@gmail.com'
);

-- 8. Supprimer les appels liés aux businesses
DELETE FROM Call 
WHERE businessId IN (
  SELECT b.id FROM Business b 
  JOIN "User" u ON b.ownerId = u.id 
  WHERE u.email = 'medkamel.dhakwani@gmail.com'
);

-- 9. Supprimer les rapports liés aux businesses
DELETE FROM Report 
WHERE businessId IN (
  SELECT b.id FROM Business b 
  JOIN "User" u ON b.ownerId = u.id 
  WHERE u.email = 'medkamel.dhakwani@gmail.com'
);

-- 10. Supprimer les abonnements liés aux businesses (ancien modèle)
DELETE FROM Subscription 
WHERE businessId IN (
  SELECT b.id FROM Business b 
  JOIN "User" u ON b.ownerId = u.id 
  WHERE u.email = 'medkamel.dhakwani@gmail.com'
);

-- 11. Supprimer les businesses
DELETE FROM Business 
WHERE ownerId IN (
  SELECT id FROM "User" 
  WHERE email = 'medkamel.dhakwani@gmail.com'
);

-- 12. Supprimer les usages trial avec l'email
DELETE FROM TrialUsage 
WHERE identifier = 'medkamel.dhakwani@gmail.com' AND identifierType = 'email';

-- 13. Supprimer l'utilisateur
DELETE FROM "User" 
WHERE email = 'medkamel.dhakwani@gmail.com';

COMMIT;

-- Vérifier que tout a été supprimé
SELECT 'Users restants:' as info, COUNT(*) as count FROM "User" WHERE email = 'medkamel.dhakwani@gmail.com'
UNION ALL
SELECT 'Businesses restants:', COUNT(*) FROM Business b JOIN "User" u ON b.ownerId = u.id WHERE u.email = 'medkamel.dhakwani@gmail.com'
UNION ALL
SELECT 'Stores restants:', COUNT(*) FROM Store s JOIN Business b ON s.businessId = b.id JOIN "User" u ON b.ownerId = u.id WHERE u.email = 'medkamel.dhakwani@gmail.com';