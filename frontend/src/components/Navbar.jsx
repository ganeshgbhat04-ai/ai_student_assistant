function Navbar() {
  const logout = () => {
    localStorage.removeItem("token");
    window.location.href = "/login";
  };

  return (
    <div className="bg-white shadow-md p-5 flex justify-between items-center rounded-b-xl">
      <h1 className="text-2xl font-bold">
        Dashboard
      </h1>

      <button
        onClick={logout}
        className="bg-red-500 text-white px-4 py-2 rounded"
      >
        Logout
      </button>
    </div>
  );
}

export default Navbar;