import React, { useEffect, useMemo, useRef, useState } from "react";
import axios from "axios";
import toast, { Toaster } from "react-hot-toast";
import imageCompression from "browser-image-compression";
import Sidebar from "../components/Sidebar";
import "./ProductManage.css";

const API_BASE = "https://restaurant-backend-rosy.vercel.app/api/products";

function ProductManage() {
  const [products, setProducts] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [recommendedImages, setRecommendedImages] = useState([]);
  const [loadingRecommendedImages, setLoadingRecommendedImages] =
    useState(false);
  const imageInputRef = useRef(null);

  const initialForm = {
    name: "",
    description: "",
    price: "",
    isVariants: false,
    variants: [{ name: "", price: "" }],
    imageFile: null,
    imageURL: "",
  };

  const [form, setForm] = useState(initialForm);

  const token = localStorage.getItem("token");
  const storedUser = localStorage.getItem("user")
    ? JSON.parse(localStorage.getItem("user"))
    : null;
  const restaurantId =
    storedUser?.restaurantId?._id || storedUser?.restaurantId || null;

  const headers = useMemo(
    () => ({ Authorization: `Bearer ${token}` }),
    [token],
  );

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    if (!restaurantId) return;
    setLoading(true);
    try {
      const res = await axios.get(`${API_BASE}/getProducts/${restaurantId}`, {
        headers,
      });
      setProducts(Array.isArray(res.data) ? res.data : res.data.products || []);
    } catch (err) {
      console.error(err);
      toast.error("Failed to load products");
    } finally {
      setLoading(false);
    }
  };

  const openAddModal = () => {
    setEditingId(null);
    setForm(initialForm);
    setRecommendedImages([]);
    setShowModal(true);
  };

  const openEditModal = (p) => {
    setEditingId(p._id || p.id);
    setForm({
      name: p.name || "",
      description: p.description || "",
      price: p.price != null ? String(p.price) : "",
      isVariants: Array.isArray(p.variants) && p.variants.length > 0,
      variants:
        Array.isArray(p.variants) && p.variants.length > 0
          ? p.variants.map((v) => ({
              name: v.name || "",
              price: v.price != null ? String(v.price) : "",
            }))
          : [{ name: "", price: "" }],
      imageFile: null,
      imageURL: p.imageURL || "",
    });
    setRecommendedImages([]);
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingId(null);
    setForm(initialForm);
    setRecommendedImages([]);
  };

  const handleFormChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const fetchRecommendedImages = async () => {
    const productName = form.name.trim();
    if (!productName) {
      return toast.error("Please enter a product name first");
    }

    try {
      setLoadingRecommendedImages(true);
      const res = await axios.get(`${API_BASE}/getRecommendedProductImages`, {
        params: { name: productName },
        headers,
      });
      setRecommendedImages(
        Array.isArray(res.data?.imageUrls) ? res.data.imageUrls : [],
      );
      if (!res.data?.imageUrls?.length) {
        toast("No recommended images found for this product name");
      }
    } catch (err) {
      console.error(err);
      toast.error(
        err?.response?.data?.message || "Failed to load recommended images",
      );
    } finally {
      setLoadingRecommendedImages(false);
    }
  };

  const selectRecommendedImage = (imageURL) => {
    setForm((prev) => ({
      ...prev,
      imageURL,
      imageFile: null,
    }));

    if (imageInputRef.current) {
      imageInputRef.current.value = "";
    }
  };

  const handleManualImageChange = (e) => {
    const file = e.target.files?.[0] || null;

    setForm((prev) => ({
      ...prev,
      imageFile: file,
      imageURL: file ? "" : prev.imageURL,
    }));
  };

  const handleVariantChange = (index, key, value) => {
    setForm((prev) => {
      const updated = [...prev.variants];
      updated[index] = { ...updated[index], [key]: value };
      return { ...prev, variants: updated };
    });
  };

  const addVariantRow = () => {
    setForm((prev) => ({
      ...prev,
      variants: [...prev.variants, { name: "", price: "" }],
    }));
  };

  const removeVariantRow = (index) => {
    setForm((prev) => {
      if (prev.variants.length === 1) return prev;
      const updated = prev.variants.filter((_, i) => i !== index);
      return { ...prev, variants: updated };
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) return toast.error("Product name is required");

    if (form.isVariants) {
      const invalidVariant = form.variants.some(
        (v) => !v.name?.trim() || v.price === "" || Number(v.price) <= 0,
      );
      if (invalidVariant) {
        return toast.error("Each variant must have a name and valid price");
      }
    } else if (form.price === "" || Number(form.price) <= 0) {
      return toast.error("Please provide a valid product price");
    }

    try {
      setSaving(true);
      const payload = new FormData();
      payload.append("name", form.name.trim());
      payload.append("description", form.description.trim());
      payload.append("restaurantId", restaurantId);
      if (form.imageURL) {
        payload.append("imageURL", form.imageURL);
      }

      let uploadImage = form.imageFile;
      if (uploadImage) {
        uploadImage = await imageCompression(uploadImage, {
          maxSizeMB: 0.3,
          maxWidthOrHeight: 1000,
          useWebWorker: true,
          initialQuality: 0.75,
        });
      }

      if (form.isVariants) {
        const cleanedVariants = form.variants.map((v) => ({
          name: v.name.trim(),
          price: Number(v.price),
        }));
        payload.append("variants", JSON.stringify(cleanedVariants));
        payload.append("price", Number(form.price || 0));
      } else {
        payload.append("price", Number(form.price || 0));
        payload.append("variants", JSON.stringify([]));
      }

      if (uploadImage) {
        payload.append("image", uploadImage);
      }

      if (editingId) {
        await axios.put(`${API_BASE}/updateProduct/${editingId}`, payload, {
          headers,
        });
        toast.success("Product updated");
      } else {
        await axios.post(`${API_BASE}/addProduct`, payload, { headers });
        toast.success("Product created");
      }

      closeModal();
      fetchProducts();
    } catch (err) {
      console.error(err);
      toast.error(err?.response?.data?.message || "Failed to save product");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this product?")) return;
    try {
      setDeletingId(id);
      await axios.delete(`${API_BASE}/deleteProduct/${id}`, { headers });
      toast.success("Product deleted");
      fetchProducts();
    } catch (err) {
      console.error(err);
      toast.error(err?.response?.data?.message || "Failed to delete product");
    } finally {
      setDeletingId(null);
    }
  };

  const filteredProducts = products.filter((product) =>
    (product.name || "")
      .toLowerCase()
      .includes(searchTerm.trim().toLowerCase()),
  );

  return (
    <Sidebar>
      <div className="pm-page">
        <Toaster position="top-right" />

        <header className="pm-topbar">
          <div>
            <h2>Product Management</h2>
            <p className="pm-muted">
              Add, update, and organize your menu products
            </p>
          </div>
          <div className="pm-topbar-actions">
            <div className="pm-search-wrap">
              <i className="fas fa-search pm-search-icon"></i>
              <input
                type="text"
                className="form-control pm-search-input"
                placeholder="Search product by name"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            <button
              type="button"
              className="btn btn-warning"
              onClick={openAddModal}
            >
              <i className="fas fa-plus me-2"></i>
              Add Product
            </button>
          </div>
        </header>

        {loading ? (
          <div className="pm-loading">Loading products...</div>
        ) : (
          <section className="pm-grid">
            {filteredProducts.length === 0 ? (
              <div className="pm-empty">
                {searchTerm.trim()
                  ? "No products match your search."
                  : "No products yet. Start by adding your first product."}
              </div>
            ) : (
              filteredProducts.map((p) => {
                const id = p._id || p.id;
                const hasVariants =
                  Array.isArray(p.variants) && p.variants.length > 0;

                return (
                  <article key={id} className="pm-card">
                    <div className="pm-image-wrap">
                      {p.imageURL ? (
                        <img
                          src={p.imageURL}
                          alt={p.name}
                          className="pm-image"
                        />
                      ) : (
                        <div className="pm-placeholder">
                          <i className="fas fa-image"></i>
                        </div>
                      )}
                      {hasVariants && <span className="pm-badge">Variant</span>}
                    </div>

                    <div className="pm-content">
                      <h5 className="pm-name" title={p.name}>
                        {p.name}
                      </h5>

                      {p.description && (
                        <p className="pm-description">{p.description}</p>
                      )}

                      {!hasVariants && (
                        <p className="pm-price">
                          Rs. {Number(p.price || 0).toLocaleString()}/-
                        </p>
                      )}

                      {hasVariants && (
                        <div className="pm-variant-block">
                          <ul className="pm-variant-list pm-variant-list-visible">
                            {p.variants.map((v, i) => (
                              <li key={`${id}-v-${i}`}>
                                <span>{v.name}</span>
                                <strong>
                                  Rs. {Number(v.price || 0).toLocaleString()}
                                </strong>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      <div className="pm-actions">
                        <button
                          type="button"
                          className="btn btn-sm btn-secondary"
                          onClick={() => openEditModal(p)}
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          className="btn btn-sm btn-danger"
                          onClick={() => handleDelete(id)}
                          disabled={deletingId === id}
                        >
                          {deletingId === id ? (
                            <span
                              className="spinner-border spinner-border-sm"
                              role="status"
                              aria-hidden="true"
                            ></span>
                          ) : (
                            "Delete"
                          )}
                        </button>
                      </div>
                    </div>
                  </article>
                );
              })
            )}
          </section>
        )}

        {showModal && (
          <div className="pm-modal-overlay" onClick={closeModal}>
            <div className="pm-modal" onClick={(e) => e.stopPropagation()}>
              <h3>{editingId ? "Edit Product" : "Add Product"}</h3>

              <form onSubmit={handleSubmit} className="pm-form">
                <div className="mb-3">
                  <label className="form-label">Product Name</label>
                  <input
                    className="form-control"
                    name="name"
                    value={form.name}
                    onChange={handleFormChange}
                    placeholder="e.g. Zinger Burger"
                  />
                </div>

                {!editingId && (
                  <div className="mb-3">
                    <button
                      type="button"
                      className="btn btn-outline-primary pm-recommend-btn"
                      onClick={fetchRecommendedImages}
                      disabled={loadingRecommendedImages}
                      hidden={form.name.trim() === ""}
                    >
                      {loadingRecommendedImages ? (
                        <>
                          <span
                            className="spinner-border spinner-border-sm me-2"
                            role="status"
                            aria-hidden="true"
                          ></span>
                          Loading images...
                        </>
                      ) : (
                        "Get Recommended Images"
                      )}
                    </button>

                    {recommendedImages.length > 0 && (
                      <div className="pm-recommended-grid">
                        {recommendedImages.map((imageURL, index) => {
                          const isSelected = form.imageURL === imageURL;

                          return (
                            <button
                              type="button"
                              key={`${imageURL}-${index}`}
                              className={`pm-recommended-card ${
                                isSelected ? "is-selected" : ""
                              }`}
                              onClick={() => selectRecommendedImage(imageURL)}
                              aria-pressed={isSelected}
                              aria-label={`Select recommended image ${index + 1}`}
                            >
                              {isSelected && (
                                <span className="pm-recommended-selected-badge">
                                  <i className="fas fa-check"></i>
                                </span>
                              )}
                              <img
                                src={imageURL}
                                alt={`Recommended ${index + 1}`}
                                className="pm-recommended-image"
                              />
                              {isSelected && (
                                <span className="pm-recommended-selected-label">
                                  Selected
                                </span>
                              )}
                            </button>
                          );
                        })}
                      </div>
                    )}

                    {form.imageURL && (
                      <div className="pm-selected-image-note">
                        Selected recommended image
                      </div>
                    )}
                  </div>
                )}

                <div className="mb-3">
                  <label className="form-label">Product Image (optional)</label>
                  <input
                    ref={imageInputRef}
                    className="form-control"
                    type="file"
                    accept="image/*"
                    onChange={handleManualImageChange}
                  />
                </div>


                <div className="mb-3">
                  <label className="form-label">
                    Description / Ingredients
                  </label>
                  <textarea
                    className="form-control"
                    name="description"
                    value={form.description}
                    onChange={handleFormChange}
                    rows={3}
                    placeholder="e.g. Made up of chicken, cream, ...."
                  ></textarea>
                </div>

                <div className="form-check mb-3">
                  <input
                    className="form-check-input"
                    type="checkbox"
                    id="isVariants"
                    name="isVariants"
                    checked={form.isVariants}
                    onChange={handleFormChange}
                  />
                  <label className="form-check-label" htmlFor="isVariants">
                    Has Variants?
                  </label>
                </div>

                {form.isVariants ? (
                  <div className="pm-variant-editor">
                    <div className="pm-variant-head">
                      <label className="form-label mb-0">Variants</label>
                      <button
                        type="button"
                        className="btn btn-sm btn-outline-success"
                        onClick={addVariantRow}
                      >
                        + Add Variant
                      </button>
                    </div>

                    {form.variants.map((v, index) => (
                      <div
                        className="pm-variant-row"
                        key={`variant-row-${index}`}
                      >
                        <input
                          className="form-control"
                          placeholder="Variant name (Small, Large)"
                          value={v.name}
                          onChange={(e) =>
                            handleVariantChange(index, "name", e.target.value)
                          }
                        />
                        <input
                          className="form-control"
                          type="number"
                          min="0"
                          placeholder="Price"
                          value={v.price}
                          onChange={(e) =>
                            handleVariantChange(index, "price", e.target.value)
                          }
                        />
                        <button
                          type="button"
                          className="btn btn-outline-danger"
                          onClick={() => removeVariantRow(index)}
                        >
                          Remove
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="mb-3">
                    <label className="form-label">Price</label>
                    <input
                      className="form-control"
                      name="price"
                      type="number"
                      min="0"
                      value={form.price}
                      onChange={handleFormChange}
                      placeholder="Enter product price"
                    />
                  </div>
                )}

                <div className="pm-modal-actions">
                  <button
                    type="button"
                    className="btn btn-outline-secondary"
                    onClick={closeModal}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="btn btn-primary"
                    disabled={saving}
                  >
                    {saving ? (
                      <>
                        <span
                          className="spinner-border spinner-border-sm me-2"
                          role="status"
                          aria-hidden="true"
                        ></span>
                        {editingId ? "Updating..." : "Creating..."}
                      </>
                    ) : editingId ? (
                      "Update"
                    ) : (
                      "Create"
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </Sidebar>
  );
}

export default ProductManage;
