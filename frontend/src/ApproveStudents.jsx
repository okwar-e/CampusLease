import React, { useEffect, useState } from "react";
import axios from "axios";
import './ApproveStudents.css';

const ApproveStudents = () => {
  const [students, setStudents] = useState([]);
  const [selectedImage, setSelectedImage] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);

  useEffect(() => {
    const fetchStudents = async () => {
      try {
        const res = await axios.get("http://localhost:5050/admin/students", {
          withCredentials: true,
        });
        setStudents(res.data.filter((s) => s.status === "pending"));
      } catch (err) {
        console.error(err);
      }
    };

    fetchStudents();
  }, []);

  const updateStatus = async (id, status) => {
    try {
      await axios.post(
        `http://localhost:5050/admin/students/${id}/status`,
        { status },
        { withCredentials: true }
      );
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

  const imageStyle = "thumbnail-img";

  return (
    <div className="approve-students-container">
      <h2>Pending Student Approvals</h2>

      {students.length === 0 ? (
        <p>No pending requests</p>
      ) : (
        <table className="students-table">
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
                      className={imageStyle}
                      src={`data:image/jpeg;base64,${btoa(
                        new Uint8Array(student.selfie.data).reduce(
                          (data, byte) => data + String.fromCharCode(byte),
                          ""
                        )
                      )}`}
                      alt="Selfie"
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
                      className={imageStyle}
                      src={`data:image/jpeg;base64,${btoa(
                        new Uint8Array(student.id_card.data).reduce(
                          (data, byte) => data + String.fromCharCode(byte),
                          ""
                        )
                      )}`}
                      alt="ID Card"
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
                <td className="action-buttons">
                  <button onClick={() => updateStatus(student.id, "approved")}>Approve</button>
                  <button onClick={() => updateStatus(student.id, "rejected")}>Reject</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {modalVisible && selectedImage && (
        <div className="modal-overlay" onClick={closeModal}>
          <img src={selectedImage} alt="Zoomed" />
        </div>
      )}
    </div>
  );
};

export default ApproveStudents;
