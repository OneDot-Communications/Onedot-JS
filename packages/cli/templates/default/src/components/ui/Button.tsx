import { h, Component, css } from '@onedot/core';

interface ButtonProps {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  loading?: boolean;
  onClick?: () => void;
  children: any;
  className?: string;
  type?: 'button' | 'submit' | 'reset';
}

const buttonStyles = css({
  base: {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: '8px',
    border: 'none',
    cursor: 'pointer',
    fontWeight: '500',
    transition: 'all 0.2s ease',
    fontSize: '14px',
    lineHeight: '1.25',
    textDecoration: 'none',
    outline: 'none',
    position: 'relative',
    userSelect: 'none',
    '&:focus': {
      boxShadow: '0 0 0 3px rgba(59, 130, 246, 0.5)',
    },
    '&:disabled': {
      opacity: '0.6',
      cursor: 'not-allowed',
    },
  },
  variants: {
    variant: {
      primary: {
        backgroundColor: '#3b82f6',
        color: 'white',
        '&:hover:not(:disabled)': { 
          backgroundColor: '#2563eb',
          transform: 'translateY(-1px)',
          boxShadow: '0 4px 12px rgba(59, 130, 246, 0.4)',
        },
        '&:active': { 
          transform: 'translateY(0)',
        },
      },
      secondary: {
        backgroundColor: '#6b7280',
        color: 'white',
        '&:hover:not(:disabled)': { 
          backgroundColor: '#4b5563',
          transform: 'translateY(-1px)',
          boxShadow: '0 4px 12px rgba(107, 114, 128, 0.4)',
        },
        '&:active': { 
          transform: 'translateY(0)',
        },
      },
      outline: {
        backgroundColor: 'transparent',
        color: '#3b82f6',
        border: '1px solid #3b82f6',
        '&:hover:not(:disabled)': { 
          backgroundColor: '#eff6ff',
          transform: 'translateY(-1px)',
        },
        '&:active': { 
          transform: 'translateY(0)',
        },
      },
      ghost: {
        backgroundColor: 'transparent',
        color: '#374151',
        '&:hover:not(:disabled)': { 
          backgroundColor: '#f3f4f6',
        },
      },
    },
    size: {
      sm: {
        padding: '6px 12px',
        fontSize: '12px',
      },
      md: {
        padding: '8px 16px',
        fontSize: '14px',
      },
      lg: {
        padding: '12px 24px',
        fontSize: '16px',
      },
    },
  },
});

export const Button: Component<ButtonProps> = ({ 
  variant = 'primary',
  size = 'md',
  disabled = false,
  loading = false,
  onClick,
  children,
  className = '',
  type = 'button'
}) => {
  const handleClick = () => {
    if (!disabled && !loading && onClick) {
      onClick();
    }
  };

  return h('button', {
    className: `${buttonStyles({ variant, size })} ${className}`,
    disabled: disabled || loading,
    onClick: handleClick,
    type,
  }, 
    loading 
      ? h('span', { className: 'loading-spinner' }, '⏳') 
      : children
  );
};
