import { useEffect, useRef, useState } from "react";
import { Document, Page, pdfjs } from "react-pdf";
import { createPortal } from 'react-dom'

pdfjs.GlobalWorkerOptions.workerSrc =`//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

export const ResumeViewer = () => {
    const [numPages, setNumPages] = useState(0);
    const [page, setPage] = useState(1);
    const [zoom, setZoom] = useState(1);
    const wrapRef = useRef(null);
    const [wrapW, setWrapW] = useState(0);

    useEffect (() => {
        const ro = new ResizeObserver(e => setWrapW(e[0].contentRect.width));
        if (wrapRef.current) ro.observe(wrapRef.current);
        return () => ro.disconnect();
    }, []);

    const onLoad = ({ numPages }) => setNumPages(numPages);
    const STEP = 0.1, MIN = 0.6, MAX = 2;

    const baseWidth = Math.min(1100, wrapW || 0);
    const renderedWidth = baseWidth * zoom;
    const barStyle = renderedWidth ? { width: renderedWidth, left: "50%", transform: "translateX(-50%)" } : undefined;

    const openPrint = () => window.open("/ChoResume.pdf", "_blank");

    return (
        <div className="pdf-viewer" ref={wrapRef}>
            {wrapRef.current && createPortal(<div className="gv-bar" style = {barStyle}>
                <div className="gv-title">ChoResume.pdf</div>
                <div className="gv-actions">
                    <a className="gv-action" href="/ChoResume.pdf" download aria-label="Download">
                        <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
                            <path d="M12 3v10m0 0 4-4m-4 4-4-4M5 21h14" stroke="currentColor" strokeWidth="2" strokeLineCap="round" strokeLinejoin="round"/>
                        </svg>
                    </a>
                    <button className="gv-action" onClick={openPrint} aria-label="Print">
                        <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
                            <path d="M6 9V3h12v6M6 14h12v7H6v-7Z" stroke="currentColor" strokeWidth="2" />
                            <path d="M6 12H5a2 2 0 0 1-2-2V9a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v1a2 2 0 0 1-2 2h-1" stroke="currentColor" strokeWidth="2" />                   
                        </svg>
                    </button>
                </div>
            </div>, wrapRef.current)}
            <div className="pdf-stage">
                <Document file="/ChoResume.pdf" onLoadSuccess={onLoad} loading="Loading...">
                    <Page 
                        pageNumber={page}
                        width={renderedWidth}
                        renderTextLayer={false}
                        renderAnnotationLayer={false}
                    />
                </Document>
            </div>
            {wrapRef.current && createPortal(<div className="gv-bottom">
                <div className="gv-pill">
                    <span className="gv-text">Page</span>
                    <span className="gv-page-cur">{page || 1}</span>
                    <span className="gv-text">/</span>
                    <span className="gv-text">{numPages || 1}</span>
                    <span className="gv-sep" />
                    <button className="gv-btn" onClick={() => setZoom(z => Math.max(MIN, +(z - STEP).toFixed(2)))} aria-label="Zoom out">-</button>
                    <span className="gv-zoom">{Math.round(zoom * 100)}%</span>
                    <button className="gv-btn" onClick={() => setZoom(z => Math.min(MAX, +(z + STEP).toFixed(2)))} aria-label="Zoom in">+</button>
                </div>
            </div>, wrapRef.current)}
        </div>
    );
};