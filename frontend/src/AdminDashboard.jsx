import React, { useEffect, useState } from "react";
import axios from "axios";

const AdminDashboard = () => {
  const [students, setStudents] = useState([]);
  const [selectedImage, setSelectedImage] = useState(null); // 👈 For zoom
  const [modalVisible, setModalVisible] = useState(false);  // 👈 Modal state

  useEffect(() => {
    const fetchStudents = async () => {
      try {
        const res = await axios.get("http://localhost:5050/admin/students");
        setStudents(res.data.filter((s) => s.status === "pending"));
      } catch (err) {
        console.error(err);
      }
    };

    fetchStudents();
  }, []);

  const updateStatus = async (id, status) => {
    try {
      await axios.post(`http://localhost:5050/admin/students/${id}/status`, {
        status,
      });
      setStudents((prev) => prev.filter((s) => s.id !== id));
    } catch (err) {
      console.error(err);
    }
  };

  const handleImageClick = (image) => {
    setSelectedImage(image);
    setModalVisible(true);
  };

  const closeModal = () => {
    setModalVisible(false);
    setSelectedImage(null);
  };

  const imageStyle = {
    width: "100px",
    height: "100px",
    objectFit: "cover",
    cursor: "pointer",
    border: "1px solid #ccc",
  };

  return (
    <div>
      <h2>Pending Student Approvals</h2>
      {students.length === 0 ? (
        <p>No pending requests</p>
      ) : (
        <table border="1" cellPadding="10">
          <thead>
            <tr>
              <th>Full Name</th>
              <th>School Email</th>
              <th>Selfie</th>
              <th>ID Card</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {students.map((student) => (
              <tr key={student.id}>
                <td>{student.full_name}</td>
                <td>{student.school_email}</td>
                <td>
                  {student.selfie && (
                    <img
                      src={`data:image/jpeg;base64,${btoa(
                        new Uint8Array(student.selfie.data).reduce(
                          (data, byte) => data + String.fromCharCode(byte),
                          ""
                        )
                      )}`}
                      alt="Selfie"
                      style={imageStyle}
                      onClick={() =>
                        handleImageClick(
                          `data:image/jpeg;base64,${btoa(
                            new Uint8Array(student.selfie.data).reduce(
                              (data, byte) => data + String.fromCharCode(byte),
                              ""
                            )
                          )}`
                        )
                      }
                    />
                  )}
                </td>
                <td>
                  {student.id_card && (
                    <img
                      src={`data:image/jpeg;base64,${btoa(
                        new Uint8Array(student.id_card.data).reduce(
                          (data, byte) => data + String.fromCharCode(byte),
                          ""
                        )
                      )}`}
                      alt="ID Card"
                      style={imageStyle}
                      onClick={() =>
                        handleImageClick(
                          `data:image/jpeg;base64,${btoa(
                            new Uint8Array(student.id_card.data).reduce(
                              (data, byte) => data + String.fromCharCode(byte),
                              ""
                            )
                          )}`
                        )
                      }
                    />
                  )}
                </td>
                <td>
                  <button onClick={() => updateStatus(student.id, "approved")}>
                    Approve
                  </button>
                  <button onClick={() => updateStatus(student.id, "rejected")}>
                    Reject
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {/* 👇 Modal for Zoomed Image */}
      {modalVisible && selectedImage && (
        <div
          onClick={closeModal}
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            width: "100vw",
            height: "100vh",
            backgroundColor: "rgba(0,0,0,0.8)",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            zIndex: 999,
          }}
        >
          <img
            src={selectedImage}
            alt="Zoomed"
            style={{
              maxWidth: "90%",
              maxHeight: "90%",
              borderRadius: "10px",
              boxShadow: "0 0 15px white",
            }}
          />
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
