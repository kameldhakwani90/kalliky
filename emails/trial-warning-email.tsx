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

interface TrialWarningEmailProps {
  firstName: string;
  lastName: string;
  email: string;
  restaurantName: string;
  callsUsed: number;
  callsRemaining: number;
  daysRemaining: number;
  logoUrl?: string;
  companyName?: string;
  footerText?: string;
}

export default function TrialWarningEmail({
  firstName = "Jean",
  lastName = "Dupont",
  email = "jean@restaurant.com",
  restaurantName = "Restaurant Test",
  callsUsed = 8,
  callsRemaining = 2,
  daysRemaining = 3,
  logoUrl,
  companyName = "Kalliky",
  footerText = "Kalliky - Solution IA pour restaurants"
}: TrialWarningEmailProps) {
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
            <Text style={title}>⚠️ Attention - Période d'essai bientôt terminée</Text>
          </Section>

          {/* Content */}
          <Section style={content}>
            <Text style={greeting}>
              Bonjour {firstName} {lastName},
            </Text>

            <Text style={paragraph}>
              Votre période d'essai gratuite pour <strong>{restaurantName}</strong> arrive bientôt à son terme.
            </Text>

            <Section style={statsBox}>
              <Text style={statsTitle}>📊 Votre utilisation actuelle :</Text>
              <Row>
                <Column>
                  <Text style={statLabel}>Appels utilisés :</Text>
                  <Text style={statValue}>{callsUsed} / 10</Text>
                </Column>
                <Column>
                  <Text style={statLabel}>Appels restants :</Text>
                  <Text style={statValue}>{callsRemaining}</Text>
                </Column>
              </Row>
              <Text style={statLabel}>Temps restant : <strong>{daysRemaining} jours</strong></Text>
            </Section>

            <Text style={paragraph}>
              Pour continuer à bénéficier de votre assistant IA 24h/24 sans interruption, 
              passez à un plan payant dès maintenant.
            </Text>

            <Section style={ctaSection}>
              <Button 
                href={`${baseUrl}/app/billing?upgrade=true`}
                style={ctaButton}
              >
                🚀 Choisir mon plan
              </Button>
            </Section>

            <Text style={benefits}>
              <strong>Pourquoi passer au plan payant ?</strong><br/>
              ✅ Appels illimités<br/>
              ✅ IA plus performante<br/>
              ✅ Support prioritaire<br/>
              ✅ Analytics avancés<br/>
              ✅ Plus de fonctionnalités
            </Text>

            <Text style={urgency}>
              ⏰ <strong>Important :</strong> Après {callsRemaining} appels ou {daysRemaining} jours, 
              votre numéro sera temporairement suspendu jusqu'à votre passage à un plan payant.
            </Text>
          </Section>

          {/* Footer */}
          <Hr style={hr} />
          <Section style={footer}>
            <Text style={footerText}>{footerText}</Text>
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
  color: '#e67e22',
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

const statsBox = {
  backgroundColor: '#fef9e7',
  border: '1px solid #f39c12',
  borderRadius: '6px',
  padding: '16px',
  margin: '20px 0',
};

const statsTitle = {
  fontSize: '16px',
  fontWeight: '600',
  color: '#d68910',
  margin: '0 0 12px',
};

const statLabel = {
  fontSize: '14px',
  color: '#666666',
  margin: '4px 0',
};

const statValue = {
  fontSize: '18px',
  fontWeight: 'bold',
  color: '#e67e22',
  margin: '0 0 8px',
};

const ctaSection = {
  textAlign: 'center' as const,
  margin: '32px 0',
};

const ctaButton = {
  backgroundColor: '#e67e22',
  borderRadius: '6px',
  color: '#ffffff',
  fontSize: '16px',
  fontWeight: 'bold',
  textDecoration: 'none',
  textAlign: 'center' as const,
  display: 'inline-block',
  padding: '14px 32px',
};

const benefits = {
  fontSize: '14px',
  lineHeight: '1.6',
  color: '#555555',
  backgroundColor: '#f8f9fa',
  padding: '16px',
  borderRadius: '6px',
  margin: '20px 0',
};

const urgency = {
  fontSize: '14px',
  lineHeight: '1.6',
  color: '#d32f2f',
  backgroundColor: '#ffebee',
  padding: '16px',
  borderRadius: '6px',
  border: '1px solid #ffcdd2',
  margin: '20px 0',
};

const hr = {
  borderColor: '#e6ebf1',
  margin: '20px 0',
};

const footer = {
  textAlign: 'center' as const,
  padding: '20px 0',
};

const footerText = {
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