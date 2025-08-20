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

interface TrialBlockedEmailProps {
  firstName: string;
  lastName: string;
  email: string;
  restaurantName: string;
  totalCallsUsed: number;
  logoUrl?: string;
  companyName?: string;
  footerText?: string;
}

export default function TrialBlockedEmail({
  firstName = "Jean",
  lastName = "Dupont",
  email = "jean@restaurant.com",
  restaurantName = "Restaurant Test",
  totalCallsUsed = 10,
  logoUrl,
  companyName = "Kalliky",
  footerText = "Kalliky - Solution IA pour restaurants"
}: TrialBlockedEmailProps) {
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
            <Text style={title}>🔒 Service Temporairement Suspendu</Text>
          </Section>

          {/* Content */}
          <Section style={content}>
            <Text style={greeting}>
              Bonjour {firstName} {lastName},
            </Text>

            <Text style={paragraph}>
              Votre service téléphonique pour <strong>{restaurantName}</strong> a été temporairement suspendu 
              car vous avez utilisé l'intégralité de vos <strong>{totalCallsUsed} appels</strong> d'essai gratuits.
            </Text>

            <Section style={alertBox}>
              <Text style={alertIcon}>⚠️</Text>
              <Text style={alertTitle}>Qu'est-ce que cela signifie ?</Text>
              <Text style={alertText}>
                • Votre numéro de téléphone ne répond plus aux appels<br/>
                • Vos clients entendront un message d'indisponibilité<br/>
                • Vos données et paramètres restent sauvegardés
              </Text>
            </Section>

            <Text style={paragraph}>
              <strong>Bonne nouvelle !</strong> Vous pouvez réactiver votre service immédiatement 
              en choisissant un plan adapté à vos besoins.
            </Text>

            <Section style={ctaSection}>
              <Button 
                href={`${baseUrl}/app/billing?reactivate=true`}
                style={ctaButton}
              >
                🚀 Réactiver mon service
              </Button>
            </Section>

            <Section style={plansBox}>
              <Text style={plansTitle}>💎 Nos plans disponibles :</Text>
              <Row>
                <Column>
                  <Text style={planName}>STARTER</Text>
                  <Text style={planPrice}>49€/mois</Text>
                  <Text style={planFeature}>100 appels/mois</Text>
                </Column>
                <Column>
                  <Text style={planName}>PRO</Text>
                  <Text style={planPrice}>99€/mois</Text>
                  <Text style={planFeature}>Appels illimités</Text>
                </Column>
              </Row>
            </Section>

            <Text style={benefits}>
              <strong>Avec votre plan payant :</strong><br/>
              ✅ Service actif 24h/24, 7j/7<br/>
              ✅ IA plus performante et rapide<br/>
              ✅ Support technique prioritaire<br/>
              ✅ Analytics et statistiques détaillées<br/>
              ✅ Intégrations avancées
            </Text>

            <Text style={urgency}>
              💡 <strong>Conseil :</strong> Plus vous attendez, plus vos clients risquent d'être déçus 
              de ne pas pouvoir vous joindre. Réactivez votre service maintenant !
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
  color: '#e74c3c',
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

const alertBox = {
  backgroundColor: '#fff5f5',
  border: '1px solid #fed7d7',
  borderRadius: '6px',
  padding: '16px',
  margin: '20px 0',
  textAlign: 'center' as const,
};

const alertIcon = {
  fontSize: '24px',
  margin: '0 0 8px',
};

const alertTitle = {
  fontSize: '16px',
  fontWeight: '600',
  color: '#e53e3e',
  margin: '0 0 12px',
};

const alertText = {
  fontSize: '14px',
  lineHeight: '1.6',
  color: '#666666',
  margin: '0',
  textAlign: 'left' as const,
};

const ctaSection = {
  textAlign: 'center' as const,
  margin: '32px 0',
};

const ctaButton = {
  backgroundColor: '#e74c3c',
  borderRadius: '6px',
  color: '#ffffff',
  fontSize: '16px',
  fontWeight: 'bold',
  textDecoration: 'none',
  textAlign: 'center' as const,
  display: 'inline-block',
  padding: '14px 32px',
};

const plansBox = {
  backgroundColor: '#f8f9fa',
  borderRadius: '6px',
  padding: '16px',
  margin: '20px 0',
};

const plansTitle = {
  fontSize: '16px',
  fontWeight: '600',
  color: '#333333',
  margin: '0 0 16px',
  textAlign: 'center' as const,
};

const planName = {
  fontSize: '14px',
  fontWeight: 'bold',
  color: '#2d3748',
  margin: '0 0 4px',
  textAlign: 'center' as const,
};

const planPrice = {
  fontSize: '18px',
  fontWeight: 'bold',
  color: '#e74c3c',
  margin: '0 0 4px',
  textAlign: 'center' as const,
};

const planFeature = {
  fontSize: '12px',
  color: '#666666',
  margin: '0',
  textAlign: 'center' as const,
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
  color: '#2563eb',
  backgroundColor: '#eff6ff',
  padding: '16px',
  borderRadius: '6px',
  border: '1px solid #dbeafe',
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