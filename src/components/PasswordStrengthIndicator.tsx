import React from 'react';
import { validatePasswordStrength, getPasswordStrengthLabel, getPasswordStrengthColor, getPasswordStrengthBgColor } from '@/lib/password-utils';
import { CheckCircle2, AlertCircle, Info } from 'lucide-react';

interface PasswordStrengthIndicatorProps {
  password: string;
  showFeedback?: boolean;
}

export function PasswordStrengthIndicator({ password, showFeedback = true }: PasswordStrengthIndicatorProps) {
  if (!password) {
    return null;
  }

  const result = validatePasswordStrength(password);
  const { score, feedback, isValid } = result;

  return (
    <div className="mt-2 space-y-2">
      {/* Barre de progression */}
      <div className="flex items-center gap-2">
        <div className="flex-1 bg-gray-200/20 rounded-full h-2">
          <div
            className={`h-2 rounded-full transition-all duration-300 ${getPasswordStrengthBgColor(score)}`}
            style={{ width: `${(score / 5) * 100}%` }}
          />
        </div>
        <span className={`text-sm font-medium ${getPasswordStrengthColor(score)}`}>
          {getPasswordStrengthLabel(score)}
        </span>
        {isValid && (
          <CheckCircle2 className="h-4 w-4 text-green-500" />
        )}
      </div>

      {/* Feedback détaillé */}
      {showFeedback && feedback.length > 0 && (
        <div className="space-y-1">
          {feedback.map((message, index) => (
            <div key={index} className="flex items-center gap-2 text-xs text-gray-400">
              <AlertCircle className="h-3 w-3 text-orange-400" />
              <span>{message}</span>
            </div>
          ))}
        </div>
      )}

      {/* Indicateur de validité */}
      {showFeedback && isValid && (
        <div className="flex items-center gap-2 text-xs text-green-400">
          <CheckCircle2 className="h-3 w-3" />
          <span>Mot de passe suffisamment fort</span>
        </div>
      )}

      {/* Conseils généraux */}
      {showFeedback && password.length > 0 && score < 3 && (
        <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-3 mt-3">
          <div className="flex items-start gap-2">
            <Info className="h-4 w-4 text-blue-400 mt-0.5 flex-shrink-0" />
            <div className="text-xs text-blue-300">
              <p className="font-medium mb-1">Conseils pour un mot de passe fort :</p>
              <ul className="space-y-1 text-blue-300/80">
                <li>• Utilisez au moins 8 caractères (12+ recommandé)</li>
                <li>• Mélangez majuscules et minuscules</li>
                <li>• Incluez des chiffres et caractères spéciaux</li>
                <li>• Évitez les mots de passe communs</li>
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}