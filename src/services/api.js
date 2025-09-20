class ApiService {
    constructor() {
        this.baseURL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:5000/api';
        this.aiServiceURL = process.env.REACT_APP_AI_SERVICE_URL || 'http://localhost:8000';
    }

    async request(endpoint, options = {}) {
        const url = `${this.baseURL}${endpoint}`;
        const token = localStorage.getItem('token');
        
        const config = {
            headers: {
                'Content-Type': 'application/json',
                ...(token && { Authorization: `Bearer ${token}` }),
                ...options.headers,
            },
            ...options,
        };

        try {
            const response = await fetch(url, config);
            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || `HTTP error! status: ${response.status}`);
            }

            return data;
        } catch (error) {
            console.error(`API request failed: ${endpoint}`, error);
            throw error;
        }
    }
    
    auth = {
        login: async (credentials) => {
            // Mock for now
            return new Promise((resolve) => {
                setTimeout(() => {
                    resolve({
                        user: { id: 1, name: credentials.email.split('@')[0], email: credentials.email },
                        token: 'mock-token-' + Date.now()
                    });
                }, 1000);
            });
        },

        register: async (userData) => {
            // Mock for now
            return new Promise((resolve) => {
                setTimeout(() => {
                    resolve({
                        user: { 
                            id: Date.now(), 
                            name: `${userData.firstName} ${userData.lastName}`,
                            email: userData.email 
                        },
                        token: 'mock-token-' + Date.now()
                    });
                }, 1000);
            });
        }
    };

    // Genomic analysis methods
    genomics = {
        uploadFile: async (file, userId) => {
            // Mock file upload
            return new Promise((resolve) => {
                setTimeout(() => {
                    resolve({
                        fileId: 'file-' + Date.now(),
                        filename: file.name,
                        size: file.size,
                        status: 'uploaded'
                    });
                }, 2000);
            });
        },

        analyzeGenome: async (analysisData) => {
            // Mock analysis start
            return new Promise((resolve) => {
                setTimeout(() => {
                    resolve({
                        analysisId: 'analysis-' + Date.now(),
                        status: 'processing',
                        estimatedTime: '2-3 minutes'
                    });
                }, 1000);
            });
        },

        getResults: async (analysisId) => {
            // Mock results - simulate analysis completion
            return new Promise((resolve) => {
                setTimeout(() => {
                    resolve({
                        analysisId,
                        status: 'completed',
                        results: [
                            {
                                gene: 'BRCA1',
                                symbol: 'BRCA1',
                                description: 'Breast cancer susceptibility gene',
                                riskScore: 0.2,
                                riskLevel: 'low',
                                variants: ['rs1799966'],
                                moreInfo: 'https://www.ncbi.nlm.nih.gov/gene/672'
                            },
                            {
                                gene: 'APOE',
                                symbol: 'APOE',
                                description: 'Alzheimer disease risk factor',
                                riskScore: 0.6,
                                riskLevel: 'medium',
                                variants: ['rs429358'],
                                moreInfo: 'https://www.ncbi.nlm.nih.gov/gene/348'
                            },
                            {
                                gene: 'MTHFR',
                                symbol: 'MTHFR',
                                description: 'Folate metabolism enzyme',
                                riskScore: 0.3,
                                riskLevel: 'low',
                                variants: ['rs1801133'],
                                moreInfo: 'https://www.ncbi.nlm.nih.gov/gene/4524'
                            }
                        ],
                        recommendations: [
                            'Regular exercise (30+ minutes daily)',
                            'Mediterranean diet rich in omega-3',
                            'Regular health screenings',
                            'Stress management techniques',
                            'Adequate sleep (7-9 hours nightly)'
                        ]
                    });
                }, 3000);
            });
        }
    };

    // Family management methods
    family = {
        getFamilyMembers: async (userId) => {
            // Mock family members
            return new Promise((resolve) => {
                setTimeout(() => {
                    resolve([
                        { id: 1, name: 'John Doe', email: 'john@example.com', relation: 'Partner', hasSharedData: true },
                        { id: 2, name: 'Jane Doe', email: 'jane@example.com', relation: 'Sister', hasSharedData: false }
                    ]);
                }, 1000);
            });
        },

        inviteMember: async (inviteData) => {
            // Mock invite
            return new Promise((resolve) => {
                setTimeout(() => {
                    resolve({
                        inviteId: 'invite-' + Date.now(),
                        email: inviteData.email,
                        status: 'sent'
                    });
                }, 1000);
            });
        }
    };
}

export const api = new ApiService();

// File validation utility
export const validateGenomicFile = (file) => {
    const maxSize = 50 * 1024 * 1024; // 50MB
    const allowedTypes = ['.vcf', '.txt', '.csv', '.json'];
    const errors = [];
    
    if (file.size > maxSize) {
        errors.push(`File size exceeds 50MB limit`);
    }
    
    const fileExtension = '.' + file.name.split('.').pop().toLowerCase();
    if (!allowedTypes.includes(fileExtension)) {
        errors.push(`File type ${fileExtension} not supported. Allowed: ${allowedTypes.join(', ')}`);
    }
    
    return {
        isValid: errors.length === 0,
        errors
    };
};

// Risk score formatter
export const formatRiskScore = (score) => {
    if (score < 0.3) return { level: 'low', color: '#28a745', text: 'Low Risk' };
    if (score < 0.7) return { level: 'medium', color: '#ffc107', text: 'Medium Risk' };
    return { level: 'high', color: '#dc3545', text: 'High Risk' };
};