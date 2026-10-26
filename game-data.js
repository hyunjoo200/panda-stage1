/* =====================================================================
   중국어 탐험대 STAGE 01 · 대나무 언덕의 비밀 — 설정 파일 (game-data.js)
   ---------------------------------------------------------------------
   선생님이 고쳐도 되는 곳은 이 파일뿐입니다.
   - 따옴표(' ') 안의 글자와 숫자만 바꾸고, 쉼표(,)와 괄호는 지우지 마세요.
   - 저장한 뒤 GitHub에 이 파일만 다시 올리면 게임에 반영됩니다.
   ===================================================================== */

window.GAME_DATA = {

  /* ---------- 0. 몇 구역까지 할까요? ----------
     3 = 성조 숲 + 소리 마을 + 인사 다리 (약 9~11분)
     2 = 성조 숲 + 소리 마을 (약 6~7분)
     1 = 성조 숲만 (약 3~4분, 수업 중 5분 복습 시간에 맞음)                    */
  playZones: 3,

  /* ---------- 1. 이름과 문구 ---------- */
  stageLabel: 'STAGE 01',
  title: '대나무 언덕의 비밀',
  subtitle: '사라진 소리와 첫 인사',
  nextStage: 'STAGE 02 · 이름표 마을',
  nextStageLine: '아직 열리지 않았어요! 다음 시간에는 老师好로 인사하며 만나요.',
  story: [
    '판다 탐험가가 대나무 언덕에 도착했어요.',
    '그런데 숲의 소리가 사라져 언덕의 문들이 모두 잠겨 버렸어요!',
    '성조 숲, 소리 마을, 인사 다리를 지나며 종을 울리고 문을 열어 주세요.'
  ],

  /* ---------- 2. 점수 ----------
     학습 점수(중국어 문제)와 별 점수(달리기)는 따로 계산합니다.
     숲속 친구와 부딪히면 '별 점수'만 줄어들고, 학습 점수는 절대 줄지 않아요. */
  points: { firstTry: 100, retry: 60, bonusFirstTry: 50, bonusRetry: 30, star: 10, bump: 10 },

  /* ---------- 3. 중국어 음성 ----------
     ① audio 폴더에 같은 이름의 MP3(예: audio/ma1.mp3)가 있으면 그 파일을 먼저 씁니다.
     ② 없으면 온라인 자동 음성 → ③ 기기 내장 음성 순서로 씁니다. (②③은 검수 전 임시 음성)
     tone: 한 글자 소리의 성조 번호 (1~4)                                         */
  audio: {
    useLocalFiles: true,
    useOnlineVoice: true,
    onlineVoiceUrl: 'https://translate.google.com/translate_tts?ie=UTF-8&tl=zh-CN&client=tw-ob&q=',
    slowRate: 0.7,
    sounds: {
      // 성조 ma
      ma1: { text: '妈', pinyin: 'mā', tone: 1 },
      ma2: { text: '麻', pinyin: 'má', tone: 2 },
      ma3: { text: '马', pinyin: 'mǎ', tone: 3 },
      ma4: { text: '骂', pinyin: 'mà', tone: 4 },
      // 听·说 그림 발음 (PPT 19~22쪽)
      bi:   { text: '笔', pinyin: 'bǐ',   tone: 3, pic: '✏️' },
      pao:  { text: '跑', pinyin: 'pǎo',  tone: 3, pic: '🏃' },
      mian: { text: '面', pinyin: 'miàn', tone: 4, pic: '🍜' },
      fan:  { text: '饭', pinyin: 'fàn',  tone: 4, pic: '🍚' },
      du:   { text: '读', pinyin: 'dú',   tone: 2, pic: '📖' },
      ting: { text: '听', pinyin: 'tīng', tone: 1, pic: '👂' },
      niu:  { text: '牛', pinyin: 'niú',  tone: 2, pic: '🐮' },
      lei:  { text: '累', pinyin: 'lèi',  tone: 4, pic: '😮‍💨' },
      gou:  { text: '狗', pinyin: 'gǒu',  tone: 3, pic: '🐶' },
      kan:  { text: '看', pinyin: 'kàn',  tone: 4, pic: '📺' },
      he:   { text: '喝', pinyin: 'hē',   tone: 1, pic: '🥤' },
      jia:  { text: '家', pinyin: 'jiā',  tone: 1, pic: '🏠' },
      qiu:  { text: '球', pinyin: 'qiú',  tone: 2, pic: '⚽' },
      xi:   { text: '洗', pinyin: 'xǐ',   tone: 3, pic: '🧼' },
      // 문장과 인사 (PPT 12~14, 25~33쪽)
      mamamama:      { text: '妈妈骂马', pinyin: 'māma mà mǎ' },
      nihao:         { text: '你好',     pinyin: 'nǐ hǎo' },
      wohenhao:      { text: '我很好',   pinyin: 'wǒ hěn hǎo' },
      nimenhao:      { text: '你们好',   pinyin: 'nǐmen hǎo' },
      laoshihao:     { text: '老师好',   pinyin: 'lǎoshī hǎo' },
      tongxuemenhao: { text: '同学们好', pinyin: 'tóngxuémen hǎo' },
      hao:           { text: '好',       pinyin: 'hǎo' }
    }
  },

  /* ---------- 4. 구역과 미션 ----------
     각 미션의 place(장소 이름), question(질문), hint(힌트), reward(얻는 물건)는 자유롭게 고쳐도 돼요. */
  zones: [
    {
      id: 'forest', name: '성조 숲', theme: 'forest', gate: '대나무 문',
      missions: [
        { id: 'm1', type: 'toneButtons', sound: 'ma1', place: '바람의 종',
          question: '종이 울린 소리는 몇 성일까요?',
          hint: '소리의 높이가 처음부터 끝까지 같았나요, 변했나요?', reward: 'mā 조각' },
        { id: 'm2', type: 'contourCards', sound: 'ma2', place: '구름 계단 종',
          question: '들은 소리의 높낮이와 같은 그림을 고르세요.',
          hint: '중간에서 높게, 끝이 올라가는 선을 찾아보세요.', reward: 'má 조각' },
        { id: 'm3', type: 'pandaChoir', sound: 'ma3', choices: 3, place: '판다 합창단 종',
          question: 'mǎ 라고 말하는 판다를 찾아 주세요!',
          hint: '3성은 낮아졌다가 다시 올라와요. 한 마리씩 다시 들어 보세요.', reward: 'mǎ 조각' },
        { id: 'm4', type: 'fragments', sound: 'ma4', choices: 3, place: '돌다리 종',
          question: '돌판에 적힌 소리와 같은 조각을 끼워 주세요.',
          hint: '4성은 높은 곳에서 짧게 아래로 떨어져요.', reward: 'mà 조각' },
        { id: 'm5', type: 'numberCode', place: '소리 암호 종',
          question: '세 소리를 차례로 듣고, 성조 번호를 순서대로 눌러 암호를 풀어요.',
          // 수업 PPT 15~18쪽 채팅 문제와 같은 소리 묶음
          sets: [ ['ma2','ma4','ma1'], ['ma3','ma1','ma4'] ],
          hint: '한 소리씩 끊어서 다시 들어 보세요. 손가락으로 높낮이를 그려 봐도 좋아요.', reward: '숲의 열쇠' }
      ]
    },
    {
      id: 'village', name: '소리 마을', theme: 'village', gate: '마을 문',
      missions: [
        { id: 'm6', type: 'toneButtons', sound: 'niu', place: '목장 종',
          question: '그림 단어의 소리는 몇 성일까요?',
          hint: '중간에서 높게 올라갔나요?', reward: '소 방울' },
        { id: 'm7', type: 'hearPick', sound: 'pao', options: ['bi','pao','mian','fan'], place: '시장 종',
          question: '들은 소리의 그림을 골라요.',
          hint: 'bǐ와 pǎo는 첫소리가 달라요. p는 숨이 \'푸\' 하고 세게 나와요.', reward: '시장 쪽지' },
        { id: 'm8', type: 'contourCards', sound: 'kan', place: '텔레비전 종',
          question: '그림 단어의 소리와 같은 높낮이 그림을 고르세요.',
          hint: '높은 곳에서 짧게 떨어졌나요?', reward: '안경' },
        { id: 'm9', type: 'toneSort', items: ['jia','qiu','xi','fan'], place: '성조 바구니 종',
          question: '단어를 눌러 소리를 듣고, 알맞은 성조 바구니에 넣어요.',
          hint: '바구니의 선 모양과 소리의 높낮이를 비교해 보세요.', reward: '성조 바구니' },
        { id: 'm10', type: 'choiceText', sound: 'mamamama', place: '말 목장 종',
          scene: '👩 🐴',
          question: '妈妈骂马 (엄마가 말을 꾸짖어요). 들은 소리와 같은 병음을 골라요.',
          options: [
            { text: 'māma mà mǎ', correct: true },
            { text: 'mā mā mà mǎ' },
            { text: 'māma mǎ mà' }
          ],
          hint: '妈妈의 두 번째 ma는 짧고 가볍게 읽어요(경성). 그리고 꾸짖는 mà가 먼저 나와요.', reward: '말 편자' }
      ]
    },
    {
      id: 'bridge', name: '인사 다리', theme: 'bridge', gate: '인사 문',
      missions: [
        { id: 'm11', type: 'choiceText', sound: 'tongxuemenhao', place: '교실 종',
          scene: '👩‍🏫 💬 同学们好!',
          question: '선생님이 "同学们好!"라고 인사했어요. 뭐라고 대답할까요?',
          options: [
            { text: '老师好', sub: 'lǎoshī hǎo', sound: 'laoshihao', correct: true },
            { text: '你们好', sub: 'nǐmen hǎo', sound: 'nimenhao' },
            { text: '我很好', sub: 'wǒ hěn hǎo', sound: 'wohenhao' }
          ],
          hint: '선생님께 드리는 인사예요. 老师는 선생님이라는 뜻이에요.', reward: '교실 종' },
        { id: 'm12', type: 'choiceText', place: '광장 종',
          scene: '🐼 👋 🧒🧒🧒',
          question: '친구 여러 명에게 한꺼번에 인사할 때는?',
          options: [
            { text: '你好', sub: 'nǐ hǎo', sound: 'nihao' },
            { text: '你们好', sub: 'nǐmen hǎo', sound: 'nimenhao', correct: true },
            { text: '老师好', sub: 'lǎoshī hǎo', sound: 'laoshihao' }
          ],
          hint: '한 사람에게는 你好, 여러 사람에게는 们이 들어간 인사를 해요.', reward: '손 흔들기 배지' },
        { id: 'm13', type: 'choiceText', sound: 'wohenhao', place: '안부 종',
          scene: '🐼 💬 ?',
          question: '판다가 한 말은 무슨 뜻일까요?',
          options: [
            { text: '나는 잘 지내요', correct: true },
            { text: '여러분, 안녕하세요' },
            { text: '선생님, 안녕하세요' }
          ],
          hint: '我는 \'나\', 好는 \'좋다\'는 뜻이에요.', reward: '미소 배지' },
        { id: 'm14', type: 'hanziBuild', place: '한자 종',
          question: '오늘의 한자 好(좋을 호)를 만들어요. 두 조각을 왼쪽부터 차례로 눌러요.',
          pieces: ['子', '口', '女', '木'], answer: ['女', '子'], result: '好', resultSound: 'hao',
          hint: '好는 왼쪽에 女, 오른쪽에 子가 나란히 있어요.', reward: '好 도장' }
      ]
    }
  ],

  /* 보너스 상자: 소리 마을의 높은 발판 위 (안 풀어도 문은 열려요) */
  bonus: {
    id: 'bonus', type: 'sequence', place: '하늘 위 대나무 상자',
    question: '세 소리를 이어서 들어요. 성조 순서가 맞는 것을 고르세요.',
    // PPT 36쪽 '妈骂马，马骂妈'
    sets: [ { sounds: ['ma1','ma4','ma3'], label: '妈 骂 马' }, { sounds: ['ma3','ma4','ma1'], label: '马 骂 妈' } ],
    options: [ ['1','4','3'], ['3','4','1'], ['1','3','4'], ['4','1','3'] ],
    hint: '첫 소리부터 하나씩 손가락으로 높낮이를 그려 보세요.', reward: '황금 대나무'
  },

  /* ---------- 5. 조작과 길 안내 ---------- */
  runSpeed: 250,
  jumpPower: 650,
  friendSpeed: 40,       // 숲속 친구가 움직이는 속도
  guideAfterSeconds: 15  // 이 시간 동안 새 종을 못 찾으면 화살표 안내
};
