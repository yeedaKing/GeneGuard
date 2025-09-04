import { useState } from "react";
import { Container, Row, Col } from "react-bootstrap";
import contactImg from "../assets/img/contact-img.png";
import { motion } from "framer-motion";

export const Contact = () => {
    const formInitialDetails = {
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
        message: ''
    }

    const [formDetails, setFormDetails] = useState(formInitialDetails);
    const [buttonText, setButtonText] = useState('Send');
    const [status, setStatus] = useState({});

    const onFormUpdate = (category, value) => {
        setFormDetails({
            ...formDetails,
            [category]: value
        })
    }

    const handleSubmit = async (e) => {
        e.preventDefault();
        setButtonText('Sending...');
        let response = await fetch("http://localhost:5000/contact", {
            method: "POST",
            headers: {
                "Content-Type": "Application/json;charset=utf-8"
            },
            body: JSON.stringify(formDetails),
        });
        setButtonText("Send");
        let result = response.json();
        setFormDetails(formInitialDetails);
        if (result.code === 200) {
            setStatus({ success: true, message: 'Message sent successfully!'});
        } else {
            setStatus({success: false, message: 'Something went wrong, please try again later!'});
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
        <section className="contact" id="connect">
            <Container>
                <Row className="align-items-center">
                    <Col md={6}>
                        <motion.div
                            variants={item}
                            initial="hidden"
                            whileInView="show"
                            viewport={{ once: false, amount: 0.3 }}
                            className="h-100"
                            style={{ willChange: "transform" }}   
                        >
                            <img src={contactImg} alt="Contact us" />
                        </motion.div>     
                    </Col>
                    <Col md={6}>
                    <motion.div
                        initial="hidden"
                        whileInView="show"
                        viewport={{ once: false, amount: 0.25 }}
                        variants={container}
                        style={{ willChange: "transform" }}
                    >
                        <h2>Get In Touch</h2>
                        <form onSubmit={handleSubmit}>
                            <Row>
                                <Col sm={6} className="px-1">
                                    <input type="text" value={formDetails.firstName} placeholder="First Name" onChange={(e) => onFormUpdate('firstName', e.target.value)} />
                                </Col>
                                <Col sm={6} className="px-1">
                                    <input type="text" value={formDetails.firstName} placeholder="Last Name" onChange={(e) => onFormUpdate('lastName', e.target.value)} />
                                </Col>
                                <Col sm={6} className="px-1">
                                    <input type="email" value={formDetails.email} placeholder="Email" onChange={(e) => onFormUpdate('email', e.target.value)} />
                                </Col>
                                <Col sm={6} className="px-1">
                                    <input type="tel" value={formDetails.phone} placeholder="Phone Number" onChange={(e) => onFormUpdate('phone', e.target.value)} />
                                </Col>

                                <Col md={12} className="px-1">
                                    <textArea row="6" value={formDetails.message} placeholder="Message" onChange={(e) => onFormUpdate('message', e.target.value)} />
                                    <button type="submit"><span>{buttonText}</span></button>
                                </Col>
                                {
                                    status.message &&
                                    <Col>
                                        <p className={status.success === false ? "danger": "success"}>{status.message}</p>
                                    </Col>
                                }
                            </Row>
                        </form>
                    </motion.div>
                    </Col>
                </Row>
            </Container>
        </section>
    )
}