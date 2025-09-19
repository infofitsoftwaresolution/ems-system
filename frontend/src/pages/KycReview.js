import React, { useState, useEffect } from "react";
import toast from "react-hot-toast";
import "./KycReview.css";

const KycReview = () => {
  const [kycRequests, setKycRequests] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchKycRequests();
  }, []);

  const fetchKycRequests = async () => {
    try {
      console.log("Fetching KYC requests...");
      const token = localStorage.getItem("token");
      const response = await fetch("/api/kyc", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      console.log("Response status:", response.status);

      if (response.ok) {
        const data = await response.json();
        console.log("KYC Data received:", data); // Debug log
        console.log("Number of KYC requests:", data.length);
        setKycRequests(data);
        if (data.length === 0) {
          toast("No KYC requests found", { icon: "ℹ️" });
        }
      } else {
        console.error(
          "Failed to fetch KYC requests:",
          response.status,
          response.statusText
        );
        const errorText = await response.text();
        console.error("Error response:", errorText);
        toast.error("Failed to fetch KYC requests");
      }
    } catch (error) {
      console.error("Error fetching KYC requests:", error);
      toast.error("Error fetching KYC requests");
    } finally {
      setLoading(false);
    }
  };

  const handleReview = async (requestId, status) => {
    // Show loading toast
    const loadingToast = toast.loading(
      `${status === "approved" ? "Approving" : "Rejecting"} KYC request...`
    );

    try {
      console.log(`Reviewing KYC ${requestId} with status: ${status}`);

      const token = localStorage.getItem("token");
      const response = await fetch(`/api/kyc/${requestId}/review`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          status,
          reviewedBy: "admin",
          remarks: `KYC ${status} by admin`,
        }),
      });

      console.log("Review response status:", response.status);

      if (response.ok) {
        const result = await response.json();
        console.log("Review result:", result);

        // Show success message
        toast.dismiss(loadingToast);
        toast.success(
          `KYC request ${
            status === "approved" ? "approved" : "rejected"
          } successfully!`
        );

        // Refresh the list immediately
        setLoading(true);
        await fetchKycRequests();
        setLoading(false);
      } else {
        const errorText = await response.text();
        console.error("Review failed:", errorText);
        toast.dismiss(loadingToast);
        toast.error(`Error: ${errorText}`);
      }
    } catch (error) {
      console.error("Error reviewing KYC:", error);
      toast.dismiss(loadingToast);
      toast.error("Error reviewing KYC request: " + error.message);
    }
  };

  const viewDocument = (documentPath) => {
    try {
      console.log("Original document path:", documentPath);

      // Ensure documentPath starts with /
      const normalizedPath = documentPath.startsWith("/")
        ? documentPath
        : `/${documentPath}`;

      console.log("Normalized path:", normalizedPath);

      // Try multiple URL patterns to ensure file access works
      const urlsToTry = [
        `http://localhost:3001${normalizedPath}`, // Direct backend URL (primary)
        normalizedPath, // Direct path through proxy (http://localhost:3000/uploads/...)
        `/api/kyc/file/${documentPath.split("/").pop()}`, // Secure file route
      ];

      console.log("URLs to try:", urlsToTry);

      // Show loading toast
      const loadingToast = toast.loading("Opening document...");

      // Try to open the document with fallback URLs
      const tryOpenDocument = (urlIndex = 0) => {
        if (urlIndex >= urlsToTry.length) {
          toast.dismiss(loadingToast);
          toast.error("Failed to open document. All URL attempts failed.");
          return;
        }

        const currentUrl = urlsToTry[urlIndex];
        console.log(`Trying URL ${urlIndex + 1}:`, currentUrl);

        // Try to open the document
        const newWindow = window.open(currentUrl, "_blank");

        // Check if popup was blocked
        if (
          !newWindow ||
          newWindow.closed ||
          typeof newWindow.closed === "undefined"
        ) {
          toast.dismiss(loadingToast);
          toast.error(
            "Popup blocked! Please allow popups for this site to view documents."
          );
          return;
        }

        // Check if the document loaded successfully
        setTimeout(() => {
          try {
            // Try to access the window's location
            if (
              newWindow.location.href &&
              !newWindow.location.href.includes("about:blank")
            ) {
              toast.dismiss(loadingToast);
              toast.success("Document opened successfully!");
              return;
            }
          } catch (e) {
            // Cross-origin error means the file loaded but we can't access the URL
            // This is actually a good sign for file viewing
            toast.dismiss(loadingToast);
            toast.success("Document opened successfully!");
            return;
          }

          // If we get here, the current URL might have failed
          console.log(`URL ${urlIndex + 1} might have failed, trying next URL`);
          newWindow.close();

          // Try the next URL
          tryOpenDocument(urlIndex + 1);
        }, 1500);
      };

      // Start trying URLs
      tryOpenDocument(0);
    } catch (error) {
      console.error("Error opening document:", error);
      toast.error("Error opening document: " + error.message);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "pending":
        return "orange";
      case "approved":
        return "green";
      case "rejected":
        return "red";
      default:
        return "gray";
    }
  };

  const getFileIcon = (fileName) => {
    const extension = fileName.split(".").pop().toLowerCase();
    switch (extension) {
      case "pdf":
        return "📄";
      case "jpg":
      case "jpeg":
        return "🖼️";
      case "png":
        return "🖼️";
      case "doc":
      case "docx":
        return "📝";
      default:
        return "📎";
    }
  };

  if (loading) {
    return <div className="kyc-review-loading">Loading KYC requests...</div>;
  }

  return (
    <div className="kyc-review-container">
      <div className="kyc-review-header">
        <h1>KYC Document Review</h1>
        <p>Review and approve employee KYC documents</p>
        <button
          onClick={fetchKycRequests}
          style={{
            marginTop: "10px",
            padding: "8px 16px",
            backgroundColor: "#007bff",
            color: "white",
            border: "none",
            borderRadius: "4px",
            cursor: "pointer",
          }}>
          Refresh KYC Data
        </button>
      </div>

      <div className="kyc-requests-grid">
        {kycRequests.length === 0 ? (
          <div className="no-kyc-requests">
            <p>No KYC requests found</p>
          </div>
        ) : (
          kycRequests.map((request) => (
            <div key={request.id} className="kyc-request-card">
              <div className="kyc-request-header">
                <h3>{request.fullName || "Unknown Employee"}</h3>
                <span
                  className={`status-badge status-${request.status}`}
                  style={{ backgroundColor: getStatusColor(request.status) }}>
                  {request.status}
                </span>
              </div>

              <div className="kyc-request-details">
                <p>
                  <strong>Employee ID:</strong> {request.employeeId}
                </p>
                <p>
                  <strong>Document Type:</strong> {request.documentType}
                </p>
                <p>
                  <strong>Submitted:</strong>{" "}
                  {new Date(request.submittedAt).toLocaleDateString()}
                </p>
              </div>

              <div className="document-files">
                <h4>Uploaded Documents:</h4>
                <div className="file-list">
                  {/* New documents format */}
                  {request.documents && request.documents.length > 0 ? (
                    request.documents.map((doc, index) => (
                      <div key={index} className="file-item">
                        <span className="file-icon">
                          {getFileIcon(doc.path || doc.documentPath)}
                        </span>
                        <span className="file-name">
                          {doc.originalName ||
                            (doc.path || doc.documentPath).split("/").pop()}
                        </span>
                        <button
                          className="view-doc-btn"
                          onClick={() =>
                            viewDocument(doc.path || doc.documentPath)
                          }
                          title="Click to view document in new tab">
                          👁️ View
                        </button>
                      </div>
                    ))
                  ) : (
                    /* Fallback for old document format */
                    <>
                      {request.docFrontUrl && (
                        <div className="file-item">
                          <span className="file-icon">
                            {getFileIcon(request.docFrontUrl)}
                          </span>
                          <span className="file-name">
                            Document Front -{" "}
                            {request.docFrontUrl.split("/").pop()}
                          </span>
                          <div className="file-actions">
                            <button
                              className="view-doc-btn"
                              onClick={() => viewDocument(request.docFrontUrl)}
                              title="Click to view document in new tab">
                              👁️ View
                            </button>
                            <a
                              href={`http://localhost:3001${request.docFrontUrl}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="direct-link-btn"
                              title="Direct link to document">
                              🔗 Direct Link
                            </a>
                          </div>
                        </div>
                      )}
                      {request.docBackUrl && (
                        <div className="file-item">
                          <span className="file-icon">
                            {getFileIcon(request.docBackUrl)}
                          </span>
                          <span className="file-name">
                            Document Back -{" "}
                            {request.docBackUrl.split("/").pop()}
                          </span>
                          <div className="file-actions">
                            <button
                              className="view-doc-btn"
                              onClick={() => viewDocument(request.docBackUrl)}
                              title="Click to view document in new tab">
                              👁️ View
                            </button>
                            <a
                              href={`http://localhost:3001${request.docBackUrl}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="direct-link-btn"
                              title="Direct link to document">
                              🔗 Direct Link
                            </a>
                          </div>
                        </div>
                      )}
                      {request.selfieUrl && (
                        <div className="file-item">
                          <span className="file-icon">
                            {getFileIcon(request.selfieUrl)}
                          </span>
                          <span className="file-name">
                            Selfie - {request.selfieUrl.split("/").pop()}
                          </span>
                          <div className="file-actions">
                            <button
                              className="view-doc-btn"
                              onClick={() => viewDocument(request.selfieUrl)}
                              title="Click to view document in new tab">
                              👁️ View
                            </button>
                            <a
                              href={`http://localhost:3001${request.selfieUrl}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="direct-link-btn"
                              title="Direct link to document">
                              🔗 Direct Link
                            </a>
                          </div>
                        </div>
                      )}
                      {!request.docFrontUrl &&
                        !request.docBackUrl &&
                        !request.selfieUrl &&
                        !request.documents && (
                          <div className="no-documents">
                            <p>No documents uploaded</p>
                          </div>
                        )}
                    </>
                  )}
                </div>
              </div>

              {request.status === "pending" && (
                <div className="kyc-actions">
                  <button
                    className="approve-btn"
                    onClick={() => handleReview(request.id, "approved")}>
                    Approve
                  </button>
                  <button
                    className="reject-btn"
                    onClick={() => handleReview(request.id, "rejected")}>
                    Reject
                  </button>
                </div>
              )}

              {request.status !== "pending" && (
                <div className="kyc-review-info">
                  <p>
                    <strong>Reviewed by:</strong>{" "}
                    {request.reviewerName || "Admin"}
                  </p>
                  <p>
                    <strong>Review Date:</strong>{" "}
                    {new Date(request.reviewedAt).toLocaleDateString()}
                  </p>
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Document Viewer Modal - Removed since we're using new tabs */}
    </div>
  );
};

export default KycReview;
