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

interface AccountDeletedEmailProps {
  firstName: string;
  lastName: string;
  email: string;
  restaurantName: string;
  deletionDate: string;
  logoUrl?: string;
  companyName?: string;
  footerText?: string;
}

export default function AccountDeletedEmail({
  firstName = "Jean",
  lastName = "Dupont",
  email = "jean@restaurant.com", 
  restaurantName = "Restaurant Test",
  deletionDate = "25/12/2024",
  logoUrl,
  companyName = "Kalliky",
  footerText = "Kalliky - Solution IA pour restaurants"
}: AccountDeletedEmailProps) {
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
            <Text style={title}>🗑️ Compte Définitivement Supprimé</Text>
          </Section>

          {/* Content */}
          <Section style={content}>
            <Text style={greeting}>
              Bonjour {firstName} {lastName},
            </Text>

            <Text style={paragraph}>
              Nous vous confirmons que votre compte <strong>{restaurantName}</strong> 
              a été définitivement supprimé le <strong>{deletionDate}</strong> conformément 
              à notre politique de gestion des comptes d'essai.
            </Text>

            <Section style={infoBox}>
              <Text style={infoIcon}>ℹ️</Text>
              <Text style={infoTitle}>Ce qui a été supprimé</Text>
              <Text style={infoText}>
                • <strong>Compte utilisateur</strong> et informations personnelles<br/>
                • <strong>Paramètres du restaurant</strong> et configuration<br/>
                • <strong>Numéro de téléphone</strong> libéré et disponible<br/>
                • <strong>Statistiques d'appels</strong> et données analytiques<br/>
                • <strong>Historique des conversations</strong> avec l'IA
              </Text>
            </Section>

            <Section style={confirmationBox}>
              <Text style={confirmationTitle}>✅ Suppression confirmée</Text>
              <Text style={confirmationText}>
                Toutes vos données ont été effacées de nos serveurs de manière sécurisée 
                et irréversible, conformément au RGPD.
              </Text>
            </Section>

            <Text style={paragraph}>
              <strong>Vous souhaitez revenir ?</strong> Aucun problème ! Vous pouvez créer 
              un nouveau compte à tout moment et bénéficier à nouveau d'une période d'essai gratuite.
            </Text>

            <Section style={ctaSection}>
              <Button 
                href={`${baseUrl}/register?source=deleted-account`}
                style={ctaButton}
              >
                🆕 Créer un nouveau compte
              </Button>
            </Section>

            <Text style={paragraph}>
              Nous espérons que votre expérience avec {companyName} vous a donné un aperçu 
              du potentiel de l'IA pour améliorer la gestion de votre restaurant.
            </Text>


            <Text style={thanksText}>
              <strong>Merci d'avoir testé {companyName}.</strong><br/>
              Nous vous souhaitons beaucoup de succès pour votre restaurant !
            </Text>
          </Section>

          {/* Footer */}
          <Hr style={hr} />
          <Section style={footer}>
            <Text style={footerTextStyle}>{footerText}</Text>
            <Text style={footerLinks}>
              <Link href={`${baseUrl}/`} style={link}>Accueil</Link> • 
              <Link href={`${baseUrl}/register`} style={link}>S'inscrire</Link> • 
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
  color: '#6c757d',
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

const infoBox = {
  backgroundColor: '#f8f9fa',
  border: '1px solid #dee2e6',
  borderRadius: '6px',
  padding: '16px',
  margin: '20px 0',
};

const infoIcon = {
  fontSize: '20px',
  margin: '0 0 8px',
  textAlign: 'center' as const,
  display: 'block',
};

const infoTitle = {
  fontSize: '16px',
  fontWeight: '600',
  color: '#495057',
  margin: '0 0 12px',
  textAlign: 'center' as const,
};

const infoText = {
  fontSize: '14px',
  lineHeight: '1.6',
  color: '#666666',
  margin: '0',
};

const confirmationBox = {
  backgroundColor: '#d1ecf1',
  border: '1px solid #bee5eb',
  borderRadius: '6px',
  padding: '16px',
  margin: '20px 0',
  textAlign: 'center' as const,
};

const confirmationTitle = {
  fontSize: '16px',
  fontWeight: '600',
  color: '#0c5460',
  margin: '0 0 8px',
};

const confirmationText = {
  fontSize: '14px',
  color: '#0c5460',
  margin: '0',
};

const ctaSection = {
  textAlign: 'center' as const,
  margin: '32px 0',
};

const ctaButton = {
  backgroundColor: '#28a745',
  borderRadius: '6px',
  color: '#ffffff',
  fontSize: '16px',
  fontWeight: 'bold',
  textDecoration: 'none',
  textAlign: 'center' as const,
  display: 'inline-block',
  padding: '14px 32px',
};


const thanksText = {
  fontSize: '16px',
  lineHeight: '1.6',
  color: '#28a745',
  backgroundColor: '#d4edda',
  border: '1px solid #c3e6cb',
  padding: '16px',
  borderRadius: '6px',
  margin: '24px 0',
  textAlign: 'center' as const,
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