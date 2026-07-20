import AccountSettings from '../../components/profile/AccountSettings';
import {
  deleteAdminProfilePhoto,
  fetchAdminProfile,
  updateAdminProfile,
  uploadAdminProfilePhoto,
} from '../../services/auth/authApi';
import { getAuthToken } from '../../services/auth/authStorage';

export default function AdminProfile() {
  return (
    <AccountSettings
      changePasswordPath="/dashboard/security/change-password"
      loadProfile={() => fetchAdminProfile(getAuthToken())}
      updateProfile={updateAdminProfile}
      uploadPhoto={uploadAdminProfilePhoto}
      deletePhoto={deleteAdminProfilePhoto}
    />
  );
}
