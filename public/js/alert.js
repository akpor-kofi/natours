/* eslint-disable */

// type is success or error
export const hideAlert = () => {
  const el = document.querySelector('.alert');
  if (el) el.parentElement.removeChild(el);
}
export const showAlert = (type, msg) => {
  hideAlert();
  console.log('hit here', type);
  const markup = `<div class="alert alert--${type}">${msg}</div>`;
  document.querySelector('body').insertAdjacentHTML('afterbegin', markup);

  setTimeout(() => hideAlert(), 1500);
}