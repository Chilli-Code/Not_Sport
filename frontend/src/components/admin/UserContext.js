"use client";
import React, { createContext, useContext, useState, useEffect } from "react";

// Lista de avatares
const avatars = [
  "/assets/avatar1.jpeg",
  "/assets/avatar2.jpeg",
  "/assets/avatar3.avif",
  "/assets/avatar4.avif",
  "/assets/avatar5.avif",
];

// Fallback para avatar
const defaultAvatar = "/assets/avatar1.jpeg";

// Crear el contexto
const UserContext = createContext();

// Proveedor del contexto
export const UserProvider = ({ children }) => {
  const [username, setUsername] = useState("");
  const [avatar, setAvatar] = useState(defaultAvatar); // Inicia con el avatar por defecto

  useEffect(() => {
    // Recuperar o generar username
    const storedUsername = localStorage.getItem("username");
    if (storedUsername) {
      setUsername(storedUsername);
    } else {
      const generatedUsername = `User-${Math.floor(Math.random() * 10000)}`;
      localStorage.setItem("username", generatedUsername);
      setUsername(generatedUsername);
    }

    // Recuperar o generar avatar
    const storedAvatar = localStorage.getItem("avatar");
    if (storedAvatar) {
      setAvatar(storedAvatar);
    } else {
      const generatedAvatar = avatars[Math.floor(Math.random() * avatars.length)];
      localStorage.setItem("avatar", generatedAvatar);
      setAvatar(generatedAvatar);
    }
  }, []);

  return (
    <UserContext.Provider value={{ username, avatar }}>
      {children}
    </UserContext.Provider>
  );
};

// Hook personalizado para usar el contexto
export const useUser = () => {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error("useUser debe ser usado dentro de un UserProvider");
  }
  return context;
};
