import { NavbarProjectTitle } from "../Navbar/NavbarProjectTitle";

export const OnboardingNavbar: React.FC = () => (
  <div className="relative z-10 w-full">
    <header className="mx-auto w-full bg-surface-primary">
      <nav className="relative flex h-toolbar items-center border-b border-glyph-invert-main px-3 text-glyph-secondary">
        <img alt="Mago" src="/logo.svg" className="inline-block h-6 shrink-0" />
        <NavbarProjectTitle />
      </nav>
    </header>
  </div>
);
