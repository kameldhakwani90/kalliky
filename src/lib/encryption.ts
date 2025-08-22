import CryptoJS from 'crypto-js';

// Clé de chiffrement - À MODIFIER et mettre dans les variables d'environnement
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || 'kalliky-default-encryption-key-2024-very-secret';

export class EncryptionService {
  /**
   * Chiffre une chaîne de caractères
   */
  static encrypt(text: string): string {
    if (!text) return '';
    
    try {
      const encrypted = CryptoJS.AES.encrypt(text, ENCRYPTION_KEY).toString();
      return encrypted;
    } catch (error) {
      console.error('Erreur de chiffrement:', error);
      throw new Error('Erreur lors du chiffrement');
    }
  }

  /**
   * Déchiffre une chaîne de caractères
   */
  static decrypt(encryptedText: string): string {
    if (!encryptedText) return '';
    
    try {
      const bytes = CryptoJS.AES.decrypt(encryptedText, ENCRYPTION_KEY);
      const decrypted = bytes.toString(CryptoJS.enc.Utf8);
      return decrypted;
    } catch (error) {
      console.error('Erreur de déchiffrement:', error);
      throw new Error('Erreur lors du déchiffrement');
    }
  }

  /**
   * Vérifie si une chaîne semble être chiffrée
   */
  static isEncrypted(text: string): boolean {
    if (!text) return false;
    
    // Les chaînes chiffrées AES ont généralement cette forme
    return text.length > 20 && !text.includes('@') && !text.includes('.');
  }

  /**
   * Chiffre un objet settings en chiffrant les champs sensibles
   */
  static encryptSensitiveSettings(settings: any): any {
    const encrypted = { ...settings };
    
    // Liste des champs sensibles à chiffrer
    const sensitiveFields = [
      'smtp_pass',
      'stripe_secret_key',
      'stripe_webhook_secret',
      'telnyx_api_key',
      'openai_api_key',
      'password'
    ];

    for (const field of sensitiveFields) {
      if (encrypted[field] && typeof encrypted[field] === 'string') {
        // Ne chiffrer que si ce n'est pas déjà chiffré
        if (!this.isEncrypted(encrypted[field])) {
          encrypted[field] = this.encrypt(encrypted[field]);
        }
      }
    }

    return encrypted;
  }

  /**
   * Déchiffre un objet settings en déchiffrant les champs sensibles
   */
  static decryptSensitiveSettings(settings: any): any {
    const decrypted = { ...settings };
    
    // Liste des champs sensibles à déchiffrer
    const sensitiveFields = [
      'smtp_pass',
      'stripe_secret_key', 
      'stripe_webhook_secret',
      'telnyx_api_key',
      'openai_api_key',
      'password'
    ];

    for (const field of sensitiveFields) {
      if (decrypted[field] && typeof decrypted[field] === 'string') {
        // Ne déchiffrer que si c'est chiffré
        if (this.isEncrypted(decrypted[field])) {
          try {
            decrypted[field] = this.decrypt(decrypted[field]);
          } catch (error) {
            console.warn(`Impossible de déchiffrer ${field}:`, error);
            // Garder la valeur chiffrée si le déchiffrement échoue
          }
        }
      }
    }

    return decrypted;
  }
}

export default EncryptionService;