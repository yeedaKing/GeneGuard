class ApiService {
    constructor() {
        this.baseURL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:8000';
    }

    async request(endpoint, options = {}) {
        const url = `${this.baseURL}${endpoint}`;
        
        try {
            const response = await fetch(url, options);
            
            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(errorText || `HTTP ${response.status}`);
            }

            if (response.headers.get('content-type')?.includes('application/json')) {
                return await response.json();
            }
            return response;
        } catch (error) {
            console.error(`API request failed: ${endpoint}`, error);
            throw error;
        }
    }

    getDiseases = async () => {
        return this.request('/diseases');
    }

    uploadGenome = async (file, disease, maxRecords = 10000, firebase_uid = null) => {
        const formData = new FormData();
        formData.append('file', file);
        
        const queryParams = new URLSearchParams({
            disease: disease,
            max_records: maxRecords.toString()
        });

        if (firebase_uid) {
            queryParams.append('firebase_uid', firebase_uid);
        }

        return this.request(`/upload-genome?${queryParams}`, {
            method: 'POST',
            body: formData
        });
    }

    analyzeAllDiseases = async(file, maxRecords = 10000) => {
        const formData = new FormData();
        formData.append('file', file);

        const queryParams = new URLSearchParams({
            max_records: maxRecords.toString()
        });

        return this.request(`/auto-rank?${queryParams}`, {
            method: 'POST', 
            body: formData
        });
    }

    exportCSV = async (userId) => {
        const response = await this.request(`/results/${userId}/csv`);
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `analysis-${userId}.csv`;
        link.click();
        window.URL.revokeObjectURL(url);
    }
}

export const api = new ApiService();

export const validateGenomicFile = (file) => {
    const maxSize = 50 * 1024 * 1024; // 50MB
    const allowedTypes = ['.txt', '.tsv', '.vcf', '.vcf.gz'];
    const errors = [];
    
    if (file.size > maxSize) {
        errors.push('File size exceeds 50MB limit');
    }
    
    const fileName = file.name.toLowerCase();
    const isValidType = allowedTypes.some(type => fileName.endsWith(type));
    
    if (!isValidType) {
        errors.push(`File type not supported. Allowed: ${allowedTypes.join(', ')}`);
    }
    
    return { isValid: errors.length === 0, errors };
};

export const formatRiskLevel = (level) => {
    switch (level?.toLowerCase()) {
        case 'high': return { level: 'high', color: '#dc3545', text: 'High Risk' };
        case 'medium': return { level: 'medium', color: '#ffc107', text: 'Medium Risk' };
        case 'low': return { level: 'low', color: '#28a745', text: 'Low Risk' };
        default: return { level: 'unknown', color: '#6c757d', text: 'Unknown' };
    }
};

createGroup = async (groupData) => {
    return this.request('/groups/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(groupData)
    });
}

getGroupByCode = async (inviteCode) => {
    return this.request(`/groups/by-code/${inviteCode}`)
}