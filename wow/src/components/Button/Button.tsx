import React, { Children } from 'react';
import styles from './Button.module.css';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLElement>{
    children: React.ReactNode;
    isLoading?: boolean;
    loadingText?: string | React.ReactNode;
    buttontype: 'menu'| 'quest'|'addword'|'home'|'login'|'red';   
}

const Button: React.FC<ButtonProps> = ({
    children,
    onClick,
    disabled = false,
    className='',
    type = 'button',
    isLoading = false,
    loadingText,
    buttontype,
    ...rest
}) => {
    const isDisabled = disabled || isLoading;

    const buttonClasses = [
        styles.button,
        styles[buttontype],
        isLoading && styles.loading,
        className,
    ].filter(Boolean).join(' ');

    return(
        <button
            type={type}
            onClick={onClick}
            className={buttonClasses}
            disabled={isDisabled}
            {...rest}
        >
            {isLoading ? (
                <>
                    <span className={styles.spinner}></span>
                    {loadingText || children}
                </>
            ) : (
                children
            )}
        </button>
    );
};
        
export default Button;