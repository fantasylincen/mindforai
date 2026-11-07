import type { ImageProps } from '@plait/common';
import classNames from 'classnames';
import { getSafeImageSource } from '../../data/image';

export const Image: React.FC<ImageProps> = (props: ImageProps) => {
  const imgProps = {
    src: getSafeImageSource(props.imageItem.url),
    draggable: false,
    width: '100%',
  };
  return (
    <div style={{ display: 'flex' }}>
      <img
        {...imgProps}
        className={classNames('image-origin', {
          'image-origin--focus': props.isFocus,
        })}
      />
    </div>
  );
};
