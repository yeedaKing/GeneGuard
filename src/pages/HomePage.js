import { Container, Row, Col } from "react-bootstrap";
import { Link } from "react-router-dom";
import uploadImg from "../assets/img/upload.png";
import familyImg from "../assets/img/family.png";
import tipsImg from "../assets/img/tips.png";
import chartImg from "../assets/img/chart.png";
import shareImg from "../assets/img/share.png";
import trackImg from "../assets/img/track.png";
import fileImg from "../assets/img/file.png";
import aiImg from "../assets/img/ai.png";
import reportImg from "../assets/img/report.png";
import shieldImg from "../assets/img/shield.png";
import brainImg from "../assets/img/brain.png";
import heartImg from "../assets/img/heart.png";

export const HomePage = () => {
    const features = [
        {
            imgUrl: uploadImg,
            title: "Upload Your Genes",
            description: "Drop your genomic file and let our AI analyze it for health risks and insights."
        },
        {
            imgUrl: familyImg,
            title: "Family Dashboard",
            description: "Connect with family members to see shared genetic risks and plan together."
        },
        {
            imgUrl: tipsImg,
            title: "Get Smart Tips",
            description: "Receive personalized lifestyle recommendations based on your unique genetic profile."
        },
        {
            imgUrl: chartImg,
            title: "Risk Scores",
            description: "Easy-to-understand risk levels for various genetic conditions with clear explanations."
        },
        {
            imgUrl: shareImg,
            title: "Share Results",
            description: "Securely share your genomic insights with family or healthcare providers."
        },
        {
            imgUrl: trackImg,
            title: "Track Progress",
            description: "Monitor your health journey and see how lifestyle changes impact your wellbeing."
        }
    ];

    const scrollToFeatures = () => {
        const element = document.querySelector('#features');
        if (element) {
            element.scrollIntoView({ behavior: 'smooth' });
        }
    };

    return (
        <>
            {/* Hero Section */}
            <section className="hero">
                <Container>
                    <Row className="align-items-center min-vh-100">
                        <Col lg={8}>
                            <div>
                                <h1>Understand Your Family's Genetic Health</h1>
                                <p className="subtitle">AI-powered genomic analysis for better family planning</p>
                                <p>
                                    Upload your genetic data and get personalized insights about health risks, 
                                    compatibility with your partner, and actionable recommendations for your family's wellbeing.
                                </p>
                                <div className="cta-buttons">
                                    <Link to="/auth" className="btn-primary-large">
                                        Start Analysis
                                    </Link>
                                    <button 
                                        onClick={scrollToFeatures}
                                        className="btn-secondary-large"
                                        style={{ border: 'none', background: 'transparent' }}
                                    >
                                        Learn More
                                    </button>
                                </div>
                            </div>
                        </Col>
                    </Row>
                </Container>
            </section>

            {/* About Section */}
            <section id="about" className="about-section">
                <Container>
                    <Row>
                        <Col lg={8} className="mx-auto text-center">
                            <h2 className="section-title">About GeneGuard</h2>
                            <p className="section-description">
                                GeneGuard helps families understand their genetic health through AI-powered analysis. 
                                Our mission is to make genetic insights accessible, understandable, and actionable 
                                for better family health planning and decision-making.
                            </p>
                            <Row className="mt-5">
                                <Col md={4} className="mb-4">
                                    <div className="value-prop text-center">
                                        <div className="value-icon">
                                            <img src={shieldImg} alt="SHIELD"/>
                                        </div>
                                        <h5 className="value-title">Privacy First</h5>
                                        <p className="value-description">
                                            Your genetic data is encrypted and never shared without your permission
                                        </p>
                                    </div>
                                </Col>
                                <Col md={4} className="mb-4">
                                    <div className="value-prop text-center">
                                        <div className="value-icon">
                                            <img src={brainImg} alt="BRAIN"/>
                                        </div>
                                        <h5 className="value-title">AI-Powered</h5>
                                        <p className="value-description">
                                            Advanced algorithms analyze your data against the latest research
                                        </p>
                                    </div>
                                </Col>
                                <Col md={4} className="mb-4">
                                    <div className="value-prop text-center">
                                        <div className="value-icon">
                                            <img src={heartImg} alt="HEART"/>
                                        </div>
                                        <h5 className="value-title">Family-Focused</h5>
                                        <p className="value-description">
                                            Built specifically for families planning their health together
                                        </p>
                                    </div>
                                </Col>
                            </Row>
                        </Col>
                    </Row>
                </Container>
            </section>

            {/* How It Works Section */}
            <section className="features" id="features">
                <Container>
                    <div>
                        <h2>How GeneGuard Works</h2>
                        <Row className="g-4">
                            {features.map((feature, index) => (
                                <Col key={index} md={6} lg={4}>
                                    <div className="feature-card">
                                        <div className="feature-icon">
                                            <img 
                                                src={feature.imgUrl}
                                                alt={feature.title}
                                            />
                                        </div>
                                        <h3>{feature.title}</h3>
                                        <p>{feature.description}</p>
                                    </div>
                                </Col>
                            ))}
                        </Row>
                    </div>
                </Container>
            </section>

            {/* Process Section */}
            <section className="process-section">
                <Container>
                    <div>
                        <h2 className="section-title-white text-center">Simple 3-Step Process</h2>
                        <Row className="g-4">
                            <Col md={4} className="text-center">
                                <div className="process-icon">
                                    <img src={fileImg} alt="Upload" />
                                </div>
                                <h4 className="process-title">1. Upload Your Data</h4>
                                <p className="process-description">
                                    Upload your genomic file securely to our platform
                                </p>
                            </Col>
                            <Col md={4} className="text-center">
                                <div className="process-icon">
                                    <img src={aiImg} alt="AI" />
                                </div>
                                <h4 className="process-title">2. AI Analysis</h4>
                                <p className="process-description">
                                    Our system analyzes your variants against disease databases and research
                                </p>
                            </Col>
                            <Col md={4} className="text-center">
                                <div className="process-icon">
                                    <img src={reportImg} alt="Report" />
                                </div>
                                <h4 className="process-title">3. Get Your Report</h4>
                                <p className="process-description">
                                    Receive clear risk assessments and personalized health recommendations
                                </p>
                            </Col>
                        </Row>
                    </div>
                </Container>
            </section>

            {/* Pricing Section */}
            <section id="pricing" className="pricing-section">
                <Container>
                    <Row className="text-center mb-5">
                        <Col>
                            <h2 className="section-title">Simple, Family-Friendly Pricing</h2>
                            <p className="section-description pricing-intro">
                                Get started for free and upgrade as your family grows.
                            </p>
                        </Col>
                    </Row>
                    
                    <Row className="justify-content-center">
                        <Col lg={4} md={6} className="mb-4">
                            <div className="pricing-card">
                                <h4 className="pricing-tier">Free</h4>
                                <div className="pricing-amount">$0</div>
                                <p className="pricing-subtitle">Perfect for individuals getting started</p>
                                <ul className="pricing-features">
                                    <li>Complete genetic health analysis</li>
                                    <li>AI-powered risk assessmentse</li>
                                    <li>Personalized lifestyle recommendations</li>   
                                    <li>Secure data encryption</li>
                                    <li>Downloadable health reports</li>                                 
                                </ul>
                                <Link to="/auth" className="btn-primary-large pricing-btn featured-btn">
                                    Get Started Free
                                </Link>
                            </div>
                        </Col>
                        
                        <Col lg={4} md={6} className="mb-4">
                            <div className="pricing-card featured">
                                <div className="pricing-badge">RECOMMENDED</div>
                                <h4 className="pricing-tier">Family Plan</h4>
                                <div className="pricing-amount">$10</div>
                                <p className="pricing-subtitle">For families planning together</p>
                                <ul className="pricing-features">
                                    <li>Complete genetic health analysis</li>
                                    <li>AI-powered risk assessments</li>
                                    <li>Personalized lifestyle recommendations</li>
                                    <li>Secure data encryption</li>
                                    <li>Downloadable health reports</li>
                                    <li>Family group management</li>
                                    <li>Partner compatibility analysis</li>
                                </ul>
                                <Link to="/auth" className="btn-primary-large pricing-btn featured-btn">
                                    Start Family Plan
                                </Link>
                            </div>
                        </Col>
                    </Row>
                </Container>
            </section>

            {/* Final CTA Section */}
            <section className="final-cta">
                <Container>
                    <Row className="text-center">
                        <Col>
                            <div>
                                <h2 className="cta-title">Ready to Learn About Your Genes?</h2>
                                <p className="cta-description">
                                    Join families who are taking control of their health with genetic insights.
                                </p>
                                <Link to="/auth" className="btn-primary-large">
                                    Get Started Now
                                </Link>
                            </div>
                        </Col>
                    </Row>
                </Container>
            </section>
        </>
    );
};