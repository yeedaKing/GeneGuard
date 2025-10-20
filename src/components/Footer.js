import { Container, Row, Col } from "react-bootstrap";

export const Footer = () => {
    const currentYear = new Date().getFullYear();

    return (
        <footer className="footer">
            <Container>
                <Row className="align-items-center">
                    <Col md={6}>
                        <div style={{ marginBottom: '16px' }}>
                            <h5 style={{ 
                                color: '#fff', 
                                marginBottom: '8px',
                                fontSize: '20px',
                                fontWeight: '600'
                            }}>
                                GeneGuard
                            </h5>
                            <p style={{ 
                                color: 'var(--color-light-gray)', 
                                fontSize: '14px',
                                margin: '0'
                            }}>
                                Helping families understand their genetic health
                            </p>
                        </div>
                    </Col>
                    <Col md={6} className="text-md-end">
                        <p style={{ 
                            color: 'var(--color-light-gray)', 
                            fontSize: '12px',
                            margin: '0'
                        }}>
                            © {currentYear} 4Sum Team. Made for hackathon.
                        </p>
                    </Col>
                </Row>
                <Row className="mt-3">
                    <Col>
                        <div style={{
                            borderTop: '1px solid rgba(255, 255, 255, 0.1)',
                            paddingTop: '16px'
                        }}>
                            <p style={{ 
                                color: 'var(--color-light-gray)', 
                                fontSize: '12px',
                                textAlign: 'center',
                                margin: '0',
                                lineHeight: '1.4'
                            }}>
                                <strong>Note:</strong> This is a prototype app for educational purposes. 
                                Not for actual medical use. Always consult healthcare professionals.
                            </p>
                        </div>
                    </Col>
                </Row>
            </Container>
        </footer>
    );
};