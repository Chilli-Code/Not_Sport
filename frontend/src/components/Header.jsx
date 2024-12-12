"use client";
import React from "react";
import AdminHeader from "./admin/AdminHeader";
import { useSearch } from "./admin/SearchContext"; // Importar el hook personalizado

const Header = () => {
  const { searchTerm, setSearchTerm } = useSearch(); // Usar el contexto

  return (
    <div className="w-full flex items-center justify-between bg-third pl-6">
      <img
        src="/assets/rewards.png"
        alt=""
        className="w-64 hidden lg:block h-auto object-cover"
      />

      <div className="flex items-center justify-center bg-[#2a2a2a] rounded-full shadow-lg px-4 py-3">
        <input
          type="text"
          placeholder="Buscar cancha 🏟️"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)} // Actualizar el término de búsqueda
          className="bg-transparent outline-none border-none text-base font-medium text-textSecondary placeholder:text-textPrimary tracking-wide lg:w-64 2xl:w-96"
        />
      </div>

      <AdminHeader />
    </div>
  );
};

export default Header;
