import { useState, useEffect, useContext } from 'react';
import { Container, Row, Col, Table, Modal, Alert, Card, Form } from 'react-bootstrap';
import { motion } from 'framer-motion';
import { AuthContext } from '../context/AuthContext';
import { useAnalysis } from '../context/AnalysisContext';
import { db } from '../services/database';

export const GroupsPage = () => {
    const { user } = useContext(AuthContext);
    const { currentAnalysis } = useAnalysis();
    const [groups, setGroups] = useState([]);
    const [selectedGroup, setSelectedGroup] = useState(null);
    const [groupMembers, setGroupMembers] = useState([]);
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
    const [joinCode, setJoinCode] = useState('');
    const [editingProfile, setEditingProfile] = useState({
        name: '',
        phone: ''
    });

    useEffect(() => {
        if (user?.uid) {
            loadGroups();
            loadUserProfile();
        }
        setLoading(false);
    }, [user?.uid]);

    useEffect(() => {
        if (selectedGroup?.id && user?.uid) {
            loadGroupMembers(selectedGroup.id);
            loadSharedAnalyses(selectedGroup.id);
        }
    }, [selectedGroup?.id, user?.uid]);

    const loadUserProfile = async () => {
        if (!user?.uid) return;

        try {
            const profile = await db.getCurrentUser(user.uid);

            setEditingProfile({
                name: profile.display_name || user.name,
                phone: profile.phone || ''
            });
        } catch (error) {
            console.error('Failed to parse user profile:', error);
            setEditingProfile({
                name: user.name,
                phone: ''
            });
        }
    };

    const saveUserProfile = async () => {
        if (!user?.uid) return;

        try {
            await db.updateProfile(user.uid, editingProfile.name, editingProfile.phone);

            await loadGroups();
            if (selectedGroup) {
                await loadGroupMembers(selectedGroup.id);
            }

            setShowProfileModal(false);
            setSuccess('Profile updated successfully!');
        } catch (error) {
            setError('Failed to update profile: ' + error.message);
        }
    };

    const loadGroups = async () => {
        if (!user?.uid) return;

        try {
            const userGroups = await db.getUserGroups(user.uid);
            setGroups(userGroups);
            if (userGroups.length > 0 && !selectedGroup) {
                setSelectedGroup(userGroups[0]);
            }
        } catch (error) {
            console.error('Failed to load groups:', error);
            setError('Failed to load groups');
        }
    };

    const loadGroupMembers = async (groupId) => {
        if (!user?.uid) return;

        try {
            const members = await db.getGroupMembers(groupId, user.uid);
            setGroupMembers(members);
        } catch (error) {
            console.error('Failed to load group members:', error);
            setError('Failed to load group members');
        }
    };

    const loadSharedAnalyses = async (groupId) => {
        if (!user?.uid) return;

        try {
            const analyses = await db.getSharedAnalyses(groupId, user.uid);

            const analysesMap = {};
            analyses.forEach(analysis => {
                const sharer = groupMembers.find(m => m.name === analysis.share_by);
                if (sharer) {
                    analysesMap[sharer.firebase_uid] = analysis;
                }
            });

            setSharedAnalyses(analysesMap);
        } catch (error) {
            console.error('Failed to load shared analyses:', error);
        }
    };

    const createGroup = async (e) => {
        e.preventDefault();
        if (!newGroupName.trim()) {
            setError('Group name is required');
            return;
        }

        try {
            const newGroup = await db.createGroup(user.uid, newGroupName);

            await loadGroups();
            setSelectedGroup(newGroup);
            setNewGroupName('');
            setShowCreateModal(false);
            setSuccess(`Group "${newGroupName}" created! Share code: ${newGroup.invite_code}`);
        } catch (error) {
            setError('Failed to create new group: ' + error.message);
        }
    };

    const joinGroup = async (e) => {
        e.preventDefault();
        if (!joinCode.trim()) {
            setError('Join code is required');
            return;
        }

        try {
            const result = await db.joinGroup(user.uid, joinCode.toUpperCase());

            await loadGroups();

            const joinedGroup = groups.find(g => g.id === result.group_id);
            if (joinedGroup) {
                setSelectedGroup(joinedGroup);
            }

            setJoinCode('');
            setSuccess(`Joined group "${result.group_name}"!`);
        } catch (error) {
            setError('Failed to join group: ' + error.message);
        }
    };

    const shareAnalysis = async () => {
        if (!currentAnalysis) {
            setError('No analysis to share');
            return;
        }

        try {
            await db.shareAnalysis(currentAnalysis.id, selectedGroup.id, user.uid);

            await loadSharedAnalyses(selectedGroup.id);
            await loadGroupMembers(selectedGroup.id);

            setShowShareModal(false);
            setSuccess('Analysis shared with group!');
        } catch (error) {
            setError('Failed to share analysis: ' + error.message);
        }
    };

    const unshareAnalysis = async () => {
        if (!selectedGroup || !user || !currentAnalysis) return;

        try {
            await db.unshareAnalysis(currentAnalysis.id, selectedGroup.id, user.uid);

            await loadSharedAnalyses(selectedGroup.id);
            await loadGroupMembers(selectedGroup.id);

            setSuccess('Analysis unshared from group');
        } catch (error) {
            setError('Failed to unshare analysis: ' + error.message);
        }
    };

    const viewSharedAnalysis = (memberFirebaseUid) => {
        const analysis = sharedAnalyses[memberFirebaseUid];

        if (analysis) {
            setSelectedAnalysis(analysis);
            setShowViewModal(true);
        } else {
            setError('No shared analysis found for this member');
        }
    };

    const leaveGroup = async (groupId) => {
        if (window.confirm('Are you sure you want to leave this group?')) {
            return;
        }

        try {
            await db.leaveGroup(groupId, user.uid);
            await loadGroups();

            if (selectedGroup?.id === groupId) {
                setSelectedGroup(groups.length > 0 ? groups[0] : null);
            }

            setSuccess('Left group successfully');
        } catch (error) {
            setError('Failed to leave group: ' + error.message)
        }
    };

    const isAnalysisShared = () => {
        if (!selectedGroup || !user || !currentAnalysis) return false;

        const userMember = groupMembers.find(m => m.firebase_uid === user.uid);
        return userMember?.has_shared_analysis || false;
    };
    
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
                                    isAnalysisShared() ? (
                                        <button 
                                            className="btn-secondary-large"
                                            onClick={unshareAnalysis}
                                            style={{ background: '#dc3545', borderColor: '#dc3545'}}
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
                                    )
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
                                                {group.member_count} members • Code: {group.invite_code}
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
                                            Invite Code: <strong>{selectedGroup.invite_code}</strong> | 
                                            Created by {selectedGroup.creator_name}
                                        </p>
                                    </div>

                                    <div className="results-table">
                                        <h5 style={{ color: 'var(--color-dark-blue)', padding: '20px', margin: '0' }}>
                                            Group Members ({groupMembers.length})
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
                                                {groupMembers.map((member, index) => {
                                                    const hasSharedAnalysis = member.has_shared_analysis;
                                                    
                                                    return (
                                                        <tr key={index}>
                                                            <td style={{ fontWeight: '600' }}>
                                                                {member.name}
                                                                {member.firebase_uid === user.uid && ( 
                                                                    <span style={{
                                                                        fontSize: '14px',
                                                                        color: 'var(--color-sage)',
                                                                        marginLeft: '8px',
                                                                        fontWeight: 'normal'
                                                                    }}>
                                                                        (You)
                                                                    </span>
                                                                )}
                                                            </td>
                                                            <td>{member.email}</td>
                                                            <td>
                                                                {member.phone || 'Not provided'}
                                                            </td>
                                                            <td>{new Date(member.joined_at).toLocaleDateString()}</td>
                                                            <td>
                                                                <span className={hasSharedAnalysis ? 'risk-low' : 'risk-medium'}>
                                                                    {hasSharedAnalysis ? 'Yes' : 'No'}
                                                                </span>
                                                            </td>
                                                            <td>
                                                                {hasSharedAnalysis && member.firebase_uid !== user.id && (
                                                                    <button 
                                                                        style={{
                                                                            background: 'transparent',
                                                                            border: '1px solid var(--color-sage)',
                                                                            color: 'var(--color-sage)',
                                                                            padding: '4px 8px',
                                                                            borderRadius: '4px',
                                                                            fontSize: '12px'
                                                                        }}
                                                                        onClick={() => viewSharedAnalysis(member.firebase_uid)}
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
                                placeholder="Enter 16-character code"
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