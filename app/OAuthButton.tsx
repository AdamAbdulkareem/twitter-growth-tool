"use client";
import React from "react";

const OAuthButton = () => {
    const handleLogin = () => {
        window.location.href = "http://localhost:5001/auth/twitter";
    };
    return (
        <button onClick={handleLogin} className="OAuth-btn">Login with Twitter</button>
    );
}

export default OAuthButton;