export const metadata = {
  title: "顔診断",
  description: "AIによる顔型診断アプリ",
};

export default function RootLayout({ children }) {
  return (
    <html lang="ja">
      <body style={{ margin: 0, background: "#0e0e0e" }}>{children}</body>
    </html>
  );
}
