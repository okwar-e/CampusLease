import React, { useEffect, useState } from 'react';
import axios from 'axios';

const Profile = () => {
  const [profile, setProfile] = useState(null);
  const [error, setError] = useState('');

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
          <p><strong>Full Name:</strong> {profile.full_name}</p>
          <p><strong>Email:</strong> {profile.school_email}</p>
          <p><strong>Status:</strong> {profile.status}</p>

          <div style={{ marginTop: "20px" }}>
            <h4>Selfie</h4>
            {profile.selfie && (
              <img
                src={`data:image/jpeg;base64,${btoa(
                  new Uint8Array(profile.selfie.data).reduce(
                    (data, byte) => data + String.fromCharCode(byte), ""
                  )
                )}`}
                alt="Selfie"
                style={imageStyle}
              />
            )}
          </div>

          <div style={{ marginTop: "20px" }}>
            <h4>ID Card</h4>
            {profile.id_card && (
              <img
                src={`data:image/jpeg;base64,${btoa(
                  new Uint8Array(profile.id_card.data).reduce(
                    (data, byte) => data + String.fromCharCode(byte), ""
                  )
                )}`}
                alt="ID Card"
                style={imageStyle}
              />
            )}
          </div>
        </div>
      ) : (
        <p>Loading profile...</p>
      )}
    </div>
  );
};

export default Profile;
