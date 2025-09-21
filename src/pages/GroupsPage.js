import { useState, useEffect, useContext } from 'react';
import { Container, Row, Col, Table, Modal, Alert, Card, Form } from 'react-bootstrap';
import { motion } from 'framer-motion';
import { AuthContext } from '../context/AuthContext';
import { useAnalysis } from '../context/AnalysisContext';

export const GroupsPage = () => {
    const { user } = useContext(AuthContext);
    const { currentAnalysis } = useAnalysis();
    const [groups, setGroups] = useState([]);
    const [selectedGroup, setSelectedGroup] = useState(null);
    const [sharedAnalyses, setSharedAnalyses] = useState({});
    
    // Modal states
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [showInviteModal, setShowInviteModal] = useState(false);
    const [showShareModal, setShowShareModal] = useState(false);
    const [showViewModal, setShowViewModal] = useState(false);
    const [showProfileModal, setShowProfileModal] = useState(false);
    const [selectedAnalysis, setSelectedAnalysis] = useState(null);
    
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    // Form states
    const [newGroupName, setNewGroupName] = useState('');
    const [inviteCode, setInviteCode] = useState('');
    const [joinCode, setJoinCode] = useState('');

    const [editingProfile, setEditingProfile] = useState({
        name: '', 
        phone: ''
    });

    // Load groups from localStorage on mount
    useEffect(() => {
        loadGroupsFromStorage();
        loadSharedAnalyses();
        loadUserProfile();
        setLoading(false);
    }, [user]);

    const loadUserProfile = () => {
        if (!user?.id) return;

        const userProfile = localStorage.getItem(`profile_${user.id}`);
        if (userProfile) {
            try {
                const profile = JSON.parse(userProfile);
                setEditingProfile({
                    name: profile.name || user.name,
                    phone: profile.phone || ''
                });
            } catch (error) {
                console.error('Failed to parse user profile:', error);
                setEditingProfile({
                    name: user.name,
                    phone: ''
                });
            }
        } else {
            setEditingProfile({
                name: user.name,
                phone: ''
            });
        }
    };

    const saveUserProfile = () => {
        if (!user?.id) return;

        const profile = {
            name: editingProfile.name,
            phone: editingProfile.phone,
            email: user.email,
            updatedAt: new Date().toISOString()
        };

        localStorage.setItem(`profile_${user.id}`, JSON.stringify(profile));

        const updatedGroups = groups.map(group => ({
            ...group,
            members: group.members.map(member =>
                member.id === user.id
                    ? { ...member, name: profile.name, phone: profile.phone }
                    :member
            )
        }));

        setGroups(updatedGroups);
        saveGroupsToStorage(updatedGroups);

        updatedGroups.forEach(group => {
            if (group.creator === user.id || group.members.some(m => m.id === user.id)) {
                updateGroupInCreatorStorage(group);
            }
        });

        setShowProfileModal(false);
        setSuccess('Profile updated successfully!');
    };

    const getUserProfile = (userID) => {
        const profile = localStorage.getItem(`profile_${userID}`);
        if (profile) {
            try {
                return JSON.parse(profile);
            } catch (error) {
                console.error('Failed to parse profile:', error);
            }
        }
        return null;
    };

    const loadGroupsFromStorage = () => {
        if (!user?.id) return;
        
        const userGroups = localStorage.getItem(`groups_${user.id}`);
        if (userGroups) {
            try {
                const parsed = JSON.parse(userGroups);
                setGroups(parsed);
                if (parsed.length > 0) {
                    setSelectedGroup(parsed[0]);
                }
            } catch (error) {
                console.error('Failed to parse groups:', error);
            }
        }
    };

    const loadSharedAnalyses = () => {
        const shared = localStorage.getItem('sharedAnalyses');
        if (shared) {
            try {
                setSharedAnalyses(JSON.parse(shared));
            } catch (error) {
                console.error('Failed to parse shared analyses:', error);
            }
        }
    };

    const saveGroupsToStorage = (updatedGroups) => {
        if (!user?.id) return;
        localStorage.setItem(`groups_${user.id}`, JSON.stringify(updatedGroups));
        setGroups(updatedGroups);
    };

    const createGroup = (e) => {
        e.preventDefault();
        if (!newGroupName.trim()) {
            setError('Group name is required');
            return;
        }

        const userProfile = getUserProfile(user.id) || { name: user.name, phone: '' };

        const newGroup = {
            id: `group_${Date.now()}`,
            name: newGroupName,
            creator: user.id,
            creatorName: userProfile.name,
            creatorEmail: user.email,
            members: [{
                id: user.id,
                name: userProfile.name,
                email: user.email,
                phone: userProfile.phone || '',
                hasAnalysis: !!currentAnalysis,
                joinedAt: new Date().toISOString()
            }],
            inviteCode: Math.random().toString(36).substring(2, 8).toUpperCase(),
            createdAt: new Date().toISOString()
        };

        const updatedGroups = [...groups, newGroup];
        saveGroupsToStorage(updatedGroups);
        setSelectedGroup(newGroup);
        setNewGroupName('');
        setShowCreateModal(false);
        setSuccess(`Group "${newGroupName}" created! Share code: ${newGroup.inviteCode}`);
    };

    const joinGroup = (e) => {
        e.preventDefault();
        if (!joinCode.trim()) {
            setError('Join code is required');
            return;
        }

        // Search all users' groups for this invite code
        const foundGroup = findGroupByInviteCode(joinCode.toUpperCase());
        
        if (!foundGroup) {
            setError('Invalid join code');
            return;
        }

        // Check if already a member
        if (foundGroup.members.some(m => m.id === user.id)) {
            setError('You are already a member of this group');
            return;
        }

        const userProfile = getUserProfile(user.id) || { name: user.name, phone: ''};

        // Add user to the group
        const newMember = {
            id: user.id,
            name: userProfile.name,
            email: user.email,
            phone: userProfile.phone || '',
            hasAnalysis: !!currentAnalysis,
            joinedAt: new Date().toISOString()
        };

        foundGroup.members.push(newMember);
        updateGroupInCreatorStorage(foundGroup);
        
        const updatedGroups = [...groups, foundGroup];
        saveGroupsToStorage(updatedGroups);
        
        setSelectedGroup(foundGroup);
        setJoinCode('');
        setSuccess(`Joined group "${foundGroup.name}"!`);
    };

    const findGroupByInviteCode = (code) => {
        const allGroups = localStorage.getItem('allGroupsByCode');
        if (allGroups) {
            try {
                const groupsMap = JSON.parse(allGroups);
                return groupsMap[code];
            } catch (error) {
                console.error('Error finding group:', error);
            }
        }
        return null;
    };

    const updateGroupInCreatorStorage = (group) => {
        // Update the global groups registry
        const allGroups = JSON.parse(localStorage.getItem('allGroupsByCode') || '{}');
        allGroups[group.inviteCode] = group;
        localStorage.setItem('allGroupsByCode', JSON.stringify(allGroups));
        
        // Also update creator's personal groups
        const creatorGroups = JSON.parse(localStorage.getItem(`groups_${group.creator}`) || '[]');
        const index = creatorGroups.findIndex(g => g.id === group.id);
        if (index !== -1) {
            creatorGroups[index] = group;
            localStorage.setItem(`groups_${group.creator}`, JSON.stringify(creatorGroups));
        }
    };

    const shareAnalysis = () => {
        if (!currentAnalysis) {
            setError('No analysis to share');
            return;
        }

        const shareKey = `${selectedGroup.id}_${user.id}`;
        const updatedShared = {
            ...sharedAnalyses,
            [shareKey]: {
                ...currentAnalysis,
                sharedBy: editingProfile.name || user.name,
                sharedByEmail: user.email,
                sharedAt: new Date().toISOString(),
                groupId: selectedGroup.id
            }
        };

        localStorage.setItem('sharedAnalyses', JSON.stringify(updatedShared));
        setSharedAnalyses(updatedShared);
        setShowShareModal(false);
        setSuccess('Analysis shared with group!');
    };

    const unshareAnalysis = () => {
        if (!selectedGroup || !user) return;

        const shareKey = `${selectedGroup.id}_${user.id}`;
        const updatedShared = { ...sharedAnalyses };
        delete updatedShared[shareKey];

        localStorage.setItem('sharedAnalyses', JSON.stringify(updatedShared));
        setSharedAnalyses(updatedShared);
        setSuccess('Analysis unshared from group');
    };

    const viewSharedAnalysis = (memberId) => {
        const shareKey = `${selectedGroup.id}_${memberId}`;
        const analysis = sharedAnalyses[shareKey];
        if (analysis) {
            setSelectedAnalysis(analysis);
            setShowViewModal(true);
        } else {
            setError('No shared analysis found for this member');
        }
    };

    const leaveGroup = (groupId) => {
        if (window.confirm('Are you sure you want to leave this group?')) {
            const updatedGroups = groups.filter(g => g.id !== groupId);
            saveGroupsToStorage(updatedGroups);
            
            // Remove shared analysis
            const shareKey = `${groupId}_${user.id}`;
            const updatedShared = { ...sharedAnalyses };
            delete updatedShared[shareKey];
            localStorage.setItem('sharedAnalyses', JSON.stringify(updatedShared));
            setSharedAnalyses(updatedShared);
            
            setSelectedGroup(updatedGroups.length > 0 ? updatedGroups[0] : null);
            setSuccess('Left group successfully');
        }
    };

    // Save group to global registry when created
    useEffect(() => {
        groups.forEach(group => {
            if (group.creator === user?.id) {
                const allGroups = JSON.parse(localStorage.getItem('allGroupsByCode') || '{}');
                allGroups[group.inviteCode] = group;
                localStorage.setItem('allGroupsByCode', JSON.stringify(allGroups));
            }
        });
    }, [groups, user]);

    if (loading) {
        return (
            <div style={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                height: '100vh',
                background: 'var(--color-dark-blue)'
            }}>
                <div className="loading" style={{ width: '40px', height: '40px' }}></div>
            </div>
        );
    }

    return (
        <section style={{ padding: '120px 0 80px 0', background: 'var(--color-dark-blue)', minHeight: '100vh' }}>
            <Container>
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6 }}
                >
                    <Row className="mb-4">
                        <Col>
                            <h1 style={{ color: '#fff', marginBottom: '16px' }}>
                                My Groups
                            </h1>
                            <p style={{ color: 'var(--color-light-gray)', marginBottom: '32px' }}>
                                Create or join groups to share genetic analysis results. Perfect for families and research groups.
                            </p>
                            
                            <div style={{ display: 'flex', gap: '16px', marginBottom: '32px', flexWrap: 'wrap' }}>
                                <button 
                                    className="btn-primary-large" 
                                    onClick={() => setShowCreateModal(true)}
                                >
                                    Create Group
                                </button>
                                <button 
                                    className="btn-secondary-large" 
                                    onClick={() => setShowInviteModal(true)}
                                >
                                    Join Group
                                </button>
                                <button
                                    className="btn-secondary-large"
                                    onClick={() => {
                                        loadUserProfile();
                                        setShowProfileModal(true);
                                    }}
                                >
                                    Edit My Profile
                                </button>
                                {selectedGroup && currentAnalysis && (
                                    (() => {
                                        const shareKey = `${selectedGroup.id}_${user.id}`;
                                        const isShared = !!sharedAnalyses[shareKey];

                                        return isShared ? (
                                            <button 
                                                className="btn-secondary-large"
                                                onClick={unshareAnalysis}
                                                style={{ background: '#dc3545', borderColor: '#dc3545' }}
                                            >
                                                Unshare My Analysis
                                            </button>
                                        ) : (
                                            <button 
                                                className="btn-secondary-large" 
                                                onClick={() => setShowShareModal(true)}
                                            >
                                                Share My Analysis
                                            </button>
                                        );
                                    }) ()
                                )}
                            </div>
                        </Col>
                    </Row>

                    {error && (
                        <Alert variant="danger" className="mb-4" onClose={() => setError('')} dismissible>
                            {error}
                        </Alert>
                    )}

                    {success && (
                        <Alert variant="success" className="mb-4" onClose={() => setSuccess('')} dismissible>
                            {success}
                        </Alert>
                    )}

                    <Row>
                        {/* Groups List */}
                        <Col md={4}>
                            <h4 style={{ color: '#fff', marginBottom: '20px' }}>Your Groups</h4>
                            {groups.length > 0 ? (
                                groups.map((group) => (
                                    <Card 
                                        key={group.id}
                                        style={{ 
                                            marginBottom: '16px',
                                            background: selectedGroup?.id === group.id 
                                                ? 'var(--color-teal)' 
                                                : 'rgba(255, 255, 255, 0.05)',
                                            border: '1px solid rgba(255, 255, 255, 0.1)',
                                            cursor: 'pointer'
                                        }}
                                        onClick={() => setSelectedGroup(group)}
                                    >
                                        <Card.Body>
                                            <h6 style={{ color: '#fff', margin: '0 0 8px 0' }}>
                                                {group.name}
                                            </h6>
                                            <small style={{ color: 'var(--color-light-gray)' }}>
                                                {group.members.length} members • Code: {group.inviteCode}
                                            </small>
                                            <div style={{ marginTop: '8px' }}>
                                                <button
                                                    style={{
                                                        background: 'transparent',
                                                        border: '1px solid #dc3545',
                                                        color: '#dc3545',
                                                        padding: '4px 8px',
                                                        borderRadius: '4px',
                                                        fontSize: '12px'
                                                    }}
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        leaveGroup(group.id);
                                                    }}
                                                >
                                                    Leave
                                                </button>
                                            </div>
                                        </Card.Body>
                                    </Card>
                                ))
                            ) : (
                                <p style={{ color: 'var(--color-light-gray)' }}>
                                    No groups yet. Create or join a group to start sharing!
                                </p>
                            )}
                        </Col>

                        {/* Selected Group Details */}
                        <Col md={8}>
                            {selectedGroup ? (
                                <div>
                                    <div style={{ marginBottom: '24px' }}>
                                        <h4 style={{ color: '#fff', margin: '0 0 8px 0' }}>
                                            {selectedGroup.name}
                                        </h4>
                                        <p style={{ color: 'var(--color-light-gray)', margin: '0' }}>
                                            Invite Code: <strong>{selectedGroup.inviteCode}</strong> | 
                                            Created by {selectedGroup.creatorName}
                                        </p>
                                    </div>

                                    <div className="results-table">
                                        <h5 style={{ color: 'var(--color-dark-blue)', padding: '20px', margin: '0' }}>
                                            Group Members ({selectedGroup.members.length})
                                        </h5>
                                        <Table responsive style={{ margin: '0' }}>
                                            <thead>
                                                <tr>
                                                    <th>Name</th>
                                                    <th>Email</th>
                                                    <th>Phone</th>
                                                    <th>Joined</th>
                                                    <th>Analysis Shared</th>
                                                    <th>Actions</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {selectedGroup.members.map((member, index) => {
                                                    const shareKey = `${selectedGroup.id}_${member.id}`;
                                                    const hasSharedAnalysis = !!sharedAnalyses[shareKey];
                                                    
                                                    return (
                                                        <tr key={index}>
                                                            <td style={{ fontWeight: '600' }}>
                                                                {member.name}
                                                                {member.id === user.id && ( 
                                                                    <span style={{
                                                                        fontSize: '12px',
                                                                        color: 'var(--color-sage)',
                                                                        marginLeft: '8px',
                                                                        fontWeight: 'normal'
                                                                    }}>
                                                                        (You)
                                                                    </span>
                                                                )}
                                                            </td>
                                                            <td>{member.email}</td>
                                                            <td style={{ fontSize: '14px' }}>
                                                                {member.phone || 'Not provided'}
                                                            </td>
                                                            <td>{new Date(member.joinedAt).toLocaleDateString()}</td>
                                                            <td>
                                                                <span className={hasSharedAnalysis ? 'risk-low' : 'risk-medium'}>
                                                                    {hasSharedAnalysis ? 'Yes' : 'No'}
                                                                </span>
                                                            </td>
                                                            <td>
                                                                {hasSharedAnalysis && member.id !== user.id && (
                                                                    <button 
                                                                        style={{
                                                                            background: 'transparent',
                                                                            border: '1px solid var(--color-sage)',
                                                                            color: 'var(--color-sage)',
                                                                            padding: '4px 8px',
                                                                            borderRadius: '4px',
                                                                            fontSize: '12px'
                                                                        }}
                                                                        onClick={() => viewSharedAnalysis(member.id)}
                                                                    >
                                                                        View Analysis
                                                                    </button>
                                                                )}
                                                            </td>
                                                        </tr>
                                                    );
                                                })}
                                            </tbody>
                                        </Table>
                                    </div>
                                </div>
                            ) : (
                                <div style={{ textAlign: 'center', padding: '60px 20px' }}>
                                    <h5 style={{ color: 'var(--color-light-gray)' }}>
                                        Select a group to view details
                                    </h5>
                                </div>
                            )}
                        </Col>
                    </Row>
                </motion.div>
            </Container>
            {/* Profile Edit Modal */}
            <Modal show={showProfileModal} onHide={() => setShowProfileModal(false)} centered>
                <Modal.Header closeButton style={{ background: 'var(--color-dark-blue)' }}>
                    <Modal.Title style={{ color: '#fff' }}>Edit Profile</Modal.Title>
                </Modal.Header>
                <Modal.Body style={{ background: 'var(--color-blue-gray)' }}>
                    <Form>
                        <div className="form-group">
                            <label className="form-label">Display Name</label>
                            <input
                                type="text"
                                className="form-input"
                                value={editingProfile.name}
                                onChange={(e) => setEditingProfile(prev => ({ ...prev, name: e.target.value }))}
                                placeholder="Your display name"
                                required
                            />
                            <small style={{ color: 'var(--color-light-gray)', fontSize: '12px', marginTop: '4px', display: 'block' }}>
                                This name will be visible to other group members
                            </small>
                        </div>
                        <div className="form-group">
                            <label className="form-label">Phone Number (Optional)</label>
                            <input
                                type="tel"
                                className="form-input"
                                value={editingProfile.phone}
                                onChange={(e) => setEditingProfile(prev => ({ ...prev, phone: e.target.value }))}
                                placeholder="e.g., +1 (555) 123-4567"
                            />
                            <small style={{ color: 'var(--color-light-gray)', fontSize: '12px', marginTop: '4px', display: 'block' }}>
                                Phone number will be visible to group members for contact
                            </small>
                        </div>
                        <div style={{ 
                            background: 'rgba(125, 178, 144, 0.1)', 
                            border: '1px solid rgba(125, 178, 144, 0.2)',
                            borderRadius: '8px',
                            padding: '12px',
                            marginBottom: '20px'
                        }}>
                            <p style={{ 
                                color: 'var(--color-light-gray)', 
                                fontSize: '14px', 
                                margin: '0',
                                lineHeight: '1.4'
                            }}>
                                <strong>Privacy Note:</strong> Your profile information is only shared with members 
                                of groups you join. You can update this anytime.
                            </p>
                        </div>
                    </Form>
                    <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                        <button 
                            className="btn-secondary-large" 
                            onClick={() => setShowProfileModal(false)}
                        >
                            Cancel
                        </button>
                        <button 
                            className="btn-primary-large" 
                            onClick={saveUserProfile}
                            disabled={!editingProfile.name.trim()}
                        >
                            Save Profile
                        </button>
                    </div>
                </Modal.Body>
            </Modal>
            {/* Create Group Modal */}
            <Modal show={showCreateModal} onHide={() => setShowCreateModal(false)} centered>
                <Modal.Header closeButton style={{ background: 'var(--color-dark-blue)' }}>
                    <Modal.Title style={{ color: '#fff' }}>Create New Group</Modal.Title>
                </Modal.Header>
                <Modal.Body style={{ background: 'var(--color-blue-gray)' }}>
                    <form onSubmit={createGroup}>
                        <div className="form-group">
                            <label className="form-label">Group Name</label>
                            <input
                                type="text"
                                className="form-input"
                                value={newGroupName}
                                onChange={(e) => setNewGroupName(e.target.value)}
                                placeholder="e.g., Smith Family, Research Group"
                                required
                            />
                        </div>
                        <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '24px' }}>
                            <button type="button" className="btn-secondary-large" onClick={() => setShowCreateModal(false)}>
                                Cancel
                            </button>
                            <button type="submit" className="btn-primary-large">
                                Create Group
                            </button>
                        </div>
                    </form>
                </Modal.Body>
            </Modal>

            {/* Join Group Modal */}
            <Modal show={showInviteModal} onHide={() => setShowInviteModal(false)} centered>
                <Modal.Header closeButton style={{ background: 'var(--color-dark-blue)' }}>
                    <Modal.Title style={{ color: '#fff' }}>Join Group</Modal.Title>
                </Modal.Header>
                <Modal.Body style={{ background: 'var(--color-blue-gray)' }}>
                    <form onSubmit={joinGroup}>
                        <div className="form-group">
                            <label className="form-label">Group Join Code</label>
                            <input
                                type="text"
                                className="form-input"
                                value={joinCode}
                                onChange={(e) => setJoinCode(e.target.value)}
                                placeholder="Enter 6-character code"
                                required
                            />
                        </div>
                        <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '24px' }}>
                            <button type="button" className="btn-secondary-large" onClick={() => setShowInviteModal(false)}>
                                Cancel
                            </button>
                            <button type="submit" className="btn-primary-large">
                                Join Group
                            </button>
                        </div>
                    </form>
                </Modal.Body>
            </Modal>

            {/* Share Analysis Modal */}
            <Modal show={showShareModal} onHide={() => setShowShareModal(false)} centered>
                <Modal.Header closeButton style={{ background: 'var(--color-dark-blue)' }}>
                    <Modal.Title style={{ color: '#fff' }}>Share Analysis</Modal.Title>
                </Modal.Header>
                <Modal.Body style={{ background: 'var(--color-blue-gray)' }}>
                    <p style={{ color: 'var(--color-light-gray)', marginBottom: '24px' }}>
                        Share your genetic analysis results with "{selectedGroup?.name}" group members?
                    </p>
                    <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                        <button className="btn-secondary-large" onClick={() => setShowShareModal(false)}>
                            Cancel
                        </button>
                        <button className="btn-primary-large" onClick={shareAnalysis}>
                            Share Analysis
                        </button>
                    </div>
                </Modal.Body>
            </Modal>

            {/* View Analysis Modal */}
            <Modal show={showViewModal} onHide={() => setShowViewModal(false)} size="lg" centered>
                <Modal.Header closeButton style={{ background: 'var(--color-dark-blue)' }}>
                    <Modal.Title style={{ color: '#fff' }}>
                        {selectedAnalysis?.sharedBy}'s Analysis
                    </Modal.Title>
                </Modal.Header>
                <Modal.Body style={{ background: 'var(--color-blue-gray)' }}>
                    {selectedAnalysis && (
                        <div>
                            <p style={{ color: 'var(--color-light-gray)', marginBottom: '24px' }}>
                                Disease: {selectedAnalysis.disease.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())} | 
                                Shared: {new Date(selectedAnalysis.sharedAt).toLocaleDateString()}
                            </p>
                            
                            <Table responsive>
                                <thead>
                                    <tr>
                                        <th>Gene</th>
                                        <th>Risk Level</th>
                                        <th>Score</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {selectedAnalysis.risks.slice(0, 10).map((risk, index) => (
                                        <tr key={index}>
                                            <td>{risk.gene}</td>
                                            <td>
                                                <span className={`risk-${risk.level?.toLowerCase()}`}>
                                                    {risk.level}
                                                </span>
                                            </td>
                                            <td>{risk.risk?.toFixed(3)}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </Table>
                        </div>
                    )}
                </Modal.Body>
            </Modal>
        </section>
    );
};