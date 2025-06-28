// --- React Frontend: Listings.jsx with Toggle ---
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import ListItem from "./ListItem";

const Listings = () => {
  const [items, setItems] = useState([]);
  const [requests, setRequests] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState(null);
  const [view, setView] = useState('marketplace');

  const navigate = useNavigate();

  useEffect(() => {
    fetchCurrentUser();
    fetchItems();
    fetchRequests();
  }, []);

  const fetchItems = async () => {
    try {
      const res = await axios.get("http://localhost:5050/items/available", {
        withCredentials: true
      });
      setItems(res.data);
    } catch (err) {
      console.error("Error fetching items:", err);
      alert("Failed to load marketplace.");
    } finally {
      setLoading(false);
    }
  };

  const fetchRequests = async () => {
    try {
      const res = await axios.get("http://localhost:5050/student/requests", {
        withCredentials: true
      });
      setRequests(res.data);
    } catch (err) {
      console.error("Error fetching requests:", err);
    }
  };

  const fetchCurrentUser = async () => {
  try {
    const res = await axios.get("http://localhost:5050/me", {
      withCredentials: true
    });

    const user = res.data.user; // ✅ Access the nested `user`
    setCurrentUserId(user?.id);
    console.log("✅ Logged in user:", user);

  } catch (err) {
    console.warn("⚠️ Not logged in");
    setCurrentUserId(null);
  }
};

const handleRent = (item) => {
  if (!currentUserId) {
    alert("Please log in to rent items.");
    return navigate("/auth");
  }
  if (item.owner_id === currentUserId) {
    return alert("You cannot lease your own item.");
  }
  navigate(`/rent/${item.id}`);
};

const handleToggleListForm = () => {
  if (!currentUserId) {
    alert("Please log in to list items.");
    return navigate("/auth");
  }
  setShowForm(!showForm);
};


  return (
    <div>
      <h2>📦 My Listings & Requests</h2>
      <div style={{ marginBottom: '20px' }}>
        <button onClick={() => setView('marketplace')} style={{ marginRight: '10px' }}>
          Marketplace
        </button>
        <button onClick={() => setView('requests')}>Requests</button>
      </div>

      {view === 'marketplace' && (
        <>
          <button
            onClick={handleToggleListForm}
            style={{ marginBottom: "15px", padding: "8px", cursor: "pointer" }}
          >
            {showForm ? "Cancel Listing" : "➕ List New Item"}
          </button>

          {showForm && <ListItem onSuccess={() => setShowForm(false)} />}

          {loading ? (
            <p>Loading items...</p>
          ) : (
            <div style={{ display: "flex", flexWrap: "wrap", gap: "20px" }}>
              {items.length === 0 ? (
                <p>No items available for leasing.</p>
              ) : (
                items.map((item) => (
                  <div
                    key={item.id}
                    style={{
                      border: "1px solid #ccc",
                      padding: "15px",
                      borderRadius: "10px",
                      width: "200px"
                    }}
                  >
                    <h4>{item.title}</h4>
                    <p>{item.category || "Uncategorized"}</p>
                    <p>KES {item.price_per_day} /day</p>
                    {item.image ? (
                      <img
                        src={`data:image/jpeg;base64,${btoa(
                          new Uint8Array(item.image.data).reduce(
                            (data, byte) => data + String.fromCharCode(byte),
                            ""
                          )
                        )}`}
                        alt="Item"
                        style={{ width: "100%", height: "120px", objectFit: "cover" }}
                      />
                    ) : (
                      <p style={{ color: "#888" }}>No image</p>
                    )}

                    <button
                      onClick={() => handleRent(item)}
                      style={{
                        marginTop: "10px",
                        padding: "8px",
                        backgroundColor: "#0066cc",
                        color: "white",
                        border: "none",
                        borderRadius: "5px",
                        cursor: "pointer"
                      }}
                    >
                      Rent Item
                    </button>
                  </div>
                ))
              )}
            </div>
          )}
        </>
      )}

      {view === 'requests' && (
        <>
          <h3>📨 My Requests</h3>
          {requests.length === 0 ? (
            <p>No item requests found.</p>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  <th>Title</th>
                  <th>Description</th>
                  <th>Category</th>
                  <th>Urgency</th>
                  <th>Requested On</th>
                </tr>
              </thead>
              <tbody>
                {requests.map((req) => (
                  <tr key={req.id}>
                    <td>{req.title}</td>
                    <td>{req.description}</td>
                    <td>{req.category}</td>
                    <td>{req.urgency}</td>
                    <td>{new Date(req.created_at).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </>
      )}
    </div>
  );
};

export default Listings;
