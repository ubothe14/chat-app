import { useState } from 'react'
import { userAPI, type User } from '../services/api_service'


interface CompleteProfileModalProps {
  userId: string
  onComplete: (updatedData: Partial<User>) => void
}

function Field({ label, type, value, onChange, placeholder, options }: {
  label: string; type: string; value: string
  onChange: (v: string) => void; placeholder?: string
  options?: string[]
}) {
  const [focused, setFocused] = useState(false)

  if (type === 'select') {
    return (
      <div style={{ marginBottom: '16px' }}>
        <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#0f172a', marginBottom: '6px' }}>
          {label}
        </label>
        <div style={{
          position: 'relative',
          borderRadius: '8px',
          border: `1px solid ${focused ? '#0f74ff' : '#cbd5e1'}`,
          backgroundColor: '#f8fafc',
          transition: 'all 0.2s',
          padding: '0 12px',
          height: '44px',
          display: 'flex',
          alignItems: 'center',
          boxShadow: focused ? '0 0 0 3px rgba(15,116,255,0.1)' : 'none'
        }}>
          <select
            value={value}
            onChange={e => onChange(e.target.value)}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            style={{ width: '100%', background: 'transparent', border: 'none', outline: 'none', fontSize: '14.5px', color: '#0f172a', appearance: 'none', cursor: 'pointer' }}
          >
            {options?.map(opt => <option key={opt} value={opt}>{opt}</option>)}
          </select>
          <svg style={{ position: 'absolute', right: '12px', pointerEvents: 'none' }} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6" /></svg>
        </div>
      </div>
    )
  }

  return (
    <div style={{ marginBottom: '16px' }}>
      <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#0f172a', marginBottom: '6px' }}>
        {label}
      </label>
      <div style={{
        borderRadius: '8px',
        border: `1px solid ${focused ? '#0f74ff' : '#cbd5e1'}`,
        backgroundColor: '#f8fafc',
        transition: 'all 0.2s',
        padding: '0 12px',
        height: '44px',
        display: 'flex',
        alignItems: 'center',
        boxShadow: focused ? '0 0 0 3px rgba(15,116,255,0.1)' : 'none'
      }}>
        <input
          type={type}
          value={value}
          onChange={e => onChange(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          placeholder={placeholder}
          style={{ width: '100%', background: 'transparent', border: 'none', outline: 'none', fontSize: '14.5px', color: '#0f172a' }}
        />
      </div>
    </div>
  )
}

export default function CompleteProfileModal({ userId, onComplete }: CompleteProfileModalProps) {
  const [phone, setPhone] = useState('')
  const [experience, setExperience] = useState('')
  const [targetExam, setTargetExam] = useState('All')
  const [documentFile, setDocumentFile] = useState<File | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!phone.trim()) {
      setError('Please provide a mobile number.')
      return
    }

    setIsLoading(true)
    setError(null)
    
    try {
      // 1. Update Profile (phone, experience, targetExam)
      await userAPI.updateProfile(userId, {
        phone,
        experience,
        targetExam
      })

      // 2. Immediate verification trigger if they uploaded a document
      let newVerificationStatus: 'verified' | 'pending' | 'unverified' = 'unverified'
      
      if (documentFile) {
        const formData = new FormData()
        formData.append('document', documentFile)
        await userAPI.requestVerification(userId, formData)
        newVerificationStatus = 'verified'
      }

      onComplete({
        phone,
        experience,
        targetExam,
        verificationStatus: newVerificationStatus
      })

    } catch (err: any) {
      console.error(err)
      setError(err.message || 'Failed to update profile.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      backgroundColor: 'rgba(15, 23, 42, 0.4)',
      backdropFilter: 'blur(4px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '24px',
      zIndex: 9999
    }}>
      <div className="profile-modal" style={{
        background: '#ffffff',
        borderRadius: '24px',
        width: '100%',
        maxWidth: '480px',
        boxShadow: '0 24px 48px rgba(15, 23, 42, 0.2)',
        overflow: 'hidden',
        animation: 'slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
        padding: '32px'
      }}>
        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
          <div style={{
            width: '48px',
            height: '48px',
            borderRadius: '50%',
            background: '#e0e7ff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 16px'
          }}>
            <svg viewBox="0 0 24 24" width="24" height="24" fill="#4f46e5">
              <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
            </svg>
          </div>
          <h2 style={{ margin: 0, fontSize: '24px', fontWeight: 800, color: '#0f172a', letterSpacing: '-0.5px' }}>Almost there!</h2>
          <p style={{ margin: '8px 0 0 0', fontSize: '14.5px', color: '#64748b', lineHeight: '22px' }}>
            To finish setting up your account, please provide a few more details so we can verify you.
          </p>
        </div>

        {error && (
          <div style={{ background: '#fef2f2', borderLeft: '4px solid #ef4444', padding: '12px', borderRadius: '4px', marginBottom: '20px' }}>
            <p style={{ margin: 0, color: '#b91c1c', fontSize: '13px', fontWeight: 500 }}>{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <Field
            label="Mobile Number"
            type="tel"
            value={phone}
            onChange={setPhone}
            placeholder="+1 234 567 890"
          />
          <Field
            label="Experience (Optional)"
            type="text"
            value={experience}
            onChange={setExperience}
            placeholder="e.g. 2 years, Fresher, etc."
          />
          <Field
            label="Target Exam"
            type="select"
            value={targetExam}
            onChange={setTargetExam}
            options={['All', 'CAT', 'SNAP', 'HSR and related']}
          />
          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#0f172a', marginBottom: '6px' }}>
              Govt ID Document Upload (Optional)
            </label>
            <div style={{
              borderRadius: '8px',
              border: `1px solid #cbd5e1`,
              backgroundColor: '#f8fafc',
              padding: '8px 12px',
              height: 'auto',
              minHeight: '44px',
              display: 'flex',
              alignItems: 'center',
            }}>
              <input
                type="file"
                accept="image/*,.pdf"
                onChange={e => setDocumentFile(e.target.files?.[0] || null)}
                style={{ width: '100%', fontSize: '13px', color: '#64748b' }}
              />
            </div>
          </div>

          <p style={{ margin: '0 0 24px 0', fontSize: '12px', color: '#94a3b8' }}>
            Uploading an ID (PDF or Image) will immediately verify your account!
          </p>

          <button
            type="submit"
            disabled={isLoading}
            style={{
              width: '100%',
              height: '48px',
              background: isLoading ? '#94a3b8' : '#0f74ff',
              color: 'white',
              border: 'none',
              borderRadius: '24px',
              fontSize: '15px',
              fontWeight: 600,
              cursor: isLoading ? 'not-allowed' : 'pointer',
              transition: 'background 0.2s',
            }}
          >
            {isLoading ? 'Saving...' : 'Complete Profile'}
          </button>
        </form>
      </div>

      <style>
        {`
          @keyframes slideUp {
            from { opacity: 0; transform: translateY(20px); }
            to { opacity: 1; transform: translateY(0); }
          }
          @media (max-width: 640px) {
            .profile-modal {
              padding: 24px !important;
              max-width: 100% !important;
              border-radius: 20px !important;
            }
            .profile-modal h2 {
              font-size: 20px !important;
            }
            .profile-modal p {
              font-size: 13px !important;
            }
          }
        `}
      </style>
    </div>
  )
}
