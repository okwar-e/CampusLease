  // --- React Frontend: Listings.jsx with Updated Styling ---
  import React, { useEffect, useState } from "react";
  import { useNavigate } from "react-router-dom";
  import axios from "axios";
  import ListItem from "./ListItem";
  import "./Listing.css";

  const Listings = () => {
    const [items, setItems] = useState([]);
    const [requests, setRequests] = useState([]);
    const [showForm, setShowForm] = useState(false);
    const [loading, setLoading] = useState(true);
    const [currentUserId, setCurrentUserId] = useState(null);
    const [view, setView] = useState("marketplace");

    const navigate = useNavigate();

    useEffect(() => {
      fetchCurrentUser();
      fetchItems();
      fetchRequests();
    }, []);

    const [searchTerm, setSearchTerm] = useState('');
    const filteredItems = items.filter(item =>
  item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
  (item.category && item.category.toLowerCase().includes(searchTerm.toLowerCase()))
);


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
    const res = await axios.get("http://localhost:5050/requests/all", {
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

        const user = res.data.user;
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
        return navigate("/login");
      }
      if (item.owner_id === currentUserId) {
        return alert("You cannot lease your own item.");
      }
      navigate(`/rent/${item.id}`);
    };

    const handleToggleListForm = () => {
      if (!currentUserId) {
        alert("Please log in to list items.");
        return navigate("/login");
      }
      setShowForm(!showForm);
    };

    return (
      <div className="listings-container">
        <h2 className="listings-heading">📦Listings & Requests</h2>

        <div className="view-toggle">
          <button onClick={() => setView("marketplace")} className={view === "marketplace" ? "active" : ""}>Marketplace</button>
          <button onClick={() => setView("requests")} className={view === "requests" ? "active" : ""}>Requests</button>
        </div>


        {view === "marketplace" && (
  <>
    <button className="list-new-btn" onClick={handleToggleListForm}>
      {showForm ? "Cancel Listing" : "➕ List New Item"}
    </button>

    {/* 🔍 Search Bar */}
    <input
      type="text"
      className="search-input"
      placeholder="Search items by title or category..."
      value={searchTerm}
      onChange={(e) => setSearchTerm(e.target.value)}
    />

    {showForm && <ListItem onSuccess={() => setShowForm(false)} />}

    {loading ? (
      <p>Loading items...</p>
    ) : (
      <div className="listings-grid">
        {filteredItems.length === 0 ? (
          <p>No items match your search.</p>
        ) : (
          filteredItems.map((item) => (
            <div key={item.id} className="item-card">
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
                  className="item-image"
                />
              ) : (
                <p style={{ color: "#888" }}>No image</p>
              )}

              <button className="lease-btn" onClick={() => handleRent(item)}>
                Rent Item
              </button>
            </div>
          ))
        )}
      </div>
    )}
  </>
)}


        {view === "requests" && (
          <>
            <h3 className="requests-heading">📨 My Requests</h3>
            {requests.length === 0 ? (
              <p>No item requests found.</p>
            ) : (
              <table className="requests-table">
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
        <td>{req.description || "—"}</td>
        <td>{req.category || "—"}</td>
        <td className={`urgency-${req.urgency}`}>{req.urgency}</td>
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
