import { Container, Row, Col } from "react-bootstrap";
import { useState, useEffect } from "react";
import { Document, Page, pdfjs } from "react-pdf";
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';
import myPdfFile from 'C:\Users\chols\OneDrive\personal labs\ChoResume.pdf';

pdfjs.GlobalWorkerOptions.workerSrc = new URL(
    "pdfjs-dist/build/pdf.worker.min.mjs",
    import.meta.url
).toString();

export const Resume = () => {
    const [numPages, setNumPages] = useState(null);
    
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
    const onDocumentLoadSuccess = ({ numPages }) => setNumPages(numPages);

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
                            <Document file="/ChoResume.pdf" onLoadSuccess={onDocumentLoadSuccess}>
                                {Array.from(new Array(numPages || 0), (_, i) =>(
                                    <Page
                                        key={`page_${i + 1}`}
                                        pageNumber={i + 1}
                                        renderTextLayer={false}
                                        renderAnnotationLayer={false}
                                    />
                                ))}
                            </Document>
                            <p style={{ marginTop: 12 }}>
                                <a href="/ChoResume.pdf" download>Download PDF</a>
                            </p>
                        </div>
                    </motion.div>
                    </Col>
                </Row>
            </Container>
        </section>
    );
};