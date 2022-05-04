/* eslint-disable */

import axios from "axios";
import { showAlert } from "./alert";

const stripe = Stripe(
  'pk_test_51KvKiOFoV9coXQx6nPtHRhqogOy6xs1xgF5H5I6uW20lZPooGBRuT5xxquCgGDveLGWeLzgI2LthD4Cudw9ZERn700J8UyfwRi'
);

export const bookTour = async tourId => {
  try {
    const session = await axios({
      method: 'GET',
      url: `/api/v1/bookings/checkout-session/${tourId}`,
    })

    // console.log(session);

    // create checkout form + charge credit cards
    await stripe.redirectToCheckout({ sessionId: session.data.session.id});
  } catch(err) {
  // console.log(err);
  showAlert('error', err);
  }

}
