import logoSrc from '../images/LizardLogo.png';

/**
 * LizardLogo — brand logo PNG.
 *
 * Props:
 *  - size      : number (px), default 32
 *  - variant   : 'default' | 'purple' | 'muted' | 'dark'
 *                Applies a CSS filter to tint the white logo.
 *  - bgColor   : optional background color string (for icon containers)
 *  - className : extra classes
 *  - style     : inline style overrides
 */

const FILTER = {
  default: 'none',                                        // white
  purple:  'invert(52%) sepia(70%) saturate(600%) hue-rotate(240deg) brightness(110%)',
  muted:   'opacity(0.35)',
  dark:    'invert(1) opacity(0.08)',
};

export default function LizardLogo({
  size      = 32,
  variant   = 'default',
  bgColor   = 'transparent',
  className = '',
  style     = {},
}) {
  const borderRadius = bgColor !== 'transparent' ? '50%' : undefined;

  return (
    <img
      src={logoSrc}
      alt="Lizard Hub"
      width={size}
      height={size}
      className={className}
      style={{
        width:        size,
        height:       size,
        objectFit:    'contain',
        flexShrink:   0,
        background:   bgColor,
        borderRadius,
        filter:       FILTER[variant] ?? FILTER.default,
        display:      'block',
        ...style,
      }}
      aria-hidden="true"
    />
  );
}
