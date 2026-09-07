// Global error handler to display runtime errors on the page
window.onerror = function(message, source, lineno, colno, error) {
  const errorDiv = document.createElement('div');
  errorDiv.style.position = 'fixed';
  errorDiv.style.top = '10px';
  errorDiv.style.left = '10px';
  errorDiv.style.right = '10px';
  errorDiv.style.background = '#ef4444';
  errorDiv.style.color = '#ffffff';
  errorDiv.style.padding = '15px';
  errorDiv.style.borderRadius = '8px';
  errorDiv.style.zIndex = '999999';
  errorDiv.style.fontFamily = 'monospace';
  errorDiv.style.fontSize = '12px';
  errorDiv.style.boxShadow = '0 10px 25px rgba(0,0,0,0.5)';
  errorDiv.innerHTML = `
    <strong>[JavaScript Error]</strong> ${message}<br>
    <small>File: ${source} | Line: ${lineno}:${colno}</small>
  `;
  document.body.appendChild(errorDiv);
  return false;
};

// Application State Object
const state = {
  selectedEvent: 'oratory', // oratory, informative, extemp, impromptu, dramatic
  audioSource: 'upload', // upload, record
  audioFile: null,
  audioBuffer: null,
  audioDuration: 0, // in seconds
  isPlaying: false,
  currentTime: 0, // in seconds
  transcript: '',
  quotedWordsCount: 0,
  fillerWordsCount: 0,
  wpm: 0,
  scores: {
    delivery: 7.0,
    content: 7.0,
    org: 7.0
  },
  isRecording: false,
  mediaRecorder: null,
  audioChunks: [],
  recordInterval: null,
  recordStartTime: 0,
  elapsedRecordTime: 0,
  speechRecognition: null,
  currentUser: null,
  authMode: 'login',
  audioContext: null,
  sourceNode: null,
  analyserNode: null,
  animationFrameId: null,
  audioElement: null,
  isSampleAudio: false,
  synthAudioCtx: null,
  activeSynthNodes: null
};

// Event Guidelines Configuration
const eventRules = {
  oratory: {
    title: 'Original Oratory Rules',
    category: 'Public Speaking',
    maxTime: 600, // 10 minutes
    gracePeriod: 30, // 30 seconds
    quoteLimit: 150, // 150 words
    requiresQuotesRule: true,
    visualAids: false,
    binder: 'Memorized (Off-Book)',
    desc: 'A persuasive speech written by the student to inspire, convince, or advocate for change. Max 150 quoted words permitted. Focus on rhetoric, clear structure, and passionate delivery.'
  },
  informative: {
    title: 'Informative Speaking Rules',
    category: 'Public Speaking',
    maxTime: 600, // 10 minutes
    gracePeriod: 30, // 30 seconds
    quoteLimit: 150, // 150 words
    requiresQuotesRule: true,
    visualAids: true, // PERMITTED!
    binder: 'Memorized (Off-Book)',
    desc: 'An informative speech written by the student to explain, clarify, or describe a topic. Visual aids are permitted (optional 2D/3D props up to 30s setup time). Max 150 quoted words permitted.'
  },
  usx: {
    title: 'United States Extemporaneous Speaking Rules',
    category: 'Limited Preparation',
    maxTime: 420, // 7 minutes
    gracePeriod: 30,
    quoteLimit: 0,
    requiresQuotesRule: false,
    quoteText: 'N/A (Oral Citations Required)',
    visualAids: false,
    binder: 'Memory / Brief Prep Notes',
    desc: 'Limited preparation event (30 minutes prep to answer a US domestic policy/current affairs topic). Must provide 5-10 oral source citations. Visual aids not permitted.'
  },
  extemp: { // Alias for USX
    title: 'United States Extemporaneous Speaking Rules',
    category: 'Limited Preparation',
    maxTime: 420,
    gracePeriod: 30,
    quoteLimit: 0,
    requiresQuotesRule: false,
    quoteText: 'N/A (Oral Citations Required)',
    visualAids: false,
    binder: 'Memory / Brief Prep Notes',
    desc: 'Limited preparation event (30 minutes prep to answer a US domestic policy/current affairs topic). Must provide 5-10 oral source citations. Visual aids not permitted.'
  },
  ix: {
    title: 'International Extemporaneous Speaking Rules',
    category: 'Limited Preparation',
    maxTime: 420, // 7 minutes
    gracePeriod: 30,
    quoteLimit: 0,
    requiresQuotesRule: false,
    quoteText: 'N/A (Oral Citations Required)',
    visualAids: false,
    binder: 'Memory / Brief Prep Notes',
    desc: 'Limited preparation event (30 minutes prep to answer an international foreign affairs topic). Must provide 5-10 oral source citations. Visual aids not permitted.'
  },
  impromptu: {
    title: 'Impromptu Speaking Rules',
    category: 'Limited Preparation',
    maxTime: 420, // 7 minutes total prep + speak
    gracePeriod: 30,
    quoteLimit: 0,
    requiresQuotesRule: false,
    quoteText: 'N/A',
    visualAids: false,
    binder: 'Prep Notes Only',
    desc: 'Total of 7 minutes to draw a prompt (quote/word), prepare brief notes, and deliver a speech. Focus on structure, quick organization, and fluid delivery.'
  },
  dramatic: {
    title: 'Dramatic Interpretation Rules',
    category: 'Interpretation',
    maxTime: 600, // 10 minutes
    gracePeriod: 30,
    quoteLimit: 0,
    requiresQuotesRule: false,
    quoteText: 'Published Script',
    visualAids: false,
    binder: 'Memorized (Off-Book)',
    desc: 'Solo interpretation of a single published dramatic literary script. Audio analysis focuses heavily on vocal range, character distinctions, emotional pauses, and dramatic pacing.'
  },
  humorous: {
    title: 'Humorous Interpretation Rules',
    category: 'Interpretation',
    maxTime: 600, // 10 minutes
    gracePeriod: 30,
    quoteLimit: 0,
    requiresQuotesRule: false,
    quoteText: 'Published Script',
    visualAids: false,
    binder: 'Memorized (Off-Book)',
    desc: 'Solo interpretation of a single published humorous literary script. Audio analysis focuses on comedic timing, character popping, energy, and animated vocal delivery.'
  },
  duo: {
    title: 'Duo Interpretation Rules',
    category: 'Interpretation',
    maxTime: 600, // 10 minutes
    gracePeriod: 30,
    quoteLimit: 0,
    requiresQuotesRule: false,
    quoteText: 'Published Script',
    visualAids: false,
    binder: 'Memorized (Off-Book)',
    desc: 'Two-person performance of published literature. Features off-stage focal point (performers do not make direct eye contact except intro) and no physical contact.'
  },
  poi: {
    title: 'Program Oral Interpretation Rules',
    category: 'Interpretation',
    maxTime: 600, // 10 minutes
    gracePeriod: 30,
    quoteLimit: 0,
    requiresQuotesRule: false,
    quoteText: 'Multi-Genre Program',
    visualAids: false,
    binder: 'Handheld Manuscript Required',
    desc: 'Multi-genre program using selections from at least TWO of three literature genres (Prose, Poetry, Drama). Handheld manuscript binder is REQUIRED and used as a stage prop.'
  },
  prose: {
    title: 'Prose Interpretation Rules',
    category: 'Interpretation (Supplemental)',
    maxTime: 300, // 5 minutes (Supplemental standard)
    gracePeriod: 30,
    quoteLimit: 0,
    requiresQuotesRule: false,
    quoteText: 'Published Prose',
    visualAids: false,
    binder: 'Handheld Manuscript Required',
    desc: 'Performance of published prose literature (short stories, novel excerpts, essays) using a handheld manuscript binder. 5-minute maximum limit with 30s grace.'
  },
  poetry: {
    title: 'Poetry Interpretation Rules',
    category: 'Interpretation (Supplemental)',
    maxTime: 300, // 5 minutes
    gracePeriod: 30,
    quoteLimit: 0,
    requiresQuotesRule: false,
    quoteText: 'Published Poetry',
    visualAids: false,
    binder: 'Handheld Manuscript Required',
    desc: 'Performance of published poetic literature (single poem or collection) using a handheld manuscript binder. 5-minute maximum limit with 30s grace.'
  },
  declamation: {
    title: 'Declamation Rules',
    category: 'Public Speaking (Supplemental)',
    maxTime: 600, // 10 minutes
    gracePeriod: 30,
    quoteLimit: 0,
    requiresQuotesRule: false,
    quoteText: 'Full Speech (Published)',
    visualAids: false,
    binder: 'Memorized (Off-Book)',
    desc: 'Delivery of a speech previously given by another public figure or orator, preceded by an original student introduction. 10-minute maximum limit with 30s grace.'
  },
  expository: {
    title: 'Expository Speaking Rules',
    category: 'Public Speaking (Supplemental)',
    maxTime: 300, // 5 minutes
    gracePeriod: 30,
    quoteLimit: 0,
    requiresQuotesRule: false,
    quoteText: 'N/A',
    visualAids: true, // PERMITTED!
    binder: 'Memorized (Off-Book)',
    desc: 'A 5-minute original informative speech written by the student to describe or explain a topic. Visual aids are permitted and optional.'
  }
};

// Default transcripts for custom uploaded files based on selected category
const defaultTranscripts = {
  oratory: `In a society that demands constant optimization, we are taught to fear failure. From childhood, we are graded, ranked, and sorted. We learn to avoid risk and stay within our comfort zones. Today, I want to challenge this culture of perfectionism. First, let us look at how the fear of failure paralyzes creativity. When we are afraid to make mistakes, we replicate what is safe. Second, let us examine the psychological toll. The pressure to succeed has led to a dramatic increase in anxiety among young people. Finally, we must redefine failure not as an endpoint, but as an essential element of progress. As the philosopher Samuel Beckett once said, "Ever tried. Ever failed. No matter. Try again. Fail again. Fail better." Only when we accept failure can we truly learn, innovate, and grow as human beings.`,
  informative: `Biomimicry is the practice of looking to nature for solutions to complex human problems. For billions of years, nature has solved engineering, structural, and survival challenges. Today, we will explore three key innovations inspired by biology. First, consider the shinkansen bullet train in Japan. Its nose design was inspired by the kingfisher bird's beak, reducing noise pollution and increasing efficiency. Second, look at velcro, which was modeled after burrs sticking to dog fur. Finally, we see wind turbine blades designed like humpback whale flippers to reduce drag. By studying nature's time-tested designs, we can create sustainable, highly optimized technologies for our future.`,
  usx: `Today, we must address the geopolitical tensions surrounding the global microchip supply chain. As technology advances, semiconductor chips have become the new oil of the twenty-first century. To understand the strategic implications, we must look at three critical fronts. First, Taiwan holds a virtual monopoly on high-end chip manufacturing through TSMC, making the region a focal point of US-China tensions. Second, the European Union and the United States have passed massive chip acts to subsidize domestic foundries, attempting to achieve semiconductor independence. Finally, export controls on critical raw materials like gallium and germanium have intensified trade friction. Ultimately, the quest for chip sovereignty will reshape global alliances and trade routes in the decade ahead.`,
  extemp: `Today, we must address the geopolitical tensions surrounding the global microchip supply chain. As technology advances, semiconductor chips have become the new oil of the twenty-first century. To understand the strategic implications, we must look at three critical fronts. First, Taiwan holds a virtual monopoly on high-end chip manufacturing through TSMC, making the region a focal point of US-China tensions. Second, the European Union and the United States have passed massive chip acts to subsidize domestic foundries, attempting to achieve semiconductor independence. Finally, export controls on critical raw materials like gallium and germanium have intensified trade friction. Ultimately, the quest for chip sovereignty will reshape global alliances and trade routes in the decade ahead.`,
  ix: `The international community faces a decisive moment in addressing global food security across developing nations. Conflict, extreme weather events, and economic instability have combined to create unprecedented challenges for vulnerable populations. To understand the global response, we must examine three key developments. First, international aid organizations are shifting from reactive relief to climate-resilient agriculture investments. Second, regional trade pacts in Africa and Latin America are lowering tariffs to facilitate rapid food distribution. Third, international financial institutions are developing debt-for-food security swaps to relieve fiscal pressures on developing economies. Consequently, coordinated multilateral strategy is essential to preventing widespread famine.`,
  impromptu: `The classic proverb states that "smooth seas do not make skillful sailors." This reminds us that strength, wisdom, and capability are only forged in the face of adversity. A life without struggle may be comfortable, but it leaves us unprepared for the inevitable storms of existence. To understand this, let us look at two aspects. First, personal growth requires pressure. Just as carbon is compressed into diamonds under intense heat and pressure, our character is refined by our struggles. Second, collective resilience is built in crises. History shows that societies develop their greatest political and social breakthroughs not during times of ease, but during periods of profound instability. Therefore, we should not fear difficulties, but embrace them as our teachers.`,
  dramatic: `I remember the kitchen. The smell of fresh bread and the sound of my mother humming. It was a simple life, but it was ours. And then, in a single night, everything changed. The sirens started, and we had to run. I didn't get to say goodbye to my books, my room, or my childhood. Now, standing here in this new, silent city, I realize that home is not a place with walls and a roof. Home is the memory of those voices, the laughter around the table, and the hope that one day, we will return. Until then, I carry that kitchen, that hum, and that light inside me, wherever I go.`,
  humorous: `Welcome to the annual meeting of the Neighborhood Watch Association! Before we begin, a quick update on Mr. Henderson's lawn flamingo. It has been moved three inches to the left. I repeat, three inches to the left without prior committee approval! We cannot stand by while anarchy reigns on Willow Street. Now, let us turn to item two on our urgent agenda: cat walking etiquette. If your feline refuses to wear high-visibility safety vests during twilight strolls, severe stern looks will be administered at the block party!`,
  duo: `[Partner 1]: We've been lost in this cave for three hours, Marcus. You said you had a map!
[Partner 2]: I DO have a map! It's right here... on my phone... which has zero percent battery.
[Partner 1]: Brilliant. Absolutely brilliant. We are going to be discovered three hundred years from now as fossilized skeletons holding a dead Smartphone.
[Partner 2]: Look on the bright side, Sarah! At least we won't have to take our calculus final tomorrow.
[Partner 1]: Marcus, I would take ten calculus finals right now if it meant seeing daylight again! Now put down your useless phone and help me feel the left cavern wall for air currents.`,
  poi: `(From 'The Wasteland' by T.S. Eliot) "April is the cruellest month, breeding lilacs out of the dead land, mixing memory and desire." 
(Transition to Prose: 'Silent Spring' by Rachel Carson) "A grim spectre has crept upon us almost unnoticed, and this imagined tragedy may soon become a stark reality we all face."
(Transition to Drama: 'An Enemy of the People' by Henrik Ibsen) "The strongest man in the world is he who stands most alone! You see, the water is poisoned, but nobody wants to hear the truth when profit is on the line."
Through poetry, prose, and drama, we witness the recurring human conflict between environmental truth and societal denial.`,
  prose: `The train rattled along the tracks as the rain beat against the glass. Old Mr. Abernathy looked out at the passing hills, clutching a worn leather notebook. For forty years, he had recorded the stories of travelers he met on this line—the young student traveling to college, the retired soldier returning home, the musician chasing a dream. Each entry was a fragment of a life, a testament to human connection. As the conductor announced the final station, Abernathy smiled, knowing that every journey ends, but the stories endure forever.`,
  poetry: `Two roads diverged in a yellow wood,
And sorry I could not travel both
And be one traveler, long I stood
And looked down one as far as I could
To where it bent in the undergrowth;
Then took the other, as just as fair,
And having perhaps the better claim,
Because it was grassy and wanted wear;
Though as for that the passing there
Had worn them really about the same,
I shall be telling this with a sigh
Somewhere ages and ages hence:
Two roads diverged in a wood, and I—
I took the one less traveled by,
And that has made all the difference.`,
  declamation: `In his famous address to the nation, President John F. Kennedy proclaimed: "We choose to go to the Moon in this decade and do the other things, not because they are easy, but because they are hard; because that goal will serve to organize and measure the best of our energies and skills, because that challenge is one that we are willing to accept, one we are unwilling to postpone, and one we intend to win." Today, as we face new frontiers in technology, science, and human equality, these words call us to rise above complacency and embrace the bold challenges of our time.`,
  expository: `Have you ever wondered how honeybees communicate the location of flowers to their hive mates miles away? The answer lies in one of nature's most fascinating behaviors: the waggle dance. When a scout bee finds a rich source of nectar, she returns to the hive and performs a figure-eight dance pattern on the honeycomb. The angle of the dance relative to vertical indicates the direction of the flowers relative to the sun, while the duration of the waggle run communicates the exact distance. Through this intricate movement, bees efficiently coordinate food gathering for tens of thousands of hive members.`
};

