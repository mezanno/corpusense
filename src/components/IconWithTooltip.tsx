import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { ReactNode } from 'react';

type IconWithTooltipProps = {
  tooltip: string;
  children: ReactNode;
  onClick?: (event: React.MouseEvent<HTMLDivElement>) => void;
  className?: string;
  disabled?: boolean;
};

export function IconWithTooltip({
  tooltip,
  children,
  onClick,
  className = '',
}: IconWithTooltipProps) {
  return (
    <Tooltip delayDuration={200}>
      <TooltipTrigger asChild>
        <div
          className={`${className}`}
          onClick={(event) => {
            event.stopPropagation();
            onClick?.(event);
          }}
          aria-label={tooltip}
        >
          {children}
        </div>
      </TooltipTrigger>
      <TooltipContent key='top' align='center'>
        <p>{tooltip}</p>
      </TooltipContent>
    </Tooltip>
  );
}
