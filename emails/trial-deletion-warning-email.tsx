import {
  Html,
  Head,
  Body,
  Container,
  Text,
  Button,
  Hr,
  Img,
  Link,
  Section,
  Row,
  Column
} from '@react-email/components';

interface TrialDeletionWarningEmailProps {
  firstName: string;
  lastName: string;
  email: string;
  restaurantName: string;
  daysUntilDeletion: number;
  deletionDate: string;
  logoUrl?: string;
  companyName?: string;
  footerText?: string;
}

export default function TrialDeletionWarningEmail({
  firstName = "Jean",
  lastName = "Dupont", 
  email = "jean@restaurant.com",
  restaurantName = "Restaurant Test",
  daysUntilDeletion = 3,
  deletionDate = "25/12/2024",
  logoUrl,
  companyName = "Kalliky",
  footerText = "Kalliky - Solution IA pour restaurants"
}: TrialDeletionWarningEmailProps) {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

  return (
    <Html>
      <Head />
      <Body style={main}>
        <Container style={container}>
          {/* Logo */}
          {logoUrl && (
            <Section style={logoContainer}>
              <Img src={logoUrl} width="120" alt={companyName} style={logo} />
            </Section>
          )}

          {/* Header */}
          <Section style={header}>
            <Text style={title}>🚨 URGENT - Suppression de Compte Programmée</Text>
          </Section>

          {/* Content */}
          <Section style={content}>
            <Text style={greeting}>
              Bonjour {firstName} {lastName},
            </Text>

            <Text style={paragraph}>
              <strong>Ceci est un avertissement urgent.</strong> Votre compte <strong>{restaurantName}</strong> 
              sera <strong>définitivement supprimé</strong> dans <strong>{daysUntilDeletion} jours</strong>, 
              le <strong>{deletionDate}</strong>.
            </Text>

            <Section style={urgentBox}>
              <Text style={urgentIcon}>⚠️</Text>
              <Text style={urgentTitle}>Que va-t-il se passer ?</Text>
              <Text style={urgentText}>
                • <strong>Suppression totale</strong> de votre compte et données<br/>
                • <strong>Libération définitive</strong> de votre numéro de téléphone<br/>
                • <strong>Perte irréversible</strong> de tous vos paramètres<br/>
                • <strong>Impossibilité de récupérer</strong> vos statistiques
              </Text>
            </Section>

            <Section style={countdownBox}>
              <Text style={countdownTitle}>⏰ Temps restant</Text>
              <Text style={countdownValue}>{daysUntilDeletion}</Text>
              <Text style={countdownLabel}>jour{daysUntilDeletion > 1 ? 's' : ''}</Text>
            </Section>

            <Text style={paragraph}>
              <strong>Il est encore temps d'agir !</strong> Évitez la suppression de votre compte 
              en choisissant un plan adapté à vos besoins.
            </Text>

            <Section style={ctaSection}>
              <Button 
                href={`${baseUrl}/app/billing?urgent=true`}
                style={ctaButton}
              >
                🛡️ Sauver mon compte
              </Button>
            </Section>

            <Section style={plansBox}>
              <Text style={plansTitle}>💎 Choisissez votre plan maintenant :</Text>
              <Row>
                <Column>
                  <Text style={planName}>STARTER</Text>
                  <Text style={planPrice}>49€/mois</Text>
                  <Text style={planFeature}>100 appels inclus</Text>
                  <Text style={planBadge}>⚡ Activation immédiate</Text>
                </Column>
                <Column>
                  <Text style={planName}>PRO</Text>
                  <Text style={planPrice}>99€/mois</Text>
                  <Text style={planFeature}>Appels illimités</Text>
                  <Text style={planBadge}>🔥 Le plus populaire</Text>
                </Column>
              </Row>
            </Section>

            <Text style={benefits}>
              <strong>En souscrivant maintenant :</strong><br/>
              ✅ <strong>Sauvegarde immédiate</strong> de votre compte<br/>
              ✅ <strong>Conservation</strong> de tous vos paramètres<br/>
              ✅ <strong>Réactivation instantanée</strong> du service<br/>
              ✅ <strong>Accès complet</strong> aux fonctionnalités avancées<br/>
              ✅ <strong>Support prioritaire</strong> 7j/7
            </Text>

            <Section style={emergencyBox}>
              <Text style={emergencyTitle}>🆘 Besoin d'aide ?</Text>
              <Text style={emergencyText}>
                Notre équipe support est disponible pour vous accompagner dans cette étape cruciale.
              </Text>
              <Button 
                href={`${baseUrl}/support?urgent=account-deletion`}
                style={emergencyButton}
              >
                📞 Contacter le support
              </Button>
            </Section>

            <Text style={finalWarning}>
              ⚠️ <strong>Attention :</strong> Après le {deletionDate}, il sera <strong>impossible</strong> 
              de récupérer votre compte et vos données. Cette action est irréversible.
            </Text>
          </Section>

          {/* Footer */}
          <Hr style={hr} />
          <Section style={footer}>
            <Text style={footerTextStyle}>{footerText}</Text>
            <Text style={footerLinks}>
              <Link href={`${baseUrl}/app/dashboard`} style={link}>Tableau de bord</Link> • 
              <Link href={`${baseUrl}/app/billing`} style={link}>Facturation</Link> • 
              <Link href={`${baseUrl}/support`} style={link}>Support</Link>
            </Text>
            <Text style={footerCopy}>
              Cet email a été envoyé automatiquement pour {email}
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}

// Styles
const main = {
  backgroundColor: '#f6f9fc',
  fontFamily: '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Oxygen-Sans,Ubuntu,Cantarell,"Helvetica Neue",sans-serif',
};

const container = {
  margin: '0 auto',
  padding: '20px 0 48px',
  maxWidth: '560px',
};

const logoContainer = {
  textAlign: 'center' as const,
  margin: '20px 0',
};

const logo = {
  margin: '0 auto',
};

const header = {
  textAlign: 'center' as const,
  margin: '20px 0',
};

const title = {
  fontSize: '24px',
  fontWeight: 'bold',
  color: '#d32f2f',
  textAlign: 'center' as const,
  margin: '0 0 20px',
};

const content = {
  backgroundColor: '#ffffff',
  border: '1px solid #f0f0f0',
  borderRadius: '8px',
  padding: '32px',
};

const greeting = {
  fontSize: '16px',
  fontWeight: '600',
  color: '#333333',
  margin: '0 0 16px',
};

const paragraph = {
  fontSize: '16px',
  lineHeight: '1.6',
  color: '#555555',
  margin: '0 0 16px',
};

const urgentBox = {
  backgroundColor: '#ffebee',
  border: '2px solid #f44336',
  borderRadius: '6px',
  padding: '16px',
  margin: '20px 0',
  textAlign: 'center' as const,
};

const urgentIcon = {
  fontSize: '28px',
  margin: '0 0 8px',
};

const urgentTitle = {
  fontSize: '18px',
  fontWeight: '600',
  color: '#d32f2f',
  margin: '0 0 12px',
};

const urgentText = {
  fontSize: '14px',
  lineHeight: '1.6',
  color: '#666666',
  margin: '0',
  textAlign: 'left' as const,
};

const countdownBox = {
  backgroundColor: '#fff3e0',
  border: '2px solid #ff9800',
  borderRadius: '8px',
  padding: '20px',
  margin: '24px 0',
  textAlign: 'center' as const,
};

const countdownTitle = {
  fontSize: '16px',
  fontWeight: '600',
  color: '#f57c00',
  margin: '0 0 8px',
};

const countdownValue = {
  fontSize: '48px',
  fontWeight: 'bold',
  color: '#d32f2f',
  margin: '0 0 4px',
  textShadow: '2px 2px 4px rgba(0,0,0,0.1)',
};

const countdownLabel = {
  fontSize: '18px',
  fontWeight: '600',
  color: '#f57c00',
  margin: '0',
};

const ctaSection = {
  textAlign: 'center' as const,
  margin: '32px 0',
};

const ctaButton = {
  backgroundColor: '#d32f2f',
  borderRadius: '6px',
  color: '#ffffff',
  fontSize: '18px',
  fontWeight: 'bold',
  textDecoration: 'none',
  textAlign: 'center' as const,
  display: 'inline-block',
  padding: '16px 40px',
  boxShadow: '0 4px 12px rgba(211, 47, 47, 0.3)',
};

const plansBox = {
  backgroundColor: '#f8f9fa',
  borderRadius: '8px',
  padding: '20px',
  margin: '24px 0',
  border: '1px solid #dee2e6',
};

const plansTitle = {
  fontSize: '18px',
  fontWeight: '600',
  color: '#333333',
  margin: '0 0 20px',
  textAlign: 'center' as const,
};

const planName = {
  fontSize: '16px',
  fontWeight: 'bold',
  color: '#2d3748',
  margin: '0 0 4px',
  textAlign: 'center' as const,
};

const planPrice = {
  fontSize: '20px',
  fontWeight: 'bold',
  color: '#d32f2f',
  margin: '0 0 4px',
  textAlign: 'center' as const,
};

const planFeature = {
  fontSize: '14px',
  color: '#666666',
  margin: '0 0 8px',
  textAlign: 'center' as const,
};

const planBadge = {
  fontSize: '12px',
  color: '#28a745',
  fontWeight: '600',
  margin: '0',
  textAlign: 'center' as const,
};

const benefits = {
  fontSize: '14px',
  lineHeight: '1.6',
  color: '#555555',
  backgroundColor: '#e8f5e8',
  padding: '16px',
  borderRadius: '6px',
  border: '1px solid #c3e6cb',
  margin: '20px 0',
};

const emergencyBox = {
  backgroundColor: '#e3f2fd',
  border: '1px solid #90caf9',
  borderRadius: '6px',
  padding: '16px',
  margin: '20px 0',
  textAlign: 'center' as const,
};

const emergencyTitle = {
  fontSize: '16px',
  fontWeight: '600',
  color: '#1976d2',
  margin: '0 0 8px',
};

const emergencyText = {
  fontSize: '14px',
  color: '#555555',
  margin: '0 0 12px',
};

const emergencyButton = {
  backgroundColor: '#1976d2',
  borderRadius: '4px',
  color: '#ffffff',
  fontSize: '14px',
  fontWeight: '600',
  textDecoration: 'none',
  textAlign: 'center' as const,
  display: 'inline-block',
  padding: '10px 20px',
};

const finalWarning = {
  fontSize: '14px',
  lineHeight: '1.6',
  color: '#d32f2f',
  backgroundColor: '#ffebee',
  padding: '16px',
  borderRadius: '6px',
  border: '2px solid #f44336',
  margin: '20px 0',
  fontWeight: '600',
};

const hr = {
  borderColor: '#e6ebf1',
  margin: '20px 0',
};

const footer = {
  textAlign: 'center' as const,
  padding: '20px 0',
};

const footerTextStyle = {
  fontSize: '14px',
  color: '#8898aa',
  margin: '0 0 8px',
};

const footerLinks = {
  fontSize: '12px',
  color: '#8898aa',
  margin: '0 0 8px',
};

const link = {
  color: '#556cd6',
  textDecoration: 'underline',
};

const footerCopy = {
  fontSize: '12px',
  color: '#b8b8b8',
  margin: '0',
};