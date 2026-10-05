export const metadata = {
  title: "Project Hub",
  description: "Private project directory"
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
