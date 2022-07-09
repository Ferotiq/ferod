import "./NavBar.scss";
import { Link } from "react-router-dom";

function NavBar() {
  return (
    <div className="navbar">
      <div className="navbar-logo">
        <img src="../../static/logo.png" alt="Dashboard Logo" />
      </div>

      <div className="navbar-item">
        <Link to="/home" className="navbar-link">
          Home
        </Link>
      </div>
    </div>
  );
}

export default NavBar;
