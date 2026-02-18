/**
 * Newsletter Email Templates
 * HTML-Templates für Newsletter-Bestätigung, Willkommen und Abmeldung
 */

const { baseLayout } = require('./baseLayout');

/**
 * Newsletter-Bestätigungs-Email (Double Opt-In)
 * @param {string} confirmUrl - Bestätigungs-URL
 * @param {string} unsubscribeUrl - Abmelde-URL
 * @param {string} language - Sprache (de, en, ar, ka)
 * @returns {string} HTML-String
 */
function newsletterConfirmation(confirmUrl, unsubscribeUrl, language = 'de') {
  const content = {
    de: {
      title: 'Newsletter bestätigen',
      greeting: 'Vielen Dank für dein Interesse an Finora!',
      text: 'Bitte bestätige dein Newsletter-Abonnement, indem du auf den folgenden Button klickst:',
      button: 'Abonnement bestätigen',
      fallback: 'Oder kopiere diesen Link in deinen Browser:',
      note: 'Dieser Link ist 24 Stunden gültig. Wenn du diese Anfrage nicht gestellt hast, kannst du diese E-Mail einfach ignorieren.',
      footer: 'Du erhältst diese E-Mail, weil sich jemand mit deiner Adresse für den Finora-Newsletter angemeldet hat.',
      unsubscribe: 'Nicht interessiert? Dann kannst du dich hier abmelden.',
    },
    en: {
      title: 'Confirm Newsletter',
      greeting: 'Thank you for your interest in Finora!',
      text: 'Please confirm your newsletter subscription by clicking the button below:',
      button: 'Confirm Subscription',
      fallback: 'Or copy this link into your browser:',
      note: 'This link is valid for 24 hours. If you did not request this, you can simply ignore this email.',
      footer: 'You received this email because someone signed up for the Finora newsletter with your address.',
      unsubscribe: 'Not interested? You can unsubscribe here.',
    },
    ar: {
      title: 'تأكيد النشرة الإخبارية',
      greeting: '!Finora شكراً لاهتمامك بـ',
      text: 'يرجى تأكيد اشتراكك في النشرة الإخبارية بالنقر على الزر أدناه:',
      button: 'تأكيد الاشتراك',
      fallback: 'أو انسخ هذا الرابط في متصفحك:',
      note: 'هذا الرابط صالح لمدة 24 ساعة. إذا لم تطلب هذا، يمكنك تجاهل هذا البريد الإلكتروني.',
      footer: '.Finora لقد تلقيت هذا البريد لأن شخصاً ما سجل بعنوانك في نشرة',
      unsubscribe: 'غير مهتم؟ يمكنك إلغاء الاشتراك هنا.',
    },
    ka: {
      title: 'ნიუსლეთერის დადასტურება',
      greeting: '!Finora მადლობა თქვენი ინტერესისთვის',
      text: 'გთხოვთ დაადასტუროთ ნიუსლეთერის გამოწერა ქვემოთ მოცემულ ღილაკზე დაჭერით:',
      button: 'გამოწერის დადასტურება',
      fallback: 'ან დააკოპირეთ ეს ბმული ბრაუზერში:',
      note: 'ეს ბმული მოქმედებს 24 საათის განმავლობაში. თუ ეს არ მოგითხოვიათ, შეგიძლიათ უგულებელყოთ ეს ელფოსტა.',
      footer: '.Finora თქვენ მიიღეთ ეს ელფოსტა, რადგან ვიღაცამ თქვენი მისამართით გამოიწერა',
      unsubscribe: 'არ გაინტერესებთ? შეგიძლიათ გამოწერის გაუქმება აქ.',
    },
  };

  const t = content[language] || content.de;
  const dir = language === 'ar' ? 'rtl' : 'ltr';
  const align = language === 'ar' ? 'right' : 'left';

  return baseLayout(`
    <div class="content" style="direction: ${dir}; text-align: ${align};">
      <h2>${t.title}</h2>
      <p>${t.greeting}</p>
      <p>${t.text}</p>
      <div style="text-align: center; margin: 30px 0;">
        <a href="${confirmUrl}" class="button" style="display: inline-block; background: linear-gradient(135deg, #6366f1, #8b5cf6); color: white !important; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-weight: 600;">${t.button}</a>
      </div>
      <p style="font-size: 13px; color: #6b7280;">${t.fallback}</p>
      <p class="link-fallback"><a href="${confirmUrl}" style="color: #6366f1; word-break: break-all;">${confirmUrl}</a></p>
      <div class="info">
        <p style="margin: 0; font-size: 14px;">${t.note}</p>
      </div>
    </div>
    <div class="footer">
      <p>${t.footer}</p>
      <p style="margin-top: 8px;"><a href="${unsubscribeUrl}" style="color: #6b7280; text-decoration: underline;">${t.unsubscribe}</a></p>
      <p style="margin-top: 8px;">&copy; ${new Date().getFullYear()} Finora &mdash; Smart Finance</p>
    </div>
  `);
}

