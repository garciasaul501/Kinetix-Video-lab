export type SupportedLanguage = 'es' | 'en' | 'pt' | 'fr' | 'de' | 'it';

export interface LanguageOption {
  code: SupportedLanguage;
  name: string;
  nativeName: string;
  flag: string;
}

export const SUPPORTED_LANGUAGES: LanguageOption[] = [
  { code: 'es', name: 'Español', nativeName: 'Español', flag: '🇪🇸' },
  { code: 'en', name: 'English', nativeName: 'English', flag: '🇺🇸' },
  { code: 'pt', name: 'Português', nativeName: 'Português', flag: '🇧🇷' },
  { code: 'fr', name: 'Français', nativeName: 'Français', flag: '🇫🇷' },
  { code: 'de', name: 'Deutsch', nativeName: 'Deutsch', flag: '🇩🇪' },
  { code: 'it', name: 'Italiano', nativeName: 'Italiano', flag: '🇮🇹' },
];

export const TRANSLATIONS: Record<SupportedLanguage, Record<string, string>> = {
  es: {
    // Header & Brand
    appTitle: 'KINETIX ESTUDIO IA',
    enterNow: 'Entrar Ahora',
    tokensBadge: 'Tokens',
    buyTokens: 'Comprar Tokens',
    subscribeNow: 'EMPIEZA AHORA · BOTÓN ACCESO',
    btnAcceso: 'EMPIEZA AHORA · BOTÓN ACCESO',
    shareViral: '🚀 Compartir',
    goldOn: '👑 Letras Oro',
    goldOff: 'Letras Oro',
    assistantSupport: 'Asistente & Soporte',
    adminActive: 'Admin Activo',
    adminLogin: 'Admin',
    unlimitedVideos: 'Videos Sin Límite de Tiempo',
    photosCount: '1,200 Fotos HD · 12 PDFs Incluidos',
    languageSelect: 'Idioma',

    // Navigation Tabs
    tabAudiobooks: 'Audiolibros & PDF',
    tabGallery: '1,200 Fotos Nichos',
    tabDirector: 'Director PDF',
    tabScript: 'Guion 2 Min',
    tabNarration: 'Locución Neuronal',
    tabClips: 'Clips MP4/MP3',
    tabStore: 'Tienda PayPal',

    // Unified Action Toolbar (6 buttons)
    toolbarTitle: 'HERRAMIENTAS PRINCIPALES DEL ESTUDIO',
    actionCrear: 'CREAR',
    actionCrearSub: 'Nuevo Audiolibro',
    actionCrearDesc: 'Inicia un proyecto IA desde cero o plantilla',
    actionReproducir: 'REPRODUCIR',
    actionReproducirSub: 'Escuchar en Vivo',
    actionReproducirDesc: 'Sincroniza avatar hablado y visuales',
    actionCargar: 'CARGAR',
    actionCargarSub: 'Subir PDF / Texto',
    actionCargarDesc: 'Importa tus documentos o libros para adaptar',
    actionEliminar: 'ELIMINAR',
    actionEliminarSub: 'Limpiar Borrador',
    actionEliminarDesc: 'Reinicia el texto actual con seguridad',
    actionCompartir: 'COMPARTIR',
    actionCompartirSub: 'Redes Sociales',
    actionCompartirDesc: 'Tráfico orgánico y pagos directos',
    actionConvertir: 'CONVERTIR',
    actionConvertirSub: 'A MP4 / MP3',
    actionConvertirDesc: 'Renderiza y descarga el máster final',

    // Delete confirmation
    deleteConfirmTitle: '¿Eliminar texto del borrador?',
    deleteConfirmDesc: 'Se vaciará el contenido PDF actual para empezar uno nuevo.',
    deleteConfirmBtn: 'Sí, Eliminar',
    cancel: 'Cancelar',

    // Monetization / Access Bar
    monetizationTitle: 'EMPIEZA AHORA ANTES DE USAR O VER · BOTÓN ACCESO',
    monetizationSub: 'Acceso inmediato a la creación de audiolibros, dirección de secuencias y exportación de video',
    testRealPayment: '⚡ Testear Pago Real ($5.00)',
    secureSslNotice: '100% Protegido con Proxy Seguro SSL',
    tokensBalance: 'Tokens Disponibles',

    // Social Share Modal
    shareModalTitle: 'Compartir Directo a Redes Sociales & Tráfico Orgánico',
    shareModalSub: 'Genera visitas virales sin costo y monetiza tus contenidos con pagos directos a PayPal.',
    publishDirectly: 'Haz clic en la red social para publicar de inmediato:',
    viralLinkTitle: 'Enlace Viral con Campaña Orgánica:',
    copyLinkBtn: 'Copiar Enlace',
    linkCopied: '¡Enlace Copiado!',
    viralScriptTitle: 'Guion Viral para TikTok / Instagram Reels / YouTube Shorts:',
    copyScriptBtn: 'Copiar Guion Viral',
    scriptCopied: '¡Guion Copiado!',
    testPaymentBoxTitle: '⚡ Testear Pagos Reales con PayPal',
    testPaymentBoxDesc: 'Haz un cobro real de prueba por $5.00 (62,500 Tokens) depositado directo en tu cuenta PayPal.',
    openCheckoutBtn: 'Abrir Checkout de Prueba ($5.00)',
    modalClose: 'Cerrar',

    // Buy Tokens Modal
    buyTokensHeader: 'Buy tokens',
    youWillReceive: "You'll receive",
    purchaseFor: 'Purchase for',
    instantDelivery: 'Acreditación instantánea a tu balance',
    safeTransaction: 'Transacción encriptada y procesada por PayPal',
  },

  en: {
    // Header & Brand
    appTitle: 'KINETIX AI STUDIO',
    enterNow: 'Enter Now',
    tokensBadge: 'Tokens',
    buyTokens: 'Buy Tokens',
    subscribeNow: 'START NOW · ACCESS BUTTON',
    btnAcceso: 'START NOW · ACCESS BUTTON',
    shareViral: '🚀 Share',
    goldOn: '👑 Gold Letters',
    goldOff: 'Gold Letters',
    assistantSupport: 'Assistant & Support',
    adminActive: 'Admin Active',
    adminLogin: 'Admin',
    unlimitedVideos: 'Unlimited Video Length',
    photosCount: '1,200 HD Photos · 12 PDFs Included',
    languageSelect: 'Language',

    // Navigation Tabs
    tabAudiobooks: 'Audiobooks & PDF',
    tabGallery: '1,200 Niche Photos',
    tabDirector: 'PDF Director',
    tabScript: '2-Min Script',
    tabNarration: 'Neural Voiceover',
    tabClips: 'MP4/MP3 Clips',
    tabStore: 'PayPal Store',

    // Unified Action Toolbar (6 buttons)
    toolbarTitle: 'CORE STUDIO ACTION TOOLS',
    actionCrear: 'CREATE',
    actionCrearSub: 'New Audiobook',
    actionCrearDesc: 'Start AI project from scratch or template',
    actionReproducir: 'PLAY',
    actionReproducirSub: 'Listen Live',
    actionReproducirDesc: 'Sync talking avatar and visual scenes',
    actionCargar: 'UPLOAD',
    actionCargarSub: 'Upload PDF / Text',
    actionCargarDesc: 'Import documents or books to adapt',
    actionEliminar: 'DELETE',
    actionEliminarSub: 'Clear Draft',
    actionEliminarDesc: 'Safely reset current work buffer',
    actionCompartir: 'SHARE',
    actionCompartirSub: 'Social Networks',
    actionCompartirDesc: 'Organic viral traffic & direct payments',
    actionConvertir: 'CONVERT',
    actionConvertirSub: 'To MP4 / MP3',
    actionConvertirDesc: 'Render & download final production master',

    // Delete confirmation
    deleteConfirmTitle: 'Delete current draft text?',
    deleteConfirmDesc: 'The loaded PDF text will be emptied to start fresh.',
    deleteConfirmBtn: 'Yes, Delete',
    cancel: 'Cancel',

    // Monetization / Access Bar
    monetizationTitle: 'START NOW BEFORE USING OR VIEWING · ACCESS BUTTON',
    monetizationSub: 'Instant full access to AI audiobook creation, visual sequence directing & MP4 video export',
    testRealPayment: '⚡ Test Real Payment ($5.00)',
    secureSslNotice: '100% Protected with Secure SSL Proxy',
    tokensBalance: 'Available Tokens',

    // Social Share Modal
    shareModalTitle: 'Direct Social Sharing & Organic Viral Traffic',
    shareModalSub: 'Drive free viral visitors and monetize your content with direct PayPal earnings.',
    publishDirectly: 'Click any social platform to share immediately:',
    viralLinkTitle: 'Viral Link with Organic Campaign Tagging:',
    copyLinkBtn: 'Copy Link',
    linkCopied: 'Link Copied!',
    viralScriptTitle: 'Viral Script for TikTok / Instagram Reels / YouTube Shorts:',
    copyScriptBtn: 'Copy Viral Script',
    scriptCopied: 'Script Copied!',
    testPaymentBoxTitle: '⚡ Test Real PayPal Payments',
    testPaymentBoxDesc: 'Run a real live test payment of $5.00 (62,500 Tokens) deposited directly into your PayPal account.',
    openCheckoutBtn: 'Open Test Checkout ($5.00)',
    modalClose: 'Close',

    // Buy Tokens Modal
    buyTokensHeader: 'Buy tokens',
    youWillReceive: "You'll receive",
    purchaseFor: 'Purchase for',
    instantDelivery: 'Instant token credit to your balance',
    safeTransaction: 'Encrypted transaction processed by PayPal',
  },

  pt: {
    // Header & Brand
    appTitle: 'KINETIX ESTÚDIO IA',
    enterNow: 'Entrar Agora',
    tokensBadge: 'Tokens',
    buyTokens: 'Comprar Tokens',
    subscribeNow: 'COMECE AGORA · BOTÃO ACESSO',
    btnAcceso: 'COMECE AGORA · BOTÃO ACESSO',
    shareViral: '🚀 Compartilhar',
    goldOn: '👑 Letras Ouro',
    goldOff: 'Letras Ouro',
    assistantSupport: 'Assistente & Suporte',
    adminActive: 'Admin Ativo',
    adminLogin: 'Admin',
    unlimitedVideos: 'Vídeos Sem Limite de Tempo',
    photosCount: '1.200 Fotos HD · 12 PDFs Incluídos',
    languageSelect: 'Idioma',

    // Navigation Tabs
    tabAudiobooks: 'Audiolivros & PDF',
    tabGallery: '1.200 Fotos de Nichos',
    tabDirector: 'Diretor PDF',
    tabScript: 'Roteiro 2 Min',
    tabNarration: 'Locução Neural',
    tabClips: 'Clipes MP4/MP3',
    tabStore: 'Loja PayPal',

    // Unified Action Toolbar (6 buttons)
    toolbarTitle: 'FERRAMENTAS PRINCIPAIS DO ESTÚDIO',
    actionCrear: 'CRIAR',
    actionCrearSub: 'Novo Audiolivro',
    actionCrearDesc: 'Inicie um projeto IA do zero ou modelo',
    actionReproducir: 'REPRODUZIR',
    actionReproducirSub: 'Ouvir ao Vivo',
    actionReproducirDesc: 'Sincronize avatar falante e cenas visuais',
    actionCargar: 'CARREGAR',
    actionCargarSub: 'Enviar PDF / Texto',
    actionCargarDesc: 'Importe documentos ou livros para adaptar',
    actionEliminar: 'EXCLUIR',
    actionEliminarSub: 'Limpar Rascunho',
    actionEliminarDesc: 'Reinicie o texto atual com segurança',
    actionCompartir: 'COMPARTILHAR',
    actionCompartirSub: 'Redes Sociais',
    actionCompartirDesc: 'Tráfego orgânico e pagamentos diretos',
    actionConvertir: 'CONVERTER',
    actionConvertirSub: 'Para MP4 / MP3',
    actionConvertirDesc: 'Renderize e baixe o arquivo final',

    // Delete confirmation
    deleteConfirmTitle: 'Excluir texto do rascunho?',
    deleteConfirmDesc: 'O conteúdo PDF atual será limpo para iniciar um novo.',
    deleteConfirmBtn: 'Sim, Excluir',
    cancel: 'Cancelar',

    // Monetization / Access Bar
    monetizationTitle: 'COMECE AGORA ANTES DE USAR OU VER · BOTÃO ACESSO',
    monetizationSub: 'Acesso imediato à criação de audiolivros, direção de sequências e exportação MP4',
    testRealPayment: '⚡ Testar Pagamento Real ($5.00)',
    secureSslNotice: '100% Protegido com Proxy SSL Seguro',
    tokensBalance: 'Tokens Disponíveis',

    // Social Share Modal
    shareModalTitle: 'Compartilhe nas Redes Sociais & Tráfego Orgânico',
    shareModalSub: 'Gere visitas virais sem custos e monetize seus conteúdos com pagamentos PayPal.',
    publishDirectly: 'Clique na rede social para publicar imediatamente:',
    viralLinkTitle: 'Link Viral com Campanha Orgânica:',
    copyLinkBtn: 'Copiar Link',
    linkCopied: 'Link Copiado!',
    viralScriptTitle: 'Roteiro Viral para TikTok / Reels / Shorts:',
    copyScriptBtn: 'Copiar Roteiro Viral',
    scriptCopied: 'Roteiro Copiado!',
    testPaymentBoxTitle: '⚡ Testar Pagamentos Reais via PayPal',
    testPaymentBoxDesc: 'Faça um pagamento real de teste de $5.00 (62.500 Tokens) direto na sua conta.',
    openCheckoutBtn: 'Abrir Checkout de Teste ($5.00)',
    modalClose: 'Fechar',

    // Buy Tokens Modal
    buyTokensHeader: 'Buy tokens',
    youWillReceive: "You'll receive",
    purchaseFor: 'Purchase for',
    instantDelivery: 'Crédito imediato no seu saldo',
    safeTransaction: 'Transação criptografada pelo PayPal',
  },

  fr: {
    // Header & Brand
    appTitle: 'KINETIX STUDIO IA',
    enterNow: 'Entrer Maintenant',
    tokensBadge: 'Tokens',
    buyTokens: 'Acheter des Tokens',
    subscribeNow: 'COMMENCER · BOUTON ACCÈS',
    btnAcceso: 'COMMENCER · BOUTON ACCÈS',
    shareViral: '🚀 Partager',
    goldOn: '👑 Lettres Or',
    goldOff: 'Lettres Or',
    assistantSupport: 'Assistant & Support',
    adminActive: 'Admin Actif',
    adminLogin: 'Admin',
    unlimitedVideos: 'Vidéos Sans Limite de Temps',
    photosCount: '1 200 Photos HD · 12 PDF Inclus',
    languageSelect: 'Langue',

    // Navigation Tabs
    tabAudiobooks: 'Livres Audio & PDF',
    tabGallery: '1 200 Photos Niches',
    tabDirector: 'Directeur PDF',
    tabScript: 'Scénario 2 Min',
    tabNarration: 'Voix Neurale',
    tabClips: 'Clips MP4/MP3',
    tabStore: 'Boutique PayPal',

    // Unified Action Toolbar (6 buttons)
    toolbarTitle: 'OUTILS PRINCIPAUX DU STUDIO',
    actionCrear: 'CRÉER',
    actionCrearSub: 'Nouveau Livre Audio',
    actionCrearDesc: 'Démarrer un projet IA à partir de zéro',
    actionReproducir: 'LIRE',
    actionReproducirSub: 'Écouter en Direct',
    actionReproducirDesc: 'Synchronisez avatar parlant et visuels',
    actionCargar: 'CHARGER',
    actionCargarSub: 'Téléverser PDF / Texte',
    actionCargarDesc: 'Importez documents ou livres à adapter',
    actionEliminar: 'SUPPRIMER',
    actionEliminarSub: 'Effacer Brouillon',
    actionEliminarDesc: 'Réinitialisez le contenu en toute sécurité',
    actionCompartir: 'PARTAGER',
    actionCompartirSub: 'Réseaux Sociaux',
    actionCompartirDesc: 'Trafic organique et paiements directs',
    actionConvertir: 'CONVERTIR',
    actionConvertirSub: 'En MP4 / MP3',
    actionConvertirDesc: 'Rendez et téléchargez le master final',

    // Delete confirmation
    deleteConfirmTitle: 'Supprimer le texte actuel ?',
    deleteConfirmDesc: 'Le contenu PDF chargé sera vidé pour recommencer.',
    deleteConfirmBtn: 'Oui, Supprimer',
    cancel: 'Annuler',

    // Monetization / Access Bar
    monetizationTitle: 'COMMENCEZ MAINTENANT AVANT D’UTILISER OU DE VOIR · BOUTON ACCÈS',
    monetizationSub: 'Accès immédiat à la création de livres audio, séquences et export vidéo MP4',
    testRealPayment: '⚡ Tester Paiement Réel ($5.00)',
    secureSslNotice: '100% Protégé par Proxy Sécurisé SSL',
    tokensBalance: 'Tokens Disponibles',

    // Social Share Modal
    shareModalTitle: 'Partage Direct Réseaux Sociaux & Trafic Organique',
    shareModalSub: 'Générez des visites virales gratuites et monétisez vos contenus avec PayPal.',
    publishDirectly: 'Cliquez sur le réseau social pour publier immédiatement :',
    viralLinkTitle: 'Lien Viral avec Campagne Organique :',
    copyLinkBtn: 'Copier le Lien',
    linkCopied: 'Lien Copié !',
    viralScriptTitle: 'Script Viral pour TikTok / Reels / Shorts :',
    copyScriptBtn: 'Copier le Script Viral',
    scriptCopied: 'Script Copié !',
    testPaymentBoxTitle: '⚡ Tester Paiements Réels PayPal',
    testPaymentBoxDesc: 'Faites un vrai paiement test de 5,00 $ (62 500 Tokens) déposé directement sur votre compte.',
    openCheckoutBtn: 'Ouvrir Checkout Test ($5.00)',
    modalClose: 'Fermer',

    // Buy Tokens Modal
    buyTokensHeader: 'Buy tokens',
    youWillReceive: "You'll receive",
    purchaseFor: 'Purchase for',
    instantDelivery: 'Crédit immédiat sur votre solde',
    safeTransaction: 'Transaction chiffrée par PayPal',
  },

  de: {
    // Header & Brand
    appTitle: 'KINETIX KI-STUDIO',
    enterNow: 'Jetzt Starten',
    tokensBadge: 'Tokens',
    buyTokens: 'Tokens Kaufen',
    subscribeNow: 'JETZT STARTEN · ZUGANGS-BUTTON',
    btnAcceso: 'JETZT STARTEN · ZUGANG',
    shareViral: '🚀 Teilen',
    goldOn: '👑 Goldene Schrift',
    goldOff: 'Goldene Schrift',
    assistantSupport: 'Assistent & Support',
    adminActive: 'Admin Aktiv',
    adminLogin: 'Admin',
    unlimitedVideos: 'Videos Ohne Zeitlimit',
    photosCount: '1.200 HD-Fotos · 12 PDFs Enthalten',
    languageSelect: 'Sprache',

    // Navigation Tabs
    tabAudiobooks: 'Hörbücher & PDF',
    tabGallery: '1.200 Nischenfotos',
    tabDirector: 'PDF-Regisseur',
    tabScript: '2-Min-Skript',
    tabNarration: 'Neuronale Sprachausgabe',
    tabClips: 'MP4/MP3 Clips',
    tabStore: 'PayPal Shop',

    // Unified Action Toolbar (6 buttons)
    toolbarTitle: 'HAUPTWERKZEUGE DES STUDIOS',
    actionCrear: 'ERSTELLEN',
    actionCrearSub: 'Neues Hörbuch',
    actionCrearDesc: 'KI-Projekt von Grund auf oder Vorlage starten',
    actionReproducir: 'ABSPIELEN',
    actionReproducirSub: 'Live Anhören',
    actionReproducirDesc: 'Sprechenden Avatar und Szenen synchronisieren',
    actionCargar: 'LADEN',
    actionCargarSub: 'PDF / Text Hochladen',
    actionCargarDesc: 'Dokumente oder Bücher zum Anpassen importieren',
    actionEliminar: 'LÖSCHEN',
    actionEliminarSub: 'Entwurf Leeren',
    actionEliminarDesc: 'Aktuellen Puffer sicher zurücksetzen',
    actionCompartir: 'TEILEN',
    actionCompartirSub: 'Soziale Netzwerke',
    actionCompartirDesc: 'Organischer Traffic und direkte Zahlungen',
    actionConvertir: 'KONVERTIEREN',
    actionConvertirSub: 'Zu MP4 / MP3',
    actionConvertirDesc: 'Master rendern und herunterladen',

    // Delete confirmation
    deleteConfirmTitle: 'Entwurfstext löschen?',
    deleteConfirmDesc: 'Der geladene PDF-Text wird geleert, um neu zu beginnen.',
    deleteConfirmBtn: 'Ja, Löschen',
    cancel: 'Abbrechen',

    // Monetization / Access Bar
    monetizationTitle: 'JETZT STARTEN VOR DER NUTZUNG ODER ANSICHT · ZUGANGS-BUTTON',
    monetizationSub: 'Sofortiger voller Zugriff auf Hörbuch-Erstellung, Sequenz-Regie und MP4-Export',
    testRealPayment: '⚡ Echte Zahlung Testen ($5.00)',
    secureSslNotice: '100% Geschützt mit sicherem SSL-Proxy',
    tokensBalance: 'Verfügbare Tokens',

    // Social Share Modal
    shareModalTitle: 'Direktes Teilen in Sozialen Netzwerken & Organischer Traffic',
    shareModalSub: 'Erzielen Sie kostenlose virale Besucher und monetarisieren Sie mit PayPal-Auszahlungen.',
    publishDirectly: 'Klicken Sie auf ein Netzwerk, um sofort zu teilen:',
    viralLinkTitle: 'Viraler Link mit Kampagnen-Tracking:',
    copyLinkBtn: 'Link Kopieren',
    linkCopied: 'Link Kopiert!',
    viralScriptTitle: 'Virales Skript für TikTok / Reels / Shorts:',
    copyScriptBtn: 'Skript Kopieren',
    scriptCopied: 'Skript Kopiert!',
    testPaymentBoxTitle: '⚡ Echte PayPal-Zahlung Testen',
    testPaymentBoxDesc: 'Führen Sie eine echte Testzahlung über 5,00 $ (62.500 Tokens) direkt auf Ihr Konto durch.',
    openCheckoutBtn: 'Test-Checkout Öffnen ($5.00)',
    modalClose: 'Schließen',

    // Buy Tokens Modal
    buyTokensHeader: 'Buy tokens',
    youWillReceive: "You'll receive",
    purchaseFor: 'Purchase for',
    instantDelivery: 'Sofortige Gutschrift auf Ihr Guthaben',
    safeTransaction: 'Verschlüsselte Abwicklung über PayPal',
  },

  it: {
    // Header & Brand
    appTitle: 'KINETIX STUDIO IA',
    enterNow: 'Entra Ora',
    tokensBadge: 'Token',
    buyTokens: 'Acquista Token',
    subscribeNow: 'INIZIA ORA · PULSANTE ACCESSO',
    btnAcceso: 'INIZIA ORA · PULSANTE ACCESSO',
    shareViral: '🚀 Condividi',
    goldOn: '👑 Scritte Oro',
    goldOff: 'Scritte Oro',
    assistantSupport: 'Assistente & Supporto',
    adminActive: 'Admin Attivo',
    adminLogin: 'Admin',
    unlimitedVideos: 'Video Senza Limite di Tempo',
    photosCount: '1.200 Foto HD · 12 PDF Inclusi',
    languageSelect: 'Lingua',

    // Navigation Tabs
    tabAudiobooks: 'Audiolibri & PDF',
    tabGallery: '1.200 Foto di Nicchia',
    tabDirector: 'Regista PDF',
    tabScript: 'Sceneggiatura 2 Min',
    tabNarration: 'Voce Neurale',
    tabClips: 'Clip MP4/MP3',
    tabStore: 'Negozio PayPal',

    // Unified Action Toolbar (6 buttons)
    toolbarTitle: 'STRUMENTI PRINCIPALI DELLO STUDIO',
    actionCrear: 'CREA',
    actionCrearSub: 'Nuovo Audiolibro',
    actionCrearDesc: 'Inizia un progetto IA da zero o modello',
    actionReproducir: 'RIPRODUCI',
    actionReproducirSub: 'Ascolta dal Vivo',
    actionReproducirDesc: 'Sincronizza avatar parlante e scene visive',
    actionCargar: 'CARICA',
    actionCargarSub: 'Carica PDF / Testo',
    actionCargarDesc: 'Importa documenti o libri da adattare',
    actionEliminar: 'ELIMINA',
    actionEliminarSub: 'Cancella Bozza',
    actionEliminarDesc: 'Ripristina il testo attuale in sicurezza',
    actionCompartir: 'CONDIVIDI',
    actionCompartirSub: 'Social Network',
    actionCompartirDesc: 'Traffico organico e pagamenti diretti',
    actionConvertir: 'CONVERTI',
    actionConvertirSub: 'In MP4 / MP3',
    actionConvertirDesc: 'Genera e scarica il master finale',

    // Delete confirmation
    deleteConfirmTitle: 'Eliminare il testo della bozza?',
    deleteConfirmDesc: 'Il contenuto PDF caricato verrà svuotato per ricominciare.',
    deleteConfirmBtn: 'Sì, Elimina',
    cancel: 'Annulla',

    // Monetization / Access Bar
    monetizationTitle: 'INIZIA ORA PRIMA DI USARE O VEDERE · PULSANTE ACCESSO',
    monetizationSub: 'Accesso immediato alla creazione di audiolibri, regia di sequenze ed esportazione MP4',
    testRealPayment: '⚡ Testa Pagamento Reale ($5.00)',
    secureSslNotice: '100% Protetto con Proxy Sicuro SSL',
    tokensBalance: 'Token Disponibili',

    // Social Share Modal
    shareModalTitle: 'Condivisione Diretta sui Social & Traffico Organico',
    shareModalSub: 'Genera visite virali gratuite e monetizza con pagamenti diretti su PayPal.',
    publishDirectly: 'Fai clic sul social per pubblicare immediatamente:',
    viralLinkTitle: 'Link Virale con Monitoraggio Campagna:',
    copyLinkBtn: 'Copia Link',
    linkCopied: 'Link Copiato!',
    viralScriptTitle: 'Script Virale per TikTok / Reels / Shorts:',
    copyScriptBtn: 'Copia Script Virale',
    scriptCopied: 'Script Copiato!',
    testPaymentBoxTitle: '⚡ Testa Pagamenti Reali con PayPal',
    testPaymentBoxDesc: 'Effettua un vero pagamento di prova di $5.00 (62.500 Token) depositato direttamente sul tuo conto.',
    openCheckoutBtn: 'Apri Checkout di Prova ($5.00)',
    modalClose: 'Chiudi',

    // Buy Tokens Modal
    buyTokensHeader: 'Buy tokens',
    youWillReceive: "You'll receive",
    purchaseFor: 'Purchase for',
    instantDelivery: 'Accredito istantaneo al tuo saldo',
    safeTransaction: 'Transazione crittografata con PayPal',
  },
};

export function getSavedLanguage(): SupportedLanguage {
  if (typeof window === 'undefined') return 'es';
  try {
    const saved = localStorage.getItem('kinetix_selected_lang');
    if (saved && (saved in TRANSLATIONS)) {
      return saved as SupportedLanguage;
    }
    // Check browser language
    const navLang = navigator.language?.slice(0, 2).toLowerCase();
    if (navLang && (navLang in TRANSLATIONS)) {
      return navLang as SupportedLanguage;
    }
  } catch {
    // fallback
  }
  return 'es';
}

export function saveLanguage(lang: SupportedLanguage): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem('kinetix_selected_lang', lang);
  } catch {
    // ignore
  }
}

export function t(key: string, lang: SupportedLanguage = 'es'): string {
  const dict = TRANSLATIONS[lang] || TRANSLATIONS.es;
  return dict[key] || TRANSLATIONS.es[key] || key;
}
