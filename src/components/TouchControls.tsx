import { memo } from 'react';

interface Props {
  onDir: (dir: 'up' | 'down' | 'left' | 'right', pressed: boolean) => void;
  onBomb: () => void;
}

function HoldButton(props: { label: string; dir: 'up' | 'down' | 'left' | 'right'; onDir: Props['onDir']; className?: string }): JSX.Element {
  const { dir, onDir } = props;
  return (
    <button
      className={`tbtn ${props.className ?? ''}`}
      aria-label={dir}
      onPointerDown={(e) => {
        e.preventDefault();
        (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
        onDir(dir, true);
      }}
      onPointerUp={() => onDir(dir, false)}
      onPointerCancel={() => onDir(dir, false)}
      onPointerLeave={() => onDir(dir, false)}
      onContextMenu={(e) => e.preventDefault()}
    >
      {props.label}
    </button>
  );
}

export const TouchControls = memo(function TouchControls({ onDir, onBomb }: Props): JSX.Element {
  return (
    <div className="touch">
      <div className="dpad" role="group" aria-label="Movement pad">
        <span />
        <HoldButton label="▲" dir="up" onDir={onDir} />
        <span />
        <HoldButton label="◀" dir="left" onDir={onDir} />
        <HoldButton label="▼" dir="down" onDir={onDir} />
        <HoldButton label="▶" dir="right" onDir={onDir} />
      </div>
      <button
        className="bomb-btn"
        aria-label="Place bomb"
        onPointerDown={(e) => {
          e.preventDefault();
          onBomb();
        }}
      >
        💣
      </button>
    </div>
  );
});
