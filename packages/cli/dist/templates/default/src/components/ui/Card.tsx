import { h, Component, css } from '@onedot/core';

interface CardProps {
  children: any;
  className?: string;
  variant?: 'default' | 'elevated' | 'outlined';
  padding?: 'sm' | 'md' | 'lg';
}

const cardStyles = css({
  base: {
    borderRadius: '12px',
    transition: 'all 0.2s ease',
    overflow: 'hidden',
    position: 'relative',
  },
  variants: {
    variant: {
      default: {
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
        backdropFilter: 'blur(10px)',
        border: '1px solid rgba(255, 255, 255, 0.2)',
        '&:hover': {
          backgroundColor: 'rgba(255, 255, 255, 0.15)',
          transform: 'translateY(-2px)',
          boxShadow: '0 8px 25px rgba(0, 0, 0, 0.15)',
        },
      },
      elevated: {
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        color: '#1f2937',
        boxShadow: '0 4px 6px rgba(0, 0, 0, 0.07)',
        '&:hover': {
          boxShadow: '0 10px 25px rgba(0, 0, 0, 0.15)',
          transform: 'translateY(-2px)',
        },
      },
      outlined: {
        backgroundColor: 'transparent',
        border: '2px solid rgba(255, 255, 255, 0.3)',
        '&:hover': {
          borderColor: 'rgba(255, 255, 255, 0.5)',
          backgroundColor: 'rgba(255, 255, 255, 0.05)',
        },
      },
    },
    padding: {
      sm: {
        padding: '1rem',
      },
      md: {
        padding: '1.5rem',
      },
      lg: {
        padding: '2rem',
      },
    },
  },
});

export const Card: Component<CardProps> = ({ 
  children,
  className = '',
  variant = 'default',
  padding = 'md'
}) => {
  return h('div', {
    className: `${cardStyles({ variant, padding })} ${className}`,
  }, children);
};
