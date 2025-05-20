import { AppLogo, AppName } from '@/lib/navigation';
import type { LucideProps } from 'lucide-react';
import { cn } from '@/lib/utils';

export function Logo({ className, textClassName, ...rest }: LucideProps & { textClassName?: string }) {
  return (
    <div className="flex items-center gap-2">
      <AppLogo className={cn("h-7 w-7 text-primary", className)} {...rest} />
      <span className={cn("font-semibold text-lg text-primary hidden md:inline-block group-data-[state=expanded]:md:inline-block group-data-[state=collapsed]:md:hidden", textClassName)}>
        {AppName}
      </span>
    </div>
  );
}
