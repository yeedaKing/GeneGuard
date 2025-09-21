import { useState, useEffect, useContext } from 'react';
import { Container, Row, Col, Alert, Card, Table } from 'react-bootstrap';
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

    const [analysisMode, setAnalysisMode] = useState('specific');
    const [autoAnalyzing, setAutoAnalyzing] = useState(false);
    const [diseaseRankings, setDiseaseRankings] = useState([]);
    const [showRankings, setShowRankings] = useState(false);

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
        setShowRankings(false);
        setDiseaseRankings([]);
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

    const startAutoAnalysis = async () => {
        if (!file) {
            setError('Please select a file first');
            return;
        }

        setAutoAnalyzing(true);
        setError('');

        try {
            const result = await api.analyzeAllDiseases(file);
            setDiseaseRankings(result.candidates || []);
            setShowRankings(true);
        } catch (err) {
            setError(err.message || 'Auto analysis failed');
        } finally {
            setAutoAnalyzing(false);
        }
     };

    const analyzeSpecificFromRanking = async (selectedDisease) => {
        setUploading(true);
        setError('');

        try {
            const result = await api.uploadGenome(file, selectedDisease);
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
                                <label className="form-label">Analysis Type</label>
                                <div style={{ display: 'flex', gap: '16px', marginBottom: '16px' }}>
                                    <Card 
                                        style={{
                                            background: analysisMode === 'specific' ? 'var(--color-teal)' : 'rgba(255, 255, 255, 0.05)',
                                            border: '1px solid ' + (analysisMode === 'specific' ? 'var(--color-sage)' : 'rgba(255, 255, 255, 0.1)'),
                                            cursor: 'pointer', 
                                            flex: 1
                                        }}
                                        onClick={() => setAnalysisMode('specific')}
                                    >
                                        <Card.Body style={{ padding: '20px' }}>
                                            <h6 style={{ color: '#fff', margin: '0 0 8px 0' }}>Specific Disease Analysis</h6>
                                            <p style={{ color: 'var(--color-light-gray)', margin: '0', fontSize: '14px' }}>
                                                Choose a specific disease to analyze
                                            </p>
                                        </Card.Body>                                
                                    </Card>
                                    <Card 
                                        style={{ 
                                            background: analysisMode === 'auto' ? 'var(--color-teal)' : 'rgba(255, 255, 255, 0.05)',
                                            border: '1px solid ' + (analysisMode === 'auto' ? 'var(--color-sage)' : 'rgba(255, 255, 255, 0.1)'),
                                            cursor: 'pointer',
                                            flex: 1
                                        }}
                                        onClick={() => setAnalysisMode('auto')}
                                    >
                                        <Card.Body style={{ padding: '20px' }}>
                                            <h6 style={{ color: '#fff', margin: '0 0 8px 0' }}>Auto Disease Ranking</h6>
                                            <p style={{ color: 'var(--color-light-gray)', margin: '0', fontSize: '14px' }}>
                                                Automatically rank all diseases by risk
                                            </p>
                                        </Card.Body>
                                    </Card>
                                </div>

                                {/* Disease Selection for Specific Mode */}
                                {analysisMode === 'specific' && (
                                    <div>
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
                                )}

                                {/* Auto Mode Description */}
                                {analysisMode === 'auto' && (
                                    <div>
                                        <Alert variant="info" style={{ marginBottom: '0' }}>
                                            <h6 style={{ color: 'var(--color-dark-blue)', margin: '0 0 8px 0' }}>Auto Disease Ranking</h6>
                                            <p style={{ margin: '0', color: 'var(--color-dark-blue)', fontSize: '14px' }}>
                                                This mode will analyze your genetic data against all available diseases and rank them by potential risk. 
                                                You can then choose which specific disease to get detailed results for.
                                            </p>
                                        </Alert>
                                    </div>
                                )}
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
                                        {analysisMode === 'specific' && `Disease: ${disease.replace(/_/g, ' ')}`}
                                        {analysisMode === 'auto' && 'Mode: Auto Disease Ranking'}
                                    </p>
                                    
                                    {(uploading || autoAnalyzing) ? (
                                        <div style={{ color: '#fff' }}>
                                            <div className="loading" style={{ margin: '0 auto 16px' }}></div>
                                            <p>{autoAnalyzing ? 'Ranking diseases by risk...' : 'Analyzing your genetic data...'}</p>
                                        </div>
                                    ) : (
                                        <div style={{ display: 'flex', gap: '16px', justifyContent: 'center', flexWrap: 'wrap' }}>
                                            {analysisMode === 'specific' ? (
                                                <button className="btn-primary-large" onClick={startAnalysis}>
                                                    Start Analysis
                                                </button>
                                            ) : (
                                                <button className="btn-primary-large" onClick={startAutoAnalysis}>
                                                    Rank All Diseases
                                                </button>                                                
                                            )}
                                            <button className="btn-secondary-large" onClick={() => setFile(null)}>
                                                Choose Different File
                                            </button>
                                        </div>
                                    )}
                                </div>
                            )}
                            {/* Disease Ranking Results */}
                            {showRankings && diseaseRankings.length > 0 && (
                                <div style={{ 
                                    background: 'rgba(255, 255, 255, 0.05)',
                                    borderRadius: '12px',
                                    padding: '32px',
                                    marginTop: '32px'                
                                }}>
                                    <h4 style={{ color: '#fff', marginBottom: '24px', textAlign: 'center' }}>
                                        Disease Risk Rankings
                                    </h4>
                                    <p style={{ color: 'var(--color-light-gray)', textAlign: 'center', marginBottom: '32px' }}>
                                        Top diseases ranked by your genetic risk profile. Click "Analyze" for detailed results.
                                    </p>
                                    
                                    <div className="results-table">
                                        <Table responsive style={{ margin: '0' }}>
                                            <thead>
                                                <tr>
                                                    <th>Rank</th>
                                                    <th>Disease</th>
                                                    <th>Risk Score</th>
                                                    <th>Risk Genes Found</th>
                                                    <th>Action</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {diseaseRankings.map((ranking, index) => (
                                                    <tr key={index}>
                                                        <td style={{ fontWeight: '600', fontSize: '20px' }}>
                                                            #{index + 1}
                                                        </td>
                                                        <td style={{ fontWeight: '600' }}>
                                                            {ranking.disease.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                                                        </td>
                                                        <td style={{ fontWeight: '600' }}>
                                                            {ranking.score.toFixed(4)}
                                                        </td>
                                                        <td>
                                                            {ranking.risks?.length || 0} genes
                                                            {ranking.risks && ranking.risks.length > 0 && (
                                                                <div style={{ fontSize: '12px', color: 'var(--color-medium-gray)', marginTop: '4px' }}>
                                                                    Top: {ranking.risks.slice(0, 3).map(r => r.gene).join(', ')}
                                                                    {ranking.risks.length > 3 && '...'}
                                                                </div>
                                                            )}
                                                        </td>
                                                        <td>
                                                            <button
                                                                style={{
                                                                    background: 'var(--color-sage)',
                                                                    color: 'var(--color-dark-blue)',
                                                                    border: 'none',
                                                                    padding: '8px 16px',
                                                                    borderRadius: '6px',
                                                                    fontSize: '14px',
                                                                    fontWeight: '600',
                                                                    cursor: 'pointer'
                                                                }}
                                                                onClick={() => analyzeSpecificFromRanking(ranking.disease)}
                                                                disabled={uploading}
                                                            >
                                                                {uploading ? 'Analyzing...' : 'Analyze'}
                                                            </button>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </Table>
                                    </div>
                                </div>
                            )}
                        </motion.div>
                    </Col>
                </Row>
            </Container>
        </section>
    );
};