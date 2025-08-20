import { NextRequest, NextResponse } from 'next/server';
import nodemailer from 'nodemailer';
import jwt from 'jsonwebtoken';

export async function POST(request: NextRequest) {
  try {
    // Vérification admin
    const token = request.cookies.get('auth-token')?.value;
    if (!token) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
    if (decoded.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Accès admin requis' }, { status: 403 });
    }

    const body = await request.json();
    const { 
      smtp_host, 
      smtp_port, 
      smtp_user, 
      smtp_pass, 
      email_from, 
      test_email 
    } = body;

    // Validation des paramètres
    if (!smtp_host || !smtp_port || !smtp_user || !smtp_pass || !email_from || !test_email) {
      return NextResponse.json(
        { error: 'Tous les paramètres SMTP sont requis' },
        { status: 400 }
      );
    }

    // Créer le transporteur avec les paramètres fournis
    const transporter = nodemailer.createTransporter({
      host: smtp_host,
      port: parseInt(smtp_port),
      secure: false, // true pour 465, false pour les autres ports
      auth: {
        user: smtp_user,
        pass: smtp_pass
      }
    });

    // Vérifier la connexion
    await transporter.verify();

    // Envoyer un email de test
    const info = await transporter.sendMail({
      from: email_from,
      to: test_email,
      subject: '✅ Test de Configuration Email - Kalliky',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background-color: #f8f9fc; padding: 40px 20px; text-align: center;">
            <h1 style="color: #333; margin-bottom: 20px;">✅ Configuration Email Réussie</h1>
            <p style="color: #666; font-size: 16px; line-height: 1.5;">
              Félicitations ! Votre configuration SMTP fonctionne correctement.
            </p>
            <div style="background-color: white; border-radius: 8px; padding: 20px; margin: 20px 0; border-left: 4px solid #22c55e;">
              <h3 style="color: #22c55e; margin-bottom: 10px;">Paramètres testés :</h3>
              <p style="margin: 5px 0; color: #666;"><strong>Serveur :</strong> ${smtp_host}:${smtp_port}</p>
              <p style="margin: 5px 0; color: #666;"><strong>Utilisateur :</strong> ${smtp_user}</p>
              <p style="margin: 5px 0; color: #666;"><strong>Expéditeur :</strong> ${email_from}</p>
            </div>
            <p style="color: #666; font-size: 14px;">
              Vous pouvez maintenant utiliser cette configuration pour envoyer des emails automatiques.
            </p>
            <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
            <p style="color: #999; font-size: 12px;">
              Email de test généré le ${new Date().toLocaleString('fr-FR')}
            </p>
          </div>
        </div>
      `
    });

    console.log('✅ Email de test envoyé:', info.messageId);

    return NextResponse.json({
      success: true,
      messageId: info.messageId,
      message: `Email de test envoyé avec succès à ${test_email}`
    });

  } catch (error) {
    console.error('❌ Erreur test email:', error);
    
    let errorMessage = 'Erreur de configuration email';
    if (error instanceof Error) {
      if (error.message.includes('authentication')) {
        errorMessage = 'Erreur d\'authentification - Vérifiez vos identifiants';
      } else if (error.message.includes('connection')) {
        errorMessage = 'Erreur de connexion - Vérifiez le serveur et le port';
      } else {
        errorMessage = error.message;
      }
    }

    return NextResponse.json(
      { 
        success: false,
        error: errorMessage
      },
      { status: 400 }
    );
  }
}