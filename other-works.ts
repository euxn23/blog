type Entry = {
  date: string;
  title: string;
  media: string;
  url: string;
};

const DW_ENTRIES: Entry[] = [
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
      date: `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`,
      title: article.title,
      media: "Zenn",
      url: `${ZENN_URL}${article.path}`,
    };
  });

  return [...DW_ENTRIES, ...zennEntries].sort((a, b) =>
    a.date > b.date ? -1 : 1
  );
}
