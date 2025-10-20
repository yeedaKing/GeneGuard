import { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { db } from '../services/database';

export const ThemeToggle = () => {
    const { user } = useContext(AuthContext);
    const [theme, setTheme] = useState('dark');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadTheme = async () => {
            // load theme from database
            if (user?.uid) {
                try {
                    const userData = await db.getCurrentUser(user.uid);
                    const savedTheme = userData.theme || 'dark';
                    setTheme(savedTheme);
                    document.documentElement.setAttribute('data-theme', savedTheme);
                } catch (error) {
                    console.error('Failed to load theme: ', error);
                    setTheme('dark');
                    document.documentElement.setAttribute('data-theme', 'dark');
                }
            } else {
                setTheme('dark');
                document.documentElement.setAttribute('data-theme', 'dark');
            }
            setLoading(false);
        };
        loadTheme();
    }, [user?.uid]);

    const toggleTheme = async () => {
        const newTheme = theme === 'dark' ? 'light' : 'dark';
        setTheme(newTheme);
        document.documentElement.setAttribute('data-theme', newTheme);

        if (user?.uid) {
            try {
                await db.updateUserPreferences(user.uid, { theme: newTheme });
            } catch (error) {
                console.error('Failed to save theme preference:', error);
            }
        }
    };

    if (loading) return null;

    return (
        <button 
            onClick={toggleTheme}
            className='theme-toggle-btn'
            aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
            title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
        >
            {theme === 'dark' ? (
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path
                        d="M10 2v2m0 12v2M4.22 4.22l1.42 1.42m8.72 8.72l1.42 1.42M2 10h2m12 0h2M4.22 15.78l1.42-1.42m8.72-8.72l1.42-1.42" 
                        stroke="currentColor" 
                        strokeWidth="2" 
                        strokeLinecap="round"  
                    />
                    <circle cx="10" cy="10" r="4" fill="currentColor"/>                  
                </svg>
            ) : (
                <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
                    <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z"/>
                </svg>
            )}
        </button>
    );
};