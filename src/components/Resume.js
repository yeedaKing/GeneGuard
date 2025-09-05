import { Container, Row, Col } from "react-bootstrap";
import { useState, useEffect } from "react";
import { Document, Page, pdfjs } from "react-pdf";
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';
import { motion } from "framer-motion";


pdfjs.GlobalWorkerOptions.workerSrc = new URL(
    "pdfjs-dist/build/pdf.worker.min.mjs",
    import.meta.url
).toString();

export const Resume = () => {
    const viewerURL = "/ChoResume.pdf#zoom=page-width";
    
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
        <section className="resume" id="resume">
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
                        <div className="resume-bx">
                            <h2>Resume</h2>
                            <div className="pdf-actions">
                                <a className="btn" href="/ChoResume.pdf" target="_blank" rel="noopener">Open in new tab</a>
                            </div>
                        
                            <div className="pdf-wrap">
                                <iframe
                                    src={viewerURL}
                                    title="Lisa Cho - Resume"
                                    loading="lazy"
                                />
                            </div>
                        </div>
                    </motion.div>
                    </Col>
                </Row>
            </Container>
        </section>
    );
};