/**
 * Newsletter-Willkommens-Email (nach erfolgreicher Bestätigung)
 * @param {string} unsubscribeUrl - Abmelde-URL
 * @param {string} language - Sprache (de, en, ar, ka)
 * @returns {string} HTML-String
 */
function newsletterWelcome(unsubscribeUrl, language = 'de') {
  const content = {
    de: {
      title: 'Willkommen beim Finora Newsletter! 🎉',
      greeting: 'Dein Abonnement ist bestätigt!',
      text: 'Ab jetzt erhältst du regelmäßig Neuigkeiten, Tipps und Updates rund um deine Finanzen. Wir freuen uns, dich an Bord zu haben!',
      features: 'Das erwartet dich:',
      feature1: '💡 Praktische Finanztipps',
      feature2: '📊 Produkt-Updates & neue Features',
      feature3: '🎯 Exklusive Einblicke & Anleitungen',
      footer: 'Du erhältst diese E-Mail, weil du den Finora-Newsletter abonniert hast.',
      unsubscribe: 'Newsletter abbestellen',
    },
    en: {
      title: 'Welcome to the Finora Newsletter! 🎉',
      greeting: 'Your subscription is confirmed!',
      text: 'From now on, you will receive regular news, tips and updates about your finances. We are excited to have you on board!',
      features: 'What to expect:',
      feature1: '💡 Practical financial tips',
      feature2: '📊 Product updates & new features',
      feature3: '🎯 Exclusive insights & guides',
      footer: 'You received this email because you subscribed to the Finora newsletter.',
      unsubscribe: 'Unsubscribe from newsletter',
    },
    ar: {
      title: '🎉 !Finora مرحبًا في نشرة',
      greeting: 'تم تأكيد اشتراكك!',
      text: 'من الآن فصاعدًا، ستتلقى أخبارًا ونصائح وتحديثات منتظمة حول أموالك. يسعدنا انضمامك!',
      features: 'ما يمكن توقعه:',
      feature1: '💡 نصائح مالية عملية',
      feature2: '📊 تحديثات المنتج وميزات جديدة',
      feature3: '🎯 رؤى وإرشادات حصرية',
      footer: '.Finora لقد تلقيت هذا البريد لأنك اشتركت في نشرة',
      unsubscribe: 'إلغاء الاشتراك في النشرة',
    },
    ka: {
      title: '🎉 !Finora კეთილი იყოს შენი მობრძანება',
      greeting: 'თქვენი გამოწერა დადასტურებულია!',
      text: 'ამიერიდან მიიღებთ რეგულარულ სიახლეებს, რჩევებს და განახლებებს თქვენი ფინანსების შესახებ. მოხარულები ვართ, რომ ჩვენთან ხართ!',
      features: 'რა გელოდებათ:',
      feature1: '💡 პრაქტიკული ფინანსური რჩევები',
      feature2: '📊 პროდუქტის განახლებები და ახალი ფუნქციები',
      feature3: '🎯 ექსკლუზიური ინფორმაცია და სახელმძღვანელოები',
      footer: '.Finora თქვენ მიიღეთ ეს ელფოსტა, რადგან გამოიწერეთ',
      unsubscribe: 'გამოწერის გაუქმება',
    },
  };

  const t = content[language] || content.de;
  const dir = language === 'ar' ? 'rtl' : 'ltr';
  const align = language === 'ar' ? 'right' : 'left';

  return baseLayout(`
    <div class="content" style="direction: ${dir}; text-align: ${align};">
      <h2>${t.title}</h2>
      <p style="font-size: 16px; font-weight: 600;">${t.greeting}</p>
      <p>${t.text}</p>
      <div class="info" style="margin: 24px 0;">
        <p style="font-weight: 600; margin-bottom: 12px;">${t.features}</p>
        <p style="margin: 6px 0;">${t.feature1}</p>
        <p style="margin: 6px 0;">${t.feature2}</p>
        <p style="margin: 6px 0;">${t.feature3}</p>
      </div>
    </div>
    <div class="footer">
      <p>${t.footer}</p>
      <p style="margin-top: 8px;"><a href="${unsubscribeUrl}" style="color: #6b7280; text-decoration: underline;">${t.unsubscribe}</a></p>
      <p style="margin-top: 8px;">&copy; ${new Date().getFullYear()} Finora &mdash; Smart Finance</p>
    </div>
  `);
}

