import { useState, useEffect } from 'react';
import { Container, Row, Col, Table, Alert } from 'react-bootstrap';
import { motion } from 'framer-motion';
import { formatRiskScore } from '../services/api';

export const ResultsPage = () => {
    const [results, setResults] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Get results from localStorage (in real app, this would be from API)
        const storedResults = localStorage.getItem('analysisResults');
        if (storedResults) {
            setResults(JSON.parse(storedResults));
        }
        setLoading(false);
    }, []);

    const exportResults = () => {
        if (!results) return;
        
        const dataStr = JSON.stringify(results, null, 2);
        const dataBlob = new Blob([dataStr], {type: 'application/json'});
        
        const url = URL.createObjectURL(dataBlob);
        const link = document.createElement('a');
        link.href = url;
        link.download = 'genetic-analysis-results.json';
        link.click();
        URL.revokeObjectURL(url);
    };

    const shareResults = async () => {
        if (navigator.share) {
            try {
                await navigator.share({
                    title: 'My Genetic Analysis Results',
                    text: 'Check out my genetic health analysis from GeneGuard',
                    url: window.location.href
                });
            } catch (error) {
                console.log('Share failed:', error);
            }
        } else {
            // Fallback: copy to clipboard
            navigator.clipboard.writeText(window.location.href);
            alert('Link copied to clipboard!');
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

    if (!results) {
        return (
            <section style={{ padding: '120px 0', background: 'var(--color-dark-blue)' }}>
                <Container>
                    <Row className="justify-content-center">
                        <Col lg={8} className="text-center">
                            <h1 style={{ color: '#fff', marginBottom: '24px' }}>
                                No Results Found
                            </h1>
                            <p style={{ color: 'var(--color-light-gray)', marginBottom: '32px' }}>
                                Please upload and analyze your genetic data first.
                            </p>
                            <a href="/analysis" className="btn-primary-large">
                                Start Analysis
                            </a>
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
                                Here's what we found in your genetic data. Remember, this is for educational purposes only.
                            </p>
                            
                            <div style={{ display: 'flex', gap: '16px', marginBottom: '32px', flexWrap: 'wrap' }}>
                                <button className="btn-primary-large" onClick={exportResults}>
                                    Export Results
                                </button>
                                <button className="btn-secondary-large" onClick={shareResults}>
                                    Share Results
                                </button>
                            </div>
                        </Col>
                    </Row>

                    {/* Results Table */}
                    <Row className="mb-5">
                        <Col>
                            <div className="results-table">
                                <h3 style={{ color: 'var(--color-dark-blue)', padding: '20px', margin: '0' }}>
                                    Genetic Variants Analysis
                                </h3>
                                <Table responsive style={{ margin: '0' }}>
                                    <thead>
                                        <tr>
                                            <th>Gene</th>
                                            <th>Description</th>
                                            <th>Risk Level</th>
                                            <th>Variants</th>
                                            <th>More Info</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {results.results.map((result, index) => {
                                            const riskFormat = formatRiskScore(result.riskScore);
                                            return (
                                                <tr key={index}>
                                                    <td style={{ fontWeight: '600' }}>{result.symbol}</td>
                                                    <td>{result.description}</td>
                                                    <td>
                                                        <span className={`risk-${riskFormat.level}`}>
                                                            {riskFormat.text}
                                                        </span>
                                                    </td>
                                                    <td style={{ fontSize: '12px', fontFamily: 'monospace' }}>
                                                        {result.variants.join(', ')}
                                                    </td>
                                                    <td>
                                                        <a 
                                                            href={result.moreInfo} 
                                                            target="_blank" 
                                                            rel="noopener noreferrer"
                                                            style={{ color: 'var(--color-teal)' }}
                                                        >
                                                            Learn More
                                                        </a>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </Table>
                            </div>
                        </Col>
                    </Row>

                    {/* Lifestyle Recommendations */}
                    <Row>
                        <Col>
                            <div className="lifestyle-tips">
                                <h3>Personalized Recommendations</h3>
                                <p style={{ color: 'var(--color-light-gray)', marginBottom: '20px' }}>
                                    Based on your genetic profile, here are some lifestyle suggestions:
                                </p>
                                <ul>
                                    {results.recommendations.map((recommendation, index) => (
                                        <li key={index}>{recommendation}</li>
                                    ))}
                                </ul>
                            </div>
                        </Col>
                    </Row>

                    {/* Disclaimer */}
                    <Row className="mt-4">
                        <Col>
                            <Alert variant="warning" style={{ background: 'rgba(255, 193, 7, 0.1)', borderColor: '#ffc107' }}>
                                <h5 style={{ color: '#ffc107' }}>Important Disclaimer</h5>
                                <p style={{ color: 'var(--color-light-gray)', margin: '0' }}>
                                    This analysis is for educational and informational purposes only. 
                                    It should not be used for medical diagnosis or treatment decisions. 
                                    Always consult with a qualified healthcare provider for medical advice.
                                </p>
                            </Alert>
                        </Col>
                    </Row>
                </motion.div>
            </Container>
        </section>
    );
};