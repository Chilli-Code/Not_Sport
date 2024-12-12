"use client";

import React, { useState } from "react";
import Link from "next/link";
import { ClientMenus } from "../app/Helpers";
import ClientListMenuItem from "./ClientListMenuItem";

const LeftContainer = () => {
  const [isClose, setIsClose] = useState(true);
  return (
    <div className="relative col-span-4 flex lg:flex bg-transparent items-center lg:md-2 justify-center w-auto h-screen">
      <div
        className={`${
          isClose ? "w-20 px-3" : "w-60 px-6"
        }  py-3 relative left-0 bg-third border-r border-secondary h-screen duration-200 flex flex-col items-start justify-start`}
      >
        {/* Encabezado del menú */}
        <div className="w-full flex items-center justify-between gap-2">
          {/* Logo */}
          <div className="flex items-center">
            <Link href="/">
              <img
                src="/assets/logo.png"
                loading="lazy"
                alt="Logo"
                className="w-12 min-w-[48px] object-contain h-auto block float-left mr-5"
              />
            </Link>
            <p
              className={`text-textPrimary font-extrabold uppercase tracking-[5px] ${
                isClose && "scale-0"
              } duration-200`}
            >
              Goalix <span className="text-heroSecondary block">Not Bet</span>
            </p>
          </div>

          {/* Botón para colapsar */}
          <div
            className="absolute -right-3 px-1 py-4 bg-gradient-to-br from-heroSecondary to-heroSecondary rounded-md cursor-pointer"
            onClick={() => setIsClose(!isClose)}
          >
            <i
              className={`bx bx-chevron-right text-xl text-white duration-200 ${
                !isClose && "rotate-[540deg]"
              }`}
            ></i>
          </div>
        </div>

        {/* Opciones del menú */}
        <ul className={`pt-2 w-full ${!isClose && "px-4"}`}></ul>
        {ClientMenus.map((menu, index) => (
          <React.Fragment key={index}>
            <ClientListMenuItem menu={menu} isClose={isClose} />
          </React.Fragment>
        ))}
        {/* Información adicional */}
        <div className="w-full h-max px-4 py-3 border-t border-secondary mt-auto overflow-x-hidden">
          <h4 className="text-sm text-heroSecondary font-bold">INFORMACION</h4>
          <div className="flex flex-col gap-2 mt-2">
            <p className="text-sm text-textPrimary cursor-pointer hover:text-heroSecondary">
              Es Importante aclarar que no formamos parte de Baloa
            </p>
            <p className="text-sm text-textPrimary cursor-pointer hover:text-heroSecondary">
              Pero ofrecemos servicios adicionales que ellos no pueden cubrir
            </p>
            <p className="text-sm text-textPrimary cursor-pointer hover:text-heroSecondary">
              Privacy Policy
            </p>
            <p className="text-sm text-textPrimary cursor-pointer hover:text-heroSecondary">
              Terms and Conditions
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LeftContainer;
