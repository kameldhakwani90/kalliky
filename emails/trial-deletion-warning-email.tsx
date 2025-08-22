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
          {/* Header */}
          <Section style={header}>
            {logoUrl ? (
              <Img src={logoUrl} width="120" height="40" alt={companyName} />
            ) : (
              <Text style={logo}>{companyName}</Text>
            )}
          </Section>

          {/* Main Content */}
          <Section style={content}>
            <Text style={title}>Suppression de compte programmée</Text>
            <Text style={greeting}>
              Bonjour {firstName} {lastName},
            </Text>

            <Text style={paragraph}>
              <strong>Ceci est un avertissement urgent.</strong> Votre compte <strong>{restaurantName}</strong> 
              sera <strong>définitivement supprimé</strong> dans <strong>{daysUntilDeletion} jours</strong>, 
              le <strong>{deletionDate}</strong>.
            </Text>

            {/* Account Details */}
            <Section style={accountBox}>
              <Text style={accountTitle}>Que va-t-il se passer ?</Text>
              <Text style={paragraph}>
                • Suppression totale de votre compte et données<br/>
                • Libération définitive de votre numéro de téléphone<br/>
                • Perte irréversible de tous vos paramètres<br/>
                • Impossibilité de récupérer vos statistiques
              </Text>
              <Text style={accountTitle}>Temps restant : {daysUntilDeletion} jour{daysUntilDeletion > 1 ? 's' : ''}</Text>
            </Section>

            <Text style={paragraph}>
              <strong>Il est encore temps d'agir !</strong> Évitez la suppression de votre compte 
              en choisissant un plan adapté à vos besoins.
            </Text>

            {/* CTA Button */}
            <Section style={buttonContainer}>
              <Button style={button} href={`${baseUrl}/app/billing?urgent=true`}>
                Sauver mon compte
              </Button>
            </Section>

            <Text style={paragraph}>
              <strong>Plans disponibles :</strong><br/>
              • STARTER : 49€/mois - 100 appels inclus<br/>
              • PRO : 99€/mois - Appels illimités
            </Text>

            <Text style={paragraph}>
              <strong>En souscrivant maintenant :</strong><br/>
              • Sauvegarde immédiate de votre compte<br/>
              • Conservation de tous vos paramètres<br/>
              • Réactivation instantanée du service<br/>
              • Accès complet aux fonctionnalités avancées
            </Text>

            <Hr style={hr} />

            <Text style={helpText}>
              <strong>Attention :</strong> Après le {deletionDate}, il sera impossible 
              de récupérer votre compte et vos données. Cette action est irréversible.
            </Text>
          </Section>

          {/* Footer */}
          <Section style={footer}>
            <Text style={footerText}>
              {footerText}
            </Text>
            <Text style={footerLinks}>
              <Link href={`${baseUrl}/app/dashboard`} style={footerLink}>Tableau de bord</Link> •{' '}
              <Link href={`${baseUrl}/app/billing`} style={footerLink}>Facturation</Link>
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}

// Styles Stripe-like
const main = {
  backgroundColor: '#f6f9fc',
  fontFamily: '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Ubuntu,sans-serif',
};

const container = {
  backgroundColor: '#ffffff',
  margin: '40px auto',
  padding: '0',
  maxWidth: '600px',
  borderRadius: '8px',
  boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
};

const header = {
  padding: '32px 40px 24px',
  borderBottom: '1px solid #e6ebf1',
};

const logo = {
  fontSize: '24px',
  fontWeight: 'bold',
  color: '#32325d',
  margin: '0',
};

const content = {
  padding: '32px 40px',
};

const title = {
  fontSize: '24px',
  fontWeight: 'bold',
  color: '#32325d',
  marginBottom: '24px',
  lineHeight: '1.4',
};

const paragraph = {
  fontSize: '16px',
  lineHeight: '1.6',
  color: '#525f7f',
  marginBottom: '16px',
};

const accountBox = {
  backgroundColor: '#f6f9fc',
  border: '1px solid #e6ebf1',
  borderRadius: '6px',
  padding: '24px',
  margin: '24px 0',
};

const accountTitle = {
  fontSize: '18px',
  fontWeight: 'bold',
  color: '#32325d',
  marginBottom: '16px',
};

const buttonContainer = {
  textAlign: 'center' as const,
  margin: '32px 0',
};

const button = {
  backgroundColor: '#5469d4',
  borderRadius: '6px',
  color: '#ffffff',
  fontSize: '16px',
  fontWeight: 'bold',
  textDecoration: 'none',
  textAlign: 'center' as const,
  display: 'inline-block',
  padding: '12px 32px',
  border: 'none',
  cursor: 'pointer',
};

const hr = {
  borderColor: '#e6ebf1',
  margin: '32px 0',
};

const helpText = {
  fontSize: '14px',
  color: '#6b7c93',
  lineHeight: '1.5',
  textAlign: 'center' as const,
};

const footer = {
  backgroundColor: '#f6f9fc',
  padding: '24px 40px',
  borderTop: '1px solid #e6ebf1',
  borderRadius: '0 0 8px 8px',
};

const footerText = {
  fontSize: '14px',
  color: '#6b7c93',
  textAlign: 'center' as const,
  marginBottom: '8px',
};

const footerLinks = {
  fontSize: '14px',
  color: '#6b7c93',
  textAlign: 'center' as const,
};

const footerLink = {
  color: '#6b7c93',
  textDecoration: 'none',
};