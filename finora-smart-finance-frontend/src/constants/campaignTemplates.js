/**
 * @fileoverview Campaign Templates
 * @description Vorgefertigte Newsletter-Vorlagen in allen 4 Sprachen.
 *              Jede Vorlage enthält Betreff + Inhalt pro Sprache.
 *
 * @module constants/campaignTemplates
 */

/**
 * Verfügbare Kampagnen-Vorlagen
 * @type {Array<{id: string, labelKey: string, subjects: Object, contents: Object}>}
 */
export const CAMPAIGN_TEMPLATES = [
  // ── 1. Produkt-Update ─────────────────────────
  {
    id: 'product-update',
    labelKey: 'admin.campaigns.templates.productUpdate',
    subjects: {
      de: 'Finora Update: Neue Funktionen verfügbar',
      en: 'Finora Update: New Features Available',
      ar: 'تحديث فينورا: ميزات جديدة متاحة',
      ka: 'Finora განახლება: ახალი ფუნქციები ხელმისაწვდომია',
    },
    contents: {
      de: `Hallo,

wir freuen uns, dir die neuesten Verbesserungen in Finora vorzustellen!

Was ist neu:
• Verbesserte Dashboard-Übersicht mit interaktiven Diagrammen
• Neue Filterfunktionen für deine Transaktionen
• Optimierte Performance und schnellere Ladezeiten
• Anpassbare Budget-Benachrichtigungen

Melde dich jetzt an und entdecke die neuen Funktionen. Bei Fragen stehen wir dir gerne zur Verfügung.

Beste Grüße,
Dein Finora-Team`,
      en: `Hello,

We're excited to introduce the latest improvements to Finora!

What's new:
• Improved dashboard overview with interactive charts
• New transaction filter options
• Optimized performance and faster loading times
• Customizable budget notifications

Log in now and discover the new features. If you have any questions, we're happy to help.

Best regards,
The Finora Team`,
      ar: `مرحباً،

يسعدنا أن نقدم لك أحدث التحسينات في فينورا!

ما الجديد:
• لوحة تحكم محسّنة مع رسوم بيانية تفاعلية
• خيارات تصفية جديدة لمعاملاتك
• أداء محسّن وأوقات تحميل أسرع
• إشعارات ميزانية قابلة للتخصيص

سجّل الدخول الآن واكتشف الميزات الجديدة. لا تتردد في التواصل معنا إذا كانت لديك أي أسئلة.

مع أطيب التحيات،
فريق فينورا`,
      ka: `გამარჯობა,

სიამოვნებით გაცნობებთ Finora-ს უახლეს გაუმჯობესებებს!

რა არის ახალი:
• გაუმჯობესებული დაფა ინტერაქტიული დიაგრამებით
• ტრანზაქციების ახალი ფილტრაციის ვარიანტები
• ოპტიმიზირებული წარმადობა და სწრაფი ჩატვირთვა
• მორგებადი ბიუჯეტის შეტყობინებები

შედით ახლავე და აღმოაჩინეთ ახალი ფუნქციები. კითხვების შემთხვევაში მზად ვართ დაგეხმაროთ.

პატივისცემით,
Finora-ს გუნდი`,
    },
  },

  // ── 2. Newsletter-Digest ──────────────────────
  {
    id: 'newsletter-digest',
    labelKey: 'admin.campaigns.templates.newsletterDigest',
    subjects: {
      de: 'Finora Newsletter: Finanztipps & Updates',
      en: 'Finora Newsletter: Financial Tips & Updates',
      ar: 'نشرة فينورا الإخبارية: نصائح مالية وتحديثات',
      ka: 'Finora ბიულეტენი: ფინანსური რჩევები და სიახლეები',
    },
    contents: {
      de: `Hallo,

hier ist dein monatlicher Finora-Newsletter mit den wichtigsten Finanztipps und Updates.

📊 Finanztipp des Monats:
Überprüfe regelmäßig deine Ausgabenkategorien. Kleine, wiederkehrende Kosten summieren sich schnell – mit Finora behältst du den Überblick.

📈 Deine Statistiken:
Nutze die Dashboard-Übersicht, um deine monatlichen Ausgaben mit dem Vormonat zu vergleichen.

💡 Wusstest du schon?
Du kannst individuelle Budget-Limits für jede Kategorie festlegen und wirst benachrichtigt, bevor du sie überschreitest.

Bis zum nächsten Mal!

Dein Finora-Team`,
      en: `Hello,

Here's your monthly Finora newsletter with the latest financial tips and updates.

📊 Financial Tip of the Month:
Review your spending categories regularly. Small recurring costs add up quickly – with Finora, you'll stay on top of them.

📈 Your Statistics:
Use the dashboard overview to compare your monthly expenses with the previous month.

💡 Did You Know?
You can set individual budget limits for each category and get notified before you exceed them.

Until next time!

The Finora Team`,
      ar: `مرحباً،

إليك نشرة فينورا الشهرية مع أحدث النصائح المالية والتحديثات.

📊 نصيحة مالية الشهر:
راجع فئات إنفاقك بانتظام. التكاليف المتكررة الصغيرة تتراكم بسرعة – مع فينورا، ستبقى على اطلاع دائم.

📈 إحصائياتك:
استخدم لوحة التحكم لمقارنة نفقاتك الشهرية مع الشهر السابق.

💡 هل تعلم؟
يمكنك تعيين حدود ميزانية فردية لكل فئة والحصول على إشعار قبل تجاوزها.

إلى اللقاء!

فريق فينورا`,
      ka: `გამარჯობა,

აქ არის თქვენი ყოველთვიური Finora ბიულეტენი უახლესი ფინანსური რჩევებითა და სიახლეებით.

📊 თვის ფინანსური რჩევა:
რეგულარულად გადახედეთ თქვენი ხარჯვის კატეგორიებს. მცირე განმეორებითი ხარჯები სწრაფად გროვდება – Finora-თი ყველაფერს თვალყურს ადევნებთ.

📈 თქვენი სტატისტიკა:
გამოიყენეთ დაფის მიმოხილვა თქვენი ყოველთვიური ხარჯების წინა თვესთან შესადარებლად.

💡 იცოდით?
შეგიძლიათ ინდივიდუალური ბიუჯეტის ლიმიტები დააყენოთ თითოეული კატეგორიისთვის და მიიღოთ შეტყობინება გადაჭარბებამდე.

შემდეგ ჯერამდე!

Finora-ს გუნდი`,
    },
  },

  // ── 3. Sicherheitshinweis ─────────────────────
  {
    id: 'security-notice',
    labelKey: 'admin.campaigns.templates.securityNotice',
    subjects: {
      de: 'Finora Sicherheitshinweis: Wichtige Informationen',
      en: 'Finora Security Notice: Important Information',
      ar: 'إشعار أمان فينورا: معلومات مهمة',
      ka: 'Finora უსაფრთხოების შეტყობინება: მნიშვნელოვანი ინფორმაცია',
    },
    contents: {
      de: `Hallo,

wir möchten dich über eine wichtige Sicherheitsmaßnahme informieren.

🔒 Was ist passiert?
Wir haben unsere Sicherheitsprotokolle aktualisiert, um deinen Account noch besser zu schützen.

⚡ Was musst du tun?
• Ändere dein Passwort bei deiner nächsten Anmeldung
• Überprüfe deine E-Mail-Einstellungen in den Kontoeinstellungen
• Aktiviere die Zwei-Faktor-Authentifizierung, falls noch nicht geschehen

ℹ️ Wichtig:
Finora wird dich niemals per E-Mail nach deinem Passwort fragen. Sei vorsichtig bei verdächtigen E-Mails.

Bei Fragen kontaktiere uns über das Kontaktformular.

Dein Finora-Sicherheitsteam`,
      en: `Hello,

We'd like to inform you about an important security measure.

🔒 What happened?
We've updated our security protocols to better protect your account.

⚡ What do you need to do?
• Change your password at your next login
• Review your email settings in your account preferences
• Enable two-factor authentication if you haven't already

ℹ️ Important:
Finora will never ask for your password via email. Be cautious of suspicious emails.

If you have questions, contact us through the contact form.

The Finora Security Team`,
      ar: `مرحباً،

نود إبلاغك عن إجراء أمني مهم.

🔒 ماذا حدث؟
قمنا بتحديث بروتوكولات الأمان لحماية حسابك بشكل أفضل.

⚡ ما الذي يجب عليك فعله؟
• قم بتغيير كلمة المرور عند تسجيل الدخول التالي
• راجع إعدادات البريد الإلكتروني في تفضيلات حسابك
• فعّل المصادقة الثنائية إذا لم تكن قد فعلت ذلك بعد

ℹ️ مهم:
لن تطلب منك فينورا أبداً كلمة المرور عبر البريد الإلكتروني. كن حذراً من الرسائل المشبوهة.

للاستفسارات، تواصل معنا عبر نموذج الاتصال.

فريق أمان فينورا`,
      ka: `გამარჯობა,

გვსურს გაცნობოთ მნიშვნელოვანი უსაფრთხოების ზომის შესახებ.

🔒 რა მოხდა?
ჩვენ განვაახლეთ უსაფრთხოების პროტოკოლები თქვენი ანგარიშის უკეთ დასაცავად.

⚡ რა უნდა გააკეთოთ?
• შეცვალეთ პაროლი მომდევნო შესვლისას
• გადახედეთ ელ-ფოსტის პარამეტრებს ანგარიშის პრეფერენციებში
• ჩართეთ ორფაქტორიანი ავთენტიფიკაცია, თუ ჯერ არ გაგიკეთებიათ

ℹ️ მნიშვნელოვანი:
Finora არასოდეს მოგთხოვთ პაროლს ელ-ფოსტით. ფრთხილად იყავით საეჭვო შეტყობინებებთან.

კითხვების შემთხვევაში დაგვიკავშირდით საკონტაქტო ფორმით.

Finora-ს უსაფრთხოების გუნდი`,
    },
  },

  // ── 4. Wartungsarbeiten ────────────────────────
  {
    id: 'maintenance',
    labelKey: 'admin.campaigns.templates.maintenance',
    subjects: {
      de: 'Finora Wartungsarbeiten: Geplante Downtime',
      en: 'Finora Maintenance: Scheduled Downtime',
      ar: 'صيانة فينورا: توقف مجدول',
      ka: 'Finora ტექნიკური სამუშაოები: დაგეგმილი შეფერხება',
    },
    contents: {
      de: `Hallo,

wir möchten dich über geplante Wartungsarbeiten informieren.

🔧 Wartungszeitraum:
[Datum und Uhrzeit hier eintragen]

⏱️ Geschätzte Dauer:
Etwa [X] Stunden

❗ Was bedeutet das für dich?
• Die App kann während der Wartung vorübergehend nicht erreichbar sein
• Deine Daten sind sicher und werden nicht beeinflusst
• Nach der Wartung kannst du die App wie gewohnt nutzen

Wir entschuldigen uns für die Unannehmlichkeiten und arbeiten daran, die App noch besser für dich zu machen.

Dein Finora-Team`,
      en: `Hello,

We'd like to inform you about scheduled maintenance.

🔧 Maintenance Window:
[Enter date and time here]

⏱️ Estimated Duration:
Approximately [X] hours

❗ What does this mean for you?
• The app may be temporarily unavailable during maintenance
• Your data is safe and will not be affected
• After maintenance, you can use the app as usual

We apologize for any inconvenience and are working to make the app even better for you.

The Finora Team`,
      ar: `مرحباً،

نود إبلاغك عن أعمال صيانة مجدولة.

🔧 فترة الصيانة:
[أدخل التاريخ والوقت هنا]

⏱️ المدة المقدرة:
حوالي [X] ساعات

❗ ماذا يعني هذا بالنسبة لك؟
• قد يكون التطبيق غير متاح مؤقتاً أثناء الصيانة
• بياناتك آمنة ولن تتأثر
• بعد الصيانة، يمكنك استخدام التطبيق كالمعتاد

نعتذر عن أي إزعاج ونعمل على جعل التطبيق أفضل لك.

فريق فينورا`,
      ka: `გამარჯობა,

გვსურს გაცნობოთ დაგეგმილი ტექნიკური სამუშაოების შესახებ.

🔧 სამუშაოების პერიოდი:
[შეიყვანეთ თარიღი და დრო აქ]

⏱️ სავარაუდო ხანგრძლივობა:
დაახლოებით [X] საათი

❗ რას ნიშნავს ეს თქვენთვის?
• აპლიკაცია შეიძლება დროებით მიუწვდომელი იყოს სამუშაოების დროს
• თქვენი მონაცემები უსაფრთხოა და არ დაზარალდება
• სამუშაოების დასრულების შემდეგ აპლიკაციას ჩვეულებრივად გამოიყენებთ

ბოდიშს ვიხდით შეფერხებისთვის და ვმუშაობთ აპლიკაციის გასაუმჯობესებლად.

Finora-ს გუნდი`,
    },
  },

  // ── 5. Tipps & Tricks ─────────────────────────
  {
    id: 'tips-tricks',
    labelKey: 'admin.campaigns.templates.tipsTricks',
    subjects: {
      de: 'Finora Finanztipps: Spare smarter!',
      en: 'Finora Financial Tips: Save Smarter!',
      ar: 'نصائح فينورا المالية: وفّر بذكاء!',
      ka: 'Finora ფინანსური რჩევები: დაზოგე ჭკვიანურად!',
    },
    contents: {
      de: `Hallo,

hier sind unsere besten Finanztipps, um deine Finanzen auf das nächste Level zu bringen!

💰 Tipp 1: Die 50-30-20 Regel
Teile dein Einkommen auf: 50% für Bedürfnisse, 30% für Wünsche, 20% zum Sparen. Nutze Finoras Kategorien, um dies einfach nachzuverfolgen.

📱 Tipp 2: Tägliche Tracking-Gewohnheit
Trage deine Ausgaben direkt nach dem Kauf ein. Je aktueller deine Daten, desto bessere Einblicke hast du.

🎯 Tipp 3: Realistische Budget-Ziele
Setze erreichbare monatliche Limits. Finora benachrichtigt dich, wenn du 80% deines Budgets erreicht hast.

📊 Tipp 4: Monatlicher Finanz-Check
Nimm dir 10 Minuten pro Monat, um deine Ausgabentrends im Dashboard zu überprüfen.

Viel Erfolg bei deiner finanziellen Reise!

Dein Finora-Team`,
      en: `Hello,

Here are our best financial tips to take your finances to the next level!

💰 Tip 1: The 50-30-20 Rule
Split your income: 50% for needs, 30% for wants, 20% for savings. Use Finora's categories to track this easily.

📱 Tip 2: Daily Tracking Habit
Log your expenses right after each purchase. The more current your data, the better insights you'll have.

🎯 Tip 3: Realistic Budget Goals
Set achievable monthly limits. Finora will notify you when you've reached 80% of your budget.

📊 Tip 4: Monthly Finance Check
Take 10 minutes each month to review your spending trends on the dashboard.

Good luck on your financial journey!

The Finora Team`,
      ar: `مرحباً،

إليك أفضل نصائحنا المالية للارتقاء بأموالك إلى المستوى التالي!

💰 نصيحة 1: قاعدة 50-30-20
قسّم دخلك: 50% للاحتياجات، 30% للرغبات، 20% للادخار. استخدم فئات فينورا لتتبع ذلك بسهولة.

📱 نصيحة 2: عادة التتبع اليومي
سجّل نفقاتك مباشرة بعد كل عملية شراء. كلما كانت بياناتك أحدث، كانت رؤاك أفضل.

🎯 نصيحة 3: أهداف ميزانية واقعية
حدد حدوداً شهرية قابلة للتحقيق. ستنبهك فينورا عند بلوغ 80% من ميزانيتك.

📊 نصيحة 4: مراجعة مالية شهرية
خصص 10 دقائق شهرياً لمراجعة اتجاهات إنفاقك في لوحة التحكم.

حظاً موفقاً في رحلتك المالية!

فريق فينورا`,
      ka: `გამარჯობა,

აქ არის ჩვენი საუკეთესო ფინანსური რჩევები, რომ თქვენი ფინანსები ახალ დონეზე აიყვანოთ!

💰 რჩევა 1: 50-30-20 წესი
გაანაწილეთ შემოსავალი: 50% საჭიროებებისთვის, 30% სურვილებისთვის, 20% დანაზოგისთვის. გამოიყენეთ Finora-ს კატეგორიები ამის ადვილად სათვალთვალოდ.

📱 რჩევა 2: ყოველდღიური აღრიცხვა
შეიტანეთ ხარჯები ყოველი შესყიდვისთანავე. რაც უფრო აქტუალურია მონაცემები, მით უკეთესი შეხედულებები გექნებათ.

🎯 რჩევა 3: რეალისტური ბიუჯეტი
დააყენეთ მიღწევადი ყოველთვიური ლიმიტები. Finora შეგატყობინებთ ბიუჯეტის 80%-ის მიღწევისას.

📊 რჩევა 4: ყოველთვიური ფინანსური შემოწმება
დაუთმეთ 10 წუთი ყოველთვე ხარჯვის ტრენდების გადახედვას დაფაზე.

წარმატებებს გისურვებთ ფინანსურ მოგზაურობაში!

Finora-ს გუნდი`,
    },
  },
];

/** Template ID → Template Lookup */
export const TEMPLATE_MAP = Object.fromEntries(
  CAMPAIGN_TEMPLATES.map((t) => [t.id, t]),
);
