// MH-05 Mermaid 思维导图元素的渲染组件，负责将 Mermaid 文本渲染为 SVG 并支持尺寸缓存
import React, { useEffect, useRef, useState } from 'react';
import classNames from 'classnames';
import { parseMermaidMindPayload } from '../../mermaid-mind';

export interface MermaidMindProps {
  mermaid: string;
  width: number;
  height: number;
  onRendered?: (svg: string) => void;
}

let mermaidIdSeed = 0;

const mermaidSvgSizeCache = new Map<string, { width: number; height: number }>();

export const getMermaidSvgSize = (mermaid: string) => {
  return mermaidSvgSizeCache.get(mermaid) || null;
};

const parseSvgSize = (svg: string) => {
  const viewBoxMatch = /<svg[^>]*\sviewBox="([-\d.]+)\s+([-\d.]+)\s+([\d.]+)\s+([\d.]+)"/.exec(svg);
  const widthMatch = /<svg[^>]*\swidth="([\d.]+)(?:px)?"/.exec(svg);
  const heightMatch = /<svg[^>]*\sheight="([\d.]+)(?:px)?"/.exec(svg);
  let width = widthMatch ? parseFloat(widthMatch[1]) : 0;
  let height = heightMatch ? parseFloat(heightMatch[1]) : 0;
  if ((!width || !height) && viewBoxMatch) {
    width = width || parseFloat(viewBoxMatch[3]);
    height = height || parseFloat(viewBoxMatch[4]);
  }
  return { width, height };
};

const loadMermaid = () => import('mermaid');

export const MermaidMind: React.FC<MermaidMindProps> = ({ mermaid, width, height, onRendered }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [svg, setSvg] = useState<string>('');
  const onRenderedRef = useRef(onRendered);
  onRenderedRef.current = onRendered;

  useEffect(() => {
    let disposed = false;
    const render = async () => {
      try {
        const module = await loadMermaid();
        const mermaidApi = module.default;
        mermaidApi.initialize({
          startOnLoad: false,
          securityLevel: 'strict',
          theme: 'default',
        });
        const payload = parseMermaidMindPayload(mermaid);
        const { svg: renderedSvg } = await mermaidApi.render(
          `mindforai-mermaid-mind-${mermaidIdSeed++}`,
          payload.definition
        );
        if (disposed) {
          return;
        }
        const size = parseSvgSize(renderedSvg);
        if (size.width && size.height) {
          mermaidSvgSizeCache.set(mermaid, size);
        }
        setSvg(renderedSvg);
      } catch {
        if (!disposed) {
          setSvg('');
        }
      }
    };
    render();
    return () => {
      disposed = true;
    };
  }, [mermaid]);

  useEffect(() => {
    if (!svg) {
      return;
    }
    onRenderedRef.current?.(svg);
  }, [svg]);

  return (
    <div
      ref={containerRef}
      className={classNames('mermaid-mind')}
      style={{ width, height, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
      dangerouslySetInnerHTML={{ __html: svg }}
    />
  );
};
