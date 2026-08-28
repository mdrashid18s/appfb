import React, { useState, useEffect } from 'react';
import { 
  GraduationCap, 
  Search, 
  Filter, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  User, 
  Mail, 
  Phone, 
  MapPin, 
  Calendar,
  FileText,
  CreditCard,
  Eye
} from 'lucide-react';
import { useToast } from '../contexts/ToastContext';

export default function AdminRegistrationsView() {
  const toast = useToast();
  const [registrations, setRegistrations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filterStatus, setFilterStatus] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedReg, setSelectedReg] = useState(null);

  useEffect(() => {
    fetchRegistrations();
  }, [filterStatus]);

  const fetchRegistrations = async () => {
    setLoading(true);
    try {
      const query = filterStatus !== 'all' ? `?status=${filterStatus}` : '';
      const res = await fetch(`/api/admin/registrations${query}`);
      const data = await res.json();
      if (data.success && Array.isArray(data.registrations)) {
        setRegistrations(data.registrations);
      }
    } catch (err) {
      console.error(err);
      toast.error('Failed to load student registrations');
    }
    setLoading(false);
  };

  const handleUpdateStatus = async (regId, newStatus) => {
    try {
      const res = await fetch(`/api/admin/registrations/${regId}/status`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });
      const data = await res.json();
      if (data.success) {
        toast.success(`Registration marked as ${newStatus}!`);
        fetchRegistrations();
        if (selectedReg && selectedReg.id === regId) {
          setSelectedReg(prev => ({ ...prev, status: newStatus }));
        }
      } else {
        toast.error(data.message || 'Failed to update status');
      }
    } catch (err) {
      console.error(err);
      toast.error('Network error updating registration status');
    }
  };

  const filteredRegistrations = registrations.filter(r => {
    const term = searchTerm.toLowerCase();
    const fullName = `${r.first_name || ''} ${r.surname || ''}`.toLowerCase();
    const parentName = `${r.parent_first_name || ''} ${r.parent_surname || ''}`.toLowerCase();
    return (
      fullName.includes(term) ||
      parentName.includes(term) ||
      (r.primary_email && r.primary_email.toLowerCase().includes(term)) ||
      (r.ref_number && r.ref_number.toLowerCase().includes(term))
    );
  });

  return (
    <div style={{ padding: '1.5rem', background: '#f8fafc', minHeight: '100vh' }}>
      {/* Header Bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: '700', color: '#0f172a', margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <GraduationCap size={24} color="#059669" />
            Student Registrations & Admission Hub
          </h1>
          <p style={{ color: '#64748b', margin: '0.25rem 0 0', fontSize: '0.9rem' }}>
            Review new student registration submissions, course placements, delivery modes, and confirm admissions.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
          <span style={{ fontSize: '0.85rem', color: '#475569' }}>
            Total Registrations: <strong>{registrations.length}</strong>
          </span>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.25rem', flexWrap: 'wrap' }}>
        <div style={{ flex: '1 1 280px', position: 'relative' }}>
          <Search size={16} color="#94a3b8" style={{ position: 'absolute', left: '12px', top: '12px' }} />
          <input 
            type="text" 
            placeholder="Search student, parent, email, ref number..." 
            value={searchTerm} 
            onChange={e => setSearchTerm(e.target.value)}
            style={{ width: '100%', padding: '0.6rem 0.8rem 0.6rem 2.2rem', border: '1px solid #cbd5e1', borderRadius: '8px', fontSize: '0.9rem' }}
          />
        </div>

        <select 
          value={filterStatus} 
          onChange={e => setFilterStatus(e.target.value)}
          style={{ padding: '0.6rem 1rem', border: '1px solid #cbd5e1', borderRadius: '8px', fontSize: '0.9rem', background: '#fff' }}
        >
          <option value="all">All Statuses</option>
          <option value="pending">Pending Approval</option>
          <option value="confirmed">Confirmed</option>
          <option value="enrolled">Enrolled</option>
          <option value="rejected">Rejected</option>
        </select>
      </div>

      {/* Main Table */}
      <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '12px', overflow: 'hidden', boxShadow: '0 2px 8px rgba(0,0,0,0.02)' }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.88rem' }}>
            <thead>
              <tr style={{ background: '#f8fafc', borderBottom: '2px solid #e2e8f0', color: '#475569', textAlign: 'left' }}>
                <th style={{ padding: '0.75rem 1rem' }}>Ref #</th>
                <th style={{ padding: '0.75rem 1rem' }}>Student Name</th>
                <th style={{ padding: '0.75rem 1rem' }}>Year / Course</th>
                <th style={{ padding: '0.75rem 1rem' }}>Learning Style & Centre</th>
                <th style={{ padding: '0.75rem 1rem' }}>Batch Session</th>
                <th style={{ padding: '0.75rem 1rem' }}>Parent Contact</th>
                <th style={{ padding: '0.75rem 1rem' }}>Status</th>
                <th style={{ padding: '0.75rem 1rem', textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredRegistrations.length === 0 ? (
                <tr>
                  <td colSpan="8" style={{ padding: '2.5rem', textAlign: 'center', color: '#94a3b8' }}>
                    No student registrations found matching your filter.
                  </td>
                </tr>
              ) : (
                filteredRegistrations.map(reg => {
                  const statusColors = {
                    pending: { bg: '#fef3c7', text: '#92400e' },
                    confirmed: { bg: '#e0f2fe', text: '#0369a1' },
                    enrolled: { bg: '#dcfce7', text: '#166534' },
                    rejected: { bg: '#fee2e2', text: '#991b1b' },
                  };
                  const colors = statusColors[reg.status] || { bg: '#f1f5f9', text: '#475569' };

                  return (
                    <tr key={reg.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                      <td style={{ padding: '0.75rem 1rem', fontWeight: '700', color: '#0f172a' }}>
                        {reg.ref_number || `REG-${reg.id}`}
                      </td>
                      <td style={{ padding: '0.75rem 1rem', fontWeight: '600', color: '#1e293b' }}>
                        {reg.first_name} {reg.surname}
                      </td>
                      <td style={{ padding: '0.75rem 1rem', color: '#334155' }}>
                        <span style={{ fontWeight: '600' }}>{reg.school_year}</span>
                      </td>
                      <td style={{ padding: '0.75rem 1rem' }}>
                        <div style={{ fontWeight: '500', color: '#0f172a' }}>{reg.learning_style || 'Classroom'}</div>
                        <div style={{ fontSize: '0.78rem', color: '#64748b' }}>{reg.centre?.centre_name || 'Online Live'}</div>
                      </td>
                      <td style={{ padding: '0.75rem 1rem', color: '#334155', fontSize: '0.82rem' }}>
                        <div>{reg.preferred_day || 'Saturday'}</div>
                        <div style={{ color: '#64748b' }}>{reg.preferred_session || '09:00 to 12:30'}</div>
                      </td>
                      <td style={{ padding: '0.75rem 1rem', fontSize: '0.82rem' }}>
                        <div style={{ fontWeight: '600' }}>{reg.parent_first_name} {reg.parent_surname}</div>
                        <div style={{ color: '#64748b' }}>{reg.primary_email}</div>
                      </td>
                      <td style={{ padding: '0.75rem 1rem' }}>
                        <span style={{
                          background: colors.bg,
                          color: colors.text,
                          fontSize: '0.75rem',
                          fontWeight: '700',
                          padding: '0.2rem 0.6rem',
                          borderRadius: '12px',
                          textTransform: 'capitalize'
                        }}>
                          {reg.status}
                        </span>
                      </td>
                      <td style={{ padding: '0.75rem 1rem', textAlign: 'right' }}>
                        <div style={{ display: 'flex', gap: '0.35rem', justifyContent: 'flex-end' }}>
                          <button 
                            onClick={() => setSelectedReg(reg)}
                            title="View Details"
                            style={{ background: '#f1f5f9', border: 'none', padding: '0.35rem 0.6rem', borderRadius: '6px', cursor: 'pointer' }}
                          >
                            <Eye size={15} color="#475569" />
                          </button>
                          {reg.status !== 'enrolled' && (
                            <button 
                              onClick={() => handleUpdateStatus(reg.id, 'enrolled')}
                              title="Approve & Enroll"
                              style={{ background: '#dcfce7', border: 'none', padding: '0.35rem 0.6rem', borderRadius: '6px', cursor: 'pointer' }}
                            >
                              <CheckCircle2 size={15} color="#166534" />
                            </button>
                          )}
                          {reg.status !== 'rejected' && (
                            <button 
                              onClick={() => handleUpdateStatus(reg.id, 'rejected')}
                              title="Reject Registration"
                              style={{ background: '#fee2e2', border: 'none', padding: '0.35rem 0.6rem', borderRadius: '6px', cursor: 'pointer' }}
                            >
                              <XCircle size={15} color="#991b1b" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal: View Full Registration Detail */}
      {selectedReg && (
        <div style={{
          position: 'fixed',
          top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
          padding: '1rem'
        }}>
          <div style={{ background: '#fff', borderRadius: '12px', width: '100%', maxWidth: '600px', padding: '1.75rem', maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', borderBottom: '1px solid #f1f5f9', paddingBottom: '0.75rem' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: '700', color: '#0f172a' }}>
                  {selectedReg.first_name} {selectedReg.surname}
                </h3>
                <span style={{ fontSize: '0.85rem', color: '#64748b' }}>Reference: {selectedReg.ref_number || `REG-${selectedReg.id}`}</span>
              </div>
              <button onClick={() => setSelectedReg(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.2rem' }}>
                ✕
              </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', fontSize: '0.88rem', marginBottom: '1.5rem' }}>
              <div>
                <div style={{ color: '#64748b', fontSize: '0.78rem', fontWeight: '600' }}>COURSE & YEAR</div>
                <div style={{ fontWeight: '600', color: '#0f172a' }}>{selectedReg.school_year}</div>
              </div>
              <div>
                <div style={{ color: '#64748b', fontSize: '0.78rem', fontWeight: '600' }}>LEARNING STYLE</div>
                <div style={{ fontWeight: '600', color: '#0f172a' }}>{selectedReg.learning_style || 'Classroom'}</div>
              </div>
              <div>
                <div style={{ color: '#64748b', fontSize: '0.78rem', fontWeight: '600' }}>CENTRE LOCATION</div>
                <div style={{ fontWeight: '600', color: '#0f172a' }}>{selectedReg.centre?.centre_name || 'Online Live Hub'}</div>
              </div>
              <div>
                <div style={{ color: '#64748b', fontSize: '0.78rem', fontWeight: '600' }}>DAY & TIME SLOT</div>
                <div style={{ fontWeight: '600', color: '#0f172a' }}>{selectedReg.preferred_day} ({selectedReg.preferred_session})</div>
              </div>
              <div>
                <div style={{ color: '#64748b', fontSize: '0.78rem', fontWeight: '600' }}>PARENT NAME</div>
                <div style={{ fontWeight: '600', color: '#0f172a' }}>{selectedReg.parent_first_name} {selectedReg.parent_surname}</div>
              </div>
              <div>
                <div style={{ color: '#64748b', fontSize: '0.78rem', fontWeight: '600' }}>PARENT EMAIL</div>
                <div style={{ fontWeight: '600', color: '#0f172a' }}>{selectedReg.primary_email}</div>
              </div>
              <div>
                <div style={{ color: '#64748b', fontSize: '0.78rem', fontWeight: '600' }}>MOBILE</div>
                <div style={{ fontWeight: '600', color: '#0f172a' }}>{selectedReg.mobile || 'N/A'}</div>
              </div>
              <div>
                <div style={{ color: '#64748b', fontSize: '0.78rem', fontWeight: '600' }}>ADDRESS</div>
                <div style={{ fontWeight: '600', color: '#0f172a' }}>{selectedReg.address || 'N/A'}</div>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', borderTop: '1px solid #f1f5f9', paddingTop: '1rem' }}>
              <button 
                onClick={() => setSelectedReg(null)}
                style={{ padding: '0.5rem 1rem', borderRadius: '6px', border: '1px solid #cbd5e1', background: '#fff', cursor: 'pointer' }}
              >
                Close
              </button>
              <button 
                onClick={() => handleUpdateStatus(selectedReg.id, 'enrolled')}
                style={{ padding: '0.5rem 1.2rem', borderRadius: '6px', border: 'none', background: '#059669', color: '#fff', fontWeight: '600', cursor: 'pointer' }}
              >
                Confirm & Enroll Student
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
