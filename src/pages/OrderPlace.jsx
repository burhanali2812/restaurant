import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import toast, { Toaster } from "react-hot-toast";
import Sidebar from "../components/Sidebar";
import "./OrderPlace.css";

const PRODUCTS_API = "https://restaurant-backend-rosy.vercel.app/api/products";
const WAITERS_API = "https://restaurant-backend-rosy.vercel.app/api/waiters";
const ORDERS_API = "https://restaurant-backend-rosy.vercel.app/api/orders";

function OrderPlace() {
  const [products, setProducts] = useState([]);
  const [waiters, setWaiters] = useState([]);
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [loadingWaiters, setLoadingWaiters] = useState(false);
  const [placingOrder, setPlacingOrder] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [waiterSearch, setWaiterSearch] = useState("");
  const [orderType, setOrderType] = useState("dine-in");
  const [selectedWaiterId, setSelectedWaiterId] = useState("");
  const [discount, setDiscount] = useState(0);
  const [drafts, setDrafts] = useState({});
  const [cart, setCart] = useState([]);

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
    if (!restaurantId) return;
    fetchProducts();
    fetchWaiters();
  }, [restaurantId]);

  const fetchProducts = async () => {
    setLoadingProducts(true);
    try {
      const res = await axios.get(
        `${PRODUCTS_API}/getProducts/${restaurantId}`,
        { headers },
      );
      setProducts(Array.isArray(res.data) ? res.data : res.data.products || []);
    } catch (error) {
      console.error(error);
      toast.error("Failed to load products");
    } finally {
      setLoadingProducts(false);
    }
  };

  const fetchWaiters = async () => {
    setLoadingWaiters(true);
    try {
      const res = await axios.get(`${WAITERS_API}/getWaiters/${restaurantId}`, {
        headers,
      });
      const waiterList = Array.isArray(res.data)
        ? res.data
        : res.data.waiters || [];
      setWaiters(waiterList.filter((waiter) => waiter.isActive !== false));
    } catch (error) {
      console.error(error);
      toast.error("Failed to load waiters");
    } finally {
      setLoadingWaiters(false);
    }
  };

  const filteredProducts = products.filter((product) =>
    (product.name || "")
      .toLowerCase()
      .includes(searchTerm.trim().toLowerCase()),
  );

  const filteredWaiters = waiters.filter((waiter) => {
    const q = waiterSearch.trim().toLowerCase();
    if (!q) return true;
    return (waiter.name || "").toLowerCase().includes(q);
  });

  const getCartKey = (item) => `${item.productId}-${item.variantId || "base"}`;

  const getProductDraft = (productId) =>
    drafts[productId] || { variantId: "", quantity: 1 };

  const updateDraft = (productId, updates) => {
    setDrafts((prev) => ({
      ...prev,
      [productId]: {
        ...getProductDraft(productId),
        ...updates,
      },
    }));
  };

  const addToCart = (product) => {
    const productId = product._id || product.id;
    const hasVariants =
      Array.isArray(product.variants) && product.variants.length > 0;
    const draft = getProductDraft(productId);
    const quantity = Number(draft.quantity) || 1;

    let variant = null;
    if (hasVariants) {
      variant = product.variants.find((item) => item._id === draft.variantId);
      if (!variant) {
        toast.error(`Please choose a size for ${product.name}`);
        return;
      }
    }

    const unitPrice = hasVariants
      ? Number(product.price || 0) + Number(variant.price || 0)
      : Number(product.price || 0);

    const cartItem = {
      productId,
      name: product.name,
      imageURL: product.imageURL,
      quantity,
      variantId: variant?._id || null,
      variantName: variant?.name || null,
      unitPrice,
    };

    setCart((prev) => {
      const key = getCartKey(cartItem);
      const existingIndex = prev.findIndex((item) => getCartKey(item) === key);

      if (existingIndex >= 0) {
        const updated = [...prev];
        updated[existingIndex] = {
          ...updated[existingIndex],
          quantity: updated[existingIndex].quantity + quantity,
        };
        return updated;
      }

      return [...prev, cartItem];
    });

    toast.success(`${product.name} added to cart`);
  };

  const updateCartQuantity = (key, quantity) => {
    const nextQty = Number(quantity);
    if (Number.isNaN(nextQty) || nextQty < 1) return;

    setCart((prev) =>
      prev.map((item) =>
        getCartKey(item) === key ? { ...item, quantity: nextQty } : item,
      ),
    );
  };

  const updateDraftQuantity = (productId, step) => {
    setDrafts((prev) => {
      const current = getProductDraft(productId);
      return {
        ...prev,
        [productId]: {
          ...current,
          quantity: Math.max(1, (Number(current.quantity) || 1) + step),
        },
      };
    });
  };

  const incrementCartItem = (key, step) => {
    setCart((prev) =>
      prev.map((item) =>
        getCartKey(item) === key
          ? { ...item, quantity: Math.max(1, item.quantity + step) }
          : item,
      ),
    );
  };

  const removeCartItem = (key) => {
    setCart((prev) => prev.filter((item) => getCartKey(item) !== key));
  };

  const subtotal = cart.reduce(
    (sum, item) =>
      sum + Number(item.unitPrice || 0) * Number(item.quantity || 0),
    0,
  );
  const discountValue = Math.min(Number(discount) || 0, subtotal);
  const total = Math.max(subtotal - discountValue, 0);

  const handleOrderTypeChange = (type) => {
    setOrderType(type);
    if (type === "takeaway") {
      setSelectedWaiterId("");
    }
  };

  const handlePlaceOrder = async () => {
    if (cart.length === 0) {
      toast.error("Add products to the cart first");
      return;
    }

    if (["dine-in", "delivery"].includes(orderType) && !selectedWaiterId) {
      toast.error("Please choose a waiter");
      return;
    }

    try {
      setPlacingOrder(true);
      const payload = {
        restaurantId,
        orderType,
        waiterId: ["dine-in", "delivery"].includes(orderType)
          ? selectedWaiterId
          : undefined,
        discount: discountValue,
        products: cart.map((item) => ({
          productId: item.productId,
          quantity: item.quantity,
          variantId: item.variantId || undefined,
        })),
      };

      await axios.post(`${ORDERS_API}/createOrder`, payload, { headers });
      toast.success("Order placed successfully");
      setCart([]);
      setDrafts({});
      setSearchTerm("");
      setWaiterSearch("");
      setOrderType("dine-in");
      setSelectedWaiterId("");
      setDiscount(0);
    } catch (error) {
      console.error(error);
      toast.error(error?.response?.data?.message || "Failed to place order");
    } finally {
      setPlacingOrder(false);
    }
  };

  return (
    <Sidebar>
      <div className="op-page">
        <Toaster position="top-right" />

        <header className="op-topbar">
          <div>
            <h2>Order Place</h2>
            <p className="op-muted">
              Choose products on the left and build the checkout summary on the
              right.
            </p>
          </div>
        </header>

        <div className="op-layout">
          <section className="op-products-panel">
            <div className="op-search-wrap op-search-inside-panel mb-3">
              <i className="fas fa-search op-search-icon"></i>
              <input
                type="text"
                className="form-control op-search-input"
                placeholder="Search product by name"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            {loadingProducts ? (
              <div className="op-loading-box">Loading products...</div>
            ) : filteredProducts.length === 0 ? (
              <div className="op-empty-box">
                {searchTerm.trim()
                  ? "No products match your search."
                  : "No products available."}
              </div>
            ) : (
              <div className="op-grid">
                {filteredProducts.map((product) => {
                  const id = product._id || product.id;
                  const hasVariants =
                    Array.isArray(product.variants) &&
                    product.variants.length > 0;
                  const draft = getProductDraft(id);
                  const selectedVariant = hasVariants
                    ? product.variants.find(
                        (variant) => variant._id === draft.variantId,
                      )
                    : null;

                  return (
                    <article key={id} className="op-card">
                      <div className="op-image-wrap">
                        {product.imageURL ? (
                          <img
                            src={product.imageURL}
                            alt={product.name}
                            className="op-image"
                          />
                        ) : (
                          <div className="op-placeholder">
                            <i className="fas fa-image"></i>
                          </div>
                        )}
                        {hasVariants && (
                          <span className="op-badge">Variant</span>
                        )}
                      </div>

                      <div className="op-content">
                        <h5 className="op-name" title={product.name}>
                          {product.name}
                        </h5>

                        {product.description && (
                          <p className="op-description">
                            {product.description}
                          </p>
                        )}

                        {!hasVariants && (
                          <p className="op-price">
                            Rs. {Number(product.price || 0).toLocaleString()}/-
                          </p>
                        )}

                        {hasVariants && (
                          <>
                            <div className="op-variant-title">Choose size</div>
                            <div className="op-variant-chips">
                              {product.variants.map((variant) => {
                                const active = draft.variantId === variant._id;
                                return (
                                  <button
                                    key={variant._id}
                                    type="button"
                                    className={`op-chip ${active ? "active" : ""}`}
                                    onClick={() =>
                                      updateDraft(id, {
                                        variantId: variant._id,
                                        quantity: draft.quantity || 1,
                                      })
                                    }
                                  >
                                    {variant.name} + Rs.{" "}
                                    {Number(
                                      variant.price || 0,
                                    ).toLocaleString()}
                                  </button>
                                );
                              })}
                            </div>

                            {selectedVariant && (
                              <div className="op-selected-variant">
                                Selected:{" "}
                                <strong>{selectedVariant.name}</strong>
                              </div>
                            )}
                          </>
                        )}

                        <div className="op-buy-row">
                          <div className="op-qty-box">
                            <button
                              type="button"
                              onClick={() => updateDraftQuantity(id, -1)}
                            >
                              -
                            </button>
                            <span className="op-qty-value">
                              {draft.quantity || 1}
                            </span>
                            <button
                              type="button"
                              onClick={() => updateDraftQuantity(id, 1)}
                            >
                              +
                            </button>
                          </div>

                          <button
                            type="button"
                            className="btn btn-primary op-add-btn"
                            onClick={() => addToCart(product)}
                            disabled={hasVariants && !draft.variantId}
                          >
                            Add
                          </button>
                        </div>
                      </div>
                    </article>
                  );
                })}
              </div>
            )}
          </section>

          <aside className="op-summary-panel">
            <div className="op-summary-card">
              <h4>Checkout Summary</h4>

              <div className="op-summary-meta">
                <div className="op-order-type-label">Order Type</div>
                <div className="op-order-type-row">
                  {[
                    { label: "Dine In", value: "dine-in" },
                    { label: "Take Away", value: "takeaway" },
                    { label: "Delivery", value: "delivery" },
                  ].map((option) => (
                    <button
                      key={option.value}
                      type="button"
                      className={`op-type-btn ${orderType === option.value ? "active" : ""}`}
                      onClick={() => handleOrderTypeChange(option.value)}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="op-cart-list">
                {cart.length === 0 ? (
                  <div className="op-empty-cart">Cart is empty</div>
                ) : (
                  cart.map((item) => {
                    const key = getCartKey(item);
                    const lineTotal =
                      Number(item.unitPrice || 0) * Number(item.quantity || 0);
                    return (
                      <div key={key} className="op-cart-item">
                        <div className="op-cart-item-info">
                          <strong>{item.name}</strong>
                          {item.variantName && (
                            <span className="op-cart-variant">
                              Size: {item.variantName}
                            </span>
                          )}
                          <small>
                            Rs. {Number(item.unitPrice || 0).toLocaleString()}{" "}
                            each
                          </small>
                          <div className="op-cart-item-line">
                            <small>Line Total: </small>
                            <strong>Rs. {lineTotal.toLocaleString()}</strong>
                          </div>
                        </div>

                        <div className="op-cart-item-actions">
                          <div className="op-cart-qty">
                            <button
                              type="button"
                              onClick={() => incrementCartItem(key, -1)}
                            >
                              -
                            </button>
                            <input
                              type="number"
                              min="1"
                              value={item.quantity}
                              onChange={(e) =>
                                updateCartQuantity(key, e.target.value)
                              }
                            />
                            <button
                              type="button"
                              onClick={() => incrementCartItem(key, 1)}
                            >
                              +
                            </button>
                          </div>
                          <button
                            type="button"
                            className="op-remove-btn"
                            onClick={() => removeCartItem(key)}
                            title="Remove item"
                          >
                            <i className="fas fa-trash" aria-hidden="true"></i>
                          </button>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              <div className="op-discount-box">
                <label className="form-label">Discount</label>
                <input
                  type="number"
                  min="0"
                  className="form-control"
                  value={discount}
                  onChange={(e) => setDiscount(e.target.value)}
                  placeholder="Enter discount amount"
                />
              </div>

              {loadingWaiters ? (
                <div className="op-small-note">Loading waiters...</div>
              ) : ["dine-in", "delivery"].includes(orderType) ? (
                <div className="op-waiter-box">
                  <label className="form-label">Choose Waiter</label>
                  <input
                    type="text"
                    className="form-control mb-2"
                    placeholder="Search waiter"
                    value={waiterSearch}
                    onChange={(e) => setWaiterSearch(e.target.value)}
                  />
                  <select
                    className="form-select"
                    value={selectedWaiterId}
                    onChange={(e) => setSelectedWaiterId(e.target.value)}
                  >
                    <option value="">Select waiter</option>
                    {filteredWaiters.map((waiter) => (
                      <option key={waiter._id} value={waiter._id}>
                        {waiter.name} - {waiter.phone}
                      </option>
                    ))}
                  </select>
                </div>
              ) : (
                <div className="op-small-note">
                  No waiter needed for takeaway.
                </div>
              )}

              <div className="op-totals">
                <div>
                  <span>Subtotal</span>
                  <strong>Rs. {subtotal.toLocaleString()}</strong>
                </div>
                <div>
                  <span>Discount</span>
                  <strong>- Rs. {discountValue.toLocaleString()}</strong>
                </div>
                <div className="op-total-row">
                  <span>Total</span>
                  <strong>Rs. {total.toLocaleString()}</strong>
                </div>
              </div>

              <button
                type="button"
                className="btn btn-success op-place-btn"
                onClick={handlePlaceOrder}
                disabled={placingOrder}
              >
                {placingOrder ? (
                  <>
                    <span
                      className="spinner-border spinner-border-sm me-2"
                      role="status"
                      aria-hidden="true"
                    ></span>
                    Placing Order...
                  </>
                ) : (
                  "Place Order"
                )}
              </button>
            </div>
          </aside>
        </div>
         <div style={{marginTop : "100px"}}>

      </div>
      </div>
     
    </Sidebar>
  );
}

export default OrderPlace;