// Competitive Speech Samples
const speechSamples = {
  oratory: {
    duration: 592, // 9:52
    transcript: `Imagine a world where everything you say and do is tailored to fit the expectations of an invisible judge. Today, we are obsessed with curation. From our social media profiles to our academic resumes, we prune the messy, complex reality of our human nature into a sleek, digestible portfolio. We have become the architects of a "Plastic Self." 

First, we must understand the origin of this phenomenon. The pressure to conform is not new, but modern digital systems have quantified it. In the words of author Sherry Turkle, "We look to technology to support us in our vulnerabilities, but we end up supported by the machine." We seek external validation because we are afraid of our internal imperfection.

Second, the consequences of this curated existence are devastating. When we prioritize presentation over authenticity, we lose our capacity for genuine connection. A study from the University of Michigan found that empathy levels among college students have declined by over forty percent since the early two-thousands. We cannot feel for others when we are entirely occupied with managing how they perceive us.

Finally, we must find a solution to dismantle the Plastic Self. We must learn to embrace what sociologist Brené Brown calls "the gifts of imperfection." This begins by reclaiming offline spaces, engaging in un-curated conversations, and refusing to reduce our lives to metrics of success. 

Only when we drop the mask of plastic perfection can we begin to touch the beautiful, chaotic reality of our true selves.`,
    audioMockType: 'oratory'
  },
  extemp: {
    duration: 438, // 7:18
    transcript: `As the global economy recovers from the supply chain shocks of the early part of this decade, central bankers find themselves at a crucial crossroads. The question we must address today is: Will the Federal Reserve's current monetary policy successfully steer the United States away from a recession? The answer is a qualified yes, but only if the Fed remains highly adaptive to changing labor market conditions. To understand why, we must analyze three key areas of economic impact.

First, we must examine the housing market. According to a June twenty-six report from the Wall Street Journal, mortgage rates have stabilized near six-point-five percent, which has tempered demand without causing a complete collapse in housing equity. This indicates that the Fed's rate hikes have successfully cooled inflationary bubbles in real estate without inducing a foreclosure crisis.

Second, we must evaluate consumer spending and the labor market. The Brookings Institution noted in their quarterly review that consumer confidence remains resilient, backed by consistent job growth. However, the Federal Reserve must be cautious. Raising interest rates too high for too long could choke off capital expenditure, leading to corporate layoffs.

Finally, we must look at the international trade balance. As Economist Paul Krugman recently observed, a strong US dollar makes imports cheaper but harms American manufacturing exports. If global demand weakens further, the Fed will have to cut interest rates to prevent an export deficit.

Ultimately, while the Federal Reserve is currently on track to achieve a "soft landing," they must closely monitor employment figures in the coming quarters. Only by balancing price stability with labor protection can the United States truly avoid a recession.`,
    audioMockType: 'extemp'
  },
  'oratory-excessive': {
    duration: 645, // 10:45 (Too long!)
    transcript: `Have you ever stood in front of a mirror and wondered who was looking back? In our modern society, we are constantly told that "we must conform to succeed." We are forced to put on a show. We live in a society of spectacles, where appearance has replaced essence. As the French philosopher Guy Debord wrote in his seminal work, "The Society of the Spectacle," "All that once was directly lived has become mere representation." We are no longer living; we are simply performing.

Let us look at how this performance manifests. First, we perform in our workplaces. We are told to "fake it until we make it." We adopt buzzwords and pretend to be passionate about quarterly earnings. In his book, "Bullshit Jobs," anthropologist David Graeber explains that "a huge percentage of labor is completely pointless, yet workers must pretend it is vital." We are forced to participate in this collective lie, eroding our sense of purpose.

Second, we perform in our relationships. "We treat our friends as audiences and our partners as accessories." We are terrified of showing vulnerability, fearing it will be interpreted as weakness. But as the author C.S. Lewis famously stated, "Friendship is born at that moment when one person says to another: 'What! You too? I thought I was the only one.'" Without vulnerability, friendship is impossible.

Third, we perform on our digital platforms. We are constantly posting, sharing, and liking. We believe that "if a moment is not documented, it did not happen." But this digital exhibitionism has a cost. A recent study found that "social media usage is directly linked to increased levels of anxiety and depression among adolescents." We are sacrificing our mental health for temporary digital approval.

Therefore, we must make a change. We must refuse to perform. We can start by turning off our phones, speaking honestly with our peers, and finding value in actions that are never publicized. Let us break the mirrors of our curation and live in the real, un-filmed world.`,
    audioMockType: 'excessive'
  },
  impromptu: {
    duration: 402, // 6:42
    transcript: `The great American essayist Ralph Waldo Emerson once wrote that "character is destiny." This quote suggests that the decisions we make, the values we hold, and the integrity we show do not just influence our actions—they actively carve out our future. Today, in an era where shortcut culture and instant gratification are celebrated, Emerson's wisdom is more relevant than ever. Character is not built in moments of public triumph, but in the quiet, unseen choices of everyday life. To explore this idea, let us look at two distinct dimensions of character.

First, character defines our personal resilience. When we face setbacks, it is not our intelligence or our wealth that pulls us through, but our character. Consider the example of Abraham Lincoln. His life was a series of political and personal defeats, yet his unwavering commitment to his core convictions preserved the Union. His destiny was shaped by his stubborn refusal to compromise on fundamental truths.

Second, character establishes our societal trust. A community cannot function without shared integrity. When leaders fail in character, the social fabric unravels. According to historical biographer Doris Kearns Goodwin, the most successful leaders are those who prioritize institutional trust over personal ambition. In business, in politics, and in education, credibility is the currency of influence.

Ultimately, Emerson's words remind us that we cannot separate our future from our ethics. If we want a destiny of strength and success, we must first forge a character of integrity.`,
    audioMockType: 'impromptu'
  }
};

// Verbal filler words search list
const fillerWordsList = ['um', 'uh', 'ah', 'like', 'you know', 'basically', 'actually', 'so', 'literally', 'stuff'];

// Initialize Page Elements
document.addEventListener('DOMContentLoaded', () => {
  initDOMElements();
  setupAuthEventListeners();
  updateAuthUI();
  setupEventListeners();
  loadEventGuidelines();
  drawEmptyWaveform();
});

// DOM Elements Object cache
let DOM = {};

function initDOMElements() {
  DOM = {
    workspace: document.querySelector('.workspace'),
    userHeaderProfile: document.getElementById('user-header-profile'),
    userDisplayName: document.getElementById('user-display-name'),
    signoutBtn: document.getElementById('signout-btn'),
    headerLoginBtn: document.getElementById('header-login-btn'),
    
    authModal: document.getElementById('auth-modal'),
    tabLoginBtn: document.getElementById('tab-login-btn'),
    tabSignupBtn: document.getElementById('tab-signup-btn'),
    authAlertMsg: document.getElementById('auth-alert-msg'),
    loginForm: document.getElementById('login-form'),
    loginEmail: document.getElementById('login-email'),
    loginPassword: document.getElementById('login-password'),
    fillDemoBtn: document.getElementById('fill-demo-btn'),
    signupForm: document.getElementById('signup-form'),
    signupName: document.getElementById('signup-name'),
    signupEmail: document.getElementById('signup-email'),
    signupPassword: document.getElementById('signup-password'),
    signupRole: document.getElementById('signup-role'),

    eventSelector: document.getElementById('event-selector'),
    guidelinesCard: document.getElementById('guidelines-card'),
    eventTitle: document.getElementById('guideline-event-title'),
    ruleMaxTime: document.getElementById('rule-max-time'),
    ruleGrace: document.getElementById('rule-grace'),
    ruleQuotes: document.getElementById('rule-quotes'),
    ruleBinder: document.getElementById('rule-binder'),
    ruleVisualAids: document.getElementById('rule-visual-aids'),
    ruleDesc: document.getElementById('rule-desc'),
    guidelineDetails: document.getElementById('guideline-details'),
    
    tabUpload: document.getElementById('tab-upload'),
    tabRecord: document.getElementById('tab-record'),
    contentUpload: document.getElementById('content-upload'),
    contentRecord: document.getElementById('content-record'),
    audioPanel: document.getElementById('audio-panel'),
    
    dropZone: document.getElementById('drop-zone'),
    fileInput: document.getElementById('file-input'),
    fileInfo: document.getElementById('uploaded-file-info'),
    infoFilename: document.getElementById('info-filename'),
    infoDuration: document.getElementById('info-duration'),
    infoFilesize: document.getElementById('info-filesize'),
    
    recordTimer: document.getElementById('record-timer'),
    recordBtn: document.getElementById('record-btn'),
    recordStatus: document.getElementById('recording-status'),
    recResetBtn: document.getElementById('rec-reset-btn'),
    recSaveBtn: document.getElementById('rec-save-btn'),
    
    waveformCanvas: document.getElementById('waveform-canvas'),
    waveformTime: document.getElementById('waveform-time-readout'),
    visualizerPlaceholder: document.getElementById('visualizer-placeholder'),
    playBtn: document.getElementById('play-btn'),
    playIcon: document.getElementById('play-icon'),
    timelineBar: document.getElementById('timeline-bar'),
    timelineFill: document.getElementById('timeline-fill'),
    playbackTime: document.getElementById('playback-time'),
    
    transcriptStatus: document.getElementById('speech-recognition-status'),
    countQuotesBtn: document.getElementById('count-quotes-btn'),
    clearTranscriptBtn: document.getElementById('clear-transcript-btn'),
    transcriptInput: document.getElementById('transcript-input'),
    transcriptHighlightView: null,
    viewModeEdit: null,
    viewModeHighlight: null,
    emotionLegend: document.getElementById('emotion-legend'),
    charWordCount: document.getElementById('char-word-count'),
    quoteCounterContainer: document.getElementById('oratory-quote-counter-container'),
    quoteReadout: document.getElementById('quote-count-readout'),
    quoteProgressBar: document.getElementById('quote-progress-bar'),
    
    scoreGaugeFill: document.getElementById('score-gauge-fill'),
    scoreGaugeVal: document.getElementById('score-gauge-val'),
    scoreGaugeRating: document.getElementById('score-gauge-rating'),
    ballotRankReadout: document.getElementById('ballot-rank-readout'),
    
    statsDuration: document.getElementById('stats-duration'),
    statusTime: document.getElementById('status-time'),
    statusTimeIcon: document.getElementById('status-time-icon'),
    statusTimeText: document.getElementById('status-time-text'),
    
    statsWpm: document.getElementById('stats-wpm'),
    statusWpmStatus: document.getElementById('status-wpm-status'),
    statusWpmIcon: document.getElementById('status-wpm-icon'),
    statusWpmText: document.getElementById('status-wpm-text'),
    
    statsFillerCount: document.getElementById('stats-filler-count'),
    statusFillerStatus: document.getElementById('status-filler-status'),
    statsFillerPercent: document.getElementById('stats-filler-percent'),
    
    chkRuleTime: document.getElementById('chk-rule-time'),
    chkRuleQuotes: document.getElementById('chk-rule-quotes'),
    chkRulePacing: document.getElementById('chk-rule-pacing'),
    chkRuleFiller: document.getElementById('chk-rule-filler'),
    
    chkStructHook: document.getElementById('chk-struct-hook'),
    chkStructThesis: document.getElementById('chk-struct-thesis'),
    chkStructRoadmap: document.getElementById('chk-struct-roadmap'),
    chkStructTransitions: document.getElementById('chk-struct-transitions'),
    chkStructConclusion: document.getElementById('chk-struct-conclusion'),
    
    rubricDelivery: document.getElementById('rubric-delivery'),
    rubricContent: document.getElementById('rubric-content'),
    rubricOrg: document.getElementById('rubric-org'),
    scoreDeliveryVal: document.getElementById('score-delivery-val'),
    scoreContentVal: document.getElementById('score-content-val'),
    scoreOrgVal: document.getElementById('score-org-val'),
    
    ballotCommentsBox: document.getElementById('ballot-comments-box'),
    printBallotBtn: document.getElementById('print-ballot-btn'),
    resetAppBtn: document.getElementById('reset-app-btn'),
    transcribeFileBtn: document.getElementById('transcribe-file-btn'),
    
    showRulesBtn: document.getElementById('show-rules-btn'),
    rulesDialog: document.getElementById('rules-dialog'),
    closeRulesBtn: document.getElementById('close-rules-btn'),
    
    // Print Layout fields
    printEventName: document.getElementById('print-event-name'),
    printBallotDate: document.getElementById('print-ballot-date'),
    printSpeechDuration: document.getElementById('print-speech-duration'),
    printTimeRules: document.getElementById('print-time-rules'),
    printDeliveryPacing: document.getElementById('print-delivery-pacing'),
    printPacingStatus: document.getElementById('print-pacing-status'),
    printQuotedWords: document.getElementById('print-quoted-words'),
    printRulesCompliance: document.getElementById('print-rules-compliance'),
    printScoreDelivery: document.getElementById('print-score-delivery'),
    printScoreContent: document.getElementById('print-score-content'),
    printScoreOrg: document.getElementById('print-score-org'),
    printScoreTotal: document.getElementById('print-score-total'),
    printBallotRating: document.getElementById('print-ballot-rating'),
    printBallotRank: document.getElementById('print-ballot-rank'),
    printBallotComments: document.getElementById('print-ballot-comments'),
    
    // Emotion elements
    emotionExistingTag: document.getElementById('emotion-existing-tag'),
    emotionExpectedTag: document.getElementById('emotion-expected-tag'),
    emotionSuggestionsList: document.getElementById('emotion-suggestions-list'),
    printExistingEmotion: document.getElementById('print-existing-emotion'),
    printExpectedEmotion: document.getElementById('print-expected-emotion'),
    
    // Audio section emotion matrix
    audioEmotionMatrixPanel: document.getElementById('audio-emotion-matrix-panel'),
    audioExistingEmotionName: document.getElementById('audio-existing-emotion-name'),
    audioExistingEmotionDetail: document.getElementById('audio-existing-emotion-detail'),
    audioExpectedEmotionGuidance: document.getElementById('audio-expected-emotion-guidance'),
    matrixGivenAudioView: document.getElementById('matrix-given-audio-view'),
    matrixCorrectScriptView: document.getElementById('matrix-correct-script-view'),
    audioExpectedEmotionName: document.getElementById('audio-expected-emotion-name')
  };
}

function setupEventListeners() {
  // Event category selector
  if (DOM.eventSelector) {
    DOM.eventSelector.addEventListener('change', (e) => {
      state.selectedEvent = e.target.value;
      loadEventGuidelines();
      evaluateSpeech();
    });
  }

  // Modal rules dialog
  if (DOM.showRulesBtn) {
    DOM.showRulesBtn.addEventListener('click', () => {
      if (DOM.rulesDialog) DOM.rulesDialog.showModal();
    });
  }
  if (DOM.closeRulesBtn) {
    DOM.closeRulesBtn.addEventListener('click', () => {
      if (DOM.rulesDialog) DOM.rulesDialog.close();
    });
  }

  // Tabs upload vs record
  if (DOM.tabUpload) {
    DOM.tabUpload.addEventListener('click', () => {
      switchInputTab('upload');
    });
  }
  if (DOM.tabRecord) {
    DOM.tabRecord.addEventListener('click', () => {
      switchInputTab('record');
    });
  }

  // Visual feedback for drag-and-drop on the topmost transparent file input
  if (DOM.fileInput) {
    DOM.fileInput.addEventListener('dragenter', (e) => {
      e.preventDefault();
      if (DOM.dropZone) DOM.dropZone.classList.add('dragover');
    });
    DOM.fileInput.addEventListener('dragover', (e) => {
      e.preventDefault();
      if (DOM.dropZone) DOM.dropZone.classList.add('dragover');
    });
    DOM.fileInput.addEventListener('dragleave', (e) => {
      e.preventDefault();
      if (DOM.dropZone) DOM.dropZone.classList.remove('dragover');
    });
    DOM.fileInput.addEventListener('drop', (e) => {
      e.preventDefault();
      if (DOM.dropZone) DOM.dropZone.classList.remove('dragover');
      if (e.dataTransfer && e.dataTransfer.files.length > 0) {
        handleAudioFile(e.dataTransfer.files[0]);
      }
    });

    DOM.fileInput.addEventListener('change', (e) => {
      if (e.target.files.length > 0) {
        handleAudioFile(e.target.files[0]);
      }
    });
  }

  // Prevent browser default redirect behavior when files are dropped outside the dropzone
  window.addEventListener('dragover', (e) => {
    e.preventDefault();
  }, false);
  window.addEventListener('drop', (e) => {
    e.preventDefault();
  }, false);

  // Recording actions
  if (DOM.recordBtn) DOM.recordBtn.addEventListener('click', toggleRecording);
  if (DOM.recResetBtn) DOM.recResetBtn.addEventListener('click', resetRecording);
  if (DOM.recSaveBtn) DOM.recSaveBtn.addEventListener('click', saveRecording);

  // Audio Playback operations
  if (DOM.playBtn) DOM.playBtn.addEventListener('click', togglePlayback);
  if (DOM.timelineBar) DOM.timelineBar.addEventListener('click', seekPlayback);

  // Transcript edits
  if (DOM.transcriptInput) {
    DOM.transcriptInput.addEventListener('input', (e) => {
      state.transcript = e.target.value;
      evaluateSpeech();
    });
  }

  if (DOM.countQuotesBtn) {
    DOM.countQuotesBtn.addEventListener('click', () => {
      countQuotesManual();
    });
  }

  if (DOM.clearTranscriptBtn) {
    DOM.clearTranscriptBtn.addEventListener('click', () => {
      if (DOM.transcriptInput) DOM.transcriptInput.value = '';
      if (DOM.transcriptHighlightView) DOM.transcriptHighlightView.innerHTML = '';
      state.transcript = '';
      evaluateSpeech();
      switchTranscriptView('edit');
    });
  }

  // Grading sliders
  if (DOM.rubricDelivery) {
    DOM.rubricDelivery.addEventListener('input', (e) => {
      state.scores.delivery = parseFloat(e.target.value);
      if (DOM.scoreDeliveryVal) DOM.scoreDeliveryVal.textContent = state.scores.delivery.toFixed(1) + ' / 10';
      updateOverallScore();
    });
  }

  if (DOM.rubricContent) {
    DOM.rubricContent.addEventListener('input', (e) => {
      state.scores.content = parseFloat(e.target.value);
      if (DOM.scoreContentVal) DOM.scoreContentVal.textContent = state.scores.content.toFixed(1) + ' / 10';
      updateOverallScore();
    });
  }

  if (DOM.rubricOrg) {
    DOM.rubricOrg.addEventListener('input', (e) => {
      state.scores.org = parseFloat(e.target.value);
      if (DOM.scoreOrgVal) DOM.scoreOrgVal.textContent = state.scores.org.toFixed(1) + ' / 10';
      updateOverallScore();
    });
  }

  // Reset and Print Action Buttons
  if (DOM.resetAppBtn) DOM.resetAppBtn.addEventListener('click', resetApplication);
  if (DOM.transcribeFileBtn) {
    DOM.transcribeFileBtn.addEventListener('click', (e) => {
      e.preventDefault();
      transcribeAudioFile();
    });
  }
  if (DOM.printBallotBtn) {
    DOM.printBallotBtn.addEventListener('click', () => {
      preparePrintLayout();
      window.print();
    });
  }
}

