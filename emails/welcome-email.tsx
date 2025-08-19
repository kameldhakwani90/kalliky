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

interface WelcomeEmailProps {
  firstName: string;
  lastName: string;
  email: string;
  company: string;
  plan: string;
  tempPassword: string;
  logoUrl?: string;
  companyName?: string;
  footerText?: string;
}

export default function WelcomeEmail({
  firstName = "Jean",
  lastName = "Dupont", 
  email = "jean@restaurant.com",
  company = "Restaurant XYZ",
  plan = "STARTER",
  tempPassword = "temp123",
  logoUrl,
  companyName = "Kalliky",
  footerText = "Kalliky - Solution IA pour restaurants"
}: WelcomeEmailProps) {
  const loginUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:9002'}/login`;

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
            <Text style={title}>Bienvenue dans {companyName} !</Text>
            
            <Text style={paragraph}>
              Bonjour {firstName} {lastName},
            </Text>
            
            <Text style={paragraph}>
              Votre compte SaaS a été créé avec succès pour <strong>{company}</strong>.
              Vous pouvez maintenant accéder à votre tableau de bord et commencer à 
              utiliser notre solution IA pour optimiser la gestion de votre restaurant.
            </Text>

            {/* Account Details */}
            <Section style={accountBox}>
              <Text style={accountTitle}>Détails de votre compte</Text>
              <Row>
                <Column>
                  <Text style={accountLabel}>Email :</Text>
                  <Text style={accountLabel}>Plan :</Text>
                  <Text style={accountLabel}>Mot de passe temporaire :</Text>
                </Column>
                <Column>
                  <Text style={accountValue}>{email}</Text>
                  <Text style={accountValue}>{plan}</Text>
                  <Text style={accountValue}>{tempPassword}</Text>
                </Column>
              </Row>
            </Section>

            <Text style={paragraph}>
              <strong>Important :</strong> Pour des raisons de sécurité, nous vous recommandons 
              fortement de changer votre mot de passe lors de votre première connexion.
            </Text>

            {/* CTA Button */}
            <Section style={buttonContainer}>
              <Button style={button} href={loginUrl}>
                Accéder à mon tableau de bord
              </Button>
            </Section>

            <Text style={paragraph}>
              Si le bouton ne fonctionne pas, copiez et collez ce lien dans votre navigateur :
            </Text>
            <Text style={linkText}>
              <Link href={loginUrl} style={link}>{loginUrl}</Link>
            </Text>

            <Hr style={hr} />

            <Text style={helpText}>
              Vous avez des questions ? Contactez notre équipe support à{' '}
              <Link href="mailto:support@kalliky.com" style={link}>
                support@kalliky.com
              </Link>
            </Text>
          </Section>

          {/* Footer */}
          <Section style={footer}>
            <Text style={footerText}>
              {footerText}
            </Text>
            <Text style={footerLinks}>
              <Link href="#" style={footerLink}>Aide</Link> •{' '}
              <Link href="#" style={footerLink}>Confidentialité</Link> •{' '}
              <Link href="#" style={footerLink}>Conditions</Link>
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

const accountLabel = {
  fontSize: '14px',
  color: '#6b7c93',
  marginBottom: '8px',
  fontWeight: '500',
};

const accountValue = {
  fontSize: '14px',
  color: '#32325d',
  marginBottom: '8px',
  fontWeight: '500',
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

const linkText = {
  fontSize: '14px',
  color: '#6b7c93',
  textAlign: 'center' as const,
  marginBottom: '24px',
};

const link = {
  color: '#5469d4',
  textDecoration: 'none',
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