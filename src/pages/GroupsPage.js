import { useState, useEffect, useContext } from 'react';
import { Container, Row, Col, Table, Modal, Alert, Card } from 'react-bootstrap';
import { motion } from 'framer-motion';
import { AuthContext } from '../context/AuthContext';
import { api } from '../services/api';

export const GroupsPage = () => {
    const { user } = useContext(AuthContext);
    const [groups, setGroups] = useState([]);
    const [selectedGroup, setSelectedGroup] = useState(null);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [showInviteModal, setShowInviteModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    // Form states
    const [newGroupName, setNewGroupName] = useState('');
    const [editGroupName, setEditGroupName] = useState('');
    const [inviteEmail, setInviteEmail] = useState('');
    const [actionLoading, setActionLoading] = useState(false);

    useEffect(() => {
        loadGroups();
    }, [user]);

    const loadGroups = async () => {
        try {
            // Mock data for demo - replace with real API call
            const mockGroups = [
                {
                    id: 1,
                    name: 'Immediate Family',
                    members: [
                        { email: 'john@example.com', name: 'John Doe', hasData: true },
                        { email: 'jane@example.com', name: 'Jane Doe', hasData: false }
                    ],
                    createdBy: user.id
                },
                {
                    id: 2,
                    name: 'Extended Family',
                    members: [
                        { email: 'cousin@example.com', name: 'Cousin Mike', hasData: true }
                    ],
                    createdBy: user.id
                }
            ];
            
            setGroups(mockGroups);
            if (mockGroups.length > 0) {
                setSelectedGroup(mockGroups[0]);
            }
        } catch (error) {
            console.error('Failed to load groups:', error);
            setError('Failed to load groups');
        } finally {
            setLoading(false);
        }
    };

    const createGroup = async (e) => {
        e.preventDefault();
        if (!newGroupName.trim()) {
            setError('Group name is required');
            return;
        }

        setActionLoading(true);
        setError('');

        try {
            // Mock API call - replace with real one
            const newGroup = {
                id: Date.now(),
                name: newGroupName,
                members: [],
                createdBy: user.id
            };

            setGroups([...groups, newGroup]);
            setSelectedGroup(newGroup);
            setNewGroupName('');
            setShowCreateModal(false);
            setSuccess(`Group "${newGroupName}" created successfully!`);
        } catch (error) {
            setError('Failed to create group');
        } finally {
            setActionLoading(false);
        }
    };

    const editGroup = async (e) => {
        e.preventDefault();
        if (!editGroupName.trim()) {
            setError('Group name is required');
            return;
        }

        setActionLoading(true);
        setError('');

        try {
            const updatedGroups = groups.map(group => 
                group.id === selectedGroup.id 
                    ? { ...group, name: editGroupName }
                    : group
            );
            
            setGroups(updatedGroups);
            setSelectedGroup({ ...selectedGroup, name: editGroupName });
            setEditGroupName('');
            setShowEditModal(false);
            setSuccess('Group name updated successfully!');
        } catch (error) {
            setError('Failed to update group name');
        } finally {
            setActionLoading(false);
        }
    };

    const inviteMember = async (e) => {
        e.preventDefault();
        if (!inviteEmail.trim()) {
            setError('Email is required');
            return;
        }

        // Check if email already exists in group
        if (selectedGroup.members.some(member => member.email === inviteEmail)) {
            setError('This person is already in the group');
            return;
        }

        setActionLoading(true);
        setError('');

        try {
            const newMember = {
                email: inviteEmail,
                name: inviteEmail.split('@')[0], // Mock name from email
                hasData: false
            };

            const updatedGroups = groups.map(group => 
                group.id === selectedGroup.id 
                    ? { ...group, members: [...group.members, newMember] }
                    : group
            );
            
            setGroups(updatedGroups);
            setSelectedGroup({ 
                ...selectedGroup, 
                members: [...selectedGroup.members, newMember] 
            });
            
            setInviteEmail('');
            setShowInviteModal(false);
            setSuccess(`Invitation sent to ${inviteEmail}!`);
        } catch (error) {
            setError('Failed to send invitation');
        } finally {
            setActionLoading(false);
        }
    };

    const deleteGroup = async (groupId) => {
        if (window.confirm('Are you sure you want to delete this group?')) {
            const updatedGroups = groups.filter(group => group.id !== groupId);
            setGroups(updatedGroups);
            
            if (selectedGroup && selectedGroup.id === groupId) {
                setSelectedGroup(updatedGroups.length > 0 ? updatedGroups[0] : null);
            }
            
            setSuccess('Group deleted successfully');
        }
    };

    const removeMember = async (memberEmail) => {
        if (window.confirm('Remove this member from the group?')) {
            const updatedMembers = selectedGroup.members.filter(
                member => member.email !== memberEmail
            );
            
            const updatedGroups = groups.map(group => 
                group.id === selectedGroup.id 
                    ? { ...group, members: updatedMembers }
                    : group
            );
            
            setGroups(updatedGroups);
            setSelectedGroup({ ...selectedGroup, members: updatedMembers });
            setSuccess('Member removed from group');
        }
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
                                Create groups and invite people to share genetic insights and compatibility analysis.
                            </p>
                            
                            <button 
                                className="btn-primary-large" 
                                onClick={() => setShowCreateModal(true)}
                                style={{ marginBottom: '32px' }}
                            >
                                Create New Group
                            </button>
                        </Col>
                    </Row>

                    {error && (
                        <Alert variant="danger" className="mb-4">
                            {error}
                        </Alert>
                    )}

                    {success && (
                        <Alert variant="success" className="mb-4">
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
                                                {group.members.length} members
                                            </small>
                                            <div style={{ marginTop: '8px', display: 'flex', gap: '8px' }}>
                                                <button
                                                    style={{
                                                        background: 'transparent',
                                                        border: '1px solid rgba(255,255,255,0.3)',
                                                        color: '#fff',
                                                        padding: '4px 8px',
                                                        borderRadius: '4px',
                                                        fontSize: '12px'
                                                    }}
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        setEditGroupName(group.name);
                                                        setShowEditModal(true);
                                                    }}
                                                >
                                                    Rename
                                                </button>
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
                                                        deleteGroup(group.id);
                                                    }}
                                                >
                                                    Delete
                                                </button>
                                            </div>
                                        </Card.Body>
                                    </Card>
                                ))
                            ) : (
                                <p style={{ color: 'var(--color-light-gray)' }}>
                                    No groups yet. Create your first group to get started!
                                </p>
                            )}
                        </Col>

                        {/* Selected Group Details */}
                        <Col md={8}>
                            {selectedGroup ? (
                                <div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                                        <h4 style={{ color: '#fff', margin: '0' }}>
                                            {selectedGroup.name}
                                        </h4>
                                        <button 
                                            className="btn-secondary-large"
                                            onClick={() => setShowInviteModal(true)}
                                        >
                                            Invite Member
                                        </button>
                                    </div>

                                    <div className="results-table">
                                        <h5 style={{ color: 'var(--color-dark-blue)', padding: '20px', margin: '0' }}>
                                            Group Members
                                        </h5>
                                        {selectedGroup.members.length > 0 ? (
                                            <Table responsive style={{ margin: '0' }}>
                                                <thead>
                                                    <tr>
                                                        <th>Name</th>
                                                        <th>Email</th>
                                                        <th>Data Status</th>
                                                        <th>Actions</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {selectedGroup.members.map((member, index) => (
                                                        <tr key={index}>
                                                            <td style={{ fontWeight: '600' }}>{member.name}</td>
                                                            <td>{member.email}</td>
                                                            <td>
                                                                <span className={member.hasData ? 'risk-low' : 'risk-medium'}>
                                                                    {member.hasData ? 'Has Data' : 'No Data Yet'}
                                                                </span>
                                                            </td>
                                                            <td>
                                                                <button 
                                                                    style={{
                                                                        background: 'transparent',
                                                                        border: '1px solid #dc3545',
                                                                        color: '#dc3545',
                                                                        padding: '4px 8px',
                                                                        borderRadius: '4px',
                                                                        fontSize: '12px'
                                                                    }}
                                                                    onClick={() => removeMember(member.email)}
                                                                >
                                                                    Remove
                                                                </button>
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </Table>
                                        ) : (
                                            <div style={{ padding: '40px', textAlign: 'center' }}>
                                                <h6 style={{ color: 'var(--color-dark-blue)', marginBottom: '16px' }}>
                                                    No members yet
                                                </h6>
                                                <p style={{ color: 'var(--color-medium-gray)' }}>
                                                    Invite people to join this group and share genetic insights.
                                                </p>
                                            </div>
                                        )}
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
                                placeholder="e.g., Family, Work Friends, Study Group"
                                required
                            />
                        </div>
                        <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '24px' }}>
                            <button type="button" className="btn-secondary-large" onClick={() => setShowCreateModal(false)}>
                                Cancel
                            </button>
                            <button type="submit" className="btn-primary-large" disabled={actionLoading}>
                                {actionLoading ? 'Creating...' : 'Create Group'}
                            </button>
                        </div>
                    </form>
                </Modal.Body>
            </Modal>

            {/* Edit Group Modal */}
            <Modal show={showEditModal} onHide={() => setShowEditModal(false)} centered>
                <Modal.Header closeButton style={{ background: 'var(--color-dark-blue)' }}>
                    <Modal.Title style={{ color: '#fff' }}>Rename Group</Modal.Title>
                </Modal.Header>
                <Modal.Body style={{ background: 'var(--color-blue-gray)' }}>
                    <form onSubmit={editGroup}>
                        <div className="form-group">
                            <label className="form-label">Group Name</label>
                            <input
                                type="text"
                                className="form-input"
                                value={editGroupName}
                                onChange={(e) => setEditGroupName(e.target.value)}
                                required
                            />
                        </div>
                        <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '24px' }}>
                            <button type="button" className="btn-secondary-large" onClick={() => setShowEditModal(false)}>
                                Cancel
                            </button>
                            <button type="submit" className="btn-primary-large" disabled={actionLoading}>
                                {actionLoading ? 'Updating...' : 'Update Name'}
                            </button>
                        </div>
                    </form>
                </Modal.Body>
            </Modal>

            {/* Invite Member Modal */}
            <Modal show={showInviteModal} onHide={() => setShowInviteModal(false)} centered>
                <Modal.Header closeButton style={{ background: 'var(--color-dark-blue)' }}>
                    <Modal.Title style={{ color: '#fff' }}>Invite to {selectedGroup?.name}</Modal.Title>
                </Modal.Header>
                <Modal.Body style={{ background: 'var(--color-blue-gray)' }}>
                    <form onSubmit={inviteMember}>
                        <div className="form-group">
                            <label className="form-label">Email Address</label>
                            <input
                                type="email"
                                className="form-input"
                                value={inviteEmail}
                                onChange={(e) => setInviteEmail(e.target.value)}
                                placeholder="person@email.com"
                                required
                            />
                        </div>
                        <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '24px' }}>
                            <button type="button" className="btn-secondary-large" onClick={() => setShowInviteModal(false)}>
                                Cancel
                            </button>
                            <button type="submit" className="btn-primary-large" disabled={actionLoading}>
                                {actionLoading ? 'Sending...' : 'Send Invitation'}
                            </button>
                        </div>
                    </form>
                </Modal.Body>
            </Modal>
        </section>
    );
};