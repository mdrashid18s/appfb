import React, { useState, useEffect } from 'react';
import { 
  Mail, 
  Send, 
  Search, 
  MessageSquare, 
  User, 
  Phone, 
  CheckCircle2, 
  Clock, 
  Filter, 
  Reply, 
  Sparkles,
  Building2
} from 'lucide-react';
import { useToast } from '../contexts/ToastContext';

export default function AdminParentMessagesView() {
  const toast = useToast();
  const [enquiries, setEnquiries] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filterBranch, setFilterBranch] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedEnquiry, setSelectedEnquiry] = useState(null);

  // Reply State
  const [replyText, setReplyText] = useState('');
  const [isSendingReply, setIsSendingReply] = useState(false);

  // Direct Compose Message Modal
  const [isComposeOpen, setIsComposeOpen] = useState(false);
  const [composeForm, setComposeForm] = useState({
    recipient_email: '',
    recipient_name: '',
    subject: '',
    message: '',
    type: 'announcement'
  });

  useEffect(() => {
    fetchEnquiries();
  }, [filterBranch, filterStatus]);

  const fetchEnquiries = async () => {
    setLoading(true);
    try {
      const query = new URLSearchParams();
      if (filterBranch !== 'all') query.append('branch', filterBranch);
      if (filterStatus !== 'all') query.append('status', filterStatus);

      const res = await fetch(`/api/admin/enquiries?${query.toString()}`);
      const data = await res.json();
      if (data.success && Array.isArray(data.enquiries)) {
        setEnquiries(data.enquiries);
        if (data.enquiries.length > 0 && !selectedEnquiry) {
          setSelectedEnquiry(data.enquiries[0]);
        }
      }
    } catch (err) {
      console.error(err);
      toast.error('Failed to load parent enquiries');
    }
    setLoading(false);
  };

  const handleSendReply = async (e) => {
    e.preventDefault();
    if (!selectedEnquiry || !replyText.trim()) return;

    setIsSendingReply(true);
    try {
      const res = await fetch(`/api/admin/enquiries/${selectedEnquiry.id}/reply`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reply: replyText })
      });
      const data = await res.json();
      if (data.success) {
        toast.success('Reply recorded and dispatched to parent!');
        setReplyText('');
        fetchEnquiries();
        setSelectedEnquiry(prev => ({ ...prev, status: 'replied', admin_reply: replyText }));
      } else {
        toast.error(data.message || 'Failed to send reply');
      }
    } catch (err) {
      console.error(err);
      toast.error('Network error sending reply');
    }
    setIsSendingReply(false);
  };

  const handleDirectCompose = async (e) => {
    e.preventDefault();
    if (!composeForm.recipient_email || !composeForm.subject || !composeForm.message) {
      toast.error('Please fill in all required message fields');
      return;
    }

    try {
      const res = await fetch('/api/admin/parent-messages/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(composeForm)
      });
      const data = await res.json();
      if (data.success) {
        toast.success('Direct message sent to parent successfully!');
        setIsComposeOpen(false);
        setComposeForm({
          recipient_email: '',
          recipient_name: '',
          subject: '',
          message: '',
          type: 'announcement'
        });
      } else {
        toast.error(data.message || 'Error sending message');
      }
    } catch (err) {
      console.error(err);
      toast.error('Failed to send parent message');
    }
  };

  const filteredEnquiries = enquiries.filter(enq => {
    const term = searchTerm.toLowerCase();
    return (
      (enq.parent_name && enq.parent_name.toLowerCase().includes(term)) ||
      (enq.email && enq.email.toLowerCase().includes(term)) ||
      (enq.message && enq.message.toLowerCase().includes(term)) ||
      (enq.branch && enq.branch.toLowerCase().includes(term))
    );
  });

  return (
    <div style={{ padding: '1.5rem', background: '#f8fafc', minHeight: '100vh' }}>
      {/* Header Bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: '700', color: '#0f172a', margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <MessageSquare size={24} color="#6366f1" />
            Parent Messages & Enquiries Hub
          </h1>
          <p style={{ color: '#64748b', margin: '0.25rem 0 0', fontSize: '0.9rem' }}>
            Manage parent enquiries, franchise inquiries, branch requests, and dispatch direct notifications.
          </p>
        </div>

        <button 
          onClick={() => setIsComposeOpen(true)}
          style={{
            background: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)',
            color: '#fff',
            border: 'none',
            padding: '0.6rem 1.2rem',
            borderRadius: '8px',
            fontWeight: '600',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '0.4rem',
            boxShadow: '0 4px 12px rgba(99,102,241,0.25)'
          }}
        >
          <Send size={18} /> Compose Direct Message to Parent
        </button>
      </div>

      {/* Filter Row */}
      <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.25rem', flexWrap: 'wrap' }}>
        <div style={{ flex: '1 1 240px', position: 'relative' }}>
          <Search size={16} color="#94a3b8" style={{ position: 'absolute', left: '12px', top: '12px' }} />
          <input 
            type="text" 
            placeholder="Search parent name, email, or content..." 
            value={searchTerm} 
            onChange={e => setSearchTerm(e.target.value)}
            style={{ width: '100%', padding: '0.6rem 0.8rem 0.6rem 2.2rem', border: '1px solid #cbd5e1', borderRadius: '8px', fontSize: '0.9rem' }}
          />
        </div>

        <select 
          value={filterBranch} 
          onChange={e => setFilterBranch(e.target.value)}
          style={{ padding: '0.6rem 1rem', border: '1px solid #cbd5e1', borderRadius: '8px', fontSize: '0.9rem', background: '#fff' }}
        >
          <option value="all">All Branches</option>
          <option value="Reading">Reading</option>
          <option value="Sutton">Sutton</option>
          <option value="Langley">Langley</option>
          <option value="Basingstoke">Basingstoke</option>
          <option value="Manchester">Manchester (Franchise)</option>
        </select>

        <select 
          value={filterStatus} 
          onChange={e => setFilterStatus(e.target.value)}
          style={{ padding: '0.6rem 1rem', border: '1px solid #cbd5e1', borderRadius: '8px', fontSize: '0.9rem', background: '#fff' }}
        >
          <option value="all">All Statuses</option>
          <option value="new">New / Unread</option>
          <option value="in_progress">In Progress</option>
          <option value="replied">Replied</option>
        </select>
      </div>

      {/* 2-Column Split View: Messages List + Detailed Thread / Reply Pane */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '1.5rem' }}>
        {/* Left Col: Messages List */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', maxHeight: '75vh', overflowY: 'auto' }}>
          {filteredEnquiries.length === 0 ? (
            <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '2rem', textAlign: 'center', color: '#64748b' }}>
              <Mail size={32} color="#cbd5e1" style={{ margin: '0 auto 0.5rem' }} />
              <p style={{ margin: 0, fontWeight: '500' }}>No parent messages matching your filter.</p>
            </div>
          ) : (
            filteredEnquiries.map(enq => {
              const isSelected = selectedEnquiry && selectedEnquiry.id === enq.id;
              const isReplied = enq.status === 'replied';

              return (
                <div 
                  key={enq.id}
                  onClick={() => setSelectedEnquiry(enq)}
                  style={{
                    background: '#fff',
                    border: isSelected ? '2px solid #6366f1' : '1px solid #e2e8f0',
                    borderRadius: '10px',
                    padding: '1rem',
                    cursor: 'pointer',
                    boxShadow: isSelected ? '0 4px 16px rgba(99,102,241,0.1)' : 'none',
                    transition: 'all 0.15s'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.35rem' }}>
                    <span style={{ fontWeight: '700', color: '#0f172a', fontSize: '0.95rem' }}>
                      {enq.parent_name}
                    </span>
                    <span style={{
                      fontSize: '0.72rem',
                      fontWeight: '700',
                      padding: '0.15rem 0.5rem',
                      borderRadius: '12px',
                      background: isReplied ? '#dcfce7' : '#fef3c7',
                      color: isReplied ? '#166534' : '#92400e'
                    }}>
                      {isReplied ? 'Replied' : 'New'}
                    </span>
                  </div>

                  <div style={{ fontSize: '0.82rem', color: '#64748b', display: 'flex', gap: '0.75rem', marginBottom: '0.5rem' }}>
                    <span>📍 {enq.branch || 'General'}</span>
                    <span>👶 {enq.child_year || 'N/A'}</span>
                  </div>

                  <p style={{
                    margin: 0,
                    fontSize: '0.85rem',
                    color: '#334155',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    display: '-webkit-box',
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical'
                  }}>
                    {enq.message}
                  </p>
                </div>
              );
            })
          )}
        </div>

        {/* Right Col: Conversation Detail & Reply Composer */}
        {selectedEnquiry ? (
          <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '1.5rem', display: 'flex', flexDirection: 'column' }}>
            <div style={{ borderBottom: '1px solid #f1f5f9', paddingBottom: '1rem', marginBottom: '1rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                <h2 style={{ fontSize: '1.25rem', fontWeight: '700', color: '#0f172a', margin: 0 }}>
                  {selectedEnquiry.parent_name}
                </h2>
                <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>
                  {new Date(selectedEnquiry.created_at).toLocaleString()}
                </span>
              </div>

              <div style={{ display: 'flex', gap: '1.25rem', fontSize: '0.85rem', color: '#475569', flexWrap: 'wrap' }}>
                <div>📧 <strong>{selectedEnquiry.email}</strong></div>
                {selectedEnquiry.phone && <div>📞 <strong>{selectedEnquiry.phone}</strong></div>}
                <div>📍 Branch: <strong>{selectedEnquiry.branch}</strong></div>
                {selectedEnquiry.child_year && <div>🎒 Year: <strong>{selectedEnquiry.child_year}</strong></div>}
              </div>
            </div>

            {/* Parent Message Body */}
            <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '1rem', marginBottom: '1.25rem' }}>
              <div style={{ fontSize: '0.78rem', fontWeight: '700', color: '#64748b', textTransform: 'uppercase', marginBottom: '0.4rem' }}>
                Parent Message Content
              </div>
              <p style={{ margin: 0, color: '#1e293b', fontSize: '0.95rem', lineHeight: '1.5', whiteSpace: 'pre-wrap' }}>
                {selectedEnquiry.message}
              </p>
            </div>

            {/* Previous Admin Reply if exists */}
            {selectedEnquiry.admin_reply && (
              <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '8px', padding: '1rem', marginBottom: '1.25rem' }}>
                <div style={{ fontSize: '0.78rem', fontWeight: '700', color: '#166534', textTransform: 'uppercase', marginBottom: '0.4rem' }}>
                  Admin Sent Reply
                </div>
                <p style={{ margin: 0, color: '#14532d', fontSize: '0.9rem', lineHeight: '1.5' }}>
                  {selectedEnquiry.admin_reply}
                </p>
              </div>
            )}

            {/* Reply Input Box */}
            <form onSubmit={handleSendReply} style={{ marginTop: 'auto', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <label style={{ fontSize: '0.85rem', fontWeight: '600', color: '#334155' }}>
                Send Official Response / Reply Email:
              </label>
              <textarea 
                rows="4"
                value={replyText}
                onChange={e => setReplyText(e.target.value)}
                placeholder="Type your response here to notify the parent..."
                style={{ width: '100%', padding: '0.75rem', border: '1px solid #cbd5e1', borderRadius: '8px', fontSize: '0.9rem', resize: 'vertical' }}
                required
              />
              <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                <button 
                  type="submit"
                  disabled={isSendingReply}
                  style={{
                    background: '#6366f1',
                    color: '#fff',
                    border: 'none',
                    padding: '0.6rem 1.25rem',
                    borderRadius: '8px',
                    fontWeight: '600',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.4rem'
                  }}
                >
                  <Send size={16} /> {isSendingReply ? 'Sending...' : 'Send Reply to Parent'}
                </button>
              </div>
            </form>
          </div>
        ) : (
          <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '3rem', textAlign: 'center', color: '#94a3b8' }}>
            Select a parent message from the left to view details and reply.
          </div>
        )}
      </div>

      {/* Compose Direct Message Modal */}
      {isComposeOpen && (
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
          <div style={{ background: '#fff', borderRadius: '12px', width: '100%', maxWidth: '520px', padding: '1.5rem', boxShadow: '0 20px 40px rgba(0,0,0,0.2)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: '700', color: '#0f172a' }}>Compose Message to Parent</h3>
              <button onClick={() => setIsComposeOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
                ✕
              </button>
            </div>

            <form onSubmit={handleDirectCompose} style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', marginBottom: '0.25rem' }}>Recipient Parent Email *</label>
                <input 
                  type="email" 
                  value={composeForm.recipient_email} 
                  onChange={e => setComposeForm({ ...composeForm, recipient_email: e.target.value })}
                  placeholder="parent@example.com"
                  style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', border: '1px solid #cbd5e1' }}
                  required
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', marginBottom: '0.25rem' }}>Parent Name (Optional)</label>
                <input 
                  type="text" 
                  value={composeForm.recipient_name} 
                  onChange={e => setComposeForm({ ...composeForm, recipient_name: e.target.value })}
                  placeholder="e.g. John Doe"
                  style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', border: '1px solid #cbd5e1' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', marginBottom: '0.25rem' }}>Subject *</label>
                <input 
                  type="text" 
                  value={composeForm.subject} 
                  onChange={e => setComposeForm({ ...composeForm, subject: e.target.value })}
                  placeholder="e.g. Year 5 Class Schedule Update"
                  style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', border: '1px solid #cbd5e1' }}
                  required
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', marginBottom: '0.25rem' }}>Message Body *</label>
                <textarea 
                  rows="4"
                  value={composeForm.message} 
                  onChange={e => setComposeForm({ ...composeForm, message: e.target.value })}
                  placeholder="Type your message to the parent here..."
                  style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', border: '1px solid #cbd5e1' }}
                  required
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '0.5rem' }}>
                <button 
                  type="button" 
                  onClick={() => setIsComposeOpen(false)}
                  style={{ padding: '0.5rem 1rem', borderRadius: '6px', border: '1px solid #cbd5e1', background: '#fff', cursor: 'pointer' }}
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  style={{ padding: '0.5rem 1.2rem', borderRadius: '6px', border: 'none', background: '#6366f1', color: '#fff', fontWeight: '600', cursor: 'pointer' }}
                >
                  Send Message
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
