import { useState, useContext, useEffect } from 'react';
import { Container, Row, Col, Alert, Modal } from 'react-bootstrap';
import { Navigate, useSearchParams } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';

export const AuthPage = () => {
    const { user, loginWithEmail, registerWithEmail, loginWithGoogle, loginwithMicrosoft, resetPassword } = useContext(AuthContext);
    const [searchParams] = useSearchParams();
    const [isLogin, setIsLogin] = useState(true);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [formData, setFormData] = useState({
        firstName: '',
        lastName: '',
        email: '',
        password: '',
        confirmPassword: '',
        agreeToTerms: false
    });
    const [showResetModal, setShowResetModal] = useState(false);
    const [resetEmail, setResetEmail] = useState('');
    const [resetSuccess, setResetSuccess] = useState('');
    const [resetError, setResetError] = useState('');

    // Check URL parameter to determine if it's login or register
    useEffect(() => {
        const mode = searchParams.get('mode');
        if (mode === 'register') {
            setIsLogin(false);
        } else {
            setIsLogin(true);
        }
    }, [searchParams]);

    // Redirect if already logged in
    if (user) {
        return <Navigate to="/analysis" replace />;
    }

    const handleInputChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
    };

    const validateForm = () => {
        if (!formData.email || !formData.password) {
            setError('Email and password are required');
            return false;
        }

        if (!isLogin) {
            if (!formData.firstName || !formData.lastName) {
                setError('First and last name are required');
                return false;
            }
            if (formData.password !== formData.confirmPassword) {
                setError('Passwords do not match');
                return false;
            }
            if (formData.password.length < 6) {
                setError('Password must be at least 6 characters');
                return false;
            }
            if (!formData.agreeToTerms) {
                setError('You must agree to the terms');
                return false;
            }
        }
        return true;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        if (!validateForm()) return;

        setLoading(true);

        try {
            let result;
            if (isLogin) {
                result = await loginWithEmail(formData.email, formData.password);
            } else {
                result = await registerWithEmail({
                    firstName: formData.firstName,
                    lastName: formData.lastName,
                    email: formData.email,
                    password: formData.password
                });
            }

            if (!result.success) {
                setError(result.error);
            }
        } catch (err) {
            setError('Something went wrong. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleGoogleLogin = async () => {
        setLoading(true);
        setError('');
        
        try {
            const result = await loginWithGoogle();
            if (!result.success) {
                setError(result.error);
            }
        } catch (err) {
            setError('Google login failed. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleMicrosoftLogin = async () => {
        setLoading(true);
        setError('');

        try {
            const result = await loginwithMicrosoft();
            if (!result.success) {
                setError(result.error);
            }
        } catch (err) {
            setError('Google login failed. Please try again.')
        } finally {
            setLoading(false);
        }
    }

    const toggleMode = () => {
        setIsLogin(!isLogin);
        setError('');
        setFormData({
            firstName: '',
            lastName: '',
            email: '',
            password: '',
            confirmPassword: '',
            agreeToTerms: false
        });
        // Update URL without page reload
        window.history.pushState({}, '', isLogin ? '/auth?mode=register' : '/auth?mode=login');
    };

    const handlePasswordReset = async (e) => {
        e.preventDefault();
        setResetError('');
        setResetSuccess('');

        if (!resetEmail) {
            setResetEmail('Please enter your email address');
            return;
        }

        const result = await resetPassword(resetEmail);

        if (resetEmail.success) {
            setResetSuccess(result.message);
            setResetEmail('');

            // Close modal after 3 seconds (increase if needed)
            setTimeout(() => {
                setShowResetModal(false);
                setResetSuccess('');
            }, 3000);
        } else {
            setResetError(result.error);
        }
    };

    return (
        <section className="auth-section">
            <Container>
                <Row className="justify-content-center">
                    <Col lg={6} md={8}>
                        <div className="auth-card">
                            <div className="text-center mb-4">
                                <h1 className="auth-title">
                                    {isLogin ? 'Welcome Back' : 'Join GeneGuard'}
                                </h1>
                                <p className="auth-subtitle">
                                    {isLogin 
                                        ? 'Sign in to access your genetic analysis dashboard'
                                        : 'Create your account to start your genetic health journey'
                                    }
                                </p>
                            </div>

                            {error && (
                                <Alert variant="danger" className="mb-4">
                                    {error}
                                </Alert>
                            )}

                            <div className="oauth-buttons mb-4">
                                {/* Google Auth Button */}
                                <button 
                                    className="oauth-btn google-btn"
                                    onClick={handleGoogleLogin}
                                    disabled={loading}
                                >
                                    <span className="oauth-icon">G</span>
                                    {isLogin ? 'Sign in with Google' : 'Sign up with Google'}
                                </button>
                                
                                {/* Microsoft Auth Button */}
                                <button
                                    className="oauth-btn microsoft-btn"
                                    onClick={handleMicrosoftLogin}
                                    disabled={loading}
                                >
                                    <span className="oauth-icon">M</span>
                                    {isLogin ? 'Sign in with Microsoft' :  'Sign up with Microsoft'}
                                </button>
                            </div>

                            <div className="divider">
                                <span>or</span>
                            </div>

                            {/* Email/Password Form */}
                            <form onSubmit={handleSubmit}>
                                {!isLogin && (
                                    <Row>
                                        <Col md={6}>
                                            <div className="form-group">
                                                <label className="form-label">First Name</label>
                                                <input
                                                    type="text"
                                                    name="firstName"
                                                    className="form-input"
                                                    value={formData.firstName}
                                                    onChange={handleInputChange}
                                                    placeholder="Enter your first name"
                                                    required={!isLogin}
                                                />
                                            </div>
                                        </Col>
                                        <Col md={6}>
                                            <div className="form-group">
                                                <label className="form-label">Last Name</label>
                                                <input
                                                    type="text"
                                                    name="lastName"
                                                    className="form-input"
                                                    value={formData.lastName}
                                                    onChange={handleInputChange}
                                                    placeholder="Enter your last name"
                                                    required={!isLogin}
                                                />
                                            </div>
                                        </Col>
                                    </Row>
                                )}

                                <div className="form-group">
                                    <label className="form-label">Email Address</label>
                                    <input
                                        type="email"
                                        name="email"
                                        className="form-input"
                                        value={formData.email}
                                        onChange={handleInputChange}
                                        placeholder="your@email.com"
                                        required
                                    />
                                </div>

                                <div className="form-group">
                                    <label className="form-label">Password</label>
                                    <input
                                        type="password"
                                        name="password"
                                        className="form-input"
                                        value={formData.password}
                                        onChange={handleInputChange}
                                        placeholder={isLogin ? "Enter your password" : "Create a password (min 6 characters)"}
                                        required
                                    />
                                </div>

                                {!isLogin && (
                                    <>
                                        <div className="form-group">
                                            <label className="form-label">Confirm Password</label>
                                            <input
                                                type="password"
                                                name="confirmPassword"
                                                className="form-input"
                                                value={formData.confirmPassword}
                                                onChange={handleInputChange}
                                                placeholder="Confirm your password"
                                                required
                                            />
                                        </div>

                                        <div className="form-group">
                                            <div className="checkbox-wrapper">
                                                <input
                                                    type="checkbox"
                                                    name="agreeToTerms"
                                                    id="agreeToTerms"
                                                    checked={formData.agreeToTerms}
                                                    onChange={handleInputChange}
                                                    required
                                                />
                                                <label htmlFor="agreeToTerms" className="checkbox-label">
                                                    I agree that this is a demo app for educational purposes only 
                                                    and not for actual medical use. I understand that my data 
                                                    will be used for hackathon demonstration purposes.
                                                </label>
                                            </div>
                                        </div>
                                    </>
                                )}

                                {isLogin && (
                                    <div className="form-group text-end">
                                        <button 
                                            type="button"
                                            onClick={() => setShowResetModal(true)}
                                            style={{
                                                background: 'none',
                                                border: 'none',
                                                color: 'var(--color-sage)',
                                                fontSize: '14px',
                                                textDecoration: 'none',
                                                cursor: 'pointer',
                                                padding: 0
                                            }}
                                        >
                                            Forgot your password?
                                        </button>
                                    </div>
                                )}

                                {/* Password reset */}
                                <Modal show={showResetModal} onHide={() => setShowResetModal(false)} centered>
                                    <Modal.Header closeButton style={{ background: 'var(--color-dark-blue)' }}>
                                        <Modal.Title style={{ color: '#fff' }}>Reset Password</Modal.Title>
                                    </Modal.Header>
                                    <Modal.Body style={{ background: 'var(--color-blue-gray'}}>
                                        {resetSuccess && (
                                            <Alert variant="success" className="mb-3">
                                                {resetSuccess}
                                            </Alert>
                                        )}
                                        {resetError && (
                                            <Alert variant="danger" className="mb-3">
                                                {resetError}
                                            </Alert>
                                        )}

                                        <p style={{ color: 'var(--color-light-gray', marginBottom: '20px'}}>
                                            Enter your email address and we will send a link to reset your password
                                        </p>

                                        <form onSubmit={handlePasswordReset}>
                                            <div className="form-group">
                                                <label className="form-group">Email Address</label>
                                                <input 
                                                    type="email"
                                                    className="form-input"
                                                    value={resetEmail}
                                                    onChange={(e) => setResetEmail(e.target.value)}
                                                    placeholder="your@email.com"
                                                    required
                                                />
                                            </div>

                                            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '24px' }}>
                                                <button 
                                                    type="button"
                                                    className="btn-secondary-large"
                                                    onClick={() => {
                                                        setShowResetModal(false);
                                                        setResetError('');
                                                        setResetSuccess('');
                                                        setResetEmail('');
                                                    }}
                                                >
                                                    Cancel
                                                </button>
                                                <button 
                                                    type="button"
                                                    className="btn-primary-large"
                                                >
                                                    Send Reset Link
                                                </button>
                                            </div>
                                        </form>
                                    </Modal.Body>
                                </Modal>

                                <button
                                    type="submit"
                                    className="btn-auth-submit"
                                    disabled={loading}
                                >
                                    {loading && <div className="loading"></div>}
                                    {loading 
                                        ? (isLogin ? 'Signing In...' : 'Creating Account...') 
                                        : (isLogin ? 'Sign In' : 'Create Account')
                                    }
                                </button>
                            </form>

                            <div className="auth-toggle">
                                <p>
                                    {isLogin ? "Don't have an account?" : "Already have an account?"}
                                </p>
                                <button className="toggle-btn" onClick={toggleMode}>
                                    {isLogin ? 'Create New Account' : 'Sign In Instead'}
                                </button>
                            </div>

                            {/* Additional info for registration */}
                            {!isLogin && (
                                <div style={{ 
                                    marginTop: '24px', 
                                    padding: '16px', 
                                    background: 'rgba(125, 178, 144, 0.1)',
                                    borderRadius: '8px',
                                    border: '1px solid rgba(125, 178, 144, 0.2)'
                                }}>
                                    <p style={{ 
                                        color: 'var(--color-light-gray)', 
                                        fontSize: '14px',
                                        margin: '0',
                                        lineHeight: '1.4'
                                    }}>
                                        <strong>What you'll get:</strong> Secure genetic analysis, 
                                        family group management, AI-powered recommendations, 
                                        and compatibility reports for family planning.
                                    </p>
                                </div>
                            )}
                        </div>
                    </Col>
                </Row>
            </Container>
        </section>
    );
};