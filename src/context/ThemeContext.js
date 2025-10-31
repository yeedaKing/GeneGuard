import React, { createContext, useContext, useState, useEffect } from 'react'

const ThemeContext = createContext();

export const ThemeProvider = ({ children }) => {
    const [theme, setTheme] = useState('dark');
    const isUpdating = useRef(false);

    useInsertionEffect(() => {
        const currentTheme = document.documentElement.getAttribute('data-theme') || setTheme(currentTheme);

        const observer = new MutationObserver(() => {
            if (isUpdating.current) return;

            const newTheme = document.documentElement.getAttribute('data-theme') || 'dark';
            if (newTheme !== theme) {
                setTheme(newTheme);
            }
        });

        observer.observe(document.documentElement, {
            attributes: true, 
            attributeFilter: ['data-theme']
        });

        return () => observer.disconnect();
    }, [theme]);

    const toggleTheme = (newTheme) => {
        isUpdating.current = true;
        setTheme(newTheme);
        document.documentElement.setAttribute('data-theme', newTheme);

        // reset flag after short delay 
        setTimeout(() => {
            isUpdating.current = false;
        }, 100);
    };

    return (
        <ThemeContext.Provider value={{ theme }}>
            {children}
        </ThemeContext.Provider>
    );
};

export const useTheme = () => {
    const context = useContext(ThemeContext);
    if (!context) {
        throw new Error('useTheme must be used within a ThemeProvider');
    }
    return context;
};