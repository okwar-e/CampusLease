import React, { useEffect, useState } from 'react';
import axios from 'axios';

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
      formData.append("full_name", profile.full_name);
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

  const imageStyle = {
    width: "120px",
    height: "120px",
    objectFit: "cover",
    borderRadius: "8px",
    border: "1px solid #ccc",
  };

  return (
    <div className="profile-section">
      <h2>My Profile</h2>
      {error && <p style={{ color: "red" }}>{error}</p>}
      {profile ? (
        <div style={{ textAlign: "left", maxWidth: "500px", margin: "0 auto" }}>
          <label><strong>Full Name:</strong></label>
          <input
            type="text"
            value={profile.full_name}
            onChange={(e) => setProfile({ ...profile, full_name: e.target.value })}
            style={{ width: "100%", marginBottom: "1rem" }}
          />

          <p><strong>Email:</strong> {profile.school_email}</p>

          <label><strong>Phone Number:</strong></label>
          <input
            type="tel"
            value={profile.phone || ''}
            onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
            style={{ width: "100%", marginBottom: "1rem" }}
          />

          <p><strong>Status:</strong> {profile.status}</p>

         

          <button onClick={handleUpdate} style={{ marginTop: "20px" }}>
            Save Changes
          </button>
        </div>
      ) : (
        <p>Loading profile...</p>
      )}
    </div>
  );
};

export default Profile;
