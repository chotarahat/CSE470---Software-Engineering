import React, { useEffect } from "react";

function EmergencyOverlay({ onClose }) {

  // Optional: Prevent background scrolling when overlay is open
  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "auto";
    };
  }, []);

  return (
    <div style={styles.overlay}>
      <div style={styles.card}>
        <h2 style={styles.title}>⚠️ Immediate Help Available</h2>

        <p style={styles.text}>
          It looks like you might be going through a difficult time. 
          You are not alone. Please consider reaching out for help immediately.
        </p>

        <div style={styles.resources}>
          <p><strong>📞 Emergency:</strong> 999</p>
          <p><strong>📞 Mental Health Support:</strong> Local helpline</p>
          <p><strong>🌐 Online Support:</strong> www.befrienders.org</p>
        </div>

        <button style={styles.button} onClick={onClose}>
          Close
        </button>
      </div>
    </div>
  );
}

export default EmergencyOverlay;

const styles = {
  overlay: {
    position: "fixed",
    top: 0,
    left: 0,
    width: "100%",
    height: "100%",
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 9999,
  },
  card: {
    backgroundColor: "#ffffff",
    padding: "30px",
    borderRadius: "12px",
    maxWidth: "400px",
    width: "90%",
    textAlign: "center",
    boxShadow: "0 4px 20px rgba(0,0,0,0.3)",
  },
  title: {
    color: "#d32f2f",
    marginBottom: "15px",
  },
  text: {
    fontSize: "16px",
    marginBottom: "20px",
    color: "#333",
  },
  resources: {
    marginBottom: "20px",
    fontSize: "14px",
    color: "#555",
  },
  button: {
    padding: "10px 20px",
    backgroundColor: "#d32f2f",
    color: "#fff",
    border: "none",
    borderRadius: "6px",
    cursor: "pointer",
  },
};