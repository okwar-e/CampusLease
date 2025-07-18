import React, { useEffect, useState } from 'react';
import axios from 'axios';
import './profiles.css';

const Profile = () => {
  const [profile, setProfile] = useState(null);
  const [error, setError] = useState('');
  const [selfieFile, setSelfieFile] = useState(null);
  const [idCardFile, setIdCardFile] = useState(null);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await axios.get("http://localhost:5050/student/profile", {
          withCredentials: true
        });
        setProfile(res.data);
      } catch (err) {
        console.error(err);
        setError("Failed to load profile.");
      }
    };

    fetchProfile();
  }, []);

  const handleUpdate = async () => {
    try {
      const formData = new FormData();
      formData.append("full_name", profile.full_name || '');
      formData.append("phone", profile.phone || '');
      if (selfieFile) formData.append("selfie", selfieFile);
      if (idCardFile) formData.append("id_card", idCardFile);

      await axios.put("http://localhost:5050/student/profile", formData, {
        withCredentials: true,
        headers: { "Content-Type": "multipart/form-data" }
      });

      alert("Profile updated successfully");
    } catch (err) {
      console.error("Profile update error:", err);
      alert("Failed to update profile");
    }
  };

  return (
    <div className="profile-container">
      <h2>My Profile</h2>

      {error && <p className="error-text">{error}</p>}

      {profile ? (
        <div className="profile-form">
          <label>Full Name:</label>
          <input
            type="text"
            value={profile.full_name || ''}
            onChange={(e) => setProfile({ ...profile, full_name: e.target.value })}
          />

          <label>School Email:</label>
          <input
            type="text"
            value={profile.school_email || ''}
            readOnly
          />

          <label>Phone Number:</label>
          <input
            type="tel"
            value={profile.phone || ''}
            onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
          />



  <button className="save-button" onClick={handleUpdate}>
          Save Changes
        </button>        </div>
      ) : (
        <p>Loading profile...</p>
      )}
    </div>
  );
};

export default Profile;
