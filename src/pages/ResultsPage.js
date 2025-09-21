import { useState, useEffect } from 'react';
import { Container, Row, Col, Table, Alert } from 'react-bootstrap';
import { motion } from 'framer-motion';
import { useSearchParams, useLocation, Link } from 'react-router-dom';
import { api, formatRiskLevel } from '../services/api';

export const ResultsPage = () => {
    const [searchParams] = useSearchParams();
    const location = useLocation();
    const [results, setResults] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        // Get results from navigation state or URL params
        if (location.state?.result) {
            setResults(location.state.result);
            setLoading(false);
        } else {
            setError('No analysis results found. Please run an analysis first.');
            setLoading(false);
        }
    }, [location]);

    const exportResults = async () => {
        if (!results?.user_id) return;
        try {
            await api.exportCSV(results.user_id);
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

    if (!results) {
        return (
            <section style={{ padding: '120px 0', background: 'var(--color-dark-blue)' }}>
                <Container>
                    <Row className="justify-content-center">
                        <Col lg={8} className="text-center">
                            <h1 style={{ color: '#fff', marginBottom: '24px' }}>No Results Found</h1>
                            {error && <Alert variant="danger" className="mb-4">{error}</Alert>}
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
                                Disease: {results.disease} | Genes analyzed: {results.gene_count}
                            </p>
                            
                            <div style={{ display: 'flex', gap: '16px', marginBottom: '32px' }}>
                                <button className="btn-primary-large" onClick={exportResults}>
                                    Export CSV
                                </button>
                                <Link to="/analysis" className="btn-secondary-large">
                                    New Analysis
                                </Link>
                            </div>
                        </Col>
                    </Row>

                    <Row>
                        <Col>
                            <div className="results-table">
                                <h3 style={{ color: 'var(--color-dark-blue)', padding: '20px', margin: '0' }}>
                                    Risk Analysis Results
                                </h3>
                                <Table responsive style={{ margin: '0' }}>
                                    <thead>
                                        <tr>
                                            <th>Gene</th>
                                            <th>Risk Score</th>
                                            <th>Risk Level</th>
                                            <th>Rank</th>
                                            <th>Tips</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {results.risks.map((risk, index) => {
                                            const riskFormat = formatRiskLevel(risk.level);
                                            return (
                                                <tr key={index}>
                                                    <td style={{ fontWeight: '600' }}>{risk.gene}</td>
                                                    <td>{risk.risk?.toFixed(3) || 'N/A'}</td>
                                                    <td>
                                                        <span className={`risk-${riskFormat.level}`}>
                                                            {riskFormat.text}
                                                        </span>
                                                    </td>
                                                    <td>{risk.rank || 'N/A'}</td>
                                                    <td style={{ fontSize: '12px' }}>
                                                        {risk.tips?.slice(0, 2).map((tip, i) => (
                                                            <div key={i}>• {tip}</div>
                                                        )) || 'No tips available'}
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </Table>
                            </div>
                        </Col>
                    </Row>

                    <Row className="mt-4">
                        <Col>
                            <Alert variant="warning" style={{ background: 'rgba(255, 193, 7, 0.1)', borderColor: '#ffc107' }}>
                                <h5 style={{ color: '#ffc107' }}>Important Disclaimer</h5>
                                <p style={{ color: 'var(--color-light-gray)', margin: '0' }}>
                                    {results.disclaimer}
                                </p>
                            </Alert>
                        </Col>
                    </Row>
                </motion.div>
            </Container>
        </section>
    );
};