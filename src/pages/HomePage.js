import { Container, Row, Col } from "react-bootstrap";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
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
            title: "Relationship Dashboard",
            description: "Connect with family members and friends to see shared genetic risks and plan together."
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

    const fadeInUp = {
        hidden: { opacity: 0, y: 60 },
        visible: {
            opacity: 1,
            y: 0,
            transition: { duration: 0.6, ease: "easeOut" }
        }
    };

    const staggerContainer = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: {
                staggerChildren: 0.2
            }
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
                                <h1>Protect Your Family's Health Future</h1>
                                <p className="subtitle">Genetic health insights to help you make informed decisions for your family</p>
                                <p>
                                    Take charge of your family's wellbeing by understanding inherited health 
                                    risks. Upload genetic data to discover potential conditions, get preventive care 
                                    recommendations, and make informed decisions about your family's health future 
                                    together.
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
            <motion.section 
                id="about"
                className="about-section"
                initial="hidden"
                whileInView="visible"
                viewport={{ once: false, amount: 0.1 }}
                variants={ staggerContainer }
            >
                <Container>
                    <Row>
                        <Col lg={8} className="mx-auto text-center">
                            <motion.h2 className="section-title" variants={ fadeInUp }>
                                About GeneGuard
                            </motion.h2>
                            <motion.p className="section-description" variants={ fadeInUp }>
                                GeneGuard helps families stay ahead of genetic health risks. By understanding 
                                your family's genetic predispositions early, you can make informed healthcare decisions,
                                pursue preventive care, and protect the people you love most. Knowledge is the first step to 
                                keeping your family healthy
                            </motion.p>
                            <Row className="mt-5">
                                <Col md={4} className="mb-4">
                                    <motion.div className="value-prop text-center" variants={ fadeInUp }>
                                        <div className="value-icon">
                                            <img src={shieldImg} alt="SHIELD"/>
                                        </div>
                                        <h5 className="value-title">Family Protection</h5>
                                        <p className="value-description">
                                            Early detection of genetic risks helps you protect your loved ones through preventive care
                                        </p>
                                    </motion.div>
                                </Col>
                                <Col md={4} className="mb-4">
                                    <motion.div className="value-prop text-center" variants={ fadeInUp }>
                                        <div className="value-icon">
                                            <img src={brainImg} alt="BRAIN"/>
                                        </div>
                                        <h5 className="value-title">Peace of Mind</h5>
                                        <p className="value-description">
                                            Know what to watch for and when to seek medical attention based on your family's genetics
                                        </p>
                                    </motion.div>
                                </Col>
                                <Col md={4} className="mb-4">
                                    <motion.div className="value-prop text-center" variants={ fadeInUp }>
                                        <div className="value-icon">
                                            <img src={heartImg} alt="HEART"/>
                                        </div>
                                        <h5 className="value-title">Informed Decisions</h5>
                                        <p className="value-description">
                                            Make better healthcare choices for your family with genetic insights and expert recommendations
                                        </p>
                                    </motion.div>
                                </Col>
                            </Row>
                        </Col>
                    </Row>
                </Container>
           </motion.section>

            {/* How It Works Section */}
            <motion.section 
                className="features" 
                id="features"
                initial="hidden"
                whileInView="visible"
                viewport={{ once: false, amount: 0.2 }}
                variants={staggerContainer}
            >
                <Container>
                    <div>
                        <motion.h2 variants={ fadeInUp }>How GeneGuard Works</motion.h2>
                        <Row className="g-4">
                            {features.map((feature, index) => (
                                <Col key={index} md={6} lg={4}>
                                    <motion.div className="feature-card" variants={ fadeInUp } whileHover={{ y: -8 }} transition={{ duration: 0.2 }}>
                                        <div className="feature-icon">
                                            <img 
                                                src={feature.imgUrl}
                                                alt={feature.title}
                                            />
                                        </div>
                                        <h3>{feature.title}</h3>
                                        <p>{feature.description}</p>
                                    </motion.div>
                                </Col>
                            ))}
                        </Row>
                    </div>
                </Container>
            </motion.section>

            {/* Process Section */}
            <motion.section 
                className="process-section"
                initial="hidden"
                whileInView="visible"
                viewport={{ once: false, amount: 0.2 }}
                variants={staggerContainer}
            >
                <Container>
                    <div>
                        <motion.h2 className="section-title-white text-center" variants={ fadeInUp }>
                            Simple 3-Step Process
                        </motion.h2>
                        <Row className="g-4">
                            <Col md={4} className="text-center">
                                <motion.div variants={ fadeInUp }>
                                    <div className="process-icon">
                                        <img src={fileImg} alt="Upload" />
                                    </div>
                                    <h4 className="process-title">1. Upload Your Data</h4>
                                    <p className="process-description">
                                        Upload your genomic file securely to our platform
                                    </p>
                                </motion.div>
                            </Col>
                            <Col md={4} className="text-center">
                                <motion.div variants={ fadeInUp }>
                                    <div className="process-icon">
                                        <img src={aiImg} alt="AI" />
                                    </div>
                                    <h4 className="process-title">2. AI Analysis</h4>
                                    <p className="process-description">
                                        Our system analyzes your variants against disease databases and research
                                    </p>
                                </motion.div>
                            </Col>
                            <Col md={4} className="text-center">
                                <motion.div variants={ fadeInUp }>
                                    <div className="process-icon">
                                        <img src={reportImg} alt="Report" />
                                    </div>
                                    <h4 className="process-title">3. Get Your Report</h4>
                                    <p className="process-description">
                                        Receive clear risk assessments and personalized health recommendations
                                    </p>
                                </motion.div>
                            </Col>
                        </Row>
                    </div>
                </Container>
            </motion.section>

            {/* Pricing Section */}
            <motion.section 
                id="pricing" 
                className="pricing-section"
                initial="hidden"
                whileInView="visible"
                viewport={{ once: false, amount: 0.2 }}
                variants={staggerContainer}
            >
                <Container>
                    <Row className="text-center mb-5">
                        <Col>
                            <motion.h2 className="section-title" variants={ fadeInUp }>
                                Simple, Family-Friendly Pricing
                            </motion.h2>
                            <motion.p className="section-description pricing-intro" variants={ fadeInUp }>
                                Get started for free and upgrade as your family grows.
                            </motion.p>
                        </Col>
                    </Row>
                    
                    <Row className="justify-content-center">
                        <Col lg={4} md={6} className="mb-4">
                            <motion.div className="pricing-card" variants={ fadeInUp }>
                                <h4 className="pricing-tier">Free</h4>
                                <div className="pricing-amount">$0</div>
                                <p className="pricing-subtitle">Perfect for individuals getting started</p>
                                <ul className="pricing-features">
                                    <li>Complete genetic health analysis</li>
                                    <li>AI-powered risk assessments</li>
                                    <li>Personalized lifestyle recommendations</li>   
                                    <li>Secure data encryption</li>
                                    <li>Downloadable health reports</li>                                 
                                </ul>
                                <Link to="/auth" className="btn-primary-large pricing-btn featured-btn">
                                    Get Started Free
                                </Link>
                            </motion.div>
                        </Col>
                        
                        <Col lg={4} md={6} className="mb-4">
                            <motion.div className="pricing-card featured" variants={ fadeInUp }>
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
                            </motion.div>
                        </Col>
                    </Row>
                </Container>
            </motion.section>

            {/* Final CTA Section */}
            <motion.section 
                className="final-cta"
                initial="hidden"
                whileInView="visible"
                viewport={{ once: false, amount: 0.5 }}
                variants={fadeInUp}
            >
                <Container>
                    <Row className="text-center">
                        <Col>
                            <div>
                                <h2 className="cta-title">Ready to Protect Your Family's Health?</h2>
                                <p className="cta-description">
                                    Join families who are taking proactive steps to understand and prevent genetic health risks. Start building a healthier future for the people you love most.
                                </p>
                                <Link to="/auth" className="btn-primary-large">
                                    Get Started Now
                                </Link>
                            </div>
                        </Col>
                    </Row>
                </Container>
            </motion.section>
        </>
    );
};