import { notify } from "components/Lottery/util";
import { notifyTop } from '../../components/Lottery/util';
import { store } from "react-notifications-component";

export const errorNotification = async (error: Error, isTop?: boolean) => {
  
  if (isTop) {
    notifyTop('error', error.message);
  } else {
    notify('error', error.message);
  }
  // store.addNotification({
  //   title: "Error",
  //   message: error.message,
  //   type: "danger",
  //   insert: "top",
  //   container: "top-center",
  //   animationIn: ["animate__animated", "animate__fadeIn"],
  //   animationOut: ["animate__animated", "animate__fadeOut"],
  // });
  return null;
}

export const successNotification = async (message: string, isTop?: boolean) => {

  if (isTop) {
    notifyTop('success', message);
  } else {
    notify('success', message);
  }
  // store.addNotification({
  //   title: "Success",
  //   message: message,
  //   type: "success",
  //   insert: "bottom",
  //   container: "bottom-left",
  //   animationIn: ["animate__animated", "animate__fadeIn"],
  //   animationOut: ["animate__animated", "animate__fadeOut"],
  //   dismiss: {
  //     duration: 3000,
  //     onScreen: true,
  //   },
  // });
  return null;
}