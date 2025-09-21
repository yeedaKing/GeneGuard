import { useState, useEffect } from 'react';
import { Container, Row, Col, Alert, Card } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAnalysis } from '../context/AnalysisContext';
import { AnalysisSwitcher } from '../components/AnalysisSwitcher';

const formatText = (text) => {
  return text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
};

export const SummaryPage = () => {
    const { currentAnalysis, hasResults, getSummaryData } = useAnalysis();
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Small delay to show loading state briefly
        const timer = setTimeout(() => {
            setLoading(false);
        }, 500);

        return () => clearTimeout(timer);
    }, []);

    if (loading) {
        return (
            <div className="loading-container">
                <div className="loading"></div>
            </div>
        );
    }

    if (!hasResults() || !currentAnalysis) {
        return (
            <section className="summary-section">
                <Container>
                    <Row className="justify-content-center">
                        <Col lg={8} className="text-center">
                            <h1 className="summary-title">No Analysis Summary</h1>
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

    const summaryData = getSummaryData();
    const riskCounts = summaryData.riskCounts;

    return (
        <section className="summary-section">
            <Container>
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6 }}
                >
                    <Row className="mb-4">
                        <Col className="text-center">
                            <h1 className="summary-title">Your Health Summary</h1>
                            <p className="summary-subtitle">
                                Here's a simple overview of your genetic analysis for {currentAnalysis.disease.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                            </p>
                            <p style={{ color: 'var(--color-light-gray)', fontSize: '16px' }}>
                                Analyzed {currentAnalysis.gene_count} genes • {currentAnalysis.risks.length} results found
                            </p>
                        </Col>
                    </Row>

                    {/* Analysis Switcher */}
                    <Row className="mb-4">
                        <Col>
                            <AnalysisSwitcher />
                        </Col>
                    </Row>

                    <Row className="mb-5">
                        <Col md={4} className="mb-4">
                            <Card className="summary-risk-card high-risk">
                                <div className="risk-count high">{riskCounts.high}</div>
                                <h5 className="risk-title">High Risk Genes</h5>
                                <p className="risk-description">Genes that may need attention</p>
                            </Card>
                        </Col>
                        <Col md={4} className="mb-4">
                            <Card className="summary-risk-card medium-risk">
                                <div className="risk-count medium">{riskCounts.medium}</div>
                                <h5 className="risk-title">Medium Risk Genes</h5>
                                <p className="risk-description">Genes to monitor</p>
                            </Card>
                        </Col>
                        <Col md={4} className="mb-4">
                            <Card className="summary-risk-card low-risk">
                                <div className="risk-count low">{riskCounts.low}</div>
                                <h5 className="risk-title">Low Risk Genes</h5>
                                <p className="risk-description">Genes with lower concern</p>
                            </Card>
                        </Col>
                    </Row>

                    <Row className="mb-5">
                        <Col>
                            <div className="summary-recommendations-card">
                                <h3 className="recommendations-title">Key Recommendations</h3>
                                <Row>
                                    {currentAnalysis.risks
                                        .filter(r => r.tips && r.tips.length > 0)
                                        .slice(0, 3)
                                        .map((risk, index) => (
                                        <Col md={4} key={index} className="mb-3">
                                            <div className="recommendation-item">
                                                <h6 className="recommendation-gene">{risk.gene}</h6>
                                                <p 
                                                    className="recommendation-text" 
                                                    dangerouslySetInnerHTML={{ __html: formatText(risk.tips[0]) }}
                                                ></p>
                                            </div>
                                        </Col>
                                    ))}
                                </Row>
                                {currentAnalysis.risks.filter(r => r.tips && r.tips.length > 0).length === 0 && (
                                    <div style={{ textAlign: 'center', padding: '40px' }}>
                                        <p style={{ color: 'var(--color-light-gray)' }}>
                                            No specific recommendations available for your results.
                                        </p>
                                    </div>
                                )}
                            </div>
                        </Col>
                    </Row>

                    <Row className="mb-4">
                        <Col>
                            <Alert variant="warning" className="summary-disclaimer">
                                <p className="disclaimer-text">{currentAnalysis.disclaimer}</p>
                            </Alert>
                        </Col>
                    </Row>

                    <Row>
                        <Col className="text-center">
                            <div className="summary-actions">
                                <Link to="/results" className="btn-primary-large">
                                    View Detailed Results
                                </Link>
                                <Link to="/analysis" className="btn-secondary-large">
                                    New Analysis
                                </Link>
                            </div>
                        </Col>
                    </Row>
                </motion.div>
            </Container>
        </section>
    );
};