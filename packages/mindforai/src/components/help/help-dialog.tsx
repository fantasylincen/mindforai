// UI-46 主菜单帮助对话框，展示画板基本操作方法与常用快捷键
import { CloseIcon } from '../icons';
import { Dialog, DialogContent } from '../dialog/dialog';
import { useMindForAI } from '../../hooks/use-mindforai';
import { useI18n } from '../../i18n';
import './help-dialog.scss';

export const HelpDialog = ({ container }: { container: HTMLElement | null }) => {
  const { appState, setAppState } = useMindForAI();
  const { t } = useI18n();
  const open = !!appState.openHelp;

  const close = () => {
    setAppState((currentAppState) => ({ ...currentAppState, openHelp: false }));
  };

  const groups = [
    {
      title: t('help.groupStart'),
      items: [
        { label: t('help.hand'), keys: 'H' },
        { label: t('help.selection'), keys: 'V' },
        { label: t('help.mind'), keys: 'M' },
        { label: t('help.editNode'), keys: 'F2 / Space' },
        { label: t('help.addChild'), keys: 'Shift + Enter' },
        { label: t('help.multiSelect'), keys: 'Ctrl / Cmd + Click' },
      ],
    },
    {
      title: t('help.groupEdit'),
      items: [
        { label: t('general.undo'), keys: 'Ctrl / Cmd + Z' },
        { label: t('general.redo'), keys: 'Ctrl / Cmd + Shift + Z' },
        { label: t('general.delete'), keys: 'Delete' },
        { label: t('menu.saveFile'), keys: 'Ctrl / Cmd + S' },
        { label: t('help.saveAs'), keys: 'Ctrl / Cmd + Shift + S' },
        { label: t('help.exportSvg'), keys: 'Ctrl / Cmd + Shift + E' },
      ],
    },
    {
      title: t('help.groupView'),
      items: [
        { label: t('help.fitViewport'), keys: 'Ctrl / Cmd + F5' },
        { label: t('help.collapseAllNodes'), keys: 'Ctrl / Cmd + F3' },
        { label: t('popupToolbar.expandAll'), keys: 'Ctrl / Cmd + Alt + E' },
        { label: t('popupToolbar.collapseAll'), keys: 'Ctrl / Cmd + Alt + C' },
        { label: t('help.badgeCtrlClick'), keys: 'Ctrl / Cmd + Click' },
        { label: t('help.autoSave'), keys: t('statusBar.autoSave') },
      ],
    },
    {
      title: t('help.groupDocument'),
      items: [
        { label: t('help.newDocument'), keys: 'Ctrl / Cmd + N' },
        { label: t('help.search'), keys: 'Ctrl / Cmd + F' },
      ],
    },
  ];

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        if (!nextOpen) {
          close();
        }
      }}
    >
      <DialogContent className="help-dialog" container={container}>
        {open && (
          <>
            <div className="help-dialog__header">
              <h2 className="help-dialog__title">{t('help.title')}</h2>
              <button
                type="button"
                className="help-dialog__close"
                title={t('help.close')}
                aria-label={t('help.close')}
                onClick={close}
              >
                {CloseIcon}
              </button>
            </div>
            <p className="help-dialog__description">{t('help.description')}</p>
            <div className="help-dialog__groups">
              {groups.map((group) => (
                <section className="help-dialog__group" key={group.title}>
                  <h3 className="help-dialog__group-title">{group.title}</h3>
                  <ul className="help-dialog__list">
                    {group.items.map((item) => (
                      <li className="help-dialog__item" key={`${group.title}-${item.label}`}>
                        <span className="help-dialog__label">{item.label}</span>
                        <kbd className="help-dialog__key">{item.keys}</kbd>
                      </li>
                    ))}
                  </ul>
                </section>
              ))}
            </div>
            <div className="help-dialog__actions">
              <button type="button" className="help-dialog__button" autoFocus onClick={close}>
                {t('help.close')}
              </button>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
};