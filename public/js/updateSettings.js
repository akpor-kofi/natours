/* eslint-disable */
// update Data
import axios from "axios";
import { showAlert } from "./alert";

// type is either 'password' or 'data'
export const updateSettings = async (data, type) => {
  try {
    const url = `/api/v1/users/${type === 'data' ? 'updateMe' : 'updateMyPassword'}`
    const res = await axios({
      method: 'PATCH',
      url,
      data,
    })

    // console.log(res);
    if (res.data.status === 'success') {
      showAlert('success', `${type.toUpperCase()} update successful`);
    }
  } catch (err) {
    // console.log(err);
    showAlert('error', err.response.data.message);
  }

}