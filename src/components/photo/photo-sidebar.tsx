import type {ReactNode} from 'react';

type Props = {children: ReactNode};

/** Shared sidebar chrome; editor-owned actions are supplied as children. */
export function PhotoSidebar({children}: Props) {
  return (
    <aside className="photo-sidebar" onClick={event => event.stopPropagation()}>
      {children}
    </aside>
  );
}
