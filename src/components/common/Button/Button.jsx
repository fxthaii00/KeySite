import styles from './Button.module.css';

/**
 * Button — universal button component.
 * variants: 'primary' | 'outline' | 'danger' | 'success' | 'warning' | 'ghost'
 * sizes: 'sm' | 'md' | 'lg'
 */
export default function Button({
  children,
  variant  = 'primary',
  size     = 'md',
  fullWidth = false,
  disabled  = false,
  onClick,
  type     = 'button',
  className = '',
  ...rest
}) {
  const cls = [
    styles.btn,
    styles[`btn--${variant}`],
    styles[`btn--${size}`],
    fullWidth ? styles['btn--full'] : '',
    className,
  ].filter(Boolean).join(' ');

  return (
    <button
      type={type}
      className={cls}
      disabled={disabled}
      onClick={onClick}
      {...rest}
    >
      {children}
    </button>
  );
}
