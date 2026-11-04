import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { ReactNode } from 'react';

type IconButtonWithTooltipProps = {
  tooltip: string;
  children: ReactNode;
  onClick?: (event: React.MouseEvent<HTMLButtonElement>) => void;
  className?: string;
  disabled?: boolean;
};

export function IconButtonWithTooltip({
  tooltip,
  children,
  onClick,
  className = '',
  disabled = false,
}: IconButtonWithTooltipProps) {
  return (
    <Tooltip delayDuration={200}>
      <TooltipTrigger asChild>
        <button
          className={`soft-button ${className}`}
          onClick={(event) => {
            event.stopPropagation();
            onClick?.(event);
          }}
          aria-label={tooltip}
          disabled={disabled}
        >
          {children}
        </button>
      </TooltipTrigger>
      <TooltipContent key='top' align='center'>
        <p>{tooltip}</p>
      </TooltipContent>
    </Tooltip>
  );
}
