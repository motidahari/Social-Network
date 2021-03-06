import React, { Fragment, useState } from 'react'
import { Link } from 'react-router-dom'
import axios from 'axios'

const Register = () => {
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
        password2: ''
    });

    const { name, email, password, password2 } = formData;

    const onChange = (e) => {
        console.log("change input " + e.target.name + " to val => " + e.target.value);
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const onSubmit = async (e) => {
        console.log("onSubmit");
        e.preventDefault();
        if (password !== password2) {
            console.log("Password do not match");
        } else {
            const newUser = {
                name,
                email,
                password
            }

            try {
                const config = {
                    headers: {
                        'Content-Type': 'application/json',
                    }
                }
                const body = JSON.stringify(newUser);
                const res = await axios.post('/api/users', body, config);
                console.log(res.data);
            } catch (err) {
                console.error(err.response.data);
                console.error("canot send");
                console.log("canot send");
            }
            console.log(formData);
        }
    }
    return (
        <Fragment>
            <h1 className="large text-primary">Sign Up</h1>
            <p className="lead"><i className="fas fa-user"></i> Create Your Account</p>
            <form className="form" onSubmit={e => onSubmit(e)}>
                <div className="form-group">
                    <input type="text"
                        placeholder="Name"
                        name="name"
                        onChange={e => onChange(e)}
                        value={name}
                        required />
                </div>
                <div className="form-group">
                    <input type="email"
                        placeholder="Email Address"
                        name="email"
                        value={email}
                        onChange={e => onChange(e)}
                        required
                    />
                    <small className="form-text"
                    >This site uses Gravatar so if you want a profile image, use a
                        Gravatar email</small
                    >
                </div>
                <div className="form-group">
                    <input
                        type="password"
                        placeholder="Password"
                        name="password"
                        minLength="6"
                        value={password}
                        onChange={e => onChange(e)}
                    />
                </div>
                <div className="form-group">
                    <input
                        type="password"
                        placeholder="Confirm Password"
                        name="password2"
                        minLength="6"
                        onChange={e => onChange(e)}
                        value={password2}
                    />
                </div>
                <input type="submit" className="btn btn-primary" value="Register" />
            </form>
            <p className="my-1">
                Already have an account? <Link to="/login">Sign In</Link>
            </p>
        </Fragment>

    )
}
export default Register;

