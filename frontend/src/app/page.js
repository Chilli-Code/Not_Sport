import Image from "next/image";
import AdminLayout  from "../Layouts/AdminLayout";
import AdminHeader from "../components/admin/AdminHeader";
import AdminHome from "../components/admin/AdminHome";
import Layout from "../Layouts/Layout";
import { SearchProvider } from "../components/admin/SearchContext";
import { UserProvider  } from "../components/admin/UserContext";

export default function Home({children}) {
  return (
    <div className="w-screen h-auto flex flex-col items-center justify-start px-4 py-0">
      <SearchProvider>
      <UserProvider>
        {children}
      {/* <AdminHeader /> */}
      {/* <AdminHome /> */}
      <Layout />
      {/* <AdminLayout /> */}
      </UserProvider>
      </SearchProvider>
    </div>
  );
}






