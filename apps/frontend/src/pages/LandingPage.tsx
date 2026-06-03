import { Link } from 'react-router-dom';
import {
  ArrowRight,
  BarChart3,
  Building2,
  ClipboardCheck,
  Radio,
  Shield,
  Users,
} from 'lucide-react';
import { Logo } from '@/components/Logo';

const features = [
  {
    icon: Radio,
    title: 'Real-time Telemetry',
    desc: 'Monitor extinguisher health 24/7 with instant alerts when equipment expires or fails inspection.',
  },
  {
    icon: Shield,
    title: 'Regulatory Compliance',
    desc: 'Automated audit logs, inspection trails, and exportable reports aligned with fire safety codes.',
  },
  {
    icon: ClipboardCheck,
    title: 'Smart Asset Tracking',
    desc: 'Serial-number registry, maintenance history, and scheduled inspections across every facility zone.',
  },
];

const roles = [
  {
    icon: Users,
    title: 'Enterprise Admin',
    desc: 'Manage users, fleet inventory, data integrity, and system-wide compliance reports.',
  },
  {
    icon: ClipboardCheck,
    title: 'Field Inspector',
    desc: 'Conduct inspections, log PASS/FAIL results, schedule maintenance, and notify personnel.',
  },
  {
    icon: Building2,
    title: 'Facility Manager',
    desc: 'View extinguisher status, schedule inspections, and download PDF/CSV compliance reports.',
  },
];

export function LandingPage() {
  return (
    <div className="min-h-screen bg-background">
      <header className="glass-panel sticky top-0 z-20 border-b border-border">
        <div className="page-container flex h-16 items-center justify-between">
          <Logo />
          <nav className="hidden items-center gap-8 text-sm text-muted md:flex">
            <a href="#platform" className="hover:text-text">
              Platform
            </a>
            <a href="#roles" className="hover:text-text">
              Roles
            </a>
            <a href="#data" className="hover:text-text">
              Reports
            </a>
          </nav>
          <div className="flex items-center gap-3">
            <Link to="/login" className="btn-ghost hidden sm:inline-flex">
              Log In
            </Link>
            <Link to="/register" className="btn-primary text-sm">
              Get Started
            </Link>
          </div>
        </div>
      </header>

      <section className="relative overflow-hidden">
        <div
          className="absolute inset-0 bg-cover bg-center opacity-30"
          style={{ backgroundImage: 'url(/assets/land_page.png)' }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-background/60 via-background/90 to-background" />
        <div className="page-container relative py-20 sm:py-28 lg:py-36">
          <p className="text-xs font-semibold uppercase tracking-widest text-primary">
            TWZ Ltd · Fire Safety Platform
          </p>
          <h1 className="mt-4 max-w-3xl text-4xl font-bold leading-tight tracking-tight sm:text-5xl lg:text-6xl">
            Protecting industrial assets with{' '}
            <span className="text-primary">unfailing precision.</span>
          </h1>
          <p className="mt-6 max-w-xl text-lg text-muted">
            Mission-critical fire extinguisher lifecycle management for large commercial and
            industrial facilities — inspections, maintenance, and compliance in one microservices
            platform.
          </p>
          <div className="mt-10 flex flex-wrap gap-4">
            <Link to="/register" className="btn-primary">
              Get Started Now <ArrowRight className="h-4 w-4" />
            </Link>
            <a href="#platform" className="btn-secondary">
              Explore Platform
            </a>
          </div>
        </div>
      </section>

      <section id="platform" className="border-t border-border py-20">
        <div className="page-container">
          <h2 className="text-center text-3xl font-bold">Engineered for Reliability</h2>
          <p className="mx-auto mt-3 max-w-2xl text-center text-muted">
            Built for TWZ Ltd to replace monolithic limitations with real-time visibility across
            your extinguisher fleet.
          </p>
          <div className="mt-12 grid gap-6 md:grid-cols-3">
            {features.map((f) => (
              <div key={f.title} className="card-surface border-l-4 border-l-accent p-6">
                <f.icon className="h-8 w-8 text-accent" />
                <h3 className="mt-4 text-lg font-semibold">{f.title}</h3>
                <p className="mt-2 text-sm text-muted">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="roles" className="border-t border-border bg-surface/30 py-20">
        <div className="page-container">
          <h2 className="text-center text-3xl font-bold">Operational Alignment</h2>
          <p className="mx-auto mt-3 max-w-2xl text-center text-muted">
            Role-based access for admins, inspectors, and facility managers.
          </p>
          <div className="mt-12 grid gap-6 md:grid-cols-3">
            {roles.map((r) => (
              <div key={r.title} className="card-surface p-6 text-center sm:text-left">
                <r.icon className="mx-auto h-10 w-10 text-secondary sm:mx-0" />
                <h3 className="mt-4 text-lg font-semibold">{r.title}</h3>
                <p className="mt-2 text-sm text-muted">{r.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="data" className="border-t border-border py-20">
        <div className="page-container grid items-center gap-12 lg:grid-cols-2">
          <div className="card-surface overflow-hidden p-6">
            <div className="flex items-center gap-2 text-sm text-muted">
              <BarChart3 className="h-4 w-4 text-primary" />
              Inspection & compliance dashboard
            </div>
            <div className="mt-6 flex h-32 items-end gap-2">
              {[40, 65, 45, 90, 55, 70].map((h, i) => (
                <div
                  key={i}
                  className={`flex-1 rounded-t ${i === 3 ? 'bg-primary' : 'bg-border'}`}
                  style={{ height: `${h}%` }}
                />
              ))}
            </div>
            <div className="mt-6 grid grid-cols-3 gap-4 border-t border-border pt-4 text-center">
              <div>
                <p className="text-2xl font-bold text-primary">—</p>
                <p className="text-xs text-muted">Expired alerts</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-success">Live</p>
                <p className="text-xs text-muted">Fleet health</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-text">PDF/CSV</p>
                <p className="text-xs text-muted">Reports</p>
              </div>
            </div>
          </div>
          <div>
            <h2 className="text-3xl font-bold">The Industrial Data Layer</h2>
            <p className="mt-4 text-muted">
              Real-time reports: stock intake by day, month, or year; inspection status breakdown;
              expired extinguisher lists; and full maintenance history — exportable for auditors.
            </p>
            <Link to="/login" className="btn-primary mt-8 inline-flex">
              Access Dashboard <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

      <section className="bg-primary py-16">
        <div className="page-container text-center">
          <h2 className="text-3xl font-bold text-white">Secure Your Infrastructure Today</h2>
          <p className="mx-auto mt-3 max-w-xl text-white/80">
            Register, verify your email, and start managing fire safety assets across your
            facilities.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-4">
            <Link
              to="/register"
              className="inline-flex rounded-card bg-white px-6 py-3 text-sm font-semibold text-primary hover:bg-white/90"
            >
              Create Account
            </Link>
            <Link to="/login" className="btn-secondary border-white/40 text-white hover:bg-white/10">
              Sign In
            </Link>
          </div>
        </div>
      </section>

      <footer className="border-t border-border py-10">
        <div className="page-container flex flex-col items-center justify-between gap-4 sm:flex-row">
          <Logo />
          <p className="text-xs text-muted">
            STATUS: ALL SYSTEMS OPERATIONAL · © {new Date().getFullYear()} TWZ LTD
          </p>
        </div>
      </footer>
    </div>
  );
}
