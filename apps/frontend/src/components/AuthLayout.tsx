import { Link, Outlet } from 'react-router-dom';
import { LogIn } from 'lucide-react';
import { Logo } from './Logo';

interface AuthLayoutProps {
  heroImage?: string;
  heroTitle?: string;
  heroSubtitle?: string;
  showLoginLink?: boolean;
}

export function AuthLayout({
  heroImage = '/assets/pic2.png',
  heroTitle = 'Professional Fire Safety Infrastructure.',
  heroSubtitle = 'Join the vanguard of facility protection. Our mission-critical monitoring suite ensures life-safety data is authoritative, accessible, and always vigilant.',
  showLoginLink = true,
}: AuthLayoutProps) {
  return (
    <div className="min-h-screen bg-background lg:grid lg:grid-cols-2">
      <div className="flex flex-col px-4 py-6 sm:px-8 lg:px-12">
        <header className="flex items-center justify-between">
          <Logo to="/" />
          {showLoginLink && (
            <Link
              to="/login"
              className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted hover:text-text"
            >
              Login <LogIn className="h-4 w-4" />
            </Link>
          )}
        </header>

        <div className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center py-8">
          <Outlet />
        </div>

        <p className="text-xs text-muted">
          SYSTEM V4.2.0 · ENCRYPTED CONNECTION · © {new Date().getFullYear()} TWZ LTD
        </p>
      </div>

      <div
        className="relative hidden min-h-screen lg:block"
        style={{
          backgroundImage: `linear-gradient(to right, #101418 0%, transparent 40%), url(${heroImage})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      >
        <div className="absolute inset-0 bg-background/40" />
        <div className="relative flex h-full flex-col justify-end p-12">
          <div className="mb-3 h-1 w-12 bg-primary" />
          <p className="text-xs font-semibold uppercase tracking-widest text-primary">
            Industrial Standard
          </p>
          <h2 className="mt-4 max-w-lg text-3xl font-bold leading-tight text-text">{heroTitle}</h2>
          <p className="mt-4 max-w-md text-sm leading-relaxed text-muted">{heroSubtitle}</p>
        </div>
      </div>
    </div>
  );
}
