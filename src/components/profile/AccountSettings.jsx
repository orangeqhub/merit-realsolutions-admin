import { useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { FiShield } from 'react-icons/fi';
import { getProfileAvatarUrl } from '../../utils/profileUtils';
import './profile-settings.css';

function StatusBadge({ label }) {
  return <span className="portal-badge portal-badge--default">{label}</span>;
}

const EMPTY_FORM = {
  name: '',
  email: '',
  mobile: '',
  alternateMobile: '',
  dateOfBirth: '',
  gender: '',
  occupation: '',
  bio: '',
  emergencyContact: '',
  houseNumber: '',
  street: '',
  locality: '',
  city: '',
  district: '',
  state: '',
  country: 'India',
  pincode: '',
  address: '',
};

function buildForm(profile = {}) {
  return {
    ...EMPTY_FORM,
    name: profile.name || '',
    email: profile.email || '',
    mobile: profile.mobile || '',
    alternateMobile: profile.alternateMobile || '',
    dateOfBirth: profile.dateOfBirth || '',
    gender: profile.gender || '',
    occupation: profile.occupation || '',
    bio: profile.bio || '',
    emergencyContact: profile.emergencyContact || '',
    houseNumber: profile.houseNumber || '',
    street: profile.street || '',
    locality: profile.locality || '',
    city: profile.city || '',
    district: profile.district || '',
    state: profile.state || '',
    country: profile.country || 'India',
    pincode: profile.pincode || '',
    address: profile.address || '',
  };
}

function validateForm(form) {
  if (!form.name.trim()) return 'Full name is required.';
  if (form.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) return 'Enter a valid email address.';
  if (form.mobile && !/^[6-9]\d{9}$/.test(form.mobile)) return 'Mobile must be a valid 10-digit number.';
  if (form.alternateMobile && !/^[6-9]\d{9}$/.test(form.alternateMobile)) return 'Alternate mobile must be a valid 10-digit number.';
  if (form.pincode && !/^\d{6}$/.test(form.pincode)) return 'Pincode must be 6 digits.';
  return '';
}

async function cropImageToSquare(file) {
  const imageUrl = URL.createObjectURL(file);
  try {
    const image = await new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = reject;
      img.src = imageUrl;
    });
    const size = Math.min(image.width, image.height);
    const sx = (image.width - size) / 2;
    const sy = (image.height - size) / 2;
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(image, sx, sy, size, size, 0, 0, 512, 512);
    const blob = await new Promise((resolve) => canvas.toBlob(resolve, 'image/jpeg', 0.92));
    return new File([blob], file.name.replace(/\.\w+$/, '.jpg') || 'profile.jpg', { type: 'image/jpeg' });
  } finally {
    URL.revokeObjectURL(imageUrl);
  }
}

function Field({ label, value, name, editing, onChange, type = 'text', readOnly = false, options }) {
  return (
    <div className={`profile-settings-field ${readOnly ? 'profile-settings-field--readonly' : ''}`}>
      <label htmlFor={name}>{label}</label>
      {readOnly || !editing ? (
        <div className="profile-settings-readonly">{value || '—'}</div>
      ) : options ? (
        <select id={name} name={name} value={value} onChange={onChange}>
          {options.map((option) => (
            <option key={option.value || 'empty'} value={option.value}>{option.label}</option>
          ))}
        </select>
      ) : (
        <input id={name} name={name} type={type} value={value} onChange={onChange} />
      )}
    </div>
  );
}

