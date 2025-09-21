import { useState, useEffect } from 'react';
import { Container, Row, Col, Table, Alert } from 'react-bootstrap';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { api, formatRiskLevel } from '../services/api';
import { useAnalysis } from '../context/AnalysisContext';

const formatText = (text) => {
  return text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
};

export const ResultsPage = () => {
    const { currentAnalysis, hasResults } = useAnalysis();
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        // Small delay to show loading state briefly
        const timer = setTimeout(() => {
            setLoading(false);
        }, 500);

        return () => clearTimeout(timer);
    }, []);

    const exportResults = async () => {
        if (!currentAnalysis?.user_id) {
            setError('No user ID found for export');
            return;
        }
        
        try {
            await api.exportCSV(currentAnalysis.user_id);
        } catch (err) {
            setError('Export failed: ' + err.message);
        }
    };

    if (loading) {
        return (
            <div style={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                height: '100vh',
                background: 'var(--color-dark-blue)'
            }}>
                <div className="loading" style={{ width: '40px', height: '40px' }}></div>
            </div>
        );
    }

    if (!hasResults() || !currentAnalysis) {
        return (
            <section style={{ padding: '120px 0', background: 'var(--color-dark-blue)' }}>
                <Container>
                    <Row className="justify-content-center">
                        <Col lg={8} className="text-center">
                            <h1 style={{ color: '#fff', marginBottom: '24px' }}>No Results Found</h1>
                            <Alert variant="info" className="mb-4">
                                No analysis results found. Please run an analysis first.
                            </Alert>
                            <Link to="/analysis" className="btn-primary-large">Start Analysis</Link>
                        </Col>
                    </Row>
                </Container>
            </section>
        );
    }

    return (
        <section style={{ padding: '120px 0 80px 0', background: 'var(--color-dark-blue)' }}>
            <Container>
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6 }}
                >
                    <Row className="mb-4">
                        <Col>
                            <h1 style={{ color: '#fff', marginBottom: '16px' }}>
                                Your Genetic Analysis Results
                            </h1>
                            <p style={{ color: 'var(--color-light-gray)', marginBottom: '32px' }}>
                                Disease: {currentAnalysis.disease.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())} | 
                                Genes analyzed: {currentAnalysis.gene_count} | 
                                Results found: {currentAnalysis.risks.length}
                            </p>
                            
                            {error && <Alert variant="danger" className="mb-4">{error}</Alert>}
                            
                            <div style={{ display: 'flex', gap: '16px', marginBottom: '32px', flexWrap: 'wrap' }}>
                                <button className="btn-primary-large" onClick={exportResults}>
                                    Export CSV
                                </button>
                                <Link to="/summary" className="btn-secondary-large">
                                    Back to Summary
                                </Link>
                                <Link to="/analysis" className="btn-secondary-large">
                                    New Analysis
                                </Link>
                            </div>
                        </Col>
                    </Row>

                    <Row>
                        <Col>
                            <div className="results-table">
                                <h3 style={{ color: 'var(--color-dark-blue)', padding: '25px', margin: '0', fontSize: '26px' }}>
                                    Risk Analysis Results ({currentAnalysis.risks.length} genes)
                                </h3>
                                {currentAnalysis.risks.length > 0 ? (
                                    <Table responsive style={{ margin: '0'}}>
                                        <thead style={{ fontSize: '20px' }}>
                                            <tr>
                                                <th>Gene</th>
                                                <th>Risk Score</th>
                                                <th>Risk Level</th>
                                                <th>Rank</th>
                                                <th>Recommendations</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {currentAnalysis.risks.map((risk, index) => {
                                                const riskFormat = formatRiskLevel(risk.level);
                                                return (
                                                    <tr key={index}>
                                                        <td style={{ fontWeight: '600' }}>{risk.gene}</td>
                                                        <td>{risk.risk?.toFixed(6) || 'N/A'}</td>
                                                        <td>
                                                            <span className={`risk-${riskFormat.level}`}>
                                                                {riskFormat.text}
                                                            </span>
                                                        </td>
                                                        <td>{risk.rank || 'N/A'}</td>
                                                        <td>
                                                        {risk.tips?.length > 0 ? (
                                                            <>
                                                                {console.log(`Gene ${risk.gene} has ${risk.tips.length} tips:`, risk.tips)}
                                                                {risk.tips.map((tip, i) => (
                                                                    <div 
                                                                        key={i} 
                                                                        style={{ marginBottom: '8px' }} 
                                                                        dangerouslySetInnerHTML={{ __html: `• ${formatText(tip)}` }} 
                                                                    />
                                                                ))}
                                                            </>
                                                        ) : (
                                                            <span style={{ fontStyle: 'italic', color: '#666' }}>
                                                            No recommendations available
                                                            </span>
                                                        )}
                                                        </td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </Table>
                                ) : (
                                    <div style={{ padding: '60px 20px', textAlign: 'center' }}>
                                        <h5 style={{ color: 'var(--color-dark-blue)', marginBottom: '16px' }}>
                                            No Risk Results Found
                                        </h5>
                                        <p style={{ color: 'var(--color-medium-gray)' }}>
                                            No genetic variants were found that match the risk database for this disease.
                                        </p>
                                    </div>
                                )}
                            </div>
                        </Col>
                    </Row>

                    <Row className="mt-4">
                        <Col>
                            <Alert variant="warning" style={{ background: 'rgba(255, 193, 7, 0.1)', borderColor: '#ffc107' }}>
                                <h5 style={{ color: '#ffc107' }}>Important Disclaimer</h5>
                                <p style={{ color: 'var(--color-light-gray)', margin: '0' }}>
                                    {currentAnalysis.disclaimer}
                                </p>
                            </Alert>
                        </Col>
                    </Row>

                    {/* Analysis metadata */}
                    <Row className="mt-4">
                        <Col>
                            <div style={{
                                background: 'rgba(255, 255, 255, 0.03)',
                                borderRadius: '12px',
                                padding: '20px',
                                border: '1px solid rgba(255, 255, 255, 0.1)'
                            }}>
                                <h6 style={{ color: '#fff', marginBottom: '12px' }}>Analysis Details</h6>
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
                                    <div>
                                        <small style={{ color: 'var(--color-light-gray)' }}>Analysis ID:</small>
                                        <div style={{ color: '#fff', fontFamily: 'monospace', fontSize: '12px' }}>
                                            {currentAnalysis.user_id}
                                        </div>
                                    </div>
                                    <div>
                                        <small style={{ color: 'var(--color-light-gray)' }}>Date Analyzed:</small>
                                        <div style={{ color: '#fff' }}>
                                            {new Date(currentAnalysis.timestamp).toLocaleDateString()}
                                        </div>
                                    </div>
                                    <div>
                                        <small style={{ color: 'var(--color-light-gray)' }}>Disease:</small>
                                        <div style={{ color: '#fff' }}>
                                            {currentAnalysis.disease.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </Col>
                    </Row>
                </motion.div>
            </Container>
        </section>
    );
};