import { Dropdown } from 'react-bootstrap';
import { useAnalysis } from '../context/AnalysisContext';

export const AnalysisSwitcher = () => {
    const { analysisHistory, currentAnalysis, setCurrentAnalysis } = useAnalysis();

    if (analysisHistory.length <= 1) {
        return null; // Don't show if only one or no analyses
    }

    const handleAnalysisSwitch = (analysis) => {
        setCurrentAnalysis(analysis);
    };

    const formatAnalysisDate = (timestamp) => {
        return new Date(timestamp).toLocaleDateString('en-US', { 
            month: 'short', 
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    return (
        <div style={{ marginBottom: '16px' }}>
            <label style={{ 
                color: 'var(--color-light-gray)', 
                fontSize: '14px',
                marginBottom: '8px',
                display: 'block'
            }}>
                Switch Analysis:
            </label>
            <Dropdown>
                <Dropdown.Toggle 
                    style={{ 
                        background: 'rgba(255, 255, 255, 0.05)',
                        border: '1px solid rgba(255, 255, 255, 0.2)',
                        color: '#fff',
                        borderRadius: '8px',
                        padding: '8px 16px',
                        fontSize: '14px',
                        minWidth: '250px',
                        textAlign: 'left'
                    }}
                >
                    {currentAnalysis?.disease.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())} 
                    ({formatAnalysisDate(currentAnalysis?.timestamp)})
                </Dropdown.Toggle>
                <Dropdown.Menu 
                    style={{ 
                        background: 'var(--color-blue-gray)', 
                        border: '1px solid rgba(255,255,255,0.1)',
                        minWidth: '300px'
                    }}
                >
                    <Dropdown.Header style={{ color: 'var(--color-light-gray)', fontSize: '12px' }}>
                        Select Previous Analysis
                    </Dropdown.Header>
                    {analysisHistory.map((analysis) => (
                        <Dropdown.Item
                            key={analysis.id}
                            onClick={() => handleAnalysisSwitch(analysis)}
                            style={{ 
                                color: currentAnalysis?.id === analysis.id ? 'var(--color-sage)' : '#fff',
                                background: currentAnalysis?.id === analysis.id ? 'rgba(125, 178, 144, 0.1)' : 'transparent',
                                fontSize: '14px',
                                padding: '12px 16px'
                            }}
                        >
                            <div>
                                <strong>{analysis.disease.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}</strong>
                                <div style={{ 
                                    fontSize: '12px', 
                                    color: 'var(--color-light-gray)',
                                    marginTop: '2px'
                                }}>
                                    {formatAnalysisDate(analysis.timestamp)} • {analysis.risks.length} results • {analysis.gene_count} genes
                                </div>
                            </div>
                        </Dropdown.Item>
                    ))}
                </Dropdown.Menu>
            </Dropdown>
        </div>
    );
};