export function Footer() {
  return (
    <footer className="border-t bg-card/80 backdrop-blur-sm mt-auto">
      <div className="container mx-auto px-4 py-6 text-center text-sm text-muted-foreground">
        © {new Date().getFullYear()} Vendor Core. All rights reserved.
      </div>
    </footer>
  );
}



