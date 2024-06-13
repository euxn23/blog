type Entry = {
  date: string;
  title: string;
  media: string;
  url: string;
};

const DW_ENTRIES: Entry[] = [
  {
    date: '2024-05-11',
    title: 'Powerfully Typed TypeScript',
    media: 'TSKaigi 2024',
    url: 'https://speakerdeck.com/euxn23/powerfully-typed-typescript'
  },
  {
    date: "2024-05-10",
    title: "pnpm の node_modules を探検して理解しよう",
    media: "ドワンゴ教育サービス開発者ブログ",
    url: "https://blog.nnn.dev/entry/2024/05/10/110000",
  },
  {
    date: "2023-12-20",
    title: "レガシーブラウザ向けのビルドオプションを剪定する",
    media: "ドワンゴ教育サービス開発者ブログ",
    url: "https://blog.nnn.dev/entry/2023/12/20/170000",
  },
];

const ZENN_URL = "https://zenn.dev";

export async function getOtherWorks() {
  const { articles: zennArticles } = await fetch(
    "https://zenn.dev/api/articles?username=euxn23&order=latest"
  ).then((res) => res.json());
  const zennEntries = zennArticles.map((article: any) => {
    const date = new Date(article.published_at);
    return {
      date: `${date.getFullYear()}-${`0${date.getMonth() + 1}`.slice(-2)}-${`0${date.getDate()}`.slice(-2)}`,
      title: article.title,
      media: "Zenn",
      url: `${ZENN_URL}${article.path}`,
    };
  });

  return [...DW_ENTRIES, ...zennEntries].sort((a, b) =>
    a.date > b.date ? -1 : 1
  );
}
