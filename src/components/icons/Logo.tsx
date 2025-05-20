import { AppLogo, AppName } from '@/lib/navigation';
import type { LucideProps } from 'lucide-react';
import { cn } from '@/lib/utils';

export function Logo({ className, ...props }: LucideProps & { textClassName?: string }) {
  return (
    <div className="flex items-center gap-2">
      <AppLogo className={cn("h-7 w-7 text-primary", className)} {...props} />
      <span className={cn("font-semibold text-lg text-primary hidden md:inline-block group-data-[state=expanded]:md:inline-block group-data-[state=collapsed]:md:hidden", props.textClassName)}>
        {AppName}
      </span>
    </div>
  );
}
