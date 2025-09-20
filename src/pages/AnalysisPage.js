import { useState, useContext } from 'react';
import { Container, Row, Col, Alert } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { AuthContext } from '../context/AuthContext';
import { api, validateGenomicFile } from '../services/api';

export const AnalysisPage = () => {
    const { user } = useContext(AuthContext);
    const navigate = useNavigate();
    
    const [file, setFile] = useState(null);
    const [uploading, setUploading] = useState(false);
    const [analyzing, setAnalyzing] = useState(false);
    const [error, setError] = useState('');
    const [dragOver, setDragOver] = useState(false);

    const handleFileSelect = (selectedFile) => {
        const validation = validateGenomicFile(selectedFile);
        
        if (!validation.isValid) {
            setError(validation.errors.join(', '));
            return;
        }
        
        setFile(selectedFile);
        setError('');
    };

    const handleDrop = (e) => {
        e.preventDefault();
        setDragOver(false);
        
        const droppedFile = e.dataTransfer.files[0];
        if (droppedFile) {
            handleFileSelect(droppedFile);
        }
    };

    const handleDragOver = (e) => {
        e.preventDefault();
        setDragOver(true);
    };

    const handleDragLeave = (e) => {
        e.preventDefault();
        setDragOver(false);
    };

    const startAnalysis = async () => {
        if (!file || !user) return;

        setUploading(true);
        setError('');

        try {
            // Upload file first
            console.log('Uploading file...');
            const uploadResult = await api.genomics.uploadFile(file, user.id);
            
            setUploading(false);
            setAnalyzing(true);

            // Start analysis
            console.log('Starting analysis...');
            const analysisResult = await api.genomics.analyzeGenome({
                fileId: uploadResult.fileId,
                userId: user.id,
                analysisType: 'comprehensive'
            });

            // Wait for results (this is mocked)
            console.log('Getting results...');
            const results = await api.genomics.getResults(analysisResult.analysisId);
            
            // Store results in localStorage for demo
            localStorage.setItem('analysisResults', JSON.stringify(results));
            
            // Navigate to results page
            navigate('/results');

        } catch (err) {
            console.error('Analysis error:', err);
            setError('Something went wrong. Please try again.');
            setUploading(false);
            setAnalyzing(false);
        }
    };

    const resetUpload = () => {
        setFile(null);
        setError('');
        setUploading(false);
        setAnalyzing(false);
    };

    return (
        <section className="upload-section">
            <Container>
                <Row className="justify-content-center">
                    <Col lg={8}>
                        <motion.div
                            initial={{ opacity: 0, y: 30 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.6 }}
                        >
                            <h1 style={{ 
                                color: '#fff', 
                                textAlign: 'center', 
                                marginBottom: '24px',
                                fontSize: '48px',
                                fontWeight: '700'
                            }}>
                                Upload Your Genetic Data
                            </h1>
                            <p style={{ 
                                color: 'var(--color-light-gray)', 
                                textAlign: 'center', 
                                marginBottom: '48px',
                                fontSize: '18px'
                            }}>
                                Upload your genomic file to get personalized health insights and risk assessments.
                            </p>

                            {error && (
                                <Alert variant="danger" className="mb-4">
                                    {error}
                                </Alert>
                            )}

                            {!file ? (
                                <div
                                    className={`upload-area ${dragOver ? 'dragover' : ''}`}
                                    onDrop={handleDrop}
                                    onDragOver={handleDragOver}
                                    onDragLeave={handleDragLeave}
                                    onClick={() => document.getElementById('file-input').click()}
                                >
                                    <div className="upload-icon">ADD ICON</div>
                                    <h3>Drag & Drop Your File Here</h3>
                                    <p>Or click to browse files</p>
                                    <p style={{ 
                                        fontSize: '14px', 
                                        opacity: '0.7', 
                                        marginTop: '16px' 
                                    }}>
                                        Supported: .vcf, .txt, .csv, .json files up to 50MB
                                    </p>
                                    <input
                                        id="file-input"
                                        type="file"
                                        accept=".vcf,.txt,.csv,.json"
                                        onChange={(e) => handleFileSelect(e.target.files[0])}
                                        style={{ display: 'none' }}
                                    />
                                </div>
                            ) : (
                                <div style={{
                                    background: 'rgba(255, 255, 255, 0.05)',
                                    borderRadius: '12px',
                                    padding: '32px',
                                    textAlign: 'center'
                                }}>
                                    <h4 style={{ color: '#fff', marginBottom: '16px' }}>
                                        File Ready for Analysis
                                    </h4>
                                    <p style={{ color: 'var(--color-light-gray)', marginBottom: '24px' }}>
                                        <strong>{file.name}</strong>
                                        <br />
                                        Size: {(file.size / (1024 * 1024)).toFixed(2)} MB
                                    </p>
                                    
                                    {!uploading && !analyzing && (
                                        <div style={{ display: 'flex', gap: '16px', justifyContent: 'center', flexWrap: 'wrap' }}>
                                            <button 
                                                className="btn-primary-large"
                                                onClick={startAnalysis}
                                            >
                                                Start Analysis
                                            </button>
                                            <button 
                                                className="btn-secondary-large"
                                                onClick={resetUpload}
                                            >
                                                Choose Different File
                                            </button>
                                        </div>
                                    )}

                                    {uploading && (
                                        <div style={{ color: 'var(--color-sage)' }}>
                                            <div className="loading" style={{ margin: '0 auto 16px' }}></div>
                                            <p>Uploading file...</p>
                                        </div>
                                    )}

                                    {analyzing && (
                                        <div style={{ color: 'var(--color-sage)' }}>
                                            <div className="loading" style={{ margin: '0 auto 16px' }}></div>
                                            <p>Analyzing your genetic data...</p>
                                            <p style={{ 
                                                fontSize: '14px', 
                                                opacity: '0.8', 
                                                marginTop: '8px' 
                                            }}>
                                                This usually takes 2-3 minutes...
                                            </p>
                                        </div>
                                    )}
                                </div>
                            )}
                        </motion.div>
                    </Col>
                </Row>

                {/* Information Section */}
                <Row className="mt-5">
                    <Col>
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.6, delay: 0.3 }}
                            style={{
                                background: 'rgba(255, 255, 255, 0.05)',
                                borderRadius: '12px',
                                padding: '32px'
                            }}
                        >
                            <h3 style={{ color: '#fff', marginBottom: '24px', textAlign: 'center' }}>
                                What Happens During Analysis?
                            </h3>
                            <Row>
                                <Col md={4} className="text-center mb-4">
                                    <div style={{ fontSize: '48px', marginBottom: '16px' }}>ADD ICON</div>
                                    <h5 style={{ color: 'var(--color-sage)', marginBottom: '12px' }}>
                                        Variant Detection
                                    </h5>
                                    <p style={{ color: 'var(--color-light-gray)', fontSize: '14px' }}>
                                        We scan your genetic variants against disease databases
                                    </p>
                                </Col>
                                <Col md={4} className="text-center mb-4">
                                    <div style={{ fontSize: '48px', marginBottom: '16px' }}>ADD ICON</div>
                                    <h5 style={{ color: 'var(--color-sage)', marginBottom: '12px' }}>
                                        Risk Calculation
                                    </h5>
                                    <p style={{ color: 'var(--color-light-gray)', fontSize: '14px' }}>
                                        Calculate personalized risk scores for genetic conditions
                                    </p>
                                </Col>
                                <Col md={4} className="text-center mb-4">
                                    <div style={{ fontSize: '48px', marginBottom: '16px' }}>ADD ICON</div>
                                    <h5 style={{ color: 'var(--color-sage)', marginBottom: '12px' }}>
                                        AI Recommendations
                                    </h5>
                                    <p style={{ color: 'var(--color-light-gray)', fontSize: '14px' }}>
                                        Generate actionable lifestyle and health recommendations
                                    </p>
                                </Col>
                            </Row>
                        </motion.div>
                    </Col>
                </Row>
            </Container>
        </section>
    );
};