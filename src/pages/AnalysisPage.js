import { useState, useEffect, useContext } from 'react';
import { Container, Row, Col, Alert } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { api, validateGenomicFile } from '../services/api';
import { useAnalysis } from '../context/AnalysisContext';

export const AnalysisPage = () => {
    const navigate = useNavigate();
    const { saveAnalysisResults, hasResults, currentAnalysis } = useAnalysis();
    
    const [file, setFile] = useState(null);
    const [disease, setDisease] = useState('');
    const [diseases, setDiseases] = useState([]);
    const [uploading, setUploading] = useState(false);
    const [error, setError] = useState('');
    const [dragOver, setDragOver] = useState(false);

    useEffect(() => {
        loadDiseases();
    }, []);

    const loadDiseases = async () => {
        try {
            const response = await api.getDiseases();
            setDiseases(response.diseases || []);
            if (response.diseases?.length > 0) {
                setDisease(response.diseases[0]);
            }
        } catch (err) {
            setError('Failed to load diseases: ' + err.message);
        }
    };

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
        if (droppedFile) handleFileSelect(droppedFile);
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
        if (!file || !disease) {
            setError('Please select both a file and disease');
            return;
        }

        setUploading(true);
        setError('');

        try {
            const result = await api.uploadGenome(file, disease);

            saveAnalysisResults(result);
            navigate('/summary');
        } catch (err) {
            setError(err.message || 'Analysis failed');
        } finally {
            setUploading(false);
        }
    };

    // Keep all your existing JSX but update the form section:
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
                            
                            {hasResults() && (
                                <Alert variant="info" className="mb-4">
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <span>
                                            You have previous analysis results for {currentAnalysis?.disease}. 
                                        </span>
                                        <button 
                                            className="btn-secondary-large"
                                            onClick={() => navigate('/summary')}
                                            style={{ marginLeft: '16px', padding: '8px 16px', fontSize: '14px' }}
                                        >
                                            View Results
                                        </button>
                                    </div>
                                </Alert>
                            )}                            

                            {error && <Alert variant="danger" className="mb-4">{error}</Alert>}

                            {/* Disease Selection */}
                            <div style={{
                                background: 'rgba(255, 255, 255, 0.05)',
                                borderRadius: '12px',
                                padding: '24px',
                                marginBottom: '32px'
                            }}>
                                <label className="form-label">Select Disease for Analysis</label>
                                <select 
                                    value={disease}
                                    onChange={(e) => setDisease(e.target.value)}
                                    className="form-input"
                                    style={{ 
                                        background: 'rgba(255, 255, 255, 0.1)',
                                        border: '1px solid rgba(255, 255, 255, 0.2)',
                                        color: '#fff',
                                        borderRadius: '8px',
                                        padding: '12px 16px'
                                    }}
                                >
                                    {diseases.map(d => (
                                        <option 
                                            key={d} 
                                            value={d}
                                            style={{
                                                background: 'var(--color-blue-gray)',
                                                color: '#fff',
                                                padding: '8px'
                                            }}
                                        >
                                            {d.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {/* File Upload Area */}
                            {!file ? (
                                <div
                                    className={`upload-area ${dragOver ? 'dragover' : ''}`}
                                    onDrop={handleDrop}
                                    onDragOver={handleDragOver}
                                    onDragLeave={handleDragLeave}
                                    onClick={() => document.getElementById('file-input').click()}
                                >
                                    <div className="upload-icon"></div>
                                    <h3>Drag & Drop Your File Here</h3>
                                    <p>Or click to browse files</p>
                                    <p style={{ fontSize: '14px', opacity: '0.7', marginTop: '16px' }}>
                                        Supported: .txt, .tsv, .vcf, .vcf.gz files up to 50MB
                                    </p>
                                    <input
                                        id="file-input"
                                        type="file"
                                        accept=".txt,.tsv,.vcf,.vcf.gz"
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
                                        <strong>{file.name}</strong><br />
                                        Size: {(file.size / (1024 * 1024)).toFixed(2)} MB<br />
                                        Disease: {disease.replace(/_/g, ' ')}
                                    </p>
                                    
                                    {uploading ? (
                                        <div style={{ color: '#fff' }}>
                                            <div className="loading" style={{ margin: '0 auto 16px' }}></div>
                                            <p>Analyzing your genetic data...</p>
                                        </div>
                                    ) : (
                                        <div style={{ display: 'flex', gap: '16px', justifyContent: 'center' }}>
                                            <button className="btn-primary-large" onClick={startAnalysis}>
                                                Start Analysis
                                            </button>
                                            <button className="btn-secondary-large" onClick={() => setFile(null)}>
                                                Choose Different File
                                            </button>
                                        </div>
                                    )}
                                </div>
                            )}
                        </motion.div>
                    </Col>
                </Row>
            </Container>
        </section>
    );
};