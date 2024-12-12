"use client";

import React from "react";
import CanchaHorariosChart from "../GraficH";

const ModalClient = ({
  cancha,
  formData,
  errors,
  isFormComplete,
  onInputChange,
  onClose,
  onSend,
}) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-[#222222] h-auto w-[600px] p-4 rounded-lg text-center">
        <CanchaHorariosChart cancha={cancha} />
        <div className="h-auto w-full my-5">
          <h2 className="text-heroSecondary font-bold mb-3">
            Completa la información del partido
          </h2>
          <form className="flex flex-col gap-4">
            {/* Campo para la fecha */}
            <div>
              <input
                type="date"
                name="fecha"
                value={
                  formData.fecha
                    ? formData.fecha.split("-").reverse().join("-")
                    : ""
                }
                onChange={onInputChange}
                placeholder="Fecha del partido (DD-MM-YYYY)"
                className="p-2 rounded border border-gray-500 bg-gray-800 text-white"
              />
              {errors.fecha && (
                <p className="text-red-500 text-sm">{errors.fecha}</p>
              )}
            </div>

            {/* Campo para la hora */}
            <div className="flex items-center flex-col text-white ">
              <label>Fecha Del Partido</label>
              <input
                type="time"
                name="hora"
                value={formData.hora || ""}
                onChange={onInputChange}
                placeholder="Hora (hh:mm)"
                className="p-2 rounded border border-gray-500 bg-gray-800 text-white w-auto"
              />
              {errors.hora && (
                <p className="text-red-500 text-sm">{errors.hora}</p>
              )}
            </div>

            {/* Campo para los equipos */}
            <input
              type="text"
              name="equipos"
              value={formData.equipos}
              onChange={onInputChange}
              placeholder="Colores De equipos(ej: Blanco VS Negro)"
              className="p-2 rounded border border-gray-500 bg-gray-800 text-white"
            />

            {/* Campo para la descripción */}
            <textarea
              name="descripcion"
              value={formData.descripcion}
              onChange={onInputChange}
              placeholder="Descripción (opcional)"
              className="p-2 rounded border border-gray-500 bg-gray-800 text-white"
            ></textarea>
          </form>

          {/* Botón para contactar */}
          <div className="mt-5">
            <button
              onClick={onSend}
              disabled={!isFormComplete}
              className={`bg-green-950 text-green-400 border border-green-400 border-b-4 font-medium overflow-hidden relative px-4 py-2 rounded-md ${
                isFormComplete
                  ? "hover:brightness-150 hover:border-t-4 hover:border-b active:opacity-75"
                  : "cursor-not-allowed opacity-50"
              } outline-none duration-300`}
            >
              <span className="bg-green-400 shadow-green-400 absolute -top-[150%] left-0 inline-flex w-80 h-[5px] rounded-md opacity-50 group-hover:top-[150%] duration-500 shadow-[0_0_10px_10px_rgba(0,0,0,0.3)]"></span>
              Contactar <i className="bx bxs-send top-[3px] relative"></i>
            </button>
          </div>
        </div>

        {/* Botón para cerrar */}
        <button
          className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition"
          onClick={onClose}
        >
          Cerrar
        </button>
      </div>
    </div>
  );
};

export default ModalClient;
