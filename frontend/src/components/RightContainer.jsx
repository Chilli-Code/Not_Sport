import React from "react";
import Header from "./Header";
import Home from "./Home";

const RightContainer = () => {
    return(
        <div className="flex-1">
            <section className="w-full min-h-[calc(100vh-70px)]">
                <Header />
                <Home/>
            </section>
            
        </div>
    );

};

export default RightContainer;