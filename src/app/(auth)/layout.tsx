// Auth route-group layout — passthrough fragment.
// Root layout owns <html>/<body>/ThemeProvider/Nav; no duplication here.
export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
