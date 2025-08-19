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
} from '@react-email/components';

interface PasswordResetEmailProps {
  firstName: string;
  resetToken: string;
  logoUrl?: string;
  companyName?: string;
  footerText?: string;
}

export default function PasswordResetEmail({
  firstName = "Jean",
  resetToken = "abc123",
  logoUrl,
  companyName = "Kalliky",
  footerText = "Kalliky - Solution IA pour restaurants"
}: PasswordResetEmailProps) {
  const resetUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:9002'}/reset-password?token=${resetToken}`;

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
            <Text style={title}>Réinitialisation de mot de passe</Text>
            
            <Text style={paragraph}>
              Bonjour {firstName},
            </Text>
            
            <Text style={paragraph}>
              Vous avez demandé la réinitialisation de votre mot de passe pour votre 
              compte {companyName}. Cliquez sur le bouton ci-dessous pour créer un nouveau mot de passe.
            </Text>

            <Text style={warningText}>
              ⚠️ Ce lien est valide pendant 1 heure uniquement.
            </Text>

            {/* CTA Button */}
            <Section style={buttonContainer}>
              <Button style={button} href={resetUrl}>
                Réinitialiser mon mot de passe
              </Button>
            </Section>

            <Text style={paragraph}>
              Si le bouton ne fonctionne pas, copiez et collez ce lien dans votre navigateur :
            </Text>
            <Text style={linkText}>
              <Link href={resetUrl} style={link}>{resetUrl}</Link>
            </Text>

            <Hr style={hr} />

            <Text style={securityText}>
              <strong>Sécurité :</strong> Si vous n'avez pas demandé cette réinitialisation, 
              ignorez cet email. Votre mot de passe ne sera pas modifié.
            </Text>

            <Text style={helpText}>
              Vous avez des questions ? Contactez notre équipe support à{' '}
              <Link href="mailto:support@kalliky.com" style={link}>
                support@kalliky.com
              </Link>
            </Text>
          </Section>

          {/* Footer */}
          <Section style={footer}>
            <Text style={footerTextStyle}>
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

const warningText = {
  fontSize: '14px',
  color: '#f5a623',
  backgroundColor: '#fef7e6',
  padding: '12px 16px',
  borderRadius: '6px',
  border: '1px solid #f5a623',
  marginBottom: '24px',
};

const securityText = {
  fontSize: '14px',
  color: '#6b7c93',
  backgroundColor: '#f6f9fc',
  padding: '16px',
  borderRadius: '6px',
  border: '1px solid #e6ebf1',
  marginBottom: '16px',
};

const buttonContainer = {
  textAlign: 'center' as const,
  margin: '32px 0',
};

const button = {
  backgroundColor: '#f5a623',
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

const footerTextStyle = {
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