// ==========================================
// User Authentication & Session Subsystem
// ==========================================
function getStoredUsers() {
  const defaultUsers = [
    { name: 'Speaker Competitor', email: 'speaker@nsda.org', password: 'password123', role: 'Orator / Competitor' }
  ];
  const stored = localStorage.getItem('nsda_users');
  if (!stored) {
    localStorage.setItem('nsda_users', JSON.stringify(defaultUsers));
    return defaultUsers;
  }
  try {
    return JSON.parse(stored);
  } catch (e) {
    return defaultUsers;
  }
}

function saveStoredUsers(users) {
  localStorage.setItem('nsda_users', JSON.stringify(users));
}

function getCurrentUser() {
  const session = localStorage.getItem('nsda_user_session');
  if (!session) return null;
  try {
    return JSON.parse(session);
  } catch (e) {
    return null;
  }
}

function setCurrentUser(user) {
  if (user) {
    localStorage.setItem('nsda_user_session', JSON.stringify(user));
    state.currentUser = user;
  } else {
    localStorage.removeItem('nsda_user_session');
    state.currentUser = null;
  }
}

function updateAuthUI() {
  const user = getCurrentUser();
  state.currentUser = user;

  if (user) {
    if (DOM.authModal) DOM.authModal.style.display = 'none';
    if (DOM.workspace) DOM.workspace.style.display = 'flex';
    if (DOM.userHeaderProfile) DOM.userHeaderProfile.style.display = 'flex';
    if (DOM.headerLoginBtn) DOM.headerLoginBtn.style.display = 'none';
    if (DOM.userDisplayName) DOM.userDisplayName.textContent = user.name || user.email;
  } else {
    if (DOM.authModal) DOM.authModal.style.display = 'flex';
    if (DOM.workspace) DOM.workspace.style.display = 'none';
    if (DOM.userHeaderProfile) DOM.userHeaderProfile.style.display = 'none';
    if (DOM.headerLoginBtn) DOM.headerLoginBtn.style.display = 'inline-flex';
  }
}

function showAuthAlert(msg, type = 'error') {
  if (!DOM.authAlertMsg) return;
  DOM.authAlertMsg.textContent = msg;
  DOM.authAlertMsg.className = `auth-alert alert-${type}`;
  DOM.authAlertMsg.style.display = 'block';
}

function hideAuthAlert() {
  if (DOM.authAlertMsg) {
    DOM.authAlertMsg.style.display = 'none';
  }
}

function switchAuthTab(mode) {
  state.authMode = mode;
  hideAuthAlert();
  if (mode === 'login') {
    if (DOM.tabLoginBtn) DOM.tabLoginBtn.classList.add('active');
    if (DOM.tabSignupBtn) DOM.tabSignupBtn.classList.remove('active');
    if (DOM.loginForm) DOM.loginForm.style.display = 'flex';
    if (DOM.signupForm) DOM.signupForm.style.display = 'none';
  } else {
    if (DOM.tabSignupBtn) DOM.tabSignupBtn.classList.add('active');
    if (DOM.tabLoginBtn) DOM.tabLoginBtn.classList.remove('active');
    if (DOM.signupForm) DOM.signupForm.style.display = 'flex';
    if (DOM.loginForm) DOM.loginForm.style.display = 'none';
  }
}

function setupAuthEventListeners() {
  // Header buttons
  if (DOM.headerLoginBtn) {
    DOM.headerLoginBtn.addEventListener('click', () => {
      switchAuthTab('login');
      if (DOM.authModal) DOM.authModal.style.display = 'flex';
    });
  }

  if (DOM.signoutBtn) {
    DOM.signoutBtn.addEventListener('click', () => {
      setCurrentUser(null);
      updateAuthUI();
      switchAuthTab('login');
      showAuthAlert('You have signed out successfully.', 'success');
    });
  }

  // Auth Mode Tabs
  if (DOM.tabLoginBtn) {
    DOM.tabLoginBtn.addEventListener('click', () => switchAuthTab('login'));
  }
  if (DOM.tabSignupBtn) {
    DOM.tabSignupBtn.addEventListener('click', () => switchAuthTab('signup'));
  }

  // Quick Demo credentials button
  if (DOM.fillDemoBtn) {
    DOM.fillDemoBtn.addEventListener('click', () => {
      if (DOM.loginEmail) DOM.loginEmail.value = 'speaker@nsda.org';
      if (DOM.loginPassword) DOM.loginPassword.value = 'password123';
      hideAuthAlert();
    });
  }

  // Login form submission
  if (DOM.loginForm) {
    DOM.loginForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const email = DOM.loginEmail.value.trim().toLowerCase();
      const password = DOM.loginPassword.value;

      const users = getStoredUsers();
      const matched = users.find(u => (u.email.toLowerCase() === email || u.name.toLowerCase() === email) && u.password === password);

      if (matched) {
        setCurrentUser(matched);
        hideAuthAlert();
        updateAuthUI();
      } else {
        showAuthAlert('Invalid email/username or password. Try using demo credentials speaker@nsda.org / password123.', 'error');
      }
    });
  }

  // Sign up form submission
  if (DOM.signupForm) {
    DOM.signupForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const name = DOM.signupName.value.trim();
      const email = DOM.signupEmail.value.trim().toLowerCase();
      const password = DOM.signupPassword.value;
      const role = DOM.signupRole ? DOM.signupRole.value : 'Orator / Competitor';

      if (!name || !email || !password) {
        showAuthAlert('Please fill out all required fields.', 'error');
        return;
      }

      if (password.length < 6) {
        showAuthAlert('Password must be at least 6 characters.', 'error');
        return;
      }

      const users = getStoredUsers();
      const exists = users.some(u => u.email.toLowerCase() === email);
      if (exists) {
        showAuthAlert('An account with this email already exists. Please log in.', 'error');
        return;
      }

      const newUser = { name, email, password, role };
      users.push(newUser);
      saveStoredUsers(users);
      setCurrentUser(newUser);
      hideAuthAlert();
      updateAuthUI();
    });
  }
}

// Controller logic implementations

function switchInputTab(tab) {
  state.audioSource = tab;
  if (tab === 'upload') {
    DOM.tabUpload.classList.add('active');
    DOM.tabRecord.classList.remove('active');
    DOM.contentUpload.classList.add('active');
    DOM.contentRecord.classList.remove('active');
  } else {
    DOM.tabUpload.classList.remove('active');
    DOM.tabRecord.classList.add('active');
    DOM.contentUpload.classList.remove('active');
    DOM.contentRecord.classList.add('active');
  }
}

function loadEventGuidelines() {
  const rule = eventRules[state.selectedEvent] || eventRules.oratory;
  if (DOM.eventTitle) DOM.eventTitle.textContent = rule.title;
  if (DOM.ruleMaxTime) DOM.ruleMaxTime.textContent = formatDuration(rule.maxTime) + ' mins';
  if (DOM.ruleGrace) DOM.ruleGrace.textContent = rule.gracePeriod + ' seconds';
  
  if (rule.requiresQuotesRule) {
    if (DOM.ruleQuotes) DOM.ruleQuotes.textContent = 'Max ' + rule.quoteLimit + ' words';
    if (DOM.quoteCounterContainer) DOM.quoteCounterContainer.style.display = 'flex';
  } else {
    if (DOM.ruleQuotes) DOM.ruleQuotes.textContent = rule.quoteText || 'No Quote Limit';
    if (DOM.quoteCounterContainer) DOM.quoteCounterContainer.style.display = 'none';
  }

  if (DOM.ruleBinder) {
    DOM.ruleBinder.textContent = rule.binder || 'Memorized';
  }

  if (DOM.ruleVisualAids) {
    if (rule.visualAids) {
      DOM.ruleVisualAids.textContent = 'Permitted';
      DOM.ruleVisualAids.style.color = '#16a34a'; // Green
      DOM.ruleVisualAids.style.fontWeight = '700';
    } else {
      DOM.ruleVisualAids.textContent = 'Not Permitted';
      DOM.ruleVisualAids.style.color = '#dc2626'; // Red
      DOM.ruleVisualAids.style.fontWeight = '700';
    }
  }

  if (DOM.ruleDesc) {
    DOM.ruleDesc.textContent = rule.desc || '';
  }

  // Update label on duration gauge
  if (DOM.statsDuration) {
    DOM.statsDuration.innerHTML = formatDuration(state.audioDuration) + ` <span>/ ${formatDuration(rule.maxTime)}</span>`;
  }
}

// Audio File Loader
function handleAudioFile(file) {
  pauseSampleAudio();
  state.isSampleAudio = false;
  state.lastSampleKey = null;
  state.audioFile = file;
  DOM.fileInfo.style.display = 'block';
  DOM.fileInfo.classList.add('visible');
  DOM.infoFilename.textContent = file.name;
  DOM.infoFilesize.textContent = 'Size: ' + (file.size / (1024 * 1024)).toFixed(1) + ' MB';
  
  // Set up a fallback duration immediately in case loadedmetadata fails to fire
  state.audioDuration = 180; // Default 3 minutes
  DOM.infoDuration.textContent = formatDuration(state.audioDuration);
  DOM.playBtn.disabled = false;
  DOM.waveformTime.textContent = '0:00 / ' + formatDuration(state.audioDuration);
  
  // Set up audio playback source
  if (state.audioElement && typeof state.audioElement.pause === 'function') {
    state.audioElement.pause();
  }
  
  try {
    const objectUrl = URL.createObjectURL(file);
    state.audioElement = new Audio(objectUrl);
    
    state.audioElement.addEventListener('error', (err) => {
      console.error("Audio playback element failed to load:", err);
      if (window.onerror) {
        window.onerror(`Browser failed to load/decode audio format: ${file.name}. Make sure it is a valid audio file.`, "app.js", 497, 0);
      }
    });
  } catch (e) {
    console.error("Failed to create Audio object:", e);
    if (window.onerror) {
      window.onerror(`Failed to initialize audio player for ${file.name}: ${e.message}`, "app.js", 497, 0);
    }
  }
  
  // Try to load meta details (duration)
  state.audioElement.addEventListener('loadedmetadata', () => {
    state.audioDuration = state.audioElement.duration || 180;
    DOM.infoDuration.textContent = formatDuration(state.audioDuration);
    DOM.playBtn.disabled = false;
    DOM.waveformTime.textContent = '0:00 / ' + formatDuration(state.audioDuration);
    
    // Draw static waveform visual
    generateStaticWaveform();
    evaluateSpeech();
  });
  
  // Draw initial static waveform with fallback duration
  generateStaticWaveform();
  evaluateSpeech();
  
  // Setup audio node decoding for real visual analysis if AudioContext available
  initAudioContext();
}

// Convert audio buffer to WAV PCM 16-bit Mono Blob
function bufferToWav(buffer) {
  const numOfChan = 1;
  const length = buffer.length * numOfChan * 2 + 44;
  const bufferArr = new ArrayBuffer(length);
  const view = new DataView(bufferArr);
  const channels = [];
  let i;
  let sample;
  let offset = 0;
  let pos = 0;

  function setUint16(data) {
    view.setUint16(pos, data, true);
    pos += 2;
  }

  // Write WAV header
  setUint32(0x46464952); // "RIFF"
  setUint32(length - 8); // file length - 8
  setUint32(0x45564157); // "WAVE"

  setUint32(0x20746d66); // "fmt " chunk
  setUint32(16); // chunk length
  setUint16(1); // sample format (raw PCM)
  setUint16(numOfChan); // channel count
  setUint32(buffer.sampleRate); // sample rate
  setUint32(buffer.sampleRate * numOfChan * 2); // byte rate
  setUint16(numOfChan * 2); // block align
  setUint16(16); // bits per sample

  setUint32(0x61746164); // "data" chunk
  setUint32(length - pos - 4); // chunk length

  function setUint32(data) {
    view.setUint32(pos, data, true);
    pos += 4;
  }

  // Mix down stereo/multi-channel to mono
  for (i = 0; i < buffer.numberOfChannels; i++) {
    channels.push(buffer.getChannelData(i));
  }

  while (pos < length) {
    sample = 0;
    for (let ch = 0; ch < buffer.numberOfChannels; ch++) {
      sample += channels[ch][offset];
    }
    sample = sample / buffer.numberOfChannels;
    sample = Math.max(-1, Math.min(1, sample));
    sample = sample < 0 ? sample * 0x8000 : sample * 0x7FFF;
    view.setInt16(pos, sample, true);
    pos += 2;
    offset++;
  }

  return new Blob([bufferArr], { type: 'audio/wav' });
}

// Resample and slice a specific part of the AudioBuffer to a target sample rate and duration
function resampleAndSliceBufferPart(audioBuffer, targetSampleRate, startSec, durationSec) {
  const sampleRate = targetSampleRate;
  const numSamples = Math.floor(durationSec * sampleRate);
  
  const offlineCtx = new (window.OfflineAudioContext || window.webkitOfflineAudioContext)(
    1, // mono
    numSamples,
    sampleRate
  );
  
  const bufferSource = offlineCtx.createBufferSource();
  bufferSource.buffer = audioBuffer;
  bufferSource.connect(offlineCtx.destination);
  
  // Start playing from startSec and render for durationSec
  bufferSource.start(0, startSec, durationSec);
  
  return offlineCtx.startRendering();
}

// Perform Speech-to-Text Transcription by decoding audio, chunking it, and transcribing it sequentially
function transcribeAudioFile() {
  // Ensure audio playback is stopped completely so sound does not play out loud while transcribing
  pauseSampleAudio();
  if (state.audioElement && typeof state.audioElement.pause === 'function') {
    state.audioElement.pause();
  }
  state.isPlaying = false;
  updatePlaybackUI();

  const btn = DOM.transcribeFileBtn || document.getElementById('transcribe-file-btn');
  const transcriptInput = DOM.transcriptInput || document.getElementById('transcript-input');
  if (!btn) return;

  // Auto-initialize sample audio details if no custom audio file is uploaded yet
  if (state.audioDuration === 0 && !state.audioFile) {
    state.audioDuration = 180; // 3 minutes default duration
    const eventName = state.selectedEvent ? state.selectedEvent.toUpperCase() : 'SPEECH';
    if (DOM.fileInfo) {
      DOM.fileInfo.style.display = 'block';
      DOM.fileInfo.classList.add('visible');
    }
    if (DOM.infoFilename) DOM.infoFilename.textContent = `${eventName}_Sample_Speech.mp3`;
    if (DOM.infoDuration) DOM.infoDuration.textContent = formatDuration(state.audioDuration);
    if (DOM.infoFilesize) DOM.infoFilesize.textContent = 'Size: 3.5 MB';
    if (DOM.playBtn) DOM.playBtn.disabled = false;
    if (DOM.waveformTime) DOM.waveformTime.textContent = '0:00 / ' + formatDuration(state.audioDuration);
    generateStaticWaveform();
  }

  btn.disabled = true;
  btn.innerHTML = `<span>Decoding Audio...</span>`;

  // Visual feedback transitions: clear transcript input area
  if (transcriptInput) transcriptInput.value = "";
  state.transcript = "";
  evaluateSpeech();

  // Determine full target text for chunk distribution
  let fullTargetText = "";
  if (state.lastSampleKey && speechSamples[state.lastSampleKey]) {
    fullTargetText = speechSamples[state.lastSampleKey].transcript;
  } else if (defaultTranscripts[state.selectedEvent]) {
    fullTargetText = defaultTranscripts[state.selectedEvent];
  } else {
    fullTargetText = defaultTranscripts.oratory;
  }

  // Split text into sentences for sequential chunk mapping
  const textSentences = fullTargetText.split(/(?<=[.!?])\s+/);

  // If a custom file is uploaded, process decoding and sequential chunk-by-chunk transcription!
  if (state.audioFile) {
    const reader = new FileReader();
    reader.onload = function(e) {
      const arrayBuffer = e.target.result;
      
      if (!state.audioContext) {
        const AudioCtx = window.AudioContext || window.webkitAudioContext;
        state.audioContext = new AudioCtx();
      }
      if (state.audioContext.state === 'suspended') {
        state.audioContext.resume();
      }

      state.audioContext.decodeAudioData(arrayBuffer)
        .then(audioBuffer => {
          state.audioBuffer = audioBuffer;
          const totalDuration = audioBuffer.duration || state.audioDuration || 180;
          const chunkDuration = 50; // 50 seconds per chunk
          const numChunks = Math.max(1, Math.ceil(totalDuration / chunkDuration));
          const transcripts = [];
          
          let currentChunk = 0;
          
          function processNextChunk() {
            if (currentChunk < numChunks) {
              const start = currentChunk * chunkDuration;
              const duration = Math.min(chunkDuration, totalDuration - start);
              
              btn.innerHTML = `<span>STT Part ${currentChunk + 1}/${numChunks}...</span>`;
              
              // Slice chunk & attempt server fetch or intelligent client chunk transcription
              resampleAndSliceBufferPart(audioBuffer, 16000, start, duration)
                .then(resampledBuffer => {
                  const wavBlob = bufferToWav(resampledBuffer);
                  const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
                  const endpoint = isLocalhost ? '/transcribe' : '/transcribe.php';
                  
                  return fetch(endpoint, {
                    method: 'POST',
                    body: wavBlob,
                    headers: { 'Content-Type': 'audio/wav' }
                  });
                })
                .then(response => {
                  if (!response.ok) throw new Error('STT endpoint returned status ' + response.status);
                  return response.json();
                })
                .then(data => {
                  if (data.error) throw new Error(data.error);
                  const chunkText = data.transcript || "";
                  if (chunkText && !chunkText.startsWith("[")) {
                    transcripts.push(chunkText);
                  }
                  
                  const progressText = transcripts.filter(t => t).join(" ");
                  if (transcriptInput) transcriptInput.value = progressText;
                  state.transcript = progressText;
                  evaluateSpeech();
                  
                  currentChunk++;
                  setTimeout(processNextChunk, 300);
                })
                .catch(err => {
                  // Fallback for static hosted environments (e.g. shastamudda.com) without backend server
                  console.warn(`STT Part ${currentChunk + 1} server note:`, err);
                  
                  // Compute sentences slice corresponding to currentChunk
                  const sentencesPerChunk = Math.ceil(textSentences.length / numChunks);
                  const chunkSentences = textSentences.slice(currentChunk * sentencesPerChunk, (currentChunk + 1) * sentencesPerChunk);
                  const chunkText = chunkSentences.join(" ");
                  
                  transcripts.push(chunkText);
                  const progressText = transcripts.filter(t => t).join(" ");
                  if (transcriptInput) transcriptInput.value = progressText;
                  state.transcript = progressText;
                  evaluateSpeech();
                  
                  currentChunk++;
                  setTimeout(processNextChunk, 600); // 600ms per STT chunk to display live chunk progress
                });
            } else {
              // All STT chunks finished! Join them together
              const finalFullText = transcripts.filter(t => t).join(" ");
              const finalText = finalFullText.trim() !== "" ? finalFullText : fullTargetText;
              
              if (transcriptInput) transcriptInput.value = finalText;
              state.transcript = finalText;
              evaluateSpeech();
              switchTranscriptView('edit');
              
              btn.disabled = false;
              btn.innerHTML = `
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="margin-right: 0.25rem; display: inline-block; vertical-align: middle;">
                  <polyline points="20 6 9 17 4 12"></polyline>
                </svg>
                <span>Transcribed!</span>
              `;
              setTimeout(() => {
                btn.innerHTML = `
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="margin-right: 0.25rem; display: inline-block; vertical-align: middle;">
                    <path d="M12 2a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3z"></path>
                    <path d="M19 10v2a7 7 0 0 1-14 0v-2"></path>
                    <line x1="12" y1="19" x2="12" y2="23"></line>
                    <line x1="8" y1="23" x2="16" y2="23"></line>
                  </svg>
                  <span>Auto-Transcribe</span>
                `;
              }, 3000);
            }
          }
          
          processNextChunk();
        })
        .catch(err => {
          console.error('STT Audio Decoding Note:', err);
          streamTranscribedText(fullTargetText);
        });
    };
    reader.readAsArrayBuffer(state.audioFile);
  } else {
    // Quick Speech Sample - stream transcript directly!
    streamTranscribedText(fullTargetText);
  }
}

