import React from 'react';
import { Skeleton } from '@/components/ui/skeleton';

export function PortfolioSkeleton() {
  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Top Hero Banner */}
      <div className="relative rounded-3xl border border-white/10 bg-gradient-to-br from-[#7A12F5]/40 via-[#4A00B8]/30 to-[#131316] p-6 backdrop-blur-md overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-2">
            <Skeleton className="h-4 w-32 bg-white/20" />
            <Skeleton className="h-10 w-48 bg-white/30" />
            <Skeleton className="h-4 w-28 bg-white/15" />
          </div>
          <div className="flex items-center gap-3">
            <Skeleton className="h-12 w-36 rounded-2xl bg-white/20" />
            <Skeleton className="h-12 w-36 rounded-2xl bg-white/20" />
          </div>
        </div>
      </div>

      {/* 4 Quick Actions (Mobile/Desktop) */}
      <div className="grid grid-cols-4 gap-2.5 sm:gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="flex flex-col items-center gap-2 rounded-2xl border border-[var(--line)] bg-[var(--s1)] p-3">
            <Skeleton className="size-11 rounded-2xl" />
            <Skeleton className="h-3 w-12" />
          </div>
        ))}
      </div>

      {/* 4 Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="space-y-3 rounded-2xl border border-[var(--line)] bg-[var(--s1)] p-4">
            <div className="flex items-center justify-between">
              <Skeleton className="size-9 rounded-xl" />
              <Skeleton className="h-4 w-12 rounded-full" />
            </div>
            <Skeleton className="h-3 w-20" />
            <Skeleton className="h-7 w-28" />
          </div>
        ))}
      </div>

      {/* Streak & Announcement Skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Skeleton className="h-32 rounded-2xl md:col-span-1" />
        <Skeleton className="h-32 rounded-2xl md:col-span-2" />
      </div>

      {/* Activity Table Skeleton */}
      <div className="rounded-2xl border border-[var(--line)] bg-[var(--s1)] p-5 space-y-4">
        <div className="flex items-center justify-between">
          <Skeleton className="h-5 w-36" />
          <Skeleton className="h-4 w-16" />
        </div>
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="flex items-center justify-between p-3 rounded-xl border border-[var(--line)]/50 bg-[var(--s2)]">
              <div className="flex items-center gap-3">
                <Skeleton className="size-10 rounded-xl" />
                <div className="space-y-1.5">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-3 w-24" />
                </div>
              </div>
              <Skeleton className="h-6 w-20 rounded-lg" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export function WalletSkeleton() {
  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="rounded-3xl border border-[var(--line)] bg-[var(--s1)] p-6 space-y-4">
        <Skeleton className="h-4 w-28" />
        <Skeleton className="h-10 w-44" />
        <div className="flex gap-3 pt-2">
          <Skeleton className="h-10 w-32 rounded-xl" />
          <Skeleton className="h-10 w-32 rounded-xl" />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Skeleton className="h-44 rounded-2xl" />
        <Skeleton className="h-44 rounded-2xl" />
      </div>

      <div className="rounded-2xl border border-[var(--line)] bg-[var(--s1)] p-5 space-y-3">
        <Skeleton className="h-5 w-40" />
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-14 w-full rounded-xl" />
        ))}
      </div>
    </div>
  );
}

export function TasksSkeleton() {
  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="rounded-3xl border border-[var(--line)] bg-[var(--s1)] p-6 space-y-3">
        <Skeleton className="h-7 w-48" />
        <Skeleton className="h-4 w-72" />
      </div>

      <div className="space-y-3">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} className="flex items-center justify-between p-4 rounded-2xl border border-[var(--line)] bg-[var(--s1)]">
            <div className="flex items-center gap-3.5">
              <Skeleton className="size-11 rounded-2xl" />
              <div className="space-y-1.5">
                <Skeleton className="h-4 w-40" />
                <Skeleton className="h-3 w-24" />
              </div>
            </div>
            <Skeleton className="h-9 w-24 rounded-xl" />
          </div>
        ))}
      </div>
    </div>
  );
}

export function ReferralSkeleton() {
  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="rounded-3xl border border-[var(--line)] bg-[var(--s1)] p-6 space-y-4">
        <Skeleton className="h-7 w-52" />
        <Skeleton className="h-4 w-80" />
        <Skeleton className="h-12 w-full rounded-2xl" />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-36 rounded-2xl" />
        ))}
      </div>
    </div>
  );
}

export function BuySkeleton() {
  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="rounded-3xl border border-[var(--line)] bg-[var(--s1)] p-6 space-y-3">
        <Skeleton className="h-6 w-36 rounded-full" />
        <Skeleton className="h-8 w-60" />
        <Skeleton className="h-3 w-full rounded-full" />
      </div>

      <div className="rounded-2xl border border-[var(--line)] bg-[var(--s1)] p-5 space-y-4">
        <div className="grid grid-cols-2 gap-2">
          <Skeleton className="h-11 rounded-xl" />
          <Skeleton className="h-11 rounded-xl" />
        </div>
        <Skeleton className="h-48 rounded-xl" />
      </div>
    </div>
  );
}
