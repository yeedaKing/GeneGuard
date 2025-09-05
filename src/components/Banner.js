import { useState, useEffect } from "react";
import { Container, Row, Col } from "react-bootstrap";
import { ArrowRightCircle } from "react-bootstrap-icons";
import headerImg from "../assets/img/header-img.png";
import { motion } from "framer-motion";
import { HashLink } from "react-router-hash-link";

export const Banner = () => {
    const [loopNum, setLoopNum] = useState(0);
    const [isDeleting, setIsDeleting] = useState(false);
    const toRotate = [ "CS Student", "Software Engineer", "Web Developer" ];
    const [text, setText] = useState('');
    const [delta, setDelta] = useState(100 - Math.random() * 100);
    const period = 800;

    const container = {
        hidden: { opacity: 0 },
        show: {
            opacity: 1,
            transition: {
                duration: 0.6,
                ease: "easeOut",
                staggerChildren: 0.08,
                delayChildren: 0.05,
            },
        },
    };

    useEffect(() => {
        let ticker = setInterval(() => {
            tick();
        }, delta)

        return () => { clearInterval(ticker)};
    }, [text])

    const tick = () => {
        let i = loopNum % toRotate.length;
        let fullText = toRotate[i];
        let updatedText = isDeleting ? fullText.substring(0, text.length - 1) : fullText.substring(0, text.length + 1);

        setText(updatedText);

        if (isDeleting) {
            setDelta(prevDelta => prevDelta / 2); 
        }

        if (!isDeleting && updatedText === fullText) {
            setIsDeleting(true);
            setDelta(period);
        } else if (isDeleting && updatedText === '') {
            setIsDeleting(false);
            setLoopNum(loopNum + 1);
            setDelta(300);
        }
    }
    return (
        <section className="banner" id="home">
            <Container>
                <Row className="align-items-center">
                    <Col xs={12} md={6} xl={7}>
                        <motion.div
                            initial="hidden"
                            whileInView="show"
                            viewport={{ once: false, amount: 0.25 }}
                            variants={container}
                            style={{ willChange: "transform" }}
                        >
                            <div>
                                <span className="tagline">Welcome to my Portfolio!</span>
                                <h1>{`Hello! I'm Lisa Cho,`}<br></br><span className="wrap"> {text}</span></h1>
                                <p>I’m a Korean-American Computer Science student at CU Denver (’26) pursuing software engineering and systems development. With experience in full-stack projects, backend systems, and distributed computing, I’m passionate about building reliable solutions and contributing to collaborative, growth-oriented teams.</p>
                                <HashLink smooth to='#connect'>
                                    <button className="vvd">Let's connect<ArrowRightCircle size={25}></ArrowRightCircle></button>
                                </HashLink>
                            </div>
                        </motion.div>
                    </Col>
                    <Col xs={12} md={6} xl={5}>
                        <img src={headerImg} alt="Header Img" />
                    </Col>
                </Row>
            </Container>

        </section>
    )
}