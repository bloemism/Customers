/**
 * DBW 企業ランディングページ専用コピー・画像パス。
 * 本プロジェクト（dbw-lp）は 87app とは別リポジトリ・別デプロイを想定。
 *
 * 画像実体: public/company/
 * GitHub Pages（/DBW/ など）では先頭を import.meta.env.BASE_URL に合わせる（絶対 /company/... だと 404 になる）。
 */
const asset = (path: string) => `${import.meta.env.BASE_URL}${path}`;

export const dbwLandingImages = {
  hero: asset('company/hero-landscape.png'),
  botanismField: asset('company/botanism-field.png'),
  greenhouse: asset('company/greenhouse-aisle.png'),
  fieldRows: asset('company/field-rows.png'),
  botanismMark: asset('company/botanism-mark.png'),
} as const;

export const dbwLandingMeta = {
  documentTitle: 'DBW | 企業情報',
  heroLead:
    '植物が繋ぐ豊かな生活を、デザインとコミュニティ、そして支援のかたちで。',
} as const;

export const dbwMission = {
  label: 'Mission',
  title: '植物が繋ぐ、豊かな暮らしへ',
  body:
    'DBW は、花と緑を通じて人と人、土地と暮らしをつなぐハブです。生産の現場から店舗、学びとコミュニティ、そして社会への支援までをひとつの志で支えます。',
} as const;

export type TimelineEntry = { period: string; text: string };

export type CompanySocialKind = 'instagram' | 'youtube';

export type CompanySocialEntry = {
  kind: CompanySocialKind;
  href: string;
  ariaLabel: string;
};

export const debloemenWinkel = {
  label: 'Fresh flowers',
  nameEn: 'De Bloemen winkel',
  nameJa: 'ブルームンウインクル',
  tagline: '生花によるデザイン、制作、販売。産地の息吹を束ね、日々のシーンに寄り添う花を届けます。',
  social: [
    {
      kind: 'instagram' as const,
      href: 'https://www.instagram.com/bloemism/',
      ariaLabel: 'ブルームンウインクル（Instagram）',
    },
  ] satisfies CompanySocialEntry[],
  timeline: [
    { period: '1999年11月', text: 'スタート。' },
    { period: '2000年4月', text: '東京都港区白金台に店舗を構える。' },
    { period: '2004年', text: '白金台・杉の木屋内に2店舗目を構える。' },
    { period: '2005年', text: 'アトリエとして再スタート。' },
    { period: '2007年', text: '港区田町にアトリエを構える。' },
    { period: '現在', text: '世田谷区にて営業。' },
  ] satisfies TimelineEntry[],
  highlights: [
    '『花時間』や『フローリスト』などの花雑誌をはじめ、さまざまな雑誌に作品を掲載。',
    '2005年、TV東京「誰でもピカソ」に出演。',
    '玉川高島屋にて、東日本大震災から1年の復興を祈り、桜などで約1か月の装飾を実施。',
    '正月には根付きの松などを用い、3か所にわたる正月装飾をプロデュース。',
    '10年以上にわたり、玉川高島屋内のたまがわコミュニティにて「季節と色彩の花講座」を担当。',
    '近年は日本花き輸出協会の依頼により、モスクワ・ジャカルタ・ドバイ・中国などでデモンストレーションを実施。カタール花博では日本政府館の装飾を手がける。',
  ],
} as const;

export const botanism = {
  label: 'Community & media',
  name: 'Botanism',
  nameJa: 'ボタニズム',
  lead:
    '新しい植物主義者へ。植物の楽しみ方や知識、つながりを育む情報とコミュニティを構想しています。',
  social: [
    {
      kind: 'instagram' as const,
      href: 'https://www.instagram.com/botanism.web',
      ariaLabel: 'Botanism（Instagram）',
    },
    {
      kind: 'youtube' as const,
      href: 'https://www.youtube.com/@Botanism2011',
      ariaLabel: 'Botanism（YouTube）',
    },
  ] satisfies CompanySocialEntry[],
  paragraphs: [
    '2011年より、ウェブサイトで生産者情報や花をモチーフにした作家の情報などを、自ら取材・撮影・執筆し公開してきました。10名以上の各地の生産者を紹介しています。旧公式サイト（www.botanism.com）は昨年削除しており、現在公開中のサイトはありません。',
    '仲卸のブースを2年間借り、週2回の販売では産地情報を載せながら販売。値段交渉をしながら、新しい開花タイミングで流通に乗りにくい花も紹介しました。',
    '2025年より、退院を機に新しい段階へのアプローチとして進化を図り、アプリ化を目指して自ら開発。87app として、全国的な「花のある生活」の展開を模索しています。',
  ],
} as const;

export const flowerDisasterFund = {
  label: 'Support',
  title: '花き自然災害支援基金',
  intro:
    '2014年2月14日、関東甲信越の大雪によるハウス倒壊などを契機に生まれました。台風や豪雪などの自然災害で甚大な被害を受けた花き・園芸農家の事業再建を支援するために設立された基金です。',
  activities:
    '広島の土砂崩れ、北九州の土砂崩れ、熊本震災、北海道震災、台風による被害などを受け、花き栽培者支援の活動を行ってきました。',
  role:
    'この基金は、公的な支援だけではカバーしきれない被害に対し、業界全体で支え合う仕組みとして機能しています。主な概要は以下の通りです。',
  backgroundHeading: '設立の背景',
  background:
    '2019年の台風15号など、近年激甚化する自然災害により壊滅的な打撃を受けた農家を救済するため、クラウドファンディングなどを通じて広く寄付が募られました。',
  targetHeading: '支援対象',
  target:
    '観賞用の植物（切り花、鉢もの、観葉植物、盆栽など）を栽培し、被災した花き農家が対象となります。',
  supportHeading: '支援内容',
  supportItems: [
    '被災した生産施設の復旧支援。',
    '苗や資材の購入費など、次期作に向けた経営再建資金の補助。',
    'ハウスの撤去ボランティアには多くの花店スタッフが関わり、補助金申請に必要なハウス撤去後の更地条件と期限を満たせるよう現場を支えました。',
  ],
} as const;