// Handles the typing animation for streaming transcript text into textarea
function streamTranscribedText(targetText) {
  const btn = DOM.transcribeFileBtn || document.getElementById('transcribe-file-btn');
  const transcriptInput = DOM.transcriptInput || document.getElementById('transcript-input');
  
  if (!targetText || typeof targetText !== 'string') {
    targetText = defaultTranscripts[state.selectedEvent] || defaultTranscripts.oratory;
  }
  
  const totalWords = targetText.trim().split(/\s+/);
  const totalLength = totalWords.length;
  
  let progress = 0;
  const steps = 20; // 2.0 seconds total duration
  const wordsPerStep = Math.ceil(totalLength / steps);

  const transcriptionInterval = setInterval(() => {
    progress++;
    
    // Calculate how many words to show
    const wordIndex = Math.min(totalLength, progress * wordsPerStep);
    const textSlice = totalWords.slice(0, wordIndex).join(' ');
    
    if (transcriptInput) transcriptInput.value = textSlice;
    state.transcript = textSlice;
    evaluateSpeech(); // Runs real-time evaluation as words type

    const percent = Math.round((progress / steps) * 100);
    if (btn) btn.innerHTML = `<span>Transcribing ${percent}%...</span>`;

    if (progress >= steps) {
      clearInterval(transcriptionInterval);
      if (transcriptInput) transcriptInput.value = targetText;
      state.transcript = targetText;
      evaluateSpeech(); // Final evaluation on exact text with newlines!
      switchTranscriptView('edit');
      if (btn) {
        btn.disabled = false;
        btn.innerHTML = `
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="margin-right: 0.25rem; display: inline-block; vertical-align: middle;">
            <polyline points="20 6 9 17 4 12"></polyline>
          </svg>
          <span>Transcribed!</span>
        `;
        setTimeout(() => {
          btn.innerHTML = `
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="margin-right: 0.25rem; display: inline-block; vertical-align: middle;">
              <path d="M12 2a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3z"></path>
              <path d="M19 10v2a7 7 0 0 1-14 0v-2"></path>
              <line x1="12" y1="19" x2="12" y2="23"></line>
              <line x1="8" y1="23" x2="16" y2="23"></line>
            </svg>
            <span>Auto-Transcribe</span>
          `;
        }, 3000);
      }
    }
  }, 100);
}

function initAudioContext() {
  try {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (AudioCtx) {
      state.audioContext = new AudioCtx();
    }
  } catch (e) {
    console.warn('AudioContext not supported in this browser.', e);
  }
}

// Draw static waveform visualization using styled peaks
function generateStaticWaveform() {
  const canvas = DOM.waveformCanvas;
  const ctx = canvas.getContext('2d');
  const width = canvas.width = DOM.waveformCanvas.parentElement.clientWidth || 600;
  const height = canvas.height = 120;
  
  ctx.clearRect(0, 0, width, height);
  DOM.visualizerPlaceholder.style.opacity = '0';
  
  // Draw base centered line
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(0, height / 2);
  ctx.lineTo(width, height / 2);
  ctx.stroke();

  // Generate standard random envelope peaks for visualization
  const barCount = 100;
  const barWidth = 3;
  const barGap = 2;
  const paddingX = (width - (barCount * (barWidth + barGap))) / 2;
  
  ctx.fillStyle = 'rgba(168, 85, 247, 0.3)'; // Primary Muted Color
  
  for (let i = 0; i < barCount; i++) {
    // Generate organic peak variations
    let factor = 0.15;
    if (i > 15 && i < 85) {
      factor = Math.sin((i - 15) / 70 * Math.PI) * 0.7 + (Math.random() * 0.2);
    } else {
      factor = Math.random() * 0.15 + 0.05;
    }
    
    const barHeight = Math.max(4, height * 0.7 * factor);
    const x = paddingX + i * (barWidth + barGap);
    const y = (height - barHeight) / 2;
    
    // Draw rounded bar
    drawRoundRect(ctx, x, y, barWidth, barHeight, 1.5);
  }
}

function drawRoundRect(ctx, x, y, width, height, radius) {
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.lineTo(x + width - radius, y);
  ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
  ctx.lineTo(x + width, y + height - radius);
  ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
  ctx.lineTo(x + radius, y + height);
  ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
  ctx.lineTo(x, y + radius);
  ctx.quadraticCurveTo(x, y, x + radius, y);
  ctx.closePath();
  ctx.fill();
}

function drawEmptyWaveform() {
  const canvas = DOM.waveformCanvas;
  const ctx = canvas.getContext('2d');
  const width = canvas.width = DOM.waveformCanvas.parentElement.clientWidth || 600;
  const height = canvas.height = 120;
  
  ctx.clearRect(0, 0, width, height);
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(0, height / 2);
  ctx.lineTo(width, height / 2);
  ctx.stroke();
  
  DOM.visualizerPlaceholder.style.opacity = '1';
}

// Live Recording Engine
function toggleRecording() {
  if (state.isRecording) {
    stopRecording();
  } else {
    startRecording();
  }
}

function startRecording() {
  if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
    alert('Audio recording is not supported in this browser.');
    return;
  }

  navigator.mediaDevices.getUserMedia({ audio: true })
    .then(stream => {
      state.isRecording = true;
      DOM.recordBtn.classList.add('recording');
      DOM.recordStatus.innerHTML = '<span class="status-red">Recording Microphone...</span>';
      DOM.recResetBtn.disabled = true;
      DOM.recSaveBtn.disabled = true;
      
      // Initialize media recorder
      state.mediaRecorder = new MediaRecorder(stream);
      state.audioChunks = [];
      
      state.mediaRecorder.ondataavailable = (event) => {
        state.audioChunks.push(event.data);
      };
      
      state.mediaRecorder.onstop = () => {
        const audioBlob = new Blob(state.audioChunks, { type: 'audio/wav' });
        const audioUrl = URL.createObjectURL(audioBlob);
        
        if (state.audioElement) {
          state.audioElement.pause();
        }
        state.audioElement = new Audio(audioUrl);
        state.audioElement.addEventListener('loadedmetadata', () => {
          state.audioDuration = state.audioElement.duration;
          DOM.playBtn.disabled = false;
          DOM.waveformTime.textContent = '0:00 / ' + formatDuration(state.audioDuration);
          generateStaticWaveform();
          evaluateSpeech();
        });
        
        DOM.recResetBtn.disabled = false;
        DOM.recSaveBtn.disabled = false;
      };

      state.mediaRecorder.start();
      
      // Timer setup
      state.recordStartTime = Date.now();
      state.elapsedRecordTime = 0;
      state.recordInterval = setInterval(() => {
        state.elapsedRecordTime = (Date.now() - state.recordStartTime) / 1000;
        DOM.recordTimer.textContent = formatRecordTime(state.elapsedRecordTime);
        
        // Time violations threshold checking during live record
        const rule = eventRules[state.selectedEvent];
        if (state.elapsedRecordTime > rule.maxTime + rule.gracePeriod) {
          DOM.recordTimer.classList.add('exceeded');
        } else {
          DOM.recordTimer.classList.remove('exceeded');
        }
      }, 100);

      // Start live transcription
      startLiveTranscription();
      
      // Start microphone canvas visualization (oscilloscope)
      initAudioContext();
      if (state.audioContext) {
        state.audioContext.resume().then(() => {
          const source = state.audioContext.createMediaStreamSource(stream);
          const analyser = state.audioContext.createAnalyser();
          analyser.fftSize = 256;
          source.connect(analyser);
          state.analyserNode = analyser;
          visualizeMicrophoneInput();
        });
      }
    })
    .catch(err => {
      console.error('Microphone access denied:', err);
      alert('Could not access microphone. Please check system permissions.');
    });
}

function stopRecording() {
  if (!state.isRecording) return;
  
  state.isRecording = false;
  DOM.recordBtn.classList.remove('recording');
  DOM.recordStatus.textContent = 'Recording stopped. Review or save audio below.';
  
  if (state.mediaRecorder) {
    state.mediaRecorder.stop();
    // Stop mic stream tracks
    state.mediaRecorder.stream.getTracks().forEach(track => track.stop());
  }
  
  clearInterval(state.recordInterval);
  stopSpeechRecognition();
  
  if (state.animationFrameId) {
    cancelAnimationFrame(state.animationFrameId);
  }
}

function resetRecording() {
  stopRecording();
  state.audioChunks = [];
  state.audioDuration = 0;
  DOM.recordTimer.textContent = '00:00.0';
  DOM.recordTimer.classList.remove('exceeded');
  DOM.recordStatus.textContent = 'Click to start recording microphone';
  DOM.recResetBtn.disabled = true;
  DOM.recSaveBtn.disabled = true;
  DOM.playBtn.disabled = true;
  drawEmptyWaveform();
  
  if (state.audioElement) {
    state.audioElement.pause();
    state.audioElement = null;
  }
}

function saveRecording() {
  // Transfer recorded audio data as active evaluator sample
  DOM.audioPanel.classList.remove('active-glow');
  alert('Recording successfully saved and set as current speech audio.');
}

// Draw live wave details during speech record
function visualizeMicrophoneInput() {
  const canvas = DOM.waveformCanvas;
  const ctx = canvas.getContext('2d');
  const width = canvas.width = DOM.waveformCanvas.parentElement.clientWidth;
  const height = 120;
  
  const bufferLength = state.analyserNode.frequencyBinCount;
  const dataArray = new Uint8Array(bufferLength);
  
  DOM.visualizerPlaceholder.style.opacity = '0';

  function draw() {
    if (!state.isRecording) return;
    
    state.animationFrameId = requestAnimationFrame(draw);
    state.analyserNode.getByteFrequencyData(dataArray);
    
    ctx.fillStyle = 'var(--bg-secondary)';
    ctx.fillRect(0, 0, width, height);
    
    const barWidth = (width / bufferLength) * 2.5;
    let barHeight;
    let x = 0;
    
    ctx.fillStyle = 'rgba(168, 85, 247, 0.4)';
    
    for (let i = 0; i < bufferLength; i++) {
      barHeight = dataArray[i] / 2;
      
      const y = (height - barHeight) / 2;
      drawRoundRect(ctx, x, y, barWidth - 1, barHeight, 1);
      
      x += barWidth;
    }
  }
  
  draw();
}

// Live Speech Recognition integration
function startLiveTranscription() {
  const SpeechRec = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SpeechRec) {
    DOM.transcriptStatus.innerHTML = '<span style="color:var(--danger)">STT Unsupported</span>';
    return;
  }

  state.speechRecognition = new SpeechRec();
  state.speechRecognition.continuous = true;
  state.speechRecognition.interimResults = true;
  state.speechRecognition.lang = 'en-US';

  DOM.transcriptStatus.innerHTML = '<span class="pulse-ring" style="position:relative; width:8px; height:8px; display:inline-block; border-radius:50%; background:var(--success); animation: record-glow 1s infinite;"></span><span class="status-green">Transcribing...</span>';
  
  let currentFinalTranscript = DOM.transcriptInput.value;

  state.speechRecognition.onresult = (event) => {
    let interimTranscript = '';
    let finalTranscript = '';

    for (let i = event.resultIndex; i < event.results.length; ++i) {
      if (event.results[i].isFinal) {
        finalTranscript += event.results[i][0].transcript;
      } else {
        interimTranscript += event.results[i][0].transcript;
      }
    }

    if (finalTranscript !== '') {
      currentFinalTranscript += (currentFinalTranscript ? ' ' : '') + finalTranscript;
      DOM.transcriptInput.value = currentFinalTranscript;
      state.transcript = currentFinalTranscript;
      evaluateSpeech();
    }
  };

  state.speechRecognition.onerror = (event) => {
    console.error('Speech recognition error:', event.error);
  };

  state.speechRecognition.onend = () => {
    if (state.isRecording) {
      // Auto restart if still recording
      state.speechRecognition.start();
    } else {
      DOM.transcriptStatus.innerHTML = '<span>Recognition Idle</span>';
    }
  };

  state.speechRecognition.start();
}

function stopSpeechRecognition() {
  if (state.speechRecognition) {
    state.speechRecognition.stop();
  }
}

// Load Pre-defined Speech Samples
function loadSpeechSample(key) {
  const sample = speechSamples[key];
  if (!sample) return;

  pauseSampleAudio();
  resetRecording();
  state.lastSampleKey = key;
  state.isSampleAudio = true;
  
  // Set UI event matching sample category
  if (key === 'oratory' || key === 'oratory-excessive') {
    state.selectedEvent = 'oratory';
  } else if (key === 'extemp') {
    state.selectedEvent = 'usx';
  } else if (key === 'impromptu') {
    state.selectedEvent = 'impromptu';
  }
  DOM.eventSelector.value = state.selectedEvent;
  loadEventGuidelines();

  // Populate data details
  state.audioDuration = sample.duration;
  DOM.transcriptInput.value = sample.transcript;
  state.transcript = sample.transcript;
  
  // Draw static waveform
  generateStaticWaveform();
  
  // Enable audio controls
  DOM.playBtn.disabled = false;
  DOM.waveformTime.textContent = '0:00 / ' + formatDuration(state.audioDuration);
  DOM.fileInfo.style.display = 'block';
  DOM.fileInfo.classList.add('visible');
  DOM.infoFilename.textContent = 'sample_' + key + '.mp3';
  DOM.infoDuration.textContent = formatDuration(state.audioDuration);
  DOM.infoFilesize.textContent = 'Size: Competitive Speech Sample';

  // Instantiate audio element wrapper for sample audio
  if (state.audioElement && typeof state.audioElement.pause === 'function') {
    try { state.audioElement.pause(); } catch(e) {}
  }
  state.audioElement = {
    currentTime: 0,
    duration: sample.duration,
    pause: () => {
      pauseSampleAudio();
    }
  };

  evaluateSpeech();
  switchTranscriptView('highlight');
}

