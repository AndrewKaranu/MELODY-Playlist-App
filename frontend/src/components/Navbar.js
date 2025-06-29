import { Link } from 'react-router-dom'
import React, { useEffect, useState } from 'react';
import axios from 'axios';
import './styles/Navbar.css';

const Navbar = () => {
    const [link, setLink] = useState('/'); // Default link to login

    useEffect(() => {

        const fetchUser = async () => {
            try {
                const response = await axios.get('http://localhost:4000/api/auth/current-user', { withCredentials: true });

                if (response.data.accessToken != null) {
                    setLink('/dashboard'); // Link to dashboard if user is logged in
                }
                else {
                    setLink('/'); // Default link if user is not authenticated
                }
            } catch (error) {
                console.error('Error fetching user:', error);
                setLink('/'); // Set link to home if there's an error
            }
        };

        fetchUser();
    }, []);

    return (
        <header>
            <Link to="/Features">
                <h1>Features</h1>
            </Link>

            <div className="logo">
                <Link to={link}>
                    <h1>MELODY</h1>
                </Link>
            </div>

            <Link to="/Support">
                <h1>Support</h1>
            </Link>
        </header>
    )
}

export default Navbar