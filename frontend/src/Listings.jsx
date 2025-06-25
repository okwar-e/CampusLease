import React, { useEffect, useState } from "react";
import axios from "axios";
import ListItem from "./ListItem"; // 👈 Import the component to list new items

const Listings = () => {
  const [items, setItems] = useState([]);
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    const fetchItems = async () => {
      try {
        const res = await axios.get("http://localhost:5050/items/available");
        setItems(res.data);
      } catch (err) {
        console.error("Error fetching items:", err);
      }
    };

    fetchItems();
  }, []);

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

      <div style={{ display: "flex", flexWrap: "wrap", gap: "20px" }}>
        {items.map((item) => (
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
            <p>{item.category}</p>
            <p>KES {item.price_per_day} /day</p>
            {item.image && (
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
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default Listings;