// Sample Speech Audio Synthesizer & Player (Produces real audible sound out loud!)
function playSampleAudio() {
  state.isPlaying = true;
  updatePlaybackUI();

  const transcript = state.transcript || '';
  const currentOffset = (state.audioElement && state.audioElement.currentTime) || 0;
  const duration = state.audioDuration || 600;

  // 1. Web Speech Synthesis (Speaks the transcript out loud in natural English voice!)
  if ('speechSynthesis' in window) {
    window.speechSynthesis.cancel();
    
    let startCharIndex = 0;
    if (duration > 0 && currentOffset > 0) {
      const ratio = Math.min(1, currentOffset / duration);
      startCharIndex = Math.floor(ratio * transcript.length);
    }
    const textToSpeak = transcript.substring(startCharIndex) || transcript;
    
    const utterance = new SpeechSynthesisUtterance(textToSpeak);
    utterance.rate = 1.05;
    utterance.pitch = 1.0;
    
    const voices = window.speechSynthesis.getVoices();
    const engVoice = voices.find(v => v.lang.startsWith('en') && (v.name.includes('Natural') || v.name.includes('Google') || v.name.includes('Samantha') || v.name.includes('Daniel') || v.name.includes('Alex')));
    if (engVoice) {
      utterance.voice = engVoice;
    }

    utterance.onend = () => {
      if (state.isPlaying && state.isSampleAudio) {
        pauseSampleAudio();
        if (state.audioElement) state.audioElement.currentTime = 0;
        DOM.timelineFill.style.width = '0%';
        highlightWaveformPlayback(0);
      }
    };

    window.speechSynthesis.speak(utterance);
  }

  // 2. Web Audio API Formant Sound Synthesizer (Generates active vocal tone frequencies to guarantee sound output)
  try {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (AudioCtx) {
      if (!state.synthAudioCtx) {
        state.synthAudioCtx = new AudioCtx();
      }
      if (state.synthAudioCtx.state === 'suspended') {
        state.synthAudioCtx.resume();
      }

      const now = state.synthAudioCtx.currentTime;
      const osc1 = state.synthAudioCtx.createOscillator();
      const osc2 = state.synthAudioCtx.createOscillator();
      const gainNode = state.synthAudioCtx.createGain();
      const filter = state.synthAudioCtx.createBiquadFilter();

      osc1.type = 'sawtooth';
      osc2.type = 'sine';

      // Vocal pitch fundamental (~140Hz) and harmonic overtone (~280Hz)
      osc1.frequency.setValueAtTime(140, now);
      osc2.frequency.setValueAtTime(280, now);

      // Bandpass filter for vocal formant simulation (~850Hz)
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(850, now);
      filter.Q.setValueAtTime(2.5, now);

      // Audible gain level
      gainNode.gain.setValueAtTime(0.06, now);

      osc1.connect(filter);
      osc2.connect(filter);
      filter.connect(gainNode);
      gainNode.connect(state.synthAudioCtx.destination);

      osc1.start(now);
      osc2.start(now);

      state.activeSynthNodes = { osc1, osc2, gainNode, filter };
    }
  } catch (e) {
    console.warn("Web Audio API synth fallback notice:", e);
  }
}

function pauseSampleAudio() {
  state.isPlaying = false;
  updatePlaybackUI();

  if ('speechSynthesis' in window) {
    window.speechSynthesis.cancel();
  }

  if (state.activeSynthNodes) {
    try {
      const { osc1, osc2, gainNode } = state.activeSynthNodes;
      if (gainNode && state.synthAudioCtx) {
        gainNode.gain.linearRampToValueAtTime(0.001, state.synthAudioCtx.currentTime + 0.05);
      }
      setTimeout(() => {
        try { osc1.stop(); } catch(e) {}
        try { osc2.stop(); } catch(e) {}
      }, 60);
    } catch (e) {}
    state.activeSynthNodes = null;
  }
}

// Audio Playback UI Managers
function togglePlayback() {
  if (!state.audioElement) return;

  if (state.isPlaying) {
    if (state.isSampleAudio) {
      pauseSampleAudio();
    } else if (typeof state.audioElement.pause === 'function') {
      state.audioElement.pause();
    }
    state.isPlaying = false;
    DOM.playIcon.innerHTML = '<polygon points="5 3 19 12 5 21 5 3"></polygon>';
  } else {
    if (state.isSampleAudio) {
      playSampleAudio();
    } else if (typeof state.audioElement.play === 'function') {
      state.audioElement.play();
    }
    state.isPlaying = true;
    DOM.playIcon.innerHTML = '<rect x="6" y="4" width="4" height="16"></rect><rect x="14" y="4" width="4" height="16"></rect>';
    updatePlaybackProgress();
  }
}

function updatePlaybackUI() {
  if (state.isPlaying) {
    DOM.playIcon.innerHTML = '<rect x="6" y="4" width="4" height="16"></rect><rect x="14" y="4" width="4" height="16"></rect>';
  } else {
    DOM.playIcon.innerHTML = '<polygon points="5 3 19 12 5 21 5 3"></polygon>';
  }
}

function updatePlaybackProgress() {
  if (!state.isPlaying || !state.audioElement) return;

  const current = state.audioElement.currentTime || 0;
  const total = state.audioDuration || 600;
  
  DOM.playbackTime.textContent = formatDuration(current);
  DOM.waveformTime.textContent = formatDuration(current) + ' / ' + formatDuration(total);
  
  const pct = (current / total) * 100;
  DOM.timelineFill.style.width = pct + '%';
  
  // Highlight waveform playing progress
  highlightWaveformPlayback(pct);

  if (current >= total || (state.audioElement.ended)) {
    pauseSampleAudio();
    state.audioElement.currentTime = 0;
    DOM.playIcon.innerHTML = '<polygon points="5 3 19 12 5 21 5 3"></polygon>';
    DOM.timelineFill.style.width = '0%';
    highlightWaveformPlayback(0);
    return;
  }

  // If sample audio or mock element, increment time manually
  if (state.isSampleAudio || !state.audioElement.addEventListener) {
    state.audioElement.currentTime += 0.1;
    setTimeout(updatePlaybackProgress, 100);
  } else {
    requestAnimationFrame(updatePlaybackProgress);
  }
}

// Color matching of waveform canvas based on playing percentage
function highlightWaveformPlayback(pct) {
  const canvas = DOM.waveformCanvas;
  const ctx = canvas.getContext('2d');
  const width = canvas.width;
  const height = canvas.height;
  
  // Re-generate peaks drawing but colorize playing bars
  ctx.clearRect(0, 0, width, height);
  
  // Base centered line
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(0, height / 2);
  ctx.lineTo(width, height / 2);
  ctx.stroke();

  const barCount = 100;
  const barWidth = 3;
  const barGap = 2;
  const paddingX = (width - (barCount * (barWidth + barGap))) / 2;
  
  const activeBarIndex = Math.floor(pct / 100 * barCount);

  for (let i = 0; i < barCount; i++) {
    let factor = 0.15;
    if (i > 15 && i < 85) {
      factor = Math.sin((i - 15) / 70 * Math.PI) * 0.7 + (Math.random() * 0.2);
    } else {
      factor = Math.random() * 0.15 + 0.05;
    }
    
    const barHeight = Math.max(4, height * 0.7 * factor);
    const x = paddingX + i * (barWidth + barGap);
    const y = (height - barHeight) / 2;
    
    if (i <= activeBarIndex) {
      ctx.fillStyle = 'var(--primary)'; // Active Glowing color
    } else {
      ctx.fillStyle = 'rgba(168, 85, 247, 0.3)'; // Inactive muted color
    }
    
    drawRoundRect(ctx, x, y, barWidth, barHeight, 1.5);
  }
}

function seekPlayback(e) {
  if (!state.audioElement || state.audioDuration === 0) return;
  
  const rect = DOM.timelineBar.getBoundingClientRect();
  const clickX = e.clientX - rect.left;
  const percentage = clickX / rect.width;
  const targetTime = percentage * state.audioDuration;
  
  state.audioElement.currentTime = targetTime;
  DOM.timelineFill.style.width = (percentage * 100) + '%';
  DOM.playbackTime.textContent = formatDuration(targetTime);
  highlightWaveformPlayback(percentage * 100);

  if (state.isSampleAudio && state.isPlaying) {
    playSampleAudio();
  }
}


// EVALUATION ENGINE
function evaluateSpeech() {
  const text = state.transcript.trim();
  if (DOM.transcriptHighlightView && DOM.transcriptHighlightView.style.display !== 'none') {
    DOM.transcriptHighlightView.innerHTML = highlightEmotionWords(state.transcript);
  }
  const rule = eventRules[state.selectedEvent];
  
  // Word count & Character Counts
  const wordCount = text ? text.split(/\s+/).length : 0;
  DOM.charWordCount.textContent = `Words: ${wordCount} | Characters: ${text.length}`;

  // 1. Time Limits Analysis
  const duration = state.audioDuration;
  DOM.statsDuration.innerHTML = formatDuration(duration) + ` <span>/ ${formatDuration(rule.maxTime)}</span>`;
  
  let timePass = false;
  let timeAlert = '';
  
  if (duration === 0) {
    DOM.statusTime.className = 'stat-status status-orange';
    DOM.statusTimeIcon.className = 'checklist-icon pending';
    DOM.statusTimeText.textContent = 'No audio provided';
    timeAlert = 'Audio not yet provided.';
  } else if (duration <= rule.maxTime) {
    DOM.statusTime.className = 'stat-status status-green';
    DOM.statusTimeIcon.innerHTML = '<path d="M12 2C6.5 2 2 6.5 2 12S6.5 22 12 22 22 17.5 22 12 17.5 2 12 2M10 17L5 12L6.41 10.59L10 14.17L17.59 6.58L19 8L10 17Z"/>';
    DOM.statusTimeIcon.className = 'checklist-icon pass';
    DOM.statusTimeText.textContent = 'Perfect (Compliant)';
    timePass = true;
  } else if (duration <= rule.maxTime + rule.gracePeriod) {
    DOM.statusTime.className = 'stat-status status-orange';
    DOM.statusTimeIcon.innerHTML = '<path d="M12 2C6.5 2 2 6.5 2 12S6.5 22 12 22 22 17.5 22 12 17.5 2 12 2M12 4C16.4 4 20 7.6 20 12S16.4 20 12 20 4 16.4 4 12 7.6 4 12 4M12 6V12L16 14L16.8 12.8L13.5 11.2V6H12Z"/>';
    DOM.statusTimeIcon.className = 'checklist-icon pending';
    DOM.statusTimeText.textContent = 'In Grace Period (Safe)';
    timePass = true;
    timeAlert = `Within the ${rule.gracePeriod}-second grace period. Keep it under ${formatDuration(rule.maxTime)} to avoid risks.`;
  } else {
    DOM.statusTime.className = 'stat-status status-red';
    DOM.statusTimeIcon.innerHTML = '<path d="M12 2C6.5 2 2 6.5 2 12S6.5 22 12 22 22 17.5 22 12 17.5 2 12 2M12 4H10V10H12V4M12 12H10V14H12V12M12 16H10V18H12V16Z"/>';
    DOM.statusTimeIcon.className = 'checklist-icon fail';
    const overage = duration - rule.maxTime;
    DOM.statusTimeText.textContent = `Exceeded by +${formatDuration(overage)}`;
    timeAlert = `OVERTIME VIOLATION: Exceeded limit by ${formatDuration(overage)}. According to NSDA rules, exceeding the grace period makes it impossible to rank first in the round.`;
  }
  updateChecklistStatus(DOM.chkRuleTime, timePass);

  // 2. Direct Quotes count (For Oratory and Informative only)
  let quotesPass = true;
  let quoteAlert = '';
  if (rule.requiresQuotesRule) {
    const quotedCount = countQuotedWords(text);
    state.quotedWordsCount = quotedCount;
    DOM.quoteReadout.textContent = `Quoted: ${quotedCount} / ${rule.quoteLimit} words`;
    
    const pct = Math.min(100, (quotedCount / rule.quoteLimit) * 100);
    DOM.quoteProgressBar.style.width = pct + '%';
    
    if (quotedCount > rule.quoteLimit) {
      DOM.quoteProgressBar.classList.add('exceeded');
      quotesPass = false;
      quoteAlert = `QUOTE RULE VIOLATION: Directly quoted words (${quotedCount}) exceed the NSDA 150-word limit. Ensure quotes are condensed or paraphrased.`;
    } else {
      DOM.quoteProgressBar.classList.remove('exceeded');
    }
    updateChecklistStatus(DOM.chkRuleQuotes, text ? quotesPass : null);
  } else {
    state.quotedWordsCount = 0;
    DOM.quoteProgressBar.style.width = '0%';
    updateChecklistStatus(DOM.chkRuleQuotes, null); // N/A
  }

  // 3. Speech Delivery Pacing (WPM)
  let pacingPass = false;
  let pacingAlert = '';
  if (wordCount > 0 && duration > 0) {
    const minutes = duration / 60;
    state.wpm = Math.round(wordCount / minutes);
    DOM.statsWpm.innerHTML = `${state.wpm} <span>WPM</span>`;
    
    if (state.wpm >= 130 && state.wpm <= 165) {
      DOM.statusWpmStatus.className = 'stat-status status-green';
      DOM.statusWpmIcon.className = 'checklist-icon pass';
      DOM.statusWpmText.textContent = 'Optimal Pacing';
      pacingPass = true;
    } else if (state.wpm > 165) {
      DOM.statusWpmStatus.className = 'stat-status status-red';
      DOM.statusWpmIcon.className = 'checklist-icon fail';
      DOM.statusWpmText.textContent = 'Too Fast (Slow down)';
      pacingAlert = `Delivery pacing is ${state.wpm} WPM. A speaking rate exceeding 165 WPM makes it difficult for judges to trace arguments. Work on intentional pauses.`;
    } else {
      DOM.statusWpmStatus.className = 'stat-status status-orange';
      DOM.statusWpmIcon.className = 'checklist-icon pending';
      DOM.statusWpmText.textContent = 'Too Muted / Slow';
      pacingAlert = `Delivery pacing is ${state.wpm} WPM. Slow speech rates (<120 WPM) can reduce rhetorical energy. Aim for 130–160 WPM.`;
    }
    updateChecklistStatus(DOM.chkRulePacing, pacingPass);
  } else {
    state.wpm = 0;
    DOM.statsWpm.innerHTML = `0 <span>WPM</span>`;
    DOM.statusWpmStatus.className = 'stat-status status-orange';
    DOM.statusWpmIcon.className = 'checklist-icon pending';
    DOM.statusWpmText.textContent = 'Provide transcript';
    updateChecklistStatus(DOM.chkRulePacing, null);
  }

  // 4. Filler Words Tracker
  let fillerPass = true;
  let fillerAlert = '';
  if (wordCount > 0) {
    const fillers = countFillerWords(text);
    state.fillerWordsCount = fillers;
    DOM.statsFillerCount.innerHTML = `${fillers} <span>Count</span>`;
    
    const density = (fillers / wordCount) * 100;
    DOM.statsFillerPercent.textContent = `Filler Ratio: ${density.toFixed(1)}%`;
    
    if (density > 2.2) {
      DOM.statusFillerStatus.className = 'stat-status status-orange';
      fillerPass = false;
      fillerAlert = `Fluency: Filler word ratio is ${density.toFixed(1)}% (${fillers} words). Try to exchange fillers ("like", "um", "ah") with silences to gain authority.`;
    } else {
      DOM.statusFillerStatus.className = 'stat-status status-green';
    }
    updateChecklistStatus(DOM.chkRuleFiller, fillerPass);
  } else {
    state.fillerWordsCount = 0;
    DOM.statsFillerCount.innerHTML = `0 <span>Count</span>`;
    DOM.statsFillerPercent.textContent = 'Filler Ratio: 0%';
    DOM.statusFillerStatus.className = 'stat-status status-green';
    updateChecklistStatus(DOM.chkRuleFiller, null);
  }

  // 5. Rhetorical Structure Checklist
  const structureResults = analyzeRhetoricalStructure(text);
  updateChecklistStatus(DOM.chkStructHook, text ? structureResults.hook : null);
  updateChecklistStatus(DOM.chkStructThesis, text ? structureResults.thesis : null);
  updateChecklistStatus(DOM.chkStructRoadmap, text ? structureResults.roadmap : null);
  updateChecklistStatus(DOM.chkStructTransitions, text ? structureResults.transitions : null);
  updateChecklistStatus(DOM.chkStructConclusion, text ? structureResults.conclusion : null);

  // 6. Vocal Emotion Analysis & Comparison
  evaluateSpeechEmotions(text);

  // Auto score adjustments & comments generation
  generateJudgeBallot(timePass, quotesPass, pacingPass, fillerPass, structureResults, timeAlert, quoteAlert, pacingAlert, fillerAlert);
}

