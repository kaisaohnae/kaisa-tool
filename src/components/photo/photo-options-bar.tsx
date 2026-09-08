import type {ReactNode} from 'react';

type Props = {children: ReactNode};

/** Shared chrome for the context-sensitive tool and layer controls. */
export function PhotoOptionsBar({children}: Props) {
  return (
    <div className="photo-options" onClick={event => event.stopPropagation()}>
      {children}
    </div>
  );
}
