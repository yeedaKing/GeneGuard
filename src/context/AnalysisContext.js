// context/AnalysisContext.js
import React, { createContext, useContext, useState, useEffect } from 'react';
import { AuthContext } from './AuthContext';
import { db } from '../services/database';

const AnalysisContext = createContext();

export const AnalysisProvider = ({ children }) => {
    const { user } = useContext(AuthContext);
    const [currentAnalysis, setCurrentAnalysis] = useState(null);
    const [loading, setLoading] = useState(false);

    // Clear data when user changes or logs out
    useEffect(() => {
        if (!user?.uid) {
            setCurrentAnalysis(null);
        }
    }, [user?.uid]); 

    const saveAnalysisResults = (results) => {
        if (!user?.uid) {
            console.warn('Cannot save analyses results');
            return;
        }

        const analysisWithMeta = {
            ...results, 
            timestamp: results.timestamp || new Date().toISOString(),
            id: results.user_id,
            userId: user.uid
        };

        setCurrentAnalysis(analysisWithMeta);
    };

    const getAnalysisResults = () => {
        if (!user?.uid) return null;
        return currentAnalysis;
    }

    const getAnalysisById = async (id) => {
        if (!user?.uid) return null;
        
        try {
            const analysis = await db.getAnalysisById(id);
            return analysis;
        } catch (error) {
            console.error('Failed to get analysis', error);
            return null;
        }
    };

    const clearCurrentAnalysis = () => {
        setCurrentAnalysis(null);
    };

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
            }, { high: 0, medium: 0, low: 0}) || { high: 0, medium: 0, low: 0}
        };
    };

    const hasResults = () => {
        return !!currentAnalysis;
    };

    const value = {
        currentAnalysis: getAnalysisResults(), // Always verify ownership
        setCurrentAnalysis,
        
        // Actions
        saveAnalysisResults,
        getAnalysisResults,
        getAnalysisById,
        clearCurrentAnalysis,
        
        // Utilities
        hasResults,
        getSummaryData,
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