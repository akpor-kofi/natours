/* eslint-disable */
import axios from "axios";
import {showAlert} from "./alert";

export const login = async (email, password) => {
  // alert(email + password);
  // const res = await fetch('http://localhost:3000/api/v1/users/login', {
  //   method: 'POST',
  //   headers: {
  //     'Content-Type': 'application/json',
  //   },
  //   body: JSON.stringify({
  //     email,
  //     password
  //   }),
  // })
  //
  // const data = await res.json();
  // // console.log(data);
  try {
    const res = await axios({
      method: 'POST',
      url: '/api/v1/users/login',
      data: {
        email,
        password
      }
    })

    if (res.data.status === 'success') {
      showAlert('success', 'logged in successfully');
      setTimeout(() => {
        location.assign('/');
      }, 1500)
    }

  } catch (err) {
    showAlert('error', err.response.data.message);
  }


}

export const logout = async () => {
  try{
    const res = await axios ({
      method: 'GET',
      url: '/api/v1/users/logout'
    });

    if (res.data.status === 'success') {
      // showAlert('success', 'logged out successfully');
      location.reload(true);
    }
  } catch(err) {
    showAlert('error', 'error logging out, try again')
  }
}