export default function AccountSettings({
  changePasswordPath,
  extraContent = null,
  loadProfile,
  updateProfile,
  uploadPhoto,
  deletePhoto,
}) {
  const [profile, setProfile] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [photoUploading, setPhotoUploading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const fileInputRef = useRef(null);

  const load = loadProfile || (async () => { throw new Error('Profile loader not configured.'); });
  const saveProfile = updateProfile || load;
  const upload = uploadPhoto || (async () => { throw new Error('Photo upload not configured.'); });
  const removePhoto = deletePhoto || (async () => { throw new Error('Photo removal not configured.'); });

  const loadProfileData = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await load();
      setProfile(data);
      setForm(buildForm(data));
    } catch (err) {
      setError(err.message || 'Failed to load profile.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProfileData();
  }, [loadProfile]);

  const avatarUrl = useMemo(() => getProfileAvatarUrl(profile), [profile]);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  };

  const handleSave = async () => {
    const validationError = validateForm(form);
    if (validationError) {
      setError(validationError);
      return;
    }
    setSaving(true);
    setError('');
    setMessage('');
    try {
      const data = await saveProfile(form);
      setProfile(data);
      setForm(buildForm(data));
      setEditing(false);
      setMessage('Profile updated successfully.');
    } catch (err) {
      setError(err.message || 'Failed to update profile.');
    } finally {
      setSaving(false);
    }
  };

  const handlePhotoSelect = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!['image/jpeg', 'image/jpg', 'image/png', 'image/webp'].includes(file.type)) {
      setError('Allowed formats: JPG, PNG, WEBP.');
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      setError('Profile photo must be 2 MB or smaller.');
      return;
    }
    setPhotoUploading(true);
    setError('');
    setMessage('');
    try {
      const cropped = await cropImageToSquare(file);
      const data = await upload(cropped);
      setProfile(data);
      setForm(buildForm(data));
      setMessage('Profile photo updated successfully.');
    } catch (err) {
      setError(err.message || 'Failed to upload profile photo.');
    } finally {
      setPhotoUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handlePhotoRemove = async () => {
    setPhotoUploading(true);
    setError('');
    setMessage('');
    try {
      const data = await removePhoto();
      setProfile(data);
      setMessage('Profile photo removed successfully.');
    } catch (err) {
      setError(err.message || 'Failed to remove profile photo.');
    } finally {
      setPhotoUploading(false);
    }
  };

  if (loading) return <p>Loading account settings…</p>;
  if (!profile) return <p>{error || 'Profile unavailable.'}</p>;

  return (
    <div className="profile-settings-page">
      <div className="profile-settings-header">
        <div>
          <h2 className="portal-management-page__title">Account Settings</h2>
          <p style={{ color: 'var(--color-gray-500)', margin: 0 }}>Manage your personal information, address, and security settings.</p>
        </div>
        <div className="profile-settings-header__actions">
          {!editing ? (
            <button type="button" className="btn btn--primary" onClick={() => setEditing(true)}>Edit Profile</button>
          ) : (
            <>
              <button type="button" className="btn btn--outline" onClick={() => { setEditing(false); setForm(buildForm(profile)); setError(''); }} disabled={saving}>Cancel</button>
              <button type="button" className="btn btn--primary" onClick={handleSave} disabled={saving}>{saving ? 'Saving…' : 'Save Changes'}</button>
            </>
          )}
        </div>
      </div>

      {message ? <div className="profile-settings-alert">{message}</div> : null}
      {error ? <div className="profile-settings-alert profile-settings-alert--error">{error}</div> : null}

      <div className="profile-settings-cover">
        <div className="profile-settings-cover__content">
          <div className="profile-settings-avatar-wrap">
            <img src={avatarUrl} alt={profile.name} className="profile-settings-avatar" />
            <div className="profile-settings-avatar-actions">
              <button type="button" className="btn btn--outline btn--sm" onClick={() => fileInputRef.current?.click()} disabled={photoUploading}>
                {photoUploading ? 'Uploading…' : 'Change Photo'}
              </button>
              {profile.profilePhoto ? (
                <button type="button" className="btn btn--outline btn--sm" onClick={handlePhotoRemove} disabled={photoUploading}>Remove</button>
              ) : null}
              <input ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/webp" hidden onChange={handlePhotoSelect} />
            </div>
          </div>
          <div className="profile-settings-identity">
            <h2>{profile.name}</h2>
            <div className="profile-settings-badges">
              <StatusBadge label={profile.roleLabel || profile.role} />
              <StatusBadge label={profile.status} />
            </div>
            <p style={{ margin: '0.5rem 0 0', opacity: 0.85 }}>{profile.displayId} · {profile.username}</p>
          </div>
        </div>
      </div>

      {extraContent}

      <div className="portal-card">
        <div className="portal-card__header"><h3 className="portal-card__title">Profile Information</h3></div>
        <div className="portal-card__body profile-settings-section">
          <div className="profile-settings-grid profile-settings-grid--3">
            <Field label="Full Name" name="name" value={form.name} editing={editing} onChange={handleChange} />
            <Field label="Email Address" name="email" value={form.email} editing={editing} onChange={handleChange} type="email" />
            <Field label="Mobile" name="mobile" value={form.mobile} editing={editing} onChange={handleChange} />
            <Field label="Alternate Mobile" name="alternateMobile" value={form.alternateMobile} editing={editing} onChange={handleChange} />
            <Field label="Date of Birth" name="dateOfBirth" value={form.dateOfBirth} editing={editing} onChange={handleChange} type="date" />
            <Field label="Gender" name="gender" value={form.gender} editing={editing} onChange={handleChange} options={[
              { value: '', label: 'Select gender' },
              { value: 'Male', label: 'Male' },
              { value: 'Female', label: 'Female' },
              { value: 'Other', label: 'Other' },
            ]}
            />
            <Field label="Occupation" name="occupation" value={form.occupation} editing={editing} onChange={handleChange} />
            <Field label="Emergency Contact" name="emergencyContact" value={form.emergencyContact} editing={editing} onChange={handleChange} />
          </div>
          <div className="profile-settings-field">
            <label htmlFor="bio">Bio (Optional)</label>
            {editing ? (
              <textarea id="bio" className="portal-input" name="bio" rows={3} value={form.bio} onChange={handleChange} />
            ) : (
              <div className="profile-settings-readonly">{form.bio || '—'}</div>
            )}
          </div>
        </div>
      </div>

      <div className="portal-card">
        <div className="portal-card__header"><h3 className="portal-card__title">Address Details</h3></div>
        <div className="portal-card__body profile-settings-section">
          <div className="profile-settings-grid profile-settings-grid--3">
            <Field label="House Number" name="houseNumber" value={form.houseNumber} editing={editing} onChange={handleChange} />
            <Field label="Street" name="street" value={form.street} editing={editing} onChange={handleChange} />
            <Field label="Area / Locality" name="locality" value={form.locality} editing={editing} onChange={handleChange} />
            <Field label="City" name="city" value={form.city} editing={editing} onChange={handleChange} />
            <Field label="District" name="district" value={form.district} editing={editing} onChange={handleChange} />
            <Field label="State" name="state" value={form.state} editing={editing} onChange={handleChange} />
            <Field label="Country" name="country" value={form.country} editing={editing} onChange={handleChange} />
            <Field label="Pincode" name="pincode" value={form.pincode} editing={editing} onChange={handleChange} />
          </div>
          <Field label="Full Address" name="address" value={form.address} editing={editing} onChange={handleChange} />
        </div>
      </div>

      <div className="portal-grid-2-1">
        <div className="portal-card">
          <div className="portal-card__header"><h3 className="portal-card__title">Account Information</h3></div>
          <div className="portal-card__body profile-settings-grid">
            <Field label="Customer / Employee ID" value={profile.displayId} readOnly />
            <Field label="Username" value={profile.username} readOnly />
            <Field label="Role" value={profile.roleLabel || profile.role} readOnly />
            <Field label="Member Since" value={profile.createdAt ? new Date(profile.createdAt).toLocaleDateString('en-IN') : '—'} readOnly />
            <Field label="Created By" value={profile.createdByName || '—'} readOnly />
            <Field label="Assigned Area" value={profile.assignedArea || '—'} readOnly />
            <Field label="Last Login" value={profile.lastLoginAt ? new Date(profile.lastLoginAt).toLocaleString('en-IN') : '—'} readOnly />
          </div>
        </div>

        <div className="portal-card">
          <div className="portal-card__header"><h3 className="portal-card__title">Security</h3><FiShield /></div>
          <div className="portal-card__body profile-settings-section">
            <Field label="Account Status" value={profile.status} readOnly />
            <Field label="Password Last Changed" value={profile.passwordChangedAt ? new Date(profile.passwordChangedAt).toLocaleString('en-IN') : '—'} readOnly />
            <Field label="Two-factor Authentication" value="Coming soon" readOnly />
            <Link to={changePasswordPath} className="btn btn--outline">Change Password</Link>
          </div>
        </div>
      </div>

      <div className="portal-card">
        <div className="portal-card__header"><h3 className="portal-card__title">Activity Information</h3></div>
        <div className="portal-card__body">
          {(profile.activity || []).length === 0 ? (
            <p style={{ color: 'var(--color-gray-500)' }}>No recent profile activity recorded.</p>
          ) : (
            <ul className="profile-activity-list">
              {profile.activity.map((item) => (
                <li key={item.id}>
                  <strong>{item.action.replace(/_/g, ' ')}</strong>
                  <div style={{ color: 'var(--color-gray-500)', fontSize: '0.875rem' }}>
                    {new Date(item.createdAt).toLocaleString('en-IN')}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