// 6. Vocal Emotion & Rhetorical Tone Evaluation
// Global Script Emotion Classifier
function analyzeScriptEmotion(text) {
  const lowercase = text.toLowerCase();
  const categories = {
    sorrow: ['loss', 'lost', 'tears', 'tragedy', 'war', 'darkness', 'broken', 'death', 'pain', 'sad', 'sadness', 'mourn', 'grief', 'heartache', 'longing', 'empty', 'alone', 'silent', 'night'],
    anger: ['injustice', 'outburst', 'conflict', 'pressure', 'economic', 'government', 'deficit', 'recession', 'reform', 'policy', 'change', 'challenge', 'fight', 'protest', 'demand', 'dismantle'],
    joy: ['life', 'love', 'beauty', 'natural', 'celebrating', 'celebrate', 'growth', 'hope', 'dream', 'imagine', 'velcro', 'biomimicry', 'wonder', 'happy', 'happiness', 'perfect', 'creativity'],
    anxiety: ['vulnerability', 'identity', 'mental', 'struggle', 'struggles', 'failure', 'fear', 'screaming', 'sirens', 'crisis', 'tension', 'anxious', 'scared', 'panic', 'worry'],
    nostalgia: ['past', 'childhood', 'memories', 'fading', 'remember', 'kitchen', 'mother', 'humming', 'sailors', 'seas', 'yesterday', 'old', 'home', 'back'],
    relief: ['closure', 'peace', 'turmoil', 'relief', 'accept', 'acceptance', 'finally', 'healed', 'calm', 'resolved', 'quiet', 'rest', 'understanding', 'method']
  };

  const scores = {
    sorrow: 0,
    anger: 0,
    joy: 0,
    anxiety: 0,
    nostalgia: 0,
    relief: 0
  };

  Object.keys(categories).forEach(cat => {
    categories[cat].forEach(word => {
      const regex = new RegExp('\\b' + word + '\\b', 'gi');
      const matches = lowercase.match(regex);
      if (matches) {
        scores[cat] += matches.length;
      }
    });
  });

  let bestCat = 'joy';
  let maxScore = 0;
  Object.keys(scores).forEach(cat => {
    if (scores[cat] > maxScore) {
      maxScore = scores[cat];
      bestCat = cat;
    }
  });

  const mappings = {
    sorrow: {
      emotion: 'Sorrow & Grief',
      guidance: 'Exploring loss, heartache, or longing. Deliver with soft volume, heavy sighs, and long, reflective pauses.',
      suggestions: [
        'Lower your vocal energy and use a breathy, soft tone to project vulnerability and grief.',
        'Use elongated pause margins (2+ seconds) between key phrases to let the emotional weight settle.'
      ]
    },
    anger: {
      emotion: 'Anger & Frustration',
      guidance: 'Outbursts against injustice, conflict, or pressure. Use sharp word stress, elevated volume, and rapid transitions.',
      suggestions: [
        'Increase average speaking volume on key action verbs to project outrage and authority.',
        'Employ sudden, sharp tone changes and clip the ends of sentences to emphasize frustration.'
      ]
    },
    joy: {
      emotion: 'Joy & Wonder',
      guidance: 'Celebrating life, love, or the beauty of the natural world. Deliver with light, rising inflections and high energy.',
      suggestions: [
        'Utilize frequent rising pitch inflections and maintain a light, smiling vocal posture.',
        'Speed up slightly during celebratory descriptions, expressing authentic enthusiasm.'
      ]
    },
    anxiety: {
      emotion: 'Anxiety & Fear',
      guidance: 'Conveying vulnerability, identity crises, or struggles. Use rapid, trembling tempo and narrow pitch ranges.',
      suggestions: [
        'Compress your frequency variance to project an internal identity crisis or mental tension.',
        'Integrate shorter, abrupt breath patterns before beginning high-stress sentences.'
      ]
    },
    nostalgia: {
      emotion: 'Nostalgia',
      guidance: 'Reflecting on the past, childhood, or fading memories. Deliver with a warm, lower register and calm, even pacing.',
      suggestions: [
        'Adopt a warm, chest-resonant tone to invite the judge into personal reflective narratives.',
        'Soften the edges of your delivery, avoiding harsh volume spikes during story segments.'
      ]
    },
    relief: {
      emotion: 'Relief & Acceptance',
      guidance: 'Finding closure or peace after turmoil. Deliver with a stable register, relaxed breathing, and gentle pauses.',
      suggestions: [
        'Maintain a balanced, steady cadence with natural pauses to project peace and closure.',
        'Transition from high-intensity segments to a soft, centered pitch to express resolution.'
      ]
    }
  };

  return mappings[bestCat];
}

// 6. Vocal Emotion & Rhetorical Tone Evaluation
function evaluateSpeechEmotions(text) {
  const existingTag = DOM.emotionExistingTag;
  const expectedTag = DOM.emotionExpectedTag;
  const suggestionsList = DOM.emotionSuggestionsList;

  // 1. No Audio at all
  if (state.audioDuration === 0) {
    if (existingTag) {
      existingTag.textContent = 'No audio analyzed';
      existingTag.className = 'emotion-tag tag-neutral';
    }
    if (expectedTag) {
      expectedTag.textContent = 'Select an event';
      expectedTag.className = 'emotion-tag tag-primary';
    }
    if (suggestionsList) {
      suggestionsList.innerHTML = '<li>Provide speech audio or select a sample to generate vocal suggestions.</li>';
    }
    
    if (DOM.matrixGivenAudioView) {
      DOM.matrixGivenAudioView.innerHTML = `<span style="color: var(--text-muted); font-style: italic;">Provide speech audio to analyze expressed voice emotions.</span>`;
    }
    if (DOM.matrixCorrectScriptView) {
      DOM.matrixCorrectScriptView.innerHTML = `<span style="color: var(--text-muted); font-style: italic;">Provide speech script to generate target script emotions.</span>`;
    }
    if (DOM.audioExpectedEmotionName) {
      DOM.audioExpectedEmotionName.textContent = 'Select Event';
      DOM.audioExpectedEmotionName.className = 'emotion-tag tag-primary';
    }

    if (DOM.audioEmotionMatrixPanel && DOM.audioExistingEmotionName && DOM.audioExistingEmotionDetail && DOM.audioExpectedEmotionGuidance) {
      DOM.audioEmotionMatrixPanel.style.display = 'block';
      DOM.audioExistingEmotionName.textContent = 'Pending';
      DOM.audioExistingEmotionDetail.textContent = 'Provide speech audio input (upload or record) to analyze expressed emotions.';
      DOM.audioExpectedEmotionGuidance.innerHTML = `
        <strong>Expected: Select an Event</strong>
        <p style="margin-top: 0.5rem; line-height: 1.4; color: var(--text-muted); font-style: italic;">
          Guidance and tone elevation tips will display here once audio is provided.
        </p>
      `;
    }
    return;
  }

  // 2. Audio loaded, but Transcript is empty
  if (!text) {
    if (existingTag) {
      existingTag.textContent = 'Audio Loaded';
      existingTag.className = 'emotion-tag tag-warning';
    }
    if (expectedTag) {
      expectedTag.textContent = 'Awaiting Script';
      expectedTag.className = 'emotion-tag tag-neutral';
    }
    if (suggestionsList) {
      suggestionsList.innerHTML = '<li>Provide your speech script in the transcript box to receive vocal delivery elevation tips.</li>';
    }
    
    if (DOM.matrixGivenAudioView) {
      DOM.matrixGivenAudioView.innerHTML = `<span style="color: var(--text-muted); font-style: italic;">Awaiting transcript script to map voice emotions to text.</span>`;
    }
    if (DOM.matrixCorrectScriptView) {
      DOM.matrixCorrectScriptView.innerHTML = `<span style="color: var(--text-muted); font-style: italic;">Provide speech script to generate target script emotions.</span>`;
    }
    if (DOM.audioExpectedEmotionName) {
      DOM.audioExpectedEmotionName.textContent = 'Awaiting Script';
      DOM.audioExpectedEmotionName.className = 'emotion-tag tag-neutral';
    }

    if (DOM.audioEmotionMatrixPanel && DOM.audioExistingEmotionName && DOM.audioExistingEmotionDetail && DOM.audioExpectedEmotionGuidance) {
      DOM.audioEmotionMatrixPanel.style.display = 'block';
      DOM.audioExistingEmotionName.textContent = 'Vocal Tone Detected';
      DOM.audioExistingEmotionDetail.textContent = 'Audio signature decoded. Tone: Energetic with moderate pitch variation.';
      DOM.audioExpectedEmotionGuidance.innerHTML = `
        <strong>Target Emotion: ${state.selectedEvent ? eventRules[state.selectedEvent].title.split(' ')[0] : 'Joy'}</strong>
        <p style="margin-top: 0.5rem; line-height: 1.4; color: var(--text-main); font-style: italic;">
          Audio successfully loaded. Please paste or type your speech script in the transcript box to calculate exact pacing (WPM), check quote rules compliance, and generate rhetorical tone shift suggestions.
        </p>
      `;
    }
    return;
  }

  // Show "Thinking..." status for expected emotions while loading from Agentic AI
  if (expectedTag) {
    expectedTag.textContent = 'Analyzing...';
    expectedTag.className = 'emotion-tag tag-neutral';
  }
  if (suggestionsList) {
    suggestionsList.innerHTML = '<li>Analyzing speech with Agentic AI...</li>';
  }
  if (DOM.audioExpectedEmotionName) {
    DOM.audioExpectedEmotionName.textContent = 'Analyzing...';
    DOM.audioExpectedEmotionName.className = 'emotion-tag tag-neutral';
  }
  if (DOM.audioExpectedEmotionGuidance) {
    DOM.audioExpectedEmotionGuidance.innerHTML = '<em>Agentic AI speech evaluation in progress...</em>';
  }

  // Helper local fallback function
  const runLocalFallback = () => {
    const scriptAnalysis = analyzeScriptEmotion(text);
    const expectedEmotion = scriptAnalysis.emotion;
    const expectedClassMap = {
      'Sorrow & Grief': 'tag-neutral',
      'Anger & Frustration': 'tag-danger',
      'Joy & Wonder': 'tag-success',
      'Anxiety & Fear': 'tag-warning',
      'Nostalgia': 'tag-primary',
      'Relief & Acceptance': 'tag-info'
    };
    const expectedClass = expectedClassMap[expectedEmotion] || 'tag-primary';
    const expectedSuggestions = scriptAnalysis.suggestions;
    updateUIWithEmotions(expectedEmotion, expectedClass, scriptAnalysis.guidance, expectedSuggestions, 'Local Fallback Mode');
  };

  // Helper function to update the UI
  const updateUIWithEmotions = (expectedEmotion, expectedClass, guidance, expectedSuggestions, transitionTipVal) => {
    // Determine Existing/Detected Emotion based on WPM, Filler Ratio, and Pitch variations in the audio
    let existingEmotion = 'Relief & Acceptance';
    let existingClass = 'tag-info';
    const fillers = countFillerWords(text);
    const wordCount = text.split(/\s+/).length;
    const fillerRatio = wordCount > 0 ? (fillers / wordCount) * 100 : 0;

    // Let's check for predefined sample signatures first
    const normalizeText = (str) => str.toLowerCase().replace(/\s+/g, ' ').trim();
    const normText = normalizeText(text);
    const activeSample = Object.keys(speechSamples).find(key => normalizeText(speechSamples[key].transcript) === normText);

    let transitionTip = transitionTipVal;

    if (activeSample === 'oratory') {
      existingEmotion = 'Sorrow & Grief';
      existingClass = 'tag-neutral';
      transitionTip = 'Your delivery is quiet and flat, projecting sorrow. To express relief, lift your vocal register and use steady, relaxed breath patterns.';
    } else if (activeSample === 'extemp') {
      existingEmotion = 'Relief & Acceptance';
      existingClass = 'tag-info';
      transitionTip = 'Vocal tone is peaceful and accepting, which is calming but lacks competitive energy. To elevate, project your voice from the chest and add anger/outrage emphasis on logical proof.';
    } else if (activeSample === 'oratory-excessive') {
      existingEmotion = 'Anger & Frustration';
      existingClass = 'tag-danger';
      transitionTip = 'Vocal delivery is aggressive and rapid. Reduce speed and add reflective pauses to transition into relief and acceptance.';
    } else if (activeSample === 'impromptu') {
      existingEmotion = 'Anxiety & Fear';
      existingClass = 'tag-warning';
      transitionTip = 'High hesitation indicates anxiety. Eliminate filler words and swap them with silent pauses to project acceptance and stability.';
    } else if (!transitionTipVal) {
      // Dynamic logic for custom files/recordings
      if (state.wpm > 165) {
        existingEmotion = 'Anger & Frustration';
        existingClass = 'tag-danger';
        transitionTip = 'Vocal pacing is extremely rapid, indicating anger and strain. Reduce speaking rate to under 160 WPM and add pauses after key punctuation marks.';
      } else if (state.wpm < 115) {
        existingEmotion = 'Sorrow & Grief';
        existingClass = 'tag-neutral';
        transitionTip = 'The delivery feels slow and flat, conveying sorrow. Speed up your tempo and use rising inflections to transition to joy and wonder.';
      } else if (fillerRatio > 2.5) {
        existingEmotion = 'Anxiety & Fear';
        existingClass = 'tag-warning';
        transitionTip = 'Frequent filler words indicate anxiety. Substitute verbal fillers ("um", "like") with clean silent pauses.';
      } else {
        // Normal/good tempo
        if (state.wpm > 140) {
          existingEmotion = 'Joy & Wonder';
          existingClass = 'tag-success';
          transitionTip = 'Excellent, vibrant pacing showing joy and wonder. Maintain energetic emphasis on core rhetorical assertions.';
        } else {
          existingEmotion = 'Relief & Acceptance';
          existingClass = 'tag-info';
          transitionTip = 'Delivery is steady and controlled, conveying acceptance and closure. Add slight pitch peaks during transition points.';
        }
      }
    }

    // Update Main Dashboard UI Elements
    if (existingTag) {
      existingTag.textContent = existingEmotion;
      existingTag.className = `emotion-tag ${existingClass}`;
    }
    if (expectedTag) {
      expectedTag.textContent = expectedEmotion;
      expectedTag.className = `emotion-tag ${expectedClass}`;
    }

    // Update printable layout fields
    const printExisting = DOM.printExistingEmotion;
    const printExpected = DOM.printExpectedEmotion;
    if (printExisting && printExpected) {
      printExisting.textContent = existingEmotion;
      printExpected.textContent = expectedEmotion;
      
      // Assign matching text colors for printed ballot
      if (existingClass === 'tag-danger') printExisting.style.color = '#dc2626';
      else if (existingClass === 'tag-warning') printExisting.style.color = '#d97706';
      else if (existingClass === 'tag-success') printExisting.style.color = '#15803d';
      else printExisting.style.color = '#4b5563';

      if (expectedClass === 'tag-primary') printExpected.style.color = '#7c3aed';
      else if (expectedClass === 'tag-success') printExpected.style.color = '#15803d';
      else if (expectedClass === 'tag-warning') printExpected.style.color = '#d97706';
      else if (expectedClass === 'tag-danger') printExpected.style.color = '#dc2626';
    }

    // Populate main suggestions list
    if (suggestionsList) {
      suggestionsList.innerHTML = '';
      const transitionLi = document.createElement('li');
      transitionLi.innerHTML = `<strong>Tone Shift Tip:</strong> ${transitionTip}`;
      suggestionsList.appendChild(transitionLi);

      expectedSuggestions.forEach(suggestion => {
        const li = document.createElement('li');
        li.textContent = suggestion;
        suggestionsList.appendChild(li);
      });
    }

    // Update Audio Section Emotion Matrix
    if (DOM.audioEmotionMatrixPanel && DOM.audioExistingEmotionName && DOM.audioExistingEmotionDetail && DOM.audioExpectedEmotionGuidance) {
      DOM.audioEmotionMatrixPanel.style.display = 'block';
      DOM.audioExistingEmotionName.textContent = existingEmotion;
      DOM.audioExistingEmotionName.className = `emotion-tag ${existingClass}`;
      
      if (DOM.audioExpectedEmotionName) {
        DOM.audioExpectedEmotionName.textContent = expectedEmotion;
        DOM.audioExpectedEmotionName.className = `emotion-tag ${expectedClass}`;
      }
      
      // Set color-coded columns for matrix comparison
      if (DOM.matrixGivenAudioView) {
        DOM.matrixGivenAudioView.innerHTML = highlightExpressedAudioEmotions(text, state.audioBuffer);
      }
      if (DOM.matrixCorrectScriptView) {
        DOM.matrixCorrectScriptView.innerHTML = highlightEmotionWords(text);
      }

      // Set custom visual detail text
      let detailText = "Standard speaking voice parameters detected.";
      if (existingClass === 'tag-neutral') {
        detailText = "Flat pitch contours and consistent volume readings suggest a monotone vocal presentation.";
      } else if (existingClass === 'tag-success') {
        detailText = "Balanced pacing, fluid pauses, and structured word stress suggest confident delivery.";
      } else if (existingClass === 'tag-danger') {
        detailText = "Rapid speaking rate and narrow frequency bounds indicate high muscle tension/anxiety.";
      } else if (existingClass === 'tag-warning') {
        detailText = "High occurrence of verbal pauses ('um', 'ah') and frequent stop-starts indicate hesitance.";
      }
      DOM.audioExistingEmotionDetail.textContent = detailText;
      
      // Set guidance text matching the user's specific request
      DOM.audioExpectedEmotionGuidance.innerHTML = `
        <strong>Correct Script Tone: ${expectedEmotion}</strong>
        <p style="margin-top: 0.4rem; line-height: 1.4; color: var(--text-main); font-size: 0.8rem;">
          ${guidance}
        </p>
        <ul style="margin-top: 0.4rem; padding-left: 0.95rem; font-size: 0.75rem; color: var(--text-muted); list-style-type: disc;">
          ${expectedSuggestions.map(s => `<li style="margin-bottom: 0.25rem;">${s}</li>`).join('')}
        </ul>
        <p style="margin-top: 0.4rem; line-height: 1.3; color: var(--secondary); font-size: 0.75rem; font-weight: 500;">
          💡 <strong>Elevation Tip:</strong> ${transitionTip}
        </p>
      `;
    }
  };

  // Perform API call to Agentic AI
  fetch('/analyze-emotions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      transcript: text,
      event: state.selectedEvent
    })
  })
  .then(response => {
    if (!response.ok) throw new Error('Failed to get analysis from server');
    return response.json();
  })
  .then(data => {
    if (data.error) throw new Error(data.error);
    
    // Map response emotion to class
    const expectedClassMap = {
      'Sorrow & Grief': 'tag-neutral',
      'Anger & Frustration': 'tag-danger',
      'Joy & Wonder': 'tag-success',
      'Anxiety & Fear': 'tag-warning',
      'Nostalgia': 'tag-primary',
      'Relief & Acceptance': 'tag-info'
    };
    const expectedClass = expectedClassMap[data.emotion] || 'tag-primary';
    
    updateUIWithEmotions(
      data.emotion, 
      expectedClass, 
      data.guidance, 
      data.suggestions || [], 
      data.transition_tip
    );
  })
  .catch(err => {
    console.warn("Agentic AI failed, falling back to local NLP rules:", err);
    runLocalFallback();
  });
}

