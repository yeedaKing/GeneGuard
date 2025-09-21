// context/AnalysisContext.js
import React, { createContext, useContext, useState, useEffect } from 'react';
import { AuthContext } from './AuthContext';

const AnalysisContext = createContext();

export const AnalysisProvider = ({ children }) => {
    const { user } = useContext(AuthContext);
    const [currentAnalysis, setCurrentAnalysis] = useState(null);
    const [analysisHistory, setAnalysisHistory] = useState([]);
    const [loading, setLoading] = useState(false);

    // Generate user-specific storage keys
    const getUserStorageKey = (key) => {
        if (!user?.id) return null;
        return `${key}_user_${user.id}`;
    };

    // Check if localStorage is available
    const isLocalStorageAvailable = () => {
        try {
            const test = '__localStorage_test__';
            localStorage.setItem(test, test);
            localStorage.removeItem(test);
            return true;
        } catch (e) {
            return false;
        }
    };

    // Safe localStorage operations with user scoping
    const safeLocalStorageGet = (key) => {
        const userKey = getUserStorageKey(key);
        if (!userKey || !isLocalStorageAvailable()) return null;
        
        try {
            const item = localStorage.getItem(userKey);
            return item ? JSON.parse(item) : null;
        } catch (error) {
            console.warn(`Failed to parse localStorage item ${userKey}:`, error);
            localStorage.removeItem(userKey);
            return null;
        }
    };

    const safeLocalStorageSet = (key, value) => {
        const userKey = getUserStorageKey(key);
        if (!userKey || !isLocalStorageAvailable()) return false;
        
        try {
            localStorage.setItem(userKey, JSON.stringify(value));
            return true;
        } catch (error) {
            console.warn(`Failed to save to localStorage ${userKey}:`, error);
            if (error.name === 'QuotaExceededError') {
                clearOldAnalyses();
                try {
                    localStorage.setItem(userKey, JSON.stringify(value));
                    return true;
                } catch (retryError) {
                    console.error('Still failed after cleanup:', retryError);
                }
            }
            return false;
        }
    };

    const safeLocalStorageRemove = (key) => {
        const userKey = getUserStorageKey(key);
        if (!userKey || !isLocalStorageAvailable()) return;
        localStorage.removeItem(userKey);
    };

    const clearOldAnalyses = () => {
        const current = safeLocalStorageGet('currentAnalysis');
        if (current) {
            safeLocalStorageRemove('analysisHistory');
            safeLocalStorageSet('currentAnalysis', current);
        }
    };

    // Clear data when user changes or logs out
    useEffect(() => {
        if (!user) {
            // User logged out - clear all analysis data from memory
            setCurrentAnalysis(null);
            setAnalysisHistory([]);
            return;
        }

        // User logged in or changed - load their specific data
        const savedAnalysis = safeLocalStorageGet('currentAnalysis');
        const savedHistory = safeLocalStorageGet('analysisHistory');
        
        // Verify ownership before loading
        if (savedAnalysis && savedAnalysis.userId === user.id) {
            setCurrentAnalysis(savedAnalysis);
        } else {
            setCurrentAnalysis(null);
        }
        
        if (savedHistory && Array.isArray(savedHistory)) {
            // Filter to only include analyses for this user
            const userAnalyses = savedHistory.filter(a => a.userId === user.id);
            setAnalysisHistory(userAnalyses);
        } else {
            setAnalysisHistory([]);
        }
    }, [user?.id]); // Only trigger when user ID changes

    // Persist current analysis whenever it changes (and user is logged in)
    useEffect(() => {
        if (user?.id && currentAnalysis && currentAnalysis.userId === user.id) {
            safeLocalStorageSet('currentAnalysis', currentAnalysis);
        }
    }, [currentAnalysis, user?.id]);

    // Persist history whenever it changes (and user is logged in)
    useEffect(() => {
        if (user?.id && analysisHistory.length > 0) {
            // Only save analyses for current user
            const userAnalyses = analysisHistory.filter(a => a.userId === user.id);
            if (userAnalyses.length > 0) {
                safeLocalStorageSet('analysisHistory', userAnalyses);
            }
        }
    }, [analysisHistory, user?.id]);

    const saveAnalysisResults = (results) => {
        if (!user?.id) {
            console.warn('Cannot save analysis results: user not logged in');
            return;
        }

        // Add metadata including user ID for extra security
        const analysisWithMeta = {
            ...results,
            timestamp: new Date().toISOString(),
            id: `analysis_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            userId: user.id, // Store user ID with analysis
            version: '1.0'
        };

        setCurrentAnalysis(analysisWithMeta);
        
        // Add to history (keep last 10 analyses for this user)
        setAnalysisHistory(prev => {
            const updated = [analysisWithMeta, ...prev.filter(a => a.user_id !== results.user_id)];
            return updated.slice(0, 10);
        });
    };

    const getAnalysisResults = () => {
        // Verify the current analysis belongs to the current user
        if (!user?.id) return null;
        if (currentAnalysis && currentAnalysis.userId !== user.id) {
            console.warn('Analysis data belongs to different user, clearing...');
            setCurrentAnalysis(null);
            return null;
        }
        return currentAnalysis;
    };

    const getAnalysisById = (id) => {
        if (!user?.id) return null;
        const analysis = analysisHistory.find(analysis => analysis.id === id || analysis.user_id === id);
        // Verify the analysis belongs to the current user
        if (analysis && analysis.userId !== user.id) {
            console.warn('Requested analysis belongs to different user');
            return null;
        }
        return analysis;
    };

    const setCurrentAnalysisSecure = (analysis) => {
        if (!user?.id) return;
        // Verify the analysis belongs to the current user
        if (analysis && analysis.userId !== user.id) {
            console.warn('Cannot set analysis: belongs to different user');
            return;
        }
        setCurrentAnalysis(analysis);
    };

    const clearCurrentAnalysis = () => {
        setCurrentAnalysis(null);
        if (user?.id) {
            safeLocalStorageRemove('currentAnalysis');
        }
    };

    const clearAnalysisHistory = () => {
        setAnalysisHistory([]);
        if (user?.id) {
            safeLocalStorageRemove('analysisHistory');
        }
    };

    const clearAllUserData = () => {
        setCurrentAnalysis(null);
        setAnalysisHistory([]);
        if (user?.id) {
            safeLocalStorageRemove('currentAnalysis');
            safeLocalStorageRemove('analysisHistory');
        }
    };

    // Check if user has any analysis results
    const hasResults = () => {
        const analysis = getAnalysisResults();
        return !!analysis;
    };

    // Get summary data for navigation
    const getSummaryData = () => {
        const analysis = getAnalysisResults();
        if (!analysis) return null;
        
        return {
            disease: analysis.disease,
            geneCount: analysis.gene_count,
            timestamp: analysis.timestamp,
            userId: analysis.userId,
            riskCounts: analysis.risks?.reduce((counts, risk) => {
                const level = risk.level?.toLowerCase();
                if (level === 'high') counts.high++;
                else if (level === 'medium') counts.medium++;
                else if (level === 'low') counts.low++;
                return counts;
            }, { high: 0, medium: 0, low: 0 }) || { high: 0, medium: 0, low: 0 }
        };
    };

    // Get storage info for debugging
    const getStorageInfo = () => {
        if (!user?.id || !isLocalStorageAvailable()) {
            return { available: false, user: user?.id || 'not logged in' };
        }

        try {
            const userKeys = Object.keys(localStorage).filter(key => 
                key.includes(`_user_${user.id}`)
            );
            
            let usage = 0;
            userKeys.forEach(key => {
                usage += localStorage[key]?.length || 0;
            });

            return {
                available: true,
                userId: user.id,
                userKeys: userKeys.length,
                usage: usage,
                hasCurrentAnalysis: !!currentAnalysis,
                historyCount: analysisHistory.length
            };
        } catch (error) {
            return { available: false, error: error.message, userId: user.id };
        }
    };

    const value = {
        // Current analysis
        currentAnalysis: getAnalysisResults(), // Always verify ownership
        setCurrentAnalysis: setCurrentAnalysisSecure,
        
        // History (filtered for current user)
        analysisHistory: analysisHistory.filter(a => a.userId === user?.id),
        
        // Actions
        saveAnalysisResults,
        getAnalysisResults,
        getAnalysisById,
        clearCurrentAnalysis,
        clearAnalysisHistory,
        clearAllUserData,
        
        // Utilities
        hasResults,
        getSummaryData,
        getStorageInfo,
        loading,
        setLoading,
        
        // User info
        currentUser: user
    };

    return (
        <AnalysisContext.Provider value={value}>
            {children}
        </AnalysisContext.Provider>
    );
};

export const useAnalysis = () => {
    const context = useContext(AnalysisContext);
    if (!context) {
        throw new Error('useAnalysis must be used within an AnalysisProvider');
    }
    return context;
};