/**
 * Newsletter-Abmelde-Bestätigung
 * @param {string} language - Sprache (de, en, ar, ka)
 * @returns {string} HTML-String
 */
function newsletterGoodbye(language = 'de') {
  const content = {
    de: {
      title: 'Newsletter abgemeldet',
      text: 'Du wurdest erfolgreich vom Finora-Newsletter abgemeldet. Du wirst keine weiteren Newsletter-E-Mails mehr erhalten.',
      resubscribe: 'Falls du dich umentscheidest, kannst du dich jederzeit erneut über unsere Webseite anmelden.',
      footer: 'Dies ist die letzte E-Mail, die du von uns bezüglich des Newsletters erhältst.',
    },
    en: {
      title: 'Newsletter Unsubscribed',
      text: 'You have been successfully unsubscribed from the Finora newsletter. You will no longer receive newsletter emails.',
      resubscribe: 'If you change your mind, you can always re-subscribe through our website.',
      footer: 'This is the last email you will receive from us regarding the newsletter.',
    },
    ar: {
      title: 'تم إلغاء الاشتراك في النشرة',
      text: 'تم إلغاء اشتراكك بنجاح من نشرة Finora الإخبارية. لن تتلقى المزيد من رسائل النشرة الإخبارية.',
      resubscribe: 'إذا غيرت رأيك، يمكنك إعادة الاشتراك في أي وقت عبر موقعنا.',
      footer: 'هذا هو آخر بريد إلكتروني ستتلقاه منا بخصوص النشرة الإخبارية.',
    },
    ka: {
      title: 'ნიუსლეთერის გამოწერა გაუქმებულია',
      text: 'თქვენ წარმატებით გაუქმდა Finora ნიუსლეთერის გამოწერა. აღარ მიიღებთ ნიუსლეთერის ელფოსტებს.',
      resubscribe: 'თუ გადაიფიქრებთ, ნებისმიერ დროს შეგიძლიათ ხელახლა გამოიწეროთ ჩვენი ვებგვერდიდან.',
      footer: 'ეს არის ბოლო ელფოსტა, რომელსაც მიიღებთ ჩვენგან ნიუსლეთერთან დაკავშირებით.',
    },
  };

  const t = content[language] || content.de;
  const dir = language === 'ar' ? 'rtl' : 'ltr';
  const align = language === 'ar' ? 'right' : 'left';

  return baseLayout(`
    <div class="content" style="direction: ${dir}; text-align: ${align};">
      <h2>${t.title}</h2>
      <p>${t.text}</p>
      <div class="info">
        <p style="margin: 0;">${t.resubscribe}</p>
      </div>
    </div>
    <div class="footer">
      <p>${t.footer}</p>
      <p style="margin-top: 8px;">&copy; ${new Date().getFullYear()} Finora &mdash; Smart Finance</p>
    </div>
  `);
}

module.exports = { newsletterConfirmation, newsletterWelcome, newsletterGoodbye };
