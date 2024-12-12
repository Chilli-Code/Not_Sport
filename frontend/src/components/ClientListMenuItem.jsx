import React, {useState} from "react";

const ClientListMenuItem = ({ menu, isClose }) => {
    return (
        <React.Fragment>
            <li
                className={`group flex items-center gap-x-4 cursor-pointer p-2 px-3 bg-primary
                hover:bg-[#282828] hover:shadow-lg rounded-md w-full ${
                    menu.spacing ? "mt-12" : "mt-8"
                    // menu.spacing ? "mt-12" : "mt-4"
                }`}
            >
                {/* Ícono */}
                <span className={`w-8 h-8 flex items-center justify-center rounded-full bg-third group-hover:bg-gradient-to-br group-hover:from-heroSecondary group-hover:to-heroSecondary 
                    `}>
                    <i
                    className={`${menu.Icon} text-xl block float-left text-textPrimary hover:text-textSecondary`}
                    ></i>
                </span>

                {/* Texto del menú */}
                <span
                    className={`${
                        isClose ? "hidden" : "inline-block"
                    } text-textPrimary group-hover:text-textSecondary text-base font-medium flex-1 duration-200`}
                >
                    {menu.title}
                </span>
            </li>
        </React.Fragment>
    );
};

export default ClientListMenuItem;
