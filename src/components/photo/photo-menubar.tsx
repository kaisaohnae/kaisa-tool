import IconLogo from '@/components/icons/icon-logo';

export type PhotoMenuKey = 'file' | 'edit' | 'image' | 'filter' | 'layer' | 'select' | 'view';
export type PhotoMenuItem = {label: string; shortcut?: string; action: () => void; disabled?: boolean};

type Props = {
  open: PhotoMenuKey | null;
  items: Record<PhotoMenuKey, PhotoMenuItem[]>;
  documentLabel: string;
  onOpenChange: (menu: PhotoMenuKey | null) => void;
};

export function PhotoMenubar({open, items, documentLabel, onOpenChange}: Props) {
  const menus: PhotoMenuKey[] = ['file', 'edit', 'image', 'filter', 'layer', 'select', 'view'];
  return (
    <div className="photo-menubar" onClick={event => event.stopPropagation()}>
      <a className="photo-menubar__logo" href="https://kaisa.co.kr" aria-label="Kaisa">
        <IconLogo width={52} height={22} />
      </a>
      {menus.map(menu => (
        <div key={menu} className={`photo-menubar__item${open === menu ? ' is-open' : ''}`}>
          <button
            type="button"
            className="photo-menubar__btn"
            onClick={() => onOpenChange(open === menu ? null : menu)}
            onMouseEnter={() => open && onOpenChange(menu)}
          >
            {menu[0].toUpperCase() + menu.slice(1)}
          </button>
          {open === menu && (
            <div className="photo-menu">
              {items[menu].map(item => (
                <button
                  key={item.label}
                  type="button"
                  className="photo-menu__item"
                  disabled={item.disabled}
                  onClick={() => { item.action(); onOpenChange(null); }}
                >
                  <span>{item.label}</span>{item.shortcut && <kbd>{item.shortcut}</kbd>}
                </button>
              ))}
            </div>
          )}
        </div>
      ))}
      <div className="photo-menubar__doc">{documentLabel}</div>
    </div>
  );
}
