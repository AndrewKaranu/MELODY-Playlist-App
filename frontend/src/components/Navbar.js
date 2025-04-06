import { Link } from 'react-router-dom'
import './styles/Navbar.css';

const Navbar = () => {
return (
    <header>
       
        <Link to = "/Features">
            <h1>Features</h1>
        </Link>
        <div className="logo">
        <Link to = "/">
            <h1>MELODY</h1>
        </Link>
        </div>
        <Link to = "/Support">
        <h1>Support</h1>
        </Link>
        
    </header>
)
}

export default Navbar