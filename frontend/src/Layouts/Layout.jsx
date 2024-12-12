import React from "react";
import LeftContainer from "../components/LeftContainer";
import RightContainer from "../components/RightContainer";
import { UserProvider } from "../components/admin/UserContext";

const Layout = ({children}) => {
    return(
        <main className=" px-0 py-0 absolute w-screen min-h-screen h-screen flex items-start justify-start overflow-y-hidden">

            <LeftContainer />

            <RightContainer />
        </main>
    );
};

export default Layout;