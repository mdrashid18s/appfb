import React, { useState, useEffect } from 'react';
import { 
  Building2, 
  MapPin, 
  Clock, 
  Users, 
  Plus, 
  Trash2, 
  Edit3, 
  CheckCircle2, 
  AlertCircle, 
  Search,
  Check,
  X
} from 'lucide-react';
import styles from './AdminDashboard.module.css';
import { useToast } from '../contexts/ToastContext';

export default function AdminBranchesView() {
  const toast = useToast();
  const [branches, setBranches] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedBranch, setSelectedBranch] = useState(null);

  // New Timing Slot Modal State
  const [isAddSlotOpen, setIsAddSlotOpen] = useState(false);
  const [newSlot, setNewSlot] = useState({
    centre_id: '',
    school_year: 'Year 5',
    day_of_week: 'Saturday',
    session_timing: '09:00 to 12:30',
    max_seats: 150,
    is_available: true
  });

  // Edit Slot State
  const [editingSlotId, setEditingSlotId] = useState(null);
  const [editMaxSeats, setEditMaxSeats] = useState(150);

  useEffect(() => {
    fetchBranches();
  }, []);

  const fetchBranches = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/branches');
      const data = await res.json();
      if (data.success && Array.isArray(data.centres)) {
        setBranches(data.centres);
        if (data.centres.length > 0 && !selectedBranch) {
          setSelectedBranch(data.centres[0]);
        }
      }
    } catch (err) {
      console.error(err);
      toast.error('Failed to load branches data');
    }
    setLoading(false);
  };

  const handleAddSlot = async (e) => {
    e.preventDefault();
    if (!newSlot.centre_id) {
      toast.error('Please select a centre');
      return;
    }
    try {
      const res = await fetch('/api/admin/timing-slots', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newSlot)
      });
      const data = await res.json();
      if (data.success) {
        toast.success('Timing slot created successfully!');
        setIsAddSlotOpen(false);
        fetchBranches();
      } else {
        toast.error(data.message || 'Error adding slot');
      }
    } catch (err) {
      console.error(err);
      toast.error('Failed to save timing slot');
    }
  };

  const handleUpdateSlot = async (slotId, maxSeats, isAvailable) => {
    try {
      const res = await fetch(`/api/admin/timing-slots/${slotId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ max_seats: maxSeats, is_available: isAvailable })
      });
      const data = await res.json();
      if (data.success) {
        toast.success('Slot updated successfully');
        setEditingSlotId(null);
        fetchBranches();
      } else {
        toast.error(data.message || 'Error updating slot');
      }
    } catch (err) {
      console.error(err);
      toast.error('Failed to update slot');
    }
  };

  const handleDeleteSlot = async (slotId) => {
    if (!window.confirm('Are you sure you want to delete this timing slot?')) return;
    try {
      const res = await fetch(`/api/admin/timing-slots/${slotId}`, {
        method: 'DELETE'
      });
      const data = await res.json();
      if (data.success) {
        toast.success('Timing slot deleted');
        fetchBranches();
      }
    } catch (err) {
      console.error(err);
      toast.error('Failed to delete slot');
    }
  };

  const filteredBranches = branches.filter(b => 
    b.centre_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (b.address && b.address.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div style={{ padding: '1.5rem', background: '#f8fafc', minHeight: '100vh' }}>
      {/* Header Row */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: '700', color: '#0f172a', margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Building2 size={24} color="#0284c7" />
            Branch & Location Manager
          </h1>
          <p style={{ color: '#64748b', margin: '0.25rem 0 0', fontSize: '0.9rem' }}>
            Manage physical tuition centres, timing batches, and live seat allocations.
          </p>
        </div>

        <button 
          onClick={() => {
            if (selectedBranch) {
              setNewSlot(p => ({ ...p, centre_id: selectedBranch.id }));
            }
            setIsAddSlotOpen(true);
          }}
          style={{
            background: 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)',
            color: '#fff',
            border: 'none',
            padding: '0.6rem 1.2rem',
            borderRadius: '8px',
            fontWeight: '600',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '0.4rem',
            boxShadow: '0 4px 12px rgba(2,132,199,0.25)'
          }}
        >
          <Plus size={18} /> Add New Timing Slot
        </button>
      </div>

      {/* Main Grid: Branches Cards + Selected Branch Slots */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.5rem' }}>
        {/* Left Col: Branch List */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div style={{ position: 'relative' }}>
            <Search size={16} color="#94a3b8" style={{ position: 'absolute', left: '12px', top: '12px' }} />
            <input 
              type="text" 
              placeholder="Search centres..." 
              value={searchTerm} 
              onChange={e => setSearchTerm(e.target.value)}
              style={{
                width: '100%',
                padding: '0.6rem 0.8rem 0.6rem 2.2rem',
                border: '1px solid #cbd5e1',
                borderRadius: '8px',
                fontSize: '0.9rem'
              }}
            />
          </div>

          {filteredBranches.map(branch => {
            const isSelected = selectedBranch && selectedBranch.id === branch.id;
            const slotsCount = (branch.timing_slots || []).length;
            const totalMaxSeats = (branch.timing_slots || []).reduce((acc, s) => acc + (s.max_seats || 0), 0);
            const totalBooked = (branch.timing_slots || []).reduce((acc, s) => acc + (s.booked_seats || 0), 0);

            return (
              <div 
                key={branch.id} 
                onClick={() => setSelectedBranch(branch)}
                style={{
                  background: '#fff',
                  border: isSelected ? '2px solid #0284c7' : '1px solid #e2e8f0',
                  borderRadius: '12px',
                  padding: '1.25rem',
                  cursor: 'pointer',
                  boxShadow: isSelected ? '0 8px 24px rgba(2,132,199,0.12)' : '0 2px 4px rgba(0,0,0,0.02)',
                  transition: 'all 0.2s'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <h3 style={{ fontSize: '1.1rem', fontWeight: '700', color: '#0f172a', margin: '0 0 0.25rem' }}>
                      {branch.centre_name}
                    </h3>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: '#64748b', fontSize: '0.85rem' }}>
                      <MapPin size={14} color="#0284c7" />
                      <span>{branch.address || 'Tuition Centre Hub'}</span>
                    </div>
                  </div>
                  <span style={{
                    background: '#e0f2fe',
                    color: '#0369a1',
                    fontSize: '0.75rem',
                    fontWeight: '700',
                    padding: '0.2rem 0.5rem',
                    borderRadius: '6px'
                  }}>
                    {slotsCount} Batches
                  </span>
                </div>

                <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem', paddingTop: '0.75rem', borderTop: '1px solid #f1f5f9', fontSize: '0.82rem', color: '#475569' }}>
                  <div>Total Seats: <strong>{totalMaxSeats}</strong></div>
                  <div>Booked: <strong style={{ color: '#0284c7' }}>{totalBooked}</strong></div>
                  <div>Available: <strong style={{ color: '#16a34a' }}>{Math.max(0, totalMaxSeats - totalBooked)}</strong></div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Right Col: Detailed Timing Slots Table for Selected Branch */}
        {selectedBranch && (
          <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '1.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <div>
                <h2 style={{ fontSize: '1.2rem', fontWeight: '700', color: '#0f172a', margin: 0 }}>
                  {selectedBranch.centre_name} — Timing Slots & Batches
                </h2>
                <span style={{ fontSize: '0.85rem', color: '#64748b' }}>Live Seat Capacities and Availability</span>
              </div>
              <button 
                onClick={() => {
                  setNewSlot(p => ({ ...p, centre_id: selectedBranch.id }));
                  setIsAddSlotOpen(true);
                }}
                style={{
                  background: '#f0fdf4',
                  color: '#16a34a',
                  border: '1px solid #bbf7d0',
                  padding: '0.4rem 0.8rem',
                  borderRadius: '6px',
                  fontWeight: '600',
                  fontSize: '0.85rem',
                  cursor: 'pointer'
                }}
              >
                + Add Batch
              </button>
            </div>

            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.88rem' }}>
                <thead>
                  <tr style={{ background: '#f8fafc', borderBottom: '2px solid #e2e8f0', color: '#475569', textAlign: 'left' }}>
                    <th style={{ padding: '0.6rem 0.75rem' }}>Year</th>
                    <th style={{ padding: '0.6rem 0.75rem' }}>Day</th>
                    <th style={{ padding: '0.6rem 0.75rem' }}>Timing Slot</th>
                    <th style={{ padding: '0.6rem 0.75rem' }}>Max Seats</th>
                    <th style={{ padding: '0.6rem 0.75rem' }}>Remaining</th>
                    <th style={{ padding: '0.6rem 0.75rem' }}>Status</th>
                    <th style={{ padding: '0.6rem 0.75rem', textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {(selectedBranch.timing_slots || []).map(slot => {
                    const isEditing = editingSlotId === slot.id;
                    const remaining = slot.remaining_seats ?? (slot.max_seats - (slot.booked_seats || 0));

                    return (
                      <tr key={slot.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                        <td style={{ padding: '0.6rem 0.75rem', fontWeight: '600', color: '#0f172a' }}>
                          {slot.school_year}
                        </td>
                        <td style={{ padding: '0.6rem 0.75rem', color: '#334155' }}>
                          {slot.day_of_week}
                        </td>
                        <td style={{ padding: '0.6rem 0.75rem', color: '#334155', fontWeight: '500' }}>
                          {slot.session_timing}
                        </td>
                        <td style={{ padding: '0.6rem 0.75rem' }}>
                          {isEditing ? (
                            <input 
                              type="number" 
                              value={editMaxSeats} 
                              onChange={e => setEditMaxSeats(parseInt(e.target.value) || 0)}
                              style={{ width: '60px', padding: '0.2rem 0.4rem', border: '1px solid #0284c7', borderRadius: '4px' }}
                            />
                          ) : (
                            <span style={{ fontWeight: '600' }}>{slot.max_seats}</span>
                          )}
                        </td>
                        <td style={{ padding: '0.6rem 0.75rem' }}>
                          <span style={{
                            color: remaining > 10 ? '#16a34a' : remaining > 0 ? '#ea580c' : '#dc2626',
                            fontWeight: '700'
                          }}>
                            {remaining} seats
                          </span>
                        </td>
                        <td style={{ padding: '0.6rem 0.75rem' }}>
                          <button 
                            onClick={() => handleUpdateSlot(slot.id, slot.max_seats, !slot.is_available)}
                            style={{
                              background: slot.is_available ? '#dcfce7' : '#fee2e2',
                              color: slot.is_available ? '#166534' : '#991b1b',
                              border: 'none',
                              padding: '0.2rem 0.5rem',
                              borderRadius: '12px',
                              fontSize: '0.75rem',
                              fontWeight: '600',
                              cursor: 'pointer'
                            }}
                          >
                            {slot.is_available ? 'Active' : 'Disabled'}
                          </button>
                        </td>
                        <td style={{ padding: '0.6rem 0.75rem', textAlign: 'right' }}>
                          <div style={{ display: 'flex', gap: '0.4rem', justifyContent: 'flex-end' }}>
                            {isEditing ? (
                              <button 
                                onClick={() => handleUpdateSlot(slot.id, editMaxSeats, slot.is_available)}
                                style={{ background: '#16a34a', color: '#fff', border: 'none', padding: '0.25rem 0.5rem', borderRadius: '4px', cursor: 'pointer' }}
                              >
                                <Check size={14} />
                              </button>
                            ) : (
                              <button 
                                onClick={() => {
                                  setEditingSlotId(slot.id);
                                  setEditMaxSeats(slot.max_seats);
                                }}
                                style={{ background: '#f1f5f9', border: 'none', padding: '0.25rem 0.5rem', borderRadius: '4px', cursor: 'pointer' }}
                              >
                                <Edit3 size={14} color="#475569" />
                              </button>
                            )}
                            <button 
                              onClick={() => handleDeleteSlot(slot.id)}
                              style={{ background: '#fee2e2', border: 'none', padding: '0.25rem 0.5rem', borderRadius: '4px', cursor: 'pointer' }}
                            >
                              <Trash2 size={14} color="#dc2626" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Modal: Add New Timing Slot */}
      {isAddSlotOpen && (
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
          <div style={{ background: '#fff', borderRadius: '12px', width: '100%', maxWidth: '480px', padding: '1.5rem', boxShadow: '0 20px 40px rgba(0,0,0,0.2)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: '700', color: '#0f172a' }}>Add New Timing Slot</h3>
              <button onClick={() => setIsAddSlotOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
                <X size={20} color="#64748b" />
              </button>
            </div>

            <form onSubmit={handleAddSlot} style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', marginBottom: '0.25rem' }}>Select Centre / Branch *</label>
                <select 
                  value={newSlot.centre_id} 
                  onChange={e => setNewSlot({ ...newSlot, centre_id: e.target.value })}
                  style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', border: '1px solid #cbd5e1' }}
                  required
                >
                  <option value="">-- Choose Centre --</option>
                  {branches.map(b => (
                    <option key={b.id} value={b.id}>{b.centre_name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', marginBottom: '0.25rem' }}>School Year *</label>
                <select 
                  value={newSlot.school_year} 
                  onChange={e => setNewSlot({ ...newSlot, school_year: e.target.value })}
                  style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', border: '1px solid #cbd5e1' }}
                >
                  <option value="Year 2">Year 2</option>
                  <option value="Year 3">Year 3</option>
                  <option value="Year 4">Year 4</option>
                  <option value="Year 5">Year 5</option>
                  <option value="Year 6">Year 6</option>
                  <option value="Year 7">Year 7</option>
                  <option value="GCSE">GCSE</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', marginBottom: '0.25rem' }}>Day of Week *</label>
                <select 
                  value={newSlot.day_of_week} 
                  onChange={e => setNewSlot({ ...newSlot, day_of_week: e.target.value })}
                  style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', border: '1px solid #cbd5e1' }}
                >
                  <option value="Saturday">Saturday</option>
                  <option value="Sunday">Sunday</option>
                  <option value="Weekday Evening">Weekday Evening (Mon - Thu)</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', marginBottom: '0.25rem' }}>Session Timing Label *</label>
                <input 
                  type="text" 
                  value={newSlot.session_timing} 
                  onChange={e => setNewSlot({ ...newSlot, session_timing: e.target.value })}
                  placeholder="e.g. 09:00 to 12:30 or 14:00 to 17:00"
                  style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', border: '1px solid #cbd5e1' }}
                  required
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', marginBottom: '0.25rem' }}>Max Capacity (Seats) *</label>
                <input 
                  type="number" 
                  value={newSlot.max_seats} 
                  onChange={e => setNewSlot({ ...newSlot, max_seats: parseInt(e.target.value) || 0 })}
                  style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', border: '1px solid #cbd5e1' }}
                  required
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '0.5rem' }}>
                <button 
                  type="button" 
                  onClick={() => setIsAddSlotOpen(false)}
                  style={{ padding: '0.5rem 1rem', borderRadius: '6px', border: '1px solid #cbd5e1', background: '#fff', cursor: 'pointer' }}
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  style={{ padding: '0.5rem 1.2rem', borderRadius: '6px', border: 'none', background: '#0284c7', color: '#fff', fontWeight: '600', cursor: 'pointer' }}
                >
                  Save Timing Slot
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
