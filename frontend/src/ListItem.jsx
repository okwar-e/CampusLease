import React, { useState } from "react";
import axios from "axios";

const ListItem = () => {
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    category: "",
    condition: "good",
    price_per_day: "",
    image: null,
  });

  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const handleChange = (e) => {
    const { name, value, files } = e.target;

    if (name === "image") {
      setFormData((prev) => ({ ...prev, image: files[0] }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setMessage("");

    const payload = new FormData();
    payload.append("title", formData.title);
    payload.append("description", formData.description);
    payload.append("category", formData.category);
    payload.append("condition", formData.condition);
    payload.append("price_per_day", formData.price_per_day);
    payload.append("image", formData.image);

    try {
      const res = await axios.post("http://localhost:5050/items", payload, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
        withCredentials: true,
      });

      setMessage("Item listed successfully!");
      setFormData({
        title: "",
        description: "",
        category: "",
        condition: "good",
        price_per_day: "",
        image: null,
      });
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.error || "Failed to list item.");
    }
  };

  return (
    <div>
      <h2>List a New Item</h2>
      {error && <p style={{ color: "red" }}>{error}</p>}
      {message && <p style={{ color: "green" }}>{message}</p>}

      <form onSubmit={handleSubmit} encType="multipart/form-data">
        <input
          type="text"
          name="title"
          placeholder="Item title"
          value={formData.title}
          onChange={handleChange}
          required
        /><br />

        <textarea
          name="description"
          placeholder="Description"
          value={formData.description}
          onChange={handleChange}
          required
        /><br />

        <input
          type="text"
          name="category"
          placeholder="Category (e.g. Electronics)"
          value={formData.category}
          onChange={handleChange}
        /><br />

        <select name="condition" value={formData.condition} onChange={handleChange}>
          <option value="new">New</option>
          <option value="good">Good</option>
          <option value="fair">Fair</option>
          <option value="poor">Poor</option>
        </select><br />

        <input
          type="number"
          name="price_per_day"
          placeholder="Price per day (Ksh)"
          value={formData.price_per_day}
          onChange={handleChange}
          required
        /><br />

        <label>Upload Item Image:</label>
        <input
          type="file"
          name="image"
          accept="image/*"
          onChange={handleChange}
          required
        /><br />

        <button type="submit">Submit</button>
      </form>
    </div>
  );
};

export default ListItem;
