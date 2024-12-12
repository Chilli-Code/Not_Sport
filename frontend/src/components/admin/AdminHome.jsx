import React from "react";

const AdminHome = () => {
    return(
        <div className="w-full h-auto flex flex-col items-center justify-start px-4 py-4">
            <div className="w-full h-auto flex flex-col items-center justify-start px-4 py-4 gap-5">
            <ul>
                <li>Home</li>
                <li>App</li>
                <li>User</li>
            </ul>
            <i className='bx bx-home-alt' ></i>
            </div>
        </div>
    );
}

export default AdminHome;