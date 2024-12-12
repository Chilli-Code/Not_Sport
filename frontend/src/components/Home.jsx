"use client";
import React, { useState } from "react";
import { useSearch } from "./admin/SearchContext";
import Banner from "./Banner";
import Image from "next/image";
import ChatContainer from "./ChatContainer";
import { listcanchas } from "../app/Helpers";
import ModalClient from "./admin/ModalClient";

const Home = () => {
  const [selectedCancha, setSelectedCancha] = useState(null);
  const [formData, setFormData] = useState({
    fecha: "",
    hora: "",
    equipos: "",
    descripcion: "",
  });
  const [errors, setErrors] = useState({
    fecha: "",
    hora: "",
  });
  const { searchTerm } = useSearch();

  const isFormComplete =
    formData.fecha &&
    formData.hora &&
    formData.equipos &&
    !errors.fecha &&
    !errors.hora;

  const handleInputChange = (e) => {
    const { name, value } = e.target;

    if (name === "fecha") {
      const regexFecha = /^\d{4}-\d{2}-\d{2}$/; // Formato YYYY-MM-DD
      if (!regexFecha.test(value)) {
        setErrors((prev) => ({
          ...prev,
          fecha: "El formato debe ser Día-Mes-Año (ej. 25-12-2023).",
        }));
      } else {
        setErrors((prev) => ({ ...prev, fecha: "" }));
        const [year, month, day] = value.split("-");
        setFormData((prev) => ({
          ...prev,
          fecha: `${day}-${month}-${year}`,
        }));
      }
    } else {
      // Actualiza el estado directamente para otros campos
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const filteredCanchas = listcanchas[0].canchas.filter((cancha) =>
    cancha.nombre.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleInfoClick = (index) => {
    setSelectedCancha(filteredCanchas[index]);
  };

  const closeModal = () => {
    setSelectedCancha(null);
    setFormData({ fecha: "", hora: "", equipos: "", descripcion: "" });
    setErrors({ fecha: "", hora: "" });
  };

  const handleWhatsAppClick = () => {
    const username = localStorage.getItem("username") || "Usuario desconocido";
    const cancha = selectedCancha?.nombre || "Cancha";
    const message = `
    🌟 Soy *${username}*, estoy interesado en un partido de la Cancha *${cancha}*.
    📅 *Fecha del partido*: ${formData.fecha}
    ⏰ *Hora del partido*: ${formData.hora}
    ⚽ *Equipos:* ${formData.equipos}
    📝 *Descripción*: ${formData.descripcion || "No especificada"}
    `.trim();
    const encodedMessage = encodeURIComponent(message);
    const phoneNumber = "+573146318832";
    const whatsappURL = `https://wa.me/${phoneNumber}?text=${encodedMessage}`;

    window.open(whatsappURL, "_blank");
  };

  return (
    <div className="w-full h-full grid grid-cols-1 lg:grid-cols-12 gap-4 px-6 py-4">
      <div className="col-span-12 lg:col-span-8 overflow-y-scroll scrollbar-none">
        <Banner />
        <div className="w-full grid grid-cols-2 lg:grid-cols-4 2xl:grid-cols-6 gap-4 py-4 my-6">
          {filteredCanchas.map((cancha, index) => (
            <div
              key={index}
              className="duration-200 w-full rounded-md overflow-hidden relative group border border-secondary"
            >
              <Image
                width={300}
                height={200}
                src={cancha.imagen}
                alt={cancha.nombre}
                className="w-full h-44 object-cover duration-200"
              />
              <div className="absolute inset-0 bg-[rgba(0,0,0,0.8)] opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-between px-2 py-4 z-10">
                <div className="w-full flex items-center justify-between">
                  <div className="flex items-center justify-center gap-2">
                    <i className="bx bxs-star text-heroSecondary text-base"></i>
                    <p className="text-sm 2xl:text-base text-white">
                      {cancha.nombre}
                    </p>
                  </div>
                  <i
                    className="bx bx-info-circle text-heroSecondary cursor-pointer text-xl hover:scale-125 transition-all"
                    onClick={() => handleInfoClick(index)}
                  ></i>
                </div>
                <div className="w-full flex flex-col items-start justify-start gap-2">
                  <p className="text-sm 2xl:text-base text-[rgba(255,255,255,0.8)]">
                    {cancha.infoDetalles}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
      <div className="col-span-4 h-full hidden lg:flex items-center justify-center">
        <ChatContainer />
      </div>
      {selectedCancha && (
        <ModalClient
          cancha={selectedCancha}
          formData={formData}
          errors={errors}
          isFormComplete={isFormComplete}
          onInputChange={handleInputChange}
          onClose={closeModal}
          onSend={handleWhatsAppClick}
        />
      )}
    </div>
  );
};

export default Home;
