/* eslint-disable */
import '@babel/polyfill';
import {displayMap as dm} from "./mapbox";
import {login, logout} from './login';
import {updateSettings} from "./updateSettings";
import {bookTour} from "./stripe";

const mapBox = document.getElementById('map');
const loginForm = document.querySelector('.form--login');
const logoutBtn = document.querySelector('.nav__el--logout');
const updateDataForm = document.querySelector('.form-user-data');
const updatePasswordForm = document.querySelector('.form-user-settings');
const bookBtn = document.getElementById('book-tour');


if(mapBox) {
  const locations = JSON.parse(document.getElementById('map')?.dataset.locations);
  dm(locations);
}



if (loginForm) {
  loginForm.addEventListener('submit', async(e) => {
    e.preventDefault();
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;

    await login(email, password);

  })
}

if (logoutBtn) logoutBtn.addEventListener('click', logout);

if (updateDataForm) {
  updateDataForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const form = new FormData(); // multipart form data
    form.append('name', document.getElementById('name').value);
    form.append('email', document.getElementById('email').value);
    form.append('photo', document.getElementById('photo').files[0]);

    await updateSettings(form, 'data')
  })
}

if (updatePasswordForm) {
  updatePasswordForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    document.querySelector('.btn--save-password').textContext = 'Updating...';
    console.log('start');
    const passwordCurrent = document.getElementById('password-current').value;
    const password = document.getElementById('password').value;
    const passwordConfirm = document.getElementById('password-confirm').value;
    await updateSettings({passwordCurrent, password, passwordConfirm}, 'password');

    // clearing form field
    console.log('stop');
    document.querySelector('.btn--save-password').textContext = 'Save password';
    document.getElementById('password-current').value = '';
    document.getElementById('password').value = '';
    document.getElementById('password-confirm').value = '';
  })
}

if (bookBtn) {
  bookBtn.addEventListener('click', async (e) => {
    e.target.textContent = 'Processing...';
    const {tourId} = e.target.dataset;
    await bookTour(tourId)
  })
}
