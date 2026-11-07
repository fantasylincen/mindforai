// 校验工具栏图标按钮默认可见，仅 visible={false} 或 hidden 时才隐藏
import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ToolButton } from './tool-button';

describe('tool button visibility', () => {
  it('shows an icon button by default', () => {
    render(
      <ToolButton type="icon" icon={<span>icon</span>} title="edit" aria-label="edit" />
    );
    const button = screen.getByLabelText('edit');
    expect(button.className).toContain('tool-icon_type_button--show');
    expect(button.className).not.toContain('tool-icon_type_button--hide');
  });

  it('hides an icon button when visible is false', () => {
    render(
      <ToolButton
        type="icon"
        visible={false}
        icon={<span>icon</span>}
        title="edit"
        aria-label="edit"
      />
    );
    const button = screen.getByLabelText('edit');
    expect(button.className).toContain('tool-icon_type_button--hide');
  });

  it('hides an icon button when hidden is set', () => {
    render(
      <ToolButton type="icon" hidden icon={<span>icon</span>} title="edit" aria-label="edit" />
    );
    const button = screen.getByLabelText('edit');
    expect(button.className).toContain('tool-icon_type_button--hide');
  });
});
