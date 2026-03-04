/**
 * Newsletter Status Page
 * Standalone HTML-Seite, die vom Backend direkt gerendert wird
 * wenn User auf Confirm/Unsubscribe-Links klickt.
 *
 * Wird NICHT per Email versendet, sondern als HTTP-Response geliefert.
 * So braucht der User kein laufendes Frontend.
 */

const config = require('../../config/env');
const colors = require('./colors');
const { getEmailLogoImg } = require('./logoSvg');

/**
 * Rendert eine eigenständige HTML-Statusseite für Newsletter-Aktionen
 * @param {'confirmed'|'unsubscribed'|'invalid'|'error'} status - Ergebnis
 * @param {string} language - Sprache (de, en, ar, ka)
 * @param {string} [overrideFrontendUrl] - Optionale Frontend-URL (aus Request abgeleitet)
 * @returns {string} Vollständiges HTML-Dokument
 */
function newsletterStatusPage(status, language = 'de', overrideFrontendUrl) {
  const frontendUrl = overrideFrontendUrl || config.frontendUrl || 'http://localhost:3000';

  const content = {
    de: {
      confirmed: {
        icon: '🎉',
        title: 'Newsletter bestätigt!',
        text: 'Dein Abonnement wurde erfolgreich bestätigt. Du erhältst ab jetzt regelmäßig Neuigkeiten, Tipps und Updates von Finora.',
        note: 'In jeder Newsletter-E-Mail findest du einen Link, um dich jederzeit wieder abzumelden.',
      },
      unsubscribed: {
        icon: '👋',
        title: 'Newsletter abgemeldet',
        text: 'Du wurdest erfolgreich vom Finora-Newsletter abgemeldet. Du wirst keine weiteren Newsletter-E-Mails mehr erhalten.',
        note: 'Falls du dich umentscheidest, kannst du dich jederzeit erneut über unsere Webseite anmelden.',
      },
      invalid: {
        icon: '⚠️',
        title: 'Ungültiger Link',
        text: 'Dieser Link ist ungültig oder abgelaufen. Bestätigungslinks sind 24 Stunden gültig.',
        note: 'Bitte abonniere den Newsletter erneut über unsere Webseite, um einen neuen Bestätigungslink zu erhalten.',
      },
      error: {
        icon: '❌',
        title: 'Ein Fehler ist aufgetreten',
        text: 'Bei der Verarbeitung deiner Anfrage ist ein Fehler aufgetreten.',
        note: 'Bitte versuche es später erneut oder kontaktiere unseren Support.',
      },
      backButton: 'Zur Finora Webseite',
    },
    en: {
      confirmed: {
        icon: '🎉',
        title: 'Newsletter Confirmed!',
        text: 'Your subscription has been successfully confirmed. You will now receive regular news, tips and updates from Finora.',
        note: 'Every newsletter email includes a link to unsubscribe at any time.',
      },
      unsubscribed: {
        icon: '👋',
        title: 'Newsletter Unsubscribed',
        text: 'You have been successfully unsubscribed from the Finora newsletter. You will no longer receive newsletter emails.',
        note: 'If you change your mind, you can always re-subscribe through our website.',
      },
      invalid: {
        icon: '⚠️',
        title: 'Invalid Link',
        text: 'This link is invalid or has expired. Confirmation links are valid for 24 hours.',
        note: 'Please subscribe to the newsletter again through our website to receive a new confirmation link.',
      },
      error: {
        icon: '❌',
        title: 'An Error Occurred',
        text: 'An error occurred while processing your request.',
        note: 'Please try again later or contact our support.',
      },
      backButton: 'Go to Finora Website',
    },
    ar: {
      confirmed: {
        icon: '🎉',
        title: 'تم تأكيد النشرة الإخبارية!',
        text: 'تم تأكيد اشتراكك بنجاح. ستتلقى الآن أخبارًا ونصائح وتحديثات منتظمة من Finora.',
        note: 'تحتوي كل رسالة إخبارية على رابط لإلغاء الاشتراك في أي وقت.',
      },
      unsubscribed: {
        icon: '👋',
        title: 'تم إلغاء الاشتراك',
        text: 'تم إلغاء اشتراكك بنجاح من نشرة Finora الإخبارية. لن تتلقى المزيد من رسائل النشرة الإخبارية.',
        note: 'إذا غيرت رأيك، يمكنك إعادة الاشتراك في أي وقت عبر موقعنا.',
      },
      invalid: {
        icon: '⚠️',
        title: 'رابط غير صالح',
        text: 'هذا الرابط غير صالح أو منتهي الصلاحية. روابط التأكيد صالحة لمدة 24 ساعة.',
        note: 'يرجى الاشتراك في النشرة الإخبارية مرة أخرى عبر موقعنا للحصول على رابط تأكيد جديد.',
      },
      error: {
        icon: '❌',
        title: 'حدث خطأ',
        text: 'حدث خطأ أثناء معالجة طلبك.',
        note: 'يرجى المحاولة مرة أخرى لاحقاً أو الاتصال بالدعم.',
      },
      backButton: 'Finora الذهاب إلى موقع',
    },
    ka: {
      confirmed: {
        icon: '🎉',
        title: 'ნიუსლეთერი დადასტურებულია!',
        text: 'თქვენი გამოწერა წარმატებით დადასტურდა. ამიერიდან მიიღებთ რეგულარულ სიახლეებს, რჩევებს და განახლებებს Finora-სგან.',
        note: 'ყოველ ნიუსლეთერის ელფოსტაში არის ბმული გამოწერის გასაუქმებლად.',
      },
      unsubscribed: {
        icon: '👋',
        title: 'გამოწერა გაუქმებულია',
        text: 'თქვენ წარმატებით გაუქმდა Finora ნიუსლეთერის გამოწერა. აღარ მიიღებთ ნიუსლეთერის ელფოსტებს.',
        note: 'თუ გადაიფიქრებთ, ნებისმიერ დროს შეგიძლიათ ხელახლა გამოიწეროთ ჩვენი ვებგვერდიდან.',
      },
      invalid: {
        icon: '⚠️',
        title: 'არასწორი ბმული',
        text: 'ეს ბმული არასწორია ან ვადაგასულია. დადასტურების ბმულები მოქმედებს 24 საათის განმავლობაში.',
        note: 'გთხოვთ ხელახლა გამოიწეროთ ნიუსლეთერი ჩვენი ვებგვერდიდან ახალი დადასტურების ბმულის მისაღებად.',
      },
      error: {
        icon: '❌',
        title: 'მოხდა შეცდომა',
        text: 'თქვენი მოთხოვნის დამუშავებისას მოხდა შეცდომა.',
        note: 'გთხოვთ, სცადოთ მოგვიანებით ან დაუკავშირდეთ მხარდაჭერას.',
      },
      backButton: 'Finora ვებგვერდზე გადასვლა',
    },
  };

  const lang = content[language] || content.de;
  const t = lang[status] || lang.error;
  const dir = language === 'ar' ? 'rtl' : 'ltr';
  const align = language === 'ar' ? 'right' : 'left';
  const isSuccess = status === 'confirmed' || status === 'unsubscribed';

  return `<!DOCTYPE html>
<html lang="${language}" dir="${dir}">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${t.title} — Finora</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: 'Segoe UI', Roboto, -apple-system, BlinkMacSystemFont, Helvetica, Arial, sans-serif;
      line-height: 1.6;
      color: ${colors.textSecondary};
      background: ${colors.GRADIENTS.pageBackground};
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 20px;
      direction: ${dir};
      text-align: ${align};
    }
    .card {
      max-width: 520px;
      width: 100%;
      background: ${colors.surface};
      border-radius: 16px;
      overflow: hidden;
      box-shadow: ${colors.GRADIENTS.cardShadow};
    }
    .header {
      background: ${colors.GRADIENTS.headerBrand};
      color: white;
      padding: 28px 30px;
      text-align: center;
    }
    .header h1 {
      font-size: 26px;
      font-weight: 700;
      letter-spacing: -0.5px;
    }
    .header img {
      display: block;
      margin: 0 auto 8px;
    }
    .body {
      padding: 40px 30px 30px;
      text-align: center;
    }
    .icon {
      font-size: 56px;
      margin-bottom: 20px;
      display: block;
    }
    .body h2 {
      font-size: 22px;
      font-weight: 700;
      margin-bottom: 12px;
      color: ${isSuccess ? colors.success : status === 'invalid' ? colors.warning : colors.error};
    }
    .body p {
      font-size: 15px;
      color: ${colors.textLight};
      margin-bottom: 16px;
      line-height: 1.7;
    }
    .note {
      background: ${isSuccess ? colors.successBg : colors.warningBg};
      border: 1px solid ${isSuccess ? colors.success : colors.warning};
      border-radius: 10px;
      padding: 14px 18px;
      margin: 20px 0;
      font-size: 14px;
      color: ${isSuccess ? colors.successText : colors.warningText};
      text-align: ${align};
    }
    .btn {
      display: inline-block;
      background: ${colors.GRADIENTS.brand};
      color: white;
      text-decoration: none;
      padding: 13px 32px;
      border-radius: 10px;
      font-weight: 600;
      font-size: 15px;
      margin-top: 18px;
      transition: opacity 0.2s, transform 0.2s;
    }
    .btn:hover { opacity: 0.9; transform: translateY(-1px); }
    .footer {
      background: ${colors.surfaceLight};
      padding: 16px 30px;
      text-align: center;
      color: ${colors.textSubtle};
      font-size: 13px;
      border-top: 1px solid ${colors.borderLight};
    }
  </style>
</head>
<body>
  <div class="card">
    <div class="header">
      ${getEmailLogoImg({ size: 40 })}
      <h1>Finora</h1>
    </div>
    <div class="body">
      <span class="icon">${t.icon}</span>
      <h2>${t.title}</h2>
      <p>${t.text}</p>
      <div class="note">${t.note}</div>
      <a href="${frontendUrl}" class="btn">${lang.backButton}</a>
    </div>
    <div class="footer">
      &copy; ${new Date().getFullYear()} Finora &mdash; Smart Finance
    </div>
  </div>
</body>
</html>`;
}

module.exports = { newsletterStatusPage };
