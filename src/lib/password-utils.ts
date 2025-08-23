export interface PasswordStrengthResult {
  score: number; // 0 à 4 (faible à fort)
  feedback: string[];
  isValid: boolean;
}

export function validatePasswordStrength(password: string): PasswordStrengthResult {
  const feedback: string[] = [];
  let score = 0;

  // Longueur minimale
  if (password.length >= 8) {
    score++;
  } else {
    feedback.push('Au moins 8 caractères requis');
  }

  // Majuscule
  if (/[A-Z]/.test(password)) {
    score++;
  } else {
    feedback.push('Au moins une majuscule requise');
  }

  // Minuscule
  if (/[a-z]/.test(password)) {
    score++;
  } else {
    feedback.push('Au moins une minuscule requise');
  }

  // Chiffre
  if (/\d/.test(password)) {
    score++;
  } else {
    feedback.push('Au moins un chiffre requis');
  }

  // Caractère spécial
  if (/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
    score++;
  } else {
    feedback.push('Au moins un caractère spécial requis (!@#$%^&*...)');
  }

  // Mots de passe communs à éviter
  const commonPasswords = [
    'password', '123456', '123456789', '12345678', '12345',
    '1234567', 'qwerty', 'abc123', 'password123', 'admin',
    'letmein', 'welcome', 'monkey', '1234567890', 'dragon'
  ];
  
  if (commonPasswords.includes(password.toLowerCase())) {
    score = Math.max(0, score - 2);
    feedback.push('Évitez les mots de passe communs');
  }

  // Longueur bonus
  if (password.length >= 12) {
    score = Math.min(5, score + 1);
  }

  return {
    score,
    feedback,
    isValid: score >= 4 && password.length >= 8
  };
}

export function getPasswordStrengthLabel(score: number): string {
  switch (score) {
    case 0:
    case 1:
      return 'Très faible';
    case 2:
      return 'Faible';
    case 3:
      return 'Moyen';
    case 4:
      return 'Fort';
    case 5:
      return 'Très fort';
    default:
      return 'Inconnu';
  }
}

export function getPasswordStrengthColor(score: number): string {
  switch (score) {
    case 0:
    case 1:
      return 'text-red-500';
    case 2:
      return 'text-orange-500';
    case 3:
      return 'text-yellow-500';
    case 4:
      return 'text-green-500';
    case 5:
      return 'text-emerald-500';
    default:
      return 'text-gray-500';
  }
}

export function getPasswordStrengthBgColor(score: number): string {
  switch (score) {
    case 0:
    case 1:
      return 'bg-red-500';
    case 2:
      return 'bg-orange-500';
    case 3:
      return 'bg-yellow-500';
    case 4:
      return 'bg-green-500';
    case 5:
      return 'bg-emerald-500';
    default:
      return 'bg-gray-500';
  }
}