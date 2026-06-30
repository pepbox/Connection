import React, { useRef, useCallback, useState, useEffect } from "react";
import {
  Box,
  Typography,
  Avatar,
  Button,
} from "@mui/material";
import { CloudUpload } from "@mui/icons-material";
import Webcam from "react-webcam";
import GlobalButton from "../../../../components/ui/button";
import { useSubmitConnectionSelfieMutation } from "../../services/gameArena.Api";

interface ConnectionSelfieScreenProps {
  connectionId: string;
  partnerName: string;
  partnerProfilePhoto?: string;
}

const ConnectionSelfieScreen: React.FC<ConnectionSelfieScreenProps> = ({
  connectionId,
  partnerName,
  partnerProfilePhoto,
}) => {
  const webcamRef = useRef<Webcam>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [submitConnectionSelfie] = useSubmitConnectionSelfieMutation();

  const capture = useCallback(() => {
    const imageSrc = webcamRef.current?.getScreenshot();
    if (imageSrc) {
      setCapturedImage(imageSrc);
    }
  }, [webcamRef]);

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        if (e.target?.result) {
          setCapturedImage(e.target.result as string);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  // Cleanup preview URL when component unmounts
  useEffect(() => {
    return () => {
      if (capturedImage && capturedImage.startsWith("blob:")) {
        URL.revokeObjectURL(capturedImage);
      }
    };
  }, [capturedImage]);

  const handleConfirm = async () => {
    if (!capturedImage || !connectionId) return;

    setIsUploading(true);
    try {
      // Convert base64 to File object
      const response = await fetch(capturedImage);
      const blob = await response.blob();
      const file = new File([blob], "connection-selfie.jpg", {
        type: "image/jpeg",
      });

      // Create FormData
      const formData = new FormData();
      formData.append("connectionId", connectionId);
      formData.append("selfie", file);

      await submitConnectionSelfie(formData).unwrap();
      console.log("Connection selfie uploaded successfully");
    } catch (error) {
      console.error("Error uploading connection selfie:", error);
    } finally {
      setIsUploading(false);
    }
  };

  const handleRetake = () => {
    setCapturedImage(null);
  };

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        minHeight: "100vh",
        bgcolor: "#f5f6fa",
      }}
    >
      {/* Top Banner - Partner Info */}
      <Box
        sx={{
          bgcolor: "primary.main",
          backgroundImage: "linear-gradient(135deg, #A78BFA 0%, #764ba2 100%)",
          color: "white",
          py: 4,
          px: 3,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          textAlign: "center",
          gap: 1.5,
          borderBottomLeftRadius: "24px",
          borderBottomRightRadius: "24px",
          boxShadow: "0px 4px 20px rgba(167, 139, 250, 0.2)",
        }}
      >
        <Avatar
          src={partnerProfilePhoto}
          alt={partnerName}
          sx={{
            width: 80,
            height: 80,
            border: "3px solid white",
            boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
          }}
        />
        <Box>
          <Typography variant="h5" fontWeight="bold">
            Take a Selfie with {partnerName}!
          </Typography>
          <Typography variant="body2" sx={{ opacity: 0.9, mt: 0.5 }}>
            To complete your connection, snap a photo together and upload it.
          </Typography>
        </Box>
      </Box>

      {/* Main Camera / Image Preview Card */}
      <Box
        sx={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          px: 3,
          py: 4,
        }}
      >
        <Box
          sx={{
            bgcolor: "white",
            borderRadius: "16px",
            p: 1.5,
            boxShadow: "0px 8px 30px rgba(0,0,0,0.06)",
            border: "1px solid #eaeaea",
            width: "100%",
            maxWidth: "340px",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
          }}
        >
          {/* Camera Viewfinder */}
          <Box
            sx={{
              width: "100%",
              aspectRatio: "1/1",
              bgcolor: "black",
              borderRadius: "12px",
              overflow: "hidden",
              border: "1px solid #f0f0f0",
              position: "relative",
            }}
          >
            {capturedImage ? (
              <img
                src={capturedImage}
                alt="Captured Connection Selfie"
                style={{
                  width: "100%",
                  height: "100%",
                  objectFit: "cover",
                }}
              />
            ) : (
              <Webcam
                audio={false}
                ref={webcamRef}
                screenshotFormat="image/jpeg"
                style={{
                  width: "100%",
                  height: "100%",
                  objectFit: "cover",
                }}
              />
            )}
          </Box>
        </Box>
      </Box>

      {/* Bottom Controls */}
      <Box
        sx={{
          bgcolor: "white",
          borderTop: "1px solid #e0e0e0",
          py: 3,
          px: 4,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 2,
        }}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileUpload}
          style={{ display: "none" }}
        />

        {capturedImage ? (
          <Box sx={{ display: "flex", gap: 2, width: "100%", maxWidth: "340px" }}>
            <Button
              onClick={handleRetake}
              disabled={isUploading}
              variant="outlined"
              sx={{
                flex: 1,
                borderColor: "#6B7280",
                color: "#1C1C1E",
                "&:hover": { borderColor: "#1C1C1E" },
              }}
            >
              Retake
            </Button>
            <GlobalButton
              onClick={handleConfirm}
              disabled={isUploading}
              sx={{ flex: 1 }}
            >
              {isUploading ? "Uploading..." : "Confirm"}
            </GlobalButton>
          </Box>
        ) : (
          <Box sx={{ display: "flex", gap: 2, width: "100%", maxWidth: "340px" }}>
            <Button
              onClick={handleUploadClick}
              variant="outlined"
              sx={{
                flex: 1,
                borderColor: "#6B7280",
                color: "#1C1C1E",
                "&:hover": { borderColor: "#1C1C1E" },
              }}
            >
              <CloudUpload sx={{ fontSize: 16, mr: 1 }} />
              Upload
            </Button>
            <GlobalButton
              onClick={capture}
              sx={{ flex: 1 }}
            >
              Capture
            </GlobalButton>
          </Box>
        )}
      </Box>
    </Box>
  );
};

export default ConnectionSelfieScreen;
