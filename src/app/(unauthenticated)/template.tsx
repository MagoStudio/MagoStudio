export default function ContentLayout({
  children
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="h-screen min-h-screen overflow-hidden bg-cover bg-no-repeat bg-[url('/assets/images/preview-background.png')]">
      <main className="flex flex-col h-full w-full min-h-full" role="main">
        {children}
      </main>
    </div>
  );
}
