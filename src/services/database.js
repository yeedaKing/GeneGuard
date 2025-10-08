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
}

export const db = new DatabaseService();

