// 缩放工具栏：仅保留缩放比例菜单，去除放大 / 缩小按钮
import { useBoard } from '@plait-board/react-board';
import Stack from '../stack';
import classNames from 'classnames';
import { ATTACHED_ELEMENT_CLASS_NAME, BoardTransforms, PlaitBoard } from '@plait/core';
import { Island } from '../island';
import { Popover, PopoverContent, PopoverTrigger } from '../popover/popover';
import { useState } from 'react';
import Menu from '../menu/menu';
import MenuItem from '../menu/menu-item';
import { useI18n } from '../../i18n';

const formatZoom = (zoom: number) => `${Number((zoom * 100).toFixed(0))}%`;

export const ZoomToolbar = () => {
  const board = useBoard();
  const { t } = useI18n();
  const container = PlaitBoard.getBoardContainer(board);
  const [zoomMenuOpen, setZoomMenuOpen] = useState(false);

  return (
    <Island padding={1} className={classNames('zoom-toolbar', ATTACHED_ELEMENT_CLASS_NAME)}>
      <Stack.Row gap={1}>
        <Popover
          sideOffset={12}
          open={zoomMenuOpen}
          onOpenChange={(open) => {
            setZoomMenuOpen(open);
          }}
          placement="bottom-end"
        >
          <PopoverTrigger asChild>
            <div
              key={1}
              title={t('zoom.fit')}
              aria-label={t('zoom.fit')}
              className={classNames('zoom-menu-trigger', {
                active: zoomMenuOpen,
              })}
              onPointerUp={() => {
                setZoomMenuOpen(!zoomMenuOpen);
              }}
            >
              {formatZoom(board?.viewport?.zoom || 1)}
            </div>
          </PopoverTrigger>
          <PopoverContent container={container}>
            <Menu
              onSelect={() => {
                setZoomMenuOpen(false);
              }}
            >
              <MenuItem
                data-testid="open-button"
                onSelect={() => {
                  BoardTransforms.fitViewport(board);
                }}
                aria-label={t('zoom.fit')}
                shortcut={`Cmd+Shift+=`}
              >
                {t('zoom.fit')}
              </MenuItem>
              <MenuItem
                data-testid="open-button"
                onSelect={() => {
                  BoardTransforms.updateZoom(board, 1);
                }}
                aria-label={t('zoom.100')}
                shortcut={`Cmd+0`}
              >
                {t('zoom.100')}
              </MenuItem>
            </Menu>
          </PopoverContent>
        </Popover>
      </Stack.Row>
    </Island>
  );
};
