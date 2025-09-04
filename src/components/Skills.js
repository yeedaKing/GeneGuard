import Carousel from "react-multi-carousel";
import "react-multi-carousel/lib/styles.css";
import { Container, Row, Col } from "react-bootstrap";
import programming from "../assets/img/programming.png";
import software from "../assets/img/software.png";
import platform from "../assets/img/platform.png";
import automated from "../assets/img/automated.png";
import abilities from "../assets/img/abilities.png";
import { motion } from "framer-motion";

export const Skills = () => {
    const responsive = {
        superLargeDesktop: {
            breakpoint: { max: 4000, min: 3000 },
            items: 5
        },
        desktop: {
            breakpoint: { max: 3000, min: 1024 },
            items: 3
        },
        tablet: {
            breakpoint: { max: 1024, min: 464 },
            items: 2
        },
        mobile: {
            breakpoint: { max: 464, min: 0 },
            items: 1
        }
    };
    
    const prefersReduced = typeof window !== "undefined" &&
        window.matchMedia &&
        window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const container = {
        hidden: { 
            opacity: 0, 
            y: prefersReduced ? 0 : 30 
        },
        show: {
            opacity: 1,
            y: 0,
            transition: { 
                type: "spring", 
                stiffness: 80, 
                damping: 14, 
                mass: 0.6,
                staggerChildren: 0.08, 
                delayChildren: 0.05, 
            },
        },
    };

    return (
        <section className="skill" id="skills">
            <Container>
                <Row>
                    <Col>
                    <motion.div
                        initial="hidden"
                        whileInView="show"
                        viewport={{ once: false, amount: 0.25 }}
                        variants={container}
                        style={{ willChange: "transform" }}
                    >
                        <div className="skill-bx">
                            <h2>
                                Skills
                            </h2>
                            <p>Technologies and tools I’ve applied in coursework, projects, and internships.</p>
                            <Carousel responsive={responsive} infinite={true} className="skill-slider">
                                <div className="item">
                                    <img src={programming} alt="Image" />
                                    <h4>Languages</h4>
                                    <h6>Python<br></br>JavaScript<br></br>C/C++<br></br>SQL<br></br>HTML/CSS<br></br>React.js</h6>
                                </div>
                                <div className="item">
                                    <img src={software} alt="Image" />
                                    <h4>Systems & Development</h4>
                                    <h6>Backend Systems<br></br>Distributed Systems<br></br>Frontend Development<br></br>Full-Stack Development<br></br>UI Design<br></br>REST APIs</h6>
                                </div>
                                <div className="item">
                                    <img src={platform} alt="Image" />
                                    <h4>Tools & Platforms</h4>
                                    <h6>Git/Github<br></br>Docker<br></br>Linux/Unix<br></br>BigQuery</h6>
                                </div>
                                <div className="item">
                                    <img src={automated} alt="Image" />
                                    <h4>AI & Automation</h4>
                                    <h6>OpenAI API<br></br>Puppeteer<br></br>Zapier<br></br>n8n</h6>
                                </div>      
                                <div className="item">
                                    <img src={abilities} alt="Image" />
                                    <h4>Soft Skills</h4>
                                    <h6>Collaboration & Teamwork<br></br>Communication<br></br>Adaptability<br></br>Time Management<br></br>Problem Solving</h6>
                                </div>                                                                                                
                            </Carousel>
                        </div>
                    </motion.div>
                    </Col>
                </Row>
            </Container>
        </section>
    )
}