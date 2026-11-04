// app/tools/layout.tsx

export default function ToolsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      {/* Load Bootstrap 5 for all interactive calculator components */}
      <link 
        href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css" 
        rel="stylesheet" 
      />
      {children}
    </>
  );
}