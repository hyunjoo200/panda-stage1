/* =====================================================================
   중국어 탐험대 · 대나무 언덕 2차시 — 설정 파일 (game-data.js)
   ---------------------------------------------------------------------
   선생님이 고쳐도 되는 곳은 이 파일뿐입니다.
   - 따옴표(' ') 안의 글자와 숫자만 바꾸고, 쉼표(,)와 괄호는 지우지 마세요.
   - GitHub에서 이 파일을 열고 연필(✏️) 버튼으로 고친 뒤 Commit changes 하면 반영됩니다.
   ===================================================================== */

window.GAME_DATA = {

  /* ---------- 1. 이름과 문구 ---------- */
  saveKey: 'panda-stage1-lesson2',   // 이 기기에 저장할 때 쓰는 이름 (바꾸지 않아도 돼요)
  stageLabel: 'STAGE 01 · 2차시',
  title: '대나무 언덕의 비밀 2',
  subtitle: '언덕 위의 인사말 문지기',
  nextStage: 'STAGE 02 · 이름표 마을',
  nextStageLine: '아직 열리지 않았어요! 다음 시간에도 老师好로 인사하며 만나요.',
  story: [
    '판다 탐험가가 다시 대나무 언덕에 왔어요. 老师好!',
    '이번에는 언덕 꼭대기의 문으로 가야 해요. 그런데 언덕 중간에 대나무 괴물이 길을 막고 있대요!',
    '종을 울리며 오늘 배운 인사말을 모으고, 대나무 괴물의 문제를 풀어 문을 열어 주세요.'
  ],

  /* ---------- 2. 점수 ---------- */
  points: { firstTry: 100, retry: 60, bossFirstTry: 150, bossRetry: 90, star: 10, bump: 10, stomp: 20 },

  /* ---------- 3. 중국어 음성 ----------
     audio 폴더에 같은 이름의 MP3(예: audio/tou.mp3)가 있으면 그 파일을 먼저 씁니다.
     없으면 온라인 자동 음성 → 기기 내장 음성 순서로 씁니다. (검수 전 임시 음성)   */
  audio: {
    useLocalFiles: true,
    useOnlineVoice: true,
    onlineVoiceUrl: 'https://translate.google.com/translate_tts?ie=UTF-8&tl=zh-CN&client=tw-ob&q=',
    slowRate: 0.7,
    sounds: {
      // 인사말 (수정된 2차시 PPT)
      xiexie:    { text: '谢谢',   pinyin: 'xièxie',       meaning: '고마워요' },
      bukeqi:    { text: '不客气', pinyin: 'bú kèqi',      meaning: '천만에요' },
      duibuqi:   { text: '对不起', pinyin: 'duìbuqǐ',      meaning: '미안해요' },
      meiguanxi: { text: '没关系', pinyin: 'méi guānxi',   meaning: '괜찮아요' },
      zaoshanghao:{ text: '早上好', pinyin: 'zǎoshang hǎo', meaning: '좋은 아침이에요' },
      zaijian:   { text: '再见',   pinyin: 'zàijiàn',      meaning: '안녕(헤어질 때)' },
      mingtianjian:{ text: '明天见', pinyin: 'míngtiān jiàn', meaning: '내일 만나요' },
      wanan:     { text: '晚安',   pinyin: 'wǎn’ān',       meaning: '잘 자요' },
      laoshihao: { text: '老师好', pinyin: 'lǎoshī hǎo',   meaning: '선생님, 안녕하세요' }
    }
  },

  /* ---------- 4. 소리의 종 ---------- */
  missions: [
    { id: 'b3', type: 'choiceText', sound: 'xiexie', place: '연필 종',
      scene: '🐻 ✏️ ➡️ 🐼  "谢谢!"',
      question: '곰이 연필을 빌려줬더니 판다가 "谢谢!"라고 했어요. 곰은 뭐라고 대답할까요?',
      options: [
        { text: '不客气', sub: 'bú kèqi', sound: 'bukeqi', correct: true },
        { text: '没关系', sub: 'méi guānxi', sound: 'meiguanxi' },
        { text: '晚安', sub: 'wǎn’ān', sound: 'wanan' }
      ],
      hint: '고맙다는 말에는 "천만에요"라고 대답해요.', reward: '연필' },
    { id: 'b4', type: 'choiceText', sound: 'duibuqi', place: '공책 종',
      scene: '🐼 💥📓 🐰  "对不起!"',
      question: '판다가 실수로 토끼 공책을 떨어뜨리고 "对不起!"라고 했어요. 토끼는 뭐라고 대답할까요?',
      options: [
        { text: '没关系', sub: 'méi guānxi', sound: 'meiguanxi', correct: true },
        { text: '不客气', sub: 'bú kèqi', sound: 'bukeqi' },
        { text: '早上好', sub: 'zǎoshang hǎo', sound: 'zaoshanghao' }
      ],
      hint: '미안하다는 말에는 "괜찮아요"라고 다독여 줘요.', reward: '공책' },
    { id: 'b5', type: 'matchScenes', place: '해와 달 종',
      question: '인사말을 눌러 듣고, 어울리는 그림에 놓아요.',
      pairs: [
        { scene: '☀️🏫', label: '아침에 학교에서 만났어요', sound: 'zaoshanghao' },
        { scene: '🌙🛏️', label: '잠자리에 들어요', sound: 'wanan' },
        { scene: '📅 1 → 2', label: '내일 또 만나기로 했어요', sound: 'mingtianjian' }
      ],
      hint: '해와 학교는 아침, 달과 침대는 잠자기 전, 달력은 내일이에요.', reward: '해와 달 배지' }
  ],

  /* ---------- 5. 언덕의 대나무 괴물 (마지막 문제) ----------
     인사말 탐정: 대답이 상황에 어울리면 O, 어울리지 않으면 X                          */
  boss: {
    name: '대나무 괴물',
    intro: '하하하! 오늘 수업을 잘 했다면 이 문제도 풀 수 있겠지. 이 문제를 풀어야 오늘 수업이 끝난다! 하하하!',
    notReady: '흐흠, 아직 울리지 않은 종이 있구나. 종을 모두 울리고 다시 오너라!',
    wrongLine: '하하, 다시 생각해 보거라!',
    outro: '역시 훌륭한 학생이군. 다음 시간에도 기대가 되네.',
    rounds: [
      { scene: '🐼 💥📓 🐰', situation: '판다가 토끼 공책을 떨어뜨렸어요.',
        a: 'duibuqi', b: 'bukeqi', answer: 'X', fix: 'meiguanxi',
        hint: '不客气는 고맙다는 말에 하는 대답이에요.' },
      { scene: '🌙🛏️', situation: '잠자리에 들기 전이에요.',
        a: 'zaoshanghao', b: 'wanan', answer: 'X', fix: 'wanan',
        hint: '해가 아니라 달과 침대가 보여요. 아침 인사가 어울릴까요?' },
      { scene: '📅 1 → 2', situation: '두 친구가 내일 또 만나기로 했어요.',
        a: 'mingtianjian', b: 'mingtianjian', answer: 'O',
        hint: '明天은 "내일", 见은 "만나다"라는 뜻이에요.' }
    ]
  },

  /* ---------- 6. 조작과 길 안내 ---------- */
  runSpeed: 250,
  jumpPower: 650,
  friendSpeed: 40,
  guideAfterSeconds: 15
};
