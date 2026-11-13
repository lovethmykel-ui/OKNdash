'use client';

/**
 * components/layout/app-shell.tsx
 * Responsive dashboard shell:
 *  - Desktop (md+): shadcn sidebar + header + wide content container
 *  - Mobile (<md): same sidebar (renders as a slide-out sheet) + header
 *
 * The shell lives at the layout level so sidebar state and the framer-motion
 * tab indicator survive page navigations and dev hot reloads.
 */
import { useState, useEffect } from 'react';
import { Link, usePathname } from '@/i18n/navigation';
import { useTranslations } from 'next-intl';
import { SidebarInset, SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { Separator } from '@/components/ui/separator';
import { OknSidebar, type OknNavItem } from './okn-sidebar';
import { AreaThemeProvider, AreaThemeToggle } from './area-theme';
import { UserMenu } from './user-menu';
import { AdminUserMenu } from '@/components/admin/admin-user-menu';
import { NotificationBell } from '@/components/admin/notification-bell';
import { LanguageSwitcher } from '@/components/landing/language-switcher';
import { DevRoleToggle } from '@/components/admin/dev-role-toggle';
import { SilentRefresher } from './silent-refresher';
import { DailyCheckIn } from '@/components/dashboard/daily-check-in';
import { cn } from '@/lib/utils';
import { Cpu, Home, ShoppingCart, Users, Zap } from 'lucide-react';
import { motion } from 'motion/react';

interface AppShellProps {
  area: 'app' | 'admin';
  navItems: readonly OknNavItem[];
  isAdmin?: boolean;
  roleLabel?: string;
  children: React.ReactNode;
}

const MOBILE_BOTTOM_NAV = [
  { href: '/app/portfolio', label: 'Home', icon: Home },
  { href: '/app/tasks', label: 'Earn', icon: Zap },
  { href: '/app/buy', label: 'Buy', icon: ShoppingCart },
  { href: '/app/referral', label: 'Referral', icon: Users },
  { href: '/app/agents', label: 'Agents', icon: Cpu },
] as const;

export function AppShell({ area, navItems, isAdmin, roleLabel, children }: AppShellProps) {
  const pathname = usePathname();
  const t = useTranslations('dashboard');
  const activeItem = navItems.find((i) => i.href === pathname);
  const title = activeItem
    ? (activeItem.labelKey ? t(`nav.${activeItem.labelKey}`) : (activeItem.label ?? ''))
    : (pathname.startsWith('/admin') ? t('shell.admin') : t('shell.dashboard'));

  const [open, setOpen] = useState(true);

  useEffect(() => {
    const handleResize = () => {
      setOpen(window.innerWidth >= 1024);
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <AreaThemeProvider area={area}>
      <SilentRefresher />
      <SidebarProvider open={open} onOpenChange={setOpen}>
        <OknSidebar area={area} navItems={navItems} isAdmin={isAdmin} roleLabel={roleLabel} />
        <SidebarInset className="bg-[var(--bg)] transition-colors duration-200">
          <header className="sticky top-0 z-40 flex h-14 md:h-16 shrink-0 items-center justify-between gap-2 border-b border-[var(--line)] bg-[var(--s1)]/85 px-3 backdrop-blur-xl md:px-6">
            <div className="flex items-center gap-2.5 min-w-0">
              <SidebarTrigger className="size-9 md:size-10 shrink-0 rounded-xl border border-[var(--line)] bg-[var(--s2)] text-[var(--tx)] hover:bg-[var(--s1)] transition-colors" />
              <Separator orientation="vertical" className="hidden md:block h-5 bg-[var(--line)]" />
              <h1 className="truncate text-sm md:text-base font-extrabold tracking-tight text-[var(--tx)]">
                {title}
              </h1>
            </div>

            {/* Right cluster — compact on mobile so zero icons clip */}
            <div className="ml-auto flex shrink-0 items-center gap-1.5 md:gap-2.5">
              {area === 'app' ? <LanguageSwitcher /> : null}
              <AreaThemeToggle />
              <NotificationBell />
              {area === 'app' ? <UserMenu /> : null}
              {area === 'admin' ? <DevRoleToggle /> : null}
              {area === 'admin' ? <AdminUserMenu /> : null}
            </div>
          </header>

          <div className="app-shell-main flex-1 overflow-y-auto">
            <div
              className={cn(
                'mx-auto w-full px-3.5 py-5 sm:px-5 md:px-8 md:py-6',
                area === 'app'
                  ? 'max-w-7xl pb-28 md:pb-10'
                  : 'max-w-[96rem] pb-8',
              )}
            >
              {children}
            </div>
          </div>

          {/* Floating Mobile Bottom Navigation Dock (app area only) */}
          {area === 'app' && (
            <div className="pointer-events-none fixed inset-x-0 bottom-[max(12px,env(safe-area-inset-bottom,12px))] z-50 flex justify-center px-2.5 sm:px-4 md:hidden">
              <nav
                aria-label="Mobile Navigation"
                className="web3-bottom-nav pointer-events-auto grid w-full max-w-[420px] grid-cols-5 items-center gap-1 rounded-[24px] p-1.5"
              >
                {MOBILE_BOTTOM_NAV.map((tab) => {
                  const Icon = tab.icon;
                  const isBuy = tab.href === '/app/buy';
                  const isActive =
                    (tab.href === '/app/portfolio' && (pathname === '/app' || pathname === '/app/portfolio' || pathname.startsWith('/app/portfolio'))) ||
                    (tab.href === '/app/agents' && (pathname.startsWith('/app/agents') || pathname.startsWith('/app/trade-bot') || pathname.startsWith('/app/polymarket-agent') || pathname.startsWith('/app/prediction-markets'))) ||
                    (tab.href !== '/app/portfolio' && tab.href !== '/app/agents' && (pathname === tab.href || pathname.startsWith(tab.href + '/')));
                  return (
                    <Link
                      key={tab.href}
                      href={tab.href as never}
                      className={cn(
                        'relative flex h-[50px] sm:h-[52px] min-w-0 w-full flex-col items-center justify-center gap-0.5 rounded-[18px] px-1 py-1 transition-all duration-200 active:scale-95 cursor-pointer select-none',
                        isActive
                          ? 'bg-gradient-to-br from-[#7A12F5] to-[#8E2BFF] !text-white text-white shadow-[0_6px_18px_rgba(122,18,245,0.45)]'
                          : 'bg-transparent text-[var(--mut)] hover:text-[var(--tx)] hover:bg-white/[0.04]',
                      )}
                      style={isActive ? { background: 'linear-gradient(135deg, #7A12F5 0%, #8E2BFF 100%)', color: '#ffffff' } : undefined}
                    >
                      {isBuy ? (
                        <motion.div
                          animate={{
                            y: [0, -2, 0],
                            rotate: [0, -8, 8, 0],
                            scale: [1, 1.08, 1],
                          }}
                          transition={{
                            duration: 2.2,
                            repeat: Infinity,
                            ease: 'easeInOut',
                          }}
                          className="relative flex items-center justify-center shrink-0"
                        >
                          <ShoppingCart
                            className={cn(
                              'size-[18px] sm:size-5',
                              isActive ? '!text-white !stroke-white' : 'text-[var(--mut)]',
                            )}
                            style={isActive ? { color: '#ffffff', stroke: '#ffffff' } : undefined}
                          />
                          <span
                            className={cn(
                              'absolute -top-1 -right-1.5 size-1.5 sm:size-2 rounded-full animate-ping',
                              isActive ? 'bg-[#FFD60A]' : 'bg-[#09B4FF]',
                            )}
                          />
                          <span
                            className={cn(
                              'absolute -top-1 -right-1.5 size-1.5 sm:size-2 rounded-full',
                              isActive ? 'bg-[#FFD60A]' : 'bg-[#09B4FF]',
                            )}
                          />
                        </motion.div>
                      ) : (
                        <Icon
                          className={cn('size-[18px] sm:size-5 shrink-0', isActive ? '!text-white !stroke-white' : 'text-[var(--mut)]')}
                          style={isActive ? { color: '#ffffff', stroke: '#ffffff' } : undefined}
                        />
                      )}
                      <span
                        className={cn(
                          'max-w-full truncate text-[10px] sm:text-[10.5px] leading-tight tracking-tight font-extrabold',
                          isActive ? '!text-white' : 'text-[var(--mut)]',
                        )}
                        style={isActive ? { color: '#ffffff' } : undefined}
                      >
                        {tab.label}
                      </span>
                    </Link>
                  );
                })}
              </nav>
            </div>
          )}
        </SidebarInset>

        {/* Daily login check-in */}
        {area === 'app' && <DailyCheckIn />}
      </SidebarProvider>
    </AreaThemeProvider>
  );
}
