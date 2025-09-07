import { Nav, Container, Row, Col, Tab } from "react-bootstrap";
import { ProjectCard } from "./ProjectCard";
import projImg1 from "../assets/img/project-img1.png";
import projImg2 from "../assets/img/project-img2.png";
import projImg3 from "../assets/img/project-img3.png";
import colorSharp2 from "../assets/img/color-sharp2.png";
import { motion } from "framer-motion";

// make motion versions of bootstrap components
const MotionCol = motion(Col);

export const Projects = () => {
    const projects = [
        {
            title: "TESTING 1",
            description: "Design & Development",
            imgUrl: projImg1,
        },
        {
            title: "TESTING 2",
            description: "Design & Development",
            imgUrl: projImg2,
        },
        {
            title: "TESTING 3",
            description: "Design & Development",
            imgUrl: projImg3,
        }
    ]

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

    const item = {
        hidden: {
            opacity: 0,
            y: prefersReduced ? 0 : 28
        },
        show: {
            opacity: 1, 
            y: 0,
            transition: {
                type: "spring",
                stiffness: 85,
                damping: 14,
                mass: 0.6
            },
        },
    };

    return (    
        <section className="project" id="project">
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
                    
                    <h2>Projects</h2>
                    <p>ADD DESCRIPTION</p>

                    <Tab.Container id="projects-tab" defaultActiveKey="first">
                        <Nav variant="pills" className="nav-pills mb-5 justify-content-center align-items-center" id="pills-tab">
                            <Nav.Item>
                                <Nav.Link eventKey="first">Tab One</Nav.Link>
                            </Nav.Item>
                            <Nav.Item>
                                <Nav.Link eventKey="second">Tab Two</Nav.Link>
                            </Nav.Item>
                            <Nav.Item>
                                <Nav.Link eventKey="third">
                                    Tab Three
                                </Nav.Link>
                            </Nav.Item>
                        </Nav>
                        <Tab.Content>
                            <Tab.Pane eventKey="first">
                                <motion.div
                                    variants={container}
                                    initial="hidden"
                                    whileInView="show"
                                    viewport={{ once: false, amount: 0.2 }}
                                    style={{ willChange: "transform" }}
                                >
                                    <Row className="g-4 align-items-stretch">
                                        {
                                            projects.map((project, index) => (
                                                <MotionCol
                                                    key={index}
                                                    xs={12}
                                                    sm={6}
                                                    lg={4}
                                                    variants={item}
                                                    className="h-100"
                                                    style={{ willChange: "transform" }}
                                                >
                                                    <ProjectCard {...project} />
                                                </MotionCol>
                                            ))
                                        }
                                    </Row>
                                </motion.div>
                            </Tab.Pane>
                            <Tab.Pane eventKey="second">ADD LATER</Tab.Pane>
                            <Tab.Pane eventKey="third">ADD LATER</Tab.Pane>
                        </Tab.Content>
                    </Tab.Container>
                    </motion.div>
                    </Col>
                </Row>
            </Container>
            <img className="background-image-right" src={colorSharp2}></img>
        </section>
    )
}