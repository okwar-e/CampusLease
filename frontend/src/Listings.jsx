import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import ListItem from "./ListItem";

const Listings = () => {
  const [items, setItems] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState(null);

  const navigate = useNavigate();

  useEffect(() => {
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

    const fetchCurrentUser = async () => {
      try {
        const res = await axios.get("http://localhost:5050/me", {
          withCredentials: true
        });
        setCurrentUserId(res.data?.id);
      } catch (err) {
        console.warn("Couldn't fetch current user.");
      }
    };

    fetchItems();
    fetchCurrentUser();
  }, []);

  const handleRent = (item) => {
    if (item.owner_id === currentUserId) {
      return alert("You cannot lease your own item.");
    }
    navigate(`/rent/${item.id}`);
  };

  return (
    <div>
      <h2>📦 Marketplace</h2>

      <button
        onClick={() => setShowForm(!showForm)}
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
    </div>
  );
};

export default Listings;