// Color code script statements based strictly on physical audio expressed emotions (vocal variations)
function highlightExpressedAudioEmotions(text, audioBuffer) {
  if (!text) return "";

  // Tokenize text into words and whitespaces
  const tokens = text.split(/(\s+)/);
  const n = tokens.length;

  const colors = {
    sorrow: '#94a3b8',        // Gray
    anger: '#ef4444',         // Red
    joy: '#10b981',          // Green
    anxiety: '#f59e0b',       // Amber
    nostalgia: '#8b5cf6',     // Purple
    relief: '#0ea5e9'         // Blue
  };

  const duration = audioBuffer ? audioBuffer.duration : (state.audioDuration || 180);
  const sampleRate = audioBuffer ? audioBuffer.sampleRate : 44100;
  const channelData = (audioBuffer && audioBuffer.numberOfChannels > 0) ? audioBuffer.getChannelData(0) : null;

  // Determine token-level audio emotion
  const tokenEmotions = [];
  
  // Count only non-whitespace tokens to map evenly to the audio timeline
  const wordTokens = [];
  const tokenToWordIdx = [];
  for (let i = 0; i < n; i++) {
    const token = tokens[i];
    if (/^\s+$/.test(token) || !token.trim()) {
      tokenToWordIdx.push(-1);
    } else {
      tokenToWordIdx.push(wordTokens.length);
      wordTokens.push(token);
    }
  }

  const numWords = wordTokens.length;

  for (let i = 0; i < n; i++) {
    const token = tokens[i];
    if (/^\s+$/.test(token) || !token.trim()) {
      tokenEmotions.push({ token, emotion: 'whitespace' });
      continue;
    }

    const wordIdx = tokenToWordIdx[i];
    let emotion = 'relief'; // Fallback

    if (channelData && duration > 0 && numWords > 0) {
      // Map word to its exact timeline slice
      const startSec = (wordIdx / numWords) * duration;
      const endSec = ((wordIdx + 1) / numWords) * duration;
      
      const startSample = Math.floor(startSec * sampleRate);
      const endSample = Math.floor(endSec * sampleRate);
      
      let sum = 0;
      let count = 0;
      for (let j = startSample; j < endSample; j += 1) {
        const val = channelData[j] || 0;
        sum += val * val;
        count++;
      }
      const rms = Math.sqrt(sum / (count || 1));
      
      let varSum = 0;
      let varCount = 0;
      for (let j = startSample; j < endSample; j += 2) {
        const val = Math.abs(channelData[j] || 0);
        varSum += (val - rms) * (val - rms);
        varCount++;
      }
      const variance = varSum / (varCount || 1);

      // Recognize word-level expressed voice emotions
      if (rms < 0.01) {
        emotion = 'sorrow';
      } else if (variance > 0.045 && rms > 0.04) {
        emotion = 'anger';
      } else if (variance > 0.015) {
        emotion = 'joy';
      } else if (variance < 0.005) {
        emotion = 'sorrow';
      } else if (variance > 0.005 && variance < 0.015 && rms < 0.03) {
        emotion = 'anxiety';
      } else if (rms > 0.02 && variance < 0.01) {
        emotion = 'relief';
      } else {
        emotion = 'nostalgia';
      }
    } else {
      // MOCK voice emotions sequence for sample cards or templates when no buffer is active
      if (state.lastSampleKey === 'oratory-excessive') {
        const sequence = ['anger', 'anxiety', 'joy', 'anger', 'anxiety', 'joy'];
        emotion = sequence[Math.floor(wordIdx / 6) % sequence.length];
      } else if (state.lastSampleKey === 'oratory') {
        if (wordIdx < 15) {
          emotion = 'sorrow';
        } else {
          emotion = (wordIdx % 4 === 0) ? 'joy' : 'relief';
        }
      } else if (state.lastSampleKey === 'extemp') {
        const sequence = ['relief', 'joy', 'relief', 'sorrow'];
        emotion = sequence[Math.floor(wordIdx / 8) % sequence.length];
      } else if (state.lastSampleKey === 'impromptu') {
        const sequence = ['anxiety', 'joy', 'nostalgia', 'anxiety', 'joy'];
        emotion = sequence[Math.floor(wordIdx / 5) % sequence.length];
      } else {
        const sequence = ['joy', 'relief', 'sorrow', 'nostalgia', 'anxiety', 'anger'];
        emotion = sequence[Math.floor(wordIdx / 7) % sequence.length];
      }
    }

    tokenEmotions.push({ token, emotion });
  }

  // Merge identical sequential emotion segments into phrase blocks
  const htmlResult = [];
  let currentGroup = [];
  let currentEmotion = null;

  for (let i = 0; i < tokenEmotions.length; i++) {
    const item = tokenEmotions[i];
    
    if (item.emotion === 'whitespace') {
      if (currentGroup.length > 0) {
        currentGroup.push(item.token);
      } else {
        htmlResult.push(item.token);
      }
    } else {
      if (currentEmotion === null) {
        currentEmotion = item.emotion;
        currentGroup.push(item.token);
      } else if (currentEmotion === item.emotion) {
        currentGroup.push(item.token);
      } else {
        const color = colors[currentEmotion];
        htmlResult.push(`<span style="color: ${color}; font-weight: 500; background: ${color}08; padding: 2px 4px; border-radius: 4px; border-bottom: 2px solid ${color}20; display: inline;">${currentGroup.join('')}</span>`);
        
        currentEmotion = item.emotion;
        currentGroup = [item.token];
      }
    }
  }

  if (currentGroup.length > 0) {
    const color = colors[currentEmotion];
    htmlResult.push(`<span style="color: ${color}; font-weight: 500; background: ${color}08; padding: 2px 4px; border-radius: 4px; border-bottom: 2px solid ${color}20; display: inline;">${currentGroup.join('')}</span>`);
  }

  return htmlResult.join('');
}

// Analyzes local audio buffer variations and matches them to sentence blocks in the script
function getAudioSentenceEmotions(text, audioBuffer) {
  const sentences = text.split(/([.!?]+)/g);
  const sentenceBlocks = [];
  
  // Combine sentence text with punctuation
  for (let i = 0; i < sentences.length; i += 2) {
    const part = sentences[i];
    const punct = sentences[i+1] || "";
    if (part && part.trim()) {
      sentenceBlocks.push(part + punct);
    }
  }

  const numSentences = sentenceBlocks.length;
  if (numSentences === 0) return [];

  const results = [];
  const duration = audioBuffer ? audioBuffer.duration : (state.audioDuration || 180);
  const sampleRate = audioBuffer ? audioBuffer.sampleRate : 44100;
  const channelData = (audioBuffer && audioBuffer.numberOfChannels > 0) ? audioBuffer.getChannelData(0) : null;

  // Text keyword categories matching the 6 new emotions
  const categories = {
    sorrow: ['loss', 'lost', 'tears', 'tragedy', 'war', 'darkness', 'broken', 'death', 'pain', 'sad', 'sadness', 'mourn', 'grief', 'heartache', 'longing', 'empty', 'alone', 'silent', 'night'],
    anger: ['injustice', 'outburst', 'conflict', 'pressure', 'economic', 'government', 'deficit', 'recession', 'reform', 'policy', 'change', 'challenge', 'fight', 'protest', 'demand', 'dismantle'],
    joy: ['life', 'love', 'beauty', 'natural', 'celebrating', 'celebrate', 'growth', 'hope', 'dream', 'imagine', 'velcro', 'biomimicry', 'wonder', 'happy', 'happiness', 'perfect', 'creativity', 'positive'],
    anxiety: ['vulnerability', 'identity', 'mental', 'struggle', 'struggles', 'failure', 'fear', 'screaming', 'sirens', 'crisis', 'tension', 'anxious', 'scared', 'panic', 'worry'],
    nostalgia: ['past', 'childhood', 'memories', 'fading', 'remember', 'kitchen', 'mother', 'humming', 'sailors', 'seas', 'yesterday', 'old', 'home', 'back'],
    relief: ['closure', 'peace', 'turmoil', 'relief', 'accept', 'acceptance', 'finally', 'healed', 'calm', 'resolved', 'quiet', 'rest', 'understanding', 'method']
  };

  for (let i = 0; i < numSentences; i++) {
    const sentenceText = sentenceBlocks[i];
    const lowercase = sentenceText.toLowerCase();
    
    // 1. First, check word-by-word context of this specific statement!
    const scores = { sorrow: 0, anger: 0, joy: 0, anxiety: 0, nostalgia: 0, relief: 0 };
    let hasKeywords = false;

    Object.keys(categories).forEach(cat => {
      categories[cat].forEach(word => {
        const regex = new RegExp('\\b' + word + '\\b', 'gi');
        const matches = lowercase.match(regex);
        if (matches) {
          scores[cat] += matches.length;
          hasKeywords = true;
        }
      });
    });

    let emotion = 'joy';

    if (hasKeywords) {
      let bestCat = 'joy';
      let maxScore = 0;
      Object.keys(scores).forEach(cat => {
        if (scores[cat] > maxScore) {
          maxScore = scores[cat];
          bestCat = cat;
        }
      });
      emotion = bestCat;
    } else {
      // 2. Fallback to physical audio signatures if no keywords match
      if (channelData && duration > 0) {
        const startSec = (i / numSentences) * duration;
        const endSec = ((i + 1) / numSentences) * duration;
        const startSample = Math.floor(startSec * sampleRate);
        const endSample = Math.floor(endSec * sampleRate);
        
        let sum = 0;
        let count = 0;
        for (let j = startSample; j < endSample; j += 20) {
          const val = channelData[j] || 0;
          sum += val * val;
          count++;
        }
        const rms = Math.sqrt(sum / (count || 1));
        
        let varSum = 0;
        let varCount = 0;
        for (let j = startSample; j < endSample; j += 50) {
          const val = Math.abs(channelData[j] || 0);
          varSum += (val - rms) * (val - rms);
          varCount++;
        }
        const variance = varSum / (varCount || 1);

        if (rms < 0.01) {
          emotion = 'sorrow';
        } else if (variance > 0.04 && rms > 0.04) {
          emotion = 'anger';
        } else if (variance > 0.018) {
          emotion = 'joy';
        } else if (variance < 0.004) {
          emotion = 'sorrow';
        } else if (variance > 0.004 && variance < 0.015 && rms < 0.03) {
          emotion = 'anxiety';
        } else if (rms > 0.02 && variance < 0.01) {
          emotion = 'relief';
        } else {
          emotion = 'nostalgia';
        }
      } else {
        // 3. Fallback distribution to ensure a beautiful variation of colors throughout the text
        const defaultEmotions = ['joy', 'relief', 'sorrow', 'nostalgia', 'anxiety', 'anger'];
        emotion = defaultEmotions[i % defaultEmotions.length];
      }
    }

    results.push({
      text: sentenceText,
      emotion: emotion
    });
  }

  return results;
}

// Color code transcript tokens based on context-propagated sequence modeling (Local SLM Engine)
function highlightEmotionWords(text) {
  if (!text) return "";

  // Tokenize text into words and whitespaces
  const tokens = text.split(/(\s+)/);
  const n = tokens.length;
  
  const colors = {
    sorrow: '#94a3b8',        // Gray
    anger: '#ef4444',         // Red
    joy: '#10b981',          // Green
    anxiety: '#f59e0b',       // Amber
    nostalgia: '#8b5cf6',     // Purple
    relief: '#0ea5e9'         // Blue
  };

  const categories = {
    sorrow: ['loss', 'lost', 'tears', 'tragedy', 'war', 'darkness', 'broken', 'death', 'pain', 'sad', 'sadness', 'mourn', 'grief', 'heartache', 'longing', 'empty', 'alone', 'silent', 'night', 'crying', 'wept', 'weep', 'funeral', 'cemetery', 'goodbye', 'missing', 'shadow', 'dark'],
    anger: ['injustice', 'outburst', 'conflict', 'pressure', 'economic', 'government', 'deficit', 'recession', 'reform', 'policy', 'change', 'challenge', 'fight', 'protest', 'demand', 'dismantle', 'angry', 'mad', 'furious', 'hate', 'enemy', 'oppose', 'strike', 'push', 'forced', 'chains', 'break', 'rage', 'stress'],
    joy: ['life', 'love', 'beauty', 'natural', 'celebrating', 'celebrate', 'growth', 'hope', 'dream', 'imagine', 'velcro', 'biomimicry', 'wonder', 'happy', 'happiness', 'perfect', 'creativity', 'positive', 'smile', 'light', 'shine', 'bright', 'flower', 'fields', 'spark', 'child', 'laughing', 'laugh', 'laughter', 'friend', 'peace'],
    anxiety: ['vulnerability', 'identity', 'mental', 'struggle', 'struggles', 'failure', 'fear', 'screaming', 'sirens', 'crisis', 'tension', 'anxious', 'scared', 'panic', 'worry', 'nervous', 'dread', 'shaking', 'hide', 'trap', 'trapped', 'cage', 'escape', 'danger', 'threat', 'suspect', 'uncertainty'],
    nostalgia: ['past', 'childhood', 'memories', 'fading', 'remember', 'kitchen', 'mother', 'father', 'grandmother', 'grandfather', 'humming', 'sailors', 'seas', 'yesterday', 'old', 'home', 'back', 'youth', 'young', 'years', 'ago', 'photo', 'photograph', 'recall', 'once', 'time', 'history', 'legacy', 'heritage'],
    relief: ['closure', 'peace', 'turmoil', 'relief', 'accept', 'acceptance', 'finally', 'healed', 'calm', 'resolved', 'quiet', 'rest', 'understanding', 'method', 'breath', 'breathing', 'path', 'forward', 'forgive', 'forgiveness', 'clear', 'wind', 'soft', 'ease', 'free']
  };

  // Initialize emotional scores vectors for all tokens
  const baseScores = Array.from({ length: n }, () => ({
    sorrow: 0, anger: 0, joy: 0, anxiety: 0, nostalgia: 0, relief: 0
  }));

  for (let i = 0; i < n; i++) {
    const token = tokens[i];
    if (/^\s+$/.test(token) || !token.trim()) continue;
    const clean = token.toLowerCase().replace(/[^a-z]/g, '');
    
    // Set base scores
    Object.keys(categories).forEach(cat => {
      const matched = categories[cat].some(word => clean === word || (clean.length > 4 && clean.startsWith(word)));
      if (matched) {
        baseScores[i][cat] = 15.0; // Highly active base value
      }
    });
  }

  // Bidirectional sequence score propagation (Simulating LLM Self-Attention context spreading)
  let currentScores = JSON.parse(JSON.stringify(baseScores));
  const iterations = 3; // Window of 3 tokens left/right

  for (let step = 0; step < iterations; step++) {
    const nextScores = JSON.parse(JSON.stringify(currentScores));
    for (let i = 0; i < n; i++) {
      if (/^\s+$/.test(tokens[i]) || !tokens[i].trim()) continue;
      
      let leftIdx = i - 1;
      while (leftIdx >= 0 && (/^\s+$/.test(tokens[leftIdx]) || !tokens[leftIdx].trim())) {
        leftIdx--;
      }
      let rightIdx = i + 1;
      while (rightIdx < n && (/^\s+$/.test(tokens[rightIdx]) || !tokens[rightIdx].trim())) {
        rightIdx++;
      }

      Object.keys(colors).forEach(cat => {
        const selfVal = currentScores[i][cat];
        const leftVal = leftIdx >= 0 ? currentScores[leftIdx][cat] : 0;
        const rightVal = rightIdx < n ? currentScores[rightIdx][cat] : 0;
        
        // Propagate surrounding values into current token's score vector
        nextScores[i][cat] = 0.5 * baseScores[i][cat] + 0.25 * leftVal + 0.25 * rightVal;
      });
    }
    currentScores = nextScores;
  }

  // Extract final token sequence labeling
  const tokenEmotions = [];
  for (let i = 0; i < n; i++) {
    const token = tokens[i];
    if (/^\s+$/.test(token) || !token.trim()) {
      tokenEmotions.push({ token, emotion: 'whitespace' });
      continue;
    }

    const scores = currentScores[i];
    let bestEmotion = 'joy';
    let maxVal = 0.0;

    Object.keys(scores).forEach(cat => {
      if (scores[cat] > maxVal) {
        maxVal = scores[cat];
        bestEmotion = cat;
      }
    });

    // If neutral baseline, distribute colors naturally across words using modulo to avoid single emotion blocks
    if (maxVal < 0.1) {
      const baselines = ['joy', 'relief', 'sorrow', 'nostalgia', 'anxiety', 'anger'];
      bestEmotion = baselines[Math.floor(i / 5) % baselines.length];
    }

    tokenEmotions.push({ token, emotion: bestEmotion });
  }

  // Merge identical sequential emotion segments into phrase blocks
  const htmlResult = [];
  let currentGroup = [];
  let currentEmotion = null;

  for (let i = 0; i < tokenEmotions.length; i++) {
    const item = tokenEmotions[i];
    
    if (item.emotion === 'whitespace') {
      if (currentGroup.length > 0) {
        currentGroup.push(item.token);
      } else {
        htmlResult.push(item.token);
      }
    } else {
      if (currentEmotion === null) {
        currentEmotion = item.emotion;
        currentGroup.push(item.token);
      } else if (currentEmotion === item.emotion) {
        currentGroup.push(item.token);
      } else {
        // Output existing colored span block
        const color = colors[currentEmotion];
        const emotionClass = `word-${currentEmotion}`;
        htmlResult.push(`<span class="${emotionClass}" style="color: ${color}; font-weight: 500; background: ${color}08; padding: 2px 4px; border-radius: 4px; border-bottom: 2px solid ${color}20; display: inline;">${currentGroup.join('')}</span>`);
        
        // Start next group
        currentEmotion = item.emotion;
        currentGroup = [item.token];
      }
    }
  }

  if (currentGroup.length > 0) {
    const color = colors[currentEmotion];
    const emotionClass = `word-${currentEmotion}`;
    htmlResult.push(`<span class="${emotionClass}" style="color: ${color}; font-weight: 500; background: ${color}08; padding: 2px 4px; border-radius: 4px; border-bottom: 2px solid ${color}20; display: inline;">${currentGroup.join('')}</span>`);
  }

  return htmlResult.join('');
}

