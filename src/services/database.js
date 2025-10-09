import { getAuth } from 'firebase/auth';

class DatabaseService {
    constructor() {
        this.baseURL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:8000';
    }

    async getAuthToken() {
        const auth = getAuth();
        const user = auth.currentUser;
        if (!user) return null;
        return await user.getIdToken();
    }

    async request(endpoint, options = {}) {
        const url = `${this.baseURL}${endpoint}`;
        const token = await this.getAuthToken();

        const headers = {
            ...options.headers,
        };

        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }

        if (options.body && !(options.body instanceof FormData)) {
            headers['Content-Type'] = 'application/json';
            options.body = JSON.stringify(options.body);
        }

        try {
            const response = await fetch(url, {
                ...options,
                headers
            });

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(errorText || `HTTP ${response.status}`)
            }

            if (response.headers.get('content-type')?.includes('application/json')) {
                return await response.json();
            }
            return response;
        } catch (error) {
            console.error(`Database request failed: ${endpoint}`, error);
            throw error;
        }
    }

    async syncUser(userData) {
        return this.request('/users/sync', {
            method: 'POST',
            body: userData
        });
    }

    async getCurrentUser(firebase_uid) {
        return this.request(`/users/${firebase_uid}`);
    }

    async updateProfile(firebase_uid, displayName, phone) {
        return this.request(`/users/${firebase_uid}/profile`, {
            method: 'PUT',
            body: {
                display_name: displayName, 
                phone
            }
        });
    }

    async createGroup(firebase_uid, name) {
        return this.request(`/groups?firebase_uid=${firebase_uid}`, {
            method: 'POST',
            body: { name }
        });
    }

    async joinGroup(firebase_uid, inviteCode) {
        return this.request(`/groups/join?firebase_uid=${firebase_uid}`, {
            method: 'POST',
            body: { invite_code: inviteCode }
        });
    }

    async getUserGroups(firebase_uid) {
        return this.request(`/groups/${firebase_uid}`);
    }

    async getGroupMembers(groupId, firebase_uid) {
        return this.request(`/groups/${groupId}/members?firebase_uid=${firebase_uid}`);
    }

    async leaveGroup(groupId, firebase_uid) {
        return this.request(`/groups/${groupId}/leave?firebase_uid=${firebase_uid}`, {
            method: 'DELETE'
        });
    }   
    
    async shareAnalysis(analysisId, groupId, firebase_uid) {
        return this.request(`/analyses/share?firebase_uid=${firebase_uid}`, {
            method: 'POST', 
            body: {
                analysis_id: analysisId, 
                group_id: groupId
            }
        });
    }

    async unshareAnalysis(analysisId, groupId, firebase_uid) {
        return this.request(`/analyses/${analysisId}/unshare/${groupId}?firebase_uid=${firebase_uid}`, {
            method: 'DELETE'
        });
    }   
    
    async getSharedAnalyses(groupId, firebase_uid) {
        return this.request(`/groups/${groupId}/analyses?firebase_uid=${firebase_uid}`);
    }

    async getUserAnalyses(firebase_uid) {
        return this.request(`/users/${firebase_uid}/analyses`);
    }

    async getAnalysisById(analysisId, firebase_uid) {
        return this.request(`/analyses/${analysisId}?firebase_uid=${firebase_uid}`);
    }
}

export const db = new DatabaseService();

