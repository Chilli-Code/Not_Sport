'use client'; // Debe ser la primera línea del archivo

import React, { useState } from 'react';
import 'boxicons/css/boxicons.min.css';
import { AnimatePresence, motion } from "framer-motion";
import { useUser,  } from "./UserContext";
import Image from "next/image";

const AdminHeader = () => {
    const { username, avatar } = useUser();

    const [isHovered, setIsHovered] = useState(false);

    return (
        <div className=" flex items-center justify-end py-3">
            {/* Sección de perfil de usuario */}
            <div className="flex items-center justify-center gap-4 cursor-pointer relative">
                {/* Nombre y Contenido */}
                <div className="flex flex-col items-start justify-start gap-1">
                    <h2 className="text-lg font-bold text-textPrimary capitalize">{username}</h2>
                    <div className="flex items-center justify-center gap-2">
                        <div className="w-6 h-6 rounded-full flex items-center justify-center bg-secondary border-2 border-gray-600">
                            <i className="bx bx-dollar text-sm text-heroSecondary"></i>
                        </div>
                        <div>
                            <p className="text-lg font-semibold text-heroSecondary">1</p>
                        </div>
                    </div>
                </div>

                {/* Contenedor Imagen */}
                <div
                    className="w-16 h-16 rounded-full p-1 flex items-center justify-center relative bg-gradient-to-b from-heroSecondary"
                    onMouseEnter={() => setIsHovered(true)}
                >
                    <Image
                        src={avatar}
                        alt="avatar"
                        width={64}
                        height={64}
                        className="w-full h-full object-cover rounded-full"
                    />

                    <div className="w-4 h-4 rounded-full bg-secondary absolute bottom-1 right-0 flex items-center justify-center border border-gray-600">
                        <i className="bx bx-chevron-down text-[15px] text-textSecondary"></i>
                    </div>
                </div>

                {/* Dropdown */}
                <AnimatePresence>
                    {isHovered && (
                        <motion.div
                            initial={{ opacity: 0.5, y: 50 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0.5, y: 50 }}
                            className="absolute top-20 right-0 bg-secondary shadow-md flex flex-col items-start justify-start w-64 px-3 py-2 gap-4 rounded-md z-50"
                            onMouseLeave={() => setIsHovered(false)}
                        >
                            <p className="py-2 px-1 font-semibold hover:text-heroSecondary">
                                Mi Perfil
                            </p>
                            <p className="py-2 px-1 font-semibold hover:text-heroSecondary">
                                Favoritos
                            </p>
                            <button
                                type="button"
                                className="px-4 py-2 w-full rounded-md bg-textPrimary text-primary active:scale-95 transition-all ease-in-out duration-150"
                            >
                                Salir
                            </button>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
};

export default AdminHeader;