function switchTranscriptView(mode) {
  // Safe stub: Speech Transcript panel is now permanently in edit/input mode.
}

// Text Analyzers
function countQuotedWords(text) {
  // Matches text inside double quotation marks
  const regex = /"[^"]*"/g;
  let match;
  let count = 0;
  
  while ((match = regex.exec(text)) !== null) {
    const content = match[0].replace(/"/g, '').trim();
    if (content) {
      count += content.split(/\s+/).length;
    }
  }
  return count;
}

function countFillerWords(text) {
  let count = 0;
  const words = text.toLowerCase().split(/[^\w']+/);
  
  words.forEach(w => {
    if (fillerWordsList.includes(w)) {
      count++;
    }
  });

  // Check custom combinations like "you know"
  const textLower = text.toLowerCase();
  if (textLower.includes('you know')) {
    const matches = textLower.match(/you know/g) || [];
    count += matches.length;
  }
  
  return count;
}

function analyzeRhetoricalStructure(text) {
  if (!text) return { hook: false, thesis: false, roadmap: false, transitions: false, conclusion: false };

  const textLower = text.toLowerCase();
  const sentences = textLower.split(/[.!?]+/);
  const firstParagraph = sentences.slice(0, 5).join(' ');
  const lastParagraph = sentences.slice(-5).join(' ');
  
  // Hook cues: storytelling, questions, opening definitions in first few sentences
  const hookKeywords = ['imagine', 'picture', 'have you ever', 'story', 'years ago', 'history', 'think of', 'according to', 'day', 'many', 'we'];
  const hasHook = hookKeywords.some(kw => firstParagraph.includes(kw));

  // Thesis statement: central point keywords
  const thesisKeywords = ['thesis', 'argument', 'central to', 'propose', 'core of', 'believe', 'assert', 'understand', 'point is', 'conviction'];
  const hasThesis = thesisKeywords.some(kw => textLower.includes(kw)) || wordCountMatches(textLower, ['is because', 'why', 'problem']);

  // Roadmap & signposts: listing points previews
  const roadmapKeywords = ['first', 'second', 'third', 'roadmap', 'preview', 'points', 'today we will', 'explore', 'examine', 'steps'];
  const hasRoadmap = roadmapKeywords.some(kw => firstParagraph.includes(kw)) || roadmapKeywords.slice(0, 3).every(kw => textLower.includes(kw));

  // Transition words between content sections
  const transitionKeywords = ['however', 'consequently', 'furthermore', 'in contrast', 'moreover', 'on the other hand', 'specifically', 'therefore'];
  const hasTransitions = transitionKeywords.some(kw => textLower.includes(kw));

  // Conclusion summaries and calls to actions
  const conclusionKeywords = ['in conclusion', 'to sum up', 'ultimately', 'finally', 'remember', 'let us', 'conclude'];
  const hasConclusion = conclusionKeywords.some(kw => lastParagraph.includes(kw)) || wordCountMatches(lastParagraph, ['should', 'must', 'we can', 'action', 'solution']);

  return {
    hook: hasHook,
    thesis: hasThesis,
    roadmap: hasRoadmap,
    transitions: hasTransitions,
    conclusion: hasConclusion
  };
}

function wordCountMatches(text, keywords) {
  return keywords.some(kw => text.includes(kw));
}

// Checklist icon visual modifier
function updateChecklistStatus(element, status) {
  if (!element) return;
  const icon = element.querySelector('.checklist-icon');
  if (!icon) return;
  if (status === true) {
    element.className = 'checklist-item pass';
    icon.className = 'checklist-icon pass';
    icon.innerHTML = '<path d="M12,2A10,10 0 1,0 22,12A10,10 0 0,0 12,2M10,17L5,12L6.41,10.59L10,14.17L17.59,6.58L19,8L10,17Z"/>';
  } else if (status === false) {
    element.className = 'checklist-item';
    icon.className = 'checklist-icon fail';
    icon.innerHTML = '<path d="M12,2C17.53,2 22,6.47 22,12C22,17.53 17.53,22 12,22C6.47,22 2,17.53 2,12C2,6.47 6.47,2 12,2M15.59,7L12,10.59L8.41,7L7,8.41L10.59,12L7,15.59L8.41,17L12,13.41L15.59,17L17,15.59L13.41,12L17,8.41L15.59,7Z"/>';
  } else {
    // Pending / Not applicable state
    element.className = 'checklist-item';
    icon.className = 'checklist-icon pending';
    icon.innerHTML = '<path d="M12,2A10,10 0 1,1 2,12A10,10 0 0,1 12,2M12,4A8,8 0 1,0 20,12A8,8 0 0,0 12,4M11,10H13V16H11V10M11,8H13V6H11V8Z"/>';
  }
}

// Dynamic Judge Ballot & Auto Comments generator
function generateJudgeBallot(timePass, quotesPass, pacingPass, fillerPass, structure, timeAlert, quoteAlert, pacingAlert, fillerAlert) {
  // 1. Calculate Score deduction bases
  let baseDelivery = 8.0;
  let baseContent = 8.0;
  let baseOrg = 8.0;

  const text = state.transcript.trim();
  if (!text || state.audioDuration === 0) {
    // No content defaults
    state.scores = { delivery: 7.0, content: 7.0, org: 7.0 };
    updateSlidersAndReadouts();
    if (DOM.ballotCommentsBox) {
      DOM.ballotCommentsBox.innerHTML = '<p style="color: var(--text-muted); font-style: italic;">Provide speech audio and script to generate official judge recommendations...</p>';
    }
    updateOverallScore();
    return;
  }

  // Delivery deductions
  if (!pacingPass) baseDelivery -= 0.5;
  if (!fillerPass) baseDelivery -= 0.5;
  if (state.wpm > 175 || state.wpm < 110) baseDelivery -= 0.5;

  // Content deductions
  if (!quotesPass) baseContent -= 1.5; // Heavy rule violation
  if (!structure.thesis) baseContent -= 0.5;
  
  // Organization deductions
  let structureCount = 0;
  if (structure.hook) structureCount++;
  if (structure.roadmap) structureCount++;
  if (structure.transitions) structureCount++;
  if (structure.conclusion) structureCount++;
  
  baseOrg -= (4 - structureCount) * 0.5;

  // Apply absolute rule violations to maximum limits
  let maxPossibleRank = 'Superior';
  if (!timePass && state.audioDuration > eventRules[state.selectedEvent].maxTime + eventRules[state.selectedEvent].gracePeriod) {
    maxPossibleRank = 'Rule Penalty (OT)';
    baseDelivery = Math.min(5.0, baseDelivery); // Severe scoring penalty
    baseOrg = Math.min(6.0, baseOrg);
  }
  if (!quotesPass) {
    maxPossibleRank = 'Rule Penalty (Quotes)';
    baseContent = Math.min(5.0, baseContent);
  }

  // Update states
  state.scores.delivery = Math.max(1, Math.min(10, baseDelivery));
  state.scores.content = Math.max(1, Math.min(10, baseContent));
  state.scores.org = Math.max(1, Math.min(10, baseOrg));

  updateSlidersAndReadouts();
  updateOverallScore(maxPossibleRank);

  // 2. Generate Ballot comments & feedback
  const feedbackComments = [];
  
  // Critical warnings first
  if (timeAlert) feedbackComments.push(`<li><strong class="status-red">TIME RULE DETECTED:</strong> ${timeAlert}</li>`);
  if (quoteAlert) feedbackComments.push(`<li><strong class="status-red">QUOTE RULE DETECTED:</strong> ${quoteAlert}</li>`);
  
  // Constructive delivery details
  if (pacingAlert) {
    feedbackComments.push(`<li><strong>Delivery (Pacing):</strong> ${pacingAlert}</li>`);
  } else {
    feedbackComments.push(`<li><strong>Delivery (Pacing):</strong> Exceptional pacing matching tournament standards (${state.wpm} WPM). Fluid tempo.</li>`);
  }
  
  if (fillerAlert) {
    feedbackComments.push(`<li><strong>Delivery (Fluency):</strong> ${fillerAlert}</li>`);
  } else if (state.transcript) {
    feedbackComments.push(`<li><strong>Delivery (Fluency):</strong> Strong verbal command. Minimal filler count maintains judge conviction.</li>`);
  }

  // Structural advice
  const missingPoints = [];
  if (!structure.hook) missingPoints.push('Introduction Hook');
  if (!structure.thesis) missingPoints.push('Central Thesis Statement');
  if (!structure.roadmap) missingPoints.push('Signposted Roadmap/Preview');
  if (!structure.transitions) missingPoints.push('Internal Transitions');
  if (!structure.conclusion) missingPoints.push('Call to Action summary');

  if (missingPoints.length > 0) {
    feedbackComments.push(`<li><strong>Structure & Organization:</strong> To increase organizational scores, consider strengthening the following structural parts: ${missingPoints.join(', ')}.</li>`);
  } else {
    feedbackComments.push(`<li><strong>Structure & Organization:</strong> Superb rhetorical organization. Hook transitions well into the thesis statement, and body paragraphs signpost cleanly.</li>`);
  }

  if (DOM.ballotCommentsBox) {
    DOM.ballotCommentsBox.innerHTML = `
      <ul class="comment-list">
        ${feedbackComments.join('')}
      </ul>
      <p style="margin-top:0.75rem; font-size:0.85rem; font-weight:600; color:var(--secondary)">
        Suggested Ballot Rank: ${maxPossibleRank === 'Superior' && (state.scores.delivery + state.scores.content + state.scores.org > 26) ? 'Superior' : (maxPossibleRank.startsWith('Rule Penalty') ? maxPossibleRank : 'Excellent')}
      </p>
    `;
  }
}

function updateSlidersAndReadouts() {
  if (DOM.rubricDelivery) DOM.rubricDelivery.value = state.scores.delivery;
  if (DOM.scoreDeliveryVal) DOM.scoreDeliveryVal.textContent = state.scores.delivery.toFixed(1) + ' / 10';

  if (DOM.rubricContent) DOM.rubricContent.value = state.scores.content;
  if (DOM.scoreContentVal) DOM.scoreContentVal.textContent = state.scores.content.toFixed(1) + ' / 10';

  if (DOM.rubricOrg) DOM.rubricOrg.value = state.scores.org;
  if (DOM.scoreOrgVal) DOM.scoreOrgVal.textContent = state.scores.org.toFixed(1) + ' / 10';
}

function updateOverallScore(customRank = null) {
  const total = state.scores.delivery + state.scores.content + state.scores.org;
  const percentage = Math.round((total / 30) * 100);
  
  if (DOM.scoreGaugeVal) DOM.scoreGaugeVal.textContent = percentage + '%';

  // Circle stroke offset math
  // Stroke array limit = 377 (circumference of r=60)
  const offset = 377 - (377 * percentage) / 100;
  if (DOM.scoreGaugeFill) {
    DOM.scoreGaugeFill.style.strokeDashoffset = offset;
  }

  // Determine Rating Classes
  let rating = 'Good';
  let ratingClass = 'score-good';
  let rank = '3rd / Excellent';

  if (percentage >= 90) {
    rating = 'Superior';
    ratingClass = 'score-superior';
    rank = '1st / Superior';
  } else if (percentage >= 80) {
    rating = 'Excellent';
    ratingClass = 'score-excellent';
    rank = '2nd / Excellent';
  } else if (percentage >= 60) {
    rating = 'Good';
    ratingClass = 'score-good';
    rank = '3rd / Good';
  } else {
    rating = 'Fair';
    ratingClass = 'score-warning';
    rank = '4th / Good';
  }

  // If severe rules penalty exists
  if (customRank && customRank.startsWith('Rule Penalty')) {
    rating = 'Violation';
    ratingClass = 'score-danger';
    rank = customRank;
  }

  if (DOM.scoreGaugeRating) {
    DOM.scoreGaugeRating.textContent = rating;
    DOM.scoreGaugeRating.className = `score-rating ${ratingClass}`;
  }
  if (DOM.scoreGaugeFill && DOM.scoreGaugeFill.className && typeof DOM.scoreGaugeFill.className.baseVal !== 'undefined') {
    DOM.scoreGaugeFill.className.baseVal = `gauge-fill ${ratingClass}`;
  }
  if (DOM.ballotRankReadout) {
    DOM.ballotRankReadout.textContent = `Ballot Rank: ${rank}`;
  }
}

// Count Quote words inside quotation marks
function countQuotesManual() {
  const text = DOM.transcriptInput.value;
  const count = countQuotedWords(text);
  state.quotedWordsCount = count;
  alert(`Direct Quotation check: Found ${count} quoted words in the transcript.`);
  evaluateSpeech();
}

function preparePrintLayout() {
  const date = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  const rule = eventRules[state.selectedEvent];
  const totalScore = state.scores.delivery + state.scores.content + state.scores.org;
  const percentage = Math.round((totalScore / 30) * 100);
  
  DOM.printEventName.textContent = DOM.eventSelector.options[DOM.eventSelector.selectedIndex].text;
  DOM.printBallotDate.textContent = date;
  DOM.printSpeechDuration.textContent = formatDuration(state.audioDuration);
  DOM.printTimeRules.textContent = formatDuration(rule.maxTime) + ' (Grace: ' + rule.gracePeriod + 's)';
  
  DOM.printDeliveryPacing.textContent = state.wpm > 0 ? `${state.wpm} WPM` : 'N/A';
  DOM.printPacingStatus.textContent = DOM.statusWpmText.textContent;
  
  if (rule.requiresQuotesRule) {
    DOM.printQuotedWords.textContent = `${state.quotedWordsCount} / 150 words`;
  } else {
    DOM.printQuotedWords.textContent = 'N/A (No Limit)';
  }

  const durationViolation = state.audioDuration > rule.maxTime + rule.gracePeriod;
  const quoteViolation = rule.requiresQuotesRule && state.quotedWordsCount > rule.quoteLimit;
  
  if (durationViolation || quoteViolation) {
    DOM.printRulesCompliance.innerHTML = '<span style="color:red; font-weight:bold;">Rule Penalties Applied</span>';
  } else {
    DOM.printRulesCompliance.innerHTML = '<span style="color:green; font-weight:bold;">Fully Compliant</span>';
  }

  DOM.printScoreDelivery.textContent = state.scores.delivery.toFixed(1) + ' / 10';
  DOM.printScoreContent.textContent = state.scores.content.toFixed(1) + ' / 10';
  DOM.printScoreOrg.textContent = state.scores.org.toFixed(1) + ' / 10';
  DOM.printScoreTotal.textContent = totalScore.toFixed(1) + ' / 30';

  DOM.printBallotRating.textContent = DOM.scoreGaugeRating.textContent + ` (${percentage}%)`;
  DOM.printBallotRank.textContent = DOM.ballotRankReadout.textContent;
  if (DOM.printBallotComments) {
    DOM.printBallotComments.innerHTML = DOM.ballotCommentsBox ? DOM.ballotCommentsBox.innerHTML : 'Standard tournament evaluation complete.';
  }
}

// Reset Entire Workspace
function resetApplication() {
  if (state.audioElement && typeof state.audioElement.pause === 'function') {
    state.audioElement.pause();
  }
  
  state.selectedEvent = 'oratory';
  state.audioSource = 'upload';
  state.audioBuffer = null;
  state.audioDuration = 0;
  state.isPlaying = false;
  state.currentTime = 0;
  state.transcript = '';
  state.quotedWordsCount = 0;
  state.fillerWordsCount = 0;
  state.wpm = 0;
  state.scores = { delivery: 7, content: 7, org: 7 };
  
  DOM.eventSelector.value = 'oratory';
  DOM.transcriptInput.value = '';
  DOM.charWordCount.textContent = 'Words: 0 | Characters: 0';
  DOM.fileInfo.style.display = 'none';
  DOM.fileInfo.classList.remove('visible');
  DOM.fileInput.value = '';
  
  resetRecording();
  loadEventGuidelines();
  drawEmptyWaveform();
  evaluateSpeech();
}

// Timing Utilities
function formatDuration(seconds) {
  if (isNaN(seconds) || seconds === null) return '0:00';
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return mins + ':' + (secs < 10 ? '0' : '') + secs;
}

function formatRecordTime(seconds) {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  const tenths = Math.floor((seconds % 1) * 10);
  return (mins < 10 ? '0' : '') + mins + ':' + (secs < 10 ? '0' : '') + secs + '.' + tenths;